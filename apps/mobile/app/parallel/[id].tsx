import { useEffect, useRef, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Linking, Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/lib/theme";
import type { Parallel } from "@parallel/shared-types";

interface Message { id: string; role: string; content: string; crisis_level?: string; created_at: string; }

const CRISIS_RESOURCES = [
  { label: "988 Lifeline (US)", url: "tel:988" },
  { label: "Crisis Text Line", url: "sms:741741" },
];

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [parallel, setParallel] = useState<Partial<Parallel> | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [crisisLevel, setCrisisLevel] = useState("none");
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: p }, { data: msgs }] = await Promise.all([
        supabase.from("parallels").select("*").eq("id", id).eq("user_id", user.id).single(),
        supabase.from("messages").select("id,role,content,crisis_level,created_at")
          .eq("user_id", user.id).order("created_at", { ascending: true }).limit(40),
      ]);

      if (!p) { router.back(); return; }
      setParallel(p as Partial<Parallel>);
      setMessages((msgs ?? []) as Message[]);

      // Mark report opened
      const today = new Date().toISOString().split("T")[0];
      await supabase.from("daily_reports")
        .update({ opened_at: new Date().toISOString() })
        .eq("parallel_id", id).eq("report_date", today).is("opened_at", null);
    }
    load().finally(() => setInitialLoading(false));
  }, [id]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setLoading(true);

    const optimistic: Message = {
      id: Math.random().toString(), role: "user", content: text,
      created_at: new Date().toISOString(), crisis_level: "none",
    };
    setMessages(prev => [...prev, optimistic]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/parallel-converse`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ parallel_id: id, message: text, conversation_id: conversationId }),
        }
      );
      const data = await res.json();
      if (data.conversation_id) setConversationId(data.conversation_id);
      if (data.crisis_level) setCrisisLevel(data.crisis_level);

      const reply: Message = {
        id: Math.random().toString(),
        role: "parallel",
        content: data.message?.content ?? "…",
        crisis_level: data.crisis_level ?? "none",
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, reply]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isCrisis = crisisLevel === "high" || crisisLevel === "critical";

  if (initialLoading) {
    return <View style={[s.container, s.center]}><ActivityIndicator color={colors.accent} /></View>;
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{parallel?.name?.[0] ?? "P"}</Text>
        </View>
        <View style={s.headerInfo}>
          <Text style={s.headerName}>{parallel?.name}</Text>
          <Text style={s.headerStats}>
            {Math.round((parallel?.affection_score ?? 0) * 100)}% affection ·{" "}
            {Math.round((parallel?.divergence_score ?? 0) * 100)}% divergence
          </Text>
        </View>
      </View>

      {/* Crisis banner */}
      {isCrisis && (
        <View style={s.crisisBanner}>
          <Text style={s.crisisTitle}>Your wellbeing matters. Resources:</Text>
          <View style={s.crisisLinks}>
            {CRISIS_RESOURCES.map(r => (
              <TouchableOpacity key={r.url} style={s.crisisLink} onPress={() => Linking.openURL(r.url)}>
                <Text style={s.crisisLinkText}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={s.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <View style={[s.msgRow, item.role === "user" ? s.msgRowUser : s.msgRowParallel]}>
            {item.role !== "user" && (
              <View style={s.msgAvatar}>
                <Text style={s.msgAvatarText}>{parallel?.name?.[0] ?? "P"}</Text>
              </View>
            )}
            <View style={[
              s.bubble,
              item.role === "user" ? s.bubbleUser : s.bubbleParallel,
              item.crisis_level !== "none" && s.bubbleCrisis,
            ]}>
              <Text style={s.bubbleText}>{item.content}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={s.emptyMessages}>
            <Text style={s.emptyText}>Your conversation with {parallel?.name} begins here.</Text>
            {parallel?.description && <Text style={s.emptyDesc}>{parallel.description}</Text>}
          </View>
        }
        ListFooterComponent={
          loading ? (
            <View style={s.msgRowParallel}>
              <View style={s.msgAvatar}>
                <Text style={s.msgAvatarText}>{parallel?.name?.[0] ?? "P"}</Text>
              </View>
              <View style={s.bubbleTyping}>
                <Text style={s.typingDots}>· · ·</Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Input */}
      <View style={s.inputBar}>
        <TextInput
          style={s.textInput}
          value={input}
          onChangeText={setInput}
          placeholder={`Talk to ${parallel?.name}…`}
          placeholderTextColor={colors.dim}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || loading}
        >
          <Text style={s.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  back: { padding: 4 },
  backText: { fontSize: 20, color: colors.dim },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.accent + "40", alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 14, fontWeight: "600", color: colors.text },
  headerStats: { fontSize: 11, color: colors.dim, marginTop: 1 },
  crisisBanner: {
    backgroundColor: "#2D0A0A", borderBottomWidth: 1, borderBottomColor: "#7F1D1D40",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  crisisTitle: { fontSize: 13, fontWeight: "600", color: "#FCA5A5", marginBottom: 8 },
  crisisLinks: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  crisisLink: { backgroundColor: "#7F1D1D40", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  crisisLinkText: { fontSize: 12, color: "#FCA5A5" },
  messageList: { padding: 16, gap: 16 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  msgRowUser: { justifyContent: "flex-end" },
  msgRowParallel: { justifyContent: "flex-start" },
  msgAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.accent + "30", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  msgAvatarText: { fontSize: 11, fontWeight: "700", color: colors.accent },
  bubble: { maxWidth: "75%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { backgroundColor: colors.accent + "25", borderBottomRightRadius: 4 },
  bubbleParallel: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4,
  },
  bubbleCrisis: { borderColor: "#7F1D1D" },
  bubbleText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  bubbleTyping: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10,
  },
  typingDots: { fontSize: 16, color: colors.dim, letterSpacing: 4 },
  emptyMessages: { paddingVertical: 60, alignItems: "center", paddingHorizontal: 32 },
  emptyText: { fontSize: 14, color: colors.dim + "80", textAlign: "center", fontStyle: "italic" },
  emptyDesc: { fontSize: 12, color: colors.dim + "50", marginTop: 8, textAlign: "center" },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  textInput: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, paddingTop: 10,
    color: colors.text, fontSize: 14, maxHeight: 120,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.accent, alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
