import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getCountriesForDisplay, getWithdrawalMethodsForCountry, type ApiCountry } from "@/lib/countries";
import { Loader2, Plus, Trash2, CreditCard, ChevronLeft, ChevronRight, ChevronDown, Shield, Check, Search, X } from "lucide-react";
import emptyIllustration from "@assets/illustration-8_1784762965573.png";
import chargepointPromo from "@/assets/auth-chargepoint-combined.png";
import walletCardIcon from "@/assets/account-wallet.png";
import { Link, useLocation, useSearch } from "wouter";
import type { WithdrawalWallet } from "@shared/schema";

const walletSchema = z.object({
  accountNumber: z.string().min(8, "Account number is required"),
  paymentMethod: z.string().min(2, "Payment method is required"),
});

type WalletForm = z.infer<typeof walletSchema>;

function maskWalletNumber(accountNumber: string) {
  const compactNumber = accountNumber.replace(/\s+/g, "");
  if (compactNumber.length <= 6) return accountNumber;
  return `${compactNumber.slice(0, 2)}••••••${compactNumber.slice(-4)}`;
}

function getWalletOperatorIcon(paymentMethod: string) {
  const method = paymentMethod.toLowerCase();
  if (method.includes("orange")) return "/operators/orange.png";
  if (method.includes("mtn")) return "/operators/mtn.png";
  if (method.includes("moov")) return "/operators/moov.jpg";
  if (method.includes("airtel")) return "/operators/airtel.png";
  if (method.includes("wave")) return "/operators/wave.png";
  if (method.includes("tmoney") || method.includes("t-money")) return "/operators/tmoney.png";
  return "/chargepoint-icon-512.png";
}

