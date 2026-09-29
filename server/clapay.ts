import { createHmac, timingSafeEqual } from "node:crypto";

type JsonRecord = Record<string, unknown>;

export type ClapayOperator = {
  id: string;
  name: string;
  requiresOtp: boolean;
};

type RequestValues = Record<string, string | number>;
type ClapayRequestError = Error & {
  httpStatus?: number;
  requestMayHaveReachedProvider?: boolean;
  providerDetail?: string;
};

type ClapayConfig = {
  baseUrl: URL;
  apiKey: string;
  authHeader: string;
  authPrefix: string;
  initiatePath: string;
  initiateBodyTemplate: unknown;
  initiateSignaturePath: string;
  initiateRedirectPath: string;
  initiateMessagePath: string;
  statusPath: string;
  statusBodyTemplate: unknown;
  statusValuePath: string;
  successStatuses: Set<string>;
  failureStatuses: Set<string>;
  operatorsPath: string;
  operatorsCountryParam: string;
  operatorsResponsePath: string;
  operatorIdPath: string;
  operatorNamePath: string;
  webhookSecret: string;
  webhookUniqueKey: string;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Clapay configuration is missing in Plesk: ${name}`);
  return value;
}

function parseJsonEnv(name: string): unknown {
  const raw = requiredEnv(name);
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`The Plesk variable ${name} must contain valid JSON`);
  }
}

function parseStatusSet(name: string, defaults: string[]): Set<string> {
  const raw = process.env[name]?.trim();
  const values = (raw ? raw.split(",") : defaults)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (!values.length) throw new Error(`The Plesk variable ${name} does not contain any statuses`);
  return new Set(values);
}

const DEFAULT_INITIATE_BODY_TEMPLATE: JsonRecord = {
  transaction_id: "{{reference}}",
  additional_infos: {
    customer_email: "{{accountEmail}}",
    customer_lastname: "{{accountLastName}}",
    customer_firstname: "{{accountFirstName}}",
    customer_phone: "{{phone}}",
  },
  amount: "{{amount}}",
  callback_url: "{{callbackUrl}}",
  return_url: "{{returnUrl}}",
  country_code: "{{country}}",
  operators_code: ["{{operatorId}}"],
  method: "MERCHANT",
  tunnel: "API",
};

function optionalJsonEnv(name: string, fallback: unknown): unknown {
  if (!process.env[name]?.trim()) return fallback;
  return parseJsonEnv(name);
}

function loadConfig(): ClapayConfig {
  const baseUrlRaw = process.env.CLAPAY_API_BASE_URL?.trim()
    || "https://nw-api.clapay.app/nowallet/api/v3";
  let baseUrl: URL;
  try {
    baseUrl = new URL(baseUrlRaw);
  } catch {
    throw new Error("CLAPAY_API_BASE_URL must be a valid URL");
  }
  if (baseUrl.protocol !== "https:") {
    throw new Error("CLAPAY_API_BASE_URL must use HTTPS");
  }
  baseUrl.pathname = `${baseUrl.pathname.replace(/\/+$/, "")}/`;

  const authHeader = process.env.CLAPAY_API_KEY_HEADER?.trim() || "Authorization";
  if (!/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(authHeader)) {
    throw new Error("CLAPAY_API_KEY_HEADER is not a valid HTTP header name");
  }

  return {
    baseUrl,
    apiKey: requiredEnv("CLAPAY_API_KEY"),
    authHeader,
    authPrefix: process.env.CLAPAY_API_KEY_PREFIX === undefined
      ? "Bearer"
      : process.env.CLAPAY_API_KEY_PREFIX.trim(),
    initiatePath: process.env.CLAPAY_INITIATE_PATH?.trim() || "init/payment",
    initiateBodyTemplate: optionalJsonEnv(
      "CLAPAY_INITIATE_REQUEST_TEMPLATE",
      DEFAULT_INITIATE_BODY_TEMPLATE,
    ),
    initiateSignaturePath: process.env.CLAPAY_INITIATE_SIGNATURE_PATH?.trim() || "signature",
    initiateRedirectPath: process.env.CLAPAY_INITIATE_REDIRECT_PATH?.trim() || "",
    initiateMessagePath: process.env.CLAPAY_INITIATE_MESSAGE_PATH?.trim() || "message",
    statusPath: process.env.CLAPAY_STATUS_PATH?.trim() || "check/status/payment",
    statusBodyTemplate: optionalJsonEnv(
      "CLAPAY_STATUS_REQUEST_TEMPLATE",
      { signature: "{{signature}}" },
    ),
    statusValuePath: process.env.CLAPAY_STATUS_VALUE_PATH?.trim() || "status",
    successStatuses: parseStatusSet("CLAPAY_STATUS_SUCCESS_VALUES", ["SUCCESSFUL"]),
    failureStatuses: parseStatusSet(
      "CLAPAY_STATUS_FAILURE_VALUES",
      ["FAILED", "SIGNATURE_DESTROYED"],
    ),
    operatorsPath: process.env.CLAPAY_OPERATORS_PATH?.trim() || "operators/data",
    operatorsCountryParam: process.env.CLAPAY_OPERATORS_COUNTRY_PARAM?.trim() || "country",
    operatorsResponsePath: process.env.CLAPAY_OPERATORS_RESPONSE_PATH?.trim() || "",
    operatorIdPath: process.env.CLAPAY_OPERATOR_ID_PATH?.trim() || "codeoperator",
    operatorNamePath: process.env.CLAPAY_OPERATOR_NAME_PATH?.trim() || "name",
    webhookSecret: requiredEnv("CLAPAY_WEBHOOK_SECRET"),
    webhookUniqueKey: requiredEnv("CLAPAY_WEBHOOK_UNIQUE_KEY"),
  };
}

export function isClapayConfigured(): boolean {
  try {
    loadConfig();
    return true;
  } catch {
    return false;
  }
}

function getAtPath(value: unknown, path: string): unknown {
  if (!path) return value;
  return path.split(".").filter(Boolean).reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as JsonRecord)[key];
  }, value);
}

function isAllowedClapayOperator(country: string, name: string): boolean {
  const normalizedCountry = country.trim().toUpperCase();
  const normalizedName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  switch (normalizedCountry) {
    case "BF":
      return normalizedName.includes("orange") || normalizedName.includes("moov");
    case "TG":
      return normalizedName.includes("tmoney");
    case "CI":
      return normalizedName.includes("wave");
    default:
      return true;
  }
}

function fillTemplate(template: unknown, values: RequestValues): unknown {
  if (Array.isArray(template)) return template.map((value) => fillTemplate(value, values));
  if (template && typeof template === "object") {
    return Object.fromEntries(
      Object.entries(template).map(([key, value]) => [key, fillTemplate(value, values)]),
    );
  }
  if (typeof template !== "string") return template;

  const exactMatch = template.match(/^\{\{([A-Za-z][A-Za-z0-9_]*)\}\}$/);
  if (exactMatch) {
    const value = values[exactMatch[1]];
    if (value === undefined) throw new Error(`Unknown Clapay variable: ${exactMatch[1]}`);
    return value;
  }
  return template.replace(/\{\{([A-Za-z][A-Za-z0-9_]*)\}\}/g, (_match, key: string) => {
    const value = values[key];
    if (value === undefined) throw new Error(`Unknown Clapay variable: ${key}`);
    return String(value);
  });
}

function endpointUrl(config: ClapayConfig, path: string): URL {
  const normalizedPath = path.trim();
  const url = /^\/nowallet\/api(?:\/|$)/.test(normalizedPath)
    ? new URL(normalizedPath, config.baseUrl.origin)
    : new URL(normalizedPath.replace(/^\/+/, ""), config.baseUrl);
  if (url.origin !== config.baseUrl.origin) {
    throw new Error("The Clapay API path must stay on the CLAPAY_API_BASE_URL host");
  }
  return url;
}

function sanitizeProviderDetail(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [redacted]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email redacted]")
    .replace(/\+?\d[\d .()-]{6,}\d/g, "[number redacted]")
    .replace(/((?:api[_-]?key|secret|token)\s*[:=]\s*)[^\s,;]+/gi, "$1[redacted]")
    .replace(/[\r\n\t]+/g, " ")
    .trim()
    .slice(0, 240);
}

function getProviderDetail(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return undefined;
  const record = payload as JsonRecord;
  const nestedError = record.error && typeof record.error === "object" && !Array.isArray(record.error)
    ? record.error as JsonRecord
    : undefined;
  const rawCode = record.error_code ?? record.code ?? nestedError?.error_code ?? nestedError?.code;
  const code = (typeof rawCode === "string" || typeof rawCode === "number")
    ? String(rawCode).trim()
    : "";
  const rawMessage = [
    record.message,
    record.error_description,
    record.detail,
    record.description,
    typeof record.error === "string" ? record.error : undefined,
    nestedError?.message,
  ].find((value): value is string => typeof value === "string" && value.trim().length > 0);
  const errorMessages = Array.isArray(record.errors)
    ? record.errors
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) return "";
        const message = (entry as JsonRecord).message;
        const field = (entry as JsonRecord).field;
        if (typeof message !== "string") return "";
        return typeof field === "string" && field.trim()
          ? `${field.trim()}: ${message}`
          : message;
      })
      .filter(Boolean)
      .slice(0, 3)
      .join("; ")
    : "";
  const message = rawMessage || errorMessages;
  const detail = [code ? `code ${code}` : "", message || ""].filter(Boolean).join(": ");
  const sanitized = sanitizeProviderDetail(detail);
  return sanitized || undefined;
}

async function callClapay(
  config: ClapayConfig,
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, string> } = {},
): Promise<unknown> {
  const url = endpointUrl(config, path);
  for (const [key, value] of Object.entries(options.query || {})) url.searchParams.set(key, value);

  const prefix = config.authPrefix
    ? `${config.authPrefix}${config.authPrefix.endsWith(" ") ? "" : " "}`
    : "";
  const headers: Record<string, string> = {
    Accept: "application/json",
    [config.authHeader]: `${prefix}${config.apiKey}`,
  };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method || (options.body === undefined ? "GET" : "POST"),
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch (error: any) {
    const reason = error?.name === "AbortError" ? "Request timed out" : "Connection failed";
    throw Object.assign(new Error(`Clapay : ${reason}`), {
      requestMayHaveReachedProvider: true,
    } satisfies Partial<ClapayRequestError>);
  } finally {
    clearTimeout(timeout);
  }

  let responseText: string;
  try {
    responseText = await response.text();
  } catch {
    throw Object.assign(
      new Error("Clapay interrupted its response"),
      { httpStatus: response.status, requestMayHaveReachedProvider: true } satisfies Partial<ClapayRequestError>,
    );
  }
  let payload: unknown;
  try {
    payload = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw Object.assign(
      new Error(`Clapay returned a non-JSON response (HTTP ${response.status})`),
      { httpStatus: response.status, requestMayHaveReachedProvider: true } satisfies Partial<ClapayRequestError>,
    );
  }
  if (!response.ok) {
    const providerDetail = getProviderDetail(payload);
    throw Object.assign(
      new Error(`Clapay rejected the request (HTTP ${response.status})`),
      {
        httpStatus: response.status,
        requestMayHaveReachedProvider: response.status >= 500,
        ...(providerDetail ? { providerDetail } : {}),
      } satisfies Partial<ClapayRequestError>,
    );
  }
  return payload;
}

export async function getClapayOperators(country: string): Promise<ClapayOperator[]> {
  const config = loadConfig();
  const data = await callClapay(config, config.operatorsPath, {
    query: { [config.operatorsCountryParam]: country.trim().toUpperCase() },
  });
  const configuredOperators = getAtPath(data, config.operatorsResponsePath);
  let rawOperators = Array.isArray(configuredOperators) ? configuredOperators : undefined;
  if (!rawOperators) {
    const commonList = [getAtPath(data, "operators"), getAtPath(data, "data")]
      .find(Array.isArray);
    if (Array.isArray(commonList)) rawOperators = commonList;
  }
  if (!rawOperators && data && typeof data === "object" && !Array.isArray(data)) {
    const id = getAtPath(data, config.operatorIdPath);
    const name = getAtPath(data, config.operatorNamePath);
    if ((typeof id === "string" || typeof id === "number") && typeof name === "string") {
      rawOperators = [data];
    }
  }
  if (!rawOperators) {
    throw new Error("The Clapay response does not contain the configured operator list");
  }

  const operators = rawOperators.map((operator) => {
    const id = getAtPath(operator, config.operatorIdPath);
    const name = getAtPath(operator, config.operatorNamePath);
    if ((typeof id !== "string" && typeof id !== "number") || typeof name !== "string") {
      throw new Error("A Clapay operator is missing the expected ID or name");
    }
    return {
      id: String(id),
      name,
      active: getAtPath(operator, "active"),
      requiresOtp: getAtPath(operator, "otpstarter.MERCHANT") === true,
    };
  });

  return operators
    .filter((operator) => operator.active !== false && isAllowedClapayOperator(country, operator.name))
    .map(({ id, name, requiresOtp }) => ({ id, name, requiresOtp }));
}

export async function initiateClapayPayment(values: RequestValues): Promise<{
  signature: string;
  redirectUrl?: string;
  message?: string;
}> {
  const config = loadConfig();
  const { countryPhonePrefix, ...templateValues } = values;
  const phonePrefix = String(countryPhonePrefix ?? "").replace(/\D/g, "");
  const normalizePhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return value.trim().startsWith("+") && phonePrefix && digits.startsWith(phonePrefix)
      ? digits.slice(phonePrefix.length)
      : digits;
  };
  const requestValues = {
    ...templateValues,
    ...(typeof values.phone === "string" ? { phone: normalizePhone(values.phone) } : {}),
    ...(typeof values.accountNumber === "string" ? { accountNumber: normalizePhone(values.accountNumber) } : {}),
  };
  const body = fillTemplate(config.initiateBodyTemplate, requestValues);
  const operatorOtp = values.operatorOtp;
  if (typeof operatorOtp === "string" && operatorOtp.trim()) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("The Clapay request template must be an object to send the operator OTP");
    }
    (body as JsonRecord).operator_otp = operatorOtp.trim();
  }
  const data = await callClapay(config, config.initiatePath, { method: "POST", body });
  const signature = getAtPath(data, config.initiateSignaturePath);
  if (typeof signature !== "string" && typeof signature !== "number") {
    throw Object.assign(
      new Error("The Clapay response does not contain the configured signature"),
      { requestMayHaveReachedProvider: true } satisfies Partial<ClapayRequestError>,
    );
  }
  const redirectValue = (config.initiateRedirectPath
    ? getAtPath(data, config.initiateRedirectPath)
    : undefined)
    ?? getAtPath(data, "payment_url_operator")
    ?? getAtPath(data, "payment_url");
  const messageValue = config.initiateMessagePath
    ? getAtPath(data, config.initiateMessagePath)
    : undefined;
  let redirectUrl: string | undefined;
  if (typeof redirectValue === "string" && redirectValue.trim()) {
    try {
      const parsedRedirectUrl = new URL(redirectValue);
      if (parsedRedirectUrl.protocol !== "https:") throw new Error();
      redirectUrl = parsedRedirectUrl.toString();
    } catch {
      throw Object.assign(
        new Error("Clapay returned an invalid payment URL"),
        { requestMayHaveReachedProvider: true } satisfies Partial<ClapayRequestError>,
      );
    }
  }
  return {
    signature: String(signature),
    redirectUrl,
    message: typeof messageValue === "string" ? messageValue : undefined,
  };
}

export async function checkClapayPayment(signature: string): Promise<{
  rawStatus: string;
  status: "approved" | "rejected" | "pending";
}> {
  const config = loadConfig();
  const body = fillTemplate(config.statusBodyTemplate, { signature });
  const data = await callClapay(config, config.statusPath, { method: "POST", body });
  const rawStatusValue = getAtPath(data, config.statusValuePath);
  if (typeof rawStatusValue !== "string" && typeof rawStatusValue !== "number") {
    throw new Error("The Clapay verification response does not contain the configured status");
  }
  const rawStatus = String(rawStatusValue);
  const normalizedStatus = rawStatus.trim().toLowerCase();
  const status = config.successStatuses.has(normalizedStatus)
    ? "approved"
    : config.failureStatuses.has(normalizedStatus)
      ? "rejected"
      : "pending";
  return { rawStatus, status };
}

export function verifyClapayWebhookSignature(body: unknown, headerValue: string | undefined): boolean {
  const webhookSecret = process.env.CLAPAY_WEBHOOK_SECRET?.trim();
  const webhookUniqueKey = process.env.CLAPAY_WEBHOOK_UNIQUE_KEY?.trim();
  if (!webhookSecret || !webhookUniqueKey || !headerValue || !body || typeof body !== "object") {
    return false;
  }

  let key: string | undefined;
  const signatures: string[] = [];
  for (const component of headerValue.split(",")) {
    const separator = component.indexOf("=");
    if (separator < 0) continue;
    const name = component.slice(0, separator).trim().toLowerCase();
    const value = component.slice(separator + 1).trim();
    if (name === "key") key = value;
    if (name === "signature" && value) signatures.push(value);
  }
  if (!key || !signatures.length) return false;

  const encryptedKey = createHmac("sha256", webhookUniqueKey).update(key).digest("hex");
  const serializedBody = JSON.stringify(body);
  if (typeof serializedBody !== "string") return false;
  const expected = createHmac("sha256", webhookSecret)
    .update(`${encryptedKey}${serializedBody}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return signatures.some((signature) => {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
    const actualBuffer = Buffer.from(signature, "hex");
    return actualBuffer.length === expectedBuffer.length
      && timingSafeEqual(actualBuffer, expectedBuffer);
  });
}