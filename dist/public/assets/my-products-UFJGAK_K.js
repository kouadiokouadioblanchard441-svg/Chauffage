import{a as b,j as e,L as w}from"./index-CSlrpGqk.js";import{u as y}from"./useQuery-CkD4-pvB.js";import{g as j}from"./countries-BtFzSwEU.js";import{e as v,c as z}from"./ChargePoint-CPF50-electric-car-fleet-charging-station-EVSE-1_1790160713799-rrbcnEkG.js";import{c as N}from"./chargepoint_1790147948102-DERXNZnU.js";import{c as k}from"./auth-chargepoint-combined-0mIqx7uW.js";import{c as P}from"./ChargePoint-Home-Flex-50A-CPH50-app-1280px__29346__78945__7114_1790148214522-yvZ7D-Rf.js";import{c as S,a as D}from"./overview-cpf50-no-bg-C0Yct3q1.js";const l=[z,P,S,D];function R(){const{user:i}=b(),{data:f,isLoading:h}=y({queryKey:["/api/user/products"],staleTime:0});if(!i)return null;j(i.country);const o="PHP",s=f||[];s.filter(r=>r.status==="active").length;const a=Math.round(Number(i.totalEarnings||0)),u=r=>`${r.toLocaleString("en-PH")} ${o}`,g=r=>{if(!r)return"-";const t=new Date(r),c=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],n=t.getDate(),p=c[t.getMonth()],d=t.getFullYear(),x=String(t.getHours()).padStart(2,"0"),m=String(t.getMinutes()).padStart(2,"0");return`${n} ${p} ${d}, ${x}:${m}`};return e.jsxs("main",{className:"products-reference min-h-full bg-[#f1fff4] pb-24",children:[e.jsx("style",{children:`
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
      `}),e.jsxs("div",{className:"products-screen",children:[e.jsxs("header",{className:"products-header",children:[e.jsx("img",{src:N,alt:"ChargePoint"}),e.jsx("strong",{children:"My products"})]}),e.jsxs("section",{className:"products-hero","aria-label":"Products",children:[e.jsx("img",{src:k,alt:"ChargePoint charging solutions"}),e.jsxs("div",{className:"hero-copy",children:[e.jsx("strong",{children:"ChargePoint"}),e.jsx("span",{children:"Your purchased products and earnings"})]}),e.jsxs("div",{className:"stat-panel my my-only active","aria-label":`Earnings: ${u(a)}`,children:[e.jsx("span",{className:"stat-value",children:u(a)}),e.jsx("span",{className:"stat-label",children:"Total earnings"})]})]}),e.jsx("div",{className:"product-list",children:e.jsx("div",{children:h?e.jsx("div",{className:"flex justify-center py-12",children:e.jsx(w,{className:"w-8 h-8 animate-spin text-[#FF7A14]"})}):s.length===0?e.jsxs("div",{className:"empty",children:[e.jsx("img",{src:v,alt:"No purchased products"}),e.jsx("p",{children:"No ChargePoint products purchased"}),e.jsx("p",{className:"text-sm text-gray-400",children:"Buy products to start earning"})]}):s.map((r,t)=>{const c=r.product?.cycleDays||60,n=r.daysRemaining||0,p=Math.max(0,c-n),d=parseFloat(r.totalEarned||"0");return e.jsxs("div",{className:"product-card my-card","data-testid":`my-product-card-${r.id}`,children:[e.jsx("div",{className:"product-picture",children:e.jsx("img",{src:r.product?.imageUrl||l[t%l.length],alt:r.product?.name||"Product"})}),e.jsxs("div",{className:"product-details",children:[e.jsx("p",{className:"product-name",children:r.product?.name||"Product"}),e.jsxs("p",{className:"product-price",children:[Number(r.product?.price||0).toLocaleString("en-PH")," ",o]}),e.jsxs("p",{className:"product-line",children:["Days completed:",e.jsxs("strong",{children:[p," / ",c]})]}),e.jsxs("p",{className:"product-line",children:["Earnings generated:",e.jsxs("strong",{children:[d.toLocaleString("en-PH")," ",o]})]}),e.jsxs("p",{className:"product-line",children:["Total return:",e.jsxs("strong",{children:[Number(r.product?.totalReturn||0).toLocaleString("en-PH")," ",o]})]}),e.jsxs("p",{className:"product-line",children:["Date:",e.jsx("strong",{children:g(r.purchasedAt)})]})]})]},r.id)})})})]})]})}export{R as default};
