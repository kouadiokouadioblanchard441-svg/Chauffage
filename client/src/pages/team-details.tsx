import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft, UsersRound } from "lucide-react";
import whatsappIcon from "@assets/images_(26)_1787367952281.png";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { getCountryByCode, type ApiCountry } from "@/lib/countries";
import "./team-details.css";

interface TeamMember {
  id: number;
  maskedPhone: string;
  whatsappNumber: string | null;
  isDemo: boolean;
  demoPreview: {
    maskedPhone: string;
    vipLevel: number;
    totalInvested: number;
    totalReferralRevenue: number;
  } | null;
  totalReferralRevenue: number;
  vipLevel: number | null;
}

interface TeamDetails {
  level1: TeamMember[];
  level2: TeamMember[];
  level3: TeamMember[];
  totalLevel1Invested: number;
  totalLevel2Invested: number;
  totalLevel3Invested: number;
}

const levelFromUrl = (): 1 | 2 | 3 => {
  const level = Number(new URLSearchParams(window.location.search).get("level"));
  return level === 2 || level === 3 ? level : 1;
};

export default function TeamDetailsPage() {
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(levelFromUrl);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: team, isLoading, isFetching, isError, refetch } = useQuery<TeamDetails>({
    queryKey: ["/api/team/details"],
    staleTime: 30_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const { data: countries } = useQuery<ApiCountry[]>({ queryKey: ["/api/countries"] });

  const currency = "PHP";
  const levels = [
    { num: 1 as const, name: "A", members: team?.level1 || [], totalInvested: team?.totalLevel1Invested || 0 },
    { num: 2 as const, name: "B", members: team?.level2 || [], totalInvested: team?.totalLevel2Invested || 0 },
    { num: 3 as const, name: "C", members: team?.level3 || [], totalInvested: team?.totalLevel3Invested || 0 },
  ];
  const selected = levels[activeLevel - 1];
  const demoInvested = selected.members.reduce((total, member) => total + (member.demoPreview?.totalInvested || 0), 0);
  const hasDemoMembers = selected.members.some(member => member.isDemo);
  const message = activeLevel === 1
    ? "Hello! I am your ChargePoint sponsor. I wanted to make sure everything is going well. If you have questions about registration, products, or using the app, tell me what is unclear. I will explain and guide you step by step. Feel free to message me here!"
    : "Hello! I am part of your ChargePoint referral team. I wanted to make sure everything is going well. If you have questions about registration, products, or using the app, tell me what is unclear. I will explain and guide you step by step. Feel free to message me here!";

  return (
    <main className="team-details-page">
      <div className="team-details-shell">
        <header className="team-details-header">
          <button type="button" onClick={() => navigate("/team")} aria-label="Back to team" data-testid="button-back-team">
            <ChevronLeft aria-hidden="true" />
          </button>
           <h1 data-testid="text-page-title">Team details</h1>
          <span>ChargePoint</span>
        </header>

        <div className="team-details-content" aria-busy={isLoading || isFetching}>
          <nav className="team-details-tabs" aria-label="Choose a team level">
            {levels.map(level => (
              <button
                type="button"
                key={level.num}
                onClick={() => setActiveLevel(level.num)}
                className={activeLevel === level.num ? "is-active" : ""}
                aria-current={activeLevel === level.num ? "true" : undefined}
                data-testid={`tab-level-${level.num}`}
              >
                Team {level.name}
              </button>
            ))}
          </nav>

          {hasDemoMembers && (
            <p className="team-details-demo-notice">
               Demo preview: the purchases, VIP levels, and bonuses below are fictional examples. They do not affect your balance or real transactions.
            </p>
          )}

          <section className="team-details-stats" aria-label={`Team ${selected.name} summary`}>
            <div>
               <span>Team members</span>
              <strong data-testid="text-member-count">{isLoading ? "…" : selected.members.length}</strong>
            </div>
            <div>
               <span>Team purchases</span>
              <strong data-testid="text-total-invested">{isLoading ? "…" : `${(Number(selected.totalInvested) + demoInvested).toLocaleString("en-PH")} ${currency}`}</strong>
              {demoInvested > 0 && <small>including {demoInvested.toLocaleString("en-PH")} {currency} fictional</small>}
            </div>
          </section>

          <section className="team-details-members" aria-label={`Team ${selected.name} referrals`}>
             <h2>Referrals · Team {selected.name}</h2>
            <p className="team-details-explanation">
               Total earnings represent referral bonuses received for each member.
            </p>
            <div className="team-details-columns" aria-hidden="true">
               <span>User</span><span>Total earnings</span><span>VIP</span><span>Contact</span>
            </div>

            {isLoading ? (
               <div className="team-details-loading" aria-label="Loading referrals">
                {[0, 1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : isError ? (
              <div className="team-details-empty" role="alert">
                <strong>Unable to load team members.</strong>
                <span>Check your connection and try again.</span>
                <button type="button" className="team-details-retry" onClick={() => void refetch()} disabled={isFetching}>
                  {isFetching ? "Loading…" : "Retry"}
                </button>
              </div>
            ) : selected.members.length === 0 ? (
              <div className="team-details-empty">
                <UsersRound aria-hidden="true" />
                <strong>No members in team {selected.name}</strong>
                <span>Invite people you know to grow your team.</span>
              </div>
            ) : selected.members.map(member => {
              const phone = member.maskedPhone;
              const whatsappHref = member.isDemo
                ? `https://wa.me/?text=${encodeURIComponent(message)}`
                : member.whatsappNumber ? `https://wa.me/${member.whatsappNumber}?text=${encodeURIComponent(message)}` : null;
              return (
                <div className="team-details-row" key={member.id} data-testid={`team-member-${member.id}`}>
                  <strong data-testid={`text-member-phone-${member.id}`}>
                    {phone}
                    {member.isDemo && <small className="team-details-demo">Demo</small>}
                  </strong>
                  <span className="team-details-revenue" data-testid={`text-member-revenue-${member.id}`}>
                    {Number(member.demoPreview?.totalReferralRevenue ?? member.totalReferralRevenue).toLocaleString("en-PH")}
                    <small>{currency}</small>
                  </span>
                  <span className="team-details-vip" data-testid={`text-member-vip-${member.id}`}>
                    {(member.demoPreview?.vipLevel ?? member.vipLevel) ? `VIP ${member.demoPreview?.vipLevel ?? member.vipLevel}` : "—"}
                  </span>
                  {whatsappHref ? (
                    <a
                      className="team-details-whatsapp"
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={member.isDemo ? "WhatsApp message preview without a recipient" : `Write to ${phone} on WhatsApp`}
                      title={member.isDemo ? "Demo: message has no recipient" : undefined}
                      data-testid={`whatsapp-member-${member.id}`}
                    >
                      <img src={whatsappIcon} alt="" />
                    </a>
                  ) : (
                    <span className="team-details-contact-unavailable" title={member.isDemo ? "Fictional referral: contact unavailable" : "WhatsApp number unavailable"} aria-label="WhatsApp number unavailable">—</span>
                  )}
                </div>
              );
            })}
          </section>
        </div>
      </div>
    </main>
  );
}