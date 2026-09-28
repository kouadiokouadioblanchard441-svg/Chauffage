import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";

interface RulesModalProps {
  open: boolean;
  onClose: () => void;
}

export default function RulesModal({ open, onClose }: RulesModalProps) {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const signupBonus = settings?.signupBonus || "1000";
  const minDeposit = settings?.minDeposit || "3500";
  const minWithdrawal = settings?.minWithdrawal || "800";
  const withdrawalFees = settings?.withdrawalFees || "16";
  const withdrawalStartHour = settings?.withdrawalStartHour || "9";
  const withdrawalEndHour = settings?.withdrawalEndHour || "17";
  const maxWithdrawalsPerDay = settings?.maxWithdrawalsPerDay || "1";
  const lv1 = settings?.level1Commission || "25";
  const lv2 = settings?.level2Commission || "4";
  const lv3 = settings?.level3Commission || "1";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Platform rules</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm text-muted-foreground">
            <section>
              <h4 className="font-medium text-foreground mb-2">1. Deposits</h4>
              <ul className="space-y-1">
                <li>- Minimum amount: {parseInt(minDeposit).toLocaleString("en-US")} PHP</li>
                <li>- Deposits are processed as quickly as possible</li>
                <li>- Make sure your payment information is correct</li>
              </ul>
            </section>

            <section>
              <h4 className="font-medium text-foreground mb-2">2. Withdrawals</h4>
              <ul className="space-y-1">
                <li>- Minimum amount: {parseInt(minWithdrawal).toLocaleString("en-US")} PHP</li>
                <li>- Withdrawal fee: {withdrawalFees}%</li>
                <li>- Hours: {withdrawalStartHour}:00 - {withdrawalEndHour}:00</li>
                <li>- Maximum {maxWithdrawalsPerDay} withdrawal(s) per day</li>
                <li>- An active product is required to withdraw</li>
                <li>- A withdrawal wallet must be registered</li>
              </ul>
            </section>

            <section>
              <h4 className="font-medium text-foreground mb-2">3. Products</h4>
              <ul className="space-y-1">
                <li>- Minimum purchase amount: 4,500 PHP</li>
                <li>- Cycle standard : 80 jours</li>
                <li>- Automatic daily earnings</li>
                <li>- Earnings are credited 24 hours after purchase</li>
                <li>- Free product: claim 50 PHP/day</li>
              </ul>
            </section>

            <section>
              <h4 className="font-medium text-foreground mb-2">4. Referrals</h4>
              <ul className="space-y-1">
                <li>- Level 1: {lv1}% commission</li>
                <li>- Level 2: {lv2}% commission</li>
                <li>- Level 3: {lv3}% commission</li>
                <li>- Commissions on product purchases</li>
              </ul>
            </section>

            <section>
              <h4 className="font-medium text-foreground mb-2">5. Signup bonus</h4>
              <p>Each new member receives a {parseInt(signupBonus).toLocaleString("en-US")} PHP signup bonus.</p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
