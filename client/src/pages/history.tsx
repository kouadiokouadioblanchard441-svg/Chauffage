import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCountryByCode } from "@/lib/countries";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

import nodataImg from "@assets/nodata-da225bbb_(1)_1783249133513.png";

interface Deposit {
  id: number;
  userId: number;
  amount: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  soleaspayReference?: string;
  soleaspayOrderId?: string;
  omnipayId?: string;
  omnipayReference?: string;
  sendavapayReference?: string;
}

interface Withdrawal {
  id: number;
  userId: number;
  amount: string;
  netAmount: string;
  status: string;
  createdAt: string;
  sendavapayReference?: string;
}

interface Transaction {
  id: number;
  userId: number;
  type: string;
  amount: string;
  description: string;
  createdAt: string;
}

type ActiveTab = "balance" | "deposits" | "withdrawals";

const CARD_ORANGE = "#ff7a14";
const CARD_DARK = "#111827";
const CARD_SUCCESS = "#16a34a";
const CARD_BACKGROUND = "#fff8f2";

const makeRef = (prefix: "D" | "W", id: number, date: string) => {
  const d = new Date(date);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const seq = String(id).padStart(4, "0");
  return `sdk${yy}${mm}${dd}${hh}${min}${prefix}${seq}`;
};

const getDepositRef = (deposit: Deposit) => {
  const reference =
    deposit.sendavapayReference ||
    deposit.omnipayReference ||
    deposit.omnipayId ||
    deposit.soleaspayReference ||
    deposit.soleaspayOrderId;
  if (reference) return reference.startsWith("sdk") ? reference : `sdk${reference}`;
  return makeRef("D", deposit.id, deposit.createdAt);
};

const getWithdrawalRef = (withdrawal: Withdrawal) => {
  const reference = withdrawal.sendavapayReference;
  if (reference) return reference.startsWith("sdk") ? reference : `sdk${reference}`;
  return makeRef("W", withdrawal.id, withdrawal.createdAt);
};

const maskRef = (reference: string) =>
  reference.length <= 6 ? reference : `${reference.slice(0, 2)}****${reference.slice(-4)}`;

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
};

const getStatusInfo = (status: string) => {
  switch (status) {
    case "completed":
    case "approved":
      return { label: "Successful", color: CARD_SUCCESS };
    case "rejected":
      return { label: "Payment failed", color: "#b42318" };
    case "processing":
      return { label: "Processing", color: "#d97706" };
    default:
      return { label: "Pending...", color: "#d97706" };
  }
};

