import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getCountryByCode } from "@/lib/countries";
import { ChevronRight, Send } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import "./home.css";

import chargePointLogo from "@assets/chargepoint_1790147948102.jpg";
import noticeBell from "@/assets/notice-bell.png";
import announcementStar from "@/assets/announcement-star.png";
import depositIcon from "@/assets/home-actions/deposit.png";
import withdrawalIcon from "@/assets/home-actions/withdrawal.png";
import supportIcon from "@/assets/home-actions/support.png";
import checkinIcon from "@/assets/home-actions/checkin.png";
import chargingStationUser from "@assets/banner-filtered/charging-station-user.jpg";
import electricBus from "@assets/banner-filtered/electric-bus.jpg";
import homeCharging from "@assets/banner-filtered/home-charging.jpg";
import publicCharger from "@assets/banner-filtered/public-charger.jpg";
import chargerProduct from "@assets/banner-filtered/charger-product.jpg";
import chargeflexOverview from "@assets/overview-chargeflex-no-bg.png";
import cpf50Overview from "@assets/overview-cpf50-no-bg.png";
import ct4000 from "@assets/CT4000-Top-main-with-energy-star_1790148214627.png";
import doosanLogo from "@assets/6790d8bd04714fedd7593cb6_Doosan_Group_and_Corporation_-_Logo.s_1784561452870.png";
import intelLogo from "@assets/Intel-logo-2022_1782688971182.png";
import sybotxLogo from "@/assets/Logo_SYBOTX_recadre_1786844134617.png";
import vestasLogo from "@/assets/vestas-logo_1783210030332.png";
import elfLogo from "@/assets/images/elf-logo-card.png";
import jollibeeLogo from "@/assets/jollibee_logo.png";

interface Withdrawal {
  amount: string;
  status: string;
}

const quickActions = [
  { label: "Deposit", href: "/deposit", icon: depositIcon },
  { label: "Withdrawal", href: "/withdrawal", icon: withdrawalIcon },
  { label: "Support", href: "/service", icon: supportIcon },
  { label: "Check-in", href: "/checkin", icon: checkinIcon },
] as const;

const bannerSlides = [
  { image: chargingStationUser, alt: "Driver using a charging station" },
  { image: electricBus, alt: "Electric bus charging" },
  { image: homeCharging, alt: "Charging a vehicle at home" },
  { image: publicCharger, alt: "Charging stations in a public space" },
  { image: chargerProduct, alt: "ChargePoint charging equipment" },
] as const;

const announcementLibrary = [
  "052**85 received 20,000 PHP in team bonus",
  "55*368 withdrew 23,654 PHP",
  "07****42 received 12,500 PHP in team bonus",
  "01****73 withdrew 8,000 PHP",
  "05****91 received 15,000 PHP in team bonus",
  "07****26 withdrew 32,400 PHP",
  "05****14 received 10,000 PHP in team bonus",
  "01****82 withdrew 15,000 PHP",
  "07****63 received 18,500 PHP in team bonus",
  "05****47 withdrew 27,800 PHP",
  "01****29 received 25,000 PHP in team bonus",
  "07****18 withdrew 11,250 PHP",
] as const;

const partners = [
  { name: "Doosan", logo: doosanLogo, className: "cp-partner-logo-wide" },
  { name: "Vestas", logo: vestasLogo, className: "cp-partner-logo-wide" },
  { name: "ELF", logo: elfLogo, className: "cp-partner-logo-elf" },
  { name: "SYBOTX", logo: sybotxLogo, className: "cp-partner-logo-sybotx" },
  { name: "Intel", logo: intelLogo, className: "cp-partner-logo-intel" },
  { name: "Jollibee", logo: jollibeeLogo, className: "cp-partner-logo-jollibee" },
] as const;

