import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { X, Search, Loader2, Send, CheckCircle2 } from "lucide-react";
import { resolveCloudPayBankCode } from "@shared/cloudpay-banks";
import type { Withdrawal } from "@shared/schema";

interface WithdrawalWithUser extends Withdrawal {
  user: {
    id: number;
    fullName: string;
    phone: string;
    country: string;
    isPromoter: boolean;
  };
}

function hasProviderReference(withdrawal: Withdrawal): boolean {
  return Boolean(
    withdrawal.cloudpayOrderId ||
    withdrawal.inpayOutTradeNo ||
    withdrawal.inpayOrderNumber ||
    withdrawal.omnipayId ||
    withdrawal.omnipayReference
  );
}

function getCloudPayUnavailableReason(
  withdrawal: Withdrawal,
  settings?: Record<string, string>,
): string | undefined {
  if (hasProviderReference(withdrawal)) {
    return "A provider request already exists. Check its status before another payout or manual decision.";
  }
  if (withdrawal.country.trim().toUpperCase() !== "PH") {
    return "CloudPay is available only for Philippines withdrawals.";
  }
  if (!resolveCloudPayBankCode(withdrawal.paymentMethod)) {
    return "This payout method is not supported by CloudPay.";
  }
  if (!settings) return "Checking CloudPay settings.";
  if (settings.cloudpayEnabled !== "true") return "CloudPay payouts are disabled in settings.";
  if (settings.cloudpayConfigured !== "true") return "CloudPay server configuration is incomplete.";
  return undefined;
}

