import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import "./about.css";

export default function AboutPage() {
  return (
    <main className="cp-about-page">
      <div className="cp-about-screen">
        <header className="cp-about-header">
        <Link href="/account">
          <button className="cp-about-back" data-testid="button-back">
            <ChevronLeft aria-hidden="true" />
            <span>Back</span>
          </button>
        </Link>
          <h1>About us</h1>
        </header>

        <div className="cp-about-body">
          <p className="cp-about-lead">
            ChargePoint is a digital platform created in 2024 to make charging solutions, connected products, and related services simpler, more accessible, and more transparent for everyone.
          </p>

          <p>
            Created in 2024, ChargePoint serves individuals, professionals, and partners who want a modern platform, activity tracking, and products designed to generate progressive value over time.
          </p>

          <h2>Our story</h2>
          <p>
            ChargePoint began with a simple idea: users should access modern services from one platform, with clear information and support at every step. From the start, the brand was designed around a fast, clear mobile experience adapted to everyday needs.
          </p>
          <p>
            Our development is based on listening to users, continuously improving our tools, and building a lasting relationship with our community. Every platform update aims to simplify product access, activity tracking, and understanding of the services we offer.
          </p>

          <h2>Our mission</h2>
          <p>
            ChargePoint’s mission is to bring technology closer to users. We provide one place where everyone can discover available solutions, review important information, track transactions, and quickly find help when needed.
          </p>
          <p>
            We work to ensure technology is not a source of complexity. Flows use simple steps, visible guidance, and accessible language regardless of the user’s level of digital experience.
          </p>

          <h2>Our vision for investors</h2>
          <p>
            ChargePoint aims to provide simpler access to digital opportunities for investors. Our vision is a platform designed for local realities, with mobile-friendly flows, accessible payment methods, and understandable information before every decision.
          </p>
          <p>
            We want every member to start gradually, track their activity, and better understand how a product works. The goal is not to promise immediate wealth, but to build a structured experience with clear information and visibility into transactions.
          </p>

          <h2>What happens when a product is purchased?</h2>
          <p>
            When an investor purchases a ChargePoint product, the purchase is recorded in their personal area. They can find it in <strong>My purchased products</strong>, with key information: product price, cycle duration, expected daily earnings, expected total return, purchase date, and activity progress.
          </p>
          <p>
            Each product has its own terms. Once activated, associated earnings are calculated according to the selected product, its duration, and the rules shown at purchase. Earnings are tracked in the personal area so investors can view progress and product status.
          </p>

          <h2>Earnings an investor may receive</h2>
          <p>
            Depending on the selected product, an investor may receive daily earnings for the planned cycle duration. The total depends on the purchased product and its terms. The platform shows this information before confirmation so users know the price, expected daily earnings, duration, and expected total return.
          </p>
          <p>
            Displayed earnings reflect the product terms and must not be interpreted as a promise of automatic or risk-free returns. Before any purchase, investors should read the available information, ensure they understand how the product works, and use only funds they can afford.
          </p>

          <h2>What we offer</h2>
          <ul>
            <li>A mobile platform designed for everyday simplicity.</li>
            <li>Solutions and products related to charging and connected equipment.</li>
            <li>A personal area to review your balance, history, and activity.</li>
            <li>Tracking for acquired products, how they work, and associated earnings where applicable.</li>
            <li>Support and guidance to answer user questions.</li>
            <li>A community that can grow through information sharing and referrals.</li>
          </ul>

          <h2>Our goals</h2>
          <p>
            Our primary goal is to make digital services more accessible in the markets where ChargePoint is available. We want to develop tools adapted to local realities, community payment methods, and user habits.
          </p>
          <p>
            We also want to keep improving product quality, make support faster, and provide better visibility into every transaction. Trust is built with clear information, understandable history, and rules shown before every important action.
          </p>
          <p>
            In the long term, ChargePoint aims to become a trusted destination for charging solutions and related digital services: a reliable, practical platform that evolves with user needs.
          </p>

          <h2>Our commitments</h2>
          <ul>
            <li><strong>Clarity:</strong> present terms, steps, and essential information clearly.</li>
            <li><strong>Accessibility:</strong> design an experience suited to phones and everyday connections.</li>
            <li><strong>Listening:</strong> use feedback to continuously improve the platform.</li>
            <li><strong>Security:</strong> protect accounts and handle transactions responsibly.</li>
            <li><strong>Responsibility:</strong> remind every user to review terms before any transaction.</li>
            <li><strong>Useful innovation:</strong> prioritize features that deliver real value over complexity.</li>
          </ul>

          <h2>Our vision</h2>
          <p>
            We imagine a future where access to equipment, charging services, and digital tools no longer depends on complicated flows. ChargePoint wants to contribute by bringing technology, simplicity, and support together in one experience.
          </p>
          <p>
            Thank you for being part of the ChargePoint journey. Your feedback, suggestions, and trust help us build a more useful, clearer platform closer to the real needs of its community.
          </p>
        </div>
      </div>
    </main>
  );
}
