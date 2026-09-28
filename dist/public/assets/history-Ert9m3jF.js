import{a as M,G as B,b as H,r as k,j as e,e as _,L as R}from"./index-COBfaX67.js";import{u as f}from"./useQuery-Br_x6Z9G.js";import{g as K}from"./countries-GUsSmGBG.js";import{C as V}from"./chevron-left-CikuQCR-.js";import{C as b}from"./chevron-right-CCWfa9sQ.js";import{R as O}from"./refresh-cw-CEF0d2oI.js";const j="/assets/nodata-da225bbb_(1)_1783249133513-DaJAjPYJ.png",A="#ff7a14",D="#16a34a",Q=(s,i,c)=>{const r=new Date(c),a=String(r.getFullYear()).slice(2),d=String(r.getMonth()+1).padStart(2,"0"),l=String(r.getDate()).padStart(2,"0"),p=String(r.getHours()).padStart(2,"0"),m=String(r.getMinutes()).padStart(2,"0"),x=String(i).padStart(4,"0");return`sdk${a}${d}${l}${p}${m}${s}${x}`},C=s=>{const i=s.sendavapayReference||s.omnipayReference||s.omnipayId||s.soleaspayReference||s.soleaspayOrderId;return i?i.startsWith("sdk")?i:`sdk${i}`:Q("D",s.id,s.createdAt)},Y=s=>s.length<=6?s:`${s.slice(0,2)}****${s.slice(-4)}`,v=s=>{const i=new Date(s),c=String(i.getDate()).padStart(2,"0"),r=String(i.getMonth()+1).padStart(2,"0"),a=i.getFullYear(),d=String(i.getHours()).padStart(2,"0"),l=String(i.getMinutes()).padStart(2,"0"),p=String(i.getSeconds()).padStart(2,"0");return`${c}/${r}/${a} ${d}:${l}:${p}`},L=s=>{switch(s){case"completed":case"approved":return{label:"Réussi",color:D};case"rejected":return{label:"Paiement échoué",color:"#b42318"};case"processing":return{label:"En traitement",color:"#d97706"};default:return{label:"En attente...",color:"#d97706"}}},G=s=>{switch(s.type){case"bonus":return s.description==="Bonus quotidien"?"Bonus quotidien":s.description;case"signup_bonus":return"Bonus d'inscription";case"task_reward":return"Récompense";case"commission":return"Commission";case"deposit":return"Dépôt";default:return s.description}},h=({label:s,value:i})=>e.jsxs("div",{className:"history-row",children:[e.jsx("span",{children:s}),e.jsx("span",{children:i})]}),w=({label:s,color:i})=>e.jsx("span",{className:"history-status",style:{backgroundColor:i},children:s});function te(){const{user:s,refreshUser:i}=M(),c=B(),{toast:r}=H(),[a,d]=k.useState("withdrawals"),[l,p]=k.useState(null),m=!!s?.isAdmin,x=s?K(s.country):null,u=x?.currency==="XOF"||x?.currency==="XAF"?"FCFA":x?.currency||"FCFA",{data:N=[],isLoading:F}=f({queryKey:["/api/deposits/history"]}),{data:S=[],isLoading:z}=f({queryKey:["/api/withdrawals/history"]}),{data:I=[],isLoading:q}=f({queryKey:["/api/transactions"]}),E=t=>(t.status==="pending"||t.status==="processing")&&!!(t.soleaspayReference||t.soleaspayOrderId||t.omnipayId||t.omnipayReference||t.sendavapayReference),P=async t=>{p(t);try{const n=await(await fetch(`/api/deposits/${t}/verify`,{credentials:"include"})).json();n.status==="approved"?(r({title:"Paiement confirmé",description:"Votre compte a été crédité"}),i(),c.invalidateQueries({queryKey:["/api/deposits/history"]})):n.status==="rejected"?(r({title:"Paiement échoué",description:"Le paiement a été refusé",variant:"destructive"}),c.invalidateQueries({queryKey:["/api/deposits/history"]})):r({title:"En cours",description:"Le paiement est toujours en attente"})}catch{r({title:"Vérification du paiement impossible",description:"Impossible de vérifier le paiement",variant:"destructive"})}finally{p(null)}};if(!s)return null;const $=[...I,{id:-1,userId:s.id,type:"registration",amount:"0",description:"Inscription",createdAt:s.createdAt}].sort((t,o)=>new Date(o.createdAt).getTime()-new Date(t.createdAt).getTime()),T=a==="balance"?q:a==="deposits"?F:z;return e.jsxs("main",{className:"history-page",children:[e.jsx("style",{children:`
        .history-page {
          width: 100%;
          min-height: 100dvh;
          overflow-x: hidden;
          background: #fff;
          color: #111827;
          font-family: Arial, sans-serif;
        }
        .history-page *,
        .history-page *::before,
        .history-page *::after {
          box-sizing: border-box;
        }
        .history-screen {
          width: 100%;
          max-width: 512px;
          min-height: 100dvh;
          margin: 0 auto;
          background: #fff;
        }
        .history-header {
          position: relative;
          display: flex;
          min-height: 78px;
          align-items: center;
          padding: 17px 16px;
          border-bottom: 2px solid #111827;
        }
        .history-back {
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border: 2px solid #111827;
          border-radius: 11px;
          padding: 0;
          background: #fff;
          box-shadow: 0 3px 0 #111827;
          color: #111827;
          cursor: pointer;
        }
        .history-back svg {
          width: 22px;
          height: 22px;
          stroke-width: 2.5;
        }
        .history-title {
          position: absolute;
          right: 70px;
          left: 70px;
          margin: 0;
          color: #111827;
          font-size: 20px;
          font-weight: 800;
          line-height: 1.2;
          text-align: center;
        }
        .history-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr 1.12fr;
          gap: 8px;
          align-items: center;
          min-height: 78px;
          padding: 12px 16px 16px;
          border-bottom: 2px solid #111827;
        }
        .history-tab {
          display: flex;
          min-width: 0;
          height: 46px;
          align-items: center;
          justify-content: center;
          gap: 5px;
          border: 2px solid #111827;
          border-radius: 11px;
          padding: 0 8px;
          background: #ffffff;
          box-shadow: 0 3px 0 #111827;
          color: #111827;
          font-size: 14px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
          cursor: pointer;
        }
        .history-tab.active {
          background: #ff7a14;
          color: #111827;
          font-weight: 700;
        }
        .history-tab-arrow {
          width: 17px;
          height: 17px;
          color: #111827;
          stroke-width: 2.8;
        }
        .history-tab-arrow.left {
          transform: rotate(180deg);
        }
        .history-content {
          min-height: calc(100dvh - 156px);
          padding: 18px 16px 40px;
          background: #fff8f2;
        }
        .history-list {
          display: grid;
          gap: 16px;
        }
        .history-card {
          position: relative;
          width: 100%;
          min-height: 154px;
          overflow: hidden;
          border: 2px solid #111827;
          border-radius: 12px;
          padding: 0 16px 16px;
          background: #ffffff;
          box-shadow: 0 4px 0 #111827, 0 8px 16px rgba(17, 24, 39, .12);
        }
        .history-card-top {
          display: flex;
          min-height: 76px;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin: 0 -16px;
          padding: 14px 16px 13px;
          border-bottom: 2px solid #111827;
          background: ${A};
        }
        .history-amount {
          margin: 0;
          color: #111827;
          font-size: 19px;
          font-weight: 800;
          line-height: 1.15;
        }
        .history-card-label {
          margin: 6px 0 0;
          color: #111827;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.15;
        }
        .history-status {
          display: inline-flex;
          min-height: 34px;
          align-items: center;
          flex: 0 0 auto;
          border: 2px solid #111827;
          border-radius: 11px;
          padding: 0 11px;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
        }
        .history-divider {
          height: 0;
          margin: 14px 0 9px;
          border-top: 2px dashed #9ca3af;
        }
        .history-row {
          display: flex;
          min-height: 21px;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #111827;
          font-size: 14px;
          line-height: 1.2;
        }
        .history-row > span:first-child {
          color: #4b5563;
          font-weight: 700;
        }
        .history-row > span:last-child {
          text-align: right;
          white-space: nowrap;
        }
        .history-empty {
          display: flex;
          min-height: 320px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border: 2px solid #111827;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 4px 0 #111827;
          color: #4b5563;
          font-size: 14px;
        }
        .history-empty img {
          width: 112px;
          height: 112px;
          object-fit: contain;
        }
        .history-verify {
          width: 100%;
          margin-top: 10px;
          min-height: 44px;
          border: 2px solid #111827;
          border-radius: 11px;
          padding: 9px 12px;
          background: ${A};
          box-shadow: 0 3px 0 #111827;
          color: #111827;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }
        .history-verify:disabled { cursor: wait; opacity: .7; }
        @media (max-width: 370px) {
          .history-header { height: 62px; padding-top: 6px; }
          .history-title { font-size: 19px; }
          .history-tabs { min-height: 58px; padding-bottom: 11px; }
          .history-tab { font-size: 14px; }
          .history-content { min-height: calc(100dvh - 120px); padding-right: 16px; padding-left: 16px; }
          .history-card { padding-right: 18px; padding-left: 18px; }
          .history-card-label { font-size: 15px; }
          .history-status { font-size: 12px; padding-right: 8px; padding-left: 8px; }
          .history-row { font-size: 13px; }
        }
      `}),e.jsxs("div",{className:"history-screen",children:[e.jsxs("header",{className:"history-header",children:[e.jsx(_,{href:"/account",children:e.jsx("button",{className:"history-back","data-testid":"button-back","aria-label":"Retour",children:e.jsx(V,{"aria-hidden":"true"})})}),e.jsx("h1",{className:"history-title",children:"Enregistrements de fonds"})]}),e.jsxs("nav",{className:"history-tabs","aria-label":"Type d'enregistrement",children:[e.jsxs("button",{className:`history-tab ${a==="balance"?"active":""}`,onClick:()=>d("balance"),"data-testid":"tab-balance",children:[e.jsx("span",{children:"Solde"}),e.jsx(b,{className:`history-tab-arrow ${a==="balance"?"right":"left"}`,"aria-hidden":"true"})]}),e.jsxs("button",{className:`history-tab ${a==="deposits"?"active":""}`,onClick:()=>d("deposits"),"data-testid":"tab-deposits",children:[e.jsx("span",{children:"Dépôt"}),e.jsx(b,{className:`history-tab-arrow ${a==="deposits"?"right":"left"}`,"aria-hidden":"true"})]}),e.jsxs("button",{className:`history-tab ${a==="withdrawals"?"active":""}`,onClick:()=>d("withdrawals"),"data-testid":"tab-withdrawals",children:[e.jsx("span",{children:"Retrait"}),e.jsx(b,{className:"history-tab-arrow right","aria-hidden":"true"})]})]}),e.jsx("section",{className:"history-content","aria-live":"polite",children:T?e.jsx("div",{className:"history-empty",children:e.jsx(R,{className:"animate-spin"})}):a==="balance"?$.length>0?e.jsx("div",{className:"history-list",children:$.map(t=>{const o=Number.parseFloat(t.amount||"0"),n=t.type==="registration";return e.jsxs("article",{className:"history-card","data-testid":`balance-item-${t.id}`,children:[e.jsxs("div",{className:"history-card-top",children:[e.jsxs("div",{children:[e.jsx("p",{className:"history-amount",children:n?"—":`+${o.toLocaleString("fr-FR")} ${u}`}),e.jsx("p",{className:"history-card-label",children:t.type==="deposit"?"Dépôt":t.description})]}),e.jsx(w,{label:"Réussi",color:D})]}),e.jsx("div",{className:"history-divider"}),e.jsx(h,{label:"Type :",value:n?"Inscription":G(t)}),e.jsx(h,{label:"Heure :",value:v(t.createdAt)})]},`${t.type}-${t.id}`)})}):e.jsxs("div",{className:"history-empty",children:[e.jsx("img",{src:j,alt:"Aucune donnée"}),e.jsx("span",{children:"Plus de données"})]}):a==="deposits"?N.length>0?e.jsx("div",{className:"history-list",children:N.map(t=>{const{label:o,color:n}=L(t.status),g=Number.parseFloat(t.amount),y=m?C(t):Y(C(t));return e.jsxs("article",{className:"history-card","data-testid":`deposit-item-${t.id}`,children:[e.jsxs("div",{className:"history-card-top",children:[e.jsxs("div",{children:[e.jsxs("p",{className:"history-amount",children:[u," ",g.toLocaleString("fr-FR")]}),e.jsx("p",{className:"history-card-label",children:"Montant du dépôt"})]}),e.jsx(w,{label:o,color:n})]}),e.jsx("div",{className:"history-divider"}),e.jsx(h,{label:"Numéro :",value:y}),e.jsx(h,{label:"Heure du dépôt :",value:v(t.createdAt)}),E(t)&&!t.sendavapayReference?e.jsxs("button",{className:"history-verify",onClick:()=>P(t.id),disabled:l===t.id,"data-testid":`button-verify-${t.id}`,children:[l===t.id?e.jsx(R,{className:"inline animate-spin"}):e.jsx(O,{className:"mr-1 inline h-3 w-3"}),"Vérifier la transaction"]}):null]},t.id)})}):e.jsxs("div",{className:"history-empty",children:[e.jsx("img",{src:j,alt:"Aucune donnée"}),e.jsx("span",{children:"Plus de données"})]}):S.length>0?e.jsx("div",{className:"history-list",children:S.map(t=>{const{label:o,color:n}=L(t.status),g=Number.parseFloat(t.amount),y=Number.parseFloat(t.netAmount||t.amount);return e.jsxs("article",{className:"history-card","data-testid":`withdrawal-item-${t.id}`,children:[e.jsxs("div",{className:"history-card-top",children:[e.jsxs("div",{children:[e.jsxs("p",{className:"history-amount",children:[u," ",g.toLocaleString("fr-FR")]}),e.jsx("p",{className:"history-card-label",children:"Montant du retrait"})]}),e.jsx(w,{label:o,color:n})]}),e.jsx("div",{className:"history-divider"}),e.jsx(h,{label:"Montant reçu :",value:`${u} ${y.toLocaleString("fr-FR")}`}),e.jsx(h,{label:"Heure du retrait :",value:v(t.createdAt)})]},t.id)})}):e.jsxs("div",{className:"history-empty",children:[e.jsx("img",{src:j,alt:"Aucune donnée"}),e.jsx("span",{children:"Plus de données"})]})})]})]})}export{te as default};
