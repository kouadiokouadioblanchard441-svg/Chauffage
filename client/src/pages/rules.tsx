import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import "./rules.css";

export default function RulesPage() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const signupBonus = settings?.signupBonus || "1000";
  const minDeposit = settings?.minDeposit || "3500";
  const minWithdrawal = settings?.minWithdrawal || "800";
  const withdrawalFees = settings?.withdrawalFees || "16";
  const withdrawalStartHour = settings?.withdrawalStartHour || "9";
  const withdrawalEndHour = settings?.withdrawalEndHour || "17";
  const maxWithdrawalsPerDay = settings?.maxWithdrawalsPerDay || "1";
  const lv1 = settings?.level1Commission || "25";
  const lv2 = settings?.level2Commission || "4";
  const lv3 = settings?.level3Commission || "1";

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
            <li>The standard investment cycle is 80 days unless otherwise stated for special products.</li>
          </ul>
        </section>

        <section className="cp-rules-section">
          <h2>2. Deposits and withdrawals</h2>
          <ul>
            <li>The minimum deposit is {parseInt(minDeposit).toLocaleString("en-PH")} PHP.</li>
            <li>The minimum product purchase is 4,500 PHP.</li>
            <li>The minimum withdrawal is {parseInt(minWithdrawal).toLocaleString("en-PH")} PHP.</li>
            <li>Withdrawal fees are set at {withdrawalFees}% to cover transaction and maintenance costs.</li>
            <li>Withdrawals are processed between {withdrawalStartHour}:00 and {withdrawalEndHour}:00 on business days.</li>
            <li>Limit of {maxWithdrawalsPerDay} withdrawal(s) per user per day.</li>
          </ul>
        </section>

        <section className="cp-rules-section">
          <h2>3. Système de Parrainage</h2>
          <ul>
            <li>Commission de niveau 1 : {lv1}% sur le PREMIER investissement du filleul.</li>
            <li>Commission de niveau 2 : {lv2}% sur le PREMIER investissement du filleul.</li>
            <li>Commission de niveau 3 : {lv3}% sur le PREMIER investissement du filleul.</li>
            <li>Les activités frauduleuses ou la création de comptes multiples pour manipuler le système entraîneront la suspension du compte.</li>
          </ul>
        </section>

        <section className="cp-rules-section">
          <h2>4. Bonus d'inscription</h2>
          <ul>
            <li>Each new member receives {parseInt(signupBonus).toLocaleString("en-PH")} PHP as a sign-up bonus.</li>
          </ul>
        </section>

        <section className="cp-rules-section">
          <h2>5. Sécurité</h2>
          <ul>
            <li>Vous êtes responsable de la sécurité de votre mot de passe.</li>
            <li>Ne partagez jamais vos identifiants de connexion avec des tiers.</li>
            <li>Le service client officiel ne vous demandera jamais votre mot de passe.</li>
          </ul>
        </section>
      </div>
      </div>
    </main>
  );
}
