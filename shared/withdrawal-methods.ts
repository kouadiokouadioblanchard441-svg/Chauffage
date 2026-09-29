import { CLOUDPAY_BANKS } from "./cloudpay-banks";

export function getWithdrawalMethods(
  countryCode: string,
  _configuredMethods: readonly string[] = [],
): string[] {
  const country = countryCode.trim().toUpperCase();
  if (country !== "PH") return [];
  return CLOUDPAY_BANKS.map(({ name }) => name);
}

export function isAllowedWithdrawalMethod(
  countryCode: string,
  paymentMethod: string,
  _configuredMethods: readonly string[] = [],
): boolean {
  const method = paymentMethod.trim().toLocaleLowerCase();
  return getWithdrawalMethods(countryCode)
    .some((allowedMethod) => allowedMethod.trim().toLocaleLowerCase() === method);
}