const walletStyles = `
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
      url("${chargepointPromo}");
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
`;

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const selectMode = params.get("from") === "withdrawal";
  const [showForm, setShowForm] = useState(false);
  const [showBankSheet, setShowBankSheet] = useState(false);
  const [showCountrySheet, setShowCountrySheet] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [bankSearch, setBankSearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");

  const { data: wallets, isLoading } = useQuery<WithdrawalWallet[]>({
    queryKey: ["/api/wallets"],
  });

  const { data: loadedCountries, isError: countriesError } = useQuery<ApiCountry[]>({
    queryKey: ["/api/countries"],
  });
  const apiCountries = getCountriesForDisplay(loadedCountries, countriesError);

  const form = useForm<WalletForm>({
    resolver: zodResolver(walletSchema),
    defaultValues: { accountNumber: "", paymentMethod: "" },
  });

  useEffect(() => {
    if (user && !selectedCountry) {
      setSelectedCountry(user.country);
    }
  }, [user, selectedCountry]);

  const addMutation = useMutation({
    mutationFn: async (data: WalletForm) => {
      const response = await apiRequest("POST", "/api/wallets", {
        ...data,
        accountName: user!.fullName,
        country: selectedCountry,
      });
      if (!response.ok) {
        const result = await response.json();
         throw new Error(result.message || "The wallet could not be added.");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
       toast({ title: "Wallet added!" });
      form.reset();
      setSelectedMethod("");
      setSelectedCountry(user?.country || "");
      setShowForm(false);
    },
    onError: (error: any) => {
       toast({ title: "Unable to add wallet", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (walletId: number) => {
      const response = await apiRequest("DELETE", `/api/wallets/${walletId}`, {});
      if (!response.ok) {
        const result = await response.json();
         throw new Error(result.message || "The wallet could not be deleted.");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
       toast({ title: "Wallet deleted!" });
    },
    onError: (error: any) => {
       toast({ title: "Unable to delete wallet", description: error.message, variant: "destructive" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (walletId: number) => {
      const response = await apiRequest("PATCH", `/api/wallets/${walletId}/default`, {});
      if (!response.ok) {
        const result = await response.json();
         throw new Error(result.message || "The default wallet could not be set.");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
    },
    onError: (error: any) => {
       toast({ title: "Unable to select wallet", description: error.message, variant: "destructive" });
    },
  });

  const handleSelectWallet = (wallet: WithdrawalWallet) => {
    if (selectMode) {
      localStorage.setItem("selectedWalletId", wallet.id.toString());
      navigate("/withdrawal");
    }
  };

  const handleChooseMethod = (method: string) => {
    setSelectedMethod(method);
    form.setValue("paymentMethod", method);
    setBankSearch("");
    setShowBankSheet(false);
  };

  const handleChooseCountry = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setSelectedMethod("");
    form.setValue("paymentMethod", "");
    setCountrySearch("");
    setShowCountrySheet(false);
  };

  const handleSubmit = () => {
    if (!selectedCountry) {
       toast({ title: "Country required", description: "Select a country.", variant: "destructive" });
      return;
    }
    form.handleSubmit((data) => addMutation.mutate(data))();
  };

  if (!user) return null;

  const selectedCountryData = apiCountries.find(
    (country) => country.code === selectedCountry && country.isActive,
  );
   const selectedCountryLabel = selectedCountryData?.name || selectedCountry || "Select a country";
  const paymentMethods = getWithdrawalMethodsForCountry(selectedCountry, apiCountries);
  const activeCountries = apiCountries
    .filter((country) => country.isActive)
    .sort((first, second) => first.name.localeCompare(second.name, "en-PH"));
  const backLink = selectMode ? "/withdrawal" : "/account";
  const showWalletOverview = selectMode || wallets === undefined || wallets.length > 0;

  if (showForm) {
    return (
      <div className="wallet-page wallet-form-page">
        <style>{walletStyles}</style>
        <div className="wallet-shell">
          <header className="wallet-topbar wallet-form-topbar">
            <button
              onClick={() => { setShowForm(false); form.reset(); setSelectedMethod(""); setSelectedCountry(user.country); }}
              className="wallet-back"
              data-testid="button-back-form"
               aria-label="Back"
            >
              <ChevronLeft size={21} />
            </button>
            <div className="wallet-heading">
               <span className="wallet-eyebrow">Withdrawal account</span>
               <h1 className="wallet-title">Add an account</h1>
            </div>
            <div className="w-10" aria-hidden="true" />
          </header>

          <main className="wallet-content wallet-form-content">
            <section className="wallet-reference-card">
               <h2>Account information</h2>

              <button
                type="button"
                onClick={() => setShowCountrySheet(true)}
                className="wallet-reference-row"
                data-testid="button-select-country"
              >
                <span className="wallet-reference-label">Type</span>
                <span className={`wallet-reference-value${selectedCountry ? "" : " is-empty"}`}>
                  {selectedCountryLabel}
                </span>
                <ChevronDown size={19} />
              </button>

              <div className="wallet-reference-divider" />

              <button
                type="button"
                onClick={() => setShowBankSheet(true)}
                className="wallet-reference-row"
                data-testid="button-select-network"
              >
                <span className="wallet-reference-label">Network</span>
                <span className={`wallet-reference-value${selectedMethod ? "" : " is-empty"}`}>
                   {selectedMethod || "Select an operator"}
                </span>
                <ChevronDown size={19} />
              </button>

              <div className="wallet-reference-divider" />

              <div className="wallet-reference-address">
                 <label htmlFor="wallet-account-number">Account number</label>
                <input
                  id="wallet-account-number"
                  {...form.register("accountNumber")}
                  type="tel"
                   placeholder="Enter the number"
                  className="wallet-input"
                  data-testid="input-wallet-number"
                />
                {form.formState.errors.accountNumber && (
                  <p className="wallet-error">{form.formState.errors.accountNumber.message}</p>
                )}
              </div>
            </section>

            <p className="wallet-form-note">
               This number will be used to receive your withdrawals.
            </p>
          </main>

        <footer className="wallet-footer">
          <div className="wallet-footer-inner">
            <button
              onClick={handleSubmit}
              disabled={addMutation.isPending}
              className="wallet-primary"
              data-testid="button-confirm-wallet"
            >
              {addMutation.isPending ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                   Saving...
                </>
              ) : (
                 "Confirm"
              )}
            </button>
          </div>
        </footer>

        {showCountrySheet && (
          <div className="country-picker-overlay" onClick={() => { setCountrySearch(""); setShowCountrySheet(false); }}>
            <section
              className="country-picker"
              role="dialog"
              aria-modal="true"
               aria-label="Choose a country"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="country-picker-header">
                 <h2>Choose a country</h2>
                <button
                  className="country-picker-close"
                  onClick={() => { setCountrySearch(""); setShowCountrySheet(false); }}
                   aria-label="Close"
                >
                  <X aria-hidden="true" />
                </button>
              </div>
              <div className="country-picker-search">
                <Search aria-hidden="true" />
                <input
                  autoFocus
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                   placeholder="Search countries"
                   aria-label="Search countries"
                />
              </div>
              <div className="country-picker-list">
                {countriesError && (
                   <p className="country-picker-empty" role="status">Showing a temporary local list.</p>
                )}
                {activeCountries
                  .filter((country) => country.name.toLowerCase().includes(countrySearch.trim().toLowerCase()))
                  .map((country) => (
                    <button
                      key={country.code}
                      onClick={() => handleChooseCountry(country.code)}
                      className={`country-picker-row${selectedCountry === country.code ? " is-selected" : ""}`}
                      data-testid={`button-country-${country.code}`}
                    >
                      <span className="country-picker-name">{country.name}</span>
                      <span className="country-picker-prefix">{country.code}</span>
                      {selectedCountry === country.code && (
                        <span className="country-picker-check"><Check aria-hidden="true" /></span>
                      )}
                    </button>
                  ))}
                {activeCountries.length === 0 && (
                   <p className="country-picker-empty">Loading countries...</p>
                )}
                {activeCountries.length > 0 && activeCountries.filter(
                  (country) => country.name.toLowerCase().includes(countrySearch.trim().toLowerCase()),
                ).length === 0 && (
                   <p className="country-picker-empty">No countries found</p>
                )}
              </div>
            </section>
          </div>
        )}

        {showBankSheet && (
          <div className="country-picker-overlay" onClick={() => { setBankSearch(""); setShowBankSheet(false); }}>
            <section
              className="country-picker"
              role="dialog"
              aria-modal="true"
                aria-label="Choose a payment operator"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="country-picker-header">
                <h2>Choose an operator</h2>
                <button
                  className="country-picker-close"
                  onClick={() => { setBankSearch(""); setShowBankSheet(false); }}
                    aria-label="Close"
                >
                  <X aria-hidden="true" />
                </button>
              </div>
              <div className="country-picker-search">
                <Search aria-hidden="true" />
                <input
                  autoFocus
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  placeholder="Rechercher"
                  aria-label="Search operators"
                />
              </div>
              <div className="country-picker-list">
                {paymentMethods
                  .filter((method) => method.toLowerCase().includes(bankSearch.trim().toLowerCase()))
                  .map((method) => (
                  <button
                    key={method}
                    onClick={() => handleChooseMethod(method)}
                    className={`country-picker-row${selectedMethod === method ? " is-selected" : ""}`}
                    data-testid={`button-bank-${method}`}
                  >
                    <span>{method}</span>
                    {selectedMethod === method && (
                      <span className="country-picker-check"><Check aria-hidden="true" /></span>
                    )}
                  </button>
                ))}
                {paymentMethods.filter((method) => method.toLowerCase().includes(bankSearch.trim().toLowerCase())).length === 0 && (
                  <p className="country-picker-empty">No operators found</p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
      </div>
    );
  }

  return (
    <div className="wallet-page wallet-scene-page">
      <style>{walletStyles}</style>
      <div className="wallet-shell">
        <header className="wallet-topbar">
          <Link href={backLink}>
            <button className="wallet-back" data-testid="button-back" aria-label="Back">
              <ChevronLeft size={19} />
            </button>
          </Link>
          <div className="wallet-heading">
            <span className="wallet-eyebrow">{selectMode ? "Withdrawal" : "Account security"}</span>
            <h1 className="wallet-title">
              {selectMode ? "Select an account" : "My payment accounts"}
            </h1>
          </div>
          {!selectMode ? (
            <button
              onClick={() => setShowForm(true)}
              className="wallet-top-action"
              data-testid="button-add-wallet-icon"
              aria-label="Add a payment account"
            >
              <Plus size={19} />
            </button>
          ) : (
            <div className="w-10" aria-hidden="true" />
          )}
        </header>

        <div className="wallet-scene-add">
          <button
            onClick={() => setShowForm(true)}
            className="wallet-primary"
            data-testid="button-add-wallet"
          >
            <Plus size={18} />
            Add an account
          </button>
        </div>

        <main className="wallet-content">
          {showWalletOverview && (
            <>
              <section className="wallet-section wallet-list-section">
                <div className="wallet-section-header">
                  <div>
                    <h2 className="wallet-section-title">Saved accounts</h2>
                    <p className="wallet-section-caption">
                      {wallets?.length ? `${wallets.length} account${wallets.length > 1 ? "s" : ""} available` : "No accounts added"}
                    </p>
                  </div>
                  <span className="wallet-step"><CreditCard size={13} /></span>
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-[#FF7A14]" />
                  </div>
                ) : wallets && wallets.length > 0 ? (
                  <div className="wallet-list">
                    {wallets.map((wallet) => (
                      <div key={wallet.id} className="wallet-card-wrap">
                        <article
                          onClick={() => selectMode && handleSelectWallet(wallet)}
                          className={`wallet-card${selectMode ? " is-selectable" : ""}${wallet.isDefault ? " is-default" : ""}`}
                          data-testid={`wallet-card-${wallet.id}`}
                        >
                          <div className="wallet-card-copy">
                            <div className="wallet-card-brand">
                              <img className="wallet-card-icon" src={walletCardIcon} alt="" aria-hidden="true" />
                              <p className="wallet-card-method">{wallet.paymentMethod}</p>
                            </div>
                            <p className="wallet-card-number">{maskWalletNumber(wallet.accountNumber)}</p>
                            <div className="wallet-card-bottomline">
                              <span className="wallet-card-network">
                                <img
                                  className="wallet-card-network-icon"
                                  src={getWalletOperatorIcon(wallet.paymentMethod)}
                                  alt=""
                                  aria-hidden="true"
                                />
                                <span>{wallet.country || "Withdrawal account"} · {wallet.paymentMethod}</span>
                              </span>
                            </div>
                          </div>

                          {selectMode && <ChevronRight size={18} className="text-white flex-shrink-0" />}
                        </article>

                        {!selectMode && (
                          <div className="wallet-card-actions">
                            {!wallet.isDefault && (
                              <button
                                onClick={() => setDefaultMutation.mutate(wallet.id)}
                                disabled={setDefaultMutation.isPending}
                                className="wallet-icon-action"
                                data-testid={`button-set-default-${wallet.id}`}
                                aria-label="Set as default account"
                              >
                                <Check size={16} />
                                Set as default
                              </button>
                            )}
                            <button
                              onClick={() => deleteMutation.mutate(wallet.id)}
                              disabled={deleteMutation.isPending}
                              className="wallet-icon-action"
                              data-testid={`button-delete-wallet-${wallet.id}`}
                              aria-label="Delete this account"
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="wallet-empty">
                    <img src={emptyIllustration} alt="" />
                    <p>No payment accounts saved</p>
                    <p>Add an account to make withdrawals.</p>
                  </div>
                )}
              </section>
            </>
          )}
        </main>

      </div>
    </div>
  );
}
