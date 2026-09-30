import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight, Loader2 } from "lucide-react";

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
}

interface DepositProviderInfo {
  provider: string;
}

export default function DepositModal({ open, onClose }: DepositModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("200");

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
    enabled: open,
  });
  const country = user?.country?.trim().toUpperCase() || "";
  const { data: providerInfo, isLoading: providerLoading } = useQuery<DepositProviderInfo>({
    queryKey: ["/api/deposit/provider", country, "cloudpay"],
    queryFn: async () => {
      const response = await fetch(
        `/api/deposit/provider/${encodeURIComponent(country)}?provider=cloudpay`,
        { credentials: "include" },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Checkout is unavailable");
      return result;
    },
    enabled: open && country === "PH",
    retry: false,
  });

  const minimumAmount = Math.max(200, Number.parseInt(settings?.minDeposit || "200", 10) || 200);
  const numericAmount = Number(amount);
  const checkoutAvailable = country === "PH" && providerInfo?.provider === "cloudpay";

  const continueToCheckout = () => {
    if (!checkoutAvailable) {
      toast({
        title: "Checkout unavailable",
        description: "Bank and e-wallet deposits are not available right now.",
        variant: "destructive",
      });
      return;
    }
    if (!Number.isSafeInteger(numericAmount) || numericAmount < minimumAmount) {
      toast({
        title: "Invalid amount",
        description: `The minimum deposit is ${minimumAmount.toLocaleString("en-PH")} PHP.`,
        variant: "destructive",
      });
      return;
    }

    onClose();
    window.location.assign(
      `/robotpay?amount=${encodeURIComponent(numericAmount)}&country=PH&provider=cloudpay`,
    );
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit</DialogTitle>
          <DialogDescription>
            Make a bank or e-wallet transfer in the Philippines.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="deposit-amount" className="text-sm font-medium">
              Amount (PHP)
            </label>
            <Input
              id="deposit-amount"
              type="number"
              inputMode="numeric"
              min={minimumAmount}
              step={1}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Minimum deposit: {minimumAmount.toLocaleString("en-PH")} PHP
            </p>
          </div>

          {country !== "PH" ? (
            <p role="alert" className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
              Deposits are currently available only in the Philippines.
            </p>
          ) : providerLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking bank and e-wallet checkout…
            </div>
          ) : !checkoutAvailable ? (
            <p role="alert" className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
              Bank and e-wallet deposits are not available right now.
            </p>
          ) : null}

          <Button
            className="w-full"
            onClick={continueToCheckout}
            disabled={providerLoading || !checkoutAvailable}
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}