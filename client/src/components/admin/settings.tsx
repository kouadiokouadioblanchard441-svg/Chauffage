import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, Link, Clock, Users, Zap } from "lucide-react";

type AdminCountry = { code: string; name: string; isActive: boolean };
type DepositMethodId = "manual" | "soleaspay" | "ashtech" | "sendavapay" | "westpay" | "inpay" | "clapay";

const DEPOSIT_METHOD_OPTIONS: Array<{ value: DepositMethodId; label: string }> = [
  { value: "manual", label: "Manual payment" },
  { value: "soleaspay", label: "SoleaPay" },
  { value: "ashtech", label: "AshtechPay" },
  { value: "sendavapay", label: "SendavaPay" },
  { value: "westpay", label: "WestPay" },
  { value: "inpay", label: "InPay" },
  { value: "clapay", label: "Clapay" },
];

function getInitialDepositRouting(
  settings: Record<string, string>,
  countries: AdminCountry[],
  paymentNumbers: Array<{ country: string; isActive: boolean }>,
): Record<string, DepositMethodId[]> {
  const parsed = settings.depositMethodsByCountry;
  if (parsed) {
    try {
      const stored = JSON.parse(parsed) as Record<string, unknown>;
      return Object.fromEntries(countries.map(({ code }) => {
        const methods = Array.isArray(stored[code.toUpperCase()])
          ? (stored[code.toUpperCase()] as unknown[]).filter(
              (method): method is DepositMethodId =>
                typeof method === "string" &&
                DEPOSIT_METHOD_OPTIONS.some((option) => option.value === method),
            )
          : [];
        return [code.toUpperCase(), methods];
      }));
    } catch {
      return Object.fromEntries(countries.map(({ code }) => [code.toUpperCase(), []]));
    }
  }

  const countryAllowed = (value: string | undefined, code: string, emptyMeansAll = false) => {
    const configured = (value || "").split(",").map((item) => item.trim().toUpperCase()).filter(Boolean);
    return configured.length === 0 ? emptyMeansAll : configured.includes(code);
  };
  return Object.fromEntries(countries.map(({ code }) => {
    const normalizedCode = code.toUpperCase();
    const methods: DepositMethodId[] = [];
    if (settings.soleaspayEnabled === "true" && countryAllowed(settings.soleaspayCountries, normalizedCode)) {
      methods.push("soleaspay");
    }
    if (settings.ashtechEnabled === "true" && countryAllowed(settings.ashtechCountries, normalizedCode, true)) {
      methods.push("ashtech");
    }
    if (settings.sendavapayEnabled === "true") methods.push("sendavapay");
    if (settings.westpayEnabled === "true" && countryAllowed(settings.westpayCountries, normalizedCode, true)) {
      methods.push("westpay");
    }
    if (settings.inpayEnabled === "true" && countryAllowed(settings.inpayCountries, normalizedCode)) {
      methods.push("inpay");
    }
    if (paymentNumbers.some((number) => number.isActive && number.country.toUpperCase() === normalizedCode)) {
      methods.push("manual");
    }
    return [normalizedCode, methods];
  }));
}

