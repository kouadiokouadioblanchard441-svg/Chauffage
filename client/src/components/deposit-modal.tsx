import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getPaymentMethodsForCountry, formatCurrency } from "@/lib/countries";
import { Loader2 } from "lucide-react";
import type { PaymentChannel } from "@shared/schema";

const depositSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  paymentMethod: z.string().min(2, "Payment method is required"),
  paymentChannelId: z.string().min(1, "Deposit channel is required"),
});

type DepositForm = z.infer<typeof depositSchema>;
type DepositProviderInfo = { provider: string; providers?: Array<{ provider: string }> };

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
}

export default function DepositModal({ open, onClose }: DepositModalProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<"amount" | "details">("amount");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const { data: channels } = useQuery<PaymentChannel[]>({
    queryKey: ["/api/payment-channels"],
    enabled: open,
  });
  const { data: automaticProviderInfo } = useQuery<DepositProviderInfo | null>({
    queryKey: ["/api/deposit/provider", user?.country],
    queryFn: async () => {
      const response = await fetch(`/api/deposit/provider/${encodeURIComponent(user!.country)}`, {
        credentials: "include",
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: open && user?.country.trim().toUpperCase() === "PH",
    retry: false,
  });
  const { data: platformSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
    enabled: open,
  });

  const form = useForm<DepositForm>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: "",
      paymentMethod: "",
      paymentChannelId: "",
    },
  });

  const depositMutation = useMutation({
    mutationFn: async (data: DepositForm) => {
      const response = await apiRequest("POST", "/api/deposits", {
        amount: parseInt(data.amount),
        accountName: user!.fullName,
        accountNumber: user!.phone,
        country: user!.country,
        paymentMethod: data.paymentMethod,
        paymentChannelId: parseInt(data.paymentChannelId),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Unable to submit the deposit request");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      refreshUser();
      if (data.redirectUrl) {
        window.open(data.redirectUrl, "_blank");
      }
      toast({ title: "Request sent!", description: "Your deposit is awaiting approval." });
      handleClose();
    },
    onError: (error: any) => {
      toast({ title: "Deposit not registered", description: error.message, variant: "destructive" });
    },
  });

  const handleClose = () => {
    setStep("amount");
    setSelectedAmount(null);
    form.reset();
    onClose();
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    form.setValue("amount", amount.toString());
    setStep("details");
  };

  const handleCustomAmount = () => {
    const amount = parseInt(form.getValues("amount"));
    if (amount >= 2000) {
      setSelectedAmount(amount);
      setStep("details");
    } else {
       toast({ title: "Invalid amount", description: "The minimum amount is 2,000 PHP", variant: "destructive" });
    }
  };

  if (!user) return null;

  const countryUnavailable = user.country.trim().toUpperCase() !== "PH";
  const paymentMethods = getPaymentMethodsForCountry(user.country);
  const activeChannels = channels?.filter(c => c.isActive) || [];
  const automaticProviders = automaticProviderInfo?.providers ||
    (automaticProviderInfo ? [{ provider: automaticProviderInfo.provider }] : []);
  const soleCloudPayProvider = automaticProviders.length === 1 &&
    automaticProviders[0]?.provider === "cloudpay";
  const cloudPayMinimum = Math.max(3500, parseInt(platformSettings?.minDeposit || "3500", 10));
  const presetAmounts = [2000, 5000, 10000, 20000, 50000, 100000];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
             {step === "amount" ? "Deposit" : "Payment information"}
          </DialogTitle>
        </DialogHeader>

        {countryUnavailable ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950" role="status">
            Deposits are currently available only for accounts in the Philippines.
          </div>
        ) : step === "amount" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Minimum: {formatCurrency(2000, user.country)}
            </p>

            <div className="grid grid-cols-3 gap-2">
              {presetAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => handleAmountSelect(amount)}
                  data-testid={`button-amount-${amount}`}
                >
                  {formatCurrency(amount, user.country)}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                type="number"
               placeholder="Custom amount"
                value={form.watch("amount")}
                onChange={(e) => form.setValue("amount", e.target.value)}
                data-testid="input-custom-amount"
              />
              <Button onClick={handleCustomAmount} data-testid="button-custom-amount">
                 Continue
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => depositMutation.mutate(data))} className="space-y-4">
              <div className="bg-secondary rounded-lg p-3 text-center">
                 <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(selectedAmount || 0, user.country)}
                </p>
              </div>

              {soleCloudPayProvider && selectedAmount && (
                <div className="space-y-2">
                  {selectedAmount < cloudPayMinimum && (
                    <p className="text-xs text-muted-foreground">
                      Online bank/e-wallet checkout minimum: {formatCurrency(cloudPayMinimum, user.country)}.
                    </p>
                  )}
                  <Button
                    type="button"
                    className="w-full"
                    disabled={selectedAmount < cloudPayMinimum}
                    onClick={() => {
                      const query = new URLSearchParams({
                        amount: String(selectedAmount),
                        country: user.country.toUpperCase(),
                        provider: "cloudpay",
                      });
                      window.location.href = `/robotpay?${query.toString()}`;
                    }}
                  >
                    Continue with bank or e-wallet
                  </Button>
                </div>
              )}

              <FormField
                control={form.control}
                name="paymentChannelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deposit channel</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-channel">
                           <SelectValue placeholder="Choose a channel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeChannels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id.toString()}>
                            {channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                   <FormLabel>Payment method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue placeholder="Choisir" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep("amount")} className="flex-1">
                     Back
                </Button>
                <Button type="submit" className="flex-1" disabled={depositMutation.isPending} data-testid="button-submit-deposit">
                  {depositMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                     "Proceed to payment"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
