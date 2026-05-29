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

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const { data } = await supabase
        .from("user_profiles").select("display_name,subscription_tier").eq("id", user.id).single();
      if (data) {
        setDisplayName(data.display_name ?? "");
        setTier(data.subscription_tier ?? "free");
      }
    }
    load();
  }, []);

  async function handleSignOut() {
    Alert.alert("Sign out", "Are you sure?", [
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
          <View>
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
          <View style={s.infoRow}>
            <Text style={s.infoKey}>Parallel limit</Text>
            <Text style={s.infoVal}>{parallelLimit}</Text>
          </View>
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
        </View>
      </View>

      {/* Actions */}
      <View style={s.section}>
        <TouchableOpacity style={s.dangerBtn} onPress={handleSignOut}>
          <Text style={s.dangerBtnText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 32 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: "600", color: colors.dim, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 },
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
  name: { fontSize: 15, fontWeight: "600", color: colors.text },
  email: { fontSize: 12, color: colors.dim, marginTop: 2 },
  infoCard: {
    backgroundColor: colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  infoKey: { fontSize: 14, color: colors.dim },
  infoVal: { fontSize: 14, color: colors.text, fontWeight: "500" },
  tierBadge: { paddingHorizontal: 10, paddingVertical: 3, backgroundColor: colors.border, borderRadius: 20 },
  tierBadgePaid: { backgroundColor: colors.accent + "20" },
  tierText: { fontSize: 12, color: colors.dim, fontWeight: "600" },
  tierTextPaid: { color: colors.accent },
  dangerBtn: {
    borderWidth: 1, borderColor: "#EF444440",
    borderRadius: 12, paddingVertical: 14, alignItems: "center",
  },
  dangerBtnText: { color: "#EF4444", fontSize: 15, fontWeight: "500" },
});
