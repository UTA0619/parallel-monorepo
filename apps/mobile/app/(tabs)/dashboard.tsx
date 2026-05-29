import { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/lib/theme";
import type { Parallel, DailyReport } from "@parallel/shared-types";

type ParallelRow = Pick<Parallel, "id" | "name" | "description" | "affection_score" | "status">;
type ReportRow = Pick<DailyReport, "id" | "parallel_id" | "narrative" | "opened_at">;

export default function DashboardScreen() {
  const [parallels, setParallels] = useState<ParallelRow[]>([]);
  const [reports, setReports] = useState<Map<string, ReportRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [displayName, setDisplayName] = useState("");

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    const [{ data: profileData }, { data: parallelData }, { data: reportData }] = await Promise.all([
      supabase.from("user_profiles").select("display_name").eq("id", user.id).single(),
      supabase.from("parallels").select("id,name,description,affection_score,status")
        .eq("user_id", user.id).eq("status", "active").order("affection_score", { ascending: false }),
      supabase.from("daily_reports").select("id,parallel_id,narrative,opened_at")
        .eq("user_id", user.id).eq("report_date", today),
    ]);

    if (profileData) setDisplayName(profileData.display_name ?? "");
    if (parallelData) setParallels(parallelData as ParallelRow[]);
    if (reportData) {
      setReports(new Map((reportData as ReportRow[]).map(r => [r.parallel_id!, r])));
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (loading) {
    return (
      <View style={[s.container, s.center]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerSub}>{greeting}, {displayName.split(" ")[0] || "traveler"}</Text>
        <Text style={s.headerTitle}>
          {parallels.length === 0
            ? "Your Parallels are waking up."
            : `${parallels.length} Parallel${parallels.length === 1 ? "" : "s"} active`}
        </Text>
      </View>

      <FlatList
        data={parallels}
        keyExtractor={p => p.id!}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        renderItem={({ item }) => {
          const report = reports.get(item.id!);
          const isUnread = report && !report.opened_at;
          return (
            <TouchableOpacity style={s.card} onPress={() => router.push(`/parallel/${item.id}`)}>
              {isUnread && <View style={s.unreadDot} />}
              <View style={s.cardRow}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{item.name?.[0] ?? "P"}</Text>
                </View>
                <View style={s.cardInfo}>
                  <Text style={s.cardName}>{item.name}</Text>
                  <Text style={s.cardDesc} numberOfLines={1}>{item.description}</Text>
                </View>
              </View>
              {report && (
                <Text style={s.narrative} numberOfLines={3}>{report.narrative}</Text>
              )}
              <View style={s.barTrack}>
                <View style={[s.barFill, { width: `${(item.affection_score ?? 0) * 100}%` as unknown as number }]} />
              </View>
              <Text style={s.barLabel}>{Math.round((item.affection_score ?? 0) * 100)}% affection</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>No Parallels yet.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => router.push("/onboarding")}>
              <Text style={s.emptyBtnText}>Begin the ritual →</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          parallels.length > 0 ? (
            <TouchableOpacity style={s.addCard} onPress={() => router.push("/onboarding")}>
              <Text style={s.addCardText}>+ Fork a new Parallel</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  headerSub: { fontSize: 13, color: colors.dim, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: colors.text },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, padding: 16,
  },
  unreadDot: {
    position: "absolute", top: 14, right: 14,
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warm,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.accent + "40",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: "600", color: colors.text },
  cardDesc: { fontSize: 12, color: colors.dim, marginTop: 2 },
  narrative: { fontSize: 12, color: colors.dim, lineHeight: 18, marginBottom: 12 },
  barTrack: { height: 2, backgroundColor: colors.border, borderRadius: 1, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 1 },
  barLabel: { fontSize: 11, color: colors.dim + "80", marginTop: 4 },
  empty: { alignItems: "center", paddingVertical: 80 },
  emptyText: { color: colors.dim, fontSize: 15, marginBottom: 20 },
  emptyBtn: { backgroundColor: colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  addCard: {
    borderWidth: 1, borderColor: colors.border, borderStyle: "dashed",
    borderRadius: 16, padding: 20, alignItems: "center", marginTop: 4,
  },
  addCardText: { color: colors.dim, fontSize: 14 },
});
