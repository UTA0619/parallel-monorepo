/**
 * PARALLEL — Subscription Paywall
 * Shown when a user tries to exceed the free plan limit or taps "Upgrade".
 *
 * Plans:
 *   Free     — 3 Parallels  (always available)
 *   Plus     — 25 Parallels ($9.99/mo or $79.99/yr)
 *   Infinite — Unlimited    ($24.99/mo)
 */

import { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Alert, ScrollView, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Purchases, { type PurchasesPackage } from "react-native-purchases";
import { getOffering, restorePurchases, resolveSubscriptionTier } from "../src/lib/purchases";
import { supabase } from "../src/lib/supabase";
import { colors } from "../src/lib/theme";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "Free forever",
    features: ["3 Parallels", "Daily reports", "Conversation history"],
    highlight: false,
  },
  {
    id: "plus",
    name: "Plus",
    price: "$9.99 / month",
    annualPrice: "$79.99 / year  (save 33%)",
    features: ["25 Parallels", "Daily reports", "Unlimited history", "Priority AI responses"],
    highlight: true,
  },
  {
    id: "infinite",
    name: "Infinite",
    price: "$24.99 / month",
    features: ["Unlimited Parallels", "Everything in Plus", "Earliest access to new features", "Priority support"],
    highlight: false,
  },
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    getOffering().then((offering) => {
      if (offering?.availablePackages) {
        setPackages(offering.availablePackages);
        // Default-select monthly Plus
        const monthly = offering.availablePackages.find(
          p => p.packageType === "MONTHLY" || p.identifier === "$rc_monthly"
        );
        if (monthly) setSelectedPkg(monthly);
      }
      setLoading(false);
    });
  }, []);

  async function handlePurchase() {
    if (!selectedPkg) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(selectedPkg);
      const tier = resolveSubscriptionTier(customerInfo);

      // Sync tier to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("user_profiles").update({ subscription_tier: tier }).eq("id", user.id);
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Welcome to PARALLEL " + tier.charAt(0).toUpperCase() + tier.slice(1) + "!",
        "Your Parallels are ready.",
        [{ text: "Let's go", onPress: () => router.back() }]
      );
    } catch (e: unknown) {
      // PurchasesError code 1 = user cancelled — don't show alert
      const code = (e as { code?: number }).code;
      if (code !== 1) {
        Alert.alert("Purchase failed", e instanceof Error ? e.message : "Please try again.");
      }
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const customerInfo = await restorePurchases();
      const tier = resolveSubscriptionTier(customerInfo);
      if (tier !== "free") {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("user_profiles").update({ subscription_tier: tier }).eq("id", user.id);
        }
        Alert.alert("Purchases restored", `Your ${tier} plan is active.`, [
          { text: "Continue", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("No purchases found", "No active subscriptions were found for this Apple ID.");
      }
    } catch {
      Alert.alert("Restore failed", "Please try again or contact support@parallel.app.");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.closeBtn}
          accessibilityLabel="Close paywall"
          accessibilityRole="button"
        >
          <Text style={s.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={s.logo}>PARALLEL</Text>
        <Text style={s.tagline}>Live more lives. Choose the best one.</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Plan cards */}
        {PLANS.map((plan) => (
          <View key={plan.id} style={[s.planCard, plan.highlight && s.planCardHighlight]}>
            {plan.highlight && (
              <View style={s.popularBadge}>
                <Text style={s.popularBadgeText}>MOST POPULAR</Text>
              </View>
            )}
            <View style={s.planHeader}>
              <Text style={[s.planName, plan.highlight && s.planNameHighlight]}>{plan.name}</Text>
              <Text style={[s.planPrice, plan.highlight && s.planPriceHighlight]}>{plan.price}</Text>
              {plan.annualPrice && (
                <Text style={s.planAnnualPrice}>{plan.annualPrice}</Text>
              )}
            </View>
            {plan.features.map((f) => (
              <View key={f} style={s.featureRow}>
                <Text style={s.featureCheck}>✓</Text>
                <Text style={s.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Package selector */}
        {!loading && packages.length > 0 && (
          <View style={s.packageSection}>
            <Text style={s.packageSectionTitle}>Choose your plan</Text>
            {packages.map((pkg) => {
              const isSelected = selectedPkg?.identifier === pkg.identifier;
              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[s.pkgRow, isSelected && s.pkgRowSelected]}
                  onPress={async () => {
                    await Haptics.selectionAsync();
                    setSelectedPkg(pkg);
                  }}
                  accessibilityLabel={`Select ${pkg.product.title}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={[s.radioOuter, isSelected && s.radioOuterSelected]}>
                    {isSelected && <View style={s.radioInner} />}
                  </View>
                  <View style={s.pkgInfo}>
                    <Text style={s.pkgTitle}>{pkg.product.title}</Text>
                    <Text style={s.pkgPrice}>{pkg.product.priceString}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {loading && <ActivityIndicator color={colors.accent} style={{ marginVertical: 24 }} />}
      </ScrollView>

      {/* CTA */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[s.ctaBtn, (!selectedPkg || purchasing) && s.ctaBtnDisabled]}
          onPress={handlePurchase}
          disabled={!selectedPkg || purchasing}
          accessibilityLabel="Subscribe"
          accessibilityRole="button"
        >
          {purchasing
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.ctaBtnText}>
                {selectedPkg ? `Subscribe · ${selectedPkg.product.priceString}` : "Select a plan"}
              </Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={s.restoreBtn}
          onPress={handleRestore}
          disabled={restoring}
          accessibilityLabel="Restore purchases"
          accessibilityRole="button"
        >
          <Text style={s.restoreBtnText}>
            {restoring ? "Restoring…" : "Restore purchases"}
          </Text>
        </TouchableOpacity>

        <Text style={s.legal}>
          {Platform.OS === "ios"
            ? "Payment charged to your Apple ID. Cancel anytime in App Store Settings."
            : "Payment charged to your Google account. Cancel anytime."}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 8, paddingTop: 8 },
  closeBtn: { position: "absolute", right: 20, top: 12, padding: 4 },
  closeBtnText: { fontSize: 18, color: colors.dim },
  logo: { fontSize: 18, fontWeight: "800", color: colors.text, letterSpacing: 3, marginBottom: 4 },
  tagline: { fontSize: 13, color: colors.dim, textAlign: "center" },
  scroll: { padding: 20, gap: 12 },
  planCard: {
    backgroundColor: colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, padding: 16,
  },
  planCardHighlight: { borderColor: colors.accent, borderWidth: 1.5 },
  popularBadge: {
    backgroundColor: colors.accent, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
    alignSelf: "flex-start", marginBottom: 10,
  },
  popularBadgeText: { fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 1 },
  planHeader: { marginBottom: 12 },
  planName: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 2 },
  planNameHighlight: { color: colors.accent },
  planPrice: { fontSize: 14, color: colors.dim },
  planPriceHighlight: { color: colors.text, fontWeight: "600" },
  planAnnualPrice: { fontSize: 12, color: colors.accent, marginTop: 2 },
  featureRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  featureCheck: { fontSize: 13, color: colors.accent, fontWeight: "700" },
  featureText: { fontSize: 13, color: colors.dim },
  packageSection: { marginTop: 8 },
  packageSectionTitle: {
    fontSize: 11, fontWeight: "600", color: colors.dim,
    letterSpacing: 1, textTransform: "uppercase", marginBottom: 12,
  },
  pkgRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 10,
  },
  pkgRowSelected: { borderColor: colors.accent },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  radioOuterSelected: { borderColor: colors.accent },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  pkgInfo: { flex: 1 },
  pkgTitle: { fontSize: 14, fontWeight: "600", color: colors.text },
  pkgPrice: { fontSize: 13, color: colors.dim, marginTop: 2 },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  ctaBtn: {
    backgroundColor: colors.accent, borderRadius: 14,
    paddingVertical: 16, alignItems: "center", marginBottom: 12,
  },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  restoreBtn: { alignItems: "center", paddingVertical: 8 },
  restoreBtnText: { color: colors.dim, fontSize: 13 },
  legal: {
    fontSize: 10, color: colors.dim + "60",
    textAlign: "center", marginTop: 8, lineHeight: 14,
  },
});
