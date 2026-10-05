const TELEGRAM_API = "https://api.telegram.org";
import { storage } from "./storage";
import { CloudPayError, cloudPayAmountMatches, cloudPayQuery } from "./cloudpay";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function currencyForCountry(country?: unknown): string {
  return String(country ?? "PH").trim().toUpperCase() === "PH" ? "PHP" : "XOF";
}

export function isTelegramConfigured(): boolean {
  const isReplitDevelopment = Boolean(process.env.REPL_ID) && process.env.NODE_ENV !== "production";
  return !isReplitDevelopment
    && Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export async function sendTelegramMessage(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!isTelegramConfigured() || !token || !chatId) return;

  const response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Telegram HTTP ${response.status}: ${body.slice(0, 200)}`);
  }
}

export function formatTelegramValue(value: unknown): string {
  return escapeHtml(value);
}

async function telegramRequest(method: string, body: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  const response = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const responseBody = await response.text().catch(() => "");
    const safeBody = responseBody.replaceAll(token, "[redacted]").slice(0, 200);
    throw new Error(`Telegram ${method} HTTP ${response.status}${safeBody ? `: ${safeBody}` : ""}`);
  }
  return response.json() as Promise<{ ok: boolean; result?: any }>;
}

async function handleTelegramCommand(text: string, chatId: string) {
  const parts = text.trim().split(/\s+/);
  const command = parts[0].toLowerCase().split("@")[0];
  if (command === "/help" || command === "/start") {
    return [
      "🤖 <b>Commandes Stone by ton</b>",
      "/stats — statistiques de la plateforme",
      "/solde — soldes et montants en attente",
      "/pending — dépôts et retraits en attente",
      "/cloudpay CPD-… — vérifier un dépôt CloudPay",
      "/help — afficher cette aide",
    ].join("\n");
  }
  if (command === "/cloudpay") {
    const orderId = parts[1] || "";
    if (parts.length !== 2 || !/^CPD-[A-Za-z0-9-]{1,100}$/.test(orderId)) {
      return "Utilise : <code>/cloudpay CPD-...</code> avec la référence CloudPay du dépôt.";
    }

    const deposit = await storage.getDepositByCloudPayOrderId(orderId);
    if (!deposit || !isPhilippinesCountryCode(deposit.country)) {
      return `Aucun dépôt CloudPay des Philippines ne correspond à <code>${formatTelegramValue(orderId)}</code>.`;
    }

    try {
      const verification = await cloudPayQuery(orderId);
      const amountMatches = verification.amount === undefined
        ? null
        : cloudPayAmountMatches(verification.amount, deposit.amount);
      const statusMatches = deposit.status === verification.status ||
        (deposit.status === "processing" && verification.status === "pending");
      const amountComparison = amountMatches === null
        ? "montant non communiqué par CloudPay"
        : amountMatches
          ? "montant correspondant"
          : "⚠️ montant différent";

      return [
        "🔎 <b>Vérification du dépôt CloudPay</b>",
        `Référence : <code>${formatTelegramValue(orderId)}</code>`,
        `Dépôt local #${formatTelegramValue(deposit.id)} — ${formatTelegramValue(deposit.status)}`,
        `Statut CloudPay : <b>${formatTelegramValue(verification.status)}</b> (code ${formatTelegramValue(verification.providerStatus)})`,
        `Montant CloudPay : ${formatTelegramValue(verification.amount ?? "non communiqué")} PHP — attendu : ${formatTelegramValue(deposit.amount)} PHP`,
        `Contrôle du montant : ${amountComparison}`,
        ...(!statusMatches ? ["⚠️ Le statut CloudPay diffère du statut enregistré dans l’application."] : []),
        "Lecture seule : cette vérification ne modifie ni le statut local ni le solde.",
      ].join("\n");
    } catch (error) {
      if (error instanceof CloudPayError) {
        const details = [
          error.providerStatus ? `Code prestataire : ${formatTelegramValue(error.providerStatus)}` : "",
          error.providerHttpStatus !== undefined ? `HTTP : ${formatTelegramValue(error.providerHttpStatus)}` : "",
          error.providerMessage ? `Détail : ${formatTelegramValue(error.providerMessage)}` : "",
        ].filter(Boolean);
        return [
          "⚠️ <b>CloudPay n’a pas pu confirmer ce dépôt.</b>",
          formatTelegramValue(error.message),
          ...details,
        ].join("\n");
      }
      console.error("[telegram] CloudPay deposit query failed:", error);
      return "Impossible de vérifier ce dépôt auprès de CloudPay pour le moment.";
    }
  }
  if (command === "/stats") {
    const stats = await storage.getStats();
    return [
      "📊 <b>Statistiques</b>",
      `Utilisateurs : ${formatTelegramValue(stats.totalUsers)}`,
      `Nouveaux aujourd'hui : ${formatTelegramValue(stats.todayUsers)}`,
      `Utilisateurs avec produit : ${formatTelegramValue(stats.usersWithProducts)}`,
      `Dépôts approuvés : ${formatTelegramValue(stats.totalDeposits)} PHP`,
      `Retraits approuvés : ${formatTelegramValue(stats.totalWithdrawals)} PHP`,
    ].join("\n");
  }
  if (command === "/solde") {
    const stats = await storage.getStats();
    return [
      "💰 <b>État des montants</b>",
      `Dépôts en attente : ${formatTelegramValue(stats.pendingDeposits)} (${formatTelegramValue(stats.pendingDepositsCount)})`,
      `Retraits en attente : ${formatTelegramValue(stats.pendingWithdrawals)} (${formatTelegramValue(stats.pendingWithdrawalsCount)})`,
    ].join("\n");
  }
  if (command === "/pending") {
    const [deposits, withdrawals] = await Promise.all([
      storage.getDeposits("pending"),
      storage.getWithdrawals("pending"),
    ]);
    const depositLines = deposits.slice(0, 10).map((item) =>
      `• Dépôt #${formatTelegramValue(item.id)} — ${formatTelegramValue(item.amount)} ${currencyForCountry(item.country)} — ${formatTelegramValue(item.user?.fullName || "Utilisateur")}${
        item.cloudpayOrderId ? ` · <code>/cloudpay ${formatTelegramValue(item.cloudpayOrderId)}</code>` : ""
      }`,
    );
    const withdrawalLines = withdrawals.slice(0, 10).map((item) =>
      `• Retrait #${item.id} — ${item.amount} ${currencyForCountry(item.country)} — ${item.user?.fullName || "Utilisateur"}`,
    );
    return [
      "⏳ <b>Opérations en attente</b>",
      "<b>Dépôts</b>",
      ...(depositLines.length ? depositLines : ["Aucun dépôt en attente"]),
      "<b>Retraits</b>",
      ...(withdrawalLines.length ? withdrawalLines : ["Aucun retrait en attente"]),
    ].join("\n");
  }
  return "Commande inconnue. Utilise /help.";
}

