import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../src/lib/supabase";
import { colors } from "../src/lib/theme";

const FORK_PROMPTS = [
  "What's one major life choice you made that you sometimes wonder about — the road not taken?",
  "In that alternate path, what would you have become? Describe this version of yourself.",
  "What values or beliefs would that version of you hold differently?",
  "What's one thing that version of you would tell you right now?",
  "Give this Parallel a name — the identity they'd claim in their world.",
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(FORK_PROMPTS.length).fill(""));
  const [loading, setLoading] = useState(false);

  function handleAnswer(text: string) {
    setAnswers(prev => { const next = [...prev]; next[step] = text; return next; });
  }

  async function handleNext() {
    if (!answers[step].trim()) return;
    if (step < FORK_PROMPTS.length - 1) {
      setStep(s => s + 1);
      return;
    }
    // Final step — fork the parallel
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/parallel-fork`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            fork_points: FORK_PROMPTS.map((prompt, i) => ({ prompt, answer: answers[i] })),
            parallel_name: answers[FORK_PROMPTS.length - 1].trim(),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fork");

      // Mark onboarding complete
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("user_profiles")
          .update({ onboarding_completed: true })
          .eq("id", user.id);
      }

      router.replace("/(tabs)/dashboard");
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const progress = (step + 1) / FORK_PROMPTS.length;
  const isLast = step === FORK_PROMPTS.length - 1;

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={s.topRow}>
          <Text style={s.logo}>PARALLEL</Text>
          <Text style={s.stepLabel}>{step + 1} / {FORK_PROMPTS.length}</Text>
        </View>

        {/* Progress bar */}
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${progress * 100}%` as unknown as number }]} />
        </View>

        {/* Phase label */}
        <Text style={s.phase}>THE FORK RITUAL</Text>

        {/* Prompt */}
        <Text style={s.prompt}>{FORK_PROMPTS[step]}</Text>

        {/* Input */}
        <TextInput
          style={s.input}
          value={answers[step]}
          onChangeText={handleAnswer}
          placeholder="Your answer…"
          placeholderTextColor={colors.dim}
          multiline
          autoFocus
          textAlignVertical="top"
        />

        {/* Navigation */}
        <View style={s.navRow}>
          {step > 0 && (
            <TouchableOpacity style={s.backBtn} onPress={() => setStep(s => s - 1)}>
              <Text style={s.backBtnText}>← Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[s.nextBtn, (!answers[step].trim() || loading) && s.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!answers[step].trim() || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.nextBtnText}>{isLast ? "Begin the divergence →" : "Continue →"}</Text>
            }
          </TouchableOpacity>
        </View>

        {step === 0 && (
          <Text style={s.hint}>
            This ritual creates your first Parallel — an AI self shaped by the path you didn't take.
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  logo: { fontSize: 16, fontWeight: "800", color: colors.text, letterSpacing: 3 },
  stepLabel: { fontSize: 12, color: colors.dim },
  progressTrack: { height: 2, backgroundColor: colors.border, borderRadius: 1, marginBottom: 40, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 1 },
  phase: { fontSize: 11, fontWeight: "600", color: colors.accent, letterSpacing: 2, marginBottom: 20 },
  prompt: { fontSize: 20, fontWeight: "600", color: colors.text, lineHeight: 30, marginBottom: 28 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
    color: colors.text, fontSize: 15, minHeight: 120, marginBottom: 24,
  },
  navRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  backBtn: { paddingVertical: 14, paddingHorizontal: 16 },
  backBtnText: { color: colors.dim, fontSize: 14 },
  nextBtn: {
    flex: 1, backgroundColor: colors.accent,
    borderRadius: 14, paddingVertical: 15, alignItems: "center",
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  hint: { fontSize: 12, color: colors.dim + "70", textAlign: "center", marginTop: 24, lineHeight: 18 },
});
