import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { getCountryByCode } from "@/lib/countries";
import { Loader2 } from "lucide-react";

import emptyProductsIllustration from "@assets/generated_images/chargepoint-empty-products.png";
import chargepointLogo from "@assets/chargepoint_1790147948102.jpg";
import chargepointPromo from "@/assets/auth-chargepoint-combined.png";
import chargepointProduct1 from "@assets/ChargePoint-CPF50-electric-car-fleet-charging-station-EVSE-1_1790160713799.jpg";
import chargepointProduct2 from "@assets/ChargePoint-Home-Flex-50A-CPH50-app-1280px__29346__78945__7114_1790148214522.png";
import chargepointProduct3 from "@assets/overview-chargeflex-no-bg.png";
import chargepointProduct4 from "@assets/overview-cpf50-no-bg.png";

const PRODUCT_IMAGES = [
  chargepointProduct1,
  chargepointProduct2,
  chargepointProduct3,
  chargepointProduct4,
];

export default function MyProductsPage() {
  const { user } = useAuth();

  const { data: userProducts, isLoading: loadingUserProducts } = useQuery<any[]>({
    queryKey: ["/api/user/products"],
    staleTime: 0,
  });

  if (!user) return null;

  const country = getCountryByCode(user.country);
  const currency = "PHP";
  const allUserProducts = userProducts || [];
  const activeUserProducts = allUserProducts.filter(up => up.status === "active");
  const activeProductCount = activeUserProducts.length;
  const totalUserEarnings = Math.round(Number(user.totalEarnings || 0));
  const formatStatAmount = (amount: number) => `${amount.toLocaleString("en-PH")} ${currency}`;

  // Format date as "20 Jul 2026, 15:00"
  const formatPurchaseDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  };

  return (
    <main className="products-reference min-h-full bg-[#f1fff4] pb-24">
      <style>{`
        .products-reference { color: #151515; font-family: Inter, Arial, sans-serif; }
        .products-reference .products-screen { width: 100%; max-width: 500px; margin: 0 auto; overflow: hidden; }
         .products-reference .products-hero { position: relative; height: min(70.31vw, 360px); min-height: 270px; overflow: hidden; background: #3fcb2d; }
         .products-reference .products-hero img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: top; pointer-events: none; }
         .products-reference .stat-panel { position: absolute; top: 58%; z-index: 1; display: flex; height: 38%; flex-direction: column; align-items: center; justify-content: center; gap: 10px; border: 0; border-radius: 24px; background: #4bcf37; color: #fff; text-align: center; pointer-events: none; }
         .products-reference .stat-panel.our { left: 4%; width: 45%; }
         .products-reference .stat-panel.my { right: 4%; width: 45%; }
         .products-reference .stat-value { display: block; max-width: 100%; overflow: hidden; padding: 0 8px; font-size: clamp(20px, 5vw, 30px); font-weight: 500; line-height: 1; text-overflow: ellipsis; white-space: nowrap; }
         .products-reference .stat-label { display: block; font-size: clamp(14px, 3.5vw, 20px); font-weight: 500; line-height: 1; }
         .products-reference .stat-toggle { position: absolute; top: 58%; z-index: 2; height: 38%; background: transparent; }
         .products-reference .stat-toggle.our { left: 4%; width: 45%; }
         .products-reference .stat-toggle.my { right: 4%; width: 45%; }
         .products-reference .product-list { padding: 0 12px 20px; background: white; }
         .products-reference .product-card { position: relative; height: 265px; margin-bottom: 0; overflow: hidden; border: 0; border-bottom: 1px solid #eeeeee; border-radius: 0; background: white; box-shadow: none; }
         .products-reference .product-picture { position: absolute; top: 12px; right: 7px; left: auto; width: 154px; height: 154px; overflow: hidden; border: 2px solid #7fc9a2; border-radius: 11px; background: #fff; }
         .products-reference .product-picture img { width: 100%; height: 100%; object-fit: cover; }
         .products-reference .product-details { position: absolute; top: 17px; left: 31px; right: 181px; overflow: hidden; }
         .products-reference .product-name { overflow: hidden; color: #42bd45; font-size: 23px; font-weight: 500; line-height: 1.15; text-overflow: ellipsis; white-space: nowrap; }
         .products-reference .product-price { margin-top: 22px; color: #171717; font-size: 17px; font-weight: 400; }
         .products-reference .product-line { margin-top: 12px; color: #171717; font-size: 16px; line-height: 1.15; white-space: normal; overflow-wrap: anywhere; }
         .products-reference .product-line strong { margin-left: 8px; color: #171717; font-weight: 400; }
         .products-reference .buy { position: absolute; right: 7px; bottom: 25px; display: grid; width: 154px; height: 61px; place-items: center; border-radius: 14px; background: linear-gradient(180deg, #43d338 0%, #19b948 100%); color: white; font-size: 18px; font-weight: 400; line-height: 1.1; text-align: center; }
         .products-reference .my-card { height: 265px; padding-bottom: 0; }
         .products-reference .my-card .product-details { position: absolute; top: 17px; left: 31px; right: 181px; margin-left: 0; padding-top: 0; padding-right: 0; }
         .products-reference .my-card .product-picture { top: 12px; }
         .products-reference .my-card .product-line { margin-top: 12px; }
        .products-reference .empty { display: flex; min-height: 260px; flex-direction: column; align-items: center; justify-content: center; border-radius: 9px; background: white; color: #777; }
        .products-reference .empty img { width: 150px; height: 150px; object-fit: contain; }
        @media (max-width: 360px) {
             .products-reference .stat-panel { gap: 7px; border-radius: 20px; }
            .products-reference .stat-value { font-size: 18px; }
            .products-reference .stat-label { font-size: 13px; }
           .products-reference .product-picture { right: 5px; width: 112px; height: 112px; }
           .products-reference .product-details, .products-reference .my-card .product-details { left: 18px; right: 126px; }
           .products-reference .product-name { font-size: 17px; }
           .products-reference .product-price { margin-top: 18px; font-size: 14px; }
           .products-reference .product-line { margin-top: 9px; font-size: 13px; }
           .products-reference .buy { right: 5px; width: 112px; height: 52px; font-size: 14px; }
        }
         .products-reference {
           min-height: 100dvh;
           background: #fff8f2;
           color: #111827;
         }
         .products-reference .products-screen {
           max-width: 512px;
           background: #fff8f2;
         }
         .products-reference .products-header {
           display: flex;
           min-height: 72px;
           align-items: center;
           justify-content: center;
           gap: 9px;
           padding: 12px 16px;
           border-bottom: 2px solid #111827;
           background: #fff8f2;
         }
         .products-reference .products-header img {
           width: 38px;
           height: 38px;
           border: 2px solid #111827;
           border-radius: 50%;
           background: #fff;
           object-fit: cover;
         }
         .products-reference .products-header strong {
           color: #111827;
           font-size: 20px;
           font-weight: 900;
         }
         .products-reference .products-hero {
           height: 238px;
           min-height: 0;
           border-bottom: 2px solid #111827;
           background: #111827;
         }
         .products-reference .products-hero::after {
           position: absolute;
           z-index: 0;
           inset: 0;
           background: linear-gradient(180deg, rgba(17,24,39,.05), rgba(17,24,39,.62));
           content: "";
         }
         .products-reference .products-hero img {
           position: relative;
           z-index: 0;
           object-position: center;
         }
         .products-reference .hero-copy {
           position: absolute;
           z-index: 3;
           top: 18px;
           right: 18px;
           left: 18px;
           color: #fff;
           text-align: center;
           text-shadow: 0 2px 4px rgba(0,0,0,.35);
         }
         .products-reference .hero-copy strong {
           display: block;
           font-size: 27px;
           font-weight: 900;
           line-height: 1;
         }
         .products-reference .hero-copy span {
           display: block;
           margin-top: 5px;
           font-size: 12px;
           font-weight: 700;
         }
         .products-reference .stat-panel {
           top: auto;
           bottom: 14px;
           height: 72px;
           border: 2px solid #111827;
           border-radius: 12px;
           background: #fff;
           color: #111827;
           box-shadow: 0 3px 0 #111827;
         }
         .products-reference .stat-panel.active {
           background: #ff7a14;
         }
         .products-reference .stat-panel.our,
         .products-reference .stat-toggle.our { left: 16px; width: calc(50% - 22px); }
         .products-reference .stat-panel.my,
         .products-reference .stat-toggle.my { right: 16px; width: calc(50% - 22px); }
         .products-reference .stat-panel.my-only {
           right: 16px;
           left: 16px;
           width: calc(100% - 32px);
         }
         .products-reference .stat-toggle {
           top: auto;
           bottom: 14px;
           height: 72px;
         }
         .products-reference .stat-value {
           font-size: clamp(18px, 4.8vw, 25px);
           font-weight: 900;
         }
         .products-reference .stat-label {
           font-size: 12px;
           font-weight: 800;
         }
         .products-reference .product-list {
           padding: 18px 16px 28px;
           background: #fff8f2;
         }
         .products-reference .product-card {
           display: grid;
           min-height: 236px;
           grid-template-columns: minmax(0, 1fr) 124px;
           grid-template-rows: minmax(0, 1fr) 53px;
           gap: 12px;
           margin-bottom: 16px;
           padding: 14px;
           overflow: hidden;
           border: 2px solid #111827;
           border-radius: 14px;
           background: #fff;
           box-shadow: 0 4px 0 #111827;
         }
         .products-reference .product-picture {
           position: static;
           grid-column: 2;
           grid-row: 1;
           width: 100%;
           height: 116px;
           border: 2px solid #ff7a14;
           border-radius: 10px;
         }
         .products-reference .product-picture img {
           width: 100%;
           height: 100%;
           padding: 6px;
           object-fit: contain;
           background: #fff8f2;
         }
         .products-reference .product-details,
         .products-reference .my-card .product-details {
           position: static;
           grid-column: 1;
           grid-row: 1 / span 2;
           min-width: 0;
           overflow: hidden;
         }
         .products-reference .product-name {
           color: #e85d00;
           font-size: 19px;
           font-weight: 900;
           white-space: normal;
         }
         .products-reference .product-price {
           margin-top: 12px;
           color: #111827;
           font-size: 16px;
           font-weight: 900;
         }
         .products-reference .product-line {
           margin-top: 8px;
           color: #4b5563;
           font-size: 13px;
         }
         .products-reference .product-line strong {
           display: block;
           margin: 2px 0 0;
           color: #111827;
           font-weight: 800;
         }
         .products-reference .buy {
           position: static;
           grid-column: 2;
           grid-row: 2;
           width: 100%;
           height: auto;
           border: 2px solid #111827;
           border-radius: 11px;
           background: #ff7a14;
           color: #111827;
           font-size: 13px;
           font-weight: 900;
           box-shadow: 0 3px 0 #111827;
         }
         .products-reference .my-card {
           min-height: 255px;
           grid-template-rows: 1fr;
         }
         .products-reference .my-card .product-picture { grid-row: 1; }
         .products-reference .empty {
           min-height: 280px;
           border: 2px solid #111827;
           border-radius: 14px;
           background: #fff;
         }
         .products-reference .empty img { width: 120px; height: 120px; }
         @media (max-width: 360px) {
           .products-reference .products-hero { height: 228px; }
           .products-reference .product-list { padding-right: 12px; padding-left: 12px; }
           .products-reference .product-card {
             grid-template-columns: minmax(0, 1fr) 104px;
             gap: 9px;
             padding: 11px;
           }
           .products-reference .product-picture { height: 100px; }
           .products-reference .product-name { font-size: 16px; }
           .products-reference .product-line { font-size: 12px; }
           .products-reference .buy { font-size: 11px; }
         }
      `}</style>

      <div className="products-screen">
        <header className="products-header">
          <img src={chargepointLogo} alt="ChargePoint" />
          <strong>My products</strong>
        </header>
        <section className="products-hero" aria-label="Products">
          <img src={chargepointPromo} alt="ChargePoint charging solutions" />
          <div className="hero-copy"><strong>ChargePoint</strong><span>Your purchased products and earnings</span></div>
          <div className="stat-panel my my-only active" aria-label={`Earnings: ${formatStatAmount(totalUserEarnings)}`}>
            <span className="stat-value">{formatStatAmount(totalUserEarnings)}</span>
            <span className="stat-label">Total earnings</span>
          </div>
        </section>

        <div className="product-list">
          <div>
              {loadingUserProducts ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#FF7A14]" />
                </div>
              ) : allUserProducts.length === 0 ? (
                <div className="empty">
                  <img src={emptyProductsIllustration} alt="No purchased products" />
                  <p>No ChargePoint products purchased</p>
                  <p className="text-sm text-gray-400">Buy products to start earning</p>
                </div>
              ) : (
                allUserProducts.map((up: any, index: number) => {
                  const cycleDays = up.product?.cycleDays || 60;
                  const daysRemaining = up.daysRemaining || 0;
                  const daysCompleted = Math.max(0, cycleDays - daysRemaining);
                  const earnedSoFar = parseFloat(up.totalEarned || "0");

                  return (
                    <div
                      key={up.id}
                      className="product-card my-card"
                      data-testid={`my-product-card-${up.id}`}
                    >
                      <div className="product-picture"><img src={up.product?.imageUrl || PRODUCT_IMAGES[index % PRODUCT_IMAGES.length]} alt={up.product?.name || "Product"} /></div>
                      <div className="product-details">
                        <p className="product-name">{up.product?.name || "Product"}</p>
                        <p className="product-price">{Number(up.product?.price || 0).toLocaleString("en-PH")} {currency}</p>
                        <p className="product-line">Days completed:<strong>{daysCompleted} / {cycleDays}</strong></p>
                        <p className="product-line">Earnings generated:<strong>{earnedSoFar.toLocaleString("en-PH")} {currency}</strong></p>
                        <p className="product-line">Total return:<strong>{Number(up.product?.totalReturn || 0).toLocaleString("en-PH")} {currency}</strong></p>
                        <p className="product-line">Date:<strong>{formatPurchaseDate(up.purchasedAt)}</strong></p>
                      </div>
                    </div>
                  );
                })
              )}
          </div>
        </div>
      </div>
    </main>
  );
}
