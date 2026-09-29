const WITHDRAWAL_METHOD_OVERRIDES: Readonly<Record<string, readonly string[]>> = {
  CI: ["Wave"],
  NE: ["Airtel Money", "NITA TRANSFERT"],
};

const CLOUDPAY_PH_WITHDRAWAL_METHODS = [
  "GCash", "BPI", "Metrobank", "Land Bank of the Philippines", "Security Bank",
  "UnionBank", "Philippine National Bank", "China Bank", "EastWest Bank", "RCBC",
  "UCPB", "PSBank", "Asia United Bank", "Philippine Bank of Communications",
  "Development Bank of the Philippines", "AllBank", "Asenso Rural Bank",
  "Banko Mabuhay", "Bank of Commerce", "BanKo", "Bayad", "BDO Network Bank",
  "Camalig Bank", "CARD Bank", "Cebuana Lhuillier Bank", "China Bank Savings",
  "Coins.ph", "CTBC Bank Philippines", "Dumaguete City Development Bank",
  "Dungganon Bank", "Equicom Savings Bank", "GrabPay", "ISLA Bank", "JuanCash",
  "Komo", "Legazpi Savings Bank", "Malayan Savings and Mortgage Bank",
  "Maybank Philippines", "Mindanao Consolidated Cooperative Bank", "Netbank",
  "OmniPay", "Partner Rural Bank", "Maya", "Philippine Business Bank",
  "Philippine Trust Company", "Producers Bank", "Queenbank",
  "Quezon Capital Rural Bank", "Robinsons Bank", "SeaBank", "ShopeePay",
  "Standard Chartered Bank", "Starpay", "Sterling Bank of Asia",
  "Sun Savings Bank", "TayoCash", "UCPB Savings Bank", "USSC Money Services",
  "Veterans Bank", "Wealth Development Bank", "Binangonan Rural Bank",
  "CARD SME Bank", "CIMB Philippines", "Entrepreneur Rural Bank", "GoTyme Bank",
  "I-Remit", "Infoserve / Nationlink", "Luzon Development Bank", "Maya Bank",
  "Pacific Ace Savings Bank", "PalawanPay", "Tonik Bank",
  "TraxionPay / DigiCOOP", "UnionDigital Bank",
];

export function getWithdrawalMethods(
  countryCode: string,
  configuredMethods: readonly string[] = [],
): string[] {
  const country = countryCode.trim().toUpperCase();
  if (country === "PH") {
    return Array.from(new Set([...configuredMethods, ...CLOUDPAY_PH_WITHDRAWAL_METHODS]));
  }
  const overrides = WITHDRAWAL_METHOD_OVERRIDES[country];
  return [...(overrides ?? configuredMethods)];
}

export function isAllowedWithdrawalMethod(
  countryCode: string,
  paymentMethod: string,
  configuredMethods: readonly string[] = [],
): boolean {
  const method = paymentMethod.trim().toLocaleLowerCase();
  return getWithdrawalMethods(countryCode, configuredMethods)
    .some((allowedMethod) => allowedMethod.trim().toLocaleLowerCase() === method);
}