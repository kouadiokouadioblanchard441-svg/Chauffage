import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getCountryByCode } from "@/lib/countries";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import chargepointLogo from "@assets/chargepoint_1790147948102.jpg";
import chargepointHero from "@/assets/auth-chargepoint-combined.png";
import chargepointDevice from "@assets/ChargePoint-Home-Flex-50A-CPH50-app-1280px__29346__78945__7114_1790148214522.png";

interface BonusStatus {
  canClaim: boolean;
  hoursRemaining: number;
  totalBonusClaimed: number;
  daysPointed: number;
}

export default function CheckinPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: bonusStatus } = useQuery<BonusStatus>({
    queryKey: ["/api/daily-bonus-status"],
    refetchInterval: 60000,
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/claim-daily-bonus", {});
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Récompense indisponible");
      }
      return response.json();
    },
    onSuccess: (data: { amount?: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-bonus-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      const amount = Number(data?.amount || 0);
      toast({ title: "Bonus received!", description: `${amount} PHP added to your balance` });
    },
    onError: (error: Error) => {
      toast({ title: "Récompense indisponible", description: error.message, variant: "destructive" });
    },
  });

  if (!user) return null;

  const country = getCountryByCode(user.country);
  const currency = "PHP";
  const totalBonusClaimed = bonusStatus?.totalBonusClaimed || 0;
  const canClaim = Boolean(bonusStatus?.canClaim);
  const formatAmount = (amount: number) => `${Math.round(amount).toLocaleString("en-PH")} ${currency}`;

  return (
    <main className="checkin-reference min-h-full bg-[#f4f4f4] pb-20">
      <style>{`
        .checkin-reference {
          color: #111827;
          font-family: Inter, Arial, sans-serif;
          background: #fff8f2;
        }
        .checkin-reference .checkin-screen {
          width: 100%;
          max-width: 512px;
          min-height: 100%;
          margin: 0 auto;
          overflow: hidden;
          background: #fff8f2;
        }
        .checkin-reference .topbar {
          display: flex;
          min-height: 72px;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px 16px;
          border-bottom: 2px solid #111827;
          background: #fff8f2;
        }
        .checkin-reference .back {
          display: inline-flex;
          min-height: 42px;
          align-items: center;
          gap: 5px;
          padding: 7px 11px 7px 7px;
          border: 2px solid #111827;
          border-radius: 11px;
          background: #fff;
          color: #111827;
          font-size: 14px;
          font-weight: 800;
          box-shadow: 0 3px 0 #111827;
        }
        .checkin-reference .back:active {
          transform: translateY(2px);
          box-shadow: 0 1px 0 #111827;
        }
        .checkin-reference .back svg {
          width: 22px;
          height: 22px;
          stroke-width: 3;
        }
        .checkin-reference .brand {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #111827;
          font-size: 19px;
          font-weight: 800;
        }
        .checkin-reference .brand img {
          width: 34px;
          height: 34px;
          border: 2px solid #111827;
          border-radius: 50%;
          background: #fff;
          object-fit: cover;
        }
        .checkin-reference .topbar-badge {
          padding: 8px 9px;
          border: 2px solid #ff7a14;
          border-radius: 10px;
          color: #e85d00;
          font-size: 10px;
          font-weight: 800;
        }
        .checkin-reference .hero {
          position: relative;
          height: min(54vw, 276px);
          min-height: 210px;
          overflow: hidden;
          border-bottom: 2px solid #111827;
          background: #111827;
        }
        .checkin-reference .hero-art {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        .checkin-reference .hero-art::after {
          position: absolute;
          z-index: 1;
          inset: 0;
          background: linear-gradient(180deg, rgba(17, 24, 39, .06), rgba(17, 24, 39, .44));
          content: "";
          pointer-events: none;
        }
        .checkin-reference .hero-art img {
          position: relative;
          z-index: 0;
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
          pointer-events: none;
        }
        .checkin-reference .hero-copy {
          position: absolute;
          z-index: 3;
          right: 18px;
          bottom: 16px;
          left: 18px;
          color: #fff;
          text-align: right;
          text-shadow: 0 2px 4px rgba(0,0,0,.35);
        }
        .checkin-reference .hero-copy strong {
          display: block;
          font-size: 28px;
          font-weight: 900;
          line-height: 1;
        }
        .checkin-reference .hero-copy span {
          font-size: 13px;
          font-weight: 700;
        }
        .checkin-reference .earnings-card {
          position: relative;
          z-index: 4;
          display: flex;
          min-height: 116px;
          align-items: center;
          gap: 13px;
          margin: 16px 16px 0;
          padding: 16px;
          border: 2px solid #111827;
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 4px 0 #111827;
        }
        .checkin-reference .earnings-mark {
          display: grid;
          width: 72px;
          height: 72px;
          flex: 0 0 72px;
          place-items: center;
          overflow: hidden;
          border: 2px solid #ff7a14;
          border-radius: 50%;
          background: #fff3e8;
        }
        .checkin-reference .earnings-mark img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .checkin-reference .earned-total {
          color: #e85d00;
          font-size: clamp(25px, 7vw, 34px);
          font-weight: 900;
          line-height: 1;
        }
        .checkin-reference .earned-heading {
          margin-top: 7px;
          color: #111827;
          font-size: 14px;
          font-weight: 700;
        }
        .checkin-reference .earnings-check {
          display: grid;
          width: 45px;
          height: 45px;
          flex: 0 0 45px;
          place-items: center;
          margin-left: auto;
          border: 2px solid #111827;
          border-radius: 12px;
          background: #ff7a14;
          color: #111827;
          font-size: 24px;
          font-weight: 900;
        }
        .checkin-reference .reward-panel {
          margin: 18px 16px 0;
          padding: 18px;
          border: 2px solid #111827;
          border-radius: 14px;
          background: #fff3e8;
        }
        .checkin-reference .reward-heading {
          margin: 0;
          color: #111827;
          font-size: 21px;
          font-weight: 900;
          line-height: 1.05;
        }
        .checkin-reference .reward-heading span {
          color: #e85d00;
        }
        .checkin-reference .reward-row {
          display: grid;
          grid-template-columns: 112px minmax(0, 1fr);
          gap: 14px;
          align-items: center;
          margin-top: 16px;
        }
        .checkin-reference .reward-image,
        .checkin-reference .stats-image {
          width: 100%;
          height: 86px;
          overflow: hidden;
          border: 2px solid #111827;
          border-radius: 10px;
          background: #fff;
        }
        .checkin-reference .reward-image img,
        .checkin-reference .stats-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .checkin-reference .reward-copy p {
          margin: 0;
          color: #4b5563;
          font-size: 14px;
          line-height: 1.35;
        }
        .checkin-reference .reward-copy strong {
          display: block;
          margin-top: 4px;
          color: #e85d00;
          font-size: 30px;
          font-weight: 900;
          line-height: 1;
        }
        .checkin-reference .stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 14px;
        }
        .checkin-reference .stat {
          min-height: 104px;
          padding: 13px 10px;
          border: 2px solid #111827;
          border-radius: 12px;
          background: #fff;
          text-align: center;
        }
        .checkin-reference .stat-value {
          color: #e85d00;
          font-size: 31px;
          font-weight: 900;
          line-height: 1;
        }
        .checkin-reference .stat-value span {
          padding-left: 4px;
          font-size: 17px;
        }
        .checkin-reference .stat-value.secondary {
          font-size: 25px;
        }
        .checkin-reference .stat-label {
          margin-top: 9px;
          color: #4b5563;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.2;
        }
        .checkin-reference .claim {
          display: flex;
          width: calc(100% - 64px);
          min-height: 58px;
          align-items: center;
          justify-content: center;
          margin: 18px 32px 0;
          border: 2px solid #111827;
          border-radius: 12px;
          background: #ff7a14;
          color: #111827;
          font-size: 21px;
          font-weight: 900;
          line-height: 1;
          box-shadow: 0 4px 0 #111827;
        }
        .checkin-reference .claim:active:not(:disabled) {
          transform: translateY(3px);
          box-shadow: 0 1px 0 #111827;
        }
        .checkin-reference .claim:disabled {
          background: #f6c39b;
          color: #6b7280;
          box-shadow: 0 3px 0 #111827;
        }
        .checkin-reference .claim svg {
          width: 24px;
          height: 24px;
        }
        .checkin-reference .next-claim {
          margin: 10px 16px 0;
          color: #6b7280;
          font-size: 12px;
          text-align: center;
        }
        .checkin-reference .instructions {
          margin: 20px 16px 24px;
          padding: 20px 16px 8px;
          border: 2px solid #111827;
          border-top: 5px solid #ff7a14;
          border-radius: 14px;
          background: #fff;
        }
        .checkin-reference .instructions h2 {
          margin: 0 0 15px;
          color: #111827;
          font-size: 18px;
          font-weight: 900;
        }
        .checkin-reference .instruction {
          display: flex;
          gap: 9px;
          margin: 0 0 13px;
          color: #4b5563;
          font-size: 14px;
          line-height: 1.5;
        }
        .checkin-reference .instruction b {
          color: #ff7a14;
          font-size: 16px;
        }
        @media (max-width: 360px) {
          .checkin-reference .topbar { padding-right: 12px; padding-left: 12px; }
          .checkin-reference .topbar-badge { display: none; }
          .checkin-reference .earnings-card,
          .checkin-reference .reward-panel,
          .checkin-reference .instructions { margin-right: 12px; margin-left: 12px; }
          .checkin-reference .reward-row { grid-template-columns: 96px minmax(0, 1fr); gap: 10px; }
          .checkin-reference .reward-image,
          .checkin-reference .stats-image { height: 76px; }
          .checkin-reference .claim { width: calc(100% - 48px); margin-right: 24px; margin-left: 24px; }
          .checkin-reference .instruction { font-size: 13px; }
        }
      `}</style>

      <div className="checkin-screen">
        <header className="topbar">
          <button className="back" onClick={() => navigate("/")}>
            <ChevronLeft aria-hidden="true" /><span>Retour</span>
          </button>
          <div className="brand">
            <img src={chargepointLogo} alt="ChargePoint" />
            <span>Check-in</span>
          </div>
          <span className="topbar-badge">POINTAGE</span>
        </header>

        <section className="hero" aria-label="Check-in quotidien">
          <div className="hero-art">
            <img src={chargepointHero} alt="Bornes de recharge ChargePoint" />
          </div>
          <div className="hero-copy">
            <strong>ChargePoint</strong>
            <span>Votre récompense quotidienne</span>
          </div>
        </section>

        <section className="earnings-card" aria-label="Revenus du check-in">
          <div className="earnings-mark"><img src={chargepointLogo} alt="ChargePoint" /></div>
          <div>
            <p className="earned-total">{formatAmount(totalBonusClaimed)}</p>
            <p className="earned-heading">Bonus cumulé</p>
          </div>
          <div className="earnings-check" aria-hidden="true">✓</div>
        </section>

        <section className="reward-panel" aria-label="Récompense quotidienne">
          <h2 className="reward-heading">Récompense du <span>pointage quotidien</span></h2>
          <div className="reward-row">
            <div className="reward-image"><img src={chargepointHero} alt="Solutions de recharge ChargePoint" /></div>
            <div className="reward-copy">
              <p>Recevez une récompense chaque jour</p>
              <strong>20 à 50 {currency}</strong>
            </div>
          </div>
          <div className="stats">
            <div className="stat">
              <p className="stat-value">{bonusStatus?.daysPointed || 0}</p>
              <p className="stat-label">Jours de pointage</p>
            </div>
            <div className="stat">
              <div className="stats-image"><img src={chargepointDevice} alt="Borne ChargePoint et application" /></div>
              <p className="stat-label">Activité récente</p>
            </div>
          </div>
        </section>

        <button
          className="claim"
          onClick={() => claimMutation.mutate()}
          disabled={!canClaim || claimMutation.isPending}
          data-testid="button-pointer"
        >
          {claimMutation.isPending ? (
            <Loader2 className="animate-spin" />
          ) : canClaim ? (
            "Check-in"
          ) : (
            `${bonusStatus?.hoursRemaining || 0}h`
          )}
        </button>
        {!canClaim && bonusStatus?.hoursRemaining ? (
          <p className="next-claim">Prochain check-in dans {bonusStatus.hoursRemaining}h</p>
        ) : null}

        <section className="instructions" aria-label="Instructions du pointage">
          <h2>Comment fonctionne le pointage ?</h2>
          <p className="instruction"><b>1.</b><span>Effectuez votre pointage une fois par jour pour recevoir la récompense.</span></p>
          <p className="instruction"><b>2.</b><span>La récompense est ajoutée automatiquement à votre solde après validation.</span></p>
          <p className="instruction"><b>3.</b><span>Revenez chaque jour pour continuer à cumuler vos bonus.</span></p>
        </section>
      </div>
    </main>
  );
}