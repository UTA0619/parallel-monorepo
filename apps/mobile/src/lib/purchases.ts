/**
 * PARALLEL — RevenueCat In-App Purchase helpers
 *
 * Entitlements (configure in RevenueCat dashboard):
 *   "plus"     → Plus plan  (25 Parallels)
 *   "infinite" → Infinite plan (unlimited Parallels)
 *
 * Offerings (configure in RevenueCat dashboard):
 *   "default" offering with packages:
 *     $rc_monthly       → Plus Monthly  ($9.99/mo)
 *     $rc_annual        → Plus Annual   ($79.99/yr)
 *     "infinite_monthly"→ Infinite      ($24.99/mo)
 */

import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
} from "react-native-purchases";
import { Platform } from "react-native";

const RC_API_KEY = Platform.select({
  ios:     process.env.EXPO_PUBLIC_RC_API_KEY_IOS     ?? "",
  android: process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID ?? "",
  default: "",
})!;

export function initPurchases(userId: string) {
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey: RC_API_KEY, appUserID: userId });
}

export async function getOffering(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch {
    return null;
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.restorePurchases();
  } catch {
    return null;
  }
}

/** Returns "free" | "plus" | "infinite" based on active entitlements */
export function resolveSubscriptionTier(
  customerInfo: CustomerInfo | null
): "free" | "plus" | "infinite" {
  if (!customerInfo) return "free";
  const active = customerInfo.entitlements.active;
  if (active["infinite"]) return "infinite";
  if (active["plus"])     return "plus";
  return "free";
}

/** Human-readable price string for a package */
export function priceString(pkg: { product: { priceString: string } }): string {
  return pkg.product.priceString;
}
