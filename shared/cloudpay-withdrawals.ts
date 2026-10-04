import type { CloudPayWithdrawalResponse } from "./schema";

export function isConfirmedCloudPayPayoutFailure(withdrawal: {
  cloudpayOrderId?: string | null;
  cloudpayResponse?: CloudPayWithdrawalResponse | null;
}): boolean {
  const response = withdrawal.cloudpayResponse;
  return Boolean(
    withdrawal.cloudpayOrderId &&
    response?.source === "query" &&
    response.status === "rejected" &&
    response.amountMatches === true &&
    response.statusMatches !== false,
  );
}