export default function HomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  const { data: withdrawals } = useQuery<Withdrawal[]>({ queryKey: ["/api/withdrawals/history"], enabled: !!user });
  const [welcomePopupOpen, setWelcomePopupOpen] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBannerIndex((current) => (current + 1) % bannerSlides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setWelcomePopupOpen(true);
  }, []);

  if (!user) return null;
  const country = getCountryByCode(user.country);
  const currency = "PHP";
  const balance = Number.parseFloat(user.balance || "0");
  const totalEarnings = Number.parseFloat(user.totalEarnings || "0");
  const groupLink = settings?.groupLink || "";
  const popupButtonLabel = settings?.popupButtonLabel || settings?.groupLabel || "Join the official Telegram group";
  const formatMoney = (amount: number) => `${Math.round(amount).toLocaleString("en-PH")} ${currency}`;
  const formatPopupMoney = (amount: number) => `${Math.round(amount).toLocaleString("en-PH")} ${currency}`;
  const parseIntegerSetting = (key: string, fallback: number) => {
    const value = Number.parseInt(settings?.[key] || "", 10);
    return Number.isFinite(value) ? value : fallback;
  };
  const parseDecimalSetting = (key: string, fallback: number) => {
    const value = Number.parseFloat(settings?.[key] || "");
    return Number.isFinite(value) ? value : fallback;
  };
  const minimumDeposit = Math.max(3500, parseIntegerSetting("minDeposit", 3500));
  const minimumWithdrawal = parseIntegerSetting("minWithdrawal", 60);
  const withdrawalFee = parseDecimalSetting("withdrawalFees", 16);
  const withdrawalStartHour = parseIntegerSetting("withdrawalStartHour", 0);
  const withdrawalEndHour = parseIntegerSetting("withdrawalEndHour", 24);
  const maxWithdrawalsPerDay = parseIntegerSetting("maxWithdrawalsPerDay", 3);
  const withdrawalPrepaymentEnabled = settings?.withdrawalPrepaymentEnabled === "true";
  const popupRules = [
    `Minimum deposit: ${formatPopupMoney(minimumDeposit)}.`,
    `Minimum withdrawal: ${formatPopupMoney(minimumWithdrawal)}.`,
    `Withdrawal fee: ${withdrawalFee.toLocaleString("en-PH", { maximumFractionDigits: 2 })}% of the requested amount. The estimated net amount after fees is shown before confirmation.`,
    `Daily withdrawal limit: ${maxWithdrawalsPerDay} request${maxWithdrawalsPerDay === 1 ? "" : "s"} per day.`,
    `Withdrawal hours: ${String(withdrawalStartHour).padStart(2, "0")}:00 to ${String(withdrawalEndHour).padStart(2, "0")}:00.`,
    "Processing time: usually within 2 hours and, exceptionally, up to 24 hours.",
    ...(withdrawalPrepaymentEnabled
      ? ["Prepayment: 25% of the requested amount before processing."]
      : []),
    `Daily check-in bonus: ${formatPopupMoney(5)}–${formatPopupMoney(10)} per day, available once every 24 hours.`,
    "Before confirming a request, check your wallet details and the displayed net amount.",
  ];
  const withdrawnTotal = withdrawals?.filter((item) => item.status === "approved")
    .reduce((sum, item) => sum + (Number.parseFloat(item.amount) || 0), 0);

  return (
    <>
      <main className="cp-home">
        <div className="cp-shell">
          <section className="cp-hero" aria-label="ChargePoint">
            <div className="cp-hero-slides" style={{ transform: `translateX(-${bannerIndex * 100}%)` }}>
              {bannerSlides.map(({ image, alt }, index) => (
                <div className="cp-hero-slide" key={image} aria-hidden={index !== bannerIndex}>
                  <img src={image} alt={alt} />
                </div>
              ))}
            </div>
            <div className="cp-hero-dots" aria-label="Banner images">
              {bannerSlides.map((slide, index) => (
                <button
                  key={slide.image}
                  type="button"
                  className={index === bannerIndex ? "is-active" : ""}
                  onClick={() => setBannerIndex(index)}
                   aria-label={`Show image ${index + 1}`}
                  aria-pressed={index === bannerIndex}
                />
              ))}
            </div>
          </section>

           <section className="cp-actions" aria-label="Quick actions">
            {quickActions.map(({ label, href, icon }) => (
              <button key={label} className="cp-action" onClick={() => navigate(href)}>
                <span className="cp-action-icon">
                  <img src={icon} alt="" />
                </span>
                <span>{label}</span>
              </button>
            ))}
          </section>

           <button className="cp-notice" type="button" onClick={() => setWelcomePopupOpen(true)} aria-label="Open ChargePoint information" aria-describedby="cp-notice-messages">
            <span className="cp-notice-icon"><img src={noticeBell} alt="" width={26} height={26} /></span>
            <span className="cp-notice-marquee" aria-hidden="true">
              <span className="cp-notice-track">
                {[0, 1].map((copy) => (
                  <span className="cp-notice-group" key={copy}>
                    {announcementLibrary.map((announcement, index) => (
                      <span className="cp-notice-item" key={`${copy}-${index}`}>
                        <span>{announcement}</span>
                        <span className="cp-notice-stars" aria-hidden="true">
                          {[0, 1, 2].map((star) => (
                            <img src={announcementStar} alt="" key={star} />
                          ))}
                        </span>
                      </span>
                    ))}
                  </span>
                ))}
              </span>
            </span>
            <span className="sr-only" id="cp-notice-messages">{announcementLibrary.join(". ")}</span>
          </button>

           <section className="cp-overview" aria-labelledby="overview-title">
            <header className="cp-section-heading">
               <h2 id="overview-title">Overview</h2>
            </header>
            <div className="cp-metrics">
              <button className="cp-balance" type="button" onClick={() => navigate("/wallet")} aria-label={`View wallet, balance ${formatMoney(balance)}`}>
                <div className="cp-balance-image"><img src={ct4000} alt="" /></div>
                <strong data-testid="text-balance">{formatMoney(balance)}</strong>
                 <span className="cp-card-note">Balance</span>
              </button>
              <div className="cp-stack">
                <article className="cp-stat cp-stat-orange">
                  <img className="cp-stat-image cp-stat-image-chargeflex" src={chargeflexOverview} alt="" />
                  <strong data-testid="text-total-earnings">{formatMoney(totalEarnings)}</strong>
                   <span>Total earnings</span>
                </article>
                <article className="cp-stat cp-stat-ink">
                  <img className="cp-stat-image cp-stat-image-cpf50" src={cpf50Overview} alt="" />
                  <strong>{withdrawnTotal === undefined ? "—" : formatMoney(withdrawnTotal)}</strong>
                   <span>Withdrawn</span>
                   {withdrawnTotal === undefined && <small>History unavailable</small>}
                </article>
              </div>
            </div>
          </section>

          <section className="cp-partners" aria-labelledby="partners-title">
            <header className="cp-partners-heading">
               <h2 id="partners-title">Our partners</h2>
            </header>
            <div className="cp-partners-grid">
              {partners.map(({ name, logo, className }) => (
                <article className="cp-partner-card" key={name}>
                  <div className="cp-partner-logo">
                    <img className={className} src={logo} alt="" />
                  </div>
                  <span>{name}</span>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Dialog open={welcomePopupOpen} onOpenChange={setWelcomePopupOpen}>
        <DialogContent className="cp-dialog z-[60]" overlayClassName="cp-dialog-overlay">
           <DialogClose className="cp-dialog-brand-close" aria-label="Close popup">
            <img src={chargePointLogo} alt="" />
          </DialogClose>
          <div className="cp-dialog-mark" aria-hidden="true">
            <img src={chargePointLogo} alt="" />
          </div>
          <div className="cp-dialog-copy">
             <DialogTitle className="cp-dialog-title">Welcome to ChargePoint</DialogTitle>
            <DialogDescription className="cp-dialog-message">
               Welcome to ChargePoint. Before any transaction, please review the main terms for deposits, withdrawals, and bonuses.
            </DialogDescription>
            <ol className="cp-dialog-list">
              {popupRules.map((rule) => <li key={rule}>{rule}</li>)}
            </ol>
          </div>
          <div className="cp-dialog-actions">
            {groupLink && (
              <a className="cp-dialog-telegram" href={groupLink} target="_blank" rel="noreferrer" onClick={() => setWelcomePopupOpen(false)}>
                <Send size={18} aria-hidden="true" />
                <span>{popupButtonLabel}</span>
                <ChevronRight size={19} aria-hidden="true" />
              </a>
            )}
             <button className="cp-dialog-close" type="button" onClick={() => setWelcomePopupOpen(false)}>OK</button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}