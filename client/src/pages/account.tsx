import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCountryByCode, type ApiCountry } from "@/lib/countries";
import {
  Loader2,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ADMIN_PATH } from "@/lib/admin-path";
import accountBackground from "@assets/images_(72)_1787363798761.jpeg";
import tonLogo from "@assets/images_(25)_1787363798796.png";
import withdrawalIcon from "@assets/mine-mod-bankcard-CLOhqwHj_1787388454905.png";
import historyIcon from "@assets/4-1_1787388071574.png";
import taskIcon from "@assets/téléchargement_(66)_1787388422746.png";
import walletIcon from "@/assets/account-wallet.png";
import aboutIcon from "@/assets/account-about.png";
import serviceIcon from "@/assets/account-service.png";
import passwordIcon from "@/assets/account-password.png";
import rulesIcon from "@/assets/account-rules.png";
import logoutIcon from "@assets/logout_1787368185297.png";
import checkinIcon from "@/assets/home-actions/checkin.png";
import downloadIcon from "@assets/mine-mod-download-B1teb57W_1784762231070.png";
import chargepointLogo from "@assets/chargepoint_1790147948102.jpg";
import chargepointPromo from "@/assets/auth-chargepoint-combined.png";
import giftIcon from "@/assets/account-gift.png";
import "./account.css";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global {
  interface Window {
    _installPrompt?: InstallPromptEvent | null;
    _appInstalled?: boolean;
  }
}

