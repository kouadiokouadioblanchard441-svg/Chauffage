import{c as te,a as ae,b as le,u as re,d as oe,r as c,j as e,L as F,e as se,q as N,f as C}from"./index-J_aRyCSo.js";import{u as A}from"./useQuery-YzHTDHKV.js";import{u as S}from"./useMutation-CVEQQWAi.js";import{u as ne,C as P,t as ie,o as ce,s as T}from"./types-CxmQ-HzN.js";import{c as de,b as pe}from"./countries-BtFzSwEU.js";import{e as fe}from"./illustration-8_1784762965573-C2eE_S1I.js";import{c as xe}from"./auth-chargepoint-combined-0mIqx7uW.js";import{w as ue}from"./account-wallet-DgIYQb9G.js";import{C as W}from"./chevron-left-DWXHOMwe.js";import{X as q}from"./x-C4W1hnzG.js";import{S as D}from"./search-CWbyxjry.js";import{C as z}from"./check-DNPCNZrJ.js";import{P as I,T as he}from"./trash-2-BppmLiTt.js";import{C as me}from"./chevron-right-CSHmFGVu.js";const we=te("CreditCard",[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]]),ge=ce({accountNumber:T().min(8,"Account number is required"),paymentMethod:T().min(2,"Payment method is required")});function be(r){const a=r.replace(/\s+/g,"");return a.length<=6?r:`${a.slice(0,2)}••••••${a.slice(-4)}`}function ye(r){const a=r.toLowerCase();return a.includes("orange")?"/operators/orange.png":a.includes("mtn")?"/operators/mtn.png":a.includes("moov")?"/operators/moov.jpg":a.includes("airtel")?"/operators/airtel.png":a.includes("wave")?"/operators/wave.png":a.includes("tmoney")||a.includes("t-money")?"/operators/tmoney.png":"/chargepoint-icon-512.png"}const B=`
  .wallet-page {
    width: 100%;
    min-height: 100dvh;
    overflow-x: hidden;
    background: #ffffff;
    color: #111827;
    font-family: Arial, sans-serif;
  }
  .wallet-page *,
  .wallet-page *::before,
  .wallet-page *::after {
    box-sizing: border-box;
  }
  .wallet-shell {
    width: 100%;
    max-width: 512px;
    min-height: 100dvh;
    margin: 0 auto;
    background: #ffffff;
  }
  .wallet-topbar {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 78px;
    padding: 17px 16px;
    border-bottom: 2px solid #111827;
    background: #ffffff;
  }
  .wallet-back,
  .wallet-top-action {
    display: grid;
    width: 42px;
    height: 42px;
    flex: none;
    place-items: center;
    border: 2px solid #111827;
    border-radius: 11px;
    background: #ffffff;
    box-shadow: 0 3px 0 #111827;
    color: #111827;
    cursor: pointer;
  }
  .wallet-top-action {
    background: #ff7a14;
    border-color: #ff7a14;
    box-shadow: 0 3px 0 #111827;
    color: #111827;
  }
  .wallet-heading {
    min-width: 0;
    flex: 1;
  }
  .wallet-eyebrow {
    display: block;
    margin-bottom: 2px;
    color: #c65100;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .08em;
    line-height: 1.2;
    text-transform: uppercase;
  }
  .wallet-title {
    margin: 0;
    color: #171717;
    font-size: 20px;
    font-weight: 800;
    line-height: 1.25;
  }
  .wallet-content {
    padding: 16px 16px 30px;
  }
  .wallet-hero {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
    padding: 16px;
    border: 1px solid #ffe0ca;
    border-radius: 20px;
    background: #fff8f2;
  }
  .wallet-hero-icon {
    display: grid;
    width: 44px;
    height: 44px;
    flex: none;
    place-items: center;
    border-radius: 15px;
    background: #ff7a14;
    color: #ffffff;
  }
  .wallet-hero h2 {
    margin: 0 0 4px;
    color: #171717;
    font-size: 15px;
    font-weight: 800;
  }
  .wallet-hero p {
    margin: 0;
    color: #6b625d;
    font-size: 13px;
    line-height: 1.5;
  }
  .wallet-section {
    margin-bottom: 16px;
    overflow: hidden;
    border: 2px solid #111827;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 4px 0 #111827, 0 8px 16px rgba(17, 24, 39, .14);
  }
  .wallet-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px;
    border-bottom: 2px solid #111827;
  }
  .wallet-section-title {
    margin: 0;
    color: #111827;
    font-size: 16px;
    font-weight: 800;
  }
  .wallet-section-caption {
    margin: 3px 0 0;
    color: #4b5563;
    font-size: 12px;
    line-height: 1.35;
  }
  .wallet-step {
    display: grid;
    width: 30px;
    height: 30px;
    flex: none;
    place-items: center;
    border: 2px solid #111827;
    border-radius: 9px;
    background: #ff7a14;
    color: #111827;
    font-size: 12px;
    font-weight: 800;
  }
  .wallet-selector {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px;
    border: 0;
    background: #ffffff;
    color: #171717;
    text-align: left;
    cursor: pointer;
  }
  .wallet-selector:hover,
  .wallet-selector:focus-visible {
    background: #fffaf6;
    outline: none;
  }
  .wallet-selector-copy {
    min-width: 0;
    flex: 1;
  }
  .wallet-label {
    display: block;
    margin-bottom: 5px;
    color: #857b74;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .03em;
    text-transform: uppercase;
  }
  .wallet-value {
    display: block;
    overflow: hidden;
    color: #171717;
    font-size: 14px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .wallet-value.is-empty {
    color: #a69c95;
    font-weight: 500;
  }
  .wallet-selector svg {
    flex: none;
    color: #c65100;
  }
  .wallet-field {
    padding: 15px 16px 16px;
  }
  .wallet-field + .wallet-field {
    border-top: 1px solid #f2ebe5;
  }
  .wallet-input {
    width: 100%;
    border: 0;
    border-bottom: 1px solid #d9cec5;
    padding: 3px 0 9px;
    outline: none;
    background: transparent;
    color: #171717;
    font-size: 15px;
  }
  .wallet-input:focus {
    border-color: #ff7a14;
    box-shadow: 0 1px 0 #ff7a14;
  }
  .wallet-input::placeholder {
    color: #b8aea7;
  }
  .wallet-error {
    margin: 6px 0 0;
    color: #c03900;
    font-size: 12px;
  }
  .wallet-note {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 14px 2px 0;
    color: #756b64;
    font-size: 12px;
    line-height: 1.45;
  }
  .wallet-note svg {
    flex: none;
    margin-top: 1px;
    color: #ff7a14;
  }
  .wallet-list-section {
    margin-bottom: 0;
  }
  .wallet-list {
    display: grid;
    gap: 18px;
    padding: 16px;
  }
  .wallet-card-wrap {
    display: grid;
    gap: 8px;
  }
  .wallet-card {
    position: relative;
    min-height: 196px;
    overflow: hidden;
    border: 0;
    border: 2px solid #111827;
    border-radius: 16px;
    padding: 20px;
    background: linear-gradient(125deg, #c94f00 0%, #f26b08 48%, #ff982e 100%);
    box-shadow: 0 4px 0 #111827, 0 9px 16px rgba(17, 24, 39, .18);
    color: #ffffff;
    transition: box-shadow .15s ease, transform .15s ease;
  }
  .wallet-card::before {
    position: absolute;
    inset: -45% -20%;
    background: repeating-linear-gradient(
      68deg,
      rgba(255, 255, 255, .16) 0,
      rgba(255, 255, 255, .16) 24px,
      transparent 24px,
      transparent 72px
    );
    content: "";
    transform: rotate(-4deg);
    pointer-events: none;
  }
  .wallet-card > * {
    position: relative;
    z-index: 1;
  }
  .wallet-card.is-selectable {
    cursor: pointer;
  }
  .wallet-card.is-selectable:active {
    transform: scale(.99);
  }
  .wallet-card.is-default {
    box-shadow: 0 0 0 3px #ffffff, 0 4px 0 #111827, 0 9px 16px rgba(17, 24, 39, .18);
  }
  .wallet-card-brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .wallet-card-icon {
    display: grid;
    width: 32px;
    height: 32px;
    flex: none;
    place-items: center;
    border: 2px solid #111827;
    border-radius: 8px;
    background: rgba(255, 255, 255, .13);
    padding: 5px;
    object-fit: contain;
    filter: brightness(0) invert(1);
  }
  .wallet-card-copy {
    display: flex;
    min-width: 0;
    height: 100%;
    flex-direction: column;
  }
  .wallet-card-method {
    margin: 0;
    color: #ffffff;
    font-size: 14px;
    font-weight: 800;
    letter-spacing: .14em;
    text-transform: uppercase;
  }
  .wallet-card-number {
    margin: auto 0 18px;
    overflow: hidden;
    color: #ffffff;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: .04em;
    text-overflow: ellipsis;
    white-space: normal;
  }
  .wallet-card-bottomline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .wallet-card-network {
    display: inline-flex;
    min-width: 0;
    align-items: center;
    gap: 7px;
    color: rgba(255, 255, 255, .86);
    font-size: 12px;
    font-weight: 600;
  }
  .wallet-card-network-icon {
    width: 20px;
    height: 20px;
    flex: none;
    border: 2px solid #111827;
    border-radius: 5px;
    background: #ffffff;
    object-fit: cover;
  }
  .wallet-card-network span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .wallet-card-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 5px;
  }
  .wallet-icon-action {
    display: inline-flex;
    min-height: 40px;
    align-items: center;
    gap: 6px;
    border: 2px solid #111827;
    border-radius: 11px;
    padding: 0 12px;
    background: #ffffff;
    color: #111827;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }
  .wallet-icon-action:hover,
  .wallet-icon-action:focus-visible {
    border-color: #111827;
    background: #fff0e5;
    outline: 3px solid rgba(255, 122, 20, .22);
    outline-offset: 2px;
  }
  .wallet-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 26px 16px 28px;
    text-align: center;
  }
  .wallet-empty img {
    width: 136px;
    height: 136px;
    object-fit: contain;
    opacity: .88;
  }
  .wallet-empty p {
    margin: 10px 0 0;
    color: #111827;
    font-size: 14px;
    font-weight: 700;
  }
  .wallet-empty p + p {
    margin-top: 4px;
    color: #4b5563;
    font-size: 12px;
    font-weight: 400;
  }
  .wallet-footer {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 20;
    padding: 12px 16px 20px;
    border-top: 2px solid #111827;
    background: rgba(255, 255, 255, .98);
    box-shadow: 0 -6px 18px rgba(17, 24, 39, .12);
  }
  .wallet-footer-inner {
    width: 100%;
    max-width: 508px;
    margin: 0 auto;
  }
  .wallet-primary {
    display: flex;
    width: 100%;
    min-height: 62px;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 2px solid #111827;
    border-radius: 11px;
    background: #ff7a14;
    box-shadow: 0 4px 0 #111827, 0 7px 14px rgba(17, 24, 39, .18);
    color: #111827;
    font-size: 18px;
    font-weight: 800;
    cursor: pointer;
  }
  .wallet-primary:hover,
  .wallet-primary:focus-visible {
    background: #e96808;
    outline: 3px solid rgba(255, 122, 20, .28);
    outline-offset: 2px;
  }
  .wallet-primary:disabled {
    cursor: not-allowed;
    opacity: .55;
  }
  .wallet-form-page {
    background: #ffffff;
  }
  .wallet-form-topbar {
    border-bottom: 2px solid #111827;
    background: #ffffff;
  }
  .wallet-form-topbar .wallet-back {
    border-color: #111827;
    background: #ffffff;
    color: #111827;
  }
  .wallet-form-topbar .wallet-eyebrow {
    color: #171717;
  }
  .wallet-form-topbar .wallet-title {
    color: #171717;
  }
  .wallet-form-content {
    min-height: calc(100vh - 73px);
    padding-top: 24px;
    background: transparent;
  }
  .wallet-form-page .wallet-shell,
  .wallet-scene-page .wallet-shell {
    min-height: 100vh;
    background-color: #ffffff;
    background-image:
      linear-gradient(rgba(255, 255, 255, .22), rgba(255, 255, 255, .22)),
      url("${xe}");
    background-position: top center;
    background-repeat: no-repeat;
    background-size: 100% auto;
  }
  .wallet-scene-page .wallet-shell {
    background-position: center 190px;
  }
  .wallet-reference-card {
    overflow: hidden;
    border: 2px solid #111827;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 5px 0 #111827, 0 10px 18px rgba(17, 24, 39, .14);
  }
  .wallet-reference-card h2 {
    margin: 0;
    border-bottom: 2px solid #111827;
    padding: 18px 20px 16px;
    color: #111827;
    font-size: 20px;
    font-weight: 800;
  }
  .wallet-reference-row {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 14px;
    min-height: 68px;
    padding: 15px 20px;
    border: 0;
    background: #ffffff;
    color: #111827;
    text-align: left;
    cursor: pointer;
  }
  .wallet-reference-row:hover,
  .wallet-reference-row:focus-visible {
    background: #fff8f2;
    outline: none;
  }
  .wallet-reference-label {
    width: 84px;
    flex: none;
    color: #111827;
    font-size: 16px;
    font-weight: 700;
  }
  .wallet-reference-value {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    color: #111827;
    font-size: 16px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .wallet-reference-value.is-empty {
    color: #4b5563;
    font-weight: 500;
  }
  .wallet-reference-row svg {
    flex: none;
    color: #111827;
  }
  .wallet-reference-divider {
    height: 2px;
    margin: 0 20px;
    background: #111827;
  }
  .wallet-reference-address {
    min-height: 104px;
    padding: 18px 20px 22px;
    border-top: 0;
    background: #ffffff;
  }
  .wallet-reference-address label {
    display: block;
    margin-bottom: 8px;
    color: #111827;
    font-size: 16px;
    font-weight: 700;
  }
  .wallet-reference-address .wallet-input {
    border-bottom: 2px solid #111827;
    padding: 4px 0 9px;
    font-size: 16px;
    text-align: left;
  }
  .wallet-form-note {
    margin: 14px 2px 0;
    color: #4b5563;
    font-size: 12px;
    line-height: 1.45;
    text-align: center;
  }
  .wallet-form-page .wallet-footer {
    border-top: 0;
    background: transparent;
    box-shadow: none;
  }
  .wallet-scene-page .wallet-topbar {
    border-bottom: 2px solid #111827;
    background: #ffffff;
  }
  .wallet-scene-page .wallet-content {
    background: transparent;
  }
  .wallet-scene-add {
    position: relative;
    z-index: 1;
    padding: 28px 16px 22px;
    background: #ffffff;
  }
  .wallet-scene-add .wallet-primary {
    min-height: 62px;
    border-radius: 11px;
  }
  .wallet-scene-page .wallet-footer {
    border-top: 0;
    background: transparent;
    box-shadow: none;
  }
  .wallet-scene-page .wallet-primary {
    min-height: 62px;
    border-radius: 11px;
  }
  @media (min-width: 700px) {
    .wallet-footer {
      position: static;
      padding: 0 16px 24px;
      border-top: 0;
      background: #ffffff;
      box-shadow: none;
    }
  }
`;function qe(){const{user:r}=ae(),{toast:a}=le(),[,K]=re(),R=oe(),o=new URLSearchParams(R).get("from")==="withdrawal",[Q,p]=c.useState(!1),[U,f]=c.useState(!1),[H,x]=c.useState(!1),[u,h]=c.useState(""),[s,m]=c.useState(""),[y,w]=c.useState(""),[j,g]=c.useState(""),{data:n,isLoading:O}=A({queryKey:["/api/wallets"]}),{data:V,isError:L}=A({queryKey:["/api/countries"]}),k=pe(V,L),i=ne({resolver:ie(ge),defaultValues:{accountNumber:"",paymentMethod:""}});c.useEffect(()=>{r&&!s&&m(r.country)},[r,s]);const v=S({mutationFn:async t=>{const l=await C("POST","/api/wallets",{...t,accountName:r.fullName,country:s});if(!l.ok){const d=await l.json();throw new Error(d.message||"The wallet could not be added.")}return l.json()},onSuccess:()=>{N.invalidateQueries({queryKey:["/api/wallets"]}),a({title:"Wallet added!"}),i.reset(),h(""),m(r?.country||""),p(!1)},onError:t=>{a({title:"Unable to add wallet",description:t.message,variant:"destructive"})}}),M=S({mutationFn:async t=>{const l=await C("DELETE",`/api/wallets/${t}`,{});if(!l.ok){const d=await l.json();throw new Error(d.message||"The wallet could not be deleted.")}return l.json()},onSuccess:()=>{N.invalidateQueries({queryKey:["/api/wallets"]}),a({title:"Wallet deleted!"})},onError:t=>{a({title:"Unable to delete wallet",description:t.message,variant:"destructive"})}}),$=S({mutationFn:async t=>{const l=await C("PATCH",`/api/wallets/${t}/default`,{});if(!l.ok){const d=await l.json();throw new Error(d.message||"The default wallet could not be set.")}return l.json()},onSuccess:()=>{N.invalidateQueries({queryKey:["/api/wallets"]})},onError:t=>{a({title:"Unable to select wallet",description:t.message,variant:"destructive"})}}),X=t=>{o&&(localStorage.setItem("selectedWalletId",t.id.toString()),K("/withdrawal"))},G=t=>{h(t),i.setValue("paymentMethod",t),w(""),f(!1)},J=t=>{m(t),h(""),i.setValue("paymentMethod",""),g(""),x(!1)},Y=()=>{if(!s){a({title:"Country required",description:"Select a country.",variant:"destructive"});return}i.handleSubmit(t=>v.mutate(t))()};if(!r)return null;const Z=k.find(t=>t.code===s&&t.isActive)?.name||s||"Select a country",E=de(s,k),b=k.filter(t=>t.isActive).sort((t,l)=>t.name.localeCompare(l.name,"en-PH")),_=o?"/withdrawal":"/account",ee=o||n===void 0||n.length>0;return Q?e.jsxs("div",{className:"wallet-page wallet-form-page",children:[e.jsx("style",{children:B}),e.jsxs("div",{className:"wallet-shell",children:[e.jsxs("header",{className:"wallet-topbar wallet-form-topbar",children:[e.jsx("button",{onClick:()=>{p(!1),i.reset(),h(""),m(r.country)},className:"wallet-back","data-testid":"button-back-form","aria-label":"Back",children:e.jsx(W,{size:21})}),e.jsxs("div",{className:"wallet-heading",children:[e.jsx("span",{className:"wallet-eyebrow",children:"Withdrawal account"}),e.jsx("h1",{className:"wallet-title",children:"Add an account"})]}),e.jsx("div",{className:"w-10","aria-hidden":"true"})]}),e.jsxs("main",{className:"wallet-content wallet-form-content",children:[e.jsxs("section",{className:"wallet-reference-card",children:[e.jsx("h2",{children:"Account information"}),e.jsxs("button",{type:"button",onClick:()=>x(!0),className:"wallet-reference-row","data-testid":"button-select-country",children:[e.jsx("span",{className:"wallet-reference-label",children:"Type"}),e.jsx("span",{className:`wallet-reference-value${s?"":" is-empty"}`,children:Z}),e.jsx(P,{size:19})]}),e.jsx("div",{className:"wallet-reference-divider"}),e.jsxs("button",{type:"button",onClick:()=>f(!0),className:"wallet-reference-row","data-testid":"button-select-network",children:[e.jsx("span",{className:"wallet-reference-label",children:"Network"}),e.jsx("span",{className:`wallet-reference-value${u?"":" is-empty"}`,children:u||"Select an operator"}),e.jsx(P,{size:19})]}),e.jsx("div",{className:"wallet-reference-divider"}),e.jsxs("div",{className:"wallet-reference-address",children:[e.jsx("label",{htmlFor:"wallet-account-number",children:"Account number"}),e.jsx("input",{id:"wallet-account-number",...i.register("accountNumber"),type:"tel",placeholder:"Enter the number",className:"wallet-input","data-testid":"input-wallet-number"}),i.formState.errors.accountNumber&&e.jsx("p",{className:"wallet-error",children:i.formState.errors.accountNumber.message})]})]}),e.jsx("p",{className:"wallet-form-note",children:"This number will be used to receive your withdrawals."})]}),e.jsx("footer",{className:"wallet-footer",children:e.jsx("div",{className:"wallet-footer-inner",children:e.jsx("button",{onClick:Y,disabled:v.isPending,className:"wallet-primary","data-testid":"button-confirm-wallet",children:v.isPending?e.jsxs(e.Fragment,{children:[e.jsx(F,{size:17,className:"animate-spin"}),"Saving..."]}):"Confirm"})})}),H&&e.jsx("div",{className:"country-picker-overlay",onClick:()=>{g(""),x(!1)},children:e.jsxs("section",{className:"country-picker",role:"dialog","aria-modal":"true","aria-label":"Choose a country",onClick:t=>t.stopPropagation(),children:[e.jsxs("div",{className:"country-picker-header",children:[e.jsx("h2",{children:"Choose a country"}),e.jsx("button",{className:"country-picker-close",onClick:()=>{g(""),x(!1)},"aria-label":"Close",children:e.jsx(q,{"aria-hidden":"true"})})]}),e.jsxs("div",{className:"country-picker-search",children:[e.jsx(D,{"aria-hidden":"true"}),e.jsx("input",{autoFocus:!0,value:j,onChange:t=>g(t.target.value),placeholder:"Search countries","aria-label":"Search countries"})]}),e.jsxs("div",{className:"country-picker-list",children:[L&&e.jsx("p",{className:"country-picker-empty",role:"status",children:"Showing a temporary local list."}),b.filter(t=>t.name.toLowerCase().includes(j.trim().toLowerCase())).map(t=>e.jsxs("button",{onClick:()=>J(t.code),className:`country-picker-row${s===t.code?" is-selected":""}`,"data-testid":`button-country-${t.code}`,children:[e.jsx("span",{className:"country-picker-name",children:t.name}),e.jsx("span",{className:"country-picker-prefix",children:t.code}),s===t.code&&e.jsx("span",{className:"country-picker-check",children:e.jsx(z,{"aria-hidden":"true"})})]},t.code)),b.length===0&&e.jsx("p",{className:"country-picker-empty",children:"Loading countries..."}),b.length>0&&b.filter(t=>t.name.toLowerCase().includes(j.trim().toLowerCase())).length===0&&e.jsx("p",{className:"country-picker-empty",children:"No countries found"})]})]})}),U&&e.jsx("div",{className:"country-picker-overlay",onClick:()=>{w(""),f(!1)},children:e.jsxs("section",{className:"country-picker",role:"dialog","aria-modal":"true","aria-label":"Choose a payment operator",onClick:t=>t.stopPropagation(),children:[e.jsxs("div",{className:"country-picker-header",children:[e.jsx("h2",{children:"Choose an operator"}),e.jsx("button",{className:"country-picker-close",onClick:()=>{w(""),f(!1)},"aria-label":"Close",children:e.jsx(q,{"aria-hidden":"true"})})]}),e.jsxs("div",{className:"country-picker-search",children:[e.jsx(D,{"aria-hidden":"true"}),e.jsx("input",{autoFocus:!0,value:y,onChange:t=>w(t.target.value),placeholder:"Rechercher","aria-label":"Search operators"})]}),e.jsxs("div",{className:"country-picker-list",children:[E.filter(t=>t.toLowerCase().includes(y.trim().toLowerCase())).map(t=>e.jsxs("button",{onClick:()=>G(t),className:`country-picker-row${u===t?" is-selected":""}`,"data-testid":`button-bank-${t}`,children:[e.jsx("span",{children:t}),u===t&&e.jsx("span",{className:"country-picker-check",children:e.jsx(z,{"aria-hidden":"true"})})]},t)),E.filter(t=>t.toLowerCase().includes(y.trim().toLowerCase())).length===0&&e.jsx("p",{className:"country-picker-empty",children:"No operators found"})]})]})})]})]}):e.jsxs("div",{className:"wallet-page wallet-scene-page",children:[e.jsx("style",{children:B}),e.jsxs("div",{className:"wallet-shell",children:[e.jsxs("header",{className:"wallet-topbar",children:[e.jsx(se,{href:_,children:e.jsx("button",{className:"wallet-back","data-testid":"button-back","aria-label":"Back",children:e.jsx(W,{size:19})})}),e.jsxs("div",{className:"wallet-heading",children:[e.jsx("span",{className:"wallet-eyebrow",children:o?"Withdrawal":"Account security"}),e.jsx("h1",{className:"wallet-title",children:o?"Select an account":"My payment accounts"})]}),o?e.jsx("div",{className:"w-10","aria-hidden":"true"}):e.jsx("button",{onClick:()=>p(!0),className:"wallet-top-action","data-testid":"button-add-wallet-icon","aria-label":"Add a payment account",children:e.jsx(I,{size:19})})]}),e.jsx("div",{className:"wallet-scene-add",children:e.jsxs("button",{onClick:()=>p(!0),className:"wallet-primary","data-testid":"button-add-wallet",children:[e.jsx(I,{size:18}),"Add an account"]})}),e.jsx("main",{className:"wallet-content",children:ee&&e.jsx(e.Fragment,{children:e.jsxs("section",{className:"wallet-section wallet-list-section",children:[e.jsxs("div",{className:"wallet-section-header",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"wallet-section-title",children:"Saved accounts"}),e.jsx("p",{className:"wallet-section-caption",children:n?.length?`${n.length} account${n.length>1?"s":""} available`:"No accounts added"})]}),e.jsx("span",{className:"wallet-step",children:e.jsx(we,{size:13})})]}),O?e.jsx("div",{className:"flex justify-center py-12",children:e.jsx(F,{className:"w-6 h-6 animate-spin text-[#FF7A14]"})}):n&&n.length>0?e.jsx("div",{className:"wallet-list",children:n.map(t=>e.jsxs("div",{className:"wallet-card-wrap",children:[e.jsxs("article",{onClick:()=>o&&X(t),className:`wallet-card${o?" is-selectable":""}${t.isDefault?" is-default":""}`,"data-testid":`wallet-card-${t.id}`,children:[e.jsxs("div",{className:"wallet-card-copy",children:[e.jsxs("div",{className:"wallet-card-brand",children:[e.jsx("img",{className:"wallet-card-icon",src:ue,alt:"","aria-hidden":"true"}),e.jsx("p",{className:"wallet-card-method",children:t.paymentMethod})]}),e.jsx("p",{className:"wallet-card-number",children:be(t.accountNumber)}),e.jsx("div",{className:"wallet-card-bottomline",children:e.jsxs("span",{className:"wallet-card-network",children:[e.jsx("img",{className:"wallet-card-network-icon",src:ye(t.paymentMethod),alt:"","aria-hidden":"true"}),e.jsxs("span",{children:[t.country||"Withdrawal account"," · ",t.paymentMethod]})]})})]}),o&&e.jsx(me,{size:18,className:"text-white flex-shrink-0"})]}),!o&&e.jsxs("div",{className:"wallet-card-actions",children:[!t.isDefault&&e.jsxs("button",{onClick:()=>$.mutate(t.id),disabled:$.isPending,className:"wallet-icon-action","data-testid":`button-set-default-${t.id}`,"aria-label":"Set as default account",children:[e.jsx(z,{size:16}),"Set as default"]}),e.jsxs("button",{onClick:()=>M.mutate(t.id),disabled:M.isPending,className:"wallet-icon-action","data-testid":`button-delete-wallet-${t.id}`,"aria-label":"Delete this account",children:[e.jsx(he,{size:16}),"Delete"]})]})]},t.id))}):e.jsxs("div",{className:"wallet-empty",children:[e.jsx("img",{src:fe,alt:""}),e.jsx("p",{children:"No payment accounts saved"}),e.jsx("p",{children:"Add an account to make withdrawals."})]})]})})})]})]})}export{qe as default};
