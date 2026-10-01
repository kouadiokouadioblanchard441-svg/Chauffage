import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import "./rules.css";

export default function RulesPage() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });
  const { data: products = [] } = useQuery<Array<{
    price: number;
    dailyEarnings: number;
    cycleDays: number;
    isFree: boolean;
    isActive: boolean;
  }>>({
    queryKey: ["/api/products"],
  });

  const minDeposit = settings?.minDeposit || "200";
  const minWithdrawal = settings?.minWithdrawal || "60";
  const withdrawalFees = settings?.withdrawalFees || "16";
  const withdrawalStartHour = settings?.withdrawalStartHour || "0";
  const withdrawalEndHour = settings?.withdrawalEndHour || "24";
  const maxWithdrawalsPerDay = settings?.maxWithdrawalsPerDay || "3";
  const lv1 = settings?.level1Commission || "25";
  const lv2 = settings?.level2Commission || "3";
  const lv3 = settings?.level3Commission || "2";
  const activePaidProducts = products.filter((product) => product.isActive && !product.isFree);
  const minimumProductPrice = activePaidProducts.length
    ? Math.min(...activePaidProducts.map((product) => product.price))
    : null;
  const cycleLengths = Array.from(new Set(activePaidProducts.map((product) => product.cycleDays))).sort((a, b) => a - b);

  return (
    <main className="cp-rules-page">
      <div className="cp-rules-screen">
      <header className="cp-rules-header">
        <Link href="/account">
          <button className="cp-rules-back" data-testid="button-back">
            <ChevronLeft aria-hidden="true" />
            <span>Back</span>
          </button>
        </Link>
        <h1>Platform rules</h1>
      </header>

      <div className="cp-rules-body">
        <section className="cp-rules-section">
          <h2>1. Investments</h2>
          <ul>
            <li>Each user may own multiple investment products at the same time.</li>
            <li>Earnings are generated daily and credited to your account balance every 24 hours.</li>
            <li>Investment cycle: {cycleLengths.length === 1 ? `${cycleLengths[0]} days` : "see the duration shown on each product"}.</li>
          </ul>
        </section>

        <section className="cp-rules-section">
          <h2>2. Deposits and withdrawals</h2>
          <ul>
            <li>The minimum deposit is {parseInt(minDeposit).toLocaleString("en-PH")} PHP.</li>
            {minimumProductPrice !== null && <li>The minimum product purchase is {minimumProductPrice.toLocaleString("en-PH")} PHP.</li>}
            <li>The minimum withdrawal is {parseInt(minWithdrawal).toLocaleString("en-PH")} PHP.</li>
            <li>Withdrawal fees are set at {withdrawalFees}% to cover transaction and maintenance costs.</li>
            <li>Withdrawals are available between {String(withdrawalStartHour).padStart(2, "0")}:00 and {String(withdrawalEndHour).padStart(2, "0")}:00.</li>
            <li>Limit of {maxWithdrawalsPerDay} withdrawal(s) per user per day.</li>
          </ul>
        </section>

        <section className="cp-rules-section">
          <h2>3. Referral system</h2>
          <ul>
            <li>Level 1 commission: {lv1}% on the referral's FIRST investment.</li>
            <li>Level 2 commission: {lv2}% on the referral's FIRST investment.</li>
            <li>Level 3 commission: {lv3}% on the referral's FIRST investment.</li>
            <li>Fraudulent activity or creating multiple accounts to manipulate the system will result in account suspension.</li>
          </ul>
        </section>

        <section className="cp-rules-section">
          <h2>4. Security</h2>
          <ul>
            <li>You are responsible for keeping your password secure.</li>
            <li>Never share your login credentials with third parties.</li>
            <li>Official customer support will never ask for your password.</li>
          </ul>
        </section>
      </div>
      </div>
    </main>
  );
}
