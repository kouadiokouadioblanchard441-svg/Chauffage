import{a as K,b as U,G as D,r as c,u as O,j as e,L as g,e as z,f as S}from"./index-D3uxyV0v.js";import{u as p}from"./useQuery-CatvLEel.js";import{u as Q}from"./useMutation-8Izf2toX.js";import{g as B}from"./countries-CPwcGz_v.js";import{c as C}from"./chargepoint_1790147948102-DERXNZnU.js";import{c as _}from"./auth-chargepoint-combined-0mIqx7uW.js";import{C as G}from"./chevron-right-To_ZcsCy.js";const J="/assets/t%C3%A9l%C3%A9chargement_(80)_1787363581764-DIwCG-l1.png";function ie(){const{user:h,refreshUser:q}=K(),{toast:r}=U(),y=D(),[a,v]=c.useState(""),[o,j]=c.useState(null),[N,k]=c.useState(!1),[,w]=O();h&&B(h.country);const s="PHP",{data:l}=p({queryKey:["/api/settings/withdrawal"],staleTime:0,refetchOnMount:!0}),d=l?.minWithdrawal??800,u=l?.withdrawalFees??16,f=l?.withdrawalStartHour??9,x=l?.withdrawalEndHour??17,m=l?.withdrawalPrepaymentEnabled??!1,A=a?Math.floor(Number(a)*(1-u/100)):0,P=new Date().getHours(),I=P>=f&&P<x,{data:i=[],isLoading:E}=p({queryKey:["/api/wallets"],refetchOnWindowFocus:!0}),{data:H=[]}=p({queryKey:["/api/user/products"]}),{data:L}=p({queryKey:["/api/withdrawals/available"],enabled:!!h,staleTime:0,refetchOnMount:!0}),F=H.some(t=>t.status==="active");c.useEffect(()=>{const t=localStorage.getItem("selectedWalletId");if(t&&i.length>0){const n=i.find(Y=>Y.id===parseInt(t));n&&j(n),localStorage.removeItem("selectedWalletId")}},[i]),c.useEffect(()=>{if(!o&&i.length>0){const t=i.find(n=>n.isDefault);t&&j(t)}},[i,o]);const b=Q({mutationFn:async t=>(await S("POST","/api/withdrawals",t)).json(),onSuccess:()=>{r({title:"Request sent",description:"Your withdrawal request has been sent."}),q(),y.invalidateQueries({queryKey:["/api/withdrawals"]}),y.invalidateQueries({queryKey:["/api/withdrawals/available"]}),v("")},onError:t=>{if(t.data?.code==="WITHDRAWAL_PREPAYMENT_REQUIRED"&&t.data.paymentUrl){w(t.data.paymentUrl);return}r({title:"Unable to withdraw",description:t.message,variant:"destructive"})}}),W=m&&a?Math.max(1,Math.round(Number(a)*25/100)):0,M=async()=>{if(m){if(!a||Number(a)<d){r({title:"Invalid amount",description:`The minimum amount is ${d} ${s}`,variant:"destructive"});return}k(!0);try{const n=await(await S("POST","/api/withdrawal-fee/prepare",{amount:Number(a)})).json();w(n.paymentUrl)}catch(t){r({title:"Payment unavailable",description:t.message,variant:"destructive"})}finally{k(!1)}}},T=()=>{if(!I){r({title:"Withdrawal unavailable",description:`Withdrawal hours: ${f}:00 to ${x}:00.`,variant:"destructive"});return}if(!F){r({title:"Product required",description:"You must have an active product to withdraw.",variant:"destructive"});return}if(!a||a<d){r({title:"Invalid amount",description:`The minimum amount is ${d} ${s}`,variant:"destructive"});return}if(!o){r({title:"Account required",description:"Please select a payment account.",variant:"destructive"});return}b.mutate({amount:Number(a),walletId:o.id})};if(E)return e.jsx("div",{className:"min-h-screen bg-white flex items-center justify-center",children:e.jsx(g,{className:"w-8 h-8 animate-spin text-[#FF7A14]"})});if(!h)return null;const $=parseFloat(L?.availableBalance||"0"),R=i.length>0;return e.jsxs("main",{className:"withdraw-reference min-h-screen bg-[#f7f4f2]",children:[e.jsx("style",{children:`
        .withdraw-reference {
          min-height: 100dvh;
          background: #fff8f2;
          color: #111827;
          font-family: Inter, Arial, sans-serif;
        }
        .withdraw-reference .withdraw-screen {
          width: 100%;
          max-width: 512px;
          min-height: 100dvh;
          margin: 0 auto;
          overflow: hidden;
          background: #fff8f2;
        }
        .withdraw-reference .withdraw-hero {
          position: relative;
          box-sizing: border-box;
          min-height: 406px;
          padding: 0 16px 20px;
          background: #fff8f2;
          border-bottom: 2px solid #111827;
        }
        .withdraw-reference .history-button,
        .withdraw-reference .withdraw-back {
          position: absolute;
          z-index: 3;
          top: 16px;
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border: 2px solid #111827;
          border-radius: 11px;
          padding: 0;
          background: #fff;
          box-shadow: 0 3px 0 #111827;
        }
        .withdraw-reference .history-button {
          right: 16px;
        }
        .withdraw-reference .withdraw-back {
          left: 16px;
        }
        .withdraw-reference .history-button:active,
        .withdraw-reference .withdraw-back:active {
          transform: translateY(2px);
          box-shadow: 0 1px 0 #111827;
        }
        .withdraw-reference .history-icon {
          position: relative;
          width: 22px;
          height: 25px;
          border: 2px solid #111827;
          border-radius: 4px;
          background: transparent;
        }
        .withdraw-reference .history-icon::before {
          position: absolute;
          top: 5px;
          left: 4px;
          width: 11px;
          height: 2px;
          content: "";
          background: #ff7a14;
          box-shadow: 0 6px 0 #ff7a14;
        }
        .withdraw-reference .history-icon::after {
          position: absolute;
          right: -7px;
          bottom: -6px;
          width: 10px;
          height: 10px;
          border: 2px solid #111827;
          border-radius: 50%;
          content: "";
          background: #fff;
        }
        .withdraw-reference .withdraw-back::before {
          width: 13px;
          height: 13px;
          border-bottom: 3px solid #111827;
          border-left: 3px solid #111827;
          content: "";
          transform: rotate(45deg) translate(2px, -2px);
        }
        .withdraw-reference .hero-art {
          position: relative;
          width: 100%;
          height: 176px;
          overflow: hidden;
          margin-top: 76px;
          border: 2px solid #111827;
          border-radius: 13px;
          background: #fff;
          background-image: url("${_}");
          background-position: center;
          background-size: cover;
          box-shadow: 0 4px 0 #111827;
        }
        .withdraw-reference .hero-pattern,
        .withdraw-reference .receipt-icon {
          display: none;
        }
        .withdraw-reference .withdraw-title {
          position: absolute;
          z-index: 2;
          top: 21px;
          right: 70px;
          left: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          margin: 0;
          color: #111827;
          font-size: 20px;
          font-weight: 800;
          line-height: 1.2;
          text-align: center;
        }
        .withdraw-reference .withdraw-title-logo {
          width: 38px;
          height: 38px;
          border: 2px solid #111827;
          border-radius: 50%;
          object-fit: cover;
        }
        .withdraw-reference .balance-card {
          position: relative;
          height: 116px;
          overflow: hidden;
          margin-top: 16px;
          border: 2px solid #111827;
          border-radius: 13px;
          background: #ff7a14;
          box-shadow: 0 4px 0 #111827;
        }
        .withdraw-reference .balance-label {
          margin: 20px 0 0 17px;
          color: #111827;
          font-size: 15px;
          font-weight: 800;
          line-height: 1;
        }
        .withdraw-reference .balance-value {
          margin: 16px 0 0 17px;
          color: #111827;
          font-size: 32px;
          font-weight: 800;
          line-height: .9;
        }
        .withdraw-reference .balance-value span {
          margin-left: 5px;
          font-size: 20px;
        }
        .withdraw-reference .wallet-mark {
          position: absolute;
          top: 15px;
          right: 16px;
          display: grid;
          width: 84px;
          height: 84px;
          place-items: center;
          border: 2px solid #111827;
          border-radius: 50%;
          background: #fff;
        }
        .withdraw-reference .wallet-mark img {
          width: 62px;
          height: 62px;
          object-fit: cover;
        }
        .withdraw-reference .amount-panel {
          box-sizing: border-box;
          min-height: 154px;
          padding: 12px 16px 18px;
          background: #fff;
          border-bottom: 2px solid #111827;
        }
        .withdraw-reference .amount-label {
          margin: 0 0 9px;
          color: #111827;
          font-size: 16px;
          font-weight: 800;
        }
        .withdraw-reference .amount-field {
          display: flex;
          height: 54px;
          align-items: center;
          overflow: hidden;
          border: 2px solid #111827;
          border-radius: 12px;
          background: #fff;
        }
        .withdraw-reference .amount-field input {
          width: 100%;
          min-width: 0;
          height: 100%;
          padding: 0 16px;
          border: 0;
          outline: 0;
          background: transparent;
          color: #111827;
          font-size: 19px;
        }
        .withdraw-reference .amount-field input::placeholder { color: #6b7280; opacity: 1; }
        .withdraw-reference .amount-currency {
          padding-right: 16px;
          color: #111827;
          font-size: 18px;
          font-weight: 800;
        }
        .withdraw-reference .amount-details {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 12px;
          color: #4b5563;
          font-size: 13px;
          font-weight: 700;
        }
        .withdraw-reference .prepayment-notice {
          display: grid;
          gap: 7px;
          margin-top: 16px;
          padding: 14px;
          border: 2px solid #111827;
          border-radius: 12px;
          background: #fff1e6;
          color: #4b5563;
          font-size: 13px;
          line-height: 1.45;
        }
        .withdraw-reference .prepayment-notice strong {
          color: #111827;
          font-size: 14px;
        }
        .withdraw-reference .pay-prepayment {
          display: inline-flex;
          min-height: 38px;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 2px solid #111827;
          border-radius: 10px;
          background: #ff7a14;
          color: #111827;
          font-weight: 800;
          box-shadow: 0 2px 0 #111827;
        }
        .withdraw-reference .pay-prepayment:active:not(:disabled) {
          transform: translateY(2px);
          box-shadow: none;
        }
        .withdraw-reference .pay-prepayment:disabled { opacity: .55; }
        .withdraw-reference .wallet-choice {
          display: flex;
          width: calc(100% - 32px);
          min-height: 62px;
          align-items: center;
          margin: 16px 16px 0;
          padding: 0 14px;
          border: 2px solid #111827;
          border-radius: 12px;
          background: #fff;
          color: #111827;
          text-align: left;
          box-shadow: 0 3px 0 #111827;
        }
        .withdraw-reference .wallet-choice:active {
          transform: translateY(2px);
          box-shadow: 0 1px 0 #111827;
        }
        .withdraw-reference .wallet-choice img {
          width: 34px;
          height: 34px;
          margin-right: 10px;
          object-fit: contain;
        }
        .withdraw-reference .wallet-choice svg:last-child {
          width: 22px;
          height: 22px;
          margin-left: auto;
          color: #ff7a14;
        }
        .withdraw-reference .wallet-copy {
          overflow: hidden;
          font-size: 15px;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .withdraw-reference .instructions {
          margin: 18px 16px 24px;
          padding: 22px 16px 10px;
          border: 2px solid #111827;
          border-top: 5px solid #ff7a14;
          border-radius: 14px;
          background: #fff;
        }
        .withdraw-reference .instructions-title {
          margin: 0 0 20px;
          color: #111827;
          font-size: 19px;
          font-weight: 800;
        }
        .withdraw-reference .instructions-title::before {
          content: "•";
          margin-right: 8px;
          color: #ff7a14;
          font-size: 24px;
          line-height: 0;
        }
        .withdraw-reference .instruction {
          position: relative;
          margin: 0 0 16px 20px;
          color: #4b5563;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.65;
        }
        .withdraw-reference .instruction::before {
          position: absolute;
          top: 7px;
          left: -15px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          content: "";
          background: #ff7a14;
        }
        .withdraw-reference .instruction strong { color: #111827; font-weight: 800; }
        .withdraw-reference .submit {
          display: flex;
          width: calc(100% - 32px);
          min-height: 57px;
          align-items: center;
          justify-content: center;
          margin: 18px 16px 0;
          border: 2px solid #111827;
          border-radius: 12px;
          background: #ff7a14;
          color: #111827;
          font-size: 16px;
          font-weight: 800;
          box-shadow: 0 4px 0 #111827;
        }
        .withdraw-reference .submit:active:not(:disabled) {
          transform: translateY(3px);
          box-shadow: 0 1px 0 #111827;
        }
        .withdraw-reference .submit:disabled { opacity: .6; }
        @media (max-width: 360px) {
          .withdraw-reference .withdraw-hero { min-height: 384px; padding-right: 12px; padding-left: 12px; }
          .withdraw-reference .history-button { right: 12px; }
          .withdraw-reference .withdraw-back { left: 12px; }
          .withdraw-reference .hero-art { height: 154px; }
          .withdraw-reference .balance-card { margin-top: 14px; }
          .withdraw-reference .wallet-mark { transform: scale(.86); transform-origin: top right; }
          .withdraw-reference .balance-value { font-size: 28px; }
          .withdraw-reference .amount-details { font-size: 12px; }
          .withdraw-reference .instruction { font-size: 14px; }
        }
      `}),e.jsxs("div",{className:"withdraw-screen",children:[e.jsxs("section",{className:"withdraw-hero","aria-label":"Withdrawal",children:[e.jsxs("div",{className:"hero-art","aria-hidden":"true",children:[e.jsx("div",{className:"hero-pattern"}),e.jsx("span",{className:"receipt-icon"})]}),e.jsxs("h1",{className:"withdraw-title",children:[e.jsx("img",{className:"withdraw-title-logo",src:C,alt:""}),e.jsx("span",{children:"Withdrawal"})]}),e.jsx(z,{href:"/history",children:e.jsx("button",{className:"history-button","aria-label":"Transaction history",children:e.jsx("span",{className:"history-icon","aria-hidden":"true"})})}),e.jsx(z,{href:"/account",children:e.jsx("button",{className:"withdraw-back","data-testid":"button-back","aria-label":"Back"})}),e.jsxs("div",{className:"balance-card",children:[e.jsx("p",{className:"balance-label",children:"Account balance"}),e.jsxs("p",{className:"balance-value","data-testid":"text-balance",children:[Math.round($).toLocaleString("en-PH"),e.jsx("span",{children:s})]}),e.jsx("div",{className:"wallet-mark","aria-hidden":"true",children:e.jsx("img",{src:C,alt:""})})]})]}),e.jsxs("section",{className:"amount-panel","aria-label":"Withdrawal amount",children:[e.jsx("p",{className:"amount-label",children:"Enter withdrawal amount"}),e.jsxs("label",{className:"amount-field",children:[e.jsx("input",{type:"number",value:a,onChange:t=>v(t.target.value?Number(t.target.value):""),placeholder:"Amount","data-testid":"input-withdrawal-amount","aria-label":"Withdrawal amount"}),e.jsx("span",{className:"amount-currency",children:s})]}),e.jsxs("div",{className:"amount-details",children:[e.jsxs("span",{children:["Amount received: ",A.toLocaleString("en-PH")]}),e.jsxs("span",{children:["Fee: ",u.toFixed(2),"%"]})]}),m&&e.jsxs("div",{className:"prepayment-notice",children:[e.jsx("strong",{children:"Payment required before withdrawal"}),e.jsxs("span",{children:["You must pay 25% of the withdrawal amount",W>0?`, or ${W.toLocaleString("en-PH")} ${s}`:""," ","before your request can be submitted."]}),e.jsx("button",{type:"button",onClick:M,disabled:N||!a||Number(a)<d,className:"pay-prepayment","data-testid":"button-pay-withdrawal-prepayment",children:N?e.jsx(g,{className:"h-4 w-4 animate-spin"}):"Pay"})]})]}),e.jsxs("button",{onClick:()=>w(R?"/wallet?from=withdrawal":"/wallet"),className:"wallet-choice","data-testid":"button-select-wallet",children:[e.jsx("img",{src:J,alt:""}),e.jsx("span",{className:"wallet-copy",children:o?o.accountNumber:"Choose your wallet"}),e.jsx(G,{"aria-hidden":"true"})]}),e.jsx("button",{onClick:T,disabled:b.isPending,className:"submit","data-testid":"button-submit-withdrawal",children:b.isPending?e.jsx(g,{className:"h-5 w-5 animate-spin"}):"Withdraw your money now"}),e.jsxs("section",{className:"instructions","aria-label":"Withdrawal instructions",children:[e.jsx("h2",{className:"instructions-title",children:"Withdrawal instructions:"}),e.jsxs("p",{className:"instruction",children:[e.jsx("strong",{children:"Minimum withdrawal:"})," ",d.toLocaleString("en-PH")," ",s]}),e.jsxs("p",{className:"instruction",children:[e.jsx("strong",{children:"Withdrawal hours:"})," ",f,":00 to ",x,":00"]}),e.jsxs("p",{className:"instruction",children:[e.jsx("strong",{children:"Withdrawal fee:"})," ",u,"% per transaction"]}),e.jsxs("p",{className:"instruction",children:[e.jsx("strong",{children:"Processing time:"})," usually within 2 hours, and exceptionally within 24 hours."]}),e.jsx("p",{className:"instruction",children:"Check your wallet details before submitting your request."})]})]})]})}export{ie as default};
