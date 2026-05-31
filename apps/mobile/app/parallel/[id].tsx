import { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Linking, Alert,
  NativeSyntheticEvent, NativeScrollEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/lib/theme";
import type { Parallel } from "@parallel/shared-types";

const PAGE_SIZE = 20;

interface Message {
  id: string;
  role: string;
  content: string;
  crisis_level?: string;
  created_at: string;
}

const CRISIS_RESOURCES = [
  { label: "988 Lifeline (US)", url: "tel:988" },
  { label: "Crisis Text Line", url: "sms:741741" },
  { label: "International", url: "https://www.iasp.info/resources/Crisis_Centres/" },
];

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [parallel, setParallel] = useState<Partial<Parallel> | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [crisisLevel, setCrisisLevel] = useState("none");
  const [crisisDismissed, setCrisisDismissed] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const listRef = useRef<FlatList>(null);
  const oldestCreatedAt = useRef<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ── Fetch parallel + most recent conversation in parallel ──────────
      const [{ data: p }, { data: latestConv }] = await Promise.all([
        supabase.from("parallels")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single(),
        supabase.from("conversations")
          .select("id")
          .eq("parallel_id", id)
          .eq("user_id", user.id)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (!p) { router.back(); return; }
      setParallel(p as Partial<Parallel>);

      // ── Load messages for the most recent conversation only ────────────
      if (latestConv) {
        setConversationId(latestConv.id);
        const { data: msgs } = await supabase
          .from("messages")
          .select("id,role,content,crisis_level,created_at")
          .eq("conversation_id", latestConv.id)
          .order("created_at", { ascending: false })
          .limit(PAGE_SIZE);
        const ordered = (msgs ?? []).reverse() as Message[];
        setMessages(ordered);
        setHasMore((msgs ?? []).length === PAGE_SIZE);
        if (ordered.length > 0) oldestCreatedAt.current = ordered[0].created_at;
      }

      // ── Mark today's daily report as opened ───────────────────────────
      const today = new Date().toISOString().split("T")[0];
      await supabase.from("daily_reports")
        .update({ opened_at: new Date().toISOString() })
        .eq("parallel_id", id)
        .eq("report_date", today)
        .is("opened_at", null);
    }
    load().finally(() => setInitialLoading(false));
  }, [id]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || !hasMore || loadingMore || !oldestCreatedAt.current) return;
    setLoadingMore(true);
    try {
      const { data: older } = await supabase
        .from("messages")
        .select("id,role,content,crisis_level,created_at")
        .eq("conversation_id", conversationId)
        .lt("created_at", oldestCreatedAt.current)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      const ordered = (older ?? []).reverse() as Message[];
      if (ordered.length > 0) {
        oldestCreatedAt.current = ordered[0].created_at;
        setMessages(prev => [...ordered, ...prev]);
      }
      setHasMore(ordered.length === PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, hasMore, loadingMore]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (e.nativeEvent.contentOffset.y < 60) {
      loadOlderMessages();
    }
  }, [loadOlderMessages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic message with proper UUID
    const optimisticId = crypto.randomUUID();
    const optimistic: Message = {
      id: optimisticId,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
      crisis_level: "none",
    };
    setMessages(prev => [...prev, optimistic]);
    scrollToBottom();

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
          body: JSON.stringify({
            parallel_id: id,
            message: text,
            conversation_id: conversationId,
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? `Server error ${res.status}`);
      }

      const data = await res.json();

      // Store conversation_id from first message
      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }
      if (data.crisis_level) {
        setCrisisLevel(data.crisis_level);
        setCrisisDismissed(false); // Re-show banner if new crisis
      }

      const reply: Message = {
        id: crypto.randomUUID(),
        role: "parallel",
        content: data.message?.content ?? "…",
        crisis_level: data.crisis_level ?? "none",
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, reply]);
      scrollToBottom();
    } catch (e: unknown) {
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      Alert.alert(
        "Message failed",
        e instanceof Error ? e.message : "Could not send message. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const isCrisis = (crisisLevel === "high" || crisisLevel === "critical") && !crisisDismissed;

  const renderMessage = useCallback(({ item }: { item: Message }) => (
    <View style={[s.msgRow, item.role === "user" ? s.msgRowUser : s.msgRowParallel]}>
      {item.role !== "user" && (
        <View style={s.msgAvatar} accessibilityLabel={`${parallel?.name} avatar`}>
          <Text style={s.msgAvatarText}>{parallel?.name?.[0] ?? "P"}</Text>
        </View>
      )}
      <View style={[
        s.bubble,
        item.role === "user" ? s.bubbleUser : s.bubbleParallel,
        item.crisis_level && item.crisis_level !== "none" ? s.bubbleCrisis : null,
      ]}>
        <Text style={s.bubbleText}>{item.content}</Text>
        <Text style={s.bubbleTime}>
          {new Date(item.created_at).toLocaleTimeString("en-US", {
            hour: "numeric", minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  ), [parallel?.name]);

  if (initialLoading) {
    return (
      <View style={[s.container, s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header — respects Dynamic Island / notch */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.back}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <View style={s.avatar} accessibilityLabel={`${parallel?.name} avatar`}>
          <Text style={s.avatarText}>{parallel?.name?.[0] ?? "P"}</Text>
        </View>
        <View style={s.headerInfo}>
          <Text style={s.headerName} numberOfLines={1}>{parallel?.name}</Text>
          <Text style={s.headerStats}>
            {Math.round((parallel?.affection_score ?? 0) * 100)}% affection ·{" "}
            {Math.round((parallel?.divergence_score ?? 0) * 100)}% divergence
          </Text>
        </View>
      </View>

      {/* Crisis banner */}
      {isCrisis && (
        <View style={s.crisisBanner} accessibilityLiveRegion="polite">
          <View style={s.crisisBannerTop}>
            <Text style={s.crisisTitle}>Your wellbeing matters. Resources available:</Text>
            <TouchableOpacity
              onPress={() => setCrisisDismissed(true)}
              accessibilityLabel="Dismiss crisis banner"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={s.crisisDismiss}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={s.crisisLinks}>
            {CRISIS_RESOURCES.map(r => (
              <TouchableOpacity
                key={r.url}
                style={s.crisisLink}
                onPress={() => Linking.openURL(r.url)}
                accessibilityLabel={r.label}
                accessibilityRole="link"
              >
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
        renderItem={renderMessage}
        onScroll={handleScroll}
        scrollEventThrottle={200}
        // Only auto-scroll when user is near the bottom
        onContentSizeChange={() => {
          if (messages.length > 0) {
            listRef.current?.scrollToEnd({ animated: false });
          }
        }}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        ListHeaderComponent={
          loadingMore ? (
            <View style={s.loadingMore}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={s.emptyMessages}>
            <Text style={s.emptyText}>
              Your conversation with {parallel?.name} begins here.
            </Text>
            {parallel?.description ? (
              <Text style={s.emptyDesc}>{parallel.description}</Text>
            ) : null}
          </View>
        }
        ListFooterComponent={
          loading ? (
            <View style={s.msgRowParallel}>
              <View style={s.msgAvatar}>
                <Text style={s.msgAvatarText}>{parallel?.name?.[0] ?? "P"}</Text>
              </View>
              <View style={s.bubbleTyping}>
                <TypingDots />
              </View>
            </View>
          ) : null
        }
      />

      {/* Input bar — respects home indicator */}
      <View style={[s.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={s.textInput}
          value={input}
          onChangeText={setInput}
          placeholder={`Talk to ${parallel?.name}…`}
          placeholderTextColor={colors.dim}
          multiline
          maxLength={2000}
          accessibilityLabel="Message input"
          accessibilityHint="Type a message and press Send"
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || loading}
          accessibilityLabel="Send message"
          accessibilityRole="button"
        >
          <Text style={s.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Animated typing indicator
function TypingDots() {
  return (
    <View style={td.row} accessibilityLabel="Parallel is typing">
      {[0, 1, 2].map(i => (
        <View key={i} style={[td.dot, { opacity: 0.4 + i * 0.2 }]} />
      ))}
    </View>
  );
}
const td = StyleSheet.create({
  row: { flexDirection: "row", gap: 4, alignItems: "center", paddingVertical: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingBottom: 16, paddingHorizontal: 16,
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
    backgroundColor: "#2D0A0A",
    borderBottomWidth: 1, borderBottomColor: "#7F1D1D40",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  crisisBannerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  crisisTitle: { fontSize: 13, fontWeight: "600", color: "#FCA5A5", flex: 1 },
  crisisDismiss: { fontSize: 14, color: "#FCA5A580", paddingLeft: 8 },
  crisisLinks: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  crisisLink: {
    backgroundColor: "#7F1D1D40", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
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
    backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.border, borderBottomLeftRadius: 4,
  },
  bubbleCrisis: { borderColor: "#7F1D1D" },
  bubbleText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  bubbleTime: { fontSize: 10, color: colors.dim + "60", marginTop: 4 },
  bubbleTyping: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 8,
  },
  emptyMessages: { paddingVertical: 60, alignItems: "center", paddingHorizontal: 32 },
  emptyText: {
    fontSize: 14, color: colors.dim + "80",
    textAlign: "center", fontStyle: "italic",
  },
  emptyDesc: { fontSize: 12, color: colors.dim + "50", marginTop: 8, textAlign: "center" },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  textInput: {
    flex: 1, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    color: colors.text, fontSize: 14, maxHeight: 120,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.accent, alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  loadingMore: { paddingVertical: 12, alignItems: "center" },
});
