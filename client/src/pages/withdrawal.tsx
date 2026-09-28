import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { getCountryByCode } from "@/lib/countries";
import walletIcon from "@assets/téléchargement_(80)_1787363581764.png";
import chargepointLogo from "@assets/chargepoint_1790147948102.jpg";
import chargepointPromo from "@/assets/auth-chargepoint-combined.png";

interface WalletData {
  id: number;
  userId: number;
  accountName: string;
  accountNumber: string;
  paymentMethod: string;
  country: string;
  isDefault: boolean;
}

interface UserProduct {
  id: number;
  status: string;
}

export default function WithdrawalPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<number | "">("");
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [, navigate] = useLocation();

  const countryInfo = user ? getCountryByCode(user.country) : null;
  const currency = "PHP";

  const { data: withdrawalSettings } = useQuery<{
    withdrawalFees: number;
    withdrawalStartHour: number;
    withdrawalEndHour: number;
    maxWithdrawalsPerDay: number;
    minWithdrawal: number;
    withdrawalPrepaymentEnabled: boolean;
  }>({
    queryKey: ["/api/settings/withdrawal"],
    staleTime: 0,
    refetchOnMount: true,
  });

  const minWithdrawal = withdrawalSettings?.minWithdrawal ?? 800;
  const withdrawalFee = withdrawalSettings?.withdrawalFees ?? 16;
  const withdrawalStartHour = withdrawalSettings?.withdrawalStartHour ?? 9;
  const withdrawalEndHour = withdrawalSettings?.withdrawalEndHour ?? 17;
  const withdrawalPrepaymentEnabled = withdrawalSettings?.withdrawalPrepaymentEnabled ?? false;

  const amountAfterFees = amount ? Math.floor(Number(amount) * (1 - withdrawalFee / 100)) : 0;
  const currentHour = new Date().getHours();
  const isWithinWithdrawalHours = currentHour >= withdrawalStartHour && currentHour < withdrawalEndHour;

  const { data: wallets = [], isLoading: walletsLoading } = useQuery<WalletData[]>({
    queryKey: ["/api/wallets"],
    refetchOnWindowFocus: true,
  });

  const { data: userProducts = [] } = useQuery<UserProduct[]>({
    queryKey: ["/api/user/products"],
  });

  const { data: availableBalance } = useQuery<{ availableBalance: string }>({
    queryKey: ["/api/withdrawals/available"],
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
  });

  const hasActiveProduct = userProducts.some((p) => p.status === "active");

  useEffect(() => {
    const savedWalletId = localStorage.getItem("selectedWalletId");
    if (savedWalletId && wallets.length > 0) {
      const wallet = wallets.find(w => w.id === parseInt(savedWalletId));
      if (wallet) setSelectedWallet(wallet);
      localStorage.removeItem("selectedWalletId");
    }
  }, [wallets]);

  useEffect(() => {
    if (!selectedWallet && wallets.length > 0) {
      const defaultWallet = wallets.find(w => w.isDefault);
      if (defaultWallet) setSelectedWallet(defaultWallet);
    }
  }, [wallets, selectedWallet]);

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: number; walletId: number }) => {
      const res = await apiRequest("POST", "/api/withdrawals", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Request sent", description: "Your withdrawal request has been sent." });
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals/available"] });
      setAmount("");
    },
    onError: (error: Error & { data?: { code?: string; paymentUrl?: string } }) => {
      if (error.data?.code === "WITHDRAWAL_PREPAYMENT_REQUIRED" && error.data.paymentUrl) {
        navigate(error.data.paymentUrl);
        return;
      }
      toast({ title: "Unable to withdraw", description: error.message, variant: "destructive" });
    },
  });

  const withdrawalPrepayment = withdrawalPrepaymentEnabled && amount
    ? Math.max(1, Math.round(Number(amount) * 25 / 100))
    : 0;

  const handlePayPrepayment = async () => {
    if (!withdrawalPrepaymentEnabled) return;
    if (!amount || Number(amount) < minWithdrawal) {
       toast({ title: "Invalid amount", description: `The minimum amount is ${minWithdrawal} ${currency}`, variant: "destructive" });
      return;
    }
    setIsPreparingPayment(true);
    try {
      const response = await apiRequest("POST", "/api/withdrawal-fee/prepare", { amount: Number(amount) });
      const data = await response.json();
      navigate(data.paymentUrl);
    } catch (error: any) {
       toast({ title: "Payment unavailable", description: error.message, variant: "destructive" });
    } finally {
      setIsPreparingPayment(false);
    }
  };

  const handleSubmit = () => {
    if (!isWithinWithdrawalHours) {
      toast({
         title: "Withdrawal unavailable",
         description: `Withdrawal hours: ${withdrawalStartHour}:00 to ${withdrawalEndHour}:00.`,
        variant: "destructive",
      });
      return;
    }
    if (!hasActiveProduct) {
       toast({ title: "Product required", description: "You must have an active product to withdraw.", variant: "destructive" });
      return;
    }
    if (!amount || amount < minWithdrawal) {
       toast({ title: "Invalid amount", description: `The minimum amount is ${minWithdrawal} ${currency}`, variant: "destructive" });
      return;
    }
    if (!selectedWallet) {
       toast({ title: "Account required", description: "Please select a payment account.", variant: "destructive" });
      return;
    }
    withdrawMutation.mutate({ amount: Number(amount), walletId: selectedWallet.id });
  };

  if (walletsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF7A14]" />
      </div>
    );
  }

  if (!user) return null;

  const balance = parseFloat(availableBalance?.availableBalance || "0");
  const hasWallets = wallets.length > 0;

  return (
    <main className="withdraw-reference min-h-screen bg-[#f7f4f2]">
      <style>{`
        .withdraw-reference {
          min-height: 100dvh;
          background: #fff8f2;
          color: #111827;
          font-family: Inter, Arial, sans-serif;
        }
        .withdraw-reference .withdraw-screen {
          width: 100%;
          max-width: 512px;
          min-height: 100dvh;
          margin: 0 auto;
          overflow: hidden;
          background: #fff8f2;
        }
        .withdraw-reference .withdraw-hero {
          position: relative;
          box-sizing: border-box;
          min-height: 406px;
          padding: 0 16px 20px;
          background: #fff8f2;
          border-bottom: 2px solid #111827;
        }
        .withdraw-reference .history-button,
        .withdraw-reference .withdraw-back {
          position: absolute;
          z-index: 3;
          top: 16px;
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border: 2px solid #111827;
          border-radius: 11px;
          padding: 0;
          background: #fff;
          box-shadow: 0 3px 0 #111827;
        }
        .withdraw-reference .history-button {
          right: 16px;
        }
        .withdraw-reference .withdraw-back {
          left: 16px;
        }
        .withdraw-reference .history-button:active,
        .withdraw-reference .withdraw-back:active {
          transform: translateY(2px);
          box-shadow: 0 1px 0 #111827;
        }
        .withdraw-reference .history-icon {
          position: relative;
          width: 22px;
          height: 25px;
          border: 2px solid #111827;
          border-radius: 4px;
          background: transparent;
        }
        .withdraw-reference .history-icon::before {
          position: absolute;
          top: 5px;
          left: 4px;
          width: 11px;
          height: 2px;
          content: "";
          background: #ff7a14;
          box-shadow: 0 6px 0 #ff7a14;
        }
        .withdraw-reference .history-icon::after {
          position: absolute;
          right: -7px;
          bottom: -6px;
          width: 10px;
          height: 10px;
          border: 2px solid #111827;
          border-radius: 50%;
          content: "";
          background: #fff;
        }
        .withdraw-reference .withdraw-back::before {
          width: 13px;
          height: 13px;
          border-bottom: 3px solid #111827;
          border-left: 3px solid #111827;
          content: "";
          transform: rotate(45deg) translate(2px, -2px);
        }
        .withdraw-reference .hero-art {
          position: relative;
          width: 100%;
          height: 176px;
          overflow: hidden;
          margin-top: 76px;
          border: 2px solid #111827;
          border-radius: 13px;
          background: #fff;
          background-image: url("${chargepointPromo}");
          background-position: center;
          background-size: cover;
          box-shadow: 0 4px 0 #111827;
        }
        .withdraw-reference .hero-pattern,
        .withdraw-reference .receipt-icon {
          display: none;
        }
        .withdraw-reference .withdraw-title {
          position: absolute;
          z-index: 2;
          top: 21px;
          right: 70px;
          left: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          margin: 0;
          color: #111827;
          font-size: 20px;
          font-weight: 800;
          line-height: 1.2;
          text-align: center;
        }
        .withdraw-reference .withdraw-title-logo {
          width: 38px;
          height: 38px;
          border: 2px solid #111827;
          border-radius: 50%;
          object-fit: cover;
        }
        .withdraw-reference .balance-card {
          position: relative;
          height: 116px;
          overflow: hidden;
          margin-top: 16px;
          border: 2px solid #111827;
          border-radius: 13px;
          background: #ff7a14;
          box-shadow: 0 4px 0 #111827;
        }
        .withdraw-reference .balance-label {
          margin: 20px 0 0 17px;
          color: #111827;
          font-size: 15px;
          font-weight: 800;
          line-height: 1;
        }
        .withdraw-reference .balance-value {
          margin: 16px 0 0 17px;
          color: #111827;
          font-size: 32px;
          font-weight: 800;
          line-height: .9;
        }
        .withdraw-reference .balance-value span {
          margin-left: 5px;
          font-size: 20px;
        }
        .withdraw-reference .wallet-mark {
          position: absolute;
          top: 15px;
          right: 16px;
          display: grid;
          width: 84px;
          height: 84px;
          place-items: center;
          border: 2px solid #111827;
          border-radius: 50%;
          background: #fff;
        }
        .withdraw-reference .wallet-mark img {
          width: 62px;
          height: 62px;
          object-fit: cover;
        }
        .withdraw-reference .amount-panel {
          box-sizing: border-box;
          min-height: 154px;
          padding: 12px 16px 18px;
          background: #fff;
          border-bottom: 2px solid #111827;
        }
        .withdraw-reference .amount-label {
          margin: 0 0 9px;
          color: #111827;
          font-size: 16px;
          font-weight: 800;
        }
        .withdraw-reference .amount-field {
          display: flex;
          height: 54px;
          align-items: center;
          overflow: hidden;
          border: 2px solid #111827;
          border-radius: 12px;
          background: #fff;
        }
        .withdraw-reference .amount-field input {
          width: 100%;
          min-width: 0;
          height: 100%;
          padding: 0 16px;
          border: 0;
          outline: 0;
          background: transparent;
          color: #111827;
          font-size: 19px;
        }
        .withdraw-reference .amount-field input::placeholder { color: #6b7280; opacity: 1; }
        .withdraw-reference .amount-currency {
          padding-right: 16px;
          color: #111827;
          font-size: 18px;
          font-weight: 800;
        }
        .withdraw-reference .amount-details {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 12px;
          color: #4b5563;
          font-size: 13px;
          font-weight: 700;
        }
        .withdraw-reference .prepayment-notice {
          display: grid;
          gap: 7px;
          margin-top: 16px;
          padding: 14px;
          border: 2px solid #111827;
          border-radius: 12px;
          background: #fff1e6;
          color: #4b5563;
          font-size: 13px;
          line-height: 1.45;
        }
        .withdraw-reference .prepayment-notice strong {
          color: #111827;
          font-size: 14px;
        }
        .withdraw-reference .pay-prepayment {
          display: inline-flex;
          min-height: 38px;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 2px solid #111827;
          border-radius: 10px;
          background: #ff7a14;
          color: #111827;
          font-weight: 800;
          box-shadow: 0 2px 0 #111827;
        }
        .withdraw-reference .pay-prepayment:active:not(:disabled) {
          transform: translateY(2px);
          box-shadow: none;
        }
        .withdraw-reference .pay-prepayment:disabled { opacity: .55; }
        .withdraw-reference .wallet-choice {
          display: flex;
          width: calc(100% - 32px);
          min-height: 62px;
          align-items: center;
          margin: 16px 16px 0;
          padding: 0 14px;
          border: 2px solid #111827;
          border-radius: 12px;
          background: #fff;
          color: #111827;
          text-align: left;
          box-shadow: 0 3px 0 #111827;
        }
        .withdraw-reference .wallet-choice:active {
          transform: translateY(2px);
          box-shadow: 0 1px 0 #111827;
        }
        .withdraw-reference .wallet-choice img {
          width: 34px;
          height: 34px;
          margin-right: 10px;
          object-fit: contain;
        }
        .withdraw-reference .wallet-choice svg:last-child {
          width: 22px;
          height: 22px;
          margin-left: auto;
          color: #ff7a14;
        }
        .withdraw-reference .wallet-copy {
          overflow: hidden;
          font-size: 15px;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .withdraw-reference .instructions {
          margin: 18px 16px 24px;
          padding: 22px 16px 10px;
          border: 2px solid #111827;
          border-top: 5px solid #ff7a14;
          border-radius: 14px;
          background: #fff;
        }
        .withdraw-reference .instructions-title {
          margin: 0 0 20px;
          color: #111827;
          font-size: 19px;
          font-weight: 800;
        }
        .withdraw-reference .instructions-title::before {
          content: "•";
          margin-right: 8px;
          color: #ff7a14;
          font-size: 24px;
          line-height: 0;
        }
        .withdraw-reference .instruction {
          position: relative;
          margin: 0 0 16px 20px;
          color: #4b5563;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.65;
        }
        .withdraw-reference .instruction::before {
          position: absolute;
          top: 7px;
          left: -15px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          content: "";
          background: #ff7a14;
        }
        .withdraw-reference .instruction strong { color: #111827; font-weight: 800; }
        .withdraw-reference .submit {
          display: flex;
          width: calc(100% - 32px);
          min-height: 57px;
          align-items: center;
          justify-content: center;
          margin: 18px 16px 0;
          border: 2px solid #111827;
          border-radius: 12px;
          background: #ff7a14;
          color: #111827;
          font-size: 16px;
          font-weight: 800;
          box-shadow: 0 4px 0 #111827;
        }
        .withdraw-reference .submit:active:not(:disabled) {
          transform: translateY(3px);
          box-shadow: 0 1px 0 #111827;
        }
        .withdraw-reference .submit:disabled { opacity: .6; }
        @media (max-width: 360px) {
          .withdraw-reference .withdraw-hero { min-height: 384px; padding-right: 12px; padding-left: 12px; }
          .withdraw-reference .history-button { right: 12px; }
          .withdraw-reference .withdraw-back { left: 12px; }
          .withdraw-reference .hero-art { height: 154px; }
          .withdraw-reference .balance-card { margin-top: 14px; }
          .withdraw-reference .wallet-mark { transform: scale(.86); transform-origin: top right; }
          .withdraw-reference .balance-value { font-size: 28px; }
          .withdraw-reference .amount-details { font-size: 12px; }
          .withdraw-reference .instruction { font-size: 14px; }
        }
      `}</style>

      <div className="withdraw-screen">
        <section className="withdraw-hero" aria-label="Withdrawal">
          <div className="hero-art" aria-hidden="true">
            <div className="hero-pattern" />
            <span className="receipt-icon" />
          </div>
          <h1 className="withdraw-title">
            <img className="withdraw-title-logo" src={chargepointLogo} alt="" />
             <span>Withdrawal</span>
          </h1>
          <Link href="/history">
            <button className="history-button" aria-label="Historique des transactions">
              <span className="history-icon" aria-hidden="true" />
            </button>
          </Link>
          <Link href="/account">
            <button className="withdraw-back" data-testid="button-back" aria-label="Retour" />
          </Link>
          <div className="balance-card">
             <p className="balance-label">Account balance</p>
             <p className="balance-value" data-testid="text-balance">{Math.round(balance).toLocaleString("en-PH")}<span>{currency}</span></p>
            <div className="wallet-mark" aria-hidden="true"><img src={chargepointLogo} alt="" /></div>
          </div>
        </section>

        <section className="amount-panel" aria-label="Montant de retrait">
           <p className="amount-label">Enter withdrawal amount</p>
          <label className="amount-field">
            <input
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value ? Number(event.target.value) : "")}
               placeholder="Amount"
              data-testid="input-withdrawal-amount"
              aria-label="Montant de retrait"
            />
            <span className="amount-currency">{currency}</span>
          </label>
          <div className="amount-details">
             <span>Amount received: {amountAfterFees.toLocaleString("en-PH")}</span>
             <span>Fee: {withdrawalFee.toFixed(2)}%</span>
          </div>
          {withdrawalPrepaymentEnabled && (
            <div className="prepayment-notice">
               <strong>Payment required before withdrawal</strong>
              <span>
                 You must pay 25% of the withdrawal amount
                {withdrawalPrepayment > 0
                   ? `, or ${withdrawalPrepayment.toLocaleString("en-PH")} ${currency}`
                  : ""}{" "}
                 before your request can be submitted.
              </span>
              <button
                type="button"
                onClick={handlePayPrepayment}
                disabled={isPreparingPayment || !amount || Number(amount) < minWithdrawal}
                className="pay-prepayment"
                data-testid="button-pay-withdrawal-prepayment"
              >
                {isPreparingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pay"}
              </button>
            </div>
          )}
        </section>

        <button
          onClick={() => navigate(hasWallets ? "/wallet?from=withdrawal" : "/wallet")}
          className="wallet-choice"
          data-testid="button-select-wallet"
        >
          <img src={walletIcon} alt="" />
          <span className="wallet-copy">
            {selectedWallet
              ? selectedWallet.accountNumber
               : "Choose your wallet"}
          </span>
          <ChevronRight aria-hidden="true" />
        </button>

        <button
          onClick={handleSubmit}
          disabled={withdrawMutation.isPending}
          className="submit"
          data-testid="button-submit-withdrawal"
        >
           {withdrawMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Withdraw your money now"}
        </button>

        <section className="instructions" aria-label="Withdrawal instructions">
           <h2 className="instructions-title">Withdrawal instructions:</h2>
           <p className="instruction"><strong>Minimum withdrawal:</strong> {minWithdrawal.toLocaleString("en-PH")} {currency}</p>
           <p className="instruction"><strong>Withdrawal hours:</strong> {withdrawalStartHour}:00 to {withdrawalEndHour}:00</p>
           <p className="instruction"><strong>Withdrawal fee:</strong> {withdrawalFee}% per transaction</p>
           <p className="instruction"><strong>Processing time:</strong> usually within 2 hours, and exceptionally within 24 hours.</p>
           <p className="instruction">Check your wallet details before submitting your request.</p>
        </section>
      </div>
    </main>
  );
}
