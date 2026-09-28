import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getCountryByCode } from "@/lib/countries";
import { AlertTriangle, ChevronRight, Loader2, ShoppingBag } from "lucide-react";
import { useLocation } from "wouter";
import type { Product } from "@shared/schema";

import chargepointLogo from "@assets/chargepoint_1790147948102.jpg";
import chargepointPromo from "@/assets/auth-chargepoint-combined.png";
import emptyProductsIllustration from "@assets/generated_images/chargepoint-empty-products.png";
import chargepointProduct1 from "@assets/ChargePoint-CPF50-electric-car-fleet-charging-station-EVSE-1_1790160713799.jpg";
import chargepointProduct2 from "@assets/ChargePoint-Home-Flex-50A-CPH50-app-1280px__29346__78945__7114_1790148214522.png";
import chargepointProduct3 from "@assets/overview-chargeflex-no-bg.png";
import chargepointProduct4 from "@assets/overview-cpf50-no-bg.png";

const PRODUCT_IMAGES = [
  chargepointProduct1, chargepointProduct2, chargepointProduct3, chargepointProduct4,
];

interface ProductWithOwnership extends Product {
  isOwned: boolean;
  canClaimFree: boolean;
  ownedCount?: number;
}

export default function ProductsPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedProduct, setSelectedProduct] = useState<ProductWithOwnership | null>(null);

  const { data: products, isLoading } = useQuery<ProductWithOwnership[]>({
    queryKey: ["/api/products"],
  });

  const { data: userProducts } = useQuery<any[]>({
    queryKey: ["/api/user/products"],
  });

  const purchaseMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest("POST", `/api/products/${productId}/purchase`, {});
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Achat impossible");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/products"] });
      refreshUser();
      setSelectedProduct(null);
      toast({ title: "Produit acheté !", description: "Vous commencerez à recevoir des gains demain." });
    },
    onError: (error: Error) => {
      setSelectedProduct(null);
      toast({ title: "Achat impossible", description: error.message, variant: "destructive" });
    },
  });

  if (!user) return null;

  const country = getCountryByCode(user.country);
  const currency = "PHP";
  const formatAmount = (value: number) => `${currency} ${Math.round(value).toLocaleString("en-PH")}`;
  const availableProducts = products?.filter(product => !product.isFree) || [];
  const activeUserProducts = (userProducts || []).filter(product => product.status === "active");
  const ownedCount = activeUserProducts.length;
  const dailyRevenue = activeUserProducts.reduce(
    (sum, item) => sum + Number(item.product?.dailyEarnings || 0),
    0,
  );

  return (
    <main className="cp-products-page">
      <style>{`
        .cp-products-page {
          min-height: 100%;
          padding-bottom: 76px;
          background: #ffffff;
          color: #111827;
          font-family: Inter, Arial, sans-serif;
        }
        .cp-products-shell { width: 100%; max-width: 512px; margin: 0 auto; background: #ffffff; }
        .cp-products-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 18px;
          border-bottom: 2px solid #111827;
          background: #ffffff;
        }
        .cp-products-brand { display: flex; align-items: center; gap: 10px; }
        .cp-products-brand img {
          width: 36px; height: 36px; border: 2px solid #111827;
          border-radius: 50%; object-fit: cover; background: #fff;
        }
        .cp-products-brand strong { font-size: 18px; font-weight: 900; }
        .cp-products-service {
          border: 2px solid #111827; border-radius: 10px; padding: 7px 10px;
          background: #ffffff; color: #111827; font-size: 12px; font-weight: 800;
          box-shadow: 0 2px 0 #111827;
        }
        .cp-products-hero {
          position: relative; min-height: 158px; overflow: hidden;
          border-bottom: 2px solid #111827; background: #fff8f2;
        }
        .cp-products-hero img { width: 100%; height: 158px; object-fit: cover; opacity: .8; }
        .cp-products-hero::after {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, rgba(255,255,255,.96), rgba(255,248,242,.18));
          content: "";
        }
        .cp-products-hero-copy {
          position: absolute; z-index: 1; top: 26px; left: 20px; max-width: 260px;
        }
        .cp-products-hero-copy h1 { margin: 0; color: #111827; font-size: 29px; font-weight: 950; line-height: 1; }
        .cp-products-hero-copy p { margin: 9px 0 0; color: #374151; font-size: 13px; line-height: 1.35; }
        .cp-products-stats {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
          padding: 16px 18px 4px; background: #ffffff;
        }
        .cp-products-stat {
          display: flex; min-height: 84px; align-items: center; gap: 11px;
          padding: 12px; border: 2px solid #111827; border-radius: 12px;
          background: #ffffff; box-shadow: 0 3px 0 #111827;
        }
        .cp-products-stat-icon {
          display: grid; width: 42px; height: 42px; flex: 0 0 42px;
          place-items: center; border-radius: 11px; background: #ff7a14; color: #111827;
        }
        .cp-products-stat-icon svg { width: 22px; height: 22px; }
        .cp-products-stat-value { display: block; color: #111827; font-size: 18px; font-weight: 900; }
        .cp-products-stat-label { display: block; margin-top: 4px; color: #4b5563; font-size: 11px; }
        .cp-products-section-title {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 18px 12px;
        }
        .cp-products-section-title h2 { margin: 0; color: #111827; font-size: 19px; font-weight: 900; }
        .cp-products-section-title span { color: #4b5563; font-size: 12px; }
        .cp-products-list { display: grid; gap: 14px; padding: 0 18px; }
        .cp-product-card {
          display: grid; grid-template-columns: 118px minmax(0, 1fr);
          gap: 14px; padding: 15px; border: 2px solid #111827;
          border-radius: 14px; background: #ffffff; box-shadow: 0 4px 0 #111827;
        }
        .cp-product-card.is-unavailable { border-color: #9ca3af; box-shadow: 0 4px 0 #9ca3af; }
        .cp-product-card.is-unavailable .cp-product-image { border-color: #9ca3af; filter: grayscale(.35); }
        .cp-product-image {
          width: 118px; height: 118px; overflow: hidden; border: 2px solid #ff7a14;
          border-radius: 11px; background: #fff8f2;
        }
        .cp-product-image img { width: 100%; height: 100%; padding: 7px; object-fit: contain; background: #fff8f2; }
        .cp-product-info { min-width: 0; }
        .cp-product-name {
          margin: 1px 0 10px; color: #111827; font-size: 18px; font-weight: 900;
          line-height: 1.15; overflow-wrap: anywhere;
        }
        .cp-product-line {
          display: flex; justify-content: space-between; gap: 8px;
          margin-top: 6px; color: #4b5563; font-size: 12px;
        }
        .cp-product-line strong { color: #111827; font-weight: 800; text-align: right; }
        .cp-product-line.revenue strong { color: #e85d00; }
        .cp-product-buy {
          grid-column: 2; justify-self: end; min-width: 126px; margin-top: -2px;
          padding: 10px 18px; border: 2px solid #111827; border-radius: 11px;
          background: #ff7a14; color: #111827; font-size: 14px; font-weight: 900;
          box-shadow: 0 3px 0 #111827, 0 7px 14px rgba(17,24,39,.14);
        }
        .cp-product-buy:active { transform: translateY(1px); }
        .cp-product-buy.is-unavailable {
          border-color: #9ca3af; background: #e5e7eb; color: #6b7280;
          box-shadow: 0 3px 0 #9ca3af; cursor: not-allowed;
        }
        .cp-products-empty {
          display: flex; min-height: 260px; flex-direction: column; align-items: center;
          justify-content: center; gap: 8px; border: 2px solid #111827; border-radius: 14px;
          background: #ffffff; color: #4b5563; text-align: center; box-shadow: 0 4px 0 #111827;
        }
        .cp-products-empty img { width: 130px; height: 130px; object-fit: contain; }
        .cp-products-empty p { margin: 0; font-size: 14px; }
        .cp-products-modal-backdrop {
          position: fixed; z-index: 60; inset: 0; display: grid; place-items: center;
          padding: 18px; background: rgba(17,24,39,.35);
        }
        .cp-products-modal {
          width: 100%; max-width: 390px; padding: 20px; border: 2px solid #111827;
          border-radius: 14px; background: #ffffff; box-shadow: 0 6px 0 #111827, 0 20px 60px rgba(0,0,0,.25);
        }
        .cp-products-modal h2 { margin: 0; color: #111827; font-size: 21px; font-weight: 900; }
        .cp-products-modal p { margin: 8px 0 0; color: #4b5563; font-size: 13px; line-height: 1.4; }
        .cp-products-modal-warning {
          display: flex; gap: 8px; margin-top: 15px; padding: 10px;
          border: 1px solid #ff0000; border-radius: 10px; background: #fff1f0; color: #ff0000;
          font-size: 12px;
        }
        .cp-products-modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px; }
        .cp-products-modal-actions button {
          padding: 11px; border: 2px solid #111827; border-radius: 10px;
          background: #ffffff; color: #111827; font-weight: 800;
        }
        .cp-products-modal-actions button:last-child { border-color: #ff7a14; background: #ff7a14; color: #111827; }
        @media (max-width: 370px) {
          .cp-product-card { grid-template-columns: 94px minmax(0, 1fr); gap: 10px; padding: 11px; }
          .cp-product-image { width: 94px; height: 108px; }
          .cp-product-name { font-size: 16px; }
          .cp-product-line { font-size: 11px; }
          .cp-product-buy { min-width: 108px; padding: 9px 12px; font-size: 12px; }
        }
      `}</style>

      <div className="cp-products-shell">
        <header className="cp-products-header">
          <div className="cp-products-brand">
            <img src={chargepointLogo} alt="ChargePoint" />
            <strong>Products</strong>
          </div>
             <button className="cp-products-service" onClick={() => navigate("/service")}>Support</button>
        </header>

        <section className="cp-products-hero" aria-label="Catalogue ChargePoint">
          <img src={chargepointPromo} alt="" />
          <div className="cp-products-hero-copy">
             <h1>ChargePoint equipment</h1>
             <p>Choose a product and start receiving daily earnings.</p>
          </div>
        </section>

        <section className="cp-products-stats" aria-label="Résumé des produits">
          <div className="cp-products-stat">
            <span className="cp-products-stat-icon"><ShoppingBag aria-hidden="true" /></span>
             <span><strong className="cp-products-stat-value">{ownedCount}</strong><small className="cp-products-stat-label">My equipment</small></span>
          </div>
          <div className="cp-products-stat">
             <span className="cp-products-stat-icon"><span aria-hidden="true">PHP</span></span>
             <span><strong className="cp-products-stat-value">{formatAmount(dailyRevenue)}</strong><small className="cp-products-stat-label">Daily earnings</small></span>
          </div>
        </section>

        <div className="cp-products-section-title">
           <h2>Our products</h2>
        </div>

        <section className="cp-products-list" aria-label="Produits disponibles">
          {isLoading ? (
             <div className="cp-products-empty"><Loader2 className="animate-spin" /><p>Loading products...</p></div>
          ) : availableProducts.length === 0 ? (
            <div className="cp-products-empty">
              <img src={emptyProductsIllustration} alt="" />
               <p>No products available at the moment</p>
            </div>
          ) : availableProducts.map((product, index) => (
            <article className={`cp-product-card${product.isActive ? "" : " is-unavailable"}`} key={product.id} data-testid={`product-card-${product.id}`}>
              <div className="cp-product-image"><img src={product.imageUrl || PRODUCT_IMAGES[index % PRODUCT_IMAGES.length]} alt={product.name} /></div>
              <div className="cp-product-info">
                <h3 className="cp-product-name">
                  {product.name}
                 {!product.isActive && <span className="ml-2 text-xs font-bold uppercase text-gray-500">Unavailable</span>}
                </h3>
                <div className="cp-product-line"><span>Prix :</span><strong>{formatAmount(Number(product.price))}</strong></div>
                <div className="cp-product-line revenue"><span>Revenu quotidien :</span><strong>{formatAmount(Number(product.dailyEarnings))}</strong></div>
                <div className="cp-product-line revenue"><span>Revenu total :</span><strong>{formatAmount(Number(product.totalReturn))}</strong></div>
                <div className="cp-product-line"><span>Cycle :</span><strong>{product.cycleDays} jours</strong></div>
              </div>
               <button
                className={`cp-product-buy${product.isActive ? "" : " is-unavailable"}`}
                onClick={() => product.isActive && setSelectedProduct(product)}
                disabled={!product.isActive}
                aria-disabled={!product.isActive}
                data-testid={`button-purchase-${product.id}`}
              >
                 {product.isActive ? <>Buy <ChevronRight aria-hidden="true" size={16} /></> : "Unavailable"}
              </button>
            </article>
          ))}
        </section>
      </div>

      {selectedProduct && (
        <div className="cp-products-modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="cp-products-modal" onClick={event => event.stopPropagation()}>
            <h2>{selectedProduct.name}</h2>
             <p>After purchase, your earnings will be credited daily for {selectedProduct.cycleDays} days.</p>
            <div className="cp-product-line"><span>Prix :</span><strong>{formatAmount(Number(selectedProduct.price))}</strong></div>
            <div className="cp-product-line revenue"><span>Revenu quotidien :</span><strong>{formatAmount(Number(selectedProduct.dailyEarnings))}</strong></div>
            {Number(user.balance || 0) < Number(selectedProduct.price) && (
               <div className="cp-products-modal-warning"><AlertTriangle size={16} />Insufficient balance to purchase this product.</div>
            )}
            <div className="cp-products-modal-actions">
               <button onClick={() => setSelectedProduct(null)}>Cancel</button>
              <button onClick={() => purchaseMutation.mutate(selectedProduct.id)} disabled={purchaseMutation.isPending}>
                 {purchaseMutation.isPending ? <Loader2 className="mx-auto animate-spin" size={17} /> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}