const TELEGRAM_API = "https://api.telegram.org";

export type PaymentEvent = {
  kind: "deposit" | "withdrawal";
  phase: "created" | "status";
  id: number;
  userId: number;
  amount: number | string;
  status: string;
  country?: string | null;
  paymentMethod?: string | null;
  reference?: string | null;
  netAmount?: number | string | null;
  isWithdrawalFeePayment?: boolean;
};

export type BusinessEvent = {
  kind:
    | "registration"
    | "product_purchase"
    | "free_product_claim"
    | "staking_purchase"
    | "gift_code_claim"
    | "daily_bonus_claim"
    | "task_reward_claim";
  userId: number;
  country?: string | null;
  amount?: number | string | null;
  itemName?: string | null;
  itemId?: number | null;
};

const businessEventTitles: Record<BusinessEvent["kind"], string> = {
  registration: "Nouvelle inscription",
  product_purchase: "Nouvel achat de produit",
  free_product_claim: "Bonus de produit gratuit réclamé",
  staking_purchase: "Nouvelle souscription",
  gift_code_claim: "Code cadeau utilisé",
  daily_bonus_claim: "Bonus quotidien réclamé",
  task_reward_claim: "Récompense de tâche réclamée",
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function safeDisplayValue(value: unknown): string {
  return escapeHtml(
    String(value ?? "")
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120),
  );
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "En attente",
    processing: "En cours",
    approved: "Approuvé",
    rejected: "Rejeté",
  };
  return labels[status] || status;
}

function currencyForCountry(country?: string | null): string {
  return String(country ?? "PH").trim().toUpperCase() === "PH" ? "PHP" : "XOF";
}

function canSendTelegramNotifications(): boolean {
  return process.env.NODE_ENV === "production" || !process.env.REPL_ID;
}

async function logTelegramFailure(label: string, response: Response, token: string): Promise<void> {
  const body = await response.json().catch(() => null) as { description?: unknown } | null;
  const description = typeof body?.description === "string"
    ? body.description.replaceAll(token, "[redacted]").slice(0, 200)
    : "";
  console.error(
    `[telegram] ${label} failed (HTTP ${response.status})${description ? `: ${description}` : ""}`,
  );
}

export function notifyTelegramPaymentEvent(event: PaymentEvent): void {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!canSendTelegramNotifications() || !token || !chatId) return;

  const isDeposit = event.kind === "deposit";
  const title = event.isWithdrawalFeePayment
    ? (event.phase === "created" ? "Nouveau paiement de frais de retrait" : "Statut des frais de retrait modifié")
    : event.phase === "created"
      ? (isDeposit ? "Nouvelle demande de dépôt" : "Nouvelle demande de retrait")
      : (isDeposit ? "Statut du dépôt modifié" : "Statut du retrait modifié");
  const currency = currencyForCountry(event.country);
  const lines = [
    `${isDeposit ? "💳" : "💸"} <b>${title}</b>`,
    `ID : <code>${escapeHtml(event.id)}</code>`,
    `Utilisateur ID : <code>${escapeHtml(event.userId)}</code>`,
    `Montant : <b>${escapeHtml(event.amount)} ${currency}</b>`,
  ];

  if (!isDeposit && event.netAmount != null) {
    lines.push(`Net après frais : ${escapeHtml(event.netAmount)} ${currency}`);
  }
  if (event.paymentMethod) lines.push(`Méthode : ${escapeHtml(event.paymentMethod)}`);
  if (event.country) lines.push(`Pays : ${escapeHtml(event.country)}`);
  if (event.reference) lines.push(`Référence : <code>${escapeHtml(event.reference)}</code>`);
  if (event.isWithdrawalFeePayment) lines.push("Objet : paiement préalable requis pour un retrait");
  lines.push(`Statut : <b>${escapeHtml(statusLabel(event.status))}</b>`);

  void fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: lines.join("\n"),
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  }).then(async (response) => {
    if (!response.ok) {
      await logTelegramFailure("payment event notification", response, token);
    }
  }).catch((error) => {
    console.error("[telegram] payment event notification failed:", error instanceof Error ? error.message : error);
  });
}

export function notifyTelegramBusinessEvent(event: BusinessEvent): void {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!canSendTelegramNotifications() || !token || !chatId) return;

  const lines = [
    `🔔 <b>${businessEventTitles[event.kind]}</b>`,
    `Utilisateur ID : <code>${safeDisplayValue(event.userId)}</code>`,
  ];
  if (event.itemName) lines.push(`Élément : ${safeDisplayValue(event.itemName)}`);
  if (event.itemId != null) lines.push(`ID élément : <code>${safeDisplayValue(event.itemId)}</code>`);
  if (event.amount != null) lines.push(`Montant : <b>${safeDisplayValue(event.amount)} PHP</b>`);
  if (event.country) lines.push(`Pays : ${safeDisplayValue(event.country)}`);
  lines.push("Statut : <b>confirmé</b>");

  void fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: lines.join("\n"),
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  }).then(async (response) => {
    if (!response.ok) {
      await logTelegramFailure("business event notification", response, token);
    }
  }).catch((error) => {
    console.error("[telegram] business event notification failed:", error instanceof Error ? error.message : error);
  });
}

export function notifyTelegramPaymentError(params: {
  operation: string;
  error: unknown;
  recordId?: unknown;
  userId?: unknown;
  amount?: unknown;
  country?: unknown;
  paymentMethod?: unknown;
}): void {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!canSendTelegramNotifications() || !token || !chatId) return;

  const errorMessage = params.error instanceof Error
    ? params.error.message
    : String(params.error || "Erreur inconnue");
  const currency = currencyForCountry(typeof params.country === "string" ? params.country : undefined);
  const lines = [
    "❌ <b>Erreur de paiement</b>",
    `Opération : ${escapeHtml(params.operation)}`,
  ];
  if (params.recordId != null) lines.push(`ID : <code>${escapeHtml(params.recordId)}</code>`);
  if (params.userId != null) lines.push(`Utilisateur ID : <code>${escapeHtml(params.userId)}</code>`);
  if (params.amount != null) lines.push(`Montant : <b>${escapeHtml(params.amount)} ${currency}</b>`);
  if (params.country != null) lines.push(`Pays : ${escapeHtml(params.country)}`);
  if (params.paymentMethod != null) lines.push(`Méthode : ${escapeHtml(params.paymentMethod)}`);
  lines.push(`Erreur exacte : <code>${escapeHtml(errorMessage)}</code>`);

  void fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: lines.join("\n"),
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  }).then(async (response) => {
    if (!response.ok) {
      await logTelegramFailure("payment error notification", response, token);
    }
  }).catch((error) => {
    console.error("[telegram] payment error notification failed:", error instanceof Error ? error.message : error);
  });
}