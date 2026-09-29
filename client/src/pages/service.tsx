import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";

import chargepointLogo from "@assets/chargepoint_1790147948102.jpg";
import chargepointPromo from "@/assets/auth-chargepoint-combined.png";
import chargepointDevice from "@assets/ChargePoint-Home-Flex-50A-CPH50-app-1280px__29346__78945__7114_1790148214522.png";

interface LinksSettings {
  supportLink: string;
  groupLink: string;
}

export default function ServicePage() {
  const { data: settings } = useQuery<LinksSettings>({
    queryKey: ["/api/settings/links"],
  });

  const supportLinks = [
    { label: "Customer support", href: settings?.supportLink || "https://t.me/sybotx", testId: "button-support-link", size: "short" },
    { label: "Official group", href: settings?.groupLink || "https://t.me/sybotx", testId: "button-group-link", size: "tall" },
  ];

  return (
    <main className="service-reference">
      <style>{`
        .service-reference { min-height: 100dvh; background: #fff8f2; color: #111827; font-family: Arial, sans-serif; }
        .service-reference .service-screen { width: 100%; max-width: 512px; min-height: 100dvh; margin: 0 auto; overflow: hidden; background: #fff8f2; }
        .service-reference .service-header { display: flex; min-height: 78px; align-items: center; gap: 14px; padding: 16px; border-bottom: 2px solid #111827; background: #fff; }
        .service-reference .service-back { display: grid; width: 42px; height: 42px; flex: none; place-items: center; border: 2px solid #111827; border-radius: 11px; padding: 0; background: #fff; box-shadow: 0 3px 0 #111827; color: #111827; }
        .service-reference .service-back svg { width: 22px; height: 22px; stroke-width: 2.5; }
        .service-reference .service-brand { display: flex; min-width: 0; align-items: center; gap: 10px; }
        .service-reference .service-logo { width: 45px; height: 45px; flex: none; border: 2px solid #111827; border-radius: 50%; object-fit: cover; }
        .service-reference .service-title { margin: 0; color: #111827; font-size: 20px; font-weight: 800; line-height: 1.2; }
        .service-reference .benefits { padding: 16px; background: #fff8f2; }
        .service-reference .benefit-banner { display: block; width: 100%; height: 184px; border: 2px solid #111827; border-radius: 13px; object-fit: cover; object-position: center; box-shadow: 0 4px 0 #111827; }
        .service-reference .telegram-section { box-sizing: border-box; padding: 22px 16px 24px; border-top: 2px solid #111827; border-bottom: 2px solid #111827; background: #fff; }
        .service-reference .telegram-title { margin: 0 0 18px; color: #111827; font-size: 24px; font-weight: 800; line-height: 1.2; text-align: left; }
        .service-reference .telegram-grid { display: grid; grid-template-columns: minmax(0, 40%) minmax(0, 1fr); gap: 16px; align-items: start; }
        .service-reference .bike-image { width: 100%; height: 194px; margin: 0; border: 2px solid #111827; border-radius: 12px; object-fit: cover; object-position: center; background: #fff; }
        .service-reference .telegram-actions { min-width: 0; }
        .service-reference .telegram-link { position: relative; display: grid; width: 100%; align-items: center; justify-items: center; box-sizing: border-box; border: 2px solid #111827; border-radius: 11px; padding: 0 37px 0 10px; background: #fff; color: #111827; font-size: 17px; font-weight: 800; line-height: 23px; text-align: center; white-space: pre-line; box-shadow: 0 3px 0 #111827; transition: transform .12s ease, background-color .12s ease; }
        .service-reference .telegram-link.short { height: 62px; }
        .service-reference .telegram-link.tall { height: 78px; margin-top: 14px; }
        .service-reference .telegram-link:active { transform: translateY(2px); background: #fff1e6; box-shadow: 0 1px 0 #111827; }
        .service-reference .telegram-link svg { position: absolute; right: 11px; width: 22px; height: 22px; color: #ff7a14; stroke-width: 2.5; }
        .service-reference .online-hours { margin-top: 15px; color: #4b5563; font-size: 14px; font-weight: 700; line-height: 1.45; text-align: center; white-space: normal; }
        .service-reference .online-hours p { margin: 0; }
        .service-reference .advice { min-height: 210px; box-sizing: border-box; padding: 20px 16px 70px; background: #fff8f2; }
        .service-reference .advice-title { margin: 0 0 13px; color: #111827; font-size: 18px; font-weight: 800; line-height: 24px; }
        .service-reference .advice-copy { margin: 0 0 8px; color: #4b5563; font-size: 15px; font-weight: 400; line-height: 24px; }
        @media (max-width: 370px) {
          .service-reference .service-title { font-size: 18px; }
          .service-reference .benefits { padding-right: 12px; padding-left: 12px; }
          .service-reference .telegram-section { padding-right: 14px; padding-left: 14px; }
          .service-reference .telegram-grid { grid-template-columns: minmax(0, 40%) minmax(0, 1fr); gap: 12px; }
          .service-reference .bike-image { height: 176px; }
          .service-reference .telegram-link { padding-right: 28px; font-size: 17px; line-height: 23px; }
          .service-reference .telegram-link svg { right: 4px; width: 20px; }
          .service-reference .online-hours { font-size: 13px; line-height: 1.45; }
          .service-reference .advice-copy { font-size: 16px; }
        }
      `}</style>

      <div className="service-screen">
        <header className="service-header">
          <Link href="/account">
            <button className="service-back" data-testid="button-back" aria-label="Back">
              <ChevronLeft aria-hidden="true" />
            </button>
          </Link>
          <div className="service-brand">
            <img className="service-logo" src={chargepointLogo} alt="ChargePoint" />
            <h1 className="service-title">Customer support</h1>
          </div>
        </header>

        <section className="benefits" aria-label="ChargePoint">
           <img className="benefit-banner" src={chargepointPromo} alt="ChargePoint charging solutions" />
        </section>

        <section className="telegram-section" aria-labelledby="support-heading">
           <h2 id="support-heading" className="telegram-title">ChargePoint support</h2>
          <div className="telegram-grid">
             <img className="bike-image" src={chargepointDevice} alt="ChargePoint charging station" />
            <div className="telegram-actions">
              {supportLinks.map((link) => (
                <button key={link.testId} type="button" className={`telegram-link ${link.size}`} onClick={() => window.open(link.href, "_blank")} data-testid={link.testId}>
                  {link.label}
                  <ChevronRight aria-hidden="true" />
                </button>
              ))}
              <div className="online-hours">
                <p>Online hours:</p>
                <p>9:00 AM-7:00 PM</p>
              </div>
            </div>
          </div>
        </section>

        <section className="advice" aria-label="Tips">
           <h2 className="advice-title">TIPS:</h2>
           <p className="advice-copy">1. If you have any questions, contact our online customer support. We will be happy to help.</p>
           <p className="advice-copy">2. Keep your password safe and never share it with anyone.</p>
        </section>
      </div>
    </main>
  );
}