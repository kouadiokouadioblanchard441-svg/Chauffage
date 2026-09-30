import{c as Be,a as Tt,b as Ot,G as Ut,r as a,j as e,e as C,L as j,f as v}from"./index-BnTE3emq.js";import{u as M}from"./useQuery-DUhcEJhG.js";import{u as P}from"./useMutation-BY7Xl_dW.js";import{b as Lt}from"./countries-CPwcGz_v.js";import{P as se,E as A,s as x}from"./deposit-display-2B5kIu1r.js";import{c as $t}from"./chargepoint_1790147948102-DERXNZnU.js";import{c as Rt}from"./auth-chargepoint-combined-0mIqx7uW.js";import{C as w}from"./chevron-left-BaE0b6iV.js";import{I as qt,Z as zt}from"./zap-DbftBx1O.js";import{R as Y}from"./refresh-cw-BSwR-7-n.js";const _=Be("CircleCheckBig",[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]]);const Yt=Be("Upload",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"17 8 12 3 7 8",key:"t8dd8p"}],["line",{x1:"12",x2:"12",y1:"3",y2:"15",key:"widbto"}]]),K="#FF7A14",Je="#E85D00",m=`linear-gradient(112deg, ${K} 0%, ${Je} 100%)`,Qe="soleaspay-pending-deposit",_t=`
  .deposit-step-shell {
    min-height: 100dvh;
    max-width: 512px;
    margin: 0 auto;
    overflow: hidden;
    background: #fff8f2;
    color: #111827;
    font-family: Inter, Arial, sans-serif;
  }
  .deposit-step-shell .deposit-step-header {
    min-height: 72px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 2px solid #111827;
    background: #fff8f2;
  }
  .deposit-step-shell .deposit-step-back {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 42px;
    padding: 8px 12px 8px 8px;
    border: 2px solid #111827;
    border-radius: 11px;
    background: #fff;
    color: #111827;
    font-size: 15px;
    font-weight: 800;
    box-shadow: 0 3px 0 #111827;
  }
  .deposit-step-shell .deposit-step-back:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 #111827;
  }
  .deposit-step-shell .deposit-step-history {
    min-height: 40px;
    padding: 8px 12px;
    border: 2px solid #111827;
    border-radius: 11px;
    background: #fff;
    color: ${Je};
    font-size: 12px;
    font-weight: 800;
  }
  .deposit-step-shell .deposit-step-content {
    padding: 16px;
  }
  .deposit-step-shell .deposit-step-summary {
    border: 2px solid #111827;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 4px 0 #111827;
  }
  .deposit-step-shell .deposit-step-card {
    border: 2px solid #111827;
    border-radius: 14px;
    background: #fff;
  }
  .deposit-step-shell .deposit-step-card-orange {
    border-color: ${K};
    background: #fff3e8;
  }
  .deposit-step-shell .deposit-step-field {
    border: 2px solid #111827 !important;
    border-radius: 12px !important;
    background: #fff !important;
  }
  .deposit-step-shell .deposit-step-primary {
    min-height: 54px;
    border: 2px solid #111827 !important;
    border-radius: 12px !important;
    background: ${K} !important;
    color: #111827 !important;
    font-weight: 800 !important;
    box-shadow: 0 4px 0 #111827;
  }
  .deposit-step-shell .deposit-step-primary:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0 1px 0 #111827;
  }
  .deposit-step-shell .deposit-step-secondary {
    border: 2px solid #111827 !important;
    border-radius: 12px !important;
    background: #fff !important;
    color: #111827 !important;
    font-weight: 800 !important;
  }
  .deposit-step-shell .deposit-step-icon {
    display: grid;
    width: 76px;
    height: 76px;
    place-items: center;
    border: 2px solid #111827;
    border-radius: 50%;
    background: #fff3e8;
  }
  .deposit-step-shell .deposit-step-icon svg {
    color: ${K};
  }
  .deposit-step-shell .deposit-step-operator {
    border: 2px solid #d1d5db !important;
    border-radius: 12px !important;
    background: #fff !important;
  }
  .deposit-step-shell .deposit-step-operator-selected {
    border-color: ${K} !important;
    background: #fff3e8 !important;
  }
  .deposit-step-shell .deposit-step-otp {
    border: 2px solid #111827 !important;
    border-radius: 12px !important;
    background: #fff !important;
  }
  @media (max-width: 360px) {
    .deposit-step-shell .deposit-step-header { padding-right: 12px; padding-left: 12px; }
    .deposit-step-shell .deposit-step-content { padding: 12px; }
    .deposit-step-shell .deposit-step-back { font-size: 14px; }
  }
`;function u(){return e.jsx("style",{children:_t})}function ds(){const{user:f,refreshUser:W}=Tt(),{toast:i}=Ot(),T=Ut(),Ne=a.useRef(null),[c,n]=a.useState("amount"),[l,Ze]=a.useState(null),[d,ve]=a.useState(""),[Kt,Wt]=a.useState(null),[o,g]=a.useState(""),[E,Xe]=a.useState(""),[ae,we]=a.useState(f?.phone||""),[I,ke]=a.useState(""),[et,Se]=a.useState(""),[Ce,Pe]=a.useState(""),[Ee,Ie]=a.useState(""),[F,tt]=a.useState(f?.country||""),[re,st]=a.useState(""),[y,O]=a.useState(null),[V,H]=a.useState(null),[ne,G]=a.useState(""),[at,ie]=a.useState(""),[oe,ce]=a.useState(""),[Fe,rt]=a.useState(""),[Vt,nt]=a.useState(""),[it,ot]=a.useState(""),[De,U]=a.useState(""),[Me,b]=a.useState(!1),[L,le]=a.useState(null),[k,Q]=a.useState(""),[ct,lt]=a.useState(""),[Ae,B]=a.useState(!1),[de,dt]=a.useState(f?.country||""),[J,pt]=a.useState(""),[$,Te]=a.useState(""),[R,Z]=a.useState(null),[pe,Oe]=a.useState(""),[he,Ue]=a.useState(""),[Ht,Le]=a.useState(""),[ht,mt]=a.useState(""),[Gt,X]=a.useState(""),[$e,q]=a.useState(!1),h=E,{data:xt,isError:Re}=M({queryKey:["/api/countries"]}),qe=Lt(xt,Re);qe.find(t=>t.code===h&&t.isActive);const p="PHP",{data:ut}=M({queryKey:["/api/settings"]}),{data:ft,isLoading:me,isError:ze}=M({queryKey:["/api/deposit/methods",h],queryFn:async()=>{const t=await fetch(`/api/deposit/methods/${encodeURIComponent(h)}`,{credentials:"include"}),s=await t.json();if(!t.ok)throw new Error(s.message||"Unable to load deposit methods");return s},enabled:!!h}),S=(ft?.methods||[]).filter(t=>t.provider==="cloudpay"),gt=new Set(S.map(t=>t.provider)),yt=S.map(t=>t.provider).join(",");a.useEffect(()=>{S.length===1?ve(S[0].provider):ve("")},[h,yt]);const Ye=Number.parseInt(ut?.minDeposit||"",10),ee=Number.isSafeInteger(Ye)?Math.max(200,Ye):200,bt=[200,500,1e3,2e3,3500,5e3,1e4,25e3,5e4,1e5,2e5,3e5,4e5,5e5].filter(t=>t>=ee),jt=!1,_e={CI:0,NE:1},xe=qe.filter(t=>t.isActive&&t.code.trim().toUpperCase()==="PH").sort((t,s)=>(_e[t.code.toUpperCase()]??2)-(_e[s.code.toUpperCase()]??2)),Nt=[],{data:Qt=[],isLoading:Bt}=M({queryKey:["/api/payment-numbers",h],queryFn:async()=>{const t=await fetch(`/api/payment-numbers?country=${h}`,{credentials:"include"});if(!t.ok)throw new Error("Unable to load payment numbers");return t.json()},enabled:!!h}),{data:vt,isLoading:wt}=M({queryKey:["/api/sendavapay/operators",F],queryFn:async()=>{const t=await fetch(`/api/sendavapay/operators/${F}`,{credentials:"include"});if(!t.ok)throw new Error("Unable to load SendavaPay operators");return t.json()},enabled:c==="sv-operator"&&!!F}),Ke=(vt?.data||[]).filter(t=>t.status==="online"),{data:kt=[],isLoading:St}=M({queryKey:["/api/ashtechpay/countries"],queryFn:async()=>{const t=await fetch("/api/ashtechpay/countries",{credentials:"include"});if(!t.ok)throw new Error("Unable to load operators");return t.json()},enabled:c==="ashtech-operator"&&jt}),We=kt.filter(t=>xe.some(s=>s.code.toUpperCase()===t.code.toUpperCase())&&Nt.includes(t.code.toUpperCase())),Ve=We.find(t=>t.code===de)?.operators||[];a.useEffect(()=>{if(c!=="sv-waiting"||!V||!Me)return;const t=setInterval(async()=>{try{const r=await(await fetch(`/api/deposits/${V}/sendavapay-status`,{credentials:"include"})).json();U(r.status),r.status==="approved"?(clearInterval(t),b(!1),i({title:"Payment confirmed!",description:"Your balance has been credited."}),W(),T.invalidateQueries({queryKey:["/api/deposits/history"]}),n("amount"),g(""),O(null),H(null),G(""),ie(""),ce(""),U("")):r.status==="rejected"&&(clearInterval(t),b(!1),i({title:"Payment failed",description:"The payment was declined or cancelled.",variant:"destructive"}),n("sv-operator"))}catch{}},5e3);return()=>clearInterval(t)},[c,V,Me]),a.useEffect(()=>{if(c!=="ashtech-waiting"||!R||!$e)return;const t=setInterval(async()=>{try{const r=await(await fetch(`/api/deposits/${R}/ashtechpay-status`,{credentials:"include"})).json();X(r.status),r.status==="approved"?(clearInterval(t),q(!1),i({title:"Payment confirmed!",description:"Your balance has been credited."}),W(),T.invalidateQueries({queryKey:["/api/deposits/history"]}),n("amount"),g(""),Z(null),X("")):r.status==="rejected"&&(clearInterval(t),q(!1),i({title:"Payment failed",description:"The payment was declined or cancelled.",variant:"destructive"}),n("ashtech-operator"))}catch{}},5e3);return()=>clearInterval(t)},[c,R,$e]),a.useEffect(()=>{const t=new URLSearchParams(window.location.search),s=t.get("soleaspayReturn");if(s!=="success"&&s!=="failure")return;const r=t.get("orderId");let N=!1;try{const te=sessionStorage.getItem(Qe),be=te?JSON.parse(te):null,je=Number(be?.depositId),At=typeof be?.orderId=="string"?be.orderId:"";Number.isInteger(je)&&je>0&&(!r||At===r)&&(le(je),Q("pending"),lt(s==="success"?"Payment return received. Verification in progress...":"Payment return received. Checking the final status..."),B(!0),n("soleaspay-waiting"),N=!0)}catch(te){console.warn("[soleaspay] Could not resume pending deposit:",te)}N||i({title:"Payment return received",description:"Check your deposit history to verify the payment status."}),t.delete("soleaspayReturn"),t.delete("orderId");const Ge=t.toString();window.history.replaceState({},"",`${window.location.pathname}${Ge?`?${Ge}`:""}${window.location.hash}`)},[i]),a.useEffect(()=>{if(c!=="soleaspay-waiting"||!L||!Ae)return;const t=setInterval(async()=>{try{const s=await fetch(`/api/deposits/${L}/verify`,{credentials:"include"}),r=await s.json();if(!s.ok)throw new Error(r.message||"Unable to verify SoleaPay payment");if(r.status&&Q(r.status),r.status==="approved"||r.status==="rejected"){clearInterval(t),B(!1);try{sessionStorage.removeItem(Qe)}catch{}r.status==="approved"&&(i({title:"Payment confirmed!",description:"Your balance has been credited."}),W(),T.invalidateQueries({queryKey:["/api/deposits/history"]}))}}catch{}},5e3);return()=>clearInterval(t)},[c,L,Ae]);const Ct=t=>{const s=t.target.files?.[0];if(!s)return;if(s.size>5*1024*1024){i({title:"File too large",description:"Maximum 5 MB",variant:"destructive"});return}Se(s.name);const r=new FileReader;r.onload=N=>ke(N.target?.result),r.readAsDataURL(s)},ue=P({mutationFn:async()=>{if(!l)throw new Error("No number selected");const t=await v("POST","/api/deposits",{amount:Number(o),accountName:f?.fullName||"",accountNumber:ae,paymentMethod:l.operatorName,country:h,paymentNumberId:l.id,channelName:l.paymentLink?`${l.operatorName} - Payment link`:`${l.operatorName} - ${l.phone}`,screenshot:I||null,paymentMessage:Ce||null,reference:Ee||null});if(!t.ok){const s=await t.json();throw new Error(s.message||"Deposit was not recorded")}return t.json()},onSuccess:()=>{i({title:"Request sent!",description:"Your deposit is awaiting validation."}),T.invalidateQueries({queryKey:["/api/deposits/history"]}),W(),n("amount"),Ze(null),g(""),we(f?.phone||""),ke(""),Se(""),Pe(""),Ie("")},onError:t=>i({title:"Deposit not recorded",description:x(t.message,"Unable to record the deposit."),variant:"destructive"})}),[Zt,Pt]=a.useState(null),[Xt,Et]=a.useState("");a.useEffect(()=>{const t=new URLSearchParams(window.location.search),s=t.get("wp_status"),r=t.get("wp_depositId");s&&(Et(s),r&&Pt(parseInt(r)),window.history.replaceState({},"","/deposit"),s==="success"&&(i({title:"Payment confirmation in progress",description:"Your deposit will be credited once confirmed."}),T.invalidateQueries({queryKey:["/api/deposits/history"]})))},[]);const z=P({mutationFn:async()=>{const t=await v("POST","/api/deposits",{amount:Number(o),accountName:f?.fullName||"",accountNumber:f?.phone||"",paymentMethod:"WestPay",country:h,useWestpay:!0});if(!t.ok){const s=await t.json();throw new Error(s.message||"Deposit not recorded")}return t.json()},onSuccess:t=>{t.westpayUrl&&(window.location.href=t.westpayUrl)},onError:t=>i({title:"Deposit not recorded",description:x(t.message,"Unable to record the deposit."),variant:"destructive"})}),He=P({mutationFn:async()=>{const t=await v("POST","/api/deposits",{amount:Number(o),accountName:f?.fullName||"",accountNumber:f?.phone||"",paymentMethod:"InPay",country:h,useInpay:!0});if(!t.ok){const s=await t.json();throw new Error(s.message||"Deposit not recorded")}return t.json()},onSuccess:t=>{t.inpayUrl&&(window.location.href=t.inpayUrl)},onError:t=>i({title:"Deposit not recorded",description:x(t.message,"Unable to record the deposit."),variant:"destructive"})}),D=P({mutationFn:async t=>{if(!$||!J.trim())throw new Error("Select an operator and enter your number");const s=await v("POST","/api/ashtechpay/collect",{amount:Number(o),country:de,operator:$,phone:J.trim(),depositId:R||void 0,otp:t||void 0});if(!s.ok){const r=await s.json();throw new Error(r.message||"Deposit not recorded")}return s.json()},onSuccess:t=>{Z(t.depositId),Le(x(t.message,"")),Ue(t.ussdCode||""),t.waveUrl?(mt(t.waveUrl),n("ashtech-redirect")):t.requiresOtp?n("ashtech-otp"):(q(!0),X(t.status||"pending"),n("ashtech-waiting"))},onError:t=>{if(t.data?.requiresOtp){Z(t.data.depositId||R),Ue(t.data.ussdCode||""),Le(x(t.message,"Dial the indicated code, then enter your OTP.")),Oe(""),n("ashtech-otp");return}i({title:"Deposit not recorded",description:x(t.message,"Unable to record the deposit."),variant:"destructive"})}}),fe=P({mutationFn:async()=>{if(!y)throw new Error("Select an operator");const t=await v("POST","/api/sendavapay/create",{amount:Number(o),country:F,operatorId:y.id,operatorName:y.name,payerPhone:re});if(!t.ok){const N=await t.json();throw new Error(N.message||"Unable to create payment")}const s=await t.json();H(s.depositId),G(s.paymentToken);const r=await v("POST","/api/sendavapay/initiate",{paymentToken:s.paymentToken,payerCountry:F,operatorId:y.id,depositId:s.depositId,payerPhone:re});if(!r.ok){const N=await r.json();throw new Error(N.message||"Unable to initiate payment")}return r.json()},onSuccess:t=>{const s=y?.name?.toLowerCase().includes("wave");t.requiresRedirect&&t.redirectUrl&&s?(ot(t.redirectUrl),n("sv-redirect")):t.requiresRedirect&&!s?(b(!0),n("sv-waiting")):t.requiresOtp&&t.otpToken?(ie(t.otpToken),rt(t.ussdCode||""),nt(x(t.message,"")),n("sv-otp")):t.success?(b(!0),n("sv-waiting")):i({title:"Payment unavailable",description:x(t.error||t.message,"The payment could not be initiated."),variant:"destructive"})},onError:t=>i({title:"Payment unavailable",description:x(t.message,"The payment could not be initiated."),variant:"destructive"})}),ge=P({mutationFn:async()=>{if(!ne)throw new Error("Payment token is missing");const t=await v("POST","/api/sendavapay/retry",{paymentToken:ne,depositId:V});if(!t.ok){const s=await t.json();throw new Error(s.message||"Retry unavailable")}return t.json()},onSuccess:()=>{ce(""),ie(""),U(""),b(!1),n("sv-operator"),i({title:"Ready to retry",description:"Select an operator and restart the payment."})},onError:t=>i({title:"Retry unavailable",description:x(t.message,"Please try again in a moment."),variant:"destructive"})}),ye=P({mutationFn:async()=>{const t=await v("POST","/api/sendavapay/submit-otp",{otpToken:at,otp:oe});if(!t.ok){const s=await t.json();throw new Error(s.message||"OTP verification failed")}return t.json()},onSuccess:()=>{b(!0),n("sv-waiting")},onError:t=>i({title:"OTP verification failed",description:x(t.message,"Check the code and try again."),variant:"destructive"})}),It=()=>{if(!o||Number(o)<ee){i({title:"Invalid amount",description:`The minimum deposit is ${ee.toLocaleString()} ${p}`,variant:"destructive"});return}if(d==="inpay"&&(!Number.isInteger(Number(o))||Number(o)%5!==0)){i({title:"Invalid amount",description:"Enter a whole amount in multiples of 5: 300, 305, 310…",variant:"destructive"});return}Ft()},Ft=()=>{if(!E){i({title:"Country required",description:"Select the payment country.",variant:"destructive"});return}if(!d||!gt.has(d)){i({title:"Deposit method required",description:me?"Loading available payment methods...":"No deposit method is configured for this country.",variant:"destructive"});return}if(d==="soleaspay"||d==="ashtech"||d==="sendavapay"||d==="manual"||d==="clapay"||d==="cloudpay"){window.location.href=`/robotpay?amount=${encodeURIComponent(Number(o))}&country=${encodeURIComponent(E)}&provider=${encodeURIComponent(d)}`;return}if(d==="inpay"){if(!Number.isInteger(Number(o))||Number(o)%5!==0){i({title:"Invalid amount",description:"Enter a whole amount in multiples of 5: 300, 305, 310…",variant:"destructive"});return}He.mutate();return}if(d==="westpay"){z.mutate();return}},Dt=t=>{const s=t.toLowerCase();return s.includes("tmoney")||s.includes("t-money")?"/operators/tmoney.png":s.includes("moov")?"/operators/moov.jpg":s.includes("orange")?"/operators/orange.png":s.includes("mtn")?"/operators/mtn.png":s.includes("airtel")?"/operators/airtel.png":s.includes("wave")?"/operators/wave.png":null},Mt=()=>{if(!ae.trim()){i({title:"Number required",description:"Enter the number you paid from.",variant:"destructive"});return}if(!I){i({title:"Screenshot required",description:"Please attach a payment screenshot.",variant:"destructive"});return}ue.mutate()};return f?c==="amount"?e.jsxs("main",{className:"recharge-reference min-h-screen bg-[#f7f3f0]",children:[e.jsx("style",{children:`
        .recharge-reference {
          min-height: 100dvh;
          background: #fff8f2;
          color: #111827;
          font-family: Inter, Arial, sans-serif;
        }
        .recharge-reference .recharge-screen {
          width: 100%;
          max-width: 512px;
          min-height: 100dvh;
          margin: 0 auto;
          overflow: hidden;
          background: #fff8f2;
        }
        .recharge-reference .recharge-hero {
          position: relative;
          box-sizing: border-box;
          height: 286px;
          min-height: 0;
          padding: 0 16px 20px;
          background: #fff8f2;
          border-bottom: 2px solid #111827;
        }
        .recharge-reference .recharge-hero-art {
          position: relative;
          width: 100%;
          height: 166px;
          overflow: hidden;
          margin-top: 76px;
          border: 2px solid #111827;
          border-radius: 13px;
          background: #fff;
          box-shadow: 0 4px 0 #111827;
        }
        .recharge-reference .recharge-hero-art img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .recharge-reference .recharge-title {
          position: absolute;
          z-index: 2;
          top: 20px;
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
        }
        .recharge-reference .recharge-title-logo {
          width: 38px;
          height: 38px;
          border: 2px solid #111827;
          border-radius: 50%;
          object-fit: cover;
        }
        .recharge-reference .history-button,
        .recharge-reference .recharge-back {
          position: absolute;
          z-index: 3;
          top: 14px;
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
        .recharge-reference .history-button {
          right: 16px;
        }
        .recharge-reference .recharge-back {
          left: 16px;
        }
        .recharge-reference .history-button:active,
        .recharge-reference .recharge-back:active {
          transform: translateY(2px);
          box-shadow: 0 1px 0 #111827;
        }
        .recharge-reference .history-icon {
          position: relative;
          width: 22px;
          height: 25px;
          border: 2px solid #111827;
          border-radius: 4px;
        }
        .recharge-reference .history-icon::before {
          position: absolute;
          top: 5px;
          left: 4px;
          width: 11px;
          height: 2px;
          content: "";
          background: #ff7a14;
          box-shadow: 0 6px 0 #ff7a14;
        }
        .recharge-reference .history-icon::after {
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
        .recharge-reference .recharge-back::before {
          width: 13px;
          height: 13px;
          border-bottom: 3px solid #111827;
          border-left: 3px solid #111827;
          content: "";
          transform: rotate(45deg) translate(2px, -2px);
        }
        .recharge-reference .amount-panel {
          min-height: 252px;
          padding: 20px 16px 18px;
          background: #fff;
        }
        .recharge-reference .preset-row {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
        }
        .recharge-reference .preset {
          height: 48px;
          border: 2px solid #d1d5db;
          border-radius: 11px;
          background: #fff;
          color: #24252a;
          font-size: 15px;
          font-weight: 800;
        }
        .recharge-reference .preset.active {
          background: ${m};
          border-color: #111827;
          color: #111827;
          box-shadow: 0 3px 0 #111827;
        }
        .recharge-reference .amount-label {
          margin: 20px 0 9px;
          color: #111827;
          font-size: 16px;
          font-weight: 800;
        }
        .recharge-reference .amount-input {
          display: flex;
          height: 56px;
          align-items: center;
          overflow: hidden;
          border: 2px solid #111827;
          border-radius: 12px;
          background: #fff;
        }
        .recharge-reference .amount-input input {
          width: 100%;
          height: 100%;
          min-width: 0;
          padding: 0 14px;
          border: 0;
          outline: 0;
          color: #111827;
          background: transparent;
          font-size: 19px;
        }
        .recharge-reference .currency {
          padding: 0 13px 0 0;
          color: #111827;
          font-size: 18px;
          font-weight: 800;
        }
        .recharge-reference .country-panel {
          margin: 14px 16px 0;
        }
        .recharge-reference .country-panel label {
          display: block;
          margin-bottom: 8px;
          color: #111827;
          font-size: 14px;
          font-weight: 800;
        }
        .recharge-reference .country-panel select {
          width: 100%;
          min-height: 52px;
          padding: 0 14px;
          border: 2px solid #111827;
          border-radius: 12px;
          outline: 0;
          background: #fff;
          color: #4b5563;
          font-size: 14px;
        }
        .recharge-reference .continue {
          display: flex;
          width: calc(100% - 32px);
          min-height: 57px;
          align-items: center;
          justify-content: center;
          margin: 14px 16px 0;
          border: 2px solid #111827;
          border-radius: 12px;
          background: ${m};
          color: #111827;
          font-size: 16px;
          font-weight: 800;
          box-shadow: 0 4px 0 #111827;
        }
        .recharge-reference .continue:active:not(:disabled) {
          transform: translateY(3px);
          box-shadow: 0 1px 0 #111827;
        }
        .recharge-reference .continue:disabled {
          opacity: .55;
        }
        .recharge-reference .instructions {
          margin: 18px 16px 24px;
          padding: 22px 16px 10px;
          border: 2px solid #111827;
          border-top: 5px solid #ff7a14;
          border-radius: 14px;
          background: #fff;
          color: #4b5563;
        }
        .recharge-reference .instructions-title {
          margin: 0 0 20px;
          color: #111827;
          font-size: 19px;
          font-weight: 800;
        }
        .recharge-reference .instructions-title::before {
          content: "•";
          margin-right: 8px;
          color: #ff7a14;
          font-size: 24px;
          line-height: 0;
        }
        .recharge-reference .instruction {
          position: relative;
          margin: 0 0 16px 20px;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.65;
        }
        .recharge-reference .instruction::before {
          position: absolute;
          top: 7px;
          left: -15px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          content: "";
          background: #ff7a14;
        }
        .recharge-reference .instruction strong { color: #111827; font-weight: 800; }
        @media (max-width: 360px) {
          .recharge-reference .recharge-hero { height: 270px; min-height: 0; padding-right: 12px; padding-left: 12px; }
          .recharge-reference .recharge-hero-art { height: 150px; }
          .recharge-reference .history-button { right: 12px; }
          .recharge-reference .recharge-back { left: 12px; }
          .recharge-reference .amount-panel { padding-right: 12px; padding-left: 12px; }
          .recharge-reference .country-panel { margin-right: 12px; margin-left: 12px; }
          .recharge-reference .continue { width: calc(100% - 24px); margin-right: 12px; margin-left: 12px; }
          .recharge-reference .preset-row { gap: 8px; }
          .recharge-reference .preset { height: 44px; font-size: 11px; }
          .recharge-reference .instruction { font-size: 15px; }
        }
      `}),e.jsxs("div",{className:"recharge-screen",children:[e.jsxs("section",{className:"recharge-hero","aria-label":"Deposit",children:[e.jsx("div",{className:"recharge-hero-art",children:e.jsx("img",{src:Rt,alt:""})}),e.jsxs("h1",{className:"recharge-title",children:[e.jsx("img",{className:"recharge-title-logo",src:$t,alt:""}),e.jsx("span",{children:"Deposit"})]}),e.jsx(C,{href:"/history",children:e.jsx("button",{className:"history-button","aria-label":"Transaction history",children:e.jsx("span",{className:"history-icon","aria-hidden":"true"})})}),e.jsx(C,{href:"/account",children:e.jsx("button",{className:"recharge-back","aria-label":"Back"})})]}),e.jsxs("section",{className:"amount-panel","aria-label":"Deposit amount",children:[e.jsx("div",{className:"preset-row",children:bt.map(t=>e.jsx("button",{className:`preset ${o===t?"active":""}`,onClick:()=>g(t),children:t},t))}),e.jsx("p",{className:"amount-label",children:"Enter the deposit amount"}),e.jsxs("label",{className:"amount-input",children:[e.jsx("input",{type:"number",inputMode:"numeric",value:o,onChange:t=>g(t.target.value?Number(t.target.value):""),"aria-label":"Deposit amount"}),e.jsx("span",{className:"currency",children:p})]})]}),e.jsxs("section",{className:"country-panel","aria-label":"Payment country",children:[e.jsx("label",{htmlFor:"deposit-country",children:"Payment country"}),e.jsxs("select",{id:"deposit-country",value:E,onChange:t=>Xe(t.target.value),children:[e.jsx("option",{value:"",children:"Select a country"}),xe.map(t=>e.jsxs("option",{value:t.code,children:[t.name," (",t.currency,")"]},t.code))]}),Re&&e.jsx("p",{className:"mt-2 text-xs text-amber-700",children:"Showing a temporary local list."}),E&&!me&&(ze||S.length===0||S.length>1)&&e.jsx("p",{role:"alert",className:"mt-2 text-sm text-red-700",children:ze?"Unable to check payment options for this country.":S.length>1?"Multiple payment options are configured for this country. Contact customer service.":"No payment option is available for this country."})]}),e.jsx("button",{className:"continue",onClick:It,disabled:!E||me||!d||He.isPending||z.isPending,children:"Top up now"}),e.jsxs("section",{className:"instructions","aria-label":"Deposit instructions",children:[e.jsx("h2",{className:"instructions-title",children:"Top-up instructions:"}),e.jsxs("p",{className:"instruction",children:[e.jsx("strong",{children:"Minimum deposit:"})," ",ee.toLocaleString("en-PH")," ",p]}),e.jsxs("p",{className:"instruction",children:[e.jsx("strong",{children:"Check your account details carefully"})," during the transfer so your payment can be processed correctly."]}),e.jsxs("p",{className:"instruction",children:[e.jsx("strong",{children:"Each order has its own payment details"}),"; do not reuse previous details for a second payment."]}),e.jsxs("p",{className:"instruction",children:[e.jsx("strong",{children:"After a successful transfer,"})," please wait 10 to 30 minutes."]})]})]})]}):c==="form"&&l?e.jsxs("div",{className:"deposit-step-shell",children:[e.jsx(u,{}),e.jsx("header",{className:"deposit-step-header",children:e.jsxs("button",{className:"deposit-step-back",onClick:()=>n("amount"),children:[e.jsx(w,{className:"w-5 h-5"}),e.jsx("span",{className:"font-semibold text-base",children:"Confirm payment"})]})}),e.jsxs("div",{className:"deposit-step-content space-y-4 pb-10",children:[e.jsxs("div",{className:"deposit-step-card deposit-step-card-orange p-4 flex items-center gap-3",children:[l.logoUrl?e.jsx("img",{src:l.logoUrl,alt:l.operatorName,className:"w-10 h-10 rounded-lg object-contain"}):e.jsx("div",{className:"w-10 h-10 rounded-lg bg-white flex items-center justify-center border-2 border-[#FF7A14]",children:e.jsx(se,{className:"w-5 h-5 text-[#FF7A14]"})}),e.jsxs("div",{className:"flex-1",children:[e.jsx("p",{className:"text-xs text-gray-500",children:l.paymentLink?"Payment link":"Recipient number"}),l.paymentLink?e.jsxs("a",{href:l.paymentLink,target:"_blank",rel:"noreferrer",className:"mt-1 flex items-center gap-1 text-sm font-bold text-[#E85D00] underline",children:[e.jsx(A,{className:"h-4 w-4"})," Open payment link"]}):e.jsxs("p",{className:"font-bold text-[#E85D00] text-sm",children:[l.operatorName," — ",l.phone]}),e.jsx("p",{className:"text-xs text-gray-500",children:l.ownerName})]}),e.jsxs("div",{className:"text-right",children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Amount"}),e.jsxs("p",{className:"font-bold text-gray-800",children:[Number(o).toLocaleString()," ",p]})]})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:"Your payer number"}),e.jsxs("div",{className:"deposit-step-field flex items-center overflow-hidden",children:[e.jsx(se,{className:"w-4 h-4 text-gray-400 ml-4"}),e.jsx("input",{type:"tel",value:ae,onChange:t=>we(t.target.value),placeholder:"Number you paid from",className:"flex-1 px-3 py-4 text-sm text-gray-700 outline-none bg-transparent"})]})]}),e.jsxs("div",{children:[e.jsxs("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:["Transaction reference / ID ",e.jsx("span",{className:"text-gray-400 font-normal",children:"(optional)"})]}),e.jsx("input",{type:"text",value:Ee,onChange:t=>Ie(t.target.value),placeholder:"Transaction reference number",className:"deposit-step-field w-full px-4 py-4 text-sm text-gray-700 outline-none"})]}),e.jsxs("div",{children:[e.jsxs("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:["Message received after payment ",e.jsx("span",{className:"text-gray-400 font-normal",children:"(optional)"})]}),e.jsx("textarea",{value:Ce,onChange:t=>Pe(t.target.value),placeholder:"Paste the SMS or confirmation message here...",rows:3,className:"deposit-step-field w-full px-4 py-3 text-sm text-gray-700 outline-none resize-none"})]}),e.jsxs("div",{children:[e.jsxs("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:["Payment screenshot ",e.jsx("span",{className:"text-red-500",children:"*"})]}),e.jsx("input",{ref:Ne,type:"file",accept:"image/*",onChange:Ct,className:"hidden"}),e.jsx("button",{onClick:()=>Ne.current?.click(),className:`w-full border-2 border-dashed rounded-xl py-7 flex flex-col items-center gap-2 transition-colors ${I?"border-[#FF7A14] bg-[#FFF3E8]":"border-gray-300 bg-gray-50 hover:border-[#FF7A14] hover:bg-[#FFF3E8]"}`,children:I?e.jsxs(e.Fragment,{children:[e.jsx(_,{className:"w-8 h-8 text-[#FF7A14]"}),e.jsx("p",{className:"text-sm font-medium text-[#E85D00]",children:et}),e.jsx("p",{className:"text-xs text-gray-400",children:"Appuyez pour changer"})]}):e.jsxs(e.Fragment,{children:[e.jsx(qt,{className:"w-8 h-8 text-gray-400"}),e.jsx("p",{className:"text-sm font-medium text-gray-600",children:"Tap to add a screenshot"}),e.jsx("p",{className:"text-xs text-gray-400",children:"JPG, PNG — max 5 MB"})]})}),I&&e.jsx("div",{className:"mt-3 rounded-xl overflow-hidden border border-gray-100",children:e.jsx("img",{src:I,alt:"Capture",className:"w-full max-h-52 object-contain bg-gray-50"})})]}),e.jsx("button",{onClick:Mt,disabled:ue.isPending,className:"deposit-step-primary w-full py-5 disabled:opacity-50",style:{background:m},children:ue.isPending?e.jsxs("span",{className:"flex items-center justify-center gap-2",children:[e.jsx(j,{className:"w-5 h-5 animate-spin"})," Envoi en cours..."]}):e.jsxs("span",{className:"flex items-center justify-center gap-2",children:[e.jsx(Yt,{className:"w-5 h-5"})," Submit my request"]})})]})]}):c==="westpay"?e.jsxs("div",{className:"deposit-step-shell",children:[e.jsx(u,{}),e.jsx("header",{className:"deposit-step-header",children:e.jsxs("button",{className:"deposit-step-back",onClick:()=>n("amount"),children:[e.jsx(w,{className:"w-5 h-5"}),e.jsx("span",{className:"font-semibold text-base",children:"Mobile Money payment"})]})}),e.jsxs("div",{className:"deposit-step-content space-y-5 pb-10",children:[e.jsxs("div",{className:"deposit-step-summary mx-0 p-4 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Amount to deposit"}),e.jsxs("p",{className:"text-xl font-bold text-[#E85D00]",children:[Number(o).toLocaleString()," ",p]})]}),e.jsx("button",{onClick:()=>n("amount"),className:"text-xs text-[#E85D00] underline",children:"Edit"})]}),e.jsxs("div",{className:"deposit-step-card p-4 space-y-2",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(zt,{className:"w-5 h-5 text-[#FF7A14]"}),e.jsx("p",{className:"font-semibold text-gray-900 text-sm",children:"How it works"})]}),e.jsxs("p",{className:"text-xs text-gray-600 leading-relaxed",children:["1. Click ",e.jsx("strong",{children:"Continue payment"})," — you will be redirected to the secure payment page."]}),e.jsx("p",{className:"text-xs text-gray-600 leading-relaxed",children:"2. Enter your Mobile Money number and approve the USSD payment on your phone."}),e.jsx("p",{className:"text-xs text-gray-600 leading-relaxed",children:"3. After payment, you will be redirected here automatically. Your balance is credited after confirmation."})]}),e.jsx("button",{onClick:()=>z.mutate(),disabled:z.isPending,className:"deposit-step-primary w-full py-5 disabled:opacity-40 flex items-center justify-center gap-2",style:{background:m},children:z.isPending?e.jsxs(e.Fragment,{children:[e.jsx(j,{className:"w-5 h-5 animate-spin"})," Redirection en cours..."]}):e.jsxs(e.Fragment,{children:[e.jsx(A,{className:"w-5 h-5"})," Continue payment"]})}),e.jsx("p",{className:"text-xs text-center text-gray-400",children:"Secure payment — USSD Mobile Money"})]})]}):c==="ashtech-operator"?e.jsxs("div",{className:"deposit-step-shell",children:[e.jsx(u,{}),e.jsxs("header",{className:"deposit-step-header",children:[e.jsxs("button",{className:"deposit-step-back",onClick:()=>n("amount"),children:[e.jsx(w,{className:"w-5 h-5"}),e.jsx("span",{className:"font-semibold text-base",children:"Mobile Money payment"})]}),e.jsx(C,{href:"/history",children:e.jsx("button",{className:"deposit-step-history",children:"History"})})]}),e.jsxs("div",{className:"deposit-step-summary mx-4 mt-4 p-4 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Deposit amount"}),e.jsxs("p",{className:"text-xl font-bold text-[#E85D00]",children:[Number(o).toLocaleString()," ",p]})]}),e.jsx("button",{onClick:()=>n("amount"),className:"text-xs text-[#E85D00] underline",children:"Edit"})]}),e.jsxs("div",{className:"deposit-step-content space-y-4 pb-10",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:"Country"}),St?e.jsx(j,{className:"w-6 h-6 animate-spin text-[#FF7A14] mx-auto"}):e.jsx("select",{value:de,onChange:t=>{dt(t.target.value),Te("")},className:"deposit-step-field w-full px-4 py-4 text-sm text-gray-700 outline-none appearance-none",children:We.map(t=>e.jsxs("option",{value:t.code,children:[t.name," (",t.currency,")"]},t.code))})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:"Mobile Money number"}),e.jsxs("div",{className:"deposit-step-field flex items-center overflow-hidden",children:[e.jsx(se,{className:"w-4 h-4 text-gray-400 ml-4 flex-shrink-0"}),e.jsx("input",{type:"tel",inputMode:"numeric",value:J,onChange:t=>pt(t.target.value),placeholder:"Your Mobile Money number",className:"flex-1 px-3 py-4 text-sm text-gray-700 outline-none bg-transparent"})]})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:"Mobile Money operator"}),Ve.length===0?e.jsx("p",{className:"text-sm text-gray-400 text-center py-5",children:"No operator is available for this country"}):e.jsx("div",{className:"space-y-2",children:Ve.map((t,s)=>{const r=typeof t=="string"?t:t.name||t.code||`Operator ${s+1}`;return e.jsxs("button",{onClick:()=>Te(r),className:`deposit-step-operator w-full flex items-center justify-between px-4 py-4 ${$===r?"deposit-step-operator-selected":""}`,children:[e.jsx("span",{className:"font-semibold text-gray-900 text-sm",children:r}),$===r&&e.jsx(_,{className:"w-5 h-5 text-[#FF7A14]"})]},`${r}-${s}`)})})]}),e.jsx("button",{onClick:()=>D.mutate(void 0),disabled:!$||!J.trim()||D.isPending,className:"deposit-step-primary w-full py-5 disabled:opacity-40",style:{background:m},children:D.isPending?e.jsxs("span",{className:"flex items-center justify-center gap-2",children:[e.jsx(j,{className:"w-5 h-5 animate-spin"})," Starting..."]}):"Start payment"})]})]}):c==="ashtech-otp"?e.jsxs("div",{className:"deposit-step-shell",children:[e.jsx(u,{}),e.jsx("header",{className:"deposit-step-header",children:e.jsxs("button",{onClick:()=>n("ashtech-operator"),className:"deposit-step-back",children:[e.jsx(w,{className:"w-5 h-5"}),e.jsx("span",{children:"Code OTP"})]})}),e.jsxs("div",{className:"deposit-step-content space-y-5 pb-10",children:[e.jsxs("div",{className:"deposit-step-card deposit-step-card-orange p-4",children:[e.jsx("p",{className:"font-bold text-gray-900 text-sm mb-2",children:"Dial code"}),he&&e.jsx("p",{className:"deposit-step-otp px-4 py-3 text-center font-mono font-black text-2xl text-[#E85D00] tracking-widest",children:he}),e.jsx("p",{className:"text-sm text-gray-600 mt-3",children:he?"Dial this code on your phone to receive the OTP, then enter it below.":"An OTP has been sent to you. Enter it below."})]}),e.jsx("input",{type:"text",inputMode:"numeric",value:pe,onChange:t=>Oe(t.target.value),maxLength:8,placeholder:"OTP code received by SMS",className:"deposit-step-otp w-full px-4 py-4 text-center text-2xl tracking-widest font-black text-gray-800 outline-none focus:border-[#FF7A14]"}),e.jsx("button",{onClick:()=>D.mutate(pe),disabled:!pe.trim()||D.isPending,className:"deposit-step-primary w-full py-5 disabled:opacity-40",style:{background:m},children:D.isPending?e.jsxs("span",{className:"flex items-center justify-center gap-2",children:[e.jsx(j,{className:"w-5 h-5 animate-spin"})," Verifying..."]}):"Verify OTP code"})]})]}):c==="ashtech-redirect"?e.jsxs("div",{className:"deposit-step-shell flex flex-col",children:[e.jsx(u,{}),e.jsx("header",{className:"deposit-step-header",children:e.jsxs("button",{onClick:()=>n("ashtech-operator"),className:"deposit-step-back",children:[e.jsx(w,{className:"w-5 h-5"}),e.jsx("span",{children:"Complete payment"})]})}),e.jsxs("div",{className:"flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6",children:[e.jsx("div",{className:"deposit-step-icon",children:e.jsx(A,{className:"w-10 h-10 text-[#FF7A14]"})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-gray-900 text-xl mb-2",children:"Complete with Wave"}),e.jsxs("p",{className:"text-sm text-gray-500",children:["Open the Wave page to confirm your deposit of ",e.jsxs("strong",{children:[Number(o).toLocaleString()," ",p]}),"."]})]}),e.jsxs("a",{href:ht,target:"_blank",rel:"noopener noreferrer",onClick:()=>{q(!0),n("ashtech-waiting")},className:"deposit-step-primary w-full py-5 flex items-center justify-center gap-2",style:{background:m},children:[e.jsx(A,{className:"w-5 h-5"})," Open Wave"]})]})]}):c==="ashtech-waiting"?e.jsxs("div",{className:"deposit-step-shell flex flex-col",children:[e.jsx(u,{}),e.jsx("header",{className:"deposit-step-header",children:e.jsx("span",{className:"font-semibold text-base text-gray-800",children:"Payment in progress"})}),e.jsxs("div",{className:"flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6",children:[e.jsx("div",{className:"deposit-step-icon",children:e.jsx(Y,{className:"w-10 h-10 text-[#FF7A14] animate-spin",style:{animationDuration:"2s"}})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-gray-900 text-xl",children:"Awaiting confirmation"}),e.jsx("p",{className:"text-sm text-gray-500 mt-2",children:"Approve the payment on your phone. This page updates automatically."})]}),e.jsxs("div",{className:"flex gap-3 w-full",children:[e.jsx(C,{href:"/history",className:"flex-1",children:e.jsx("button",{className:"deposit-step-secondary w-full py-3 text-sm",children:"View history"})}),e.jsx("button",{onClick:()=>{n("amount"),g(""),Z(null),q(!1),X("")},className:"deposit-step-secondary flex-1 py-3 text-sm",children:"New top-up"})]})]})]}):c==="soleaspay-waiting"?e.jsxs("div",{className:"deposit-step-shell flex flex-col",children:[e.jsx(u,{}),e.jsx("header",{className:"deposit-step-header",children:e.jsx("span",{className:"font-semibold text-base text-gray-800",children:"Payment in progress"})}),e.jsxs("div",{className:"flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6",children:[e.jsx("div",{className:"deposit-step-icon",children:k==="approved"?e.jsx(_,{className:"w-10 h-10 text-[#FF7A14]"}):e.jsx(Y,{className:`w-10 h-10 ${k==="rejected"?"text-red-400":"text-[#FF7A14] animate-spin"}`})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-gray-900 text-xl",children:k==="approved"?"Payment confirmed!":k==="rejected"?"Payment failed":"Awaiting confirmation"}),e.jsx("p",{className:"text-sm text-gray-500 mt-2",children:k==="approved"?`Your balance has been credited with ${Number(o).toLocaleString()} ${p}.`:k==="rejected"?"The payment was declined or cancelled.":ct||"Approve the payment request on your phone. This page updates automatically."}),L&&e.jsxs("p",{className:"text-xs text-gray-400 mt-2",children:["Deposit reference: #",L]})]}),e.jsxs("div",{className:"flex gap-3 w-full",children:[k==="rejected"?e.jsx("button",{onClick:()=>{le(null),Q(""),B(!1),window.location.href=`/robotpay?amount=${encodeURIComponent(Number(o))}&country=${encodeURIComponent(h)}&provider=cloudpay`},className:"deposit-step-primary flex-1 py-3 text-sm",style:{background:m},children:"Try again"}):e.jsx(C,{href:"/history",className:"flex-1",children:e.jsx("button",{className:"deposit-step-secondary w-full py-3 text-sm",children:"View history"})}),e.jsx("button",{onClick:()=>{n("amount"),g(""),le(null),Q(""),B(!1)},className:"deposit-step-secondary flex-1 py-3 text-sm",children:"New top-up"})]})]})]}):c==="sv-operator"?e.jsxs("div",{className:"deposit-step-shell",children:[e.jsx(u,{}),e.jsxs("header",{className:"deposit-step-header",children:[e.jsxs("button",{className:"deposit-step-back",onClick:()=>n("amount"),children:[e.jsx(w,{className:"w-5 h-5"}),e.jsx("span",{className:"font-semibold text-base",children:"Top up"})]}),e.jsx(C,{href:"/history",children:e.jsx("button",{className:"deposit-step-history",children:"History"})})]}),e.jsxs("div",{className:"deposit-step-summary mx-4 mt-4 p-4 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Deposit amount"}),e.jsxs("p",{className:"text-xl font-bold text-[#E85D00]",children:[Number(o).toLocaleString()," ",p]})]}),e.jsx("button",{onClick:()=>n("amount"),className:"text-xs text-[#E85D00] underline",children:"Edit"})]}),e.jsxs("div",{className:"deposit-step-content space-y-4 pb-10",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:"Country"}),e.jsx("select",{value:F,onChange:t=>{tt(t.target.value),O(null)},className:"deposit-step-field w-full px-4 py-4 text-sm text-gray-700 outline-none appearance-none",children:xe.map(t=>e.jsx("option",{value:t.code,children:t.name},t.code))})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:"Mobile Money number"}),e.jsxs("div",{className:"deposit-step-field flex items-center overflow-hidden",children:[e.jsx(se,{className:"w-4 h-4 text-gray-400 ml-4 flex-shrink-0"}),e.jsx("input",{type:"tel",inputMode:"numeric",value:re,onChange:t=>st(t.target.value),placeholder:"Number to receive the payment request",className:"flex-1 px-3 py-4 text-sm text-gray-700 outline-none bg-transparent"})]})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:"Mobile Money operator"}),wt?e.jsx("div",{className:"flex items-center justify-center py-8",children:e.jsx(j,{className:"w-6 h-6 animate-spin text-[#FF7A14]"})}):Ke.length===0?e.jsx("div",{className:"text-center py-8 text-gray-400",children:e.jsx("p",{className:"text-sm",children:"No operator is available for this country"})}):e.jsx("div",{className:"space-y-2",children:Ke.map(t=>{const s=Dt(t.name);return e.jsxs("button",{onClick:()=>O(t),className:`deposit-step-operator w-full flex items-center justify-between px-4 py-4 transition-all ${y?.id===t.id?"deposit-step-operator-selected":""}`,children:[e.jsxs("div",{className:"flex items-center gap-3",children:[s?e.jsx("img",{src:s,alt:t.name,className:"w-10 h-10 rounded-full object-cover border border-gray-100"}):e.jsx("div",{className:`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${y?.id===t.id?"bg-[#FF7A14] text-gray-900":"bg-gray-100 text-gray-600"}`,children:t.name.charAt(0)}),e.jsxs("div",{className:"text-left",children:[e.jsx("p",{className:"font-semibold text-gray-900 text-sm",children:t.name}),t.requiresOtp&&e.jsx("p",{className:"text-xs text-[#E85D00]",children:"OTP code required"})]})]}),y?.id===t.id&&e.jsx(_,{className:"w-5 h-5 text-[#FF7A14]"})]},t.id)})})]}),e.jsx("button",{onClick:()=>fe.mutate(),disabled:!y||fe.isPending,className:"deposit-step-primary w-full py-5 disabled:opacity-40",style:{background:m},children:fe.isPending?e.jsxs("span",{className:"flex items-center justify-center gap-2",children:[e.jsx(j,{className:"w-5 h-5 animate-spin"})," Initiation en cours..."]}):e.jsxs("span",{className:"flex items-center justify-center gap-2",children:[e.jsx("img",{src:"/topup-icon.png",className:"w-6 h-6 object-contain",alt:"topup"})," Initiate payment"]})})]})]}):c==="sv-otp"?e.jsxs("div",{className:"deposit-step-shell",children:[e.jsx(u,{}),e.jsx("header",{className:"deposit-step-header",children:e.jsxs("button",{onClick:()=>n("sv-operator"),className:"deposit-step-back",children:[e.jsx(w,{className:"w-5 h-5"}),e.jsx("span",{className:"font-semibold text-base",children:"Code OTP"})]})}),e.jsxs("div",{className:"deposit-step-content space-y-5 pb-10",children:[e.jsxs("div",{className:"deposit-step-card deposit-step-card-orange p-4",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsx("div",{className:"w-7 h-7 rounded-full bg-[#FF7A14] flex items-center justify-center flex-shrink-0",children:e.jsx("span",{className:"text-gray-900 font-bold text-xs",children:"1"})}),e.jsx("p",{className:"font-bold text-gray-900 text-sm",children:"Dial this code on your phone"})]}),Fe?e.jsxs("div",{className:"deposit-step-otp px-4 py-3 text-center",children:[e.jsx("p",{className:"font-mono font-black text-2xl text-[#E85D00] tracking-widest",children:Fe}),e.jsx("p",{className:"text-xs text-gray-400 mt-1",children:"Dial this USSD code on your phone"})]}):e.jsxs("p",{className:"text-sm text-gray-600",children:["Dial your operator's USSD code (e.g. ",e.jsx("span",{className:"font-mono font-bold text-[#E85D00]",children:"*144#"}),") on your phone to receive the OTP by SMS."]})]}),e.jsxs("div",{className:"deposit-step-card deposit-step-card-orange p-4",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsx("div",{className:"w-7 h-7 rounded-full bg-[#FF7A14] flex items-center justify-center flex-shrink-0",children:e.jsx("span",{className:"text-white font-bold text-xs",children:"2"})}),e.jsx("p",{className:"font-bold text-gray-900 text-sm",children:"Enter the OTP received by SMS"})]}),e.jsxs("p",{className:"text-xs text-gray-500 mb-3",children:["After dialing the code, you will receive an SMS with an OTP. Enter it below to confirm the payment of ",e.jsxs("strong",{children:[Number(o).toLocaleString()," ",p]}),"."]}),e.jsx("input",{type:"text",inputMode:"numeric",value:oe,onChange:t=>ce(t.target.value),placeholder:"OTP received by SMS",className:"deposit-step-otp w-full px-4 py-4 text-center text-2xl tracking-widest font-black text-gray-800 outline-none focus:border-[#FF7A14]",maxLength:8})]}),e.jsx("button",{onClick:()=>ye.mutate(),disabled:!oe.trim()||ye.isPending,className:"deposit-step-primary w-full py-5 disabled:opacity-40",style:{background:m},children:ye.isPending?e.jsxs("span",{className:"flex items-center justify-center gap-2",children:[e.jsx(j,{className:"w-5 h-5 animate-spin"})," Verifying..."]}):"Verify OTP code"})]})]}):c==="sv-redirect"?e.jsxs("div",{className:"deposit-step-shell flex flex-col",children:[e.jsx(u,{}),e.jsx("header",{className:"deposit-step-header",children:e.jsxs("button",{onClick:()=>n("sv-operator"),className:"deposit-step-back",children:[e.jsx(w,{className:"w-5 h-5"}),e.jsx("span",{className:"font-semibold text-base",children:"Complete payment"})]})}),e.jsxs("div",{className:"flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6",children:[e.jsx("div",{className:"deposit-step-icon",children:e.jsx(A,{className:"w-10 h-10 text-[#FF7A14]"})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-gray-900 text-xl mb-2",children:"Complete in the app"}),e.jsxs("p",{className:"text-sm text-gray-500",children:["Tap the button below to open the operator's payment page and confirm your deposit of ",e.jsxs("strong",{children:[Number(o).toLocaleString()," ",p]}),"."]})]}),e.jsxs("a",{href:it,target:"_blank",rel:"noopener noreferrer",className:"deposit-step-primary w-full py-5 flex items-center justify-center gap-2",style:{background:m},onClick:()=>{b(!0),n("sv-waiting")},children:[e.jsx(A,{className:"w-5 h-5"})," Open payment page"]})]})]}):c==="sv-waiting"?e.jsxs("div",{className:"deposit-step-shell flex flex-col",children:[e.jsx(u,{}),e.jsx("header",{className:"deposit-step-header",children:e.jsx("span",{className:"font-semibold text-base text-gray-800",children:"Payment in progress"})}),e.jsx("div",{className:"flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6",children:De==="approved"?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"deposit-step-icon",children:e.jsx(_,{className:"w-10 h-10 text-[#FF7A14]"})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-gray-900 text-xl",children:"Payment confirmed!"}),e.jsxs("p",{className:"text-sm text-gray-500 mt-1",children:["Your balance was credited with ",e.jsxs("strong",{children:[Number(o).toLocaleString()," ",p]})]})]})]}):De==="rejected"?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"deposit-step-icon",children:e.jsx(Y,{className:"w-10 h-10 text-red-400"})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-gray-900 text-xl",children:"Payment failed"}),e.jsx("p",{className:"text-sm text-gray-500 mt-1",children:"The payment was declined or cancelled."})]}),e.jsxs("div",{className:"flex gap-3 w-full",children:[ne&&e.jsxs("button",{onClick:()=>ge.mutate(),disabled:ge.isPending,className:"deposit-step-primary flex-1 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50",style:{background:m},children:[ge.isPending?e.jsx(j,{className:"w-4 h-4 animate-spin"}):e.jsx(Y,{className:"w-4 h-4"}),"Try again"]}),e.jsx("button",{onClick:()=>{n("amount"),g(""),O(null),H(null),G(""),b(!1),U("")},className:"deposit-step-secondary flex-1 py-3 text-sm",children:"New top-up"})]})]}):e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"deposit-step-icon",children:e.jsx(Y,{className:"w-10 h-10 text-[#FF7A14] animate-spin",style:{animationDuration:"2s"}})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-gray-900 text-xl",children:"Awaiting confirmation"}),e.jsxs("p",{className:"text-sm text-gray-500 mt-2",children:["A payment request for ",e.jsxs("strong",{children:[Number(o).toLocaleString()," ",p]})," was sent to your phone.",e.jsx("br",{}),"Accept it on your phone. This page updates automatically."]})]}),e.jsxs("div",{className:"flex gap-3 w-full",children:[e.jsx(C,{href:"/history",className:"flex-1",children:e.jsx("button",{className:"deposit-step-secondary w-full py-3 text-sm",children:"View history"})}),e.jsx("button",{onClick:()=>{n("amount"),g(""),O(null),H(null),G(""),b(!1),U("")},className:"deposit-step-secondary flex-1 py-3 text-sm",children:"New top-up"})]})]})})]}):null:null}export{ds as default};
