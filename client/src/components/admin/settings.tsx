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
  support2Link: z.string().min(5, "Link is required"),
  support2Type: z.string().min(1, "Network is required"),
  support2Label: z.string().min(1, "Label is required"),
  channelLink: z.string().min(5, "Link is required"),
  channelType: z.string().min(1, "Network is required"),
  channelLabel: z.string().min(1, "Label is required"),
  groupLink: z.string().min(5, "Link is required"),
  groupType: z.string().min(1, "Network is required"),
  groupLabel: z.string().min(1, "Label is required"),
  popupButtonLabel: z.string().min(1, "Label is required"),
  supportEnabled: z.boolean(),
  support2Enabled: z.boolean(),
  channelEnabled: z.boolean(),
  groupEnabled: z.boolean(),
  minDeposit: z.string().min(1, "Amount is required"),
  minWithdrawal: z.string().min(1, "Amount is required"),
  withdrawalFees: z.string().min(1, "Fees are required"),
  maxWithdrawalsPerDay: z.string().min(1, "Required"),
  withdrawalStartHour: z.string().min(1, "Start hour is required"),
  withdrawalEndHour: z.string().min(1, "End hour is required"),
  withdrawalPrepaymentEnabled: z.boolean(),
  level1Commission: z.string().min(1, "Commission is required"),
  level2Commission: z.string().min(1, "Commission is required"),
  level3Commission: z.string().min(1, "Commission is required"),
  sendavapayEnabled: z.boolean(),
  sendavapayChannelName: z.string().min(1, "Name is required"),
  soleaspayEnabled: z.boolean(),
  soleaspayChannelName: z.string().min(1, "Name is required"),
  westpayEnabled: z.boolean(),
  westpayChannelName: z.string().min(1, "Name is required"),
  ashtechEnabled: z.boolean(),
  ashtechChannelName: z.string().min(1, "Name is required"),
  inpayEnabled: z.boolean(),
  inpayChannelName: z.string().min(1, "Name is required"),
  clapayEnabled: z.boolean(),
  clapayChannelName: z.string().min(1, "Name is required"),
  cloudpayEnabled: z.boolean(),
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

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
       defaultValues: {
      supportLink: "https://t.me/sybotx",
      supportType: "telegram",
       supportLabel: "Customer support",
      support2Link: "https://t.me/sybotx",
      support2Type: "telegram",
       support2Label: "Customer support 2",
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
       minDeposit: "200",
      minWithdrawal: "60",
      withdrawalFees: "16",
      maxWithdrawalsPerDay: "3",
      withdrawalStartHour: "0",
      withdrawalEndHour: "24",
      withdrawalPrepaymentEnabled: false,
      level1Commission: "25",
      level2Commission: "3",
      level3Commission: "2",
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
       cloudpayEnabled: false,
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
         support2Label: settings.support2Label || "Customer support 2",
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
         minDeposit: settings.minDeposit || "200",
        minWithdrawal: settings.minWithdrawal || "60",
        withdrawalFees: settings.withdrawalFees || "16",
        maxWithdrawalsPerDay: settings.maxWithdrawalsPerDay || "3",
        withdrawalStartHour: settings.withdrawalStartHour || "0",
        withdrawalEndHour: settings.withdrawalEndHour || "24",
        withdrawalPrepaymentEnabled: settings.withdrawalPrepaymentEnabled === "true",
        level1Commission: settings.level1Commission || "25",
        level2Commission: settings.level2Commission || "3",
        level3Commission: settings.level3Commission || "2",
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
        cloudpayEnabled: settings.cloudpayEnabled === "true",
      });
    }
  }, [settings, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      const serialized = {
        ...data,
        depositMethodsByCountry: JSON.stringify({
          PH: data.cloudpayEnabled ? ["cloudpay"] : [],
        }),
        supportEnabled: String(data.supportEnabled),
        support2Enabled: String(data.support2Enabled),
        channelEnabled: String(data.channelEnabled),
        groupEnabled: String(data.groupEnabled),
        withdrawalPrepaymentEnabled: String(data.withdrawalPrepaymentEnabled),
        sendavapayEnabled: "false",
        soleaspayEnabled: "false",
        westpayEnabled: "false",
        ashtechEnabled: "false",
        inpayEnabled: "false",
        clapayEnabled: "false",
        cloudpayEnabled: String(data.cloudpayEnabled),
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
      if (!response.ok) throw new Error(data.message || "InPay balance unavailable");
      return { country, balance: data.balance as string };
    },
    onSuccess: ({ country, balance }) => {
      setInpayBalances((current) => ({ ...current, [country]: balance }));
    },
    onError: (error: any) => {
      toast({ title: "InPay balance unavailable", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading || countriesLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Deposit routing</CardTitle>
            <p className="text-sm text-gray-500">
              New deposits use CloudPay / Galaxy only, and only for Philippines accounts. Older payment records and callback handlers remain available for reconciliation.
            </p>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm text-orange-900">
              Philippines bank and e-wallet deposits are routed automatically through CloudPay / Galaxy. No other gateway or manual payment option can be enabled here.
            </div>
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
                    <FormControl><Input {...field} placeholder="Customer support" /></FormControl>
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
                  <FormLabel>URL link</FormLabel>
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
                    <FormControl><Input {...field} placeholder="Customer support 2" /></FormControl>
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
                  <FormLabel>URL link</FormLabel>
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
                    <FormLabel className="text-xs text-gray-500">{field.value ? "Active" : "Disabled"}</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="channelLabel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display label</FormLabel>
                    <FormControl><Input {...field} placeholder="Official channel" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="channelType" render={({ field }) => (
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
              <FormField control={form.control} name="channelLink" render={({ field }) => (
                <FormItem>
                  <FormLabel>URL link</FormLabel>
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
                    <FormLabel className="text-xs text-gray-500">{field.value ? "Active" : "Disabled"}</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="groupLabel" render={({ field }) => (
                  <FormItem>
                  <FormLabel>Display label</FormLabel>
                    <FormControl><Input {...field} placeholder="Groupe de discussion" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="groupType" render={({ field }) => (
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
              <FormField control={form.control} name="groupLink" render={({ field }) => (
                <FormItem>
                  <FormLabel>URL link</FormLabel>
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
                  <FormLabel>Button text <span className="text-red-500">(dashboard popup)</span></FormLabel>
                  <FormControl><Input {...field} placeholder="E.g.: Click here to join the Telegram group" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="groupLink" render={({ field }) => (
                <FormItem>
                  <FormLabel>Button link <span className="text-red-500">(dashboard popup)</span></FormLabel>
                  <FormControl><Input {...field} placeholder="https://t.me/..." /></FormControl>
                  <FormDescription>This link is also used in the dashboard welcome popup.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

          </CardContent>
        </Card>

          {/* ── Withdrawal rules ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
                Withdrawal rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="minDeposit" render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum deposit (PHP)</FormLabel>
                  <FormControl><Input {...field} type="number" min="200" step="1" /></FormControl>
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
                  <FormLabel>25% prepayment before withdrawal</FormLabel>
                  <FormDescription>
                    When enabled, the user must pay 25% of the withdrawal before submitting it.
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
                  <FormLabel>Withdrawal fees (%)</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" max="100" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="maxWithdrawalsPerDay" render={({ field }) => (
                <FormItem>
                  <FormLabel>Max withdrawals / day</FormLabel>
                  <FormControl><Input {...field} type="number" min="1" max="10" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="withdrawalStartHour" render={({ field }) => (
                <FormItem>
                  <FormLabel>Withdrawal start hour</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" max="23" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="withdrawalEndHour" render={({ field }) => (
                <FormItem>
                  <FormLabel>Withdrawal end hour</FormLabel>
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
              Referral commissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="level1Commission" render={({ field }) => (
                <FormItem>
                  <FormLabel>Level 1 (%)</FormLabel>
                  <FormControl><Input {...field} type="number" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="level2Commission" render={({ field }) => (
                <FormItem>
                  <FormLabel>Level 2 (%)</FormLabel>
                  <FormControl><Input {...field} type="number" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="level3Commission" render={({ field }) => (
                <FormItem>
                  <FormLabel>Level 3 (%)</FormLabel>
                  <FormControl><Input {...field} type="number" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        {false && (
          <>
        {/* ── SendavaPay ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              SendavaPay — Automatic payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Enable SendavaPay</p>
                <p className="text-xs text-gray-500">Show the automatic Mobile Money payment option</p>
              </div>
              <FormField control={form.control} name="sendavapayEnabled" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel className="text-xs text-gray-500">{field.value ? "Active" : "Disabled"}</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="sendavapayChannelName" render={({ field }) => (
              <FormItem>
                <FormLabel>Displayed channel name</FormLabel>
                <FormControl><Input {...field} placeholder="SendavaPay" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 text-xs text-orange-700 space-y-1">
              <p className="font-semibold">Required Plesk variables:</p>
              <p><code className="bg-orange-100 px-1 rounded">SENDAVAPAY_API_BASE_URL</code> — SendavaPay API URL</p>
              <p><code className="bg-orange-100 px-1 rounded">SENDAVAPAY_API_KEY</code> — SDK key (starts with <code className="bg-orange-100 px-1 rounded">sdk_</code>)</p>
              <p><code className="bg-orange-100 px-1 rounded">SENDAVAPAY_WEBHOOK_SECRET</code> — webhook signing secret</p>
              <p>Set <code className="bg-orange-100 px-1 rounded">PUBLIC_APP_URL</code> to HTTPS and configure the webhook URL: <code className="bg-orange-100 px-1 rounded">/api/webhooks/sendavapay</code></p>
            </div>
          </CardContent>
        </Card>

        {/* ── SoleaPay ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              SoleaPay — Mobile Money deposits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Enable SoleaPay</p>
                <p className="text-xs text-gray-500">Direct deposits with payment verification</p>
              </div>
              <FormField control={form.control} name="soleaspayEnabled" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel className="text-xs text-gray-500">{field.value ? "Active" : "Disabled"}</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="soleaspayChannelName" render={({ field }) => (
              <FormItem>
                <FormLabel>Displayed channel name</FormLabel>
                <FormControl><Input {...field} placeholder="SoleaPay" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="rounded-xl bg-purple-50 border border-purple-100 p-3 text-xs text-purple-800 space-y-1">
              <p className="font-semibold">Plesk environment variables:</p>
              <p><code className="bg-purple-100 px-1 rounded">SOLEASPAY_API_BASE_URL</code> — SoleaPay API URL provided by the provider.</p>
              <p><code className="bg-purple-100 px-1 rounded">SOLEASPAY_API_KEY</code> — SoleaPay API key.</p>
              <p>Also set <code className="bg-purple-100 px-1 rounded">PUBLIC_APP_URL</code> to the app's public HTTPS URL.</p>
              <p>SoleaPay withdrawals are not connected. Verification URL: <code className="bg-purple-100 px-1 rounded">/api/deposits/:id/verify</code>.</p>
            </div>
          </CardContent>
        </Card>

        {/* ── WestPay ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              WestPay — Hosted payment page
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Enable WestPay</p>
                <p className="text-xs text-gray-500">Shows the WestPay payment option (Mobile Money by redirect)</p>
              </div>
              <FormField control={form.control} name="westpayEnabled" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel className="text-xs text-gray-500">{field.value ? "Active" : "Disabled"}</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="westpayChannelName" render={({ field }) => (
              <FormItem>
                <FormLabel>Displayed channel name</FormLabel>
                <FormControl><Input {...field} placeholder="WestPay" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 text-xs text-orange-700 space-y-1">
              <p className="font-semibold">Required Plesk variables:</p>
              <p>• <code className="bg-orange-100 px-1 rounded">WESTPAY_API_BASE_URL</code> — merchant API URL</p>
              <p>• <code className="bg-orange-100 px-1 rounded">WESTPAY_CHECKOUT_BASE_URL</code> — hosted payment page URL</p>
              <p>• <code className="bg-orange-100 px-1 rounded">WESTPAY_MERCHANT_SLUG</code> — your WestPay merchant identifier</p>
              <p>• <code className="bg-orange-100 px-1 rounded">WESTPAY_WEBHOOK_SECRET</code> — payment confirmation verification</p>
              <p>• For withdrawals: <code className="bg-orange-100 px-1 rounded">WESTPAY_API_KEY_&lt;COUNTRY&gt;</code></p>
              <p>• Webhook URL to configure in your WestPay account: <code className="bg-orange-100 px-1 rounded">/api/webhooks/westpay</code></p>
              <p className="font-semibold text-red-600 mt-1">Never enter these values in this form or in the database.</p>
            </div>
          </CardContent>
        </Card>

        {/* ── InPay ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              InPay — Country payments and withdrawals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Enable InPay</p>
                <p className="text-xs text-gray-500">Payment redirect and withdrawal submission through InPay</p>
              </div>
              <FormField control={form.control} name="inpayEnabled" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel className="text-xs text-gray-500">{field.value ? "Active" : "Disabled"}</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="inpayChannelName" render={({ field }) => (
              <FormItem>
                <FormLabel>Displayed channel name</FormLabel>
                <FormControl><Input {...field} placeholder="InPay" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="space-y-2">
               <p className="text-sm font-semibold text-gray-800">Balances by country</p>
              {countries.map(({ code, name }) => {
                const country = code.toUpperCase();
                return (
                  <div key={country} className="space-y-1">
                    <p className="text-xs font-medium">
                      {name} ({country})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Credentials loaded from Plesk: <code>INPAY_MERCHANT_ID_{country}</code> and <code>INPAY_API_KEY_{country}</code>
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
                         : "Balance"}
                      </Button>
                    </div>
                    {inpayBalances[country] !== undefined && (
                       <p className="text-xs text-blue-700">InPay balance: {inpayBalances[country]}</p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800 space-y-1">
              <p className="font-semibold">Plesk InPay environment variables:</p>
              <p>• <code className="bg-blue-100 px-1 rounded">INPAY_API_BASE_URL</code> — base URL provided by InPay</p>
              <p>• <code className="bg-blue-100 px-1 rounded">INPAY_MERCHANT_ID_&lt;COUNTRY&gt;</code> — merchant ID for each enabled country</p>
              <p>• <code className="bg-blue-100 px-1 rounded">INPAY_API_KEY_&lt;COUNTRY&gt;</code> — API key for each enabled country</p>
              <p>• URL webhook InPay : <code className="bg-blue-100 px-1 rounded">/api/webhooks/inpay</code></p>
              <p>Merchant IDs and all API keys are read only from Plesk variables, never from admin settings.</p>
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
                <p className="text-sm font-semibold text-gray-800">Enable AshtechPay</p>
                <p className="text-xs text-gray-500">Shows direct payment by USSD, SMS OTP, and Wave</p>
              </div>
              <FormField control={form.control} name="ashtechEnabled" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel className="text-xs text-gray-500">{field.value ? "Active" : "Disabled"}</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="ashtechChannelName" render={({ field }) => (
              <FormItem>
                <FormLabel>Displayed channel name</FormLabel>
                <FormControl><Input {...field} placeholder="AshtechPay" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-xs text-green-800 space-y-1">
              <p className="font-semibold">Plesk environment variables:</p>
              <p>Add <code className="bg-green-100 px-1 rounded">ASHTECHPAY_API_BASE_URL</code>, <code className="bg-green-100 px-1 rounded">ASHTECHPAY_API_KEY</code>, and <code className="bg-green-100 px-1 rounded">ASHTECHPAY_WEBHOOK_SECRET</code> to the server.</p>
              <p>The API key is never stored in settings or displayed in this form.</p>
              <p>Notification URL to configure at AshtechPay: <code className="bg-green-100 px-1 rounded">/api/webhooks/ashtechpay</code>. Status is confirmed by securely querying the API.</p>
            </div>
          </CardContent>
        </Card>

        {/* ── Clapay ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600" />
               Clapay — Mobile Money deposits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Enable Clapay</p>
                <p className="text-xs text-gray-500">Shows Clapay only in countries selected in the routing above.</p>
              </div>
              <FormField control={form.control} name="clapayEnabled" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel className="text-xs text-gray-500">{field.value ? "Active" : "Disabled"}</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="clapayChannelName" render={({ field }) => (
              <FormItem>
                <FormLabel>Displayed channel name</FormLabel>
                <FormControl><Input {...field} placeholder="Clapay" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-900 space-y-1">
              <p className="font-semibold">Clapay configuration in Plesk environment variables</p>
              <p>Official base: <code>https://nw-api.clapay.app/nowallet/api/v3</code> (or <code>/nowallet/api</code>). Set <code>CLAPAY_API_KEY</code>; <code>CLAPAY_API_BASE_URL</code> is optional and uses the V3 base by default.</p>
              <p>Documented authentication: <code>Authorization: Bearer</code>. The <code>CLAPAY_API_KEY_HEADER</code> and <code>CLAPAY_API_KEY_PREFIX</code> overrides are optional.</p>
              <p>Default routes: <code>POST init/payment</code>, <code>POST check/status/payment</code> with <code>{"{{signature}}"}</code>, and <code>GET operators/data?country=CI</code>. The payment request uses <code>MERCHANT</code>, <code>API</code>, and the Clapay operator code. Templates and paths can be overridden by <code>CLAPAY_INITIATE_*</code>, <code>CLAPAY_STATUS_*</code>, and <code>CLAPAY_OPERATORS_*</code> variables.</p>
              <p>Signed webhook required: configure <code>CLAPAY_WEBHOOK_SECRET</code> and <code>CLAPAY_WEBHOOK_UNIQUE_KEY</code> from the Clapay dashboard. The public base URL comes from <code>PUBLIC_APP_URL</code> or the HTTPS host supplied by Plesk; the callback is <code>/api/clapay/webhook</code> and the return opens <code>/robotpay</code>.</p>
              <p>By default, only the server status <code>SUCCESSFUL</code> credits a deposit; <code>FAILED</code> and <code>SIGNATURE_DESTROYED</code> reject it. Other statuses remain pending. The <code>CLAPAY_STATUS_SUCCESS_VALUES</code> and <code>CLAPAY_STATUS_FAILURE_VALUES</code> variables can replace these values according to the merchant agreement. The webhook and browser return alone never confirm a payment.</p>
              <p>To customize the initiation template, available markers are <code>{"{{amount}}"}</code>, <code>{"{{country}}"}</code>, <code>{"{{operator}}"}</code>, <code>{"{{operatorId}}"}</code>, <code>{"{{operatorName}}"}</code>, <code>{"{{operatorOtp}}"}</code> (optional), <code>{"{{phone}}"}</code>, <code>{"{{accountNumber}}"}</code>, <code>{"{{accountName}}"}</code>, <code>{"{{accountFirstName}}"}</code>, <code>{"{{accountLastName}}"}</code>, <code>{"{{accountEmail}}"}</code>, <code>{"{{reference}}"}</code>, <code>{"{{depositId}}"}</code>, <code>{"{{callbackUrl}}"}</code>, <code>{"{{returnUrl}}"}</code>, and <code>{"{{signature}}"}</code>. Do not put credentials in these templates.</p>
            </div>
          </CardContent>
        </Card>

          </>
        )}

        {/* ── CloudPay / Galaxy ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-600" />
              CloudPay / Galaxy — Philippines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Enable CloudPay / Galaxy</p>
                <p className="text-xs text-gray-500">Enables Philippines deposits and CloudPay withdrawals.</p>
              </div>
              <FormField control={form.control} name="cloudpayEnabled" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel className="text-xs text-gray-500">{field.value ? "Active" : "Disabled"}</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>
            <div className={`rounded-xl border p-3 text-xs space-y-1 ${
              settings?.cloudpayConfigured === "true"
                ? "border-green-100 bg-green-50 text-green-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}>
              <p className="font-semibold">
                {settings?.cloudpayConfigured === "true" ? "Server configuration is complete" : "Server configuration is incomplete"}
              </p>
              <p>Use the merchant-assigned <code>CLOUDPAY_MERCHANT_ID</code> and a newly issued <code>CLOUDPAY_SIGNING_SECRET</code> stored in Replit Secrets. Do not reuse the key previously posted in chat or paste credentials into this settings page. If production runs on Plesk, configure the rotated secret there separately.</p>
              <p>Galaxy-confirmed deposit methods: <code>1</code> GoTyme QRPH (<code>got</code>), <code>3</code> PayMaya Direct (<code>PMP</code>), and <code>7</code> GCash H5 QRPH (<code>mya</code>). The gateway receives the matching payment type and bank code for the selected method. Code <code>2</code> is approved on the account but is not exposed until Galaxy supplies its bank-code mapping. The account currency is PHP.</p>
              <p><code>CLOUDPAY_API_BASE_URL</code> must be the exact HTTPS gateway host assigned by Galaxy; the guide uses a placeholder. Configure callback <code>/api/webhooks/cloudpay</code>. CloudPay remains blocked until the replacement secret is stored, Galaxy confirms the active deposit path, any required production egress-IP allowlisting is complete, and live activation is explicitly approved. Code <code>2</code> stays unavailable until its bank-code mapping is supplied.</p>
            </div>
          </CardContent>
        </Card>

        {false && (
          <>
        {/* ── OmniPay ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-gray-500" />
               OmniPay — Not connected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 space-y-1">
               <p className="font-semibold">Visible, but not operational</p>
               <p>The OmniPay module is present in the project, but no deposit or withdrawal flow uses it. There is no activation button to avoid showing an option that cannot process payments.</p>
            </div>
          </CardContent>
        </Card>
          </>
        )}

        <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
               Save settings
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
