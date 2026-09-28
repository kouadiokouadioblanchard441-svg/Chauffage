import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { registerSchema, loginSchema, depositSchema, walletSchema, phoneNumberSchema } from "@shared/schema";
import { getWithdrawalMethods, isAllowedWithdrawalMethod } from "@shared/withdrawal-methods";
import { z } from "zod";
import ConnectPgSimple from "connect-pg-simple";
import { 
  initiatePayment, 
  verifyPayment, 
  isSoleaspaySupported, 
  mapSoleaspayStatus,
  SOLEASPAY_SERVICE_MAP,
  validateSoleaspayConfig,
} from "./soleaspay";
import {
  createPayment as sendavapayCreate,
  initiatePayment as sendavapayInitiate,
  submitOtp as sendavapaySubmitOtp,
  retryPayment as sendavapayRetry,
  verifyPayment as sendavapayVerify,
  verifyWebhookSignature as sendavapayVerifySignature,
  mapSendavapayStatus,
  formatPhone as sendavapayFormatPhone,
  getCurrency as sendavapayGetCurrency,
  getSendavapayApiBaseUrl,
  toSendavapayCountry,
} from "./sendavapay";
import {
  buildPaymentUrl as westpayBuildUrl,
  verifyWebhookSignature as westpayVerifySignature,
  transfer as westpayTransfer,
  formatMsisdn as westpayFormatMsisdn,
  validateWestpayConfig,
} from "./westpay";
import {
  createPayin as inpayCreatePayin,
  createPayout as inpayCreatePayout,
  createOutTradeNo as inpayCreateOutTradeNo,
  findVerifiedAccount as inpayFindVerifiedAccount,
  getBalance as inpayGetBalance,
  getInpayAccount,
  getInpayEnabledCountries,
  getCountryName as inpayGetCountryName,
  isInpayConfigured,
  isInpayCountryEnabled,
  mapPayinStatus as mapInpayPayinStatus,
  mapPayoutStatus as mapInpayPayoutStatus,
  resolveBankCode as inpayResolveBankCode,
} from "./inpay";
import {
  collectPayment as ashtechCollect,
  getCountries as ashtechGetCountries,
  getTransaction as ashtechGetTransaction,
  isAshtechConfigured,
  mapAshtechStatus,
  AshtechApiError,
  verifyAshtechWebhookSignature,
} from "./ashtechpay";
import {
  checkClapayPayment,
  getClapayOperators,
  initiateClapayPayment,
  isClapayConfigured,
  verifyClapayWebhookSignature,
} from "./clapay";
import {
  formatTelegramValue,
  sendTelegramInpayError,
  sendTelegramMessage,
  sendTelegramSecurityAlert,
} from "./telegram";
import { notifyTelegramPaymentError } from "./telegram-events";
import express from "express";

// --- Brute-force protection (in-memory) ---
const loginAttempts = new Map<string, { count: number; blockedUntil: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getClientKey(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket.remoteAddress || "unknown";
  return ip;
}

function getPublicBaseUrl(req: Request): string {
  const configuredUrl = process.env.PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  if (configuredUrl) return configuredUrl;

  const devDomain = process.env.REPLIT_DEV_DOMAIN?.trim();
  if (devDomain) return `https://${devDomain}`;

  const forwardedProto = String(req.headers["x-forwarded-proto"] || req.protocol)
    .split(",")[0]
    .trim();
  return `${forwardedProto}://${req.get("host")}`;
}

function checkBruteForce(req: Request, res: Response): boolean {
  const key = getClientKey(req);
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (record && record.blockedUntil > now) {
    const minutesLeft = Math.ceil((record.blockedUntil - now) / 60000);
    res.status(429).json({ message: `Trop de tentatives. Réessayez dans ${minutesLeft} minute(s).` });
    return true;
  }
  return false;
}

function recordFailedAttempt(req: Request) {
  const key = getClientKey(req);
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, blockedUntil: 0 };
  record.count += 1;
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    record.count = 0;
    void sendTelegramSecurityAlert(
      key,
      "Trop de tentatives. Réessayez dans 15 minute(s).",
    ).catch((error) => console.error("[telegram] security notification failed:", error.message));
  }
  loginAttempts.set(key, record);
}

function clearFailedAttempts(req: Request) {
  loginAttempts.delete(getClientKey(req));
}

function getBlockedIps(value: string | undefined): string[] {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

const BLOCKED_IP_CACHE_TTL_MS = 15_000;
let blockedIpsCache: { values: string[]; expiresAt: number } | null = null;

async function getCachedBlockedIps(): Promise<string[]> {
  const now = Date.now();
  if (blockedIpsCache && blockedIpsCache.expiresAt > now) {
    return blockedIpsCache.values;
  }

  const values = getBlockedIps(await storage.getSetting("blockedIps"));
  blockedIpsCache = { values, expiresAt: now + BLOCKED_IP_CACHE_TTL_MS };
  return values;
}

function updateBlockedIpsCache(values: string[]) {
  blockedIpsCache = {
    values,
    expiresAt: Date.now() + BLOCKED_IP_CACHE_TTL_MS,
  };
}
// --- end brute-force protection ---

const WITHDRAWAL_PREPAYMENT_RATE = 25;

async function creditApprovedDeposit(deposit: {
  id: number;
  userId: number;
  amount: number;
  withdrawalFeePaymentId?: number | null;
}) {
  const user = await storage.getUser(deposit.userId);
  if (!user) return;

  if (deposit.withdrawalFeePaymentId) {
    await storage.markWithdrawalFeePaymentPaid(deposit.withdrawalFeePaymentId, deposit.id);
    return;
  }

  await storage.updateUser(user.id, {
    balance: (parseFloat(user.balance) + deposit.amount).toFixed(2),
    hasDeposited: true,
  });
  await storage.createTransaction({
    userId: user.id,
    type: "deposit",
    amount: deposit.amount.toString(),
    description: `Dépôt RobotPay #${deposit.id}`,
  });
  await storage.processDepositReferralCommissions(user.id, deposit.amount);
}

async function validateWithdrawalFeePayment(
  userId: number,
  feePaymentId: unknown,
  amount: number,
) {
  const id = Number(feePaymentId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Paiement préalable invalide");
  }
  const payment = await storage.getWithdrawalFeePayment(id);
  if (!payment || payment.userId !== userId) {
    throw new Error("Paiement préalable introuvable");
  }
  if (payment.status === "used") {
    throw new Error("Ce paiement préalable a déjà été utilisé");
  }
  if (payment.requiredAmount !== amount) {
    throw new Error("Le montant payé ne correspond pas à cette obligation de retrait");
  }
  return payment;
}

async function prepareWithdrawalFeePayment(userId: number, withdrawalAmount: number) {
  const requiredAmount = Math.max(1, Math.round(withdrawalAmount * WITHDRAWAL_PREPAYMENT_RATE / 100));
  const existing = await storage.getActiveWithdrawalFeePayment(userId, withdrawalAmount);
  const payment = existing || await storage.createWithdrawalFeePayment({
    userId,
    withdrawalAmount,
    requiredAmount,
    status: "pending",
  });
  return { payment, requiredAmount };
}

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const PgSession = ConnectPgSimple(session);
const sessionDatabaseUrl =
  process.env.SUPABASE_NEW_DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionDatabaseUrl) {
  throw new Error("No database URL configured for session storage.");
}
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be configured.");
}

const SENSITIVE_SETTING_KEYS = new Set([
  "sendavapayWebhookSecret",
  "omnipayCallbackKey",
  "westpayWebhookSecret",
  "ashtechWebhookSecret",
]);
const DEPOSIT_METHOD_IDS = [
  "manual",
  "soleaspay",
  "ashtech",
  "sendavapay",
  "westpay",
  "inpay",
  "clapay",
] as const;
type DepositMethodId = typeof DEPOSIT_METHOD_IDS[number];
const DEPOSIT_METHOD_ID_SET = new Set<string>(DEPOSIT_METHOD_IDS);
const PUBLIC_SETTING_KEYS = new Set([
  "supportLink", "supportType", "supportLabel",
  "support2Link", "support2Type", "support2Label",
  "channelLink", "channelType", "channelLabel", "popupButtonLabel",
  "groupLink", "groupType", "groupLabel", "noticeText",
  "supportEnabled", "support2Enabled", "channelEnabled", "groupEnabled",
  "signupBonus", "minDeposit", "minWithdrawal", "withdrawalFees",
  "maxWithdrawalsPerDay", "withdrawalStartHour", "withdrawalEndHour",
  "withdrawalPrepaymentEnabled",
  "level1Commission", "level2Commission", "level3Commission",
  "sendavapayEnabled", "sendavapayChannelName",
  "soleaspayEnabled", "soleaspayChannelName", "soleaspayCountries",
  "westpayEnabled", "westpayChannelName", "westpayCountries",
  "ashtechEnabled", "ashtechChannelName", "ashtechCountries",
  "inpayEnabled", "inpayChannelName", "inpayCountries",
  "clapayEnabled", "clapayChannelName",
  "depositMethodsByCountry",
]);
const ADMIN_SETTING_KEYS = new Set([
  ...Array.from(PUBLIC_SETTING_KEYS),
]);
const MASKED_SETTING_VALUE = "********";

function isAdminSettingKey(key: string): boolean {
  return ADMIN_SETTING_KEYS.has(key);
}

function parseDepositMethodsByCountry(
  raw: string | undefined,
): Record<string, DepositMethodId[]> | undefined {
  if (!raw?.trim()) return undefined;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("La configuration des méthodes de dépôt par pays est invalide");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("La configuration des méthodes de dépôt par pays doit être un objet JSON");
  }

  const result: Record<string, DepositMethodId[]> = {};
  for (const [rawCountry, rawMethods] of Object.entries(value)) {
    const country = rawCountry.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(country) || !Array.isArray(rawMethods)) {
      throw new Error(`Configuration de dépôt invalide pour le pays ${rawCountry}`);
    }
    const methods = rawMethods.map((method) => String(method).trim().toLowerCase());
    const invalidMethod = methods.find((method) => !DEPOSIT_METHOD_ID_SET.has(method));
    if (invalidMethod) {
      throw new Error(`Méthode de dépôt inconnue : ${invalidMethod}`);
    }
    result[country] = (methods as DepositMethodId[]).filter(
      (method, index, list) => list.indexOf(method) === index,
    );
  }
  return result;
}

function isCountryInSettingsList(
  value: string | undefined,
  country: string,
  emptyMeansAll = false,
): boolean {
  const countries = (value || "")
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);
  return countries.length === 0 ? emptyMeansAll : countries.includes(country.toUpperCase());
}

function isLegacyDepositMethodAssigned(
  method: DepositMethodId,
  country: string,
  settings: Record<string, string>,
): boolean {
  switch (method) {
    case "manual":
      return true;
    case "soleaspay":
      return settings.soleaspayEnabled === "true" &&
        isCountryInSettingsList(settings.soleaspayCountries, country);
    case "ashtech":
      return settings.ashtechEnabled === "true" &&
        isCountryInSettingsList(settings.ashtechCountries, country, true);
    case "sendavapay":
      return settings.sendavapayEnabled === "true";
    case "westpay":
      return settings.westpayEnabled === "true" &&
        isCountryInSettingsList(settings.westpayCountries, country, true);
    case "inpay":
      return settings.inpayEnabled === "true" &&
        isCountryInSettingsList(settings.inpayCountries, country);
    case "clapay":
      // Clapay is deliberately excluded from derived legacy routing. It only
      // becomes available after an administrator saves an explicit country map.
      return false;
  }
}

function getAssignedDepositMethods(
  country: string,
  settings: Record<string, string>,
): DepositMethodId[] {
  const normalizedCountry = country.trim().toUpperCase();
  const explicitRouting = parseDepositMethodsByCountry(settings.depositMethodsByCountry);
  if (explicitRouting) return explicitRouting[normalizedCountry] || [];
  return DEPOSIT_METHOD_IDS.filter((method) =>
    isLegacyDepositMethodAssigned(method, normalizedCountry, settings)
  );
}

function isDepositProviderGloballyEnabled(
  method: DepositMethodId,
  settings: Record<string, string>,
): boolean {
  if (method === "manual") return true;
  const settingKey: Record<Exclude<DepositMethodId, "manual">, string> = {
    soleaspay: "soleaspayEnabled",
    ashtech: "ashtechEnabled",
    sendavapay: "sendavapayEnabled",
    westpay: "westpayEnabled",
    inpay: "inpayEnabled",
    clapay: "clapayEnabled",
  };
  return settings[settingKey[method]] === "true";
}

function isDepositMethodConfigured(
  country: string,
  method: DepositMethodId,
  settings: Record<string, string>,
): boolean {
  const explicitRouting = parseDepositMethodsByCountry(settings.depositMethodsByCountry);
  if (explicitRouting) {
    return (explicitRouting[country.trim().toUpperCase()] || []).includes(method) &&
      isDepositProviderGloballyEnabled(method, settings);
  }
  return getAssignedDepositMethods(country, settings).includes(method) &&
    isDepositProviderGloballyEnabled(method, settings);
}

function getDepositMethodName(
  method: DepositMethodId,
  settings: Record<string, string>,
): string {
  if (method === "manual") return "Paiement manuel";
  const settingKey: Record<Exclude<DepositMethodId, "manual">, string> = {
    soleaspay: "soleaspayChannelName",
    ashtech: "ashtechChannelName",
    sendavapay: "sendavapayChannelName",
    westpay: "westpayChannelName",
    inpay: "inpayChannelName",
    clapay: "clapayChannelName",
  };
  const defaultName: Record<Exclude<DepositMethodId, "manual">, string> = {
    soleaspay: "SoleaPay",
    ashtech: "AshtechPay",
    sendavapay: "SendavaPay",
    westpay: "WestPay",
    inpay: "InPay",
    clapay: "Clapay",
  };
  return settings[settingKey[method]] || defaultName[method];
}

function publicSettings(settings: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(settings).filter(([key]) => PUBLIC_SETTING_KEYS.has(key)),
  );
}

function adminSettings(settings: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(settings)
      .filter(([key]) => isAdminSettingKey(key))
      .map(([key, value]) => [
      key,
      SENSITIVE_SETTING_KEYS.has(key) && value ? MASKED_SETTING_VALUE : value,
      ]),
  );
}

function validatePhone(value: unknown, fieldName: string): string {
  const result = phoneNumberSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`${fieldName} invalide`);
  }
  return result.data;
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "Non authentifié" });
    if (user.isAdmin) return next();
    const activeCountries = await storage.getActiveCountries();
    if (!activeCountries.some(country => country.code === user.country)) {
      req.session.destroy(() => res.status(403).json({ message: "Compte indisponible dans ce pays" }));
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user?.isAdmin) {
    return res.status(403).json({ message: "Accès refusé" });
  }
  next();
}