const NETWORKS = [
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
];
const settingsSchema = z.object({
  supportLink: z.string().min(5, "Link is required"),
  supportType: z.string().min(1, "Network is required"),
  supportLabel: z.string().min(1, "Label is required"),
  support2Link: z.string().min(5, "Lien requis"),
  support2Type: z.string().min(1, "Network is required"),
  support2Label: z.string().min(1, "Label requis"),
  channelLink: z.string().min(5, "Lien requis"),
  channelType: z.string().min(1, "Network is required"),
  channelLabel: z.string().min(1, "Label requis"),
  groupLink: z.string().min(5, "Lien requis"),
  groupType: z.string().min(1, "Network is required"),
  groupLabel: z.string().min(1, "Label requis"),
  popupButtonLabel: z.string().min(1, "Label requis"),
  supportEnabled: z.boolean(),
  support2Enabled: z.boolean(),
  channelEnabled: z.boolean(),
  groupEnabled: z.boolean(),
  signupBonus: z.string().min(1, "Bonus requis"),
  minDeposit: z.string().min(1, "Montant requis"),
  minWithdrawal: z.string().min(1, "Montant requis"),
  withdrawalFees: z.string().min(1, "Frais requis"),
  maxWithdrawalsPerDay: z.string().min(1, "Requis"),
  withdrawalStartHour: z.string().min(1, "Heure requise"),
  withdrawalEndHour: z.string().min(1, "Heure requise"),
  withdrawalPrepaymentEnabled: z.boolean(),
  level1Commission: z.string().min(1, "Commission requise"),
  level2Commission: z.string().min(1, "Commission requise"),
  level3Commission: z.string().min(1, "Commission requise"),
  sendavapayEnabled: z.boolean(),
  sendavapayChannelName: z.string().min(1, "Nom requis"),
  soleaspayEnabled: z.boolean(),
  soleaspayChannelName: z.string().min(1, "Nom requis"),
  westpayEnabled: z.boolean(),
  westpayChannelName: z.string().min(1, "Nom requis"),
  ashtechEnabled: z.boolean(),
  ashtechChannelName: z.string().min(1, "Nom requis"),
  inpayEnabled: z.boolean(),
  inpayChannelName: z.string().min(1, "Nom requis"),
  clapayEnabled: z.boolean(),
  clapayChannelName: z.string().min(1, "Nom requis"),
});

type SettingsForm = z.infer<typeof settingsSchema>;

interface AdminSettingsProps {
  isSuperAdmin: boolean;
}

