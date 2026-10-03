import{a as g,b as m,u,j as e,L as b,q as d,f as k}from"./index-YxoBVKtk.js";import{u as w}from"./useQuery-DnMvua9b.js";import{u as j}from"./useMutation-CiFuJgHX.js";import{g as y}from"./countries-BtFzSwEU.js";import{c as l}from"./chargepoint_1790147948102-DERXNZnU.js";import{c as h}from"./auth-chargepoint-combined-0mIqx7uW.js";import{c as v}from"./ChargePoint-Home-Flex-50A-CPH50-app-1280px__29346__78945__7114_1790148214522-yvZ7D-Rf.js";import{C as N}from"./chevron-left-Dut7Jw0n.js";function T(){const{user:t}=g(),{toast:s}=m(),[,p]=u(),{data:r}=w({queryKey:["/api/daily-bonus-status"],refetchInterval:6e4}),n=j({mutationFn:async()=>{const i=await k("POST","/api/claim-daily-bonus",{});if(!i.ok){const c=await i.json();throw new Error(c.message||"Reward unavailable")}return i.json()},onSuccess:i=>{d.invalidateQueries({queryKey:["/api/daily-bonus-status"]}),d.invalidateQueries({queryKey:["/api/user"]});const c=Number(i?.amount||0);s({title:"Bonus received!",description:`${c} PHP added to your balance`})},onError:i=>{s({title:"Reward unavailable",description:i.message,variant:"destructive"})}});if(!t)return null;y(t.country);const o="PHP",x=r?.totalBonusClaimed||0,a=!!r?.canClaim,f=i=>`${Math.round(i).toLocaleString("en-PH")} ${o}`;return e.jsxs("main",{className:"checkin-reference min-h-full bg-[#f4f4f4] pb-20",children:[e.jsx("style",{children:`
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
      `}),e.jsxs("div",{className:"checkin-screen",children:[e.jsxs("header",{className:"topbar",children:[e.jsxs("button",{className:"back",onClick:()=>p("/"),children:[e.jsx(N,{"aria-hidden":"true"}),e.jsx("span",{children:"Back"})]}),e.jsxs("div",{className:"brand",children:[e.jsx("img",{src:l,alt:"ChargePoint"}),e.jsx("span",{children:"Check-in"})]}),e.jsx("span",{className:"topbar-badge",children:"POINTAGE"})]}),e.jsxs("section",{className:"hero","aria-label":"Check-in quotidien",children:[e.jsx("div",{className:"hero-art",children:e.jsx("img",{src:h,alt:"ChargePoint charging stations"})}),e.jsxs("div",{className:"hero-copy",children:[e.jsx("strong",{children:"ChargePoint"}),e.jsx("span",{children:"Your daily reward"})]})]}),e.jsxs("section",{className:"earnings-card","aria-label":"Check-in earnings",children:[e.jsx("div",{className:"earnings-mark",children:e.jsx("img",{src:l,alt:"ChargePoint"})}),e.jsxs("div",{children:[e.jsx("p",{className:"earned-total",children:f(x)}),e.jsx("p",{className:"earned-heading",children:"Total bonus"})]}),e.jsx("div",{className:"earnings-check","aria-hidden":"true",children:"✓"})]}),e.jsxs("section",{className:"reward-panel","aria-label":"Daily reward",children:[e.jsxs("h2",{className:"reward-heading",children:["Daily ",e.jsx("span",{children:"check-in reward"})]}),e.jsxs("div",{className:"reward-row",children:[e.jsx("div",{className:"reward-image",children:e.jsx("img",{src:h,alt:"ChargePoint charging solutions"})}),e.jsxs("div",{className:"reward-copy",children:[e.jsx("p",{children:"Receive a reward every day"}),e.jsxs("strong",{children:["5–10 ",o]})]})]}),e.jsxs("div",{className:"stats",children:[e.jsxs("div",{className:"stat",children:[e.jsx("p",{className:"stat-value",children:r?.daysPointed||0}),e.jsx("p",{className:"stat-label",children:"Check-in days"})]}),e.jsxs("div",{className:"stat",children:[e.jsx("div",{className:"stats-image",children:e.jsx("img",{src:v,alt:"Borne ChargePoint et application"})}),e.jsx("p",{className:"stat-label",children:"Recent activity"})]})]})]}),e.jsx("button",{className:"claim",onClick:()=>n.mutate(),disabled:!a||n.isPending,"data-testid":"button-pointer",children:n.isPending?e.jsx(b,{className:"animate-spin"}):a?"Check-in":`${r?.hoursRemaining||0}h`}),!a&&r?.hoursRemaining?e.jsxs("p",{className:"next-claim",children:["Next check-in in ",r.hoursRemaining,"h"]}):null,e.jsxs("section",{className:"instructions","aria-label":"Check-in instructions",children:[e.jsx("h2",{children:"How does check-in work?"}),e.jsxs("p",{className:"instruction",children:[e.jsx("b",{children:"1."}),e.jsx("span",{children:"Check in once a day to receive your reward."})]}),e.jsxs("p",{className:"instruction",children:[e.jsx("b",{children:"2."}),e.jsx("span",{children:"The reward is automatically added to your balance after validation."})]}),e.jsxs("p",{className:"instruction",children:[e.jsx("b",{children:"3."}),e.jsx("span",{children:"Return every day to keep accumulating bonuses."})]})]})]})]})}export{T as default};
