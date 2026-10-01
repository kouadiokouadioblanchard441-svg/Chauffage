import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Copy } from "lucide-react";
import instagramIcon from "@assets/Instagram_icon_1787367952152.png";
import facebookIcon from "@assets/images_(27)_1787367952249.png";
import whatsappIcon from "@assets/images_(26)_1787367952281.png";
import telegramIcon from "@assets/tg-1_1787367952311.png";
import "./team.css";

interface TeamStats {
  level1Count: number;
  level2Count: number;
  level3Count: number;
  demoMemberCount: number;
  totalDepositAmount: number;
  totalWithdrawalAmount: number;
  todayNewMembers: number;
  todayDepositAmount: number;
  todayWithdrawalAmount: number;
}

function formatNumber(value: number | undefined, loading: boolean) {
  return loading ? "…" : value === undefined ? "—" : value.toLocaleString("en-PH");
}

export default function TeamPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { data: stats, isLoading, isFetching, isError, refetch } = useQuery<TeamStats>({
    queryKey: ["/api/team/stats"],
    staleTime: 30_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  if (!user) return null;

  const referralUrl = new URL("/html/register", window.location.origin);
  referralUrl.searchParams.set("code", user.referralCode);
  const referralLink = referralUrl.toString();
  const referralMessage = `Join my ChargePoint team! Sign up with my referral link:\n${referralLink}\nMy invitation code: ${user.referralCode}`;
  const referralText = "Join my ChargePoint team! Sign up with my referral link.";
  const shareLinks = [
    { name: "WhatsApp", icon: whatsappIcon, url: `https://wa.me/?text=${encodeURIComponent(referralMessage)}` },
     { name: "Telegram", icon: telegramIcon, url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(`${referralText} My invitation code: ${user.referralCode}`)}` },
     { name: "Facebook", icon: facebookIcon, url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(`${referralText} My invitation code: ${user.referralCode}`)}` },
  ];
  const totalMembers = stats
    ? stats.level1Count + stats.level2Count + stats.level3Count
    : undefined;
  const summary = [
     { label: "Total members", value: totalMembers },
    { label: "Total team deposits", value: stats?.totalDepositAmount },
    { label: "Total team withdrawals", value: stats?.totalWithdrawalAmount },
     { label: "New members today", value: stats?.todayNewMembers },
    { label: "Team deposits today", value: stats?.todayDepositAmount },
    { label: "Team withdrawals today", value: stats?.todayWithdrawalAmount },
  ];
  const levels = [
    { name: "A", count: stats?.level1Count, rate: settings?.level1Commission },
    { name: "B", count: stats?.level2Count, rate: settings?.level2Commission },
    { name: "C", count: stats?.level3Count, rate: settings?.level3Commission },
  ];

  const copy = async (value: string, description: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `${description} copied` });
    } catch {
      toast({ title: "Unable to copy", description: "Please try again.", variant: "destructive" });
    }
  };

  return (
    <main className="team-page">
      <div className="team-page-inner">
        <header className="team-header">
          <button type="button" className="team-back" onClick={() => navigate("/")} aria-label="Back to home">
            <ChevronLeft aria-hidden="true" />
          </button>
           <h1>Team</h1>
          <span className="team-header-brand">ChargePoint</span>
        </header>

        <div className="team-content" aria-busy={isLoading || isFetching}>
          <section className="team-invite" aria-label="Invitation">
            <h2>My invitation</h2>
            <div className="team-invite-row">
              <div className="team-invite-text">
                <p>Invitation code</p>
                <strong data-testid="text-referral-code">{user.referralCode}</strong>
              </div>
              <button type="button" className="team-copy" onClick={() => copy(user.referralCode, "Code")} aria-label="Copy invitation code" data-testid="button-copy-code">
                <Copy aria-hidden="true" />
              </button>
            </div>
            <div className="team-invite-row">
              <div className="team-invite-text">
                <p>Invitation link</p>
                <strong className="team-invite-link" data-testid="text-referral-link">{referralLink}</strong>
              </div>
               <button type="button" className="team-copy" onClick={() => copy(referralLink, "Link")} aria-label="Copy invitation link" data-testid="button-copy-link">
                <Copy aria-hidden="true" />
              </button>
            </div>
          </section>

          <section className="team-summary" aria-label="Team statistics">
             <h2>My team by the numbers</h2>
            {summary.map(item => (
              <div className="team-summary-item" key={item.label}>
                <strong>{formatNumber(item.value, isLoading)}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </section>
          {!!stats?.demoMemberCount && (
            <p className="team-demo-note">
              {stats.demoMemberCount} demo referrals are included in the member count. Amounts shown here remain real amounts and exclude fictional examples.
            </p>
          )}
          {isError && (
            <div className="team-error" role="alert">
              <span>Unable to load team statistics.</span>
              <button type="button" onClick={() => void refetch()} disabled={isFetching}>
                {isFetching ? "Loading…" : "Retry"}
              </button>
            </div>
          )}

          <section className="team-levels" aria-label="Team levels">
            {levels.map((level, index) => (
              <article className="team-level" key={level.name} data-testid={`vip-row-${index + 1}`}>
                <h2>Team {level.name}</h2>
                <div className="team-level-metrics">
                  <div>
                    <strong data-testid={`text-level${index + 1}-count`}>{formatNumber(level.count, isLoading)}</strong>
                     <span>Total members</span>
                  </div>
                  <div>
                    <strong>{level.rate === undefined ? "—" : `${level.rate}%`}</strong>
                    <span>Team benefits</span>
                  </div>
                </div>
                <button type="button" className="team-level-open" onClick={() => navigate(`/team-details?level=${index + 1}`)}>
                  View team {level.name} members <ChevronRight aria-hidden="true" />
                </button>
              </article>
            ))}
          </section>

           <section className="team-share" aria-label="Share my invitation">
            <h2>Share</h2>
            <div className="team-share-body">
               <p>Invite people you know to join your ChargePoint team.</p>
              <div className="team-share-links">
                {shareLinks.map(target => (
                  <a
                    key={target.name}
                    href={target.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Share my invitation link on ${target.name}`}
                    data-testid={`share-${target.name.toLowerCase()}`}
                   onClick={target.name === "Facebook" ? () => void copy(referralMessage, "Referral message") : undefined}
                  >
                    <img src={target.icon} alt="" />
                    <span>{target.name}</span>
                  </a>
                ))}
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                   aria-label="Copy my invitation message and open Instagram"
                  data-testid="share-instagram"
                  onClick={() => void copy(referralMessage, "Invitation message")}
                >
                  <img src={instagramIcon} alt="" />
                  <span>Instagram</span>
                </a>
              </div>
              <p className="team-share-note">On Instagram, the message and link are copied: paste them into your post or message.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}