export default function AdminSettings({ isSuperAdmin }: AdminSettingsProps) {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });
  const { data: countries = [], isLoading: countriesLoading } = useQuery<AdminCountry[]>({
    queryKey: ["/api/admin/countries"],
  });
  const { data: paymentNumbers = [], isLoading: paymentNumbersLoading } = useQuery<
    Array<{ country: string; isActive: boolean }>
  >({
    queryKey: ["/api/admin/payment-numbers"],
  });
  const [depositMethodsByCountry, setDepositMethodsByCountry] = useState<Record<string, DepositMethodId[]>>({});

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
       defaultValues: {
      supportLink: "https://t.me/sybotx",
      supportType: "telegram",
       supportLabel: "Customer support",
      support2Link: "https://t.me/sybotx",
      support2Type: "telegram",
      support2Label: "Service client 2",
      channelLink: "https://t.me/sybotx",
      channelType: "telegram",
       channelLabel: "Official channel",
      groupLink: "https://t.me/sybotx",
      groupType: "telegram",
       groupLabel: "Discussion group",
       popupButtonLabel: "Click here to join the Telegram group",
      supportEnabled: true,
      support2Enabled: true,
      channelEnabled: true,
      groupEnabled: true,
      signupBonus: "1000",
      minDeposit: "3500",
      minWithdrawal: "800",
      withdrawalFees: "16",
      maxWithdrawalsPerDay: "1",
      withdrawalStartHour: "9",
      withdrawalEndHour: "17",
      withdrawalPrepaymentEnabled: false,
      level1Commission: "25",
      level2Commission: "4",
      level3Commission: "1",
      sendavapayEnabled: false,
      sendavapayChannelName: "SendavaPay",
      soleaspayEnabled: false,
      soleaspayChannelName: "SoleaPay",
      westpayEnabled: false,
      westpayChannelName: "WestPay",
      ashtechEnabled: false,
      ashtechChannelName: "AshtechPay",
      inpayEnabled: false,
      inpayChannelName: "InPay",
      clapayEnabled: false,
      clapayChannelName: "Clapay",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        supportLink: settings.supportLink || "https://t.me/sybotx",
        supportType: settings.supportType || "telegram",
         supportLabel: settings.supportLabel || "Customer support",
        support2Link: settings.support2Link || "https://t.me/sybotx",
        support2Type: settings.support2Type || "telegram",
        support2Label: settings.support2Label || "Service client 2",
        channelLink: settings.channelLink || "https://t.me/sybotx",
        channelType: settings.channelType || "telegram",
         channelLabel: settings.channelLabel || "Official channel",
        groupLink: settings.groupLink || "https://t.me/sybotx",
        groupType: settings.groupType || "telegram",
         groupLabel: settings.groupLabel || "Discussion group",
         popupButtonLabel: settings.popupButtonLabel || "Click here to join the Telegram group",
        supportEnabled: settings.supportEnabled !== "false",
        support2Enabled: settings.support2Enabled !== "false",
        channelEnabled: settings.channelEnabled !== "false",
        groupEnabled: settings.groupEnabled !== "false",
        signupBonus: settings.signupBonus || "1000",
        minDeposit: settings.minDeposit || "3500",
        minWithdrawal: settings.minWithdrawal || "800",
        withdrawalFees: settings.withdrawalFees || "16",
        maxWithdrawalsPerDay: settings.maxWithdrawalsPerDay || "1",
        withdrawalStartHour: settings.withdrawalStartHour || "9",
        withdrawalEndHour: settings.withdrawalEndHour || "17",
        withdrawalPrepaymentEnabled: settings.withdrawalPrepaymentEnabled === "true",
        level1Commission: settings.level1Commission || "25",
        level2Commission: settings.level2Commission || "4",
        level3Commission: settings.level3Commission || "1",
        soleaspayEnabled: settings.soleaspayEnabled === "true",
        soleaspayChannelName: settings.soleaspayChannelName || "SoleaPay",
        westpayEnabled: settings.westpayEnabled === "true",
        westpayChannelName: settings.westpayChannelName || "WestPay",
        sendavapayEnabled: settings.sendavapayEnabled === "true",
        sendavapayChannelName: settings.sendavapayChannelName || "SendavaPay",
        ashtechEnabled: settings.ashtechEnabled === "true",
        ashtechChannelName: settings.ashtechChannelName || "AshtechPay",
        inpayEnabled: settings.inpayEnabled === "true",
        inpayChannelName: settings.inpayChannelName || "InPay",
        clapayEnabled: settings.clapayEnabled === "true",
        clapayChannelName: settings.clapayChannelName || "Clapay",
      });
      if (!countriesLoading && !paymentNumbersLoading) {
        setDepositMethodsByCountry(getInitialDepositRouting(settings, countries, paymentNumbers));
      }
    }
  }, [settings, form, countries, paymentNumbers, countriesLoading, paymentNumbersLoading]);

  const updateMutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      const serialized = {
        ...data,
        depositMethodsByCountry: JSON.stringify(depositMethodsByCountry),
        supportEnabled: String(data.supportEnabled),
        support2Enabled: String(data.support2Enabled),
        channelEnabled: String(data.channelEnabled),
        groupEnabled: String(data.groupEnabled),
        withdrawalPrepaymentEnabled: String(data.withdrawalPrepaymentEnabled),
        sendavapayEnabled: String(data.sendavapayEnabled),
        soleaspayEnabled: String(data.soleaspayEnabled),
        westpayEnabled: String(data.westpayEnabled),
        ashtechEnabled: String(data.ashtechEnabled),
        inpayEnabled: String(data.inpayEnabled),
        clapayEnabled: String(data.clapayEnabled),
      };
      const response = await apiRequest("POST", "/api/admin/settings", serialized);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Saving settings failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/withdrawal"] });
       toast({ title: "Settings saved!" });
    },
    onError: (error: any) => {
       toast({ title: "Unable to save settings", description: error.message, variant: "destructive" });
    },
  });

  const [inpayBalances, setInpayBalances] = useState<Record<string, string>>({});
  const inpayBalanceMutation = useMutation({
    mutationFn: async (country: string) => {
      const response = await apiRequest("GET", `/api/admin/inpay/balance/${country}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Solde InPay indisponible");
      return { country, balance: data.balance as string };
    },
    onSuccess: ({ country, balance }) => {
      setInpayBalances((current) => ({ ...current, [country]: balance }));
    },
    onError: (error: any) => {
      toast({ title: "Solde InPay indisponible", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading || countriesLoading || paymentNumbersLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">

        <Card>
          <CardHeader className="pb-2">
           <CardTitle className="text-base">Deposit methods by country</CardTitle>
            <p className="text-sm text-gray-500">
               Select the allowed methods for each country. If multiple methods are selected, the customer will choose one when depositing.
               The provider switches below are global activation controls; they do not replace this country-level configuration.
               Provider URLs, credentials, keys, and secrets remain in the Plesk environment variables.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...countries]
              .sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name))
              .map((country) => {
                const code = country.code.toUpperCase();
                const selectedMethods = new Set(depositMethodsByCountry[code] || []);
                return (
                  <div key={code} className="rounded-xl border p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{country.name} ({code})</span>
                      {!country.isActive && (
                         <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Inactive</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {DEPOSIT_METHOD_OPTIONS.map((method) => (
                        <label key={method.value} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={selectedMethods.has(method.value)}
                            onChange={(event) => {
                              setDepositMethodsByCountry((current) => {
                                const nextMethods = new Set(current[code] || []);
                                if (event.target.checked) nextMethods.add(method.value);
                                else nextMethods.delete(method.value);
                                return {
                                  ...current,
                                  [code]: DEPOSIT_METHOD_OPTIONS
                                    .map((option) => option.value)
                                    .filter((value) => nextMethods.has(value)),
                                };
                              });
                            }}
                          />
                          {method.label}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>

        {/* ── Links & Social Networks ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Link className="w-5 h-5 text-primary" />
               Links & Social Networks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Support 1 */}
            <div className="space-y-2 border rounded-xl p-3">
              <div className="flex items-center justify-between">
               <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Link 1 — Customer support</p>
                <FormField control={form.control} name="supportEnabled" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                     <FormLabel className="text-xs text-gray-500">{field.value ? "Active" : "Disabled"}</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="supportLabel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display label</FormLabel>
                    <FormControl><Input {...field} placeholder="Service client" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="supportType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Social network</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Network..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NETWORKS.map(n => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="supportLink" render={({ field }) => (
                <FormItem>
                  <FormLabel>Lien URL</FormLabel>
                  <FormControl><Input {...field} placeholder="https://t.me/..." /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Support 2 */}
            <div className="space-y-2 border rounded-xl p-3">
              <div className="flex items-center justify-between">
               <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Link 2 — Customer support</p>
                <FormField control={form.control} name="support2Enabled" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormLabel className="text-xs text-gray-500">{field.value ? "Active" : "Disabled"}</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="support2Label" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display label</FormLabel>
                    <FormControl><Input {...field} placeholder="Service client 2" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="support2Type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Social network</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Network..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NETWORKS.map(n => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="support2Link" render={({ field }) => (
                <FormItem>
                  <FormLabel>Lien URL</FormLabel>
                  <FormControl><Input {...field} placeholder="https://t.me/..." /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Channel */}
            <div className="space-y-2 border rounded-xl p-3">
              <div className="flex items-center justify-between">
               <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Link 3 — Official channel</p>
                <FormField control={form.control} name="channelEnabled" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormLabel className="text-xs text-gray-500">{field.value ? "Actif" : "Désactivé"}</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="channelLabel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Libellé affiché</FormLabel>
                    <FormControl><Input {...field} placeholder="Chaîne officielle" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="channelType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Réseau social</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Réseau..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NETWORKS.map(n => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="channelLink" render={({ field }) => (
                <FormItem>
                  <FormLabel>Lien URL</FormLabel>
                  <FormControl><Input {...field} placeholder="https://t.me/..." /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Group */}
            <div className="space-y-2 border rounded-xl p-3">
              <div className="flex items-center justify-between">
               <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Link 4 — Discussion group</p>
                <FormField control={form.control} name="groupEnabled" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormLabel className="text-xs text-gray-500">{field.value ? "Actif" : "Désactivé"}</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="groupLabel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Libellé affiché</FormLabel>
                    <FormControl><Input {...field} placeholder="Groupe de discussion" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="groupType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Réseau social</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Réseau..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NETWORKS.map(n => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="groupLink" render={({ field }) => (
                <FormItem>
                  <FormLabel>Lien URL</FormLabel>
                  <FormControl><Input {...field} placeholder="https://t.me/..." /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Popup dashboard button */}
            <div className="border border-red-500 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
               <p className="text-sm font-semibold text-red-600">Dashboard popup button</p>
              </div>
              <p className="text-xs text-muted-foreground">
                 This button appears in the warning window that opens automatically on the home page.
              </p>
              <FormField control={form.control} name="popupButtonLabel" render={({ field }) => (
                <FormItem>
                  <FormLabel>Texte du bouton <span className="text-red-500">(popup dashboard)</span></FormLabel>
                  <FormControl><Input {...field} placeholder="Ex: Cliquez ici pour rejoindre le groupe Telegram" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="groupLink" render={({ field }) => (
                <FormItem>
                  <FormLabel>Lien du bouton <span className="text-red-500">(popup dashboard)</span></FormLabel>
                  <FormControl><Input {...field} placeholder="https://t.me/..." /></FormControl>
                  <FormDescription>Ce lien est aussi utilisé dans le popup de bienvenue du tableau de bord.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

          </CardContent>
        </Card>

        {/* ── Retraits & Bonus ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
               Withdrawals & Bonuses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="signupBonus" render={({ field }) => (
              <FormItem>
                 <FormLabel>Signup bonus (PHP)</FormLabel>
                <FormControl><Input {...field} type="number" min="0" /></FormControl>
                 <FormDescription>Amount given to each new user upon signup.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="minDeposit" render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum deposit (PHP)</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="minWithdrawal" render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum withdrawal (PHP)</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="withdrawalPrepaymentEnabled" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1 pr-4">
                  <FormLabel>Prépaiement de 25 % avant retrait</FormLabel>
                  <FormDescription>
                    Lorsque cette option est activée, l'utilisateur doit payer 25 % du retrait avant de pouvoir l'envoyer.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="withdrawalFees" render={({ field }) => (
                <FormItem>
                  <FormLabel>Frais de retrait (%)</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" max="100" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="maxWithdrawalsPerDay" render={({ field }) => (
                <FormItem>
                  <FormLabel>Max retraits / jour</FormLabel>
                  <FormControl><Input {...field} type="number" min="1" max="10" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="withdrawalStartHour" render={({ field }) => (
                <FormItem>
                  <FormLabel>Heure début retraits</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" max="23" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="withdrawalEndHour" render={({ field }) => (
                <FormItem>
                  <FormLabel>Heure fin retraits</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" max="23" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        {/* ── Commissions ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Commissions de parrainage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="level1Commission" render={({ field }) => (
                <FormItem>
                  <FormLabel>Niveau 1 (%)</FormLabel>
                  <FormControl><Input {...field} type="number" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="level2Commission" render={({ field }) => (
                <FormItem>
                  <FormLabel>Niveau 2 (%)</FormLabel>
                  <FormControl><Input {...field} type="number" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="level3Commission" render={({ field }) => (
                <FormItem>
                  <FormLabel>Niveau 3 (%)</FormLabel>
                  <FormControl><Input {...field} type="number" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        {/* ── SendavaPay ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              SendavaPay — Paiement automatique
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Activer SendavaPay</p>
                <p className="text-xs text-gray-500">Affiche l'option de paiement automatique Mobile Money</p>
              </div>
              <FormField control={form.control} name="sendavapayEnabled" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel className="text-xs text-gray-500">{field.value ? "Actif" : "Désactivé"}</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="sendavapayChannelName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du canal affiché</FormLabel>
                <FormControl><Input {...field} placeholder="SendavaPay" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 text-xs text-orange-700 space-y-1">
              <p className="font-semibold">Variables requises dans Plesk :</p>
              <p><code className="bg-orange-100 px-1 rounded">SENDAVAPAY_API_BASE_URL</code> — URL API fournie par SendavaPay</p>
              <p><code className="bg-orange-100 px-1 rounded">SENDAVAPAY_API_KEY</code> — clé SDK (commence par <code className="bg-orange-100 px-1 rounded">sdk_</code>)</p>
              <p><code className="bg-orange-100 px-1 rounded">SENDAVAPAY_WEBHOOK_SECRET</code> — secret de signature du webhook</p>
              <p>Définissez <code className="bg-orange-100 px-1 rounded">PUBLIC_APP_URL</code> en HTTPS et configurez l'URL webhook : <code className="bg-orange-100 px-1 rounded">/api/webhooks/sendavapay</code></p>
            </div>
          </CardContent>
        </Card>

        {/* ── SoleaPay ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              SoleaPay — Dépôts Mobile Money
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Activer SoleaPay</p>
                <p className="text-xs text-gray-500">Dépôts directs avec confirmation par vérification du paiement</p>
              </div>
              <FormField control={form.control} name="soleaspayEnabled" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel className="text-xs text-gray-500">{field.value ? "Actif" : "Désactivé"}</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="soleaspayChannelName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du canal affiché</FormLabel>
                <FormControl><Input {...field} placeholder="SoleaPay" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="rounded-xl bg-purple-50 border border-purple-100 p-3 text-xs text-purple-800 space-y-1">
              <p className="font-semibold">Variables d’environnement Plesk :</p>
              <p><code className="bg-purple-100 px-1 rounded">SOLEASPAY_API_BASE_URL</code> — URL API SoleaPay fournie par le prestataire.</p>
              <p><code className="bg-purple-100 px-1 rounded">SOLEASPAY_API_KEY</code> — clé API SoleaPay.</p>
              <p>Définissez aussi <code className="bg-purple-100 px-1 rounded">PUBLIC_APP_URL</code> sur l’URL HTTPS publique de l’application.</p>
              <p>Les retraits SoleaPay ne sont pas raccordés. URL de vérification : <code className="bg-purple-100 px-1 rounded">/api/deposits/:id/verify</code>.</p>
            </div>
          </CardContent>
        </Card>

        {/* ── WestPay ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              WestPay — Page de paiement hébergée
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Activer WestPay</p>
                <p className="text-xs text-gray-500">Affiche l'option de paiement WestPay (Mobile Money par redirection)</p>
              </div>
              <FormField control={form.control} name="westpayEnabled" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel className="text-xs text-gray-500">{field.value ? "Actif" : "Désactivé"}</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="westpayChannelName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du canal affiché</FormLabel>
                <FormControl><Input {...field} placeholder="WestPay" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 text-xs text-orange-700 space-y-1">
              <p className="font-semibold">Variables requises dans Plesk :</p>
              <p>• <code className="bg-orange-100 px-1 rounded">WESTPAY_API_BASE_URL</code> — URL de l’API marchande</p>
              <p>• <code className="bg-orange-100 px-1 rounded">WESTPAY_CHECKOUT_BASE_URL</code> — URL de la page de paiement hébergée</p>
              <p>• <code className="bg-orange-100 px-1 rounded">WESTPAY_MERCHANT_SLUG</code> — votre identifiant marchand WestPay</p>
              <p>• <code className="bg-orange-100 px-1 rounded">WESTPAY_WEBHOOK_SECRET</code> — vérification des confirmations de paiement</p>
              <p>• Pour les retraits : <code className="bg-orange-100 px-1 rounded">WESTPAY_API_KEY_&lt;PAYS&gt;</code></p>
              <p>• URL webhook à configurer dans votre compte WestPay : <code className="bg-orange-100 px-1 rounded">/api/webhooks/westpay</code></p>
              <p className="font-semibold text-red-600 mt-1">Ne saisissez jamais ces valeurs dans ce formulaire ou en base de données.</p>
            </div>
          </CardContent>
        </Card>

        {/* ── InPay ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              InPay — Paiements et retraits par pays
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Activer InPay</p>
                <p className="text-xs text-gray-500">Redirection de paiement et envoi des retraits vers InPay</p>
              </div>
              <FormField control={form.control} name="inpayEnabled" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel className="text-xs text-gray-500">{field.value ? "Actif" : "Désactivé"}</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="inpayChannelName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du canal affiché</FormLabel>
                <FormControl><Input {...field} placeholder="InPay" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-800">Soldes par pays</p>
              {countries.map(({ code, name }) => {
                const country = code.toUpperCase();
                return (
                  <div key={country} className="space-y-1">
                    <p className="text-xs font-medium">
                      {name} ({country})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Identifiants chargés depuis Plesk : <code>INPAY_MERCHANT_ID_{country}</code> et <code>INPAY_API_KEY_{country}</code>
                    </p>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => inpayBalanceMutation.mutate(country)}
                        disabled={inpayBalanceMutation.isPending}
                      >
                        {inpayBalanceMutation.isPending && inpayBalanceMutation.variables === country
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : "Solde"}
                      </Button>
                    </div>
                    {inpayBalances[country] !== undefined && (
                      <p className="text-xs text-blue-700">Solde InPay : {inpayBalances[country]}</p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800 space-y-1">
              <p className="font-semibold">Variables d’environnement Plesk InPay :</p>
              <p>• <code className="bg-blue-100 px-1 rounded">INPAY_API_BASE_URL</code> — URL de base fournie par InPay</p>
              <p>• <code className="bg-blue-100 px-1 rounded">INPAY_MERCHANT_ID_&lt;PAYS&gt;</code> — identifiant marchand pour chaque pays activé</p>
              <p>• <code className="bg-blue-100 px-1 rounded">INPAY_API_KEY_&lt;PAYS&gt;</code> — clé API pour chaque pays activé</p>
              <p>• URL webhook InPay : <code className="bg-blue-100 px-1 rounded">/api/webhooks/inpay</code></p>
              <p>Les identifiants marchands et toutes les clés API sont lus uniquement depuis les variables Plesk, jamais depuis les paramètres administrateur.</p>
            </div>
          </CardContent>
        </Card>

        {/* ── AshtechPay ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              AshtechPay — Mobile Money, OTP & Wave
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Activer AshtechPay</p>
                <p className="text-xs text-gray-500">Affiche le paiement direct par USSD, OTP SMS et Wave</p>
              </div>
              <FormField control={form.control} name="ashtechEnabled" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel className="text-xs text-gray-500">{field.value ? "Actif" : "Désactivé"}</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="ashtechChannelName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du canal affiché</FormLabel>
                <FormControl><Input {...field} placeholder="AshtechPay" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-xs text-green-800 space-y-1">
              <p className="font-semibold">Variables d’environnement Plesk :</p>
              <p>Ajoutez <code className="bg-green-100 px-1 rounded">ASHTECHPAY_API_BASE_URL</code>, <code className="bg-green-100 px-1 rounded">ASHTECHPAY_API_KEY</code> et <code className="bg-green-100 px-1 rounded">ASHTECHPAY_WEBHOOK_SECRET</code> sur le serveur.</p>
              <p>La clé API n'est jamais enregistrée dans les paramètres ni affichée dans ce formulaire.</p>
              <p>URL de notification à configurer chez AshtechPay : <code className="bg-green-100 px-1 rounded">/api/webhooks/ashtechpay</code>. Le statut est confirmé par interrogation sécurisée de l'API.</p>
            </div>
          </CardContent>
        </Card>

        {/* ── Clapay ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600" />
              Clapay — Dépôts Mobile Money
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Activer Clapay</p>
                <p className="text-xs text-gray-500">Affiche Clapay uniquement dans les pays cochés dans le routage ci-dessus.</p>
              </div>
              <FormField control={form.control} name="clapayEnabled" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel className="text-xs text-gray-500">{field.value ? "Actif" : "Désactivé"}</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="clapayChannelName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du canal affiché</FormLabel>
                <FormControl><Input {...field} placeholder="Clapay" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-900 space-y-1">
              <p className="font-semibold">Configuration Clapay dans les variables d’environnement Plesk</p>
              <p>Base officielle : <code>https://nw-api.clapay.app/nowallet/api/v3</code> (ou <code>/nowallet/api</code>). Définissez <code>CLAPAY_API_KEY</code>; <code>CLAPAY_API_BASE_URL</code> est facultative et utilise la base V3 par défaut.</p>
              <p>Authentification documentée : <code>Authorization: Bearer</code>. Les overrides <code>CLAPAY_API_KEY_HEADER</code> et <code>CLAPAY_API_KEY_PREFIX</code> sont facultatifs.</p>
              <p>Routes par défaut : <code>POST init/payment</code>, <code>POST check/status/payment</code> avec <code>{"{{signature}}"}</code>, et <code>GET operators/data?country=CI</code>. La requête de paiement utilise <code>MERCHANT</code>, <code>API</code> et le code opérateur Clapay. Les modèles et chemins peuvent être surchargés par les variables <code>CLAPAY_INITIATE_*</code>, <code>CLAPAY_STATUS_*</code> et <code>CLAPAY_OPERATORS_*</code>.</p>
              <p>Webhook signé requis : configurez <code>CLAPAY_WEBHOOK_SECRET</code> et <code>CLAPAY_WEBHOOK_UNIQUE_KEY</code> depuis le tableau de bord Clapay. L’URL de base publique vient de <code>PUBLIC_APP_URL</code> ou de l’hôte HTTPS transmis par Plesk; le callback est <code>/api/clapay/webhook</code> et le retour rouvre <code>/robotpay</code>.</p>
              <p>Par défaut, seul le statut serveur <code>SUCCESSFUL</code> crédite un dépôt; <code>FAILED</code> et <code>SIGNATURE_DESTROYED</code> le refusent. Les autres statuts restent en attente. Les variables <code>CLAPAY_STATUS_SUCCESS_VALUES</code> et <code>CLAPAY_STATUS_FAILURE_VALUES</code> peuvent remplacer ces valeurs selon le contrat marchand. Le webhook et le retour navigateur ne suffisent jamais à confirmer un paiement.</p>
              <p>Pour personnaliser le modèle d’initiation, les marqueurs disponibles sont <code>{"{{amount}}"}</code>, <code>{"{{country}}"}</code>, <code>{"{{operator}}"}</code>, <code>{"{{operatorId}}"}</code>, <code>{"{{operatorName}}"}</code>, <code>{"{{operatorOtp}}"}</code> (facultatif), <code>{"{{phone}}"}</code>, <code>{"{{accountNumber}}"}</code>, <code>{"{{accountName}}"}</code>, <code>{"{{accountFirstName}}"}</code>, <code>{"{{accountLastName}}"}</code>, <code>{"{{accountEmail}}"}</code>, <code>{"{{reference}}"}</code>, <code>{"{{depositId}}"}</code>, <code>{"{{callbackUrl}}"}</code>, <code>{"{{returnUrl}}"}</code> et <code>{"{{signature}}"}</code>. Ne mettez pas les identifiants dans ces modèles.</p>
            </div>
          </CardContent>
        </Card>

        {/* ── OmniPay ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-gray-500" />
              OmniPay — Non raccordé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 space-y-1">
              <p className="font-semibold">Visible, mais pas opérationnel</p>
              <p>Le module OmniPay est présent dans le projet, mais aucun parcours de dépôt ou de retrait ne l'appelle. Il n'y a donc pas de bouton d'activation pour éviter d'afficher une option qui ne peut pas traiter les paiements.</p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer les paramètres
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