const tonGreen = "#00CC2C";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showPinModal, setShowPinModal] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const { data: apiCountries } = useQuery<ApiCountry[]>({
    queryKey: ["/api/countries"],
  });
  const { data: purchasedProducts } = useQuery<Array<{
    product?: { name?: string } | null;
  }>>({
    queryKey: ["/api/user/products"],
    enabled: !!user,
  });
  const accountLevel = (purchasedProducts || []).reduce((highestLevel, entry) => {
    const vipNumber = /^VIP\s*(\d+)$/i.exec(entry.product?.name || "");
    return Math.max(highestLevel, vipNumber ? Number(vipNumber[1]) : 0);
  }, 0);

  const verifyPinMutation = useMutation({
    mutationFn: async (pin: string) => {
      const res = await apiRequest("POST", "/api/admin/verify-pin", { pin });
      if (!res.ok) {
        const data = await res.json();
          throw new Error(data.message || "The administrator PIN is incorrect.");
      }
      return res.json();
    },
    onSuccess: () => {
      setShowPinModal(false);
      setAdminPin("");
      navigate(ADMIN_PATH);
    },
    onError: (error: Error) =>
      toast({
         title: "Unable to verify PIN",
        description: error.message,
        variant: "destructive",
      }),
  });

  if (!user) return null;

  const country = getCountryByCode(user.country, apiCountries);
  const currency = "PHP";
  const balance = Number.parseFloat(user.balance || "0");
  const earnings = Number.parseFloat(user.totalEarnings || "0");
  const phonePrefix = country?.phonePrefix || "";
  const formatAmount = (amount: number) => `${Math.round(amount).toLocaleString("en-PH")} ${currency}`;

  const quickActions = [
    { label: "Withdraw", image: withdrawalIcon, href: "/withdrawal" },
    { label: "History", image: historyIcon, href: "/history" },
    { label: "Check-in", image: checkinIcon, href: "/checkin" },
  ];

  const serviceItems = [
    { label: "About", image: aboutIcon, href: "/about" },
    { label: "Rules", image: rulesIcon, href: "/rules" },
    { label: "History", image: historyIcon, href: "/history" },
    { label: "Customer service", image: serviceIcon, href: "/service" },
    { label: "Download", image: downloadIcon, action: "download" as const },
    { label: "Link a\nwallet", image: walletIcon, href: "/wallet" },
    { label: "Change\npassword", image: passwordIcon, href: "/change-password" },
    { label: "Redeem a\ngift", image: giftIcon, href: "/gift-code", className: "cp-gift-icon" },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleAdminClick = () => {
    if (user.isAdminPasswordRequired === false) {
      navigate(ADMIN_PATH);
      return;
    }
    setShowPinModal(true);
  };

  const handleDownload = async () => {
    const isInstalled =
      window._appInstalled ||
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

    if (isInstalled) {
      toast({
          title: "ChargePoint is already installed",
          description: "You can open the app from your device home screen.",
      });
      return;
    }

    const installPrompt = window._installPrompt;
    if (installPrompt) {
      window._installPrompt = null;
      try {
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        toast(
          outcome === "accepted"
            ? {
                 title: "Installation started",
                 description: "ChargePoint is being installed on your device.",
              }
            : {
                 title: "Installation cancelled",
                 description: "You can restart the installation from this button.",
              },
        );
      } catch {
        toast({
           title: "Installation unavailable",
           description: "Open your browser menu and choose “Install app”.",
          variant: "destructive",
        });
      }
      return;
    }

    const isIos =
      /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    toast({
       title: "Install ChargePoint",
      description: isIos
         ? "In Safari, tap Share, then “Add to Home Screen”."
         : "In your browser menu, choose “Install app” or “Add to Home Screen”.",
    });
  };

  return (
    <main className="cp-account">
      <style>{`
        .account-reference {
          color: #141414;
          font-family: Inter, Arial, sans-serif;
        }
        .account-reference .account-screen {
          width: 100%;
          max-width: 500px;
          min-height: 100%;
          margin: 0 auto;
          overflow: hidden;
          background: #fff;
        }
        .account-reference .account-header {
          padding: 30px 16px 0;
          background: #e9f9ec;
        }
        .account-reference .profile-row {
          display: flex;
          align-items: center;
          gap: 18px;
          min-height: 105px;
        }
        .account-reference .avatar {
          flex: 0 0 auto;
          width: 88px;
          height: 88px;
          overflow: hidden;
          border: 3px solid ${tonGreen};
          border-radius: 50%;
          background-image: url("${tonLogo}");
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;
          background-color: white;
          box-shadow: 0 2px 8px rgba(0, 128, 30, .18);
        }
        .account-reference .profile-copy {
          min-width: 0;
        }
        .account-reference .phone {
          margin: 0 0 12px;
          color: #202020;
          font-size: 24px;
          font-weight: 600;
          line-height: 1.1;
        }
        .account-reference .level {
          margin: 0;
          color: #555;
          font-size: 16px;
          font-weight: 500;
        }
        .account-reference .level strong {
          margin-left: 10px;
          color: ${tonGreen};
        }
        .account-reference .account-summaries {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin: 18px 0 0;
        }
        .account-reference .summary {
          position: relative;
          display: flex;
          align-items: center;
           min-width: 0;
          height: 78px;
          overflow: hidden;
          border-radius: 14px;
          padding: 0 24px;
          background: linear-gradient(110deg, #00cc2c 0%, #008f24 100%);
        }
        .account-reference .summary-amount {
           min-width: 0;
           overflow: hidden;
          margin: 0;
          color: #fff;
          font-size: 20px;
          font-weight: 800;
          white-space: nowrap;
           text-overflow: ellipsis;
          line-height: 1;
        }
        .account-reference .summary-label {
           flex: 0 0 auto;
          margin: 0 0 0 10px;
          color: #fff;
          font-size: 17px;
          font-weight: 600;
          white-space: nowrap;
          line-height: 1;
        }
        .account-reference .summary-symbol {
          display: none;
        }
        .account-reference .promo-banner {
          position: relative;
          height: 198px;
          margin: 14px 16px 0;
          overflow: hidden;
          border-radius: 14px;
          background: #006b1c;
        }
        .account-reference .promo-banner img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          opacity: .72;
        }
        .account-reference .promo-copy {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 16px;
          color: #fff;
          text-align: center;
          text-shadow: 0 1px 2px rgba(0,0,0,.3);
        }
        .account-reference .promo-copy strong {
          font-size: 26px;
          font-weight: 500;
        }
        .account-reference .promo-copy span {
          max-width: 310px;
          margin-top: 10px;
          font-size: 15px;
        }
        .account-reference .promo-copy button {
          margin-top: 14px;
          padding: 10px 28px;
          border-radius: 10px;
          color: #fff;
          background: ${tonGreen};
          font-size: 15px;
          font-weight: 700;
        }
        .account-reference .account-actions {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          padding: 20px 8px 17px;
          background: white;
          border-bottom: 1px solid #f1f1f1;
        }
        .account-reference .account-action {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 9px;
          color: #202020;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.15;
          text-align: center;
        }
        .account-reference .account-action img {
          width: 34px;
          height: 34px;
          object-fit: contain;
          filter: brightness(0) saturate(100%) invert(44%) sepia(96%) saturate(1750%) hue-rotate(94deg) brightness(91%) contrast(105%);
        }
        .account-reference .services-title {
          margin: 0;
          padding: 14px 16px 10px;
          border-bottom: 1px solid #222;
          font-size: 18px;
          font-weight: 500;
          text-transform: uppercase;
        }
        .account-reference .settings-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px 8px;
          padding: 14px 8px 20px;
          background: #fff;
        }
        .account-reference .setting-button {
          display: flex;
          min-height: 68px;
          min-width: 0;
          align-items: center;
          justify-content: flex-start;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 10px;
          background: #fff;
          box-shadow: 0 1px 5px rgba(0,0,0,.08);
          color: #282a2f;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.3;
          text-align: left;
          white-space: pre-line;
        }
        .account-reference .setting-button img {
          flex: 0 0 auto;
          width: 34px;
          height: 34px;
          object-fit: contain;
          filter: saturate(.9);
        }
        .account-reference .account-hidden-actions {
          margin: 24px 16px 18px;
        }
        .account-reference .logout {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 14px;
          border: 1.5px solid ${tonGreen};
          padding: 13px;
          color: #009d22;
          background: white;
          font-size: 14px;
          font-weight: 700;
        }
        .account-reference .logout img {
          width: 22px;
          height: 22px;
          object-fit: contain;
        }
        .account-reference .admin {
          width: 100%;
          margin-top: 12px;
          border-radius: 14px;
          padding: 13px;
          color: white;
          background: ${tonGreen};
          font-size: 14px;
          font-weight: 700;
        }
         @media (max-width: 420px) {
           .account-reference .account-summaries { gap: 8px; }
           .account-reference .summary {
             flex-direction: column;
             justify-content: center;
             gap: 7px;
             padding: 8px 10px;
             text-align: center;
           }
           .account-reference .summary-amount {
             width: 100%;
             font-size: clamp(13px, 5.2vw, 20px);
           }
           .account-reference .summary-label {
             max-width: 100%;
             margin-left: 0;
             font-size: clamp(13px, 4.4vw, 17px);
           }
         }
        @media (max-width: 360px) {
          .account-reference .account-header { padding-right: 10px; padding-left: 10px; }
          .account-reference .profile-row { gap: 12px; }
          .account-reference .avatar { width: 76px; height: 76px; }
          .account-reference .phone { font-size: 20px; }
          .account-reference .level { font-size: 14px; }
          .account-reference .summary { padding-right: 12px; padding-left: 12px; }
          .account-reference .summary-amount { font-size: 17px; }
          .account-reference .summary-label { margin-left: 7px; font-size: 15px; }
          .account-reference .promo-banner { margin-right: 10px; margin-left: 10px; }
          .account-reference .setting-button { padding-right: 8px; padding-left: 8px; font-size: 12px; }
        }
      `}</style>

      <div className="cp-account-shell">
        <section className="cp-account-header" aria-label="Informations du compte">
          <div className="cp-profile-row">
            <div className="cp-profile-avatar">
              <img src={chargepointLogo} alt="ChargePoint" />
            </div>
            <div className="cp-profile-copy">
              <p className="cp-account-phone">+{phonePrefix} {user.phone}</p>
              <span className="cp-account-level">LV{accountLevel}</span>
            </div>
            <button className="cp-logout-top" onClick={handleLogout} data-testid="button-logout">
              <img src={logoutIcon} alt="" />
               <span>Sign out</span>
            </button>
          </div>

             <section className="cp-balance-card" aria-label="Account balance">
            <div>
               <span>Account balance</span>
               <strong>{formatAmount(balance)}</strong>
            </div>
             <button type="button" onClick={() => navigate("/deposit")}>Deposit <span aria-hidden="true">›</span></button>
          </section>
        </section>

        <section className="cp-account-quick-actions" aria-label="Actions rapides">
          {quickActions.map((action) => (
            <button key={action.label} type="button" onClick={() => navigate(action.href)}>
              <img src={action.image} alt="" />
              <span>{action.label}</span>
            </button>
          ))}
        </section>

        <section className="cp-account-promo" aria-label="Solutions ChargePoint">
          <img src={chargepointPromo} alt="" />
          <div>
             <strong>ChargePoint charging solutions</strong>
             <span>Equipment designed for your mobility</span>
             <button type="button" onClick={() => navigate("/my-products")}>View my purchased products</button>
          </div>
        </section>

        <section className="cp-account-services" aria-labelledby="account-services-title">
          <h2 id="account-services-title">Plus</h2>
          <div className="cp-services-grid">
            {serviceItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.action === "download") {
                    void handleDownload();
                    return;
                  }
                  navigate(item.href);
                }}
              >
                <img className={item.className} src={item.image} alt="" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          {user.isAdmin && (
            <button className="cp-admin-button" onClick={handleAdminClick} data-testid="button-admin">
              <Shield size={17} />
               Admin panel
            </button>
          )}
        </section>
      </div>

      <Dialog open={showPinModal} onOpenChange={setShowPinModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
           <DialogTitle className="text-center">Administrator access code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
               Enter your PIN to access the admin panel
            </p>
            <Input
              type="password"
              value={adminPin}
              onChange={(event) => setAdminPin(event.target.value)}
              placeholder="PIN code"
              className="text-center text-2xl tracking-widest"
              maxLength={8}
              data-testid="input-admin-pin"
            />
            <Button
              onClick={() => {
                if (adminPin.length < 4) {
                   toast({ title: "The PIN must contain at least 4 characters", variant: "destructive" });
                  return;
                }
                verifyPinMutation.mutate(adminPin);
              }}
              disabled={verifyPinMutation.isPending || adminPin.length < 4}
              className="w-full bg-[#249daf] hover:bg-[#1c8796]"
              data-testid="button-verify-pin"
            >
              {verifyPinMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}