export default function AdminWithdrawals() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "processing" | "approved" | "rejected">("pending");
  const [manualApprovalId, setManualApprovalId] = useState<number | null>(null);
  const [cloudPayApprovalId, setCloudPayApprovalId] = useState<number | null>(null);

  const { data: allWithdrawals, isLoading } = useQuery<WithdrawalWithUser[]>({
    queryKey: ["/api/admin/withdrawals"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/withdrawals?status=all`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch withdrawals");
      return res.json();
    },
  });
  const { data: adminSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });

  const withdrawals = allWithdrawals?.filter(w =>
    statusFilter === "all" ? true : w.status === statusFilter
  );

  const [processingId, setProcessingId] = useState<number | null>(null);

  const processMutation = useMutation({
  mutationFn: async ({ id, action }: { id: number; action: "reject" }) => {
      setProcessingId(id);
      const res = await fetch(`/api/admin/withdrawals/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        credentials: "include",
      });
      const data = await res.json();
        if (!res.ok) throw new Error(data.message || `Withdrawal processing failed (code ${res.status})`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
       toast({ title: "Withdrawal processed!" });
    },
    onError: (error: any) => {
       toast({ title: "Unable to process withdrawal", description: error.message, variant: "destructive" });
    },
    onSettled: () => setProcessingId(null),
  });

  const manualApprovalMutation = useMutation({
    mutationFn: async (id: number) => {
      setProcessingId(id);
      const res = await fetch(`/api/admin/withdrawals/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualTransferConfirmed: true }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Manual withdrawal approval failed (code ${res.status})`);
      return data;
    },
    onSuccess: () => {
      setManualApprovalId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Withdrawal marked paid manually" });
    },
    onError: (error: any) => toast({
      title: "Unable to mark withdrawal paid",
      description: error.message,
      variant: "destructive",
    }),
    onSettled: () => setProcessingId(null),
  });

  const cloudPayMutation = useMutation({
    mutationFn: async (id: number) => {
      setProcessingId(id);
      const res = await fetch(`/api/admin/withdrawals/${id}/cloudpay`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Sending withdrawal to CloudPay failed (code ${res.status})`);
      return data as { uncertain?: boolean };
    },
    onSuccess: (data) => {
      setCloudPayApprovalId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: data.uncertain ? "CloudPay request needs status check" : "Withdrawal sent to CloudPay",
        description: data.uncertain ? "Do not send it again. Check the provider status before taking another action." : undefined,
      });
    },
    onError: (error: any) => {
      toast({ title: "Unable to send withdrawal to CloudPay", description: error.message, variant: "destructive" });
    },
    onSettled: () => setProcessingId(null),
  });

  const cloudPayStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      setProcessingId(id);
      const res = await fetch(`/api/admin/withdrawals/${id}/cloudpay-status`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `CloudPay status check failed (code ${res.status})`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      const needsReview =
        data.response?.amountMatches === false ||
        data.response?.statusMatches === false;
      toast({
        title: needsReview ? "CloudPay response needs review" : `CloudPay status: ${data.status}`,
        description: data.response?.message ||
          (data.response?.providerStatus
            ? `Provider response code: ${data.response.providerStatus}`
            : undefined),
        variant: needsReview ? "destructive" : undefined,
      });
    },
    onError: (error: any) => {
      toast({ title: "Unable to check CloudPay status", description: error.message, variant: "destructive" });
    },
    onSettled: () => setProcessingId(null),
  });

  const filteredWithdrawals = withdrawals?.filter(w =>
    w.accountNumber.includes(filter) ||
    w.user.phone.includes(filter) ||
    w.user.fullName.toLowerCase().includes(filter.toLowerCase()) ||
    ((w as any).inpayOutTradeNo && (w as any).inpayOutTradeNo.toLowerCase().includes(filter.toLowerCase())) ||
    ((w as any).inpayOrderNumber && (w as any).inpayOrderNumber.toLowerCase().includes(filter.toLowerCase())) ||
    ((w as any).cloudpayOrderId && (w as any).cloudpayOrderId.toLowerCase().includes(filter.toLowerCase()))
  ) || [];
  const manualApprovalTarget = allWithdrawals?.find(
    (withdrawal) => withdrawal.id === manualApprovalId,
  );
  const cloudPayApprovalTarget = allWithdrawals?.find(
    (withdrawal) => withdrawal.id === cloudPayApprovalId,
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
             placeholder="Search by number or name..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {(["all", "pending", "processing", "approved", "rejected"] as const).map((status) => (
          <Button
            key={status}
            size="sm"
            variant={statusFilter === status ? "default" : "outline"}
            onClick={() => setStatusFilter(status)}
          >
            {status === "all"
               ? "All"
               : status === "pending"
                 ? "Pending"
                 : status === "processing"
                   ? "Processing"
                   : status === "approved"
                     ? "Approved"
                     : "Rejected"}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40" />)
        ) : filteredWithdrawals.length > 0 ? (
          filteredWithdrawals.map((withdrawal) => (
            <Card key={withdrawal.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Withdrawal #{withdrawal.id}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground">{withdrawal.user.fullName}</p>
                      {withdrawal.user.isPromoter && <Badge className="text-xs">Promoter</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{withdrawal.user.phone}</p>
                    <p className="text-sm text-muted-foreground">Country: {withdrawal.user.country}</p>
                  </div>
                  <Badge variant={
                    withdrawal.status === "pending" ? "secondary" :
                    withdrawal.status === "processing" ? "outline" :
                    withdrawal.status === "approved" ? "default" : "destructive"
                  }>
                    {withdrawal.status === "pending"
                      ? "Pending"
                      : withdrawal.status === "processing"
                        ? "En traitement"
                        : withdrawal.status === "approved"
                           ? "Approved"
                           : "Rejected"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                       <p className="text-muted-foreground">Requested amount</p>
                     <p className="font-medium text-foreground">{withdrawal.amount.toLocaleString()} PHP</p>
                  </div>
                  <div>
                     <p className="text-muted-foreground">Net amount</p>
                     <p className="font-medium text-primary">{withdrawal.netAmount.toLocaleString()} PHP</p>
                  </div>
                  <div>
                     <p className="text-muted-foreground">Fees</p>
                     <p className="font-medium text-destructive">{withdrawal.fees.toLocaleString()} PHP</p>
                  </div>
                  <div>
                     <p className="text-muted-foreground">Method</p>
                    <p className="font-medium text-foreground">{withdrawal.paymentMethod}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Receiving number</p>
                    <p className="font-medium text-foreground">{withdrawal.accountNumber} - {withdrawal.accountName}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Date and time</p>
                    <p className="font-medium text-foreground">
                       {new Date(withdrawal.createdAt).toLocaleDateString("en-PH", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                       })} at {new Date(withdrawal.createdAt).toLocaleTimeString("en-PH", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                  {(withdrawal as any).inpayOutTradeNo && (
                    <div className="col-span-2">
                     <p className="text-muted-foreground">InPay merchant reference</p>
                      <p className="font-mono font-medium text-foreground">{(withdrawal as any).inpayOutTradeNo}</p>
                    </div>
                  )}
                  {(withdrawal as any).inpayOrderNumber && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">InPay order number</p>
                      <p className="font-mono font-medium text-foreground">{(withdrawal as any).inpayOrderNumber}</p>
                    </div>
                  )}
                  {(withdrawal as any).cloudpayOrderId && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">CloudPay order reference</p>
                      <p className="font-mono font-medium text-foreground">{(withdrawal as any).cloudpayOrderId}</p>
                    </div>
                  )}
                </div>

                {withdrawal.cloudpayOrderId && (
                  <div className="mt-3 rounded-md border bg-muted/30 p-3 text-sm">
                    <p className="mb-1 font-semibold">CloudPay response</p>
                    {withdrawal.cloudpayResponse ? (
                      <>
                        <p>
                          <strong>Result:</strong>{" "}
                          {withdrawal.cloudpayResponse.status === "approved" &&
                          withdrawal.cloudpayResponse.amountMatches === true
                            ? "Validated by CloudPay"
                            : withdrawal.cloudpayResponse.status === "rejected"
                              ? "Rejected by CloudPay"
                              : "Awaiting final CloudPay validation"}
                        </p>
                        <p>
                          <strong>Provider code:</strong>{" "}
                          {withdrawal.cloudpayResponse.providerStatus}
                          {" · "}
                          <strong>Provider status:</strong>{" "}
                          {withdrawal.cloudpayResponse.status}
                        </p>
                        <p>
                          <strong>Amount returned:</strong>{" "}
                          {withdrawal.cloudpayResponse.amount
                            ? `${withdrawal.cloudpayResponse.amount} PHP`
                            : "Not included"}
                        </p>
                        {withdrawal.cloudpayResponse.amountMatches === false && (
                          <p className="font-medium text-destructive">
                            The provider amount does not match the expected net payout.
                          </p>
                        )}
                        {withdrawal.cloudpayResponse.statusMatches === false && (
                          <p className="font-medium text-destructive">
                            The provider status differs from the recorded withdrawal status.
                          </p>
                        )}
                        <p>
                          <strong>Message:</strong>{" "}
                          {withdrawal.cloudpayResponse.message || "No message returned."}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {withdrawal.cloudpayResponse.source === "payout"
                            ? "Payout request response"
                            : "Status query response"}
                          {" · "}
                          {new Date(withdrawal.cloudpayResponse.receivedAt).toLocaleString()}
                        </p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No CloudPay response has been saved yet.</p>
                    )}
                  </div>
                )}

                {withdrawal.status === "pending" && (() => {
                  const providerReferenceExists = hasProviderReference(withdrawal);
                  const cloudPayUnavailableReason = getCloudPayUnavailableReason(withdrawal, adminSettings);
                  const isProcessing = processingId === withdrawal.id;
                  return (
                    <div className="space-y-2 border-t pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Admin actions
                      </p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => setManualApprovalId(withdrawal.id)}
                          disabled={isProcessing || providerReferenceExists}
                          data-testid={`button-manual-paid-${withdrawal.id}`}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Mark paid manually
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => setCloudPayApprovalId(withdrawal.id)}
                          disabled={isProcessing || Boolean(cloudPayUnavailableReason)}
                          data-testid={`button-send-cloudpay-${withdrawal.id}`}
                        >
                          {isProcessing
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <><Send className="w-4 h-4 mr-1" /> Send to CloudPay</>}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full"
                          onClick={() => processMutation.mutate({ id: withdrawal.id, action: "reject" })}
                          disabled={isProcessing || providerReferenceExists}
                          data-testid={`button-reject-${withdrawal.id}`}
                        >
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                      {providerReferenceExists ? (
                        <p className="text-xs text-amber-700">
                          A provider request already exists. Check its status before marking it paid manually or rejecting it.
                        </p>
                      ) : cloudPayUnavailableReason ? (
                        <p className="text-xs text-muted-foreground">
                          CloudPay unavailable: {cloudPayUnavailableReason}
                        </p>
                      ) : null}
                    </div>
                  );
                })()}
                {withdrawal.cloudpayOrderId &&
                  ((withdrawal.status === "processing" || withdrawal.status === "pending") ||
                    !withdrawal.cloudpayResponse) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => cloudPayStatusMutation.mutate(withdrawal.id)}
                    disabled={processingId === withdrawal.id}
                    data-testid={`button-check-cloudpay-${withdrawal.id}`}
                  >
                    {processingId === withdrawal.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : withdrawal.cloudpayResponse
                        ? "Refresh CloudPay response"
                        : "Check CloudPay response"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
             No withdrawals found
          </div>
        )}
      </div>
      <AlertDialog
        open={manualApprovalId !== null}
        onOpenChange={(open) => {
          if (!open && !manualApprovalMutation.isPending) setManualApprovalId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm manual payout</AlertDialogTitle>
            <AlertDialogDescription>
              This action does not send money. Only confirm after you have completed the transfer outside CloudPay.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {manualApprovalTarget && (
            <div className="rounded-md border p-3 text-sm">
              <p><strong>Net amount:</strong> {manualApprovalTarget.netAmount.toLocaleString()} PHP</p>
              <p><strong>Recipient:</strong> {manualApprovalTarget.accountName}</p>
              <p><strong>Receiving number:</strong> {manualApprovalTarget.accountNumber}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={manualApprovalMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={!manualApprovalTarget || manualApprovalMutation.isPending}
              onClick={() => {
                if (manualApprovalTarget) manualApprovalMutation.mutate(manualApprovalTarget.id);
              }}
            >
              {manualApprovalMutation.isPending ? "Processing…" : "I sent it — mark paid"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={cloudPayApprovalId !== null}
        onOpenChange={(open) => {
          if (!open && !cloudPayMutation.isPending) setCloudPayApprovalId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send this payout through CloudPay?</AlertDialogTitle>
            <AlertDialogDescription>
              This sends a real payout request to CloudPay/Galaxy. The provider will receive the net amount after fees.
              If the result is uncertain, do not send it again; check the CloudPay status first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {cloudPayApprovalTarget && (
            <div className="rounded-md border p-3 text-sm">
              <p><strong>Net payout:</strong> {cloudPayApprovalTarget.netAmount.toLocaleString()} PHP</p>
              <p><strong>Requested amount:</strong> {cloudPayApprovalTarget.amount.toLocaleString()} PHP</p>
              <p><strong>Fees:</strong> {cloudPayApprovalTarget.fees.toLocaleString()} PHP</p>
              <p><strong>Recipient:</strong> {cloudPayApprovalTarget.accountName}</p>
              <p><strong>Receiving number:</strong> {cloudPayApprovalTarget.accountNumber}</p>
              <p><strong>Method:</strong> {cloudPayApprovalTarget.paymentMethod}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cloudPayMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={!cloudPayApprovalTarget || cloudPayMutation.isPending}
              onClick={() => {
                if (cloudPayApprovalTarget) cloudPayMutation.mutate(cloudPayApprovalTarget.id);
              }}
              data-testid="button-confirm-cloudpay-payout"
            >
              {cloudPayMutation.isPending
                ? "Sending payout…"
                : cloudPayApprovalTarget
                  ? `Send ${cloudPayApprovalTarget.netAmount.toLocaleString()} PHP`
                  : "Send payout"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
