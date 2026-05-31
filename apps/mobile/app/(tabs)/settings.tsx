import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/lib/theme";

export default function SettingsScreen() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [tier, setTier] = useState("free");
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const { data } = await supabase
        .from("user_profiles")
        .select("display_name,subscription_tier")
        .eq("id", user.id)
        .single();
      if (data) {
        setDisplayName(data.display_name ?? "");
        setTier(data.subscription_tier ?? "free");
      }
    }
    load();
  }, []);

  async function handleSignOut() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out", style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  async function handlePasswordReset() {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert(
        "Reset email sent",
        `A password reset link was sent to ${email}. Check your inbox.`
      );
    }
  }

  async function handleDeleteAccount() {
    Alert.alert(
      "Delete account",
      "This will permanently delete your account, all your Parallels, conversations, and insights. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete permanently",
          style: "destructive",
          onPress: () =>
            Alert.alert(
              "Final confirmation",
              "Are you absolutely sure? This action is irreversible.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, delete everything",
                  style: "destructive",
                  onPress: deleteAccount,
                },
              ]
            ),
        },
      ]
    );
  }

  async function deleteAccount() {
    setDeletingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete account");

      await supabase.auth.signOut();
      router.replace("/(auth)/login");
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setDeletingAccount(false);
    }
  }

  const tierLabel = tier === "plus" ? "Plus" : tier === "infinite" ? "Infinite" : "Free";
  const parallelLimit = tier === "plus" ? 25 : tier === "infinite" ? "Unlimited" : 3;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.headerTitle}>Settings</Text>

      {/* Profile */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>Profile</Text>
        <View style={s.card}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{displayName?.[0]?.toUpperCase() ?? "?"}</Text>
          </View>
          <View style={s.profileInfo}>
            <Text style={s.name}>{displayName || "—"}</Text>
            <Text style={s.email}>{email}</Text>
          </View>
        </View>
      </View>

      {/* Subscription */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>Subscription</Text>
        <View style={s.infoCard}>
          <View style={s.infoRow}>
            <Text style={s.infoKey}>Plan</Text>
            <View style={[s.tierBadge, tier !== "free" && s.tierBadgePaid]}>
              <Text style={[s.tierText, tier !== "free" && s.tierTextPaid]}>{tierLabel}</Text>
            </View>
          </View>
          <View style={[s.infoRow, s.infoRowLast]}>
            <Text style={s.infoKey}>Parallel limit</Text>
            <Text style={s.infoVal}>{parallelLimit}</Text>
          </View>
        </View>
      </View>

      {/* Account actions */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>Account</Text>
        <View style={s.infoCard}>
          <TouchableOpacity
            style={s.actionRow}
            onPress={handlePasswordReset}
            accessibilityLabel="Send password reset email"
            accessibilityRole="button"
          >
            <Text style={s.actionText}>Send password reset email</Text>
            <Text style={s.actionArrow}>›</Text>
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity
            style={s.actionRow}
            onPress={handleSignOut}
            accessibilityLabel="Sign out"
            accessibilityRole="button"
          >
            <Text style={s.actionText}>Sign out</Text>
            <Text style={s.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* About */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>About</Text>
        <View style={s.infoCard}>
          <View style={s.infoRow}>
            <Text style={s.infoKey}>Version</Text>
            <Text style={s.infoVal}>1.0.0</Text>
          </View>
          <View style={s.divider} />
          <View style={[s.infoRow, s.infoRowLast]}>
            <Text style={s.infoKey}>Build</Text>
            <Text style={s.infoVal}>1</Text>
          </View>
        </View>
      </View>

      {/* Danger zone */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>Danger zone</Text>
        <TouchableOpacity
          style={[s.dangerBtn, deletingAccount && s.dangerBtnDisabled]}
          onPress={handleDeleteAccount}
          disabled={deletingAccount}
          accessibilityLabel="Delete account and all data"
          accessibilityRole="button"
        >
          <Text style={s.dangerBtnText}>
            {deletingAccount ? "Deleting…" : "Delete account and all data"}
          </Text>
        </TouchableOpacity>
        <Text style={s.dangerHint}>
          Permanently removes your account, Parallels, conversations, and insights. Cannot be undone.
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 60 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 32 },
  section: { marginBottom: 28 },
  sectionLabel: {
    fontSize: 11, fontWeight: "600", color: colors.dim,
    letterSpacing: 1, textTransform: "uppercase", marginBottom: 10,
  },
  card: {
    backgroundColor: colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 14,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.accent + "30", alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "700", color: colors.accent },
  profileInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600", color: colors.text },
  email: { fontSize: 12, color: colors.dim, marginTop: 2 },
  infoCard: {
    backgroundColor: colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoKey: { fontSize: 14, color: colors.dim },
  infoVal: { fontSize: 14, color: colors.text, fontWeight: "500" },
  tierBadge: { paddingHorizontal: 10, paddingVertical: 3, backgroundColor: colors.muted, borderRadius: 20 },
  tierBadgePaid: { backgroundColor: colors.accent + "20" },
  tierText: { fontSize: 12, color: colors.dim, fontWeight: "600" },
  tierTextPaid: { color: colors.accent },
  actionRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  actionText: { fontSize: 14, color: colors.text },
  actionArrow: { fontSize: 18, color: colors.dim },
  divider: { height: 1, backgroundColor: colors.border },
  dangerBtn: {
    borderWidth: 1, borderColor: "#EF444450",
    borderRadius: 12, paddingVertical: 14, alignItems: "center",
    backgroundColor: "#EF444408",
  },
  dangerBtnDisabled: { opacity: 0.5 },
  dangerBtnText: { color: "#EF4444", fontSize: 15, fontWeight: "500" },
  dangerHint: {
    fontSize: 11, color: colors.dim + "70",
    textAlign: "center", marginTop: 8, lineHeight: 16,
  },
});
