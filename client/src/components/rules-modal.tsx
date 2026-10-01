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
  const { data: products = [] } = useQuery<Array<{
    price: number;
    dailyEarnings: number;
    cycleDays: number;
    isFree: boolean;
    isActive: boolean;
  }>>({
    queryKey: ["/api/products"],
  });

  const minDeposit = settings?.minDeposit || "200";
  const minWithdrawal = settings?.minWithdrawal || "60";
  const withdrawalFees = settings?.withdrawalFees || "16";
  const withdrawalStartHour = settings?.withdrawalStartHour || "0";
  const withdrawalEndHour = settings?.withdrawalEndHour || "24";
  const maxWithdrawalsPerDay = settings?.maxWithdrawalsPerDay || "3";
  const lv1 = settings?.level1Commission || "25";
  const lv2 = settings?.level2Commission || "3";
  const lv3 = settings?.level3Commission || "2";
  const activePaidProducts = products.filter((product) => product.isActive && !product.isFree);
  const minimumProductPrice = activePaidProducts.length
    ? Math.min(...activePaidProducts.map((product) => product.price))
    : null;
  const cycleLengths = Array.from(new Set(activePaidProducts.map((product) => product.cycleDays))).sort((a, b) => a - b);
  const activeFreeProducts = products.filter((product) => product.isActive && product.isFree);

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
                <li>- Hours: {String(withdrawalStartHour).padStart(2, "0")}:00 - {String(withdrawalEndHour).padStart(2, "0")}:00</li>
                <li>- Maximum {maxWithdrawalsPerDay} withdrawal(s) per day</li>
                <li>- An active product is required to withdraw</li>
                <li>- A withdrawal wallet must be registered</li>
              </ul>
            </section>

            <section>
              <h4 className="font-medium text-foreground mb-2">3. Products</h4>
              <ul className="space-y-1">
                {minimumProductPrice !== null && <li>- Minimum purchase amount: {minimumProductPrice.toLocaleString("en-PH")} PHP</li>}
                <li>- Investment cycle: {cycleLengths.length === 1 ? `${cycleLengths[0]} days` : "see the duration shown on each product"}</li>
                <li>- Automatic daily earnings</li>
                <li>- Earnings are credited 24 hours after purchase</li>
                {activeFreeProducts.map((product) => (
                  <li key={`free-product-${product.price}-${product.dailyEarnings}`}>
                    - Free product: claim {product.dailyEarnings.toLocaleString("en-PH")} PHP/day
                  </li>
                ))}
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

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
