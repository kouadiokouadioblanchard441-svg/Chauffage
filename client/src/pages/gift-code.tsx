import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import chargepointPromo from "@/assets/auth-chargepoint-combined.png";
import telegramIcon from "@assets/tg-1_1787390593655.png";

export default function GiftCodePage() {
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const claimMutation = useMutation({
    mutationFn: async (giftCode: string) => {
      const response = await apiRequest("POST", "/api/gift-codes/claim", { code: giftCode });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "The gift code could not be validated.");
      }
      return response.json();
    },
    onSuccess: (data) => {
      refreshUser();
      setCode("");
       toast({ title: "Congratulations!", description: data.message });
    },
    onError: (error: any) => {
       toast({ title: "Unable to validate gift code", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!code.trim()) {
       toast({ title: "Gift code required", description: "Please enter a gift code.", variant: "destructive" });
      return;
    }
    claimMutation.mutate(code.trim());
  };

  return (
    <main className="gift-reference">
      <style>{`
        .gift-reference { width: 100%; min-height: 100dvh; overflow-x: hidden; background: #ffffff; color: #111827; font-family: Arial, sans-serif; }
        .gift-reference *, .gift-reference *::before, .gift-reference *::after { box-sizing: border-box; }
        .gift-reference .gift-screen { width: 100%; max-width: 512px; min-height: 100dvh; margin: 0 auto; padding-bottom: 28px; background: #ffffff; }
        .gift-reference .gift-title { min-height: 78px; display: flex; align-items: center; gap: 12px; padding: 17px 16px; background: #fff; border-bottom: 2px solid #111827; }
        .gift-reference .gift-title a { display: grid; width: 42px; height: 42px; flex: none; place-items: center; border: 2px solid #111827; border-radius: 11px; background: #ffffff; box-shadow: 0 3px 0 #111827; color: #111827; font-size: 34px; line-height: 1; text-decoration: none; }
        .gift-reference .gift-title h1 { min-width: 0; flex: 1; margin: 0; color: #111827; font-size: 20px; font-weight: 800; line-height: 1.2; text-align: left; }
        .gift-reference .gift-title::after { display: block; width: 42px; height: 42px; flex: none; content: ""; }
        .gift-reference .gift-banner { margin: 20px 16px 0; overflow: hidden; border: 2px solid #111827; border-radius: 12px; background: #fff8f2; box-shadow: 0 5px 0 #111827, 0 10px 18px rgba(17, 24, 39, .15); }
        .gift-reference .gift-hero { display: block; width: 100%; height: auto; aspect-ratio: 1.75 / 1; object-fit: cover; }
        .gift-reference .gift-description { display: flex; min-height: 70px; align-items: center; margin: 20px 16px 0; border: 2px solid #111827; border-radius: 12px; padding: 15px 16px; background: #fff0e5; color: #111827; font-size: 16px; font-weight: 700; line-height: 1.35; box-shadow: 0 4px 0 #111827; }
        .gift-reference .gift-telegram { display: flex; min-height: 82px; align-items: center; gap: 14px; margin: 18px 16px 0; border: 2px solid #111827; border-radius: 12px; padding: 12px 16px; background: #ffffff; box-shadow: 0 4px 0 #111827; text-decoration: none; }
        .gift-reference .gift-telegram img { width: 52px; height: 52px; flex: none; object-fit: contain; }
        .gift-reference .gift-telegram strong { min-width: 0; flex: 1; color: #111827; font-size: 17px; font-weight: 800; }
        .gift-reference .gift-telegram svg { width: 22px; height: 22px; flex: none; color: #111827; stroke-width: 2.5; }
        .gift-reference .gift-form { margin: 18px 16px 0; border: 2px solid #111827; border-radius: 12px; padding: 18px 16px 20px; background: #ffffff; box-shadow: 0 5px 0 #111827, 0 10px 18px rgba(17, 24, 39, .12); }
        .gift-reference .gift-label { display: block; margin-bottom: 10px; color: #111827; font-size: 17px; font-weight: 800; }
        .gift-reference .gift-label span { color: #c65100; }
        .gift-reference .gift-input { display: block; width: 100%; height: 62px; border: 2px solid #111827; border-radius: 11px; padding: 0 16px; outline: 0; background: #ffffff; color: #111827; font-size: 16px; font-weight: 500; }
        .gift-reference .gift-input:focus { border-color: #ff7a14; box-shadow: 0 0 0 3px rgba(255, 122, 20, .2); }
        .gift-reference .gift-input::placeholder { color: #4b5563; opacity: 1; }
        .gift-reference .gift-submit { display: grid; width: 100%; min-height: 62px; place-items: center; margin: 22px 0 0; border: 2px solid #111827; border-radius: 11px; background: #ff7a14; color: #111827; font-size: 19px; font-weight: 800; box-shadow: 0 4px 0 #111827, 0 7px 14px rgba(17, 24, 39, .18); cursor: pointer; }
        .gift-reference .gift-submit:hover:not(:disabled) { background: #e96808; }
        .gift-reference .gift-submit:focus-visible { outline: 3px solid rgba(255, 122, 20, .28); outline-offset: 2px; }
        .gift-reference .gift-submit:active:not(:disabled) { transform: translateY(3px); box-shadow: 0 1px 0 #111827, 0 3px 7px rgba(17, 24, 39, .18); }
        .gift-reference .gift-submit:disabled { cursor: wait; opacity: .7; }
        @media (max-width: 370px) {
          .gift-reference .gift-description { font-size: 14px; }
          .gift-reference .gift-title h1 { font-size: 19px; }
        }
      `}</style>
      <div className="gift-screen">
        <header className="gift-title">
          <Link href="/account" aria-label="Back">‹</Link>
           <h1>Redeem a gift</h1>
        </header>
        <div className="gift-banner">
          <img className="gift-hero" src={chargepointPromo} alt="ChargePoint platform and charging station" data-testid="img-gift-banner" />
        </div>
         <p className="gift-description">You can get a gift code in the group</p>
        <a className="gift-telegram" href={settings?.groupLink || "https://t.me/sybotx"} target="_blank" rel="noreferrer">
          <img src={telegramIcon} alt="" />
           <strong>Official group</strong>
          <ChevronRight aria-hidden="true" />
        </a>
        <form className="gift-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
           <label className="gift-label" htmlFor="gift-code-input"><span>* </span>Gift code</label>
          <input
            id="gift-code-input"
            className="gift-input"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
             placeholder="Enter the gift code"
            data-testid="input-gift-code"
          />
          <button className="gift-submit" type="submit" disabled={claimMutation.isPending} data-testid="button-submit-code">
             {claimMutation.isPending ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Confirm"}
          </button>
        </form>
      </div>
    </main>
  );
}