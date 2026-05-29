import { useEffect, useState } from "react";
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/lib/theme";
import type { Insight } from "@parallel/shared-types";

type InsightRow = Pick<Insight, "id" | "parallel_id" | "domain" | "content" | "created_at"> & { parallel_name?: string };

const DOMAIN_COLORS: Record<string, string> = {
  career: "#7B6CF6",
  relationships: "#F6A26C",
  health: "#6CF6B4",
  creativity: "#F66CAE",
  finance: "#F6E26C",
  identity: "#6CC8F6",
  other: "#6B7080",
};

export default function InsightsScreen() {
  const [insights, setInsights] = useState<InsightRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("insights")
        .select("id,parallel_id,domain,content,created_at,parallels(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) {
        setInsights(data.map((r: Record<string, unknown>) => ({
          ...r,
          parallel_name: (r.parallels as { name?: string } | null)?.name,
        })) as InsightRow[]);
      }
    }
    load().finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <View style={[s.container, s.center]}><ActivityIndicator color={colors.accent} /></View>;
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Insights</Text>
        <Text style={s.headerSub}>Wisdom from your other lives</Text>
      </View>

      <FlatList
        data={insights}
        keyExtractor={i => i.id!}
        contentContainerStyle={s.list}
        renderItem={({ item }) => {
          const domainColor = DOMAIN_COLORS[item.domain ?? "other"] ?? DOMAIN_COLORS.other;
          return (
            <TouchableOpacity
              style={s.card}
              onPress={() => item.parallel_id && router.push(`/parallel/${item.parallel_id}`)}
            >
              <View style={s.cardTop}>
                <View style={[s.domainBadge, { backgroundColor: domainColor + "20" }]}>
                  <Text style={[s.domainText, { color: domainColor }]}>{item.domain ?? "other"}</Text>
                </View>
                <Text style={s.from}>{item.parallel_name ?? "Parallel"}</Text>
              </View>
              <Text style={s.content}>{item.content}</Text>
              <Text style={s.date}>
                {new Date(item.created_at!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>No insights yet.</Text>
            <Text style={s.emptySubText}>Talk to your Parallels to generate insights.</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: colors.text },
  headerSub: { fontSize: 13, color: colors.dim, marginTop: 4 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, padding: 16,
  },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  domainBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  domainText: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  from: { fontSize: 11, color: colors.dim },
  content: { fontSize: 13, color: colors.text, lineHeight: 20 },
  date: { fontSize: 11, color: colors.dim + "80", marginTop: 8 },
  empty: { alignItems: "center", paddingVertical: 80 },
  emptyText: { color: colors.dim, fontSize: 15, marginBottom: 8 },
  emptySubText: { color: colors.dim + "80", fontSize: 13, textAlign: "center" },
});
