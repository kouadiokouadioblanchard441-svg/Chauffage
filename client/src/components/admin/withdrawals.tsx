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
import { isConfirmedCloudPayPayoutFailure } from "@shared/cloudpay-withdrawals";
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

function hasBlockingProviderReference(withdrawal: Withdrawal): boolean {
  return Boolean(
    (withdrawal.cloudpayOrderId && !isConfirmedCloudPayPayoutFailure(withdrawal)) ||
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
  if (hasBlockingProviderReference(withdrawal)) {
    return "Une demande prestataire est en cours. Vérifie son statut avant toute autre action.";
  }
  if (withdrawal.country.trim().toUpperCase() !== "PH") {
    return "CloudPay est disponible uniquement pour les retraits des Philippines.";
  }
  if (!resolveCloudPayBankCode(withdrawal.paymentMethod)) {
    return "Cette méthode de retrait n’est pas prise en charge par CloudPay.";
  }
  if (!settings) return "Vérification de la configuration CloudPay en cours.";
  if (settings.cloudpayEnabled !== "true") return "Les paiements CloudPay sont désactivés dans les réglages.";
  if (settings.cloudpayConfigured !== "true") return "La configuration serveur CloudPay est incomplète.";
  return undefined;
}

export default function AdminWithdrawals() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "processing" | "approved" | "rejected">("pending");
  const [manualApprovalId, setManualApprovalId] = useState<number | null>(null);
  const [cloudPayApprovalId, setCloudPayApprovalId] = useState<number | null>(null);
  const [rejectionId, setRejectionId] = useState<number | null>(null);

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
        if (!res.ok) throw new Error(data.message || `Échec du traitement du retrait (code ${res.status})`);
      return data;
    },
    onSuccess: () => {
      setRejectionId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Retrait rejeté et remboursé" });
    },
    onError: (error: any) => {
       toast({ title: "Impossible de traiter le retrait", description: error.message, variant: "destructive" });
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
      if (!res.ok) throw new Error(data.message || `Échec de la validation manuelle du retrait (code ${res.status})`);
      return data;
    },
    onSuccess: () => {
      setManualApprovalId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Retrait validé manuellement" });
    },
    onError: (error: any) => toast({
      title: "Impossible de valider le retrait",
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
      if (!res.ok) throw new Error(data.message || `Échec de l’envoi du retrait à CloudPay (code ${res.status})`);
      return data as { uncertain?: boolean; retriedAfterFailure?: boolean };
    },
    onSuccess: (data) => {
      setCloudPayApprovalId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: data.uncertain
          ? "La demande CloudPay doit être vérifiée"
          : data.retriedAfterFailure
            ? "Nouvelle tentative CloudPay envoyée"
            : "Retrait envoyé à CloudPay",
        description: data.uncertain
          ? "Ne renvoie pas la demande. Vérifie son statut avant toute autre action."
          : undefined,
      });
    },
    onError: (error: any) => {
      toast({ title: "Impossible d’envoyer le retrait à CloudPay", description: error.message, variant: "destructive" });
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
      if (!res.ok) throw new Error(data.message || `Échec de la vérification du statut CloudPay (code ${res.status})`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      const needsReview =
        data.response?.amountMatches === false ||
        data.response?.statusMatches === false;
      const confirmedFailure =
        data.response?.status === "rejected" &&
        data.response?.amountMatches === true &&
        data.response?.statusMatches !== false;
      const providerStillPending = data.response?.status === "pending";
      toast({
        title: needsReview
          ? "La réponse CloudPay nécessite une vérification"
          : confirmedFailure
            ? "Échec CloudPay confirmé"
            : providerStillPending
              ? "CloudPay n’a pas encore confirmé le paiement"
              : `Statut CloudPay : ${data.status}`,
        description: needsReview
          ? "Le montant ou le statut retourné ne correspond pas. Les décisions restent bloquées."
          : confirmedFailure
            ? "Le montant reste réservé. Tu peux valider manuellement, réessayer CloudPay ou rejeter et rembourser."
            : providerStillPending
              ? "Vérifie à nouveau plus tard. Les actions manuelles restent bloquées."
              : data.response?.message ||
                (data.response?.providerStatus
                  ? `Code de réponse du prestataire : ${data.response.providerStatus}`
                  : undefined),
        variant: needsReview ? "destructive" : undefined,
      });
    },
    onError: (error: any) => {
      toast({ title: "Impossible de vérifier le statut CloudPay", description: error.message, variant: "destructive" });
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
  const rejectionTarget = allWithdrawals?.find(
    (withdrawal) => withdrawal.id === rejectionId,
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
                    <p className="mb-1 font-semibold">Réponse CloudPay</p>
                    {withdrawal.cloudpayResponse ? (
                      <>
                        <p>
                          <strong>Résultat :</strong>{" "}
                          {withdrawal.cloudpayResponse.status === "approved" &&
                          withdrawal.cloudpayResponse.amountMatches === true
                            ? "Validé par CloudPay"
                            : withdrawal.cloudpayResponse.status === "rejected"
                              ? "Refusé par CloudPay"
                              : "En attente de la confirmation finale de CloudPay"}
                        </p>
                        <p>
                          <strong>Code prestataire :</strong>{" "}
                          {withdrawal.cloudpayResponse.providerStatus}
                          {" · "}
                          <strong>Statut prestataire :</strong>{" "}
                          {withdrawal.cloudpayResponse.status}
                        </p>
                        <p>
                          <strong>Montant retourné :</strong>{" "}
                          {withdrawal.cloudpayResponse.amount
                            ? `${withdrawal.cloudpayResponse.amount} PHP`
                            : "Non indiqué"}
                        </p>
                        {withdrawal.cloudpayResponse.amountMatches === false && (
                          <p className="font-medium text-destructive">
                            Le montant retourné ne correspond pas au montant net attendu.
                          </p>
                        )}
                        {withdrawal.cloudpayResponse.statusMatches === false && (
                          <p className="font-medium text-destructive">
                            Le statut CloudPay diffère du statut enregistré pour ce retrait.
                          </p>
                        )}
                        <p>
                          <strong>Message :</strong>{" "}
                          {withdrawal.cloudpayResponse.message || "Aucun message reçu."}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {withdrawal.cloudpayResponse.source === "payout"
                            ? "Réponse à la demande de paiement"
                            : "Réponse à la vérification du statut"}
                          {" · "}
                          {new Date(withdrawal.cloudpayResponse.receivedAt).toLocaleString()}
                        </p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Aucune réponse CloudPay n’a encore été enregistrée.</p>
                    )}
                  </div>
                )}

                {withdrawal.status === "pending" && (() => {
                  const cloudPayFailureConfirmed = isConfirmedCloudPayPayoutFailure(withdrawal);
                  const providerReferenceExists = hasBlockingProviderReference(withdrawal);
                  const cloudPayUnavailableReason = getCloudPayUnavailableReason(withdrawal, adminSettings);
                  const isProcessing = processingId === withdrawal.id;
                  return (
                    <div className="space-y-2 border-t pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Actions disponibles
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
                          Valider manuellement
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
                            : <><Send className="w-4 h-4 mr-1" /> {cloudPayFailureConfirmed ? "Réessayer avec CloudPay" : "Envoyer à CloudPay"}</>}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full"
                          onClick={() => setRejectionId(withdrawal.id)}
                          disabled={isProcessing || providerReferenceExists}
                          data-testid={`button-reject-${withdrawal.id}`}
                        >
                          <X className="w-4 h-4 mr-1" /> Rejeter et rembourser
                        </Button>
                      </div>
                      {providerReferenceExists ? (
                        <p className="text-xs text-amber-700">
                          Une demande de paiement est en cours. Vérifie son statut auprès du prestataire avant toute autre action.
                        </p>
                      ) : cloudPayFailureConfirmed ? (
                        <p className="text-xs text-amber-700">
                          CloudPay a confirmé l’échec. Le montant reste réservé; choisis une action ci-dessus.
                        </p>
                      ) : cloudPayUnavailableReason ? (
                        <p className="text-xs text-muted-foreground">
                          CloudPay indisponible : {cloudPayUnavailableReason}
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
                        ? "Actualiser le statut CloudPay"
                        : "Vérifier le statut CloudPay"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
             Aucun retrait trouvé
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
            <AlertDialogTitle>Confirmer le paiement manuel</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action n’envoie pas d’argent. Confirme uniquement après avoir effectué le virement en dehors de CloudPay.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {manualApprovalTarget && (
            <div className="rounded-md border p-3 text-sm">
              <p><strong>Montant net :</strong> {manualApprovalTarget.netAmount.toLocaleString()} PHP</p>
              <p><strong>Bénéficiaire :</strong> {manualApprovalTarget.accountName}</p>
              <p><strong>Numéro de réception :</strong> {manualApprovalTarget.accountNumber}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={manualApprovalMutation.isPending}>
              Annuler
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={!manualApprovalTarget || manualApprovalMutation.isPending}
              onClick={() => {
                if (manualApprovalTarget) manualApprovalMutation.mutate(manualApprovalTarget.id);
              }}
            >
              {manualApprovalMutation.isPending ? "Traitement…" : "Virement effectué — valider"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={rejectionId !== null}
        onOpenChange={(open) => {
          if (!open && !processMutation.isPending) setRejectionId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter le retrait et rembourser ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action rejette le retrait et recrédite une seule fois le montant débité au client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {rejectionTarget && (
            <div className="rounded-md border p-3 text-sm">
              <p><strong>Montant à rembourser :</strong> {rejectionTarget.amount.toLocaleString()} PHP</p>
              <p><strong>Bénéficiaire :</strong> {rejectionTarget.accountName}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processMutation.isPending}>
              Annuler
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={!rejectionTarget || processMutation.isPending}
              onClick={() => {
                if (rejectionTarget) processMutation.mutate({ id: rejectionTarget.id, action: "reject" });
              }}
            >
              {processMutation.isPending ? "Traitement…" : "Confirmer le rejet et le remboursement"}
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
            <AlertDialogTitle>Envoyer ce retrait via CloudPay ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action envoie une demande de paiement réelle à CloudPay/Galaxy. Le prestataire recevra le montant net après déduction des frais.
              Si le résultat est incertain, ne renvoie pas la demande; vérifie d’abord le statut CloudPay.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {cloudPayApprovalTarget && (
            <div className="rounded-md border p-3 text-sm">
              <p><strong>Montant net envoyé :</strong> {cloudPayApprovalTarget.netAmount.toLocaleString()} PHP</p>
              <p><strong>Montant demandé :</strong> {cloudPayApprovalTarget.amount.toLocaleString()} PHP</p>
              <p><strong>Frais :</strong> {cloudPayApprovalTarget.fees.toLocaleString()} PHP</p>
              <p><strong>Bénéficiaire :</strong> {cloudPayApprovalTarget.accountName}</p>
              <p><strong>Numéro de réception :</strong> {cloudPayApprovalTarget.accountNumber}</p>
              <p><strong>Méthode :</strong> {cloudPayApprovalTarget.paymentMethod}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cloudPayMutation.isPending}>
              Annuler
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
                ? "Envoi du paiement…"
                : cloudPayApprovalTarget
                  ? `Envoyer ${cloudPayApprovalTarget.netAmount.toLocaleString()} PHP`
                  : "Envoyer le paiement"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
