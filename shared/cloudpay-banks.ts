export type CloudPayBank = {
  code: string;
  name: string;
  aliases?: readonly string[];
};

// Bank codes and names are taken from the supplied Galaxy System API document.
// Crypto rails are intentionally omitted because the current wallet form accepts
// bank/mobile-wallet account numbers, not blockchain addresses.
export const CLOUDPAY_BANKS: readonly CloudPayBank[] = [
  { code: "gcash", name: "GCash", aliases: ["G-Cash"] },
  { code: "bpi", name: "BPI", aliases: ["Bank of the Philippine Islands"] },
  { code: "mbt", name: "Metrobank", aliases: ["Metropolitan Bank"] },
  { code: "LBOB", name: "Land Bank of the Philippines", aliases: ["Landbank"] },
  { code: "SBC", name: "Security Bank", aliases: ["Security Bank Corporation"] },
  { code: "UBP", name: "UnionBank", aliases: ["Union Bank of the Philippines"] },
  { code: "PNB", name: "Philippine National Bank" },
  { code: "CBC", name: "China Bank" },
  { code: "EWBC", name: "EastWest Bank", aliases: ["East West Bank"] },
  { code: "RCBC", name: "RCBC", aliases: ["Rizal Commercial Banking Corporation"] },
  { code: "UCPB", name: "UCPB" },
  { code: "PSB", name: "Philippine Savings Bank", aliases: ["PSBank"] },
  { code: "AUB", name: "Asia United Bank" },
  { code: "PBC", name: "Philippine Bank of Communications" },
  { code: "DBP", name: "Development Bank of the Philippines" },
  { code: "AB", name: "AllBank" },
  { code: "Asenso", name: "Asenso Rural Bank" },
  { code: "BM", name: "Banko Mabuhay" },
  { code: "BC", name: "Bank of Commerce" },
  { code: "BK", name: "BanKo" },
  { code: "Bayad", name: "Bayad" },
  { code: "BNB", name: "BDO Network Bank" },
  { code: "CB", name: "Camalig Bank" },
  { code: "CARD Bank", name: "CARD Bank" },
  { code: "CLB", name: "Cebuana Lhuillier Bank" },
  { code: "CBS", name: "China Bank Savings" },
  { code: "Coins", name: "Coins.ph" },
  { code: "CTBC", name: "CTBC Bank Philippines" },
  { code: "DCDB", name: "Dumaguete City Development Bank" },
  { code: "DB", name: "Dungganon Bank" },
  { code: "ESB", name: "Equicom Savings Bank" },
  { code: "GP", name: "GrabPay" },
  { code: "ISLA", name: "ISLA Bank" },
  { code: "JC", name: "JuanCash" },
  { code: "Komo", name: "Komo", aliases: ["EastWest Rural Bank"] },
  { code: "LSB", name: "Legazpi Savings Bank" },
  { code: "MBS", name: "Malayan Savings and Mortgage Bank" },
  { code: "MBP", name: "Maybank Philippines" },
  { code: "MCCB", name: "Mindanao Consolidated Cooperative Bank" },
  { code: "NB", name: "Netbank" },
  { code: "OP", name: "OmniPay" },
  { code: "PRB", name: "Partner Rural Bank" },
  { code: "PMP", name: "Maya", aliases: ["PayMaya"] },
  { code: "PBB", name: "Philippine Business Bank" },
  { code: "PTC", name: "Philippine Trust Company" },
  { code: "PDB", name: "Producers Bank" },
  { code: "QB", name: "Queenbank" },
  { code: "QCRB", name: "Quezon Capital Rural Bank" },
  { code: "RBB", name: "Robinsons Bank" },
  { code: "SB", name: "SeaBank", aliases: ["Seabank"] },
  { code: "SP", name: "ShopeePay" },
  { code: "SCB", name: "Standard Chartered Bank" },
  { code: "STP", name: "Starpay" },
  { code: "SLB", name: "Sterling Bank of Asia" },
  { code: "SSB", name: "Sun Savings Bank" },
  { code: "TC", name: "TayoCash" },
  { code: "USB", name: "UCPB Savings Bank" },
  { code: "USSC", name: "USSC Money Services" },
  { code: "VB", name: "Veterans Bank" },
  { code: "WDB", name: "Wealth Development Bank" },
  { code: "BRB", name: "Binangonan Rural Bank" },
  { code: "SME", name: "CARD SME Bank", aliases: ["SME Bank"] },
  { code: "CPI", name: "CIMB Philippines" },
  { code: "ERB", name: "Entrepreneur Rural Bank" },
  { code: "GOT", name: "GoTyme Bank" },
  { code: "IRI", name: "I-Remit" },
  { code: "IEM", name: "Infoserve / Nationlink" },
  { code: "LDB", name: "Luzon Development Bank" },
  { code: "MYA", name: "Maya Bank" },
  { code: "PAS", name: "Pacific Ace Savings Bank" },
  { code: "PPS", name: "PalawanPay" },
  { code: "TDB", name: "Tonik Bank" },
  { code: "TPI", name: "TraxionPay / DigiCOOP" },
  { code: "UDB", name: "UnionDigital Bank" },
];

export type CloudPayDepositMethod = {
  code: string;
  name: string;
  paymentType: "1" | "3" | "7";
  aliases?: readonly string[];
  requiresPayerPhone?: boolean;
};

// Merchant-confirmed Galaxy deposit mappings. Keep these separate from the
// broader bank-code list used for withdrawals.
export const CLOUDPAY_DEPOSIT_METHODS: readonly CloudPayDepositMethod[] = [
  { code: "got", name: "GoTyme QRPH", paymentType: "1", aliases: ["GoTyme QR"] },
  { code: "PMP", name: "PayMaya Direct", paymentType: "3", aliases: ["PayMaya", "Maya Direct"] },
  { code: "mya", name: "GCash H5 QRPH", paymentType: "7", aliases: ["GCash", "GCash QRPH"] },
];

// Withdrawal form labels for the three CloudPay deposit channels. They map to
// existing payout bank codes; they do not change the merchant-specific deposit
// payment_type/bank_code pairs above.
export const CLOUDPAY_WITHDRAWAL_METHOD_ALIASES = [
  { name: "GoTyme QRPH", bankCode: "GOT" },
  { name: "PayMaya Direct", bankCode: "PMP" },
  { name: "GCash H5 QRPH", bankCode: "gcash" },
] as const;

function normalizeBankValue(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}

export function resolveCloudPayDepositMethod(value: string): CloudPayDepositMethod | undefined {
  const normalized = normalizeBankValue(value);
  if (!normalized) return undefined;
  return CLOUDPAY_DEPOSIT_METHODS.find((method) =>
    [method.code, method.name, ...(method.aliases || [])]
      .some((candidate) => normalizeBankValue(candidate) === normalized),
  );
}

export function resolveCloudPayBankCode(value: string): string | undefined {
  const normalized = normalizeBankValue(value);
  if (!normalized) return undefined;
  const bank = CLOUDPAY_BANKS.find((bank) =>
    [bank.code, bank.name, ...(bank.aliases || [])]
      .some((candidate) => normalizeBankValue(candidate) === normalized),
  )?.code;
  if (bank) return bank;
  return CLOUDPAY_WITHDRAWAL_METHOD_ALIASES.find(
    (method) => normalizeBankValue(method.name) === normalized,
  )?.bankCode;
}

export function getCloudPayBank(code: string): CloudPayBank | undefined {
  return CLOUDPAY_BANKS.find((bank) => bank.code === code);
}