export async function sendDailyTelegramSummary(): Promise<void> {
  if (!isTelegramConfigured()) return;
  const stats = await storage.getStats();
  await sendTelegramMessage([
    "📋 <b>Résumé détaillé de la plateforme</b>",
    `Utilisateurs : ${formatTelegramValue(stats.totalUsers)}`,
    `Nouveaux utilisateurs : ${formatTelegramValue(stats.todayUsers)}`,
    `Utilisateurs avec produit : ${formatTelegramValue(stats.usersWithProducts)}`,
    `Solde total : ${formatTelegramValue(stats.totalBalance)} PHP`,
    `Revenus totaux : ${formatTelegramValue(stats.totalEarnings)} PHP`,
    `Commissions : ${formatTelegramValue(stats.totalCommissions)} PHP`,
    `Dépôts du jour : ${formatTelegramValue(stats.todayDeposits)} PHP`,
    `Dépôts cumulés : ${formatTelegramValue(stats.totalDeposits)} PHP`,
    `Retraits du jour : ${formatTelegramValue(stats.todayWithdrawals)} PHP`,
    `Retraits cumulés : ${formatTelegramValue(stats.totalWithdrawals)} PHP`,
    `Dépôts en attente : ${formatTelegramValue(stats.pendingDeposits)} PHP (${formatTelegramValue(stats.pendingDepositsCount)})`,
    `Retraits en attente : ${formatTelegramValue(stats.pendingWithdrawals)} PHP (${formatTelegramValue(stats.pendingWithdrawalsCount)})`,
  ].join("\n"));
}

