import{c as k,a as z,b as P,u as C,r as A,j as e,L as l,q as u,f as q}from"./index-COBfaX67.js";import{u as x}from"./useQuery-Br_x6Z9G.js";import{u as R}from"./useMutation-K_ag5KO8.js";import{g as S}from"./countries-GUsSmGBG.js";import{c as E}from"./chargepoint_1790147948102-DERXNZnU.js";import{c as M}from"./auth-chargepoint-combined-0mIqx7uW.js";import{e as F,c as L}from"./ChargePoint-CPF50-electric-car-fleet-charging-station-EVSE-1_1790160713799-rrbcnEkG.js";import{c as $}from"./ChargePoint-Home-Flex-50A-CPH50-app-1280px__29346__78945__7114_1790148214522-yvZ7D-Rf.js";import{c as I,a as T}from"./overview-cpf50-no-bg-C0Yct3q1.js";import{C as D}from"./chevron-right-CCWfa9sQ.js";import{T as K}from"./triangle-alert-D4grl3sk.js";const U=k("ShoppingBag",[["path",{d:"M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z",key:"hou9p0"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M16 10a4 4 0 0 1-8 0",key:"1ltviw"}]]),h=[L,$,I,T];function ee(){const{user:c,refreshUser:f}=z(),{toast:p}=P(),[,m]=C(),[r,o]=A.useState(null),{data:g,isLoading:b}=x({queryKey:["/api/products"]}),{data:j}=x({queryKey:["/api/user/products"]}),a=R({mutationFn:async s=>{const i=await q("POST",`/api/products/${s}/purchase`,{});if(!i.ok){const N=await i.json();throw new Error(N.message||"Achat impossible")}return i.json()},onSuccess:()=>{u.invalidateQueries({queryKey:["/api/products"]}),u.invalidateQueries({queryKey:["/api/user/products"]}),f(),o(null),p({title:"Produit acheté !",description:"Vous commencerez à recevoir des gains demain."})},onError:s=>{o(null),p({title:"Achat impossible",description:s.message,variant:"destructive"})}});if(!c)return null;const v=S(c.country)?.currency||"FCFA",t=s=>`${v} ${Math.round(s).toLocaleString("fr-FR")}`,d=g?.filter(s=>!s.isFree)||[],n=(j||[]).filter(s=>s.status==="active"),y=n.length,w=n.reduce((s,i)=>s+Number(i.product?.dailyEarnings||0),0);return e.jsxs("main",{className:"cp-products-page",children:[e.jsx("style",{children:`
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
      `}),e.jsxs("div",{className:"cp-products-shell",children:[e.jsxs("header",{className:"cp-products-header",children:[e.jsxs("div",{className:"cp-products-brand",children:[e.jsx("img",{src:E,alt:"ChargePoint"}),e.jsx("strong",{children:"Produits"})]}),e.jsx("button",{className:"cp-products-service",onClick:()=>m("/service"),children:"Service"})]}),e.jsxs("section",{className:"cp-products-hero","aria-label":"Catalogue ChargePoint",children:[e.jsx("img",{src:M,alt:""}),e.jsxs("div",{className:"cp-products-hero-copy",children:[e.jsx("h1",{children:"Équipements ChargePoint"}),e.jsx("p",{children:"Choisissez un produit et commencez à recevoir vos revenus quotidiens."})]})]}),e.jsxs("section",{className:"cp-products-stats","aria-label":"Résumé des produits",children:[e.jsxs("div",{className:"cp-products-stat",children:[e.jsx("span",{className:"cp-products-stat-icon",children:e.jsx(U,{"aria-hidden":"true"})}),e.jsxs("span",{children:[e.jsx("strong",{className:"cp-products-stat-value",children:y}),e.jsx("small",{className:"cp-products-stat-label",children:"Mes équipements"})]})]}),e.jsxs("div",{className:"cp-products-stat",children:[e.jsx("span",{className:"cp-products-stat-icon",children:e.jsx("span",{"aria-hidden":"true",children:"XAF"})}),e.jsxs("span",{children:[e.jsx("strong",{className:"cp-products-stat-value",children:t(w)}),e.jsx("small",{className:"cp-products-stat-label",children:"Revenu quotidien"})]})]})]}),e.jsx("div",{className:"cp-products-section-title",children:e.jsx("h2",{children:"Nos produits"})}),e.jsx("section",{className:"cp-products-list","aria-label":"Produits disponibles",children:b?e.jsxs("div",{className:"cp-products-empty",children:[e.jsx(l,{className:"animate-spin"}),e.jsx("p",{children:"Chargement des produits..."})]}):d.length===0?e.jsxs("div",{className:"cp-products-empty",children:[e.jsx("img",{src:F,alt:""}),e.jsx("p",{children:"Aucun produit disponible pour le moment"})]}):d.map((s,i)=>e.jsxs("article",{className:`cp-product-card${s.isActive?"":" is-unavailable"}`,"data-testid":`product-card-${s.id}`,children:[e.jsx("div",{className:"cp-product-image",children:e.jsx("img",{src:s.imageUrl||h[i%h.length],alt:s.name})}),e.jsxs("div",{className:"cp-product-info",children:[e.jsxs("h3",{className:"cp-product-name",children:[s.name,!s.isActive&&e.jsx("span",{className:"ml-2 text-xs font-bold uppercase text-gray-500",children:"Indisponible"})]}),e.jsxs("div",{className:"cp-product-line",children:[e.jsx("span",{children:"Prix :"}),e.jsx("strong",{children:t(Number(s.price))})]}),e.jsxs("div",{className:"cp-product-line revenue",children:[e.jsx("span",{children:"Revenu quotidien :"}),e.jsx("strong",{children:t(Number(s.dailyEarnings))})]}),e.jsxs("div",{className:"cp-product-line revenue",children:[e.jsx("span",{children:"Revenu total :"}),e.jsx("strong",{children:t(Number(s.totalReturn))})]}),e.jsxs("div",{className:"cp-product-line",children:[e.jsx("span",{children:"Cycle :"}),e.jsxs("strong",{children:[s.cycleDays," jours"]})]})]}),e.jsx("button",{className:`cp-product-buy${s.isActive?"":" is-unavailable"}`,onClick:()=>s.isActive&&o(s),disabled:!s.isActive,"aria-disabled":!s.isActive,"data-testid":`button-purchase-${s.id}`,children:s.isActive?e.jsxs(e.Fragment,{children:["Acheter ",e.jsx(D,{"aria-hidden":"true",size:16})]}):"Indisponible"})]},s.id))})]}),r&&e.jsx("div",{className:"cp-products-modal-backdrop",onClick:()=>o(null),children:e.jsxs("div",{className:"cp-products-modal",onClick:s=>s.stopPropagation(),children:[e.jsx("h2",{children:r.name}),e.jsxs("p",{children:["Après l’achat, vos revenus seront crédités quotidiennement pendant ",r.cycleDays," jours."]}),e.jsxs("div",{className:"cp-product-line",children:[e.jsx("span",{children:"Prix :"}),e.jsx("strong",{children:t(Number(r.price))})]}),e.jsxs("div",{className:"cp-product-line revenue",children:[e.jsx("span",{children:"Revenu quotidien :"}),e.jsx("strong",{children:t(Number(r.dailyEarnings))})]}),Number(c.balance||0)<Number(r.price)&&e.jsxs("div",{className:"cp-products-modal-warning",children:[e.jsx(K,{size:16}),"Solde insuffisant pour acheter ce produit."]}),e.jsxs("div",{className:"cp-products-modal-actions",children:[e.jsx("button",{onClick:()=>o(null),children:"Annuler"}),e.jsx("button",{onClick:()=>a.mutate(r.id),disabled:a.isPending,children:a.isPending?e.jsx(l,{className:"mx-auto animate-spin",size:17}):"Confirmer"})]})]})})]})}export{ee as default};
