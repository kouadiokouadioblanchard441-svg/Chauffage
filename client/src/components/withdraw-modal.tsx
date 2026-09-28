import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, getCountryByCode } from "@/lib/countries";
import { Loader2, AlertCircle, Clock, Wallet } from "lucide-react";
import type { WithdrawalWallet } from "@shared/schema";
import { useLocation } from "wouter";

const withdrawSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
});

type WithdrawForm = z.infer<typeof withdrawSchema>;

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WithdrawModal({ open, onClose }: WithdrawModalProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);

  const { data: wallets } = useQuery<WithdrawalWallet[]>({
    queryKey: ["/api/wallets"],
    enabled: open,
  });

  const { data: withdrawalSettings } = useQuery<{ 
    withdrawalFees: number; 
    withdrawalStartHour: number;
    withdrawalEndHour: number;
    maxWithdrawalsPerDay: number;
    minWithdrawal: number;
    withdrawalPrepaymentEnabled: boolean;
  }>({
    queryKey: ["/api/settings/withdrawal"],
    enabled: open,
  });

  const form = useForm<WithdrawForm>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      amount: "",
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: WithdrawForm) => {
      const response = await apiRequest("POST", "/api/withdrawals", {
        amount: parseInt(data.amount),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Unable to submit the withdrawal request");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      refreshUser();
      toast({ title: "Request sent!", description: "Your withdrawal is awaiting approval." });
      handleClose();
    },
    onError: (error: any) => {
      if (error.data?.code === "WITHDRAWAL_PREPAYMENT_REQUIRED" && error.data.paymentUrl) {
        navigate(error.data.paymentUrl);
        return;
      }
      toast({ title: "Withdrawal unavailable", description: error.message, variant: "destructive" });
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!user) return null;

  const balance = parseFloat(user.balance || "0");
  const defaultWallet = wallets?.find(w => w.isDefault);
  const fees = withdrawalSettings?.withdrawalFees || 16;
  const startHour = withdrawalSettings?.withdrawalStartHour || 8;
  const endHour = withdrawalSettings?.withdrawalEndHour || 17;
  const minWithdrawal = withdrawalSettings?.minWithdrawal ?? 800;
  const withdrawalPrepaymentEnabled = withdrawalSettings?.withdrawalPrepaymentEnabled ?? false;
  const country = getCountryByCode(user.country);

  const amount = parseInt(form.watch("amount") || "0");
  const feeAmount = Math.round(amount * fees / 100);
  const netAmount = amount - feeAmount;
  const withdrawalPrepayment = Math.max(1, Math.round(amount * 25 / 100));

  const canWithdraw = user.hasDeposited && user.hasActiveProduct && !user.isWithdrawalBlocked && defaultWallet;
  const isCameroonOrBenin = user.country === "CM" || user.country === "BJ";
  const actualStartHour = isCameroonOrBenin ? 9 : startHour;
  const actualEndHour = isCameroonOrBenin ? 18 : endHour;

  const currentHour = new Date().getHours();
  const isWithinHours = currentHour >= actualStartHour && currentHour < actualEndHour;

  const handlePayPrepayment = async () => {
    if (!withdrawalPrepaymentEnabled) return;
    if (amount < minWithdrawal) {
      toast({ title: "Invalid amount", description: `The minimum amount is ${formatCurrency(minWithdrawal, user.country)}`, variant: "destructive" });
      return;
    }
    setIsPreparingPayment(true);
    try {
      const response = await apiRequest("POST", "/api/withdrawal-fee/prepare", { amount });
      const data = await response.json();
      navigate(data.paymentUrl);
    } catch (error: any) {
      toast({ title: "Payment unavailable", description: error.message, variant: "destructive" });
    } finally {
      setIsPreparingPayment(false);
    }
  };

  return (
    <>
      <style>{`
        .withdraw-modal-content {
          overflow: hidden;
          padding: 0;
          border: 0;
          border-radius: 16px;
          background: #f7f4f2;
        }
        .withdraw-modal-header {
          position: relative;
          min-height: 206px;
          padding: 26px 24px 0;
          background: #ffca2b;
          overflow: hidden;
        }
        .withdraw-modal-header::before,
        .withdraw-modal-header::after {
          position: absolute;
          content: "";
          border-radius: 45%;
          background: #fdb900;
          transform: rotate(-14deg);
        }
        .withdraw-modal-header::before {
          top: -32px;
          left: -40px;
          width: 170px;
          height: 120px;
          box-shadow: 95px 20px 0 -18px #fdb900;
        }
        .withdraw-modal-header::after {
          top: 26px;
          right: -22px;
          width: 160px;
          height: 100px;
          background: rgba(255,255,255,.15);
          transform: rotate(18deg);
        }
        .withdraw-modal-heading,
        .withdraw-modal-subtitle,
        .withdraw-modal-balance {
          position: relative;
          z-index: 1;
        }
        .withdraw-modal-heading {
          color: #111;
          font-size: 28px;
          font-weight: 500;
          text-align: center;
        }
        .withdraw-modal-subtitle {
          color: #946d23;
          text-align: center;
        }
        .withdraw-modal-balance {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 22px;
          padding: 18px;
          border: 2px solid rgba(255,255,255,.9);
          border-radius: 12px;
          background: linear-gradient(110deg, #ffd45d, #ffe69a);
          color: #f36d17;
        }
        .withdraw-modal-balance-label {
          font-size: 15px;
          font-weight: 800;
        }
        .withdraw-modal-balance-value {
          margin-top: 6px;
          font-size: 28px;
          font-weight: 800;
        }
        .withdraw-modal-wallet {
          position: relative;
          width: 62px;
          height: 46px;
          border: 4px solid #f2b51d;
          border-radius: 8px;
          background: #ffd85d;
          box-shadow: inset 0 8px 0 rgba(255,255,255,.3);
        }
        .withdraw-modal-wallet::after {
          position: absolute;
          top: 13px;
          right: -7px;
          width: 14px;
          height: 13px;
          border-radius: 4px;
          content: "";
          background: #f2b51d;
        }
        .withdraw-modal-body {
          padding: 20px 24px 24px;
        }
        .withdraw-modal-content [data-radix-dialog-close] {
          z-index: 3;
          color: #111;
        }
      `}</style>
      <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="withdraw-modal-content max-w-md">
        <DialogHeader className="withdraw-modal-header">
          <DialogTitle className="withdraw-modal-heading">Withdrawal</DialogTitle>
          <DialogDescription className="withdraw-modal-subtitle">
            Minimum: {formatCurrency(minWithdrawal, user.country)} | Frais: {fees}%
          </DialogDescription>
          <div className="withdraw-modal-balance">
            <div>
              <div className="withdraw-modal-balance-label">Account balance</div>
              <div className="withdraw-modal-balance-value">{formatCurrency(balance, user.country)}</div>
            </div>
            <span className="withdraw-modal-wallet" aria-hidden="true" />
          </div>
        </DialogHeader>

        <div className="withdraw-modal-body">
        {!canWithdraw ? (
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Withdrawal unavailable</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  {!user.hasDeposited && <li>- Make a deposit</li>}
                  {!user.hasActiveProduct && <li>- Purchase a product</li>}
                  {!defaultWallet && <li>- Register a withdrawal wallet</li>}
                  {user.isWithdrawalBlocked && <li>- Your withdrawal is blocked</li>}
                  {user.mustInviteToWithdraw && <li>- Invite someone who invests</li>}
                </ul>
              </div>
            </div>
          </div>
        ) : !isWithinHours ? (
          <div className="space-y-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Outside withdrawal hours</p>
                <p className="text-muted-foreground mt-1">
                  Withdrawals are available from {actualStartHour}:00 to {actualEndHour}:00
                  {isCameroonOrBenin && " (Cameroon and Benin)"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => withdrawMutation.mutate(data))} className="space-y-4">
              <div className="bg-secondary rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Withdrawal wallet</span>
                </div>
                <p className="font-medium text-foreground">{defaultWallet?.accountName}</p>
                <p className="text-sm text-muted-foreground">{defaultWallet?.accountNumber} - {defaultWallet?.paymentMethod}</p>
              </div>

              <div className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-sm text-muted-foreground">Available balance</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(balance, user.country)}</p>
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Withdrawal amount</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={minWithdrawal}
                        placeholder={`Minimum ${minWithdrawal.toLocaleString("en-US")} PHP`}
                        data-testid="input-withdraw-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {amount >= minWithdrawal && (
                <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="text-foreground">{formatCurrency(amount, user.country)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frais ({fees}%)</span>
                    <span className="text-destructive">-{formatCurrency(feeAmount, user.country)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium text-foreground">Net received</span>
                    <span className="font-bold text-primary">{formatCurrency(netAmount, user.country)}</span>
                  </div>
                </div>
              )}

              {withdrawalPrepaymentEnabled && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 space-y-2">
                  <p className="font-semibold">Payment required before withdrawal</p>
                  <p>
                    Pay 25% of the withdrawal amount, {formatCurrency(withdrawalPrepayment, user.country)}, before requesting the withdrawal.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-amber-400 bg-white text-amber-900 hover:bg-amber-100"
                    onClick={handlePayPrepayment}
                    disabled={isPreparingPayment || amount < minWithdrawal}
                  >
                    {isPreparingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pay"}
                  </Button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={withdrawMutation.isPending || amount < minWithdrawal || amount > balance}
                data-testid="button-submit-withdraw"
              >
                {withdrawMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Request withdrawal"
                )}
              </Button>
            </form>
          </Form>
        )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