async function requireBanker(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "Non authentifié" });
    if (!user.isAdmin) {
      const activeCountries = await storage.getActiveCountries();
      if (!activeCountries.some(country => country.code === user.country)) {
        req.session.destroy(() => res.status(403).json({ message: "Compte indisponible dans ce pays" }));
        return;
      }
    }
    if (!user.isAdmin && !user.isBanker) return res.status(403).json({ message: "Accès refusé" });
    next();
  } catch (error) {
    next(error);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Trust proxy for production HTTPS (Replit deployment)
  app.set("trust proxy", 1);

  app.use(
    session({
      store: new PgSession({
        conString: sessionDatabaseUrl,
        tableName: "session",
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 60,
      }),
       secret: sessionSecret as string,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      },
    })
  );

  app.use(async (req, res, next) => {
    try {
      const blockedIps = await getCachedBlockedIps();
      if (blockedIps.includes(getClientKey(req))) {
        return res.status(403).json({ message: "Accès bloqué pour cette adresse IP" });
      }
      next();
    } catch (error) {
      console.error("[security] IP block check failed:", error);
      next();
    }
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      const activeCountries = await storage.getActiveCountries();
      if (!activeCountries.some(country => country.code === data.country)) {
        return res.status(400).json({ message: "Pays indisponible" });
      }
      
      const existing = await storage.getUserByPhone(data.phone, data.country);
      if (existing) {
        return res.status(400).json({ message: "Ce numéro est déjà utilisé" });
      }

      let referredBy: string | undefined;
      if (data.invitationCode && data.invitationCode.trim()) {
        const cleanCode = data.invitationCode.trim().toUpperCase();
        const referrer = await storage.getUserByReferralCode(cleanCode);
        if (!referrer) {
          return res.status(400).json({ message: "Code d'invitation invalide" });
        }
        referredBy = cleanCode;
      }

      const user = await storage.createUser({
        fullName: data.fullName,
        phone: data.phone,
        country: data.country,
        password: data.password,
        referredBy,
      });

      req.session.userId = user.id;
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message || "Erreur serveur" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    if (checkBruteForce(req, res)) return;
    try {
      const data = loginSchema.parse(req.body);
      
      const activeCountries = await storage.getActiveCountries();
      const selectedCountryIsActive = activeCountries.some(
        country => country.code === data.country.toUpperCase(),
      );
      let user = selectedCountryIsActive
        ? await storage.getUserByPhone(data.phone, data.country.toUpperCase())
        : undefined;

      // Administrators may select any country at login. Regular users must
      // still authenticate with the country saved on their account.
      if (!user) {
        const adminCandidate = await storage.getUserByPhoneAnyCountry(data.phone);
        if (adminCandidate?.isAdmin) {
          user = adminCandidate;
        }
      }

      if (!user) {
        recordFailedAttempt(req);
        return res.status(400).json({ message: "Identifiants incorrects" });
      }

      const validPassword = await bcrypt.compare(data.password, user.password);
      if (!validPassword) {
        recordFailedAttempt(req);
        return res.status(400).json({ message: "Identifiants incorrects" });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: "Compte suspendu" });
      }

      clearFailedAttempts(req);
      req.session.userId = user.id;
      if (user.isAdmin) {
        void sendTelegramMessage(
          [
            "🔐 <b>Connexion administrateur</b>",
            `Administrateur : ${formatTelegramValue(user.fullName)}`,
            `Pays : ${formatTelegramValue(user.country)}`,
            `Adresse IP : ${formatTelegramValue(getClientKey(req))}`,
          ].join("\n"),
        ).catch((error) => console.error("[telegram] admin login notification failed:", error.message));
      }
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message || "Erreur serveur" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Non authentifié" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "Non authentifié" });
    }
    res.json({ user: { ...user, password: undefined } });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.post("/api/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Veuillez remplir tous les champs" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 6 caracteres" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouve" });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: "Mot de passe actuel incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { password: hashedPassword });

      res.json({ success: true, message: "Mot de passe modifie avec succes" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Erreur serveur" });
    }
  });

  // Products
  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const products = await storage.getProducts(true);
      const userProductsList = await storage.getUserProducts(req.session.userId!);
      const user = await storage.getUser(req.session.userId!);
      
      const productCounts = new Map<number, number>();
      userProductsList.forEach(up => {
        if (up.isActive) {
          productCounts.set(up.productId, (productCounts.get(up.productId) || 0) + 1);
        }
      });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const canClaimFree = !user?.lastFreeProductClaim || 
        new Date(user.lastFreeProductClaim) < today;

      const productsWithOwnership = products.map(p => ({
        ...p,
        isOwned: productCounts.has(p.id),
        ownedCount: productCounts.get(p.id) || 0,
        canClaimFree: p.isFree && canClaimFree,
      }));

      res.json(productsWithOwnership);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/products/:id/purchase", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Produit non trouvé" });
      }
      
      if (product.isFree) {
        return res.status(400).json({ message: "Utilisez /claim-free pour ce produit" });
      }

      if (!Number.isInteger(product.price) || product.price <= 0) {
        return res.status(400).json({
          message: "Le prix de ce produit doit être supérieur à zéro.",
        });
      }

      const userProduct = await storage.purchaseProduct(req.session.userId!, productId);
      res.json(userProduct);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/products/:id/claim-free", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product || !product.isFree) {
        return res.status(400).json({ message: "Produit non valide" });
      }
      if (!product.isActive) {
        return res.status(400).json({ message: "Produit indisponible" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (user.lastFreeProductClaim && new Date(user.lastFreeProductClaim) >= today) {
        return res.status(400).json({ message: "Déjà réclamé aujourd'hui" });
      }

      const newBalance = parseFloat(user.balance) + product.dailyEarnings;
      await storage.updateUser(user.id, { 
        balance: newBalance.toFixed(2),
        lastFreeProductClaim: new Date(),
      });

      await storage.createTransaction({
        userId: user.id,
        type: "free_claim",
        amount: product.dailyEarnings.toString(),
        description: "Bonus produit gratuit",
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get user's purchased products
  app.get("/api/user/products", requireAuth, async (req, res) => {
    try {
      const userProductsList = await storage.getAllUserProducts(req.session.userId!);
      
      const formattedProducts = userProductsList.map(up => ({
        id: up.userProduct.id,
        productId: up.userProduct.productId,
        purchasedAt: up.userProduct.purchaseDate,
        daysRemaining: up.userProduct.daysRemaining,
        totalEarned: up.userProduct.totalEarned,
        status: up.userProduct.isActive ? 'active' : 'completed',
        product: up.product
      }));
      
      res.json(formattedProducts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Collect earnings for user (manual trigger)
  app.post("/api/user/collect-earnings", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Non authentifie" });
      }

      const userProductsList = await storage.getAllUserProducts(userId);
      const now = new Date();
      let totalCollected = 0;
      let productsCollected = 0;

      for (const { userProduct, product } of userProductsList) {
        try {
          if (!userProduct.isActive || userProduct.daysRemaining <= 0) continue;

          const purchaseDate = userProduct.purchaseDate ? new Date(userProduct.purchaseDate) : null;
          if (!purchaseDate) continue;

          const lastEarning = userProduct.lastEarningDate ? new Date(userProduct.lastEarningDate) : purchaseDate;

          const msSincePurchase = now.getTime() - purchaseDate.getTime();
          const daysSincePurchase = Math.floor(msSincePurchase / (24 * 60 * 60 * 1000));

          const msSinceLastEarning = now.getTime() - lastEarning.getTime();
          const cyclesSinceLastEarning = Math.floor(msSinceLastEarning / (24 * 60 * 60 * 1000));

          if (cyclesSinceLastEarning >= 1 && daysSincePurchase >= 1) {
            const cyclesToCredit = Math.min(cyclesSinceLastEarning, userProduct.daysRemaining);
            const earningsPerCycle = product.dailyEarnings;
            const totalEarningsForProduct = earningsPerCycle * cyclesToCredit;

            const newLastEarningDate = new Date(lastEarning.getTime() + (cyclesToCredit * 24 * 60 * 60 * 1000));

            totalCollected += totalEarningsForProduct;
            productsCollected++;

            const newDaysRemaining = userProduct.daysRemaining - cyclesToCredit;
            const updateData: any = {
              lastEarningDate: newLastEarningDate,
              daysRemaining: newDaysRemaining,
              totalEarned: (parseFloat(userProduct.totalEarned || "0") + totalEarningsForProduct).toFixed(2),
            };
            
            if (newDaysRemaining <= 0) {
              updateData.isActive = false;
            }

            await storage.updateUserProduct(userProduct.id, updateData);

            for (let i = 0; i < cyclesToCredit; i++) {
              await storage.createTransaction({
                userId,
                type: "earning",
                amount: earningsPerCycle.toString(),
                description: `Gains ${product.name}`,
              });
            }
          }
        } catch (productError) {
          console.error(`Error processing product ${userProduct.id}:`, productError);
        }
      }

      if (totalCollected > 0) {
        const freshUser = await storage.getUser(userId);
        if (freshUser) {
          const newBalance = parseFloat(freshUser.balance || "0") + totalCollected;
          const newTodayEarnings = parseFloat(freshUser.todayEarnings || "0") + totalCollected;
          const newTotalEarnings = parseFloat(freshUser.totalEarnings || "0") + totalCollected;

          await storage.updateUser(userId, {
            balance: newBalance.toFixed(2),
            todayEarnings: newTodayEarnings.toFixed(2),
            totalEarnings: newTotalEarnings.toFixed(2),
          });
        }
      }

      const updatedUser = await storage.getUser(userId);
      res.json({ 
        success: true, 
        collected: totalCollected,
        productsCollected,
        newBalance: updatedUser?.balance || "0"
      });
    } catch (error: any) {
      console.error("Collect earnings error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Payment Channels
  app.get("/api/payment-channels", requireAuth, async (req, res) => {
    try {
      const [channels, settings] = await Promise.all([
        storage.getPaymentChannels(),
        storage.getSettings(),
      ]);

      const soleaspayEnabled = settings.soleaspayEnabled === "true";
      const soleaspayChannelName = settings.soleaspayChannelName || "SoleaPay";
      const sendavapayEnabled = settings.sendavapayEnabled === "true";
      const sendavapayChannelName = settings.sendavapayChannelName || "SendavaPay";
      // Build virtual gateway channels when enabled in settings
      const virtualChannels: any[] = [];
      if (sendavapayEnabled) {
        virtualChannels.push({
          id: -2,
          name: sendavapayChannelName,
          redirectUrl: "",
          isApi: true,
          isActive: true,
          gateway: "sendavapay",
        });
      }
      if (soleaspayEnabled) {
        virtualChannels.push({
          id: -1,
          name: soleaspayChannelName,
          redirectUrl: "",
          isApi: true,
          isActive: true,
          gateway: "soleaspay",
        });
      }
      const westpayEnabled = settings.westpayEnabled === "true";
      const westpayChannelName = settings.westpayChannelName || "WestPay";
      if (westpayEnabled) {
        virtualChannels.push({
          id: -3,
          name: westpayChannelName,
          redirectUrl: "",
          isApi: true,
          isActive: true,
          gateway: "westpay",
        });
      }
      const inpayEnabled = settings.inpayEnabled === "true";
      const inpayChannelName = settings.inpayChannelName || "InPay";
      if (inpayEnabled) {
        virtualChannels.push({
          id: -4,
          name: inpayChannelName,
          redirectUrl: "",
          isApi: true,
          isActive: true,
          gateway: "inpay",
        });
      }

      // Manual channels created by admin (no gateway auto-processing)
      const manualChannels = channels.map((ch) => ({ ...ch, gateway: null }));

      res.json([...virtualChannels, ...manualChannels]);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get Soleaspay supported services
  app.get("/api/soleaspay/services", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      const activeCountries = await storage.getActiveCountries();
      const soleaspayCountries = activeCountries
        .filter(({ code }) => isDepositMethodConfigured(code, "soleaspay", settings))
        .map(({ code }) => code.toUpperCase());
      res.json({ 
        enabled: soleaspayCountries.length > 0,
        services: SOLEASPAY_SERVICE_MAP,
        enabledCountries: soleaspayCountries,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Staking Products (public)
  app.get("/api/staking/products", requireAuth, async (req, res) => {
    try {
      const all = await storage.getActiveStakingProducts();
      res.json(all);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/staking/purchase/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const staking = await storage.purchaseStaking(req.session.userId!, id);
      res.json(staking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/staking/my", requireAuth, async (req, res) => {
    try {
      const stakings = await storage.getUserStakings(req.session.userId!);
      res.json(stakings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin Staking
  app.get("/api/admin/staking/products", requireAdmin, async (req, res) => {
    try {
      const all = await storage.getStakingProducts();
      res.json(all);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/staking/products", requireAdmin, async (req, res) => {
    try {
      const { name, description, price, returnAmount, lockDays, launchDate, imageUrl, isActive } = req.body;
      if (!name || !price || !returnAmount || !lockDays) {
        return res.status(400).json({ message: "Champs requis : nom, prix, retour, durée" });
      }
      const sp = await storage.createStakingProduct({
        name, description: description || null,
        price: parseInt(price),
        returnAmount: parseInt(returnAmount),
        lockDays: parseInt(lockDays),
        launchDate: launchDate ? new Date(launchDate) : null,
        imageUrl: imageUrl || null,
        isActive: isActive !== false,
        createdBy: req.session.userId,
      });
      res.json(sp);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/staking/products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, description, price, returnAmount, lockDays, launchDate, imageUrl, isActive } = req.body;
      const sp = await storage.updateStakingProduct(id, {
        name, description,
        price: price !== undefined ? parseInt(price) : undefined,
        returnAmount: returnAmount !== undefined ? parseInt(returnAmount) : undefined,
        lockDays: lockDays !== undefined ? parseInt(lockDays) : undefined,
        launchDate: launchDate ? new Date(launchDate) : (launchDate === null ? null : undefined),
        imageUrl, isActive,
      });
      res.json(sp);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/staking/products/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteStakingProduct(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/staking/stakings", requireAdmin, async (req, res) => {
    try {
      const all = await storage.getAllUserStakings();
      res.json(all);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Payment Numbers (public — filtered by country)
  app.get("/api/payment-numbers", requireAuth, async (req, res) => {
    try {
      const country = typeof req.query.country === "string" ? req.query.country.trim().toUpperCase() : "";
      if (country) {
        const settings = await storage.getSettings();
        if (!isDepositMethodConfigured(country, "manual", settings)) return res.json([]);
        const nums = await storage.getPaymentNumbersByCountry(country);
        return res.json(nums);
      }
      const nums = await storage.getPaymentNumbers();
      res.json(nums.filter(n => n.isActive));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin Payment Numbers CRUD
  app.get("/api/admin/payment-numbers", requireAdmin, async (req, res) => {
    try {
      const nums = await storage.getPaymentNumbers();
      res.json(nums);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/payment-numbers", requireAdmin, async (req, res) => {
    try {
      const { ownerName, phone, paymentLink, operatorName, country, logoUrl, isActive } = req.body;
      const normalizedLink = typeof paymentLink === "string" ? paymentLink.trim() : "";
      if (!ownerName || !operatorName || !country || (!phone && !normalizedLink)) {
        return res.status(400).json({ message: "Renseignez un numéro ou un lien de paiement" });
      }
      let normalizedPhone: string | null = null;
      if (!normalizedLink) {
        normalizedPhone = validatePhone(phone, "Numéro");
      } else {
        const parsedUrl = new URL(normalizedLink);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("Le lien de paiement doit commencer par http:// ou https://");
        }
      }
      const num = await storage.createPaymentNumber({
        ownerName: String(ownerName).trim().slice(0, 100),
        phone: normalizedPhone,
        paymentLink: normalizedLink || null,
        operatorName: String(operatorName).trim().slice(0, 60),
        country: String(country).trim().toUpperCase(),
        logoUrl: logoUrl || null,
        isActive: isActive !== false,
        createdBy: req.session.userId,
      });
      res.json(num);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/payment-numbers/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { ownerName, phone, paymentLink, operatorName, country, logoUrl, isActive } = req.body;
      const normalizedLink = typeof paymentLink === "string" ? paymentLink.trim() : "";
      let normalizedPhone: string | null | undefined;
      if (normalizedLink) {
        const parsedUrl = new URL(normalizedLink);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("Le lien de paiement doit commencer par http:// ou https://");
        }
        normalizedPhone = null;
      } else if (phone !== undefined) {
        normalizedPhone = phone ? validatePhone(phone, "Numéro") : null;
      }
      const num = await storage.updatePaymentNumber(id, {
        ownerName: ownerName === undefined ? undefined : String(ownerName).trim().slice(0, 100),
        phone: normalizedPhone,
        paymentLink: paymentLink === undefined ? undefined : (normalizedLink || null),
        operatorName: operatorName === undefined ? undefined : String(operatorName).trim().slice(0, 60),
        country: country === undefined ? undefined : String(country).trim().toUpperCase(),
        logoUrl, isActive,
      });
      res.json(num);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/payment-numbers/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deletePaymentNumber(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Deposits
  app.post("/api/deposits", requireAuth, async (req, res) => {
    try {
      const { amount, accountName, accountNumber, paymentMethod, country, paymentChannelId, useSoleaspay, useWestpay, useInpay, inpayPhone, otpCode,
        paymentNumberId, channelName, screenshot, paymentMessage, reference, transactionReference, feePaymentId } = req.body;
      const user = await storage.getUser(req.session.userId!);
      
      if (!user) {
        return res.status(401).json({ message: "Non authentifie" });
      }

      const settings = await storage.getSettings();
      const minDeposit = parseInt(settings.minDeposit || "3500");
       const requestedAmount = typeof amount === "number" ? amount : Number(amount);
       if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
        return res.status(400).json({ message: "Montant invalide" });
       }
       const withdrawalFeePayment = feePaymentId !== undefined && feePaymentId !== null
         ? await validateWithdrawalFeePayment(user.id, feePaymentId, requestedAmount)
         : undefined;
       if (!withdrawalFeePayment && requestedAmount < minDeposit) {
        return res.status(400).json({ message: `Montant minimum: ${minDeposit.toLocaleString()} FCFA` });
      }
       if (
         useInpay === true &&
         (!Number.isInteger(requestedAmount) || requestedAmount % 5 !== 0)
       ) {
         return res.status(400).json({
           message: "Le montant InPay doit être un nombre entier multiple de 5 (ex. 300, 305 ou 310 FCFA)",
           inpay: true,
         });
       }

       const parsedDeposit = depositSchema.safeParse({
          amount: requestedAmount,
         accountName, accountNumber, paymentMethod, country,
         paymentChannelId: paymentChannelId === undefined ? undefined : Number(paymentChannelId),
       });
       if (!parsedDeposit.success) {
         return res.status(400).json({ message: parsedDeposit.error.errors[0]?.message || "Données invalides" });
       }
       if (screenshot !== undefined && screenshot !== null) {
         if (
           typeof screenshot !== "string" ||
           screenshot.length > 7_000_000 ||
           !/^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(screenshot)
         ) {
           return res.status(400).json({ message: "Capture invalide ou trop volumineuse (7 Mo maximum)" });
         }
       }
        const normalizedDeposit = parsedDeposit.data;
        const hasManualPaymentNumber = paymentNumberId !== undefined && paymentNumberId !== null;
        const normalizedTransactionReference = typeof transactionReference === "string"
          ? transactionReference.trim()
          : "";
       let selectedPaymentNumber: Awaited<ReturnType<typeof storage.getPaymentNumber>> | undefined;
       if (hasManualPaymentNumber) {
         const parsedPaymentNumberId = Number(paymentNumberId);
         if (!Number.isInteger(parsedPaymentNumberId) || parsedPaymentNumberId <= 0) {
           return res.status(400).json({ message: "Numéro de paiement invalide" });
         }
         selectedPaymentNumber = await storage.getPaymentNumber(parsedPaymentNumberId);
         if (
           !selectedPaymentNumber ||
           !selectedPaymentNumber.isActive ||
           selectedPaymentNumber.country.toUpperCase() !== normalizedDeposit.country.toUpperCase()
         ) {
           return res.status(400).json({ message: "Ce numéro de paiement n'est plus disponible pour ce pays" });
         }
          if (!isDepositMethodConfigured(normalizedDeposit.country, "manual", settings)) {
            return res.status(400).json({ message: "Le paiement manuel n'est pas configuré pour ce pays" });
          }
          if (
            normalizedTransactionReference &&
            (normalizedTransactionReference.length > 120 || /[\r\n]/.test(normalizedTransactionReference))
          ) {
            return res.status(400).json({ message: "L'ID de transaction doit tenir sur une ligne et ne pas dépasser 120 caractères" });
          }
          if (!screenshot && !normalizedTransactionReference) {
            return res.status(400).json({ message: "Ajoutez une capture ou saisissez l'ID de transaction" });
          }
       }

        const explicitRouting = parseDepositMethodsByCountry(settings.depositMethodsByCountry);
        const hasAutomaticProviderRequest =
          useSoleaspay === true || useWestpay === true || useInpay === true;
        if (explicitRouting && !hasManualPaymentNumber && !hasAutomaticProviderRequest) {
          return res.status(400).json({ message: "Sélectionnez un moyen de dépôt autorisé pour ce pays" });
        }

      const soleaspayCountry = normalizedDeposit.country.trim().toUpperCase();
      const orderId = `JOLLIBEE-${Date.now()}-${user.id}`;
      
      if (useSoleaspay === true) {
        if (!isDepositMethodConfigured(soleaspayCountry, "soleaspay", settings)) {
          return res.status(400).json({ message: "SoleaPay n'est pas activé pour ce pays", soleaspay: true });
        }
        try {
          validateSoleaspayConfig();
        } catch (error: any) {
          return res.status(503).json({ message: error.message, soleaspay: true });
        }
         if (!isSoleaspaySupported(soleaspayCountry, normalizedDeposit.paymentMethod)) {
          return res.status(400).json({
            message: `L'opérateur "${normalizedDeposit.paymentMethod}" n'est pas supporté par ce canal pour le pays "${soleaspayCountry}". Veuillez choisir un autre canal.`,
            soleaspay: true,
          });
        }
        try {
          const paymentResult = await initiatePayment(
            normalizedDeposit.accountNumber,
            normalizedDeposit.amount,
            soleaspayCountry,
            normalizedDeposit.paymentMethod,
            orderId,
            normalizedDeposit.accountName,
            `user${user.id}@intel.com`
          );

          if (paymentResult.success && paymentResult.data) {
            const deposit = await storage.createDeposit({
              userId: req.session.userId!,
             amount: normalizedDeposit.amount,
             accountName: normalizedDeposit.accountName,
             accountNumber: normalizedDeposit.accountNumber,
             country: soleaspayCountry,
             paymentMethod: normalizedDeposit.paymentMethod,
               paymentChannelId: normalizedDeposit.paymentChannelId && normalizedDeposit.paymentChannelId > 0 ? normalizedDeposit.paymentChannelId : null,
              status: "processing",
              soleaspayReference: paymentResult.data.reference,
              soleaspayOrderId: orderId,
              withdrawalFeePaymentId: withdrawalFeePayment?.id,
            });

            return res.json({ 
              deposit,
              soleaspay: true,
              reference: paymentResult.data.reference,
              status: paymentResult.status,
              message: paymentResult.message
            });
          } else {
            notifyTelegramPaymentError({
              operation: "Dépôt SoleaPay",
              error: paymentResult.message || "Échec de l'initialisation",
              userId: user.id,
              amount: normalizedDeposit.amount,
              country: soleaspayCountry,
              paymentMethod: normalizedDeposit.paymentMethod,
            });
            return res.status(400).json({ 
              message: paymentResult.message || "Erreur Soleaspay",
              soleaspay: true
            });
          }
        } catch (soleaspayError: any) {
          console.error("[soleaspay] Payment error:", soleaspayError);
          notifyTelegramPaymentError({
            operation: "Dépôt SoleaPay",
            error: soleaspayError,
            userId: user.id,
            amount: normalizedDeposit.amount,
            country: soleaspayCountry,
            paymentMethod: normalizedDeposit.paymentMethod,
          });
          return res.status(400).json({ 
            message: soleaspayError.message || "Erreur de paiement Soleaspay",
            soleaspay: true
          });
        }
      }

      // ── WestPay: redirect-based hosted-payment flow ─────────────────────────
      if (useWestpay === true) {
        if (!isDepositMethodConfigured(normalizedDeposit.country, "westpay", settings)) {
          return res.status(400).json({ message: "WestPay n'est pas activé pour ce pays", westpay: true });
        }
        try {
          validateWestpayConfig();
        } catch (error: any) {
          return res.status(503).json({ message: error.message || "WestPay n'est pas configuré dans Plesk", westpay: true });
        }
        try {
          if (!process.env.WESTPAY_MERCHANT_SLUG) {
            return res.status(400).json({ message: "WestPay non configuré : ajoutez WESTPAY_MERCHANT_SLUG aux variables d'environnement Plesk", westpay: true });
          }
          if (!process.env.WESTPAY_WEBHOOK_SECRET) {
            return res.status(503).json({ message: "WestPay ne peut pas confirmer les paiements : configurez WESTPAY_WEBHOOK_SECRET dans les variables d'environnement Plesk", westpay: true });
          }
          const baseUrl = `${req.protocol}://${req.get("host")}`;
          // Create deposit to get an ID, then build the redirect URL
          const deposit = await storage.createDeposit({
            userId: req.session.userId!,
            amount: normalizedDeposit.amount,
            accountName: normalizedDeposit.accountName || user.fullName,
            accountNumber: normalizedDeposit.accountNumber || user.phone,
            country: normalizedDeposit.country,
            paymentMethod: "WestPay",
            paymentChannelId: normalizedDeposit.paymentChannelId && normalizedDeposit.paymentChannelId > 0 ? normalizedDeposit.paymentChannelId : null,
             status: "pending",
             withdrawalFeePaymentId: withdrawalFeePayment?.id,
          });
          const callbackUrl = `${baseUrl}/api/westpay/callback?depositId=${deposit.id}`;
          const westpayUrl = westpayBuildUrl({
            amount: normalizedDeposit.amount,
            countryCode: normalizedDeposit.country,
            redirectUrl: callbackUrl,
          });
          return res.json({ deposit, westpayUrl, westpay: true });
        } catch (westpayError: any) {
          console.error("[westpay] deposit error:", westpayError);
          notifyTelegramPaymentError({
            operation: "Dépôt WestPay",
            error: westpayError,
            userId: user.id,
            amount: normalizedDeposit.amount,
            country: normalizedDeposit.country,
            paymentMethod: "WestPay",
          });
          return res.status(400).json({ message: westpayError.message || "Erreur WestPay", westpay: true });
        }
      }

      // ── InPay: redirect-based hosted-payment flow ───────────────────────────
      if (useInpay === true) {
        const normalizedCountry = normalizedDeposit.country.trim().toUpperCase();
        if (!isDepositMethodConfigured(normalizedCountry, "inpay", settings)) {
          return res.status(400).json({ message: "InPay n'est pas activé pour ce pays", inpay: true });
        }
        if (!isInpayConfigured(normalizedCountry)) {
          return res.status(400).json({
            message: `InPay n'est pas configuré pour ${normalizedCountry} : URL API, merchant ID ou clé API manquant`,
            inpay: true,
          });
        }
        const inpayPhoneValue = typeof inpayPhone === "string" && inpayPhone.trim()
          ? inpayPhone.trim()
          : normalizedDeposit.accountNumber || user.phone;
        const parsedInpayPhone = phoneNumberSchema.safeParse(inpayPhoneValue);
        if (!parsedInpayPhone.success) {
          return res.status(400).json({
            message: "Le numéro du compte est invalide",
            inpay: true,
          });
        }
        const inpayCustomerMobile = parsedInpayPhone.data;

        const inpayDeposit = await storage.createDeposit({
          userId: req.session.userId!,
          amount: normalizedDeposit.amount,
          accountName: normalizedDeposit.accountName || user.fullName,
          accountNumber: inpayCustomerMobile,
          country: normalizedCountry,
          paymentMethod: "InPay",
          paymentChannelId: normalizedDeposit.paymentChannelId && normalizedDeposit.paymentChannelId > 0 ? normalizedDeposit.paymentChannelId : null,
           status: "processing",
           withdrawalFeePaymentId: withdrawalFeePayment?.id,
        });
        const outTradeNo = inpayCreateOutTradeNo("PAYIN", inpayDeposit.id, user.id);
        const account = getInpayAccount(normalizedCountry);
        try {
          const result = await inpayCreatePayin({
            amount: normalizedDeposit.amount,
            country: normalizedCountry,
            merchantId: account.merchantId,
            apiKey: account.apiKey,
            customerName: normalizedDeposit.accountName || user.fullName,
            customerMobile: inpayCustomerMobile,
            customerEmail: `user${user.id}@tonnew.app`,
            notificationUrl: `${getPublicBaseUrl(req)}/api/webhooks/inpay`,
            outTradeNo,
          });
          const deposit = await storage.updateDeposit(inpayDeposit.id, {
           status: "processing",
           withdrawalFeePaymentId: withdrawalFeePayment?.id,
            inpayOutTradeNo: outTradeNo,
            inpayOrderNumber: result.orderNumber,
          });
          return res.json({ deposit, inpayUrl: result.url, inpay: true });
        } catch (inpayError: any) {
          await storage.updateDeposit(inpayDeposit.id, { status: "rejected", processedAt: new Date() });
          void sendTelegramInpayError({
            operation: "Dépôt pay-in",
            error: inpayError,
            country: normalizedCountry,
            amount: normalizedDeposit.amount,
            reference: outTradeNo,
            recordId: inpayDeposit.id,
            orderNumber: outTradeNo,
            requestUrl: inpayError?.requestUrl,
            requestData: inpayError?.requestData,
          }).catch((notificationError) => {
            console.error("[telegram] InPay deposit error notification failed:", notificationError.message);
          });
          console.error("[inpay] payin error:", inpayError);
          return res.status(400).json({ message: inpayError.message || "Erreur InPay", inpay: true });
        }
      }

      const deposit = await storage.createDeposit({
        userId: req.session.userId!,
         amount: normalizedDeposit.amount,
         accountName: normalizedDeposit.accountName,
         accountNumber: normalizedDeposit.accountNumber,
         country: normalizedDeposit.country,
         paymentMethod: selectedPaymentNumber?.operatorName || normalizedDeposit.paymentMethod,
         paymentChannelId: normalizedDeposit.paymentChannelId && normalizedDeposit.paymentChannelId > 0 ? normalizedDeposit.paymentChannelId : null,
         paymentNumberId: selectedPaymentNumber?.id || null,
         channelName: selectedPaymentNumber
           ? `${selectedPaymentNumber.operatorName} - ${selectedPaymentNumber.paymentLink ? "Lien de paiement" : selectedPaymentNumber.phone}`
           : channelName || null,
        screenshot: screenshot || null,
        paymentMessage: paymentMessage || null,
        reference: selectedPaymentNumber ? normalizedTransactionReference || null : reference || null,
         status: "pending",
         withdrawalFeePaymentId: withdrawalFeePayment?.id,
      });

      res.json({ deposit, soleaspay: false });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Verify payment status (Soleaspay)
  app.get("/api/deposits/:id/verify", requireAuth, async (req, res) => {
    try {
      const depositId = parseInt(req.params.id);
      const deposit = await storage.getDeposit(depositId);
      
      if (!deposit) {
        return res.status(404).json({ message: "Depot non trouve" });
      }

      if (deposit.userId !== req.session.userId) {
        return res.status(403).json({ message: "Acces refuse" });
      }

      if (deposit.status === "approved" || deposit.status === "rejected") {
        return res.json({ status: deposit.status });
      }

      if (deposit.soleaspayReference && deposit.soleaspayOrderId) {
        try {
          const verifyResult = await verifyPayment(deposit.soleaspayOrderId, deposit.soleaspayReference);
          const newStatus = mapSoleaspayStatus(verifyResult.status);

          if (newStatus !== "pending" && newStatus !== deposit.status) {
            await storage.updateDeposit(depositId, { 
              status: newStatus,
              processedAt: new Date()
            });

            if (newStatus === "approved") {
              const user = await storage.getUser(deposit.userId);
              if (user) {
                const newBalance = parseFloat(user.balance) + deposit.amount;
                await storage.updateUser(deposit.userId, {
                  balance: newBalance.toFixed(2),
                  hasDeposited: true,
                });

                await storage.createTransaction({
                  userId: deposit.userId,
                  type: "deposit",
                  amount: deposit.amount.toString(),
                  description: `Depot Soleaspay #${deposit.id}`,
                });

                await storage.processDepositReferralCommissions(deposit.userId, deposit.amount);
              }

async function refundRejectedWithdrawal(withdrawal: { id: number; userId: number; amount: number }) {
  const user = await storage.getUser(withdrawal.userId);
  if (!user) return;
  await storage.updateUser(user.id, {
    balance: (parseFloat(user.balance) + withdrawal.amount).toFixed(2),
  });
  await storage.createTransaction({
    userId: user.id,
    type: "withdrawal_refund",
    amount: withdrawal.amount.toString(),
    description: `Remboursement retrait InPay #${withdrawal.id}`,
  });
}
            }
          }

          return res.json({ 
            status: newStatus,
            soleaspay: true,
            soleaspayStatus: verifyResult.status,
            message: verifyResult.message
          });
        } catch (verifyError: any) {
          console.error("[soleaspay] Verify error:", verifyError);
          notifyTelegramPaymentError({
            operation: "Vérification du dépôt SoleaPay",
            error: verifyError,
            recordId: deposit.id,
            userId: deposit.userId,
            amount: deposit.amount,
            country: deposit.country,
            paymentMethod: deposit.paymentMethod,
          });
          return res.json({ 
            status: deposit.status,
            soleaspay: true,
            error: "Erreur de verification"
          });
        }
      }

      return res.json({ status: deposit.status });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/deposits/history", requireAuth, async (req, res) => {
    try {
      const deposits = await storage.getUserDeposits(req.session.userId!);
      res.json(deposits);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ── AshtechPay Direct API ───────────────────────────────────────────────────
  app.get("/api/ashtechpay/countries", requireAuth, async (_req, res) => {
    try {
      if (!isAshtechConfigured()) {
        return res.status(503).json({ message: "AshtechPay non configuré" });
      }
      res.json(await ashtechGetCountries());
    } catch (error: any) {
      console.error("[ashtechpay] countries error:", error);
      res.status(502).json({ message: error.message || "Impossible de charger les pays AshtechPay" });
    }
  });

  app.post("/api/ashtechpay/collect", requireAuth, async (req, res) => {
    try {
      const { amount, country, operator, phone, otp, depositId, reference: requestedReference, feePaymentId } = req.body;
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Non authentifié" });

      const settings = await storage.getSettings();
      const numericAmount = Number(amount);
      const minDeposit = parseInt(settings.minDeposit || "3500");
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ message: "Montant invalide" });
      }
      const existingDeposit = depositId ? await storage.getDeposit(Number(depositId)) : undefined;
      if (existingDeposit && existingDeposit.userId !== user.id) {
        return res.status(403).json({ message: "Accès refusé" });
      }
      const selectedCountryCode = String(existingDeposit?.country || country || "").trim().toUpperCase();
      if (!existingDeposit && !isDepositMethodConfigured(selectedCountryCode, "ashtech", settings)) {
        return res.status(400).json({ message: "AshtechPay n'est pas configuré pour ce pays" });
      }
      if (existingDeposit?.status === "approved") {
        return res.status(409).json({ message: "Ce dépôt est déjà confirmé" });
      }
      if (existingDeposit?.status === "rejected") {
        return res.status(409).json({ message: "Ce dépôt a déjà été refusé" });
      }
      if (existingDeposit && (
        existingDeposit.status !== "pending" ||
        !existingDeposit.ashtechReference ||
        existingDeposit.ashtechTransactionId
      )) {
        return res.status(409).json({ message: "Cette tentative OTP AshtechPay ne peut plus être reprise" });
      }
      const withdrawalFeePayment = existingDeposit?.withdrawalFeePaymentId
        ? await validateWithdrawalFeePayment(user.id, existingDeposit.withdrawalFeePaymentId, numericAmount)
        : feePaymentId !== undefined && feePaymentId !== null
          ? await validateWithdrawalFeePayment(user.id, feePaymentId, numericAmount)
          : undefined;
      if (!withdrawalFeePayment && numericAmount < minDeposit) {
        return res.status(400).json({ message: `Montant minimum: ${minDeposit.toLocaleString()} FCFA` });
      }
      if (!country || !operator || !phone) {
        return res.status(400).json({ message: "Pays, opérateur et numéro requis" });
      }

      const ashtechCountries = await ashtechGetCountries();
      const countryCode = String(country).trim().toUpperCase();
      const catalogCountry = ashtechCountries.find(
        (entry) => entry.code.toUpperCase() === countryCode,
      );
      if (!catalogCountry) {
        return res.status(400).json({ message: "Pays non pris en charge par AshtechPay" });
      }

      const requestedOperator = String(operator).trim();
      const requestedPhone = String(phone).trim();
      const canonicalOperator = catalogCountry.operators
        .map((entry) => typeof entry === "string" ? entry : entry.name || entry.code || entry.id || "")
        .map((value) => value.trim())
        .find((value) => value.toLowerCase() === requestedOperator.toLowerCase());
      if (!canonicalOperator) {
        return res.status(400).json({ message: "Opérateur non disponible pour ce pays" });
      }
      if (existingDeposit && (
        Number(existingDeposit.amount) !== numericAmount ||
        String(existingDeposit.country || "").trim().toUpperCase() !== countryCode ||
        String(existingDeposit.paymentMethod || "").trim() !== canonicalOperator ||
        String(existingDeposit.accountNumber || "").trim() !== requestedPhone
      )) {
        return res.status(409).json({ message: "Les détails de cette tentative OTP ne correspondent plus au dépôt initial" });
      }

      const generatedReference = `paget-studio-${Date.now()}-${user.id}`;
      const requestedAshtechReference = typeof requestedReference === "string"
        ? requestedReference.trim()
        : "";
      // AshtechPay requires the exact reference returned by an
      // `otp_required` response on the retry request. Preserve the reference
      // already stored on a deposit before generating a new one.
      const reference = existingDeposit?.ashtechReference?.trim()
        || requestedAshtechReference
        || generatedReference;
      const notifyBaseUrl = (
        process.env.ASHTECHPAY_WEBHOOK_BASE_URL ||
        process.env.PUBLIC_APP_URL ||
        getPublicBaseUrl(req)
      ).trim().replace(/\/+$/, "");
      if (!/^https:\/\//i.test(notifyBaseUrl)) {
        return res.status(400).json({
          message: "AshtechPay exige une URL webhook publique en HTTPS",
        });
      }
      const result = await ashtechCollect({
        amount: numericAmount,
        currency: catalogCountry.currency,
        phone: requestedPhone,
        operator: canonicalOperator,
        countryCode,
        reference,
        notifyUrl: `${notifyBaseUrl}/api/webhooks/ashtechpay`,
        ...(otp ? { otp: String(otp).trim() } : {}),
      });

      const mappedStatus = mapAshtechStatus(result.status);
      const deposit = existingDeposit
        ? await storage.updateDeposit(existingDeposit.id, {
            // Keep successful responses claimable by the idempotent approval
            // gate below before crediting the wallet.
            status: mappedStatus === "approved" ? "processing" : mappedStatus,
            ashtechTransactionId: result.transaction_id || existingDeposit.ashtechTransactionId,
            ashtechReference: reference,
          })
        : await storage.createDeposit({
            userId: user.id,
            amount: numericAmount,
            accountName: user.fullName,
            accountNumber: requestedPhone,
            country: String(country).trim().toUpperCase(),
            paymentMethod: canonicalOperator,
            status: mappedStatus === "approved" ? "processing" : mappedStatus,
            ashtechTransactionId: result.transaction_id,
            ashtechReference: reference,
             withdrawalFeePaymentId: withdrawalFeePayment?.id,
          });

      if (mappedStatus === "approved") {
        const claimedDeposit = await storage.claimDepositApproval(deposit.id);
        if (claimedDeposit) await creditApprovedDeposit(claimedDeposit);
      }

      res.status(202).json({
        depositId: deposit.id,
        transactionId: result.transaction_id,
        reference,
        status: mappedStatus,
        requiresOtp: Boolean(result.ussd_code || result.message?.toLowerCase().includes("otp")),
        ussdCode: result.ussd_code || null,
        waveUrl: result.wave_url || null,
        flow: result.flow || null,
        message: result.message || null,
      });
    } catch (error: any) {
      if (error instanceof AshtechApiError && error.status === 400 && error.data?.error === "otp_required") {
        const {
          amount: requestedAmount,
          country: requestCountry,
          operator: requestOperator,
          phone: requestPhone,
           depositId: requestDepositId,
           feePaymentId: requestFeePaymentId,
        } = req.body;
        const otpUser = await storage.getUser(req.session.userId!);
        if (!otpUser) return res.status(401).json({ message: "Non authentifié" });
        const otpAmount = Number(requestedAmount);
        const otpExistingDeposit = requestDepositId
          ? await storage.getDeposit(Number(requestDepositId))
          : undefined;
        if (otpExistingDeposit && otpExistingDeposit.userId !== otpUser.id) {
          return res.status(403).json({ message: "Accès refusé" });
        }
        const otpReference = String(error.data.reference || "").trim();
        if (!otpReference) {
          return res.status(400).json({ message: error.message || "Référence OTP AshtechPay manquante" });
        }

        const otpUssdCode = error.data.ussd_code
          || (requestCountry === "BF" && /orange/i.test(String(requestOperator)) ? `*144*4*6*${otpAmount}#` : null)
          || (requestCountry === "CI" && /orange/i.test(String(requestOperator)) ? "#144*82#" : null);
        const otpFeePaymentId = otpExistingDeposit?.withdrawalFeePaymentId
          || (requestFeePaymentId ? Number(requestFeePaymentId) : undefined);
        const otpDeposit = otpExistingDeposit
          ? await storage.updateDeposit(otpExistingDeposit.id, { status: "pending", ashtechReference: otpReference })
          : await storage.createDeposit({
              userId: otpUser.id,
              amount: otpAmount,
              accountName: otpUser.fullName,
              accountNumber: String(requestPhone).trim(),
              country: String(requestCountry).trim().toUpperCase(),
              paymentMethod: String(requestOperator).trim(),
              status: "pending",
              ashtechReference: otpReference,
               withdrawalFeePaymentId: otpFeePaymentId,
            });

        return res.status(400).json({
          error: "otp_required",
          message: error.message,
          depositId: otpDeposit.id,
          reference: otpReference,
          requiresOtp: true,
          ussdCode: otpUssdCode,
        });
      }
      const message = error.message || "Erreur AshtechPay";
      const errorUser = await storage.getUser(req.session.userId!);
      void sendTelegramMessage(
        [
          "❌ <b>Erreur de dépôt</b>",
          `Utilisateur : ${formatTelegramValue(errorUser?.fullName || "Inconnu")}`,
          `Montant : <b>${formatTelegramValue(req.body?.amount)} XOF</b>`,
          `Pays : ${formatTelegramValue(req.body?.country)}`,
          `Opérateur : ${formatTelegramValue(req.body?.operator)}`,
          `Erreur exacte : <code>${formatTelegramValue(message)}</code>`,
        ].join("\n"),
      ).catch((notificationError) => console.error("[telegram] deposit error notification failed:", notificationError.message));
      console.error("[ashtechpay] collect error:", message);
      res.status(400).json({ message });
    }
  });

  app.get("/api/deposits/:id/ashtechpay-status", requireAuth, async (req, res) => {
    try {
      const depositId = Number.parseInt(String(req.params.id), 10);
      if (!Number.isInteger(depositId) || depositId <= 0) {
        return res.status(400).json({ message: "Identifiant de dépôt invalide" });
      }
      const deposit = await storage.getDeposit(depositId);
      if (!deposit) return res.status(404).json({ message: "Dépôt non trouvé" });
      if (deposit.userId !== req.session.userId) return res.status(403).json({ message: "Accès refusé" });
      if (deposit.status === "approved" || deposit.status === "rejected") {
        return res.json({ status: deposit.status });
      }
      if (!deposit.ashtechTransactionId) return res.json({ status: deposit.status });

      const result = await ashtechGetTransaction(deposit.ashtechTransactionId);
      const newStatus = mapAshtechStatus(result.status);
      if (newStatus !== "pending" && newStatus !== deposit.status) {
        if (newStatus === "approved") {
          // The conditional update is the idempotency gate: only the request
          // that claims the pending deposit is allowed to credit the wallet.
          const claimedDeposit = await storage.claimDepositApproval(deposit.id);
          if (claimedDeposit) {
            const user = await storage.getUser(deposit.userId);
            if (user) {
              await storage.updateUser(user.id, {
                balance: (parseFloat(user.balance) + deposit.amount).toFixed(2),
                hasDeposited: true,
              });
              await storage.createTransaction({
                userId: user.id,
                type: "deposit",
                amount: deposit.amount.toString(),
                description: `Dépôt AshtechPay #${deposit.id}`,
              });
              await storage.processDepositReferralCommissions(user.id, deposit.amount);
            }
          }
        } else {
          await storage.updateDeposit(deposit.id, { status: newStatus, processedAt: new Date() });
        }
      }
      const finalDeposit = await storage.getDeposit(deposit.id);
      res.json({ status: finalDeposit?.status || newStatus, rawStatus: result.status });
    } catch (error: any) {
      console.error("[ashtechpay] status error:", error);
      res.status(502).json({ message: error.message || "Erreur de vérification AshtechPay" });
    }
  });

  // ── SendavaPay routes ──────────────────────────────────────────────────────

  // Proxy: operators for a given country (public SendavaPay endpoint)
  app.get("/api/sendavapay/operators/:country", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      if (!isDepositMethodConfigured(req.params.country, "sendavapay", settings)) {
        return res.status(403).json({ success: false, message: "SendavaPay n'est pas configuré pour ce pays" });
      }
      const svCountry = toSendavapayCountry(req.params.country);
      const r = await fetch(`${getSendavapayApiBaseUrl()}/operators/${svCountry}`);
      const data = await r.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Create payment (server-side, stores deposit record)
  app.post("/api/sendavapay/create", requireAuth, async (req, res) => {
    try {
      const { amount, country, operatorId, operatorName, payerPhone, feePaymentId } = req.body;
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Non authentifié" });

      const settings = await storage.getSettings();
      if (!isDepositMethodConfigured(country, "sendavapay", settings)) {
        return res.status(400).json({ message: "SendavaPay n'est pas configuré pour ce pays" });
      }
      const minDeposit = parseInt(settings.minDeposit || "3500");
      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ message: "Montant invalide" });
      }
      const withdrawalFeePayment = feePaymentId !== undefined && feePaymentId !== null
        ? await validateWithdrawalFeePayment(user.id, feePaymentId, numericAmount)
        : undefined;
      if (!withdrawalFeePayment && numericAmount < minDeposit) {
        return res.status(400).json({ message: `Montant minimum: ${minDeposit.toLocaleString()} FCFA` });
      }
      if (!payerPhone || !payerPhone.trim()) {
        return res.status(400).json({ message: "Le numéro Mobile Money est requis" });
      }

      const svCountry = toSendavapayCountry(country);
      const currency = sendavapayGetCurrency(country);
      const externalRef = `DEP-${Date.now()}-${user.id}`;
      // Only use the number explicitly entered for this deposit; never reuse the profile phone.
      const customerPhone = sendavapayFormatPhone(payerPhone.trim(), country);
      const devDomain = process.env.REPLIT_DEV_DOMAIN;
      const configuredBaseUrl = process.env.PUBLIC_APP_URL?.trim();
      const baseUrl = (configuredBaseUrl || (devDomain ? `https://${devDomain}` : ""))
        .replace(/\/+$/, "");
      if (!/^https:\/\//i.test(baseUrl)) {
        return res.status(503).json({
          message: "SendavaPay exige l'URL publique HTTPS du serveur dans la variable Plesk PUBLIC_APP_URL",
        });
      }
      const webhookUrl = `${baseUrl}/api/webhooks/sendavapay`;

      const result = await sendavapayCreate({
         amount: numericAmount,
        currency,
        description: `Dépôt #${externalRef}`,
        customerName: user.fullName,
        customerPhone,
        customerEmail: `user${user.id}@sybotx.app`,
        payerCountry: svCountry,
        webhookUrl,
        externalReference: externalRef,
      });

      if (!result.success || !result.data) {
        notifyTelegramPaymentError({
          operation: "Création du dépôt SendavaPay",
          error: result.error || "Échec de la création du paiement",
          userId: user.id,
          amount: numericAmount,
          country,
          paymentMethod: operatorName || "SendavaPay",
        });
        return res.status(400).json({
          message: result.error || "Erreur SendavaPay",
        });
      }

      const deposit = await storage.createDeposit({
        userId: user.id,
        amount,
        accountName: user.fullName,
        accountNumber: customerPhone,
        country,
        paymentMethod: operatorName || "SendavaPay",
        status: "processing",
        sendavapayReference: result.data.reference,
        sendavapayToken: result.data.paymentToken,
         withdrawalFeePaymentId: withdrawalFeePayment?.id,
      });

      res.json({
        depositId: deposit.id,
        paymentToken: result.data.paymentToken,
        reference: result.data.reference,
        expiresAt: result.data.expiresAt,
      });
    } catch (error: any) {
      console.error("[sendavapay] create error:", error);
      notifyTelegramPaymentError({
        operation: "Création du dépôt SendavaPay",
        error,
        userId: req.session.userId,
        amount: req.body?.amount,
        country: req.body?.country,
        paymentMethod: req.body?.operatorName || "SendavaPay",
      });
      res.status(500).json({ message: error.message || "Erreur serveur" });
    }
  });

  // Initiate payment (proxy, calls CORS endpoint on behalf of authenticated user)
  app.post("/api/sendavapay/initiate", requireAuth, async (req, res) => {
    try {
      const { paymentToken, payerCountry, operatorId, depositId, payerPhone } = req.body;
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Non authentifié" });
      if (!payerPhone || !payerPhone.trim()) {
        return res.status(400).json({ message: "Le numéro Mobile Money est requis" });
      }

      const svCountry = toSendavapayCountry(payerCountry);
      const customerPhone = sendavapayFormatPhone(payerPhone.trim(), payerCountry);

      const result = await sendavapayInitiate({
        paymentToken,
        payerName: user.fullName,
        payerPhone: customerPhone,
        payerCountry: svCountry,
        operatorId,
      });

      // Update deposit status to processing
      if (depositId) {
        await storage.updateDeposit(depositId, { status: "processing" });
      }

      res.json(result);
    } catch (error: any) {
      console.error("[sendavapay] initiate error:", error);
      notifyTelegramPaymentError({
        operation: "Initialisation du dépôt SendavaPay",
        error,
        recordId: req.body?.depositId,
        userId: req.session.userId,
        country: req.body?.payerCountry,
        paymentMethod: "SendavaPay",
      });
      res.status(500).json({ message: error.message || "Erreur serveur" });
    }
  });

  // Submit OTP — CLIENT (CORS) endpoint, no SDK key
  app.post("/api/sendavapay/submit-otp", requireAuth, async (req, res) => {
    try {
      const { otpToken, otp } = req.body;
      if (!otpToken || !otp) {
        return res.status(400).json({ message: "otpToken et otp requis" });
      }
      const result = await sendavapaySubmitOtp({ otpToken, otp });
      res.json(result);
    } catch (error: any) {
      console.error("[sendavapay] submit-otp error:", error);
      notifyTelegramPaymentError({
        operation: "Validation OTP SendavaPay",
        error,
        userId: req.session.userId,
        paymentMethod: "SendavaPay",
      });
      res.status(500).json({ message: error.message || "Erreur serveur" });
    }
  });

  // Retry a failed payment — CLIENT (CORS) endpoint, no SDK key
  app.post("/api/sendavapay/retry", requireAuth, async (req, res) => {
    try {
      const { paymentToken, depositId } = req.body;
      if (!paymentToken) {
        return res.status(400).json({ message: "paymentToken requis" });
      }
      // Reset deposit status to processing
      if (depositId) {
        await storage.updateDeposit(depositId, { status: "processing" });
      }
      const result = await sendavapayRetry(paymentToken);
      res.json(result);
    } catch (error: any) {
      console.error("[sendavapay] retry error:", error);
      notifyTelegramPaymentError({
        operation: "Nouvel essai du dépôt SendavaPay",
        error,
        recordId: req.body?.depositId,
        userId: req.session.userId,
        paymentMethod: "SendavaPay",
      });
      res.status(500).json({ message: error.message || "Erreur serveur" });
    }
  });

  // Poll payment status using GET /payment-status/:reference (lighter than verify-payment)
  app.get("/api/deposits/:id/sendavapay-status", requireAuth, async (req, res) => {
    try {
      const depositId = parseInt(req.params.id);
      const deposit = await storage.getDeposit(depositId);
      if (!deposit) return res.status(404).json({ message: "Dépôt non trouvé" });
      if (deposit.userId !== req.session.userId) return res.status(403).json({ message: "Accès refusé" });

      if (deposit.status === "approved" || deposit.status === "rejected") {
        return res.json({ status: deposit.status });
      }

      if (!deposit.sendavapayReference) {
        return res.json({ status: deposit.status });
      }

      // Use lightweight GET payment-status endpoint for polling
      const statusRes = await fetch(
        `${getSendavapayApiBaseUrl()}/payment-status/${encodeURIComponent(deposit.sendavapayReference)}`,
        { headers: { Authorization: `Bearer ${process.env.SENDAVAPAY_API_KEY || ""}` } }
      );
      const statusData = await statusRes.json() as { success: boolean; data?: { status: string } };

      if (!statusData.success || !statusData.data) {
        return res.json({ status: deposit.status });
      }

      const newStatus = mapSendavapayStatus(statusData.data.status);
      if (newStatus !== "pending" && newStatus !== deposit.status) {
        if (newStatus === "approved") {
          const claimedDeposit = await storage.claimDepositApproval(depositId);
          if (claimedDeposit) await creditApprovedDeposit(claimedDeposit);
        } else {
          await storage.updateDeposit(depositId, { status: newStatus, processedAt: new Date() });
        }
      }

      res.json({ status: newStatus || deposit.status, rawStatus: statusData.data.status });
    } catch (error: any) {
      console.error("[sendavapay] status check error:", error);
      notifyTelegramPaymentError({
        operation: "Vérification du dépôt SendavaPay",
        error,
        recordId: req.params.id,
        userId: req.session.userId,
        paymentMethod: "SendavaPay",
      });
      res.status(500).json({ message: error.message });
    }
  });

  // AshtechPay Direct API webhook (HMAC-SHA256 verified).
  app.post("/api/webhooks/ashtechpay", async (req, res) => {
    try {
      if (!isAshtechConfigured()) {
        return res.status(503).json({ message: "AshtechPay non configuré" });
      }

      const settings = await storage.getSettings();
      const webhookSecret =
        process.env.ASHTECHPAY_WEBHOOK_SECRET ||
        process.env.ASHTECH_WEBHOOK_SECRET ||
        "";
      if (!webhookSecret) {
        console.error("[ashtechpay webhook] Webhook secret non configuré");
        return res.status(503).json({ message: "Webhook AshtechPay non configuré" });
      }

      const rawBody = (req as any).rawBody as Buffer | undefined;
      const timestamp = String(req.headers["x-ashtech-timestamp"] || "");
      const signature = String(req.headers["x-ashtech-signature"] || "");
      const timestampSeconds = Number(timestamp);
      const timestampIsFresh =
        Number.isFinite(timestampSeconds) &&
        Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds) <= 5 * 60;
      if (
        !rawBody ||
        !timestampIsFresh ||
        !verifyAshtechWebhookSignature(rawBody, timestamp, signature, webhookSecret)
      ) {
        console.warn("[ashtechpay webhook] Signature invalide ou horodatage expiré");
        return res.status(401).json({ message: "Signature invalide" });
      }

      const payload = req.body || {};
      const reference = String(payload.reference || payload.data?.reference || "").trim();
      const transactionId = String(
        payload.transaction_id || payload.transactionId || payload.data?.transaction_id || payload.data?.transactionId || "",
      ).trim();
      const event = String(payload.event || "").toLowerCase();
      const rawStatus = String(payload.status || payload.data?.status || "").toLowerCase();

      // Acknowledge only after authenticating the delivery. The fulfillment
      // itself remains idempotent through claimDepositApproval.
      res.status(200).json({ received: true });

      let deposit = transactionId
        ? await storage.getDepositByAshtechTransactionId(transactionId)
        : undefined;
      if (!deposit && reference) {
        deposit = await storage.getDepositByAshtechReference(reference);
      }
      if (!deposit || deposit.status === "approved" || deposit.status === "rejected") return;

      if (event === "payment.failed" || ["failed", "expired", "cancelled", "canceled", "rejected"].includes(rawStatus)) {
        await storage.updateDeposit(deposit.id, { status: "rejected", processedAt: new Date() });
        return;
      }

      if (!deposit.ashtechTransactionId) return;
      const verified = await ashtechGetTransaction(deposit.ashtechTransactionId);
      const verifiedStatus = mapAshtechStatus(verified.status);
      if (verifiedStatus === "approved") {
        const claimedDeposit = await storage.claimDepositApproval(deposit.id);
        if (claimedDeposit) await creditApprovedDeposit(claimedDeposit);
      } else if (verifiedStatus === "rejected") {
        await storage.updateDeposit(deposit.id, { status: "rejected", processedAt: new Date() });
      }
    } catch (error: any) {
      console.error("[ashtechpay webhook] verification error:", error);
      // The delivery was authenticated and already acknowledged. Reconciliation
      // will retry the provider status check independently.
    }
  });

  app.post(
    "/api/webhooks/sendavapay",
    async (req, res) => {
      try {
        const secret = process.env.SENDAVAPAY_WEBHOOK_SECRET || "";
        if (!secret) {
          console.error("[sendavapay webhook] Webhook secret not configured");
          return res.status(503).json({ message: "Webhook secret non configuré" });
        }
        const sig = req.headers["x-sendavapay-signature"] as string || "";
        // req.rawBody is captured by the global express.json verify callback
        const rawBuf = (req as any).rawBody as Buffer | undefined;
        if (secret && rawBuf && !sendavapayVerifySignature(rawBuf, sig, secret)) {
          console.warn("[sendavapay webhook] Invalid signature");
          return res.status(401).json({ message: "Invalid signature" });
        }

        const payload = req.body;
        const { event, reference, status } = payload;

        if (!reference) return res.json({ received: true });

        // Find deposit by sendavapay reference
        const deposit = await storage.getDepositBySendavapayReference(reference);
        if (!deposit) {
          console.warn(`[sendavapay webhook] No deposit found for reference ${reference}`);
          return res.json({ received: true });
        }

        if (deposit.status === "approved" || deposit.status === "rejected") {
          return res.json({ received: true }); // already processed
        }

        if (event === "payment.completed" || status === "completed") {
          const claimedDeposit = await storage.claimDepositApproval(deposit.id);
          if (claimedDeposit) await creditApprovedDeposit(claimedDeposit);
        } else if (event === "payment.failed" || event === "payment.expired" || status === "failed" || status === "cancelled") {
          await storage.updateDeposit(deposit.id, { status: "rejected", processedAt: new Date() });
        }

        res.json({ received: true });
      } catch (error: any) {
        console.error("[sendavapay webhook] error:", error);
        res.status(500).json({ message: error.message });
      }
    }
  );

  // ── WestPay: payment callback (redirect after user pays on WestPay page) ────
  app.get("/api/westpay/callback", async (req, res) => {
    try {
      const { depositId, status, ref } = req.query as Record<string, string>;
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      if (!depositId) return res.redirect(`${baseUrl}/deposit?wp_status=error`);
      const deposit = await storage.getDeposit(parseInt(depositId));
      if (!deposit) return res.redirect(`${baseUrl}/deposit?wp_status=error`);
      // Persist the WestPay transaction reference; webhook will approve
      if (ref && (deposit.status === "pending" || deposit.status === "processing")) {
        await storage.updateDeposit(deposit.id, { westpayReference: ref });
      }
      const wpStatus = status === "success" ? "success" : "pending";
      res.redirect(`${baseUrl}/deposit?wp_status=${wpStatus}&wp_depositId=${depositId}`);
    } catch (err: any) {
      console.error("[westpay callback] error:", err);
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      res.redirect(`${baseUrl}/deposit?wp_status=error`);
    }
  });

  // ── WestPay webhook (HMAC-SHA256 via X-RobotPay-Signature) ──────────────────
  app.post(
    "/api/webhooks/westpay",
    async (req, res) => {
      try {
        const secret = process.env.WESTPAY_WEBHOOK_SECRET || "";
        if (!secret) {
          console.error("[westpay webhook] Webhook secret not configured");
          return res.status(503).json({ message: "Webhook secret non configuré" });
        }
        const sig = (req.headers["x-robotpay-signature"] as string) || "";
        // req.rawBody is captured by the global express.json verify callback
        const rawBuf = (req as any).rawBody as Buffer | undefined;
        if (secret && rawBuf && !westpayVerifySignature(rawBuf, sig, secret)) {
          console.warn("[westpay webhook] Signature invalide");
          return res.status(401).json({ message: "Signature invalide" });
        }
        const payload = req.body;
        const { event, txId, status } = payload;
        const transactionReference =
          txId || payload.transactionId || payload.reference || payload.ref;
        if (!transactionReference) return res.json({ received: true });
        const deposit = await storage.getDepositByWestpayReference(transactionReference);
        if (!deposit) {
          console.warn(`[westpay webhook] Aucun dépôt pour référence: ${transactionReference}`);
          return res.json({ received: true });
        }
        if (deposit.status === "approved" || deposit.status === "rejected") {
          return res.json({ received: true });
        }
        if (event === "payment.confirmed" || status === "confirmed") {
          const claimedDeposit = await storage.claimDepositApproval(deposit.id);
          if (claimedDeposit) await creditApprovedDeposit(claimedDeposit);
        } else if (
          event === "payment.failed" ||
          event === "payment.expired" ||
          status === "failed" ||
          status === "expired" ||
          status === "cancelled"
        ) {
          await storage.updateDeposit(deposit.id, { status: "rejected", processedAt: new Date() });
        }
        res.json({ received: true });
      } catch (err: any) {
        console.error("[westpay webhook] error:", err);
        res.status(500).json({ message: err.message });
      }
    }
  );

  // ── InPay webhooks (POST application/x-www-form-urlencoded, MD5 signature) ──
  app.post("/api/webhooks/inpay", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      const payload = (req.body || {}) as Record<string, unknown>;
      const account = inpayFindVerifiedAccount(payload, settings);
      if (!account) {
        console.warn("[inpay webhook] Signature invalide ou merchant inconnu");
        return res.status(401).send("fail");
      }

      const outTradeNo = String(payload.out_trade_no || "");
      if (!outTradeNo) return res.send("success");

      // Both callback formats can contain order_number. Use our own reference
      // prefix first so a payin callback can never be mistaken for a payout.
      const callbackType = String(payload.type || payload.trade_type || "").toLowerCase();
      const callbackStatus = String(payload.status || "").toLowerCase();
      const isPayout =
        outTradeNo.startsWith("PAYOUT-") ||
        callbackType.includes("payout") ||
        callbackStatus.startsWith("payout");
      if (isPayout) {
        const withdrawal = await storage.getWithdrawalByInpayOutTradeNo(outTradeNo);
        if (!withdrawal) return res.send("success");

        const status = mapInpayPayoutStatus(payload.status || payload.trade_status || payload.result);
        if (status === "approved") {
          await storage.claimWithdrawalFinalization(withdrawal.id, "approved");
        } else if (status === "rejected" || String(payload.is_reverse) === "2") {
          const claimed = await storage.claimWithdrawalFinalization(withdrawal.id, "rejected");
          if (claimed) await refundRejectedWithdrawal(claimed);
        }
        return res.send("success");
      }

      const deposit = await storage.getDepositByInpayOutTradeNo(outTradeNo);
      if (!deposit) return res.send("success");

      const status = mapInpayPayinStatus(payload.status || payload.trade_status || payload.result);
      if (status === "approved") {
        const claimed = await storage.claimDepositApproval(deposit.id);
        if (claimed) await creditApprovedDeposit(claimed);
      } else if (status === "rejected") {
        await storage.updateDeposit(deposit.id, { status: "rejected", processedAt: new Date() });
      }
      return res.send("success");
    } catch (error: any) {
      console.error("[inpay webhook] error:", error);
      return res.status(500).send("fail");
    }
  });

  // Withdrawals
  app.get("/api/withdrawals/available", requireAuth, async (req, res) => {
    try {
      const availableBalance = await storage.getWithdrawableBalance(req.session.userId!);
      res.json({ availableBalance });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/withdrawal-fee/prepare", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Non authentifié" });
      const settings = await storage.getSettings();
      if (settings.withdrawalPrepaymentEnabled !== "true") {
        return res.status(400).json({ message: "Le prépaiement des retraits est désactivé." });
      }
      const withdrawalAmount = Number(req.body.amount);
      if (!Number.isInteger(withdrawalAmount) || withdrawalAmount <= 0) {
        return res.status(400).json({ message: "Montant de retrait invalide" });
      }
      const withdrawableBalance = parseFloat(await storage.getWithdrawableBalance(user.id));
      if (withdrawalAmount > withdrawableBalance) {
        return res.status(400).json({ message: "Le montant des dépôts n'est pas retirable" });
      }
      const { payment, requiredAmount } = await prepareWithdrawalFeePayment(user.id, withdrawalAmount);
      res.json({
        paymentId: payment.id,
        status: payment.status,
        withdrawalAmount,
        requiredAmount,
        rate: WITHDRAWAL_PREPAYMENT_RATE,
        paymentUrl: `/robotpay?amount=${requiredAmount}&country=${encodeURIComponent(user.country)}&feePaymentId=${payment.id}&withdrawalAmount=${withdrawalAmount}`,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/withdrawals", requireAuth, async (req, res) => {
    try {
      const { amount } = req.body;
      const numericAmount = Number(amount);
      const user = await storage.getUser(req.session.userId!);
      
      if (!user) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const settingsForWithdrawal = await storage.getSettings();
      const minWithdrawal = parseInt(settingsForWithdrawal.minWithdrawal || "800");
      const withdrawalPrepaymentEnabled = settingsForWithdrawal.withdrawalPrepaymentEnabled === "true";
      if (!Number.isInteger(numericAmount) || numericAmount < minWithdrawal) {
        return res.status(400).json({ message: `Montant minimum: ${minWithdrawal} FCFA` });
      }

      if (!user.hasActiveProduct) {
        return res.status(400).json({ message: "Achetez d'abord un produit" });
      }

      if (user.isWithdrawalBlocked) {
        return res.status(400).json({ message: "Retraits bloqués sur ce compte" });
      }

      if (user.mustInviteToWithdraw) {
        const stats = await storage.getTeamStats(user.id);
        if (stats.level1Invested < 1) {
          return res.status(400).json({ message: "Invitez quelqu'un qui investit" });
        }
      }

       const withdrawableBalance = parseFloat(await storage.getWithdrawableBalance(user.id));
       if (numericAmount > withdrawableBalance) {
         return res.status(400).json({ message: "Le montant des dépôts n'est pas retirable" });
      }
       const balance = parseFloat(user.balance);

      const requestedWalletId = req.body.walletId;
      let wallet: Awaited<ReturnType<typeof storage.getDefaultWallet>>;
      if (requestedWalletId !== undefined && requestedWalletId !== null) {
        const walletId = Number(requestedWalletId);
        if (!Number.isInteger(walletId) || walletId < 1) {
          return res.status(400).json({ message: "Compte de retrait invalide." });
        }
        const userWallets = await storage.getWallets(user.id);
        wallet = userWallets.find((savedWallet) => savedWallet.id === walletId);
        if (!wallet) {
          return res.status(400).json({ message: "Ce portefeuille ne vous appartient pas." });
        }
      } else {
        wallet = await storage.getDefaultWallet(user.id);
      }
      if (!wallet) {
        return res.status(400).json({ message: "Enregistrez un portefeuille de retrait" });
      }

      const activeCountries = await storage.getActiveCountries();
      const walletCountry = activeCountries.find(
        (country) => country.code.toUpperCase() === wallet.country.toUpperCase(),
      );
      if (!walletCountry) {
        return res.status(400).json({ message: "Le pays de ce portefeuille n'est plus disponible pour les retraits." });
      }
      let configuredMethods: string[] = [];
      try {
        const parsedMethods: unknown = JSON.parse(walletCountry.operators);
        if (Array.isArray(parsedMethods)) {
          configuredMethods = parsedMethods.filter((method): method is string => typeof method === "string");
        }
      } catch {
        configuredMethods = [];
      }
      const withdrawalMethods = getWithdrawalMethods(walletCountry.code, configuredMethods);
      if (!isAllowedWithdrawalMethod(walletCountry.code, wallet.paymentMethod, configuredMethods)) {
        return res.status(400).json({
          message: `Le moyen ${wallet.paymentMethod} n'est plus autorisé pour les retraits au ${walletCountry.name}. Ajoutez un portefeuille avec : ${withdrawalMethods.join(", ")}.`,
        });
      }

      const todayCount = await storage.getUserWithdrawalCountToday(user.id);
      const settingsForMax = await storage.getSettings();
      const maxPerDay = parseInt(settingsForMax.maxWithdrawalsPerDay || "1");
      if (todayCount >= maxPerDay) {
        return res.status(400).json({ message: `Maximum ${maxPerDay} retrait${maxPerDay > 1 ? 's' : ''} par jour` });
      }

      if (withdrawalPrepaymentEnabled) {
        const { payment: feePayment, requiredAmount } = await prepareWithdrawalFeePayment(user.id, numericAmount);
        if (feePayment.status !== "paid") {
          return res.status(402).json({
            code: "WITHDRAWAL_PREPAYMENT_REQUIRED",
            message: `Vous devez payer ${requiredAmount} FCFA (25 % du montant du retrait) avant de lancer le retrait.`,
            paymentId: feePayment.id,
            requiredAmount,
            paymentUrl: `/robotpay?amount=${requiredAmount}&country=${encodeURIComponent(user.country)}&feePaymentId=${feePayment.id}&withdrawalAmount=${numericAmount}`,
          });
        }
        const claimedFeePayment = await storage.claimWithdrawalFeePayment(user.id, numericAmount);
        if (!claimedFeePayment) {
          return res.status(402).json({
            code: "WITHDRAWAL_PREPAYMENT_REQUIRED",
            message: "Le paiement préalable doit être approuvé avant de lancer le retrait.",
            paymentId: feePayment.id,
            requiredAmount,
            paymentUrl: `/robotpay?amount=${requiredAmount}&country=${encodeURIComponent(user.country)}&feePaymentId=${feePayment.id}&withdrawalAmount=${numericAmount}`,
          });
        }
      }

      const settings = await storage.getSettings();
       const fees = parseFloat(settings.withdrawalFees || "16");
      const feeAmount = Math.round(numericAmount * fees / 100);
      const netAmount = numericAmount - feeAmount;

      // Deduct from balance
      await storage.updateUser(user.id, {
        balance: (balance - numericAmount).toFixed(2),
      });

      const withdrawal = await storage.createWithdrawal({
        userId: user.id,
        amount: numericAmount,
        netAmount,
        fees: feeAmount,
        accountName: wallet.accountName,
        accountNumber: wallet.accountNumber,
        country: wallet.country,
        paymentMethod: wallet.paymentMethod,
        status: "pending",
      });

      res.json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/withdrawals/history", requireAuth, async (req, res) => {
    try {
      const withdrawals = await storage.getUserWithdrawals(req.session.userId!);
      res.json(withdrawals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Wallets
  app.get("/api/wallets", requireAuth, async (req, res) => {
    try {
      const wallets = await storage.getWallets(req.session.userId!);
      res.json(wallets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/wallets", requireAuth, async (req, res) => {
    try {
      const parsedWallet = walletSchema.safeParse(req.body);
      if (!parsedWallet.success) {
        return res.status(400).json({ message: parsedWallet.error.errors[0]?.message || "Données invalides" });
      }
      const activeCountries = await storage.getActiveCountries();
      const walletCountry = activeCountries.find(
        (country) => country.code.toUpperCase() === parsedWallet.data.country.toUpperCase(),
      );
      if (!walletCountry) {
        return res.status(400).json({ message: "Pays indisponible pour les retraits." });
      }
      let configuredMethods: string[] = [];
      try {
        const parsedMethods: unknown = JSON.parse(walletCountry.operators);
        if (Array.isArray(parsedMethods)) {
          configuredMethods = parsedMethods.filter((method): method is string => typeof method === "string");
        }
      } catch {
        configuredMethods = [];
      }
      const withdrawalMethods = getWithdrawalMethods(walletCountry.code, configuredMethods);
      if (!isAllowedWithdrawalMethod(walletCountry.code, parsedWallet.data.paymentMethod, configuredMethods)) {
        return res.status(400).json({
          message: `Pour ${walletCountry.name}, choisissez un moyen de retrait autorisé : ${withdrawalMethods.join(", ") || "aucun moyen configuré"}.`,
        });
      }
      const wallet = await storage.createWallet({
        userId: req.session.userId!,
        ...parsedWallet.data,
      });
      res.json(wallet);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/wallets/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteWallet(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/wallets/:id/default", requireAuth, async (req, res) => {
    try {
      await storage.setDefaultWallet(req.session.userId!, parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Team
  app.get("/api/team/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getTeamStats(req.session.userId!);
      res.json(stats);
    } catch (error) {
      console.error("[team] Unable to load team statistics:", error);
      res.status(500).json({ message: "Impossible de charger les statistiques de l'équipe" });
    }
  });

  app.get("/api/team/details", requireAuth, async (req, res) => {
    try {
      const team = await storage.getDetailedTeam(req.session.userId!);
      res.json(team);
    } catch (error) {
      console.error("[team] Unable to load team details:", error);
      res.status(500).json({ message: "Impossible de charger les membres de l'équipe" });
    }
  });

  // Tasks
  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getTasksWithStatus(req.session.userId!);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tasks/:id/claim", requireAuth, async (req, res) => {
    try {
      await storage.claimTask(req.session.userId!, parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Daily bonus claim (random 20–50 FCFA every 24h)
  app.post("/api/claim-daily-bonus", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouve" });
      }

      const now = new Date();
      const lastClaim = user.lastDailyBonusClaim ? new Date(user.lastDailyBonusClaim) : null;
      
      if (lastClaim) {
        const hoursSinceClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
        if (hoursSinceClaim < 24) {
          const hoursRemaining = Math.ceil(24 - hoursSinceClaim);
          return res.status(400).json({ 
            message: `Vous pouvez reclamer dans ${hoursRemaining}h`,
            canClaim: false,
            nextClaimIn: hoursRemaining
          });
        }
      }

      // Award a random whole amount between 20 and 50 FCFA, inclusive.
      const bonusAmount = Math.floor(Math.random() * 31) + 20;
      const newBalance = parseFloat(user.balance) + bonusAmount;
      await storage.updateUser(user.id, { 
        balance: newBalance.toString(),
        lastDailyBonusClaim: now
      });

      // Create transaction record
      await storage.createTransaction({
        userId: user.id,
        type: "bonus",
        amount: String(bonusAmount),
        description: "Bonus quotidien"
      });

      res.json({
        success: true,
        amount: bonusAmount,
        message: `Bonus de ${bonusAmount} FCFA ajoute!`,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/daily-bonus-status", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouve" });
      }

      const now = new Date();
      const lastClaim = user.lastDailyBonusClaim ? new Date(user.lastDailyBonusClaim) : null;
      
      let canClaim = true;
      let hoursRemaining = 0;

      if (lastClaim) {
        const hoursSinceClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
        if (hoursSinceClaim < 24) {
          canClaim = false;
          hoursRemaining = Math.ceil(24 - hoursSinceClaim);
        }
      }

      const allTransactions = await storage.getUserTransactions(req.session.userId!);
      const bonusTransactions = allTransactions.filter(
        (t: any) => t.type === "bonus" && t.description === "Bonus quotidien"
      );
      const totalBonusClaimed = bonusTransactions.reduce(
        (sum: number, t: any) => sum + parseFloat(t.amount || "0"), 0
      );
      const daysPointed = bonusTransactions.length;

      res.json({ canClaim, hoursRemaining, totalBonusClaimed, daysPointed });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Transactions
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getUserTransactions(req.session.userId!);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(publicSettings(settings));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/settings/links", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json({
        supportLink: settings.supportLink || "https://t.me/intelappgroup",
        support2Link: settings.support2Link || "https://t.me/intelappgroup",
        channelLink: settings.channelLink || "https://t.me/intelappgroup",
        groupLink: settings.groupLink || "https://t.me/intelappgroup",
        supportType: settings.supportType || "telegram",
        support2Type: settings.support2Type || "telegram",
        channelType: settings.channelType || "telegram",
        groupType: settings.groupType || "telegram",
        supportLabel: settings.supportLabel || "Service client",
        support2Label: settings.support2Label || "Service client 2",
        channelLabel: settings.channelLabel || "Chaîne officielle",
        groupLabel: settings.groupLabel || "Groupe de discussion",
        withdrawalStartHour: settings.withdrawalStartHour || "9",
        withdrawalEndHour: settings.withdrawalEndHour || "17",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/settings/withdrawal", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json({
        withdrawalFees: parseFloat(settings.withdrawalFees || "16"),
        withdrawalStartHour: parseInt(settings.withdrawalStartHour || "9"),
        withdrawalEndHour: parseInt(settings.withdrawalEndHour || "17"),
        maxWithdrawalsPerDay: parseInt(settings.maxWithdrawalsPerDay || "1"),
        minWithdrawal: parseInt(settings.minWithdrawal || "800"),
        withdrawalPrepaymentEnabled: settings.withdrawalPrepaymentEnabled === "true",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const stats = await storage.getStats(startDate, endDate);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/deposits", requireAdmin, async (req, res) => {
    try {
      const status = req.query.status as string || "pending";
      const deposits = await storage.getDeposits(status === "pending" ? "pending" : undefined);
      const filtered = status === "all" ? deposits : deposits.filter(d => d.status === status);
      res.json(filtered);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/deposits/soleaspay-stats", requireAdmin, async (req, res) => {
    try {
      const allDeposits = await storage.getDeposits();
      const soleaspayDeposits = allDeposits.filter((d: any) => d.soleaspayReference || d.soleaspayOrderId);

      const approvedSoleaspay = soleaspayDeposits.filter((d: any) => d.status === "approved");
      const totalAll = approvedSoleaspay.reduce((sum: number, d: any) => sum + Number(d.amount), 0);
      const countAll = approvedSoleaspay.length;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const approvedToday = approvedSoleaspay.filter((d: any) => new Date(d.createdAt) >= today);
      const totalToday = approvedToday.reduce((sum: number, d: any) => sum + Number(d.amount), 0);
      const countToday = approvedToday.length;

      const pendingSoleaspay = soleaspayDeposits.filter((d: any) => d.status === "pending" || d.status === "processing");
      const totalPending = pendingSoleaspay.reduce((sum: number, d: any) => sum + Number(d.amount), 0);
      const countPending = pendingSoleaspay.length;

      res.json({
        totalAll,
        countAll,
        totalToday,
        countToday,
        totalPending,
        countPending,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/deposits/:id/approve", requireAdmin, async (req, res) => {
    try {
      const deposit = await storage.claimAdminDepositApproval(parseInt(req.params.id), req.session.userId!);
      if (!deposit) return res.status(409).json({ message: "Ce dépôt est déjà approuvé" });

      const user = await storage.getUser(deposit.userId);
      if (user) {
        if (deposit.withdrawalFeePaymentId) {
          await storage.markWithdrawalFeePaymentPaid(deposit.withdrawalFeePaymentId, deposit.id);
        } else {
          const newBalance = parseFloat(user.balance) + deposit.amount;
          await storage.updateUser(user.id, {
            balance: newBalance.toFixed(2),
            hasDeposited: true,
          });

          await storage.createTransaction({
            userId: user.id,
            type: "deposit",
            amount: deposit.amount.toString(),
            description: "Dépôt validé",
          });
          await storage.processDepositReferralCommissions(deposit.userId, deposit.amount);
        }
      }

      await storage.logAdminAction(req.session.userId!, "approve_deposit", deposit.userId, `Dépôt ${deposit.id} approuvé: ${deposit.amount}F`);
      res.json(deposit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/deposits/:id/reject", requireAdmin, async (req, res) => {
    try {
      const { ban } = req.body;
      const deposit = await storage.updateDeposit(parseInt(req.params.id), {
        status: "rejected",
        processedAt: new Date(),
        processedBy: req.session.userId,
        screenshot: null,
      });

      if (ban) {
        await storage.updateUser(deposit.userId, { isBanned: true });
        await storage.logAdminAction(req.session.userId!, "ban_user", deposit.userId, `Utilisateur banni pour fraude`);
      }

      await storage.logAdminAction(req.session.userId!, "reject_deposit", deposit.userId, `Dépôt ${deposit.id} rejeté`);
      res.json(deposit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/verify-pin", requireAuth, async (req, res) => {
    try {
      const { pin } = req.body;
      const user = await storage.getUser(req.session.userId!);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Acces refuse" });
      }
      
      // If password is not required for this admin, auto-verify
      if (user.isAdminPasswordRequired === false) {
        return res.json({ success: true });
      }

      if (!user.adminPin) {
        return res.status(400).json({ message: "Code PIN non configure" });
      }
      
      if (user.adminPin !== pin) {
        return res.status(401).json({ message: "Code PIN incorrect" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/withdrawals", requireAdmin, async (req, res) => {
    try {
      const status = req.query.status as string || "pending";
      const withdrawals = await storage.getWithdrawals(status === "pending" ? "pending" : undefined);
      const filtered = status === "all" ? withdrawals : withdrawals.filter(w => w.status === status);
      res.json(filtered);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/withdrawals/:id/approve", requireAdmin, async (req, res) => {
    try {
      const withdrawalId = parseInt(req.params.id);
      const existingWithdrawal = await storage.getWithdrawals();
      const withdrawalData = existingWithdrawal.find(w => w.id === withdrawalId);
      
      if (!withdrawalData) {
        return res.status(404).json({ message: "Retrait non trouve" });
      }

      const withdrawal = await storage.updateWithdrawal(withdrawalId, {
        status: "approved",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });

      await storage.logAdminAction(req.session.userId!, "approve_withdrawal", withdrawalData.userId, `Retrait ${withdrawal.id} approuvé: ${withdrawalData.netAmount}F`);
      res.json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/withdrawals/:id/reject", requireAdmin, async (req, res) => {
    try {
      const withdrawal = await storage.updateWithdrawal(parseInt(req.params.id), {
        status: "rejected",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });

      // Refund the user
      const user = await storage.getUser(withdrawal.userId);
      if (user) {
        const newBalance = parseFloat(user.balance) + withdrawal.amount;
        await storage.updateUser(user.id, { balance: newBalance.toFixed(2) });
      }

      await storage.logAdminAction(req.session.userId!, "reject_withdrawal", withdrawal.userId, `Retrait ${withdrawal.id} rejeté et remboursé`);
      res.json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/withdrawals/:id/inpay", requireAdmin, async (req, res) => {
    try {
      const withdrawalId = parseInt(req.params.id);
      const allWithdrawals = await storage.getWithdrawals();
      const withdrawal = allWithdrawals.find((item) => item.id === withdrawalId);
      if (!withdrawal) return res.status(404).json({ message: "Retrait non trouvé" });
      if (withdrawal.status !== "pending") {
        return res.status(409).json({ message: "Ce retrait a déjà été traité ou envoyé" });
      }

      const settings = await storage.getSettings();
      const country = withdrawal.country.trim().toUpperCase();
      if (!isInpayCountryEnabled(country, settings) || !isInpayConfigured(country)) {
        return res.status(400).json({ message: `InPay n'est pas configuré pour ${country}` });
      }
      const account = getInpayAccount(country);
      const bankCode = inpayResolveBankCode(country, withdrawal.paymentMethod);
      const outTradeNo = inpayCreateOutTradeNo("PAYOUT", withdrawal.id, withdrawal.userId);
      const result = await inpayCreatePayout({
        amount: withdrawal.netAmount,
        country,
        merchantId: account.merchantId,
        apiKey: account.apiKey,
        customerName: withdrawal.accountName,
        customerMobile: withdrawal.accountNumber,
        customerEmail: `user${withdrawal.userId}@tonnew.app`,
        bankCode,
        accountNumber: withdrawal.accountNumber,
        notificationUrl: `${getPublicBaseUrl(req)}/api/webhooks/inpay`,
        outTradeNo,
      });
      const updated = await storage.updateWithdrawal(withdrawal.id, {
        status: "processing",
        inpayOutTradeNo: outTradeNo,
        inpayOrderNumber: result.orderNumber || null,
      });
      await storage.logAdminAction(
        req.session.userId!,
        "send_withdrawal_to_inpay",
        withdrawal.userId,
        `Retrait ${withdrawal.id} envoyé à InPay (${country})`,
      );
      res.json(updated);
    } catch (error: any) {
      void sendTelegramInpayError({
        operation: "Retrait payout",
        error,
        recordId: req.params.id,
      }).catch((notificationError) => {
        console.error("[telegram] InPay payout error notification failed:", notificationError.message);
      });
      console.error("[inpay] payout error:", error);
      res.status(400).json({ message: error.message || "Erreur d'envoi InPay" });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const search = (req.query.search as string) || "";
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      
      const { users: allUsers, total } = await storage.getAllUsers(search, limit, offset);
      const usersWithTeam = await Promise.all(allUsers.map(async (user) => {
        const teamStats = await storage.getTeamStatsSimple(user.id);
        return { ...user, password: undefined, ...teamStats, referrerName: null };
      }));
      res.json({ users: usersWithTeam, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/users/:id/team", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const team = await storage.getDetailedTeam(userId);
      res.json(team);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users/:id/:action", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const action = req.params.action;
      const { value } = req.body;
      const adminUser = await storage.getUser(req.session.userId!);

      switch (action) {
        case "balance":
          await storage.updateUser(userId, { balance: value.toFixed(2) });
          await storage.logAdminAction(req.session.userId!, "update_balance", userId, `Solde modifié: ${value}F`);
          break;
        case "password":
          await storage.updateUser(userId, { password: value });
          await storage.logAdminAction(req.session.userId!, "reset_password", userId, `Mot de passe réinitialisé`);
          break;
        case "toggle-ban":
          const user1 = await storage.getUser(userId);
          await storage.updateUser(userId, { isBanned: !user1?.isBanned });
          await storage.logAdminAction(req.session.userId!, "toggle_ban", userId, `Statut banni: ${!user1?.isBanned}`);
          break;
        case "toggle-withdrawal":
          const user2 = await storage.getUser(userId);
          await storage.updateUser(userId, { isWithdrawalBlocked: !user2?.isWithdrawalBlocked });
          await storage.logAdminAction(req.session.userId!, "toggle_withdrawal", userId, `Retrait bloqué: ${!user2?.isWithdrawalBlocked}`);
          break;
        case "toggle-promoter":
          const user3 = await storage.getUser(userId);
          await storage.updateUser(userId, { isPromoter: !user3?.isPromoter, promoterSetBy: req.session.userId });
          await storage.logAdminAction(req.session.userId!, "toggle_promoter", userId, `Promoteur: ${!user3?.isPromoter}`);
          break;
        case "toggle-must-invite":
          const user4 = await storage.getUser(userId);
          await storage.updateUser(userId, { mustInviteToWithdraw: !user4?.mustInviteToWithdraw });
          await storage.logAdminAction(req.session.userId!, "toggle_must_invite", userId, `Doit inviter: ${!user4?.mustInviteToWithdraw}`);
          break;
        case "toggle-admin":
          if (!adminUser?.isSuperAdmin) {
            return res.status(403).json({ message: "Action réservée au super admin" });
          }
          const user5 = await storage.getUser(userId);
          const newAdminStatus = !user5?.isAdmin;
          await storage.updateUser(userId, { 
            isAdmin: newAdminStatus,
            adminSetBy: req.session.userId,
            adminSetAt: new Date(),
            adminPin: newAdminStatus && value ? value : null,
          });
          await storage.logAdminAction(req.session.userId!, "toggle_admin", userId, `Admin: ${newAdminStatus}`);
          break;
        case "update-admin-pin":
          if (!adminUser?.isSuperAdmin) {
            return res.status(403).json({ message: "Action réservée au super admin" });
          }
          await storage.updateUser(userId, { adminPin: value });
          await storage.logAdminAction(req.session.userId!, "update_admin_pin", userId, `PIN admin mis à jour`);
          break;
        case "toggle-password-required":
          if (!adminUser?.isSuperAdmin) {
            return res.status(403).json({ message: "Action réservée au super admin" });
          }
          await storage.updateUser(userId, { isAdminPasswordRequired: value });
          await storage.logAdminAction(req.session.userId!, "toggle_password_required", userId, `Mot de passe admin requis: ${value}`);
          break;
        case "assign-product":
          await storage.purchaseProduct(userId, value, true);
          await storage.logAdminAction(req.session.userId!, "assign_product", userId, `Produit ${value} attribué`);
          break;
        case "revoke-product":
          await storage.removeUserProduct(userId, value);
          await storage.logAdminAction(req.session.userId!, "revoke_product", userId, `Produit ${value} révoqué`);
          break;
        case "toggle-super-admin":
          if (!adminUser?.isSuperAdmin) {
            return res.status(403).json({ message: "Action réservée au super admin" });
          }
          const userSA = await storage.getUser(userId);
          const newSuperAdminStatus = !userSA?.isSuperAdmin;
          await storage.updateUser(userId, {
            isSuperAdmin: newSuperAdminStatus,
            isAdmin: newSuperAdminStatus ? true : userSA?.isAdmin,
          });
          await storage.logAdminAction(req.session.userId!, "toggle_super_admin", userId, `Super Admin: ${newSuperAdminStatus}`);
          break;
        case "toggle-banker":
          if (!adminUser?.isSuperAdmin && !adminUser?.isAdmin) {
            return res.status(403).json({ message: "Action réservée aux admins" });
          }
          const userBanker = await storage.getUser(userId);
          const newBankerStatus = !userBanker?.isBanker;
          await storage.updateUser(userId, { 
            isBanker: newBankerStatus,
            bankerSetBy: newBankerStatus ? req.session.userId : null,
          });
          await storage.logAdminAction(req.session.userId!, "toggle_banker", userId, `Bankier: ${newBankerStatus}`);
          break;
        default:
          return res.status(400).json({ message: "Action invalide" });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/products/all", requireAdmin, async (req, res) => {
    try {
      const allProducts = await storage.getProducts(true);
      res.json(allProducts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/users/:id/products", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userProductsList = await storage.getAllUserProducts(userId);
      res.json(userProductsList.map(up => ({
        id: up.userProduct.id,
        productId: up.userProduct.productId,
        productName: up.product.name,
        productPrice: up.product.price,
        dailyEarnings: up.product.dailyEarnings,
        isActive: up.userProduct.isActive,
        purchaseDate: up.userProduct.purchaseDate,
        daysClaimed: up.product.cycleDays - up.userProduct.daysRemaining,
        totalCycle: up.product.cycleDays,
      })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const { name, price, dailyEarnings, cycleDays, imageUrl, sortOrder, isFree, isActive } = req.body ?? {};
      const isFreeProduct = isFree === true || isFree === "true";
      const priceInt = Number(price);
      const dailyInt = Number(dailyEarnings);
      const cycleInt = Number(cycleDays);
      const sortOrderInt = sortOrder === undefined ? 0 : Number(sortOrder);
      if (
        typeof name !== "string" || !name.trim() ||
        !Number.isInteger(priceInt) || priceInt < 0 ||
        (isFreeProduct ? priceInt !== 0 : priceInt <= 0) ||
        !Number.isInteger(dailyInt) || dailyInt < 0 ||
        !Number.isInteger(cycleInt) || cycleInt <= 0 ||
        !Number.isInteger(sortOrderInt) || sortOrderInt < 0 ||
        (imageUrl !== undefined && imageUrl !== null && typeof imageUrl !== "string")
      ) {
        return res.status(400).json({
          message: "Vérifiez le nom, le prix, les gains, la durée et l’ordre du produit.",
        });
      }
      if (isActive !== undefined && typeof isActive !== "boolean") {
        return res.status(400).json({ message: "La visibilité du produit est invalide." });
      }
      const product = await storage.createProduct({
        name: name.trim(),
        price: priceInt,
        dailyEarnings: dailyInt,
        cycleDays: cycleInt,
        totalReturn: dailyInt * cycleInt,
        imageUrl: typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null,
        isFree: isFreeProduct,
        isActive: isActive !== false,
        sortOrder: sortOrderInt,
      });
      await storage.logAdminAction(req.session.userId!, "create_product", null, `Produit ${product.name} créé`);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "Identifiant de produit invalide." });
      }
      const current = await storage.getProduct(id);
      if (!current) {
        return res.status(404).json({ message: "Produit introuvable." });
      }

      const body = req.body ?? {};
      const editableKeys = new Set([
        "name", "price", "dailyEarnings", "cycleDays", "totalReturn",
        "imageUrl", "sortOrder", "isFree", "isActive",
      ]);
      const unknownKeys = Object.keys(body).filter((key) => !editableKeys.has(key));
      if (unknownKeys.length > 0) {
        return res.status(400).json({ message: `Champ(s) produit non autorisé(s) : ${unknownKeys.join(", ")}` });
      }

      const name = body.name === undefined ? current.name : body.name;
      const price = Number(body.price === undefined ? current.price : body.price);
      const dailyEarnings = Number(body.dailyEarnings === undefined ? current.dailyEarnings : body.dailyEarnings);
      const cycleDays = Number(body.cycleDays === undefined ? current.cycleDays : body.cycleDays);
      const sortOrder = Number(body.sortOrder === undefined ? current.sortOrder : body.sortOrder);
      const isFree = body.isFree === undefined ? current.isFree : body.isFree;
      const isActive = body.isActive === undefined ? current.isActive : body.isActive;
      const imageUrl = body.imageUrl === undefined ? current.imageUrl : body.imageUrl;
      if (
        typeof name !== "string" || !name.trim() ||
        !Number.isInteger(price) || price < 0 ||
        (isFree ? price !== 0 : price <= 0) ||
        !Number.isInteger(dailyEarnings) || dailyEarnings < 0 ||
        !Number.isInteger(cycleDays) || cycleDays <= 0 ||
        !Number.isInteger(sortOrder) || sortOrder < 0 ||
        typeof isFree !== "boolean" ||
        typeof isActive !== "boolean" ||
        (imageUrl !== null && typeof imageUrl !== "string")
      ) {
        return res.status(400).json({ message: "Les valeurs du produit sont invalides." });
      }

      const product = await storage.updateProduct(id, {
        name: name.trim(),
        price,
        dailyEarnings,
        cycleDays,
        totalReturn: dailyEarnings * cycleDays,
        imageUrl: typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null,
        sortOrder,
        isFree,
        isActive,
      });
      await storage.logAdminAction(req.session.userId!, "update_product", null, `Produit ${product.id} modifié`);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      await storage.logAdminAction(req.session.userId!, "delete_product", null, `Produit ${id} supprimé`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/channels", requireAdmin, async (req, res) => {
    try {
      const channels = await storage.getPaymentChannels();
      res.json(channels);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/channels", requireAdmin, async (req, res) => {
    try {
      const channel = await storage.createPaymentChannel({
        ...req.body,
        modifiedBy: req.session.userId,
      });
      await storage.logAdminAction(req.session.userId!, "create_channel", null, `Canal ${channel.name} créé`);
      res.json(channel);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/channels/:id", requireAdmin, async (req, res) => {
    try {
      const channel = await storage.updatePaymentChannel(parseInt(req.params.id), {
        ...req.body,
        modifiedBy: req.session.userId,
      });
      await storage.logAdminAction(req.session.userId!, "update_channel", null, `Canal ${channel.name} modifié`);
      res.json(channel);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/channels/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deletePaymentChannel(parseInt(req.params.id));
      await storage.logAdminAction(req.session.userId!, "delete_channel", null, `Canal supprimé`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      const countries = await storage.getCountries();
      const explicitRouting = parseDepositMethodsByCountry(settings.depositMethodsByCountry);
      const routing = explicitRouting || {};
      if (!explicitRouting) {
        const paymentNumbers = await storage.getPaymentNumbers();
        for (const country of countries) {
          const code = country.code.trim().toUpperCase();
          routing[code] = DEPOSIT_METHOD_IDS.filter((method) => {
            if (method === "manual") {
              return paymentNumbers.some((number) =>
                number.isActive && number.country.toUpperCase() === code
              );
            }
            return isLegacyDepositMethodAssigned(method, code, settings);
          });
        }
      } else {
        for (const country of countries) {
          const code = country.code.trim().toUpperCase();
          routing[code] ||= [];
        }
      }
      res.json({
        ...adminSettings(settings),
        depositMethodsByCountry: JSON.stringify(routing),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/inpay/balance/:country", requireAdmin, async (req, res) => {
    const country = String(req.params.country).trim().toUpperCase();
    try {
      const settings = await storage.getSettings();
      if (!isInpayConfigured(country)) {
        return res.status(400).json({ message: `InPay n'est pas configuré pour ${country}` });
      }
      const account = getInpayAccount(country);
      const balance = await inpayGetBalance({
        merchantId: account.merchantId,
        apiKey: account.apiKey,
      });
      res.json({ country, name: inpayGetCountryName(country), balance });
    } catch (error: any) {
      void sendTelegramInpayError({
        operation: "Consultation du solde",
        error,
        country,
      }).catch((notificationError) => {
        console.error("[telegram] InPay balance error notification failed:", notificationError.message);
      });
      console.error("[inpay] balance error:", error);
      res.status(502).json({ message: error.message || "Impossible de consulter le solde InPay" });
    }
  });

  app.get("/api/admin/blocked-ips", requireAdmin, async (_req, res) => {
    try {
      res.json(await getCachedBlockedIps());
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/blocked-ips", requireAdmin, async (req, res) => {
    try {
      const ip = String(req.body?.ip || "").trim();
      const net = await import("net");
      if (!net.isIP(ip)) return res.status(400).json({ message: "Adresse IP invalide" });
      const blockedIps = [...await getCachedBlockedIps()];
      if (!blockedIps.includes(ip)) {
        blockedIps.push(ip);
        await storage.setSetting("blockedIps", JSON.stringify(blockedIps), req.session.userId);
        updateBlockedIpsCache(blockedIps);
      }
      await storage.logAdminAction(req.session.userId!, "block_ip", null, `Adresse IP bloquée: ${ip}`);
      res.json({ success: true, ip });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/blocked-ips/:ip", requireAdmin, async (req, res) => {
    try {
      const ip = decodeURIComponent(req.params.ip);
      const blockedIps = await getCachedBlockedIps();
      const nextIps = blockedIps.filter((value) => value !== ip);
      await storage.setSetting("blockedIps", JSON.stringify(nextIps), req.session.userId);
      updateBlockedIpsCache(nextIps);
      await storage.logAdminAction(req.session.userId!, "unblock_ip", null, `Adresse IP débloquée: ${ip}`);
      res.json({ success: true, ip });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const entries = Object.entries(req.body ?? {});
      const unknownKeys = entries
        .map(([key]) => key)
        .filter((key) => !isAdminSettingKey(key));
      if (unknownKeys.length > 0) {
        return res.status(400).json({
          message: `Paramètre(s) non reconnu(s) : ${unknownKeys.join(", ")}`,
        });
      }
      const routingEntry = entries.find(([key]) => key === "depositMethodsByCountry");
      let normalizedRouting: Record<string, DepositMethodId[]> | undefined;
      if (routingEntry) {
        if (typeof routingEntry[1] !== "string") {
          return res.status(400).json({ message: "La configuration des méthodes de dépôt doit être du JSON texte" });
        }
        normalizedRouting = parseDepositMethodsByCountry(routingEntry[1] as string);
        if (!normalizedRouting) {
          return res.status(400).json({ message: "La configuration des méthodes de dépôt est vide" });
        }
        const countryCodes = new Set(
          (await storage.getCountries()).map((country) => country.code.trim().toUpperCase()),
        );
        const unknownCountries = Object.keys(normalizedRouting).filter((code) => !countryCodes.has(code));
        if (unknownCountries.length > 0) {
          return res.status(400).json({
            message: `Pays de routage inconnus : ${unknownCountries.join(", ")}`,
          });
        }
      }
      for (const [key, value] of entries) {
        if (SENSITIVE_SETTING_KEYS.has(key) && (value === "" || value === MASKED_SETTING_VALUE)) continue;
        const serializedValue = key === "depositMethodsByCountry" && normalizedRouting
          ? JSON.stringify(normalizedRouting)
          : value as string;
        await storage.setSetting(key, serializedValue, req.session.userId);
      }
      await storage.logAdminAction(req.session.userId!, "update_settings", null, `Paramètres modifiés`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Reset stats route (Super Admin only)
  app.post("/api/admin/reset-stats", requireAdmin, async (req, res) => {
    try {
      const adminUser = await storage.getUser(req.session.userId!);
      if (!adminUser?.isSuperAdmin) {
        return res.status(403).json({ message: "Action réservée au super admin" });
      }

      await storage.resetStats();
      await storage.logAdminAction(req.session.userId!, "reset_stats", null, "Réinitialisation des statistiques de la plateforme");
      res.json({ success: true, message: "Statistiques réinitialisées" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Gift Codes Routes
  app.get("/api/admin/gift-codes", requireAdmin, async (req, res) => {
    try {
      const codes = await storage.getAllGiftCodes();
      res.json(codes);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const createGiftCodeSchema = z.object({
    code: z.string().min(1, "Le code est requis"),
    amount: z.number().positive("Le montant doit etre positif").or(z.string().transform(Number)),
    maxUses: z.number().int().positive("Le nombre d'utilisations doit etre positif"),
    expiresAt: z.string().refine((val) => !isNaN(Date.parse(val)), "Date d'expiration invalide"),
  });

  app.post("/api/admin/gift-codes", requireAdmin, async (req, res) => {
    try {
      const parseResult = createGiftCodeSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Donnees invalides" });
      }

      const { code, amount, maxUses, expiresAt } = parseResult.data;

      const existingCode = await storage.getGiftCodeByCode(code);
      if (existingCode) {
        return res.status(400).json({ message: "Ce code existe deja" });
      }

      const giftCode = await storage.createGiftCode({
        code,
        amount: amount.toString(),
        maxUses,
        expiresAt: new Date(expiresAt),
        createdBy: req.session.userId!,
      });

      await storage.logAdminAction(req.session.userId!, "create_gift_code", null, `Code cadeau cree: ${code} - ${amount} FCFA`);
      res.json(giftCode);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/gift-codes/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGiftCode(id);
      await storage.logAdminAction(req.session.userId!, "delete_gift_code", null, `Code cadeau supprimé: #${id}`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const claimGiftCodeSchema = z.object({
    code: z.string().min(1, "Le code est requis"),
  });

  app.post("/api/gift-codes/claim", requireAuth, async (req, res) => {
    try {
      const parseResult = claimGiftCodeSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Le code est requis" });
      }

      const code = parseResult.data.code.trim().toUpperCase();
      const userId = req.session.userId!;

      const giftCode = await storage.getGiftCodeByCode(code);
      if (!giftCode) {
        return res.status(404).json({ message: "Code invalide" });
      }

      if (!giftCode.isActive) {
        return res.status(400).json({ message: "Ce code n'est plus actif" });
      }

      if (new Date() > new Date(giftCode.expiresAt)) {
        return res.status(400).json({ message: "Ce code a expiré" });
      }

      if (giftCode.currentUses >= giftCode.maxUses) {
        return res.status(400).json({ message: "Ce code a atteint sa limite d'utilisation" });
      }

      const hasClaimed = await storage.hasUserClaimedGiftCode(userId, giftCode.id);
      if (hasClaimed) {
        return res.status(400).json({ message: "Vous avez déjà utilisé ce code" });
      }

      await storage.claimGiftCode(userId, giftCode.id, parseFloat(giftCode.amount));
      
      res.json({ 
        success: true, 
        message: `Félicitations! Vous avez reçu ${parseFloat(giftCode.amount).toLocaleString()} FCFA`,
        amount: parseFloat(giftCode.amount)
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Countries routes (public)
  app.get("/api/countries", async (req, res) => {
    try {
      const activeCountries = await storage.getActiveCountries();
      res.json(activeCountries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/clapay/webhook", async (req, res) => {
    if (!isClapayConfigured()) {
      return res.status(503).json({ message: "La configuration API de Clapay est incomplète" });
    }
    if (!verifyClapayWebhookSignature(req.body, req.get("Nowallet-Signature"))) {
      return res.status(401).json({ message: "Signature Clapay invalide" });
    }

    const body = req.body as Record<string, unknown>;
    const transactionId = typeof body.transaction_id === "string" ? body.transaction_id : "";
    const signature = typeof body.signature === "string" ? body.signature : "";
    const referenceMatch = transactionId.match(/^CLAPAY-(\d+)-\d+$/);
    if (!referenceMatch || !signature) {
      return res.status(400).json({ message: "Référence de transaction Clapay invalide" });
    }

    const depositId = Number(referenceMatch[1]);
    if (!Number.isSafeInteger(depositId) || depositId <= 0) {
      return res.status(400).json({ message: "Identifiant de dépôt Clapay invalide" });
    }

    let deposit: Awaited<ReturnType<typeof storage.getDeposit>> | undefined;
    try {
      deposit = await storage.getDeposit(depositId);
      if (!deposit || !deposit.paymentMethod.startsWith("Clapay — ")) {
        return res.status(404).json({ message: "Dépôt Clapay introuvable" });
      }
      if (deposit.status === "approved" || deposit.status === "rejected") {
        return res.json({ received: true, status: deposit.status });
      }
      if (deposit.reference !== signature && deposit.reference !== transactionId) {
        return res.status(409).json({ message: "La signature Clapay ne correspond pas au dépôt" });
      }

      if (deposit.reference === transactionId) {
        await storage.updateDeposit(deposit.id, { reference: signature });
      }
      const verification = await checkClapayPayment(signature);
      if (verification.status === "approved") {
        const claimedDeposit = await storage.claimDepositApproval(deposit.id);
        if (claimedDeposit) await creditApprovedDeposit(claimedDeposit);
      } else if (verification.status === "rejected") {
        await storage.updateDeposit(deposit.id, { status: "rejected", processedAt: new Date() });
      }
      const finalDeposit = await storage.getDeposit(deposit.id);
      return res.json({ received: true, status: finalDeposit?.status || deposit.status });
    } catch (error: any) {
      console.error("[clapay] webhook verification error:", error);
      notifyTelegramPaymentError({
        operation: "Vérification du webhook Clapay",
        error,
        recordId: depositId,
        userId: deposit?.userId,
        paymentMethod: "Clapay",
      });
      return res.status(502).json({ message: "Impossible de confirmer la notification Clapay" });
    }
  });

  app.get("/api/clapay/operators/:country", requireAuth, async (req, res) => {
    try {
      const country = String(req.params.country || "").trim().toUpperCase();
      const activeCountries = await storage.getActiveCountries();
      if (!activeCountries.some((entry) => entry.code.toUpperCase() === country)) {
        return res.status(404).json({ message: "Pays indisponible" });
      }
      const settings = await storage.getSettings();
      if (!isDepositMethodConfigured(country, "clapay", settings)) {
        return res.status(403).json({ message: "Clapay n'est pas configuré pour ce pays" });
      }
      if (!isClapayConfigured()) {
        return res.status(503).json({ message: "La configuration API de Clapay est incomplète dans Plesk" });
      }
      const operators = await getClapayOperators(country);
      res.json({ operators });
    } catch (error: any) {
      res.status(502).json({ message: error.message || "Impossible de charger les opérateurs Clapay" });
    }
  });

  app.post("/api/clapay/initiate", requireAuth, async (req, res) => {
    let depositId: number | undefined;
    let providerMayHaveAcceptedInitiation = false;
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Non authentifié" });

      const country = String(req.body.country || "").trim().toUpperCase();
      const operatorId = String(req.body.operatorId || "").trim();
      const operatorName = String(req.body.operatorName || "").trim();
      const rawPhone = String(req.body.phone || "").trim();
      const amount = Number(req.body.amount);
      const activeCountries = await storage.getActiveCountries();
      const selectedCountry = activeCountries.find((entry) => entry.code.toUpperCase() === country);
      if (!selectedCountry) {
        return res.status(400).json({ message: "Pays indisponible" });
      }
      const settings = await storage.getSettings();
      if (!isDepositMethodConfigured(country, "clapay", settings)) {
        return res.status(403).json({ message: "Clapay n'est pas configuré pour ce pays" });
      }
      if (!isClapayConfigured()) {
        return res.status(503).json({ message: "La configuration API de Clapay est incomplète dans Plesk" });
      }
      if (!Number.isInteger(amount) || amount <= 0) {
        return res.status(400).json({ message: "Montant invalide" });
      }
      const feePaymentId = req.body.feePaymentId === undefined || req.body.feePaymentId === null
        ? undefined
        : Number(req.body.feePaymentId);
      const requestedWithdrawalAmount = Number(req.body.withdrawalAmount);
      const returnWithdrawalAmount = Number.isFinite(requestedWithdrawalAmount) && requestedWithdrawalAmount > 0
        ? requestedWithdrawalAmount
        : undefined;
      const withdrawalFeePayment = feePaymentId === undefined
        ? undefined
        : await validateWithdrawalFeePayment(user.id, feePaymentId, amount);
      const minDeposit = parseInt(settings.minDeposit || "3500", 10);
      if (!withdrawalFeePayment && amount < minDeposit) {
        return res.status(400).json({ message: `Montant minimum : ${minDeposit.toLocaleString()} FCFA` });
      }
      if (!operatorId || !operatorName) {
        return res.status(400).json({ message: "Sélectionnez un opérateur Clapay" });
      }
      const parsedPhone = phoneNumberSchema.safeParse(rawPhone);
      if (!parsedPhone.success) {
        return res.status(400).json({ message: "Le numéro de téléphone est invalide" });
      }

      const operators = await getClapayOperators(country);
      const selectedOperator = operators.find((entry) => entry.id === operatorId);
      if (!selectedOperator || selectedOperator.name !== operatorName) {
        return res.status(400).json({ message: "Cet opérateur Clapay n'est plus disponible" });
      }
      const operatorOtp = selectedOperator.requiresOtp ? String(req.body.operatorOtp || "").trim() : "";
      if (selectedOperator.requiresOtp && !operatorOtp) {
        return res.status(400).json({ message: "Saisissez le code OTP demandé par cet opérateur" });
      }

      const deposit = await storage.createDeposit({
        userId: user.id,
        amount,
        accountName: user.fullName,
        accountNumber: parsedPhone.data,
        country,
        paymentMethod: `Clapay — ${operatorName}`,
        status: "processing",
        withdrawalFeePaymentId: withdrawalFeePayment?.id,
      });
      depositId = deposit.id;
      const orderReference = `CLAPAY-${deposit.id}-${Date.now()}`;
      await storage.updateDeposit(deposit.id, { reference: orderReference });
      const configuredPublicUrl = new URL(getPublicBaseUrl(req));
      if (configuredPublicUrl.protocol !== "https:") {
        throw new Error("L’URL publique du site doit utiliser HTTPS pour Clapay");
      }
      const publicBaseUrl = configuredPublicUrl.origin;
      const returnUrl = new URL("/robotpay", publicBaseUrl);
      returnUrl.searchParams.set("amount", String(amount));
      returnUrl.searchParams.set("country", country);
      returnUrl.searchParams.set("provider", "clapay");
      returnUrl.searchParams.set("clapayDepositId", String(deposit.id));
      if (feePaymentId !== undefined) returnUrl.searchParams.set("feePaymentId", String(feePaymentId));
      if (returnWithdrawalAmount !== undefined) {
        returnUrl.searchParams.set("withdrawalAmount", String(returnWithdrawalAmount));
      }
      const nameParts = user.fullName.trim().split(/\s+/).filter(Boolean);
      const accountFirstName = nameParts[0] || user.fullName;
      const accountLastName = nameParts.slice(1).join(" ") || accountFirstName;
      const payment = await initiateClapayPayment({
        amount,
        country,
        operator: operatorName,
        operatorId,
        operatorName,
        ...(operatorOtp ? { operatorOtp } : {}),
        phone: parsedPhone.data,
        accountNumber: parsedPhone.data,
        countryPhonePrefix: selectedCountry.phonePrefix,
        accountName: user.fullName,
        accountFirstName,
        accountLastName,
        accountEmail: `user${user.id}@chargepoint.app`,
        reference: orderReference,
        depositId: deposit.id,
        callbackUrl: new URL("/api/clapay/webhook", publicBaseUrl).toString(),
        returnUrl: returnUrl.toString(),
      });
      providerMayHaveAcceptedInitiation = true;
      await storage.updateDeposit(deposit.id, { reference: payment.signature });
      return res.json({
        depositId: deposit.id,
        redirectUrl: payment.redirectUrl,
        message: payment.message || "Confirmez le paiement sur votre téléphone.",
      });
    } catch (error: any) {
      const initiationMayHaveReachedProvider =
        providerMayHaveAcceptedInitiation || error?.requestMayHaveReachedProvider === true;
      if (depositId && !initiationMayHaveReachedProvider) {
        await storage.updateDeposit(depositId, { status: "rejected", processedAt: new Date() }).catch(() => undefined);
      }
      console.error("[clapay] initiation error:", error);
      const telegramError = typeof error?.providerDetail === "string"
        ? new Error(`${error.message || "Erreur Clapay"} — détail Clapay : ${error.providerDetail}`)
        : error;
      notifyTelegramPaymentError({
        operation: "Initiation du dépôt Clapay",
        error: telegramError,
        recordId: depositId,
        userId: req.session.userId,
        amount: req.body?.amount,
        country: req.body?.country,
        paymentMethod: req.body?.operatorName || "Clapay",
      });
      if (depositId && initiationMayHaveReachedProvider) {
        return res.status(202).json({
          depositId,
          message: "L’état de la demande est incertain. Ne relancez pas le paiement; la vérification se poursuit automatiquement.",
        });
      }
      return res.status(502).json({ message: error.message || "Impossible d'initier le paiement Clapay" });
    }
  });

  app.get("/api/deposits/:id/clapay-status", requireAuth, async (req, res) => {
    try {
      const depositId = Number(req.params.id);
      if (!Number.isInteger(depositId) || depositId <= 0) {
        return res.status(400).json({ message: "Identifiant de dépôt invalide" });
      }
      const deposit = await storage.getDeposit(depositId);
      if (!deposit) return res.status(404).json({ message: "Dépôt non trouvé" });
      if (deposit.userId !== req.session.userId) return res.status(403).json({ message: "Accès refusé" });
      if (!deposit.paymentMethod.startsWith("Clapay — ")) {
        return res.status(400).json({ message: "Ce dépôt ne provient pas de Clapay" });
      }
      if (deposit.status === "approved" || deposit.status === "rejected") {
        return res.json({ status: deposit.status });
      }
      if (!deposit.reference) return res.json({ status: deposit.status });
      if (deposit.reference.startsWith(`CLAPAY-${deposit.id}-`)) {
        return res.json({ status: deposit.status });
      }

      const verification = await checkClapayPayment(deposit.reference);
      if (verification.status === "approved") {
        const claimedDeposit = await storage.claimDepositApproval(deposit.id);
        if (claimedDeposit) await creditApprovedDeposit(claimedDeposit);
      } else if (verification.status === "rejected") {
        await storage.updateDeposit(deposit.id, { status: "rejected", processedAt: new Date() });
      }
      const finalDeposit = await storage.getDeposit(deposit.id);
      return res.json({
        status: finalDeposit?.status || deposit.status,
        providerStatus: verification.rawStatus,
      });
    } catch (error: any) {
      console.error("[clapay] status verification error:", error);
      notifyTelegramPaymentError({
        operation: "Vérification du dépôt Clapay",
        error,
        recordId: req.params.id,
        userId: req.session.userId,
        paymentMethod: "Clapay",
      });
      return res.status(502).json({ message: error.message || "Erreur de vérification Clapay" });
    }
  });

  app.get("/api/deposit/provider/:country", requireAuth, async (req, res) => {
    try {
      const country = String(req.params.country || "").trim().toUpperCase();
      const active = await storage.getActiveCountries();
      if (!active.some(c => c.code.toUpperCase() === country)) {
        return res.status(404).json({ message: "Pays indisponible" });
      }
      const settings = await storage.getSettings();
      const providers: Array<{ provider: "ashtech" | "sendavapay" | "clapay"; name: string }> = [];
      for (const provider of ["ashtech", "sendavapay", "clapay"] as const) {
        if (
          isDepositMethodConfigured(country, provider, settings) &&
          (provider !== "clapay" || isClapayConfigured())
        ) {
          providers.push({ provider, name: getDepositMethodName(provider, settings) });
        }
      }
      const requestedProvider = typeof req.query.provider === "string"
        ? req.query.provider.trim().toLowerCase()
        : "";
      if (requestedProvider) {
        if (requestedProvider !== "ashtech" && requestedProvider !== "sendavapay" && requestedProvider !== "clapay") {
          return res.status(400).json({ message: "Fournisseur de dépôt invalide" });
        }
        if (!providers.some(({ provider }) => provider === requestedProvider)) {
          return res.status(403).json({ message: "Ce fournisseur n'est pas configuré pour ce pays" });
        }
        const selected = providers.find(({ provider }) => provider === requestedProvider)!;
        return res.json({ ...selected, providers: [selected] });
      }
      if (providers.length > 0) {
        return res.json({ ...providers[0], providers });
      }
      return res.status(503).json({ message: "Aucun fournisseur automatique disponible pour ce pays" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/deposit/methods/:country", requireAuth, async (req, res) => {
    try {
      const country = String(req.params.country || "").trim().toUpperCase();
      const activeCountries = await storage.getActiveCountries();
      if (!activeCountries.some((entry) => entry.code.toUpperCase() === country)) {
        return res.status(404).json({ message: "Pays indisponible" });
      }
      const settings = await storage.getSettings();
      const manualNumbers = await storage.getPaymentNumbersByCountry(country);
      const methods = getAssignedDepositMethods(country, settings)
        .filter((method) => isDepositProviderGloballyEnabled(method, settings))
        .filter((method) => method !== "manual" || manualNumbers.length > 0)
        .filter((method) => method !== "clapay" || isClapayConfigured())
        .map((provider) => ({ provider, name: getDepositMethodName(provider, settings) }));
      res.json({
        country,
        methods,
        source: settings.depositMethodsByCountry?.trim() ? "admin" : "legacy",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Impossible de charger les méthodes de dépôt" });
    }
  });

  // Admin country routes
  app.get("/api/admin/countries", requireAdmin, async (req, res) => {
    try {
      const allCountries = await storage.getCountries();
      res.json(allCountries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/countries", requireAdmin, async (req, res) => {
    try {
      const { code, name, currency, phonePrefix, operators, isActive } = req.body;
      if (!code || !name || !currency || !phonePrefix) {
        return res.status(400).json({ message: "Code, nom, devise et indicatif sont requis" });
      }
      const country = await storage.createCountry({
        code: code.toUpperCase(),
        name,
        currency,
        phonePrefix,
        operators: operators || "[]",
        isActive: isActive !== undefined ? isActive : true,
      });
      res.json(country);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/countries/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { code, name, currency, phonePrefix, operators, isActive } = req.body;
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (currency !== undefined) updateData.currency = currency;
      if (phonePrefix !== undefined) updateData.phonePrefix = phonePrefix;
      if (operators !== undefined) updateData.operators = operators;
      if (isActive !== undefined) updateData.isActive = isActive;
      const country = await storage.updateCountry(id, updateData);
      res.json(country);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/countries/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCountry(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ==================== BANKER ROUTES ====================
  // Accessible to both admins and bankers

  app.get("/api/banker/deposits", requireBanker, async (req, res) => {
    try {
      const deposits = await storage.getDeposits();
      res.json(deposits);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/banker/withdrawals", requireBanker, async (req, res) => {
    try {
      const withdrawals = await storage.getWithdrawals();
      res.json(withdrawals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/banker/deposits/:id/approve", requireBanker, async (req, res) => {
    try {
      const deposit = await storage.updateDeposit(parseInt(req.params.id), {
        status: "approved",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });
      const user = await storage.getUser(deposit.userId);
      if (user) {
        const newBalance = parseFloat(user.balance) + deposit.amount;
        await storage.updateUser(user.id, { balance: newBalance.toFixed(2), hasDeposited: true });
        await storage.createTransaction({ userId: user.id, type: "deposit", amount: deposit.amount.toString(), description: "Dépôt validé par bankier" });
      }
      await storage.logAdminAction(req.session.userId!, "approve_deposit", deposit.userId, `Dépôt ${deposit.id} approuvé par bankier: ${deposit.amount}F`);
      res.json(deposit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/banker/deposits/:id/reject", requireBanker, async (req, res) => {
    try {
      const deposit = await storage.updateDeposit(parseInt(req.params.id), {
        status: "rejected",
        processedAt: new Date(),
        processedBy: req.session.userId,
        screenshot: null,
      });
      await storage.logAdminAction(req.session.userId!, "reject_deposit", deposit.userId, `Dépôt ${deposit.id} rejeté par bankier`);
      res.json(deposit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/banker/withdrawals/:id/approve", requireBanker, async (req, res) => {
    try {
      const allWithdrawals = await storage.getWithdrawals();
      const withdrawalData = allWithdrawals.find(w => w.id === parseInt(req.params.id));
      if (!withdrawalData) return res.status(404).json({ message: "Retrait non trouvé" });
      const withdrawal = await storage.updateWithdrawal(parseInt(req.params.id), {
        status: "approved",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });
      await storage.logAdminAction(req.session.userId!, "approve_withdrawal", withdrawalData.userId, `Retrait ${withdrawal.id} approuvé par bankier: ${withdrawalData.netAmount}F`);
      res.json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/banker/withdrawals/:id/reject", requireBanker, async (req, res) => {
    try {
      const withdrawal = await storage.updateWithdrawal(parseInt(req.params.id), {
        status: "rejected",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });
      const user = await storage.getUser(withdrawal.userId);
      if (user) {
        const newBalance = parseFloat(user.balance) + withdrawal.amount;
        await storage.updateUser(user.id, { balance: newBalance.toFixed(2) });
      }
      await storage.logAdminAction(req.session.userId!, "reject_withdrawal", withdrawal.userId, `Retrait ${withdrawal.id} rejeté par bankier et remboursé`);
      res.json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  return httpServer;
}