export async function sendTelegramSecurityAlert(ip: string, attemptMessage: string): Promise<void> {
  await sendTelegramMessage([
    "🚨 <b>Alerte de sécurité</b>",
    "Trop de tentatives de connexion administrateur ou utilisateur.",
    `Erreur : <code>${formatTelegramValue(attemptMessage)}</code>`,
    `Adresse IP : <code>${formatTelegramValue(ip)}</code>`,
    "Accès temporairement bloqué pendant 15 minutes.",
  ].join("\n"));
}

export async function sendTelegramInpayError(params: {
  operation: string;
  error: unknown;
  country?: string;
  amount?: unknown;
  reference?: unknown;
  recordId?: unknown;
  requestUrl?: unknown;
  requestData?: Record<string, unknown>;
  orderNumber?: unknown;
}): Promise<void> {
  const errorMessage = params.error instanceof Error
    ? params.error.message
    : String(params.error || "Erreur inconnue");
  await sendTelegramMessage([
    "❌ <b>Erreur InPay</b>",
    `Opération : ${formatTelegramValue(params.operation)}`,
    params.recordId !== undefined ? `ID : ${formatTelegramValue(params.recordId)}` : "",
    params.reference ? `Référence : ${formatTelegramValue(params.reference)}` : "",
    params.country ? `Pays : ${formatTelegramValue(params.country)}` : "",
    params.amount !== undefined ? `Montant : <b>${formatTelegramValue(params.amount)} ${currencyForCountry(params.country)}</b>` : "",
    params.orderNumber !== undefined
      ? `Numéro de commande marchand : <code>${formatTelegramValue(params.orderNumber)}</code>`
      : "",
    params.requestUrl
      ? `URL de requête : <code>${formatTelegramValue(params.requestUrl)}</code>`
      : "",
    params.requestData
      ? `Données envoyées :\n<pre>${formatTelegramValue(JSON.stringify(params.requestData, null, 2))}</pre>`
      : "",
    `Erreur exacte : <code>${formatTelegramValue(errorMessage)}</code>`,
  ].filter(Boolean).join("\n"));
}

export function startTelegramBot(): void {
  if (process.env.NODE_ENV !== "production") return;
  const tokenPresent = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const chatIdPresent = Boolean(process.env.TELEGRAM_CHAT_ID);
  if (!tokenPresent || !chatIdPresent) {
    const missing = [
      !tokenPresent ? "TELEGRAM_BOT_TOKEN" : "",
      !chatIdPresent ? "TELEGRAM_CHAT_ID" : "",
    ].filter(Boolean);
    console.error(`[telegram] command polling not started; missing ${missing.join(", ")}`);
    return;
  }
  console.info("[telegram] command polling started; credentials are configured");
  let updateOffset = 0;
  let polling = false;
  const poll = async () => {
    if (polling) return;
    polling = true;
    try {
      const response = await telegramRequest("getUpdates", {
        offset: updateOffset,
        timeout: 0,
        allowed_updates: ["message"],
      });
      for (const update of response?.result || []) {
        updateOffset = Math.max(updateOffset, Number(update.update_id) + 1);
        const message = update.message;
        if (!message?.text) continue;
        if (String(message.chat?.id) !== String(process.env.TELEGRAM_CHAT_ID)) {
          console.warn("[telegram] ignored command from a chat other than TELEGRAM_CHAT_ID");
          continue;
        }
        const reply = await handleTelegramCommand(message.text, String(message.chat.id));
        await telegramRequest("sendMessage", {
          chat_id: message.chat.id,
          text: reply,
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard: [[
              { text: "Ouvrir l'administration", url: `${process.env.PUBLIC_APP_URL || ""}/admin` },
            ]],
          },
        });
      }
    } catch (error: any) {
      console.error("[telegram] command polling failed:", error.message);
    } finally {
      polling = false;
    }
  };
  void poll();
  setInterval(() => void poll(), 5000);
}