const getBalanceTypeLabel = (transaction: Transaction) => {
  switch (transaction.type) {
    case "bonus":
      return transaction.description === "Bonus quotidien"
        ? "Daily bonus"
        : transaction.description;
    case "signup_bonus":
      return "Registration bonus";
    case "task_reward":
      return "Reward";
    case "commission":
      return "Commission";
    case "deposit":
      return "Deposit";
    default:
      return transaction.description;
  }
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="history-row">
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

const Status = ({ label, color }: { label: string; color: string }) => (
  <span className="history-status" style={{ backgroundColor: color }}>
    {label}
  </span>
);

export default function HistoryPage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>("withdrawals");
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const isAdmin = !!(user as any)?.isAdmin;
  const countryInfo = user ? getCountryByCode(user.country) : null;
  const currency = "PHP";

  const { data: deposits = [], isLoading: depositsLoading } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits/history"],
  });

  const { data: withdrawals = [], isLoading: withdrawalsLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals/history"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const isPendingDeposit = (deposit: Deposit) =>
    (deposit.status === "pending" || deposit.status === "processing") &&
    Boolean(
      deposit.soleaspayReference ||
      deposit.soleaspayOrderId ||
      deposit.omnipayId ||
      deposit.omnipayReference ||
      deposit.sendavapayReference,
    );

  const handleVerify = async (depositId: number) => {
    setVerifyingId(depositId);
    try {
      const response = await fetch(`/api/deposits/${depositId}/verify`, { credentials: "include" });
      const data = await response.json();
      if (data.status === "approved") {
         toast({ title: "Payment confirmed", description: "Your account has been credited." });
        refreshUser();
        queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
      } else if (data.status === "rejected") {
         toast({ title: "Payment failed", description: "The payment was declined.", variant: "destructive" });
        queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
      } else {
         toast({ title: "In progress", description: "The payment is still pending." });
      }
    } catch {
      toast({ title: "Unable to verify payment", description: "Payment verification failed.", variant: "destructive" });
    } finally {
      setVerifyingId(null);
    }
  };

  if (!user) return null;

  const balanceEntries: Transaction[] = [
    ...transactions,
    {
      id: -1,
      userId: user.id,
      type: "registration",
      amount: "0",
      description: "Registration",
      createdAt:
        user.createdAt instanceof Date
          ? user.createdAt.toISOString()
          : String(user.createdAt),
    },
  ].sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime());

  const isLoading =
    activeTab === "balance"
      ? transactionsLoading
      : activeTab === "deposits"
        ? depositsLoading
        : withdrawalsLoading;

  return (
    <main className="history-page">
      <style>{`
        .history-page {
          width: 100%;
          min-height: 100dvh;
          overflow-x: hidden;
          background: #fff;
          color: #111827;
          font-family: Arial, sans-serif;
        }
        .history-page *,
        .history-page *::before,
        .history-page *::after {
          box-sizing: border-box;
        }
        .history-screen {
          width: 100%;
          max-width: 512px;
          min-height: 100dvh;
          margin: 0 auto;
          background: #fff;
        }
        .history-header {
          position: relative;
          display: flex;
          min-height: 78px;
          align-items: center;
          padding: 17px 16px;
          border-bottom: 2px solid #111827;
        }
        .history-back {
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border: 2px solid #111827;
          border-radius: 11px;
          padding: 0;
          background: #fff;
          box-shadow: 0 3px 0 #111827;
          color: #111827;
          cursor: pointer;
        }
        .history-back svg {
          width: 22px;
          height: 22px;
          stroke-width: 2.5;
        }
        .history-title {
          position: absolute;
          right: 70px;
          left: 70px;
          margin: 0;
          color: #111827;
          font-size: 20px;
          font-weight: 800;
          line-height: 1.2;
          text-align: center;
        }
        .history-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr 1.12fr;
          gap: 8px;
          align-items: center;
          min-height: 78px;
          padding: 12px 16px 16px;
          border-bottom: 2px solid #111827;
        }
        .history-tab {
          display: flex;
          min-width: 0;
          height: 46px;
          align-items: center;
          justify-content: center;
          gap: 5px;
          border: 2px solid #111827;
          border-radius: 11px;
          padding: 0 8px;
          background: #ffffff;
          box-shadow: 0 3px 0 #111827;
          color: #111827;
          font-size: 14px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
          cursor: pointer;
        }
        .history-tab.active {
          background: #ff7a14;
          color: #111827;
          font-weight: 700;
        }
        .history-tab-arrow {
          width: 17px;
          height: 17px;
          color: #111827;
          stroke-width: 2.8;
        }
        .history-tab-arrow.left {
          transform: rotate(180deg);
        }
        .history-content {
          min-height: calc(100dvh - 156px);
          padding: 18px 16px 40px;
          background: #fff8f2;
        }
        .history-list {
          display: grid;
          gap: 16px;
        }
        .history-card {
          position: relative;
          width: 100%;
          min-height: 154px;
          overflow: hidden;
          border: 2px solid #111827;
          border-radius: 12px;
          padding: 0 16px 16px;
          background: #ffffff;
          box-shadow: 0 4px 0 #111827, 0 8px 16px rgba(17, 24, 39, .12);
        }
        .history-card-top {
          display: flex;
          min-height: 76px;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin: 0 -16px;
          padding: 14px 16px 13px;
          border-bottom: 2px solid #111827;
          background: ${CARD_ORANGE};
        }
        .history-amount {
          margin: 0;
          color: #111827;
          font-size: 19px;
          font-weight: 800;
          line-height: 1.15;
        }
        .history-card-label {
          margin: 6px 0 0;
          color: #111827;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.15;
        }
        .history-status {
          display: inline-flex;
          min-height: 34px;
          align-items: center;
          flex: 0 0 auto;
          border: 2px solid #111827;
          border-radius: 11px;
          padding: 0 11px;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
        }
        .history-divider {
          height: 0;
          margin: 14px 0 9px;
          border-top: 2px dashed #9ca3af;
        }
        .history-row {
          display: flex;
          min-height: 21px;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #111827;
          font-size: 14px;
          line-height: 1.2;
        }
        .history-row > span:first-child {
          color: #4b5563;
          font-weight: 700;
        }
        .history-row > span:last-child {
          text-align: right;
          white-space: nowrap;
        }
        .history-empty {
          display: flex;
          min-height: 320px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border: 2px solid #111827;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 4px 0 #111827;
          color: #4b5563;
          font-size: 14px;
        }
        .history-empty img {
          width: 112px;
          height: 112px;
          object-fit: contain;
        }
        .history-verify {
          width: 100%;
          margin-top: 10px;
          min-height: 44px;
          border: 2px solid #111827;
          border-radius: 11px;
          padding: 9px 12px;
          background: ${CARD_ORANGE};
          box-shadow: 0 3px 0 #111827;
          color: #111827;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }
        .history-verify:disabled { cursor: wait; opacity: .7; }
        @media (max-width: 370px) {
          .history-header { height: 62px; padding-top: 6px; }
          .history-title { font-size: 19px; }
          .history-tabs { min-height: 58px; padding-bottom: 11px; }
          .history-tab { font-size: 14px; }
          .history-content { min-height: calc(100dvh - 120px); padding-right: 16px; padding-left: 16px; }
          .history-card { padding-right: 18px; padding-left: 18px; }
          .history-card-label { font-size: 15px; }
          .history-status { font-size: 12px; padding-right: 8px; padding-left: 8px; }
          .history-row { font-size: 13px; }
        }
      `}</style>

      <div className="history-screen">
        <header className="history-header">
          <Link href="/account">
            <button className="history-back" data-testid="button-back" aria-label="Back">
              <ChevronLeft aria-hidden="true" />
            </button>
          </Link>
          <h1 className="history-title">Funds history</h1>
        </header>

        <nav className="history-tabs" aria-label="History type">
          <button
            className={`history-tab ${activeTab === "balance" ? "active" : ""}`}
            onClick={() => setActiveTab("balance")}
            data-testid="tab-balance"
          >
            <span>Balance</span>
            <ChevronRight className={`history-tab-arrow ${activeTab === "balance" ? "right" : "left"}`} aria-hidden="true" />
          </button>
          <button
            className={`history-tab ${activeTab === "deposits" ? "active" : ""}`}
            onClick={() => setActiveTab("deposits")}
            data-testid="tab-deposits"
          >
            <span>Deposits</span>
            <ChevronRight className={`history-tab-arrow ${activeTab === "deposits" ? "right" : "left"}`} aria-hidden="true" />
          </button>
          <button
            className={`history-tab ${activeTab === "withdrawals" ? "active" : ""}`}
            onClick={() => setActiveTab("withdrawals")}
            data-testid="tab-withdrawals"
          >
            <span>Withdrawals</span>
            <ChevronRight className="history-tab-arrow right" aria-hidden="true" />
          </button>
        </nav>

        <section className="history-content" aria-live="polite">
          {isLoading ? (
            <div className="history-empty">
              <Loader2 className="animate-spin" />
            </div>
          ) : activeTab === "balance" ? (
            balanceEntries.length > 0 ? (
              <div className="history-list">
                {balanceEntries.map((transaction) => {
                  const amount = Number.parseFloat(transaction.amount || "0");
                  const isRegistration = transaction.type === "registration";
                  return (
                    <article className="history-card" key={`${transaction.type}-${transaction.id}`} data-testid={`balance-item-${transaction.id}`}>
                      <div className="history-card-top">
                        <div>
                          <p className="history-amount">
                            {isRegistration ? "—" : `+${amount.toLocaleString("en-PH")} ${currency}`}
                          </p>
                           <p className="history-card-label">{transaction.type === "deposit" ? "Deposit" : transaction.description}</p>
                        </div>
                           <Status label="Successful" color={CARD_SUCCESS} />
                      </div>
                      <div className="history-divider" />
                      <Row label="Type:" value={isRegistration ? "Registration" : getBalanceTypeLabel(transaction)} />
                      <Row label="Time:" value={formatDateTime(transaction.createdAt)} />
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="history-empty">
                <img src={nodataImg} alt="No data" />
                <span>No more data</span>
              </div>
            )
          ) : activeTab === "deposits" ? (
            deposits.length > 0 ? (
              <div className="history-list">
                {deposits.map((deposit) => {
                  const { label, color } = getStatusInfo(deposit.status);
                  const amount = Number.parseFloat(deposit.amount);
                  const reference = isAdmin ? getDepositRef(deposit) : maskRef(getDepositRef(deposit));
                  return (
                    <article className="history-card" key={deposit.id} data-testid={`deposit-item-${deposit.id}`}>
                      <div className="history-card-top">
                        <div>
                          <p className="history-amount">{currency} {amount.toLocaleString("en-PH")}</p>
                          <p className="history-card-label">Deposit amount</p>
                        </div>
                        <Status label={label} color={color} />
                      </div>
                      <div className="history-divider" />
                      <Row label="Reference:" value={reference} />
                      <Row label="Deposit time:" value={formatDateTime(deposit.createdAt)} />
                      {isPendingDeposit(deposit) && !deposit.sendavapayReference ? (
                        <button
                          className="history-verify"
                          onClick={() => handleVerify(deposit.id)}
                          disabled={verifyingId === deposit.id}
                          data-testid={`button-verify-${deposit.id}`}
                        >
                          {verifyingId === deposit.id ? <Loader2 className="inline animate-spin" /> : <RefreshCw className="mr-1 inline h-3 w-3" />}
                          Verify transaction
                        </button>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="history-empty">
                <img src={nodataImg} alt="No data" />
                <span>No more data</span>
              </div>
            )
          ) : withdrawals.length > 0 ? (
            <div className="history-list">
              {withdrawals.map((withdrawal) => {
                const { label, color } = getStatusInfo(withdrawal.status);
                const gross = Number.parseFloat(withdrawal.amount);
                const net = Number.parseFloat(withdrawal.netAmount || withdrawal.amount);
                return (
                  <article className="history-card" key={withdrawal.id} data-testid={`withdrawal-item-${withdrawal.id}`}>
                    <div className="history-card-top">
                      <div>
                        <p className="history-amount">{currency} {gross.toLocaleString("en-PH")}</p>
                        <p className="history-card-label">Withdrawal amount</p>
                      </div>
                      <Status label={label} color={color} />
                    </div>
                    <div className="history-divider" />
                    <Row label="Amount received:" value={`${currency} ${net.toLocaleString("en-PH")}`} />
                    <Row label="Withdrawal time:" value={formatDateTime(withdrawal.createdAt)} />
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="history-empty">
              <img src={nodataImg} alt="No data" />
              <span>No more data</span>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}