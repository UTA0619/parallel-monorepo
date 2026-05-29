import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from "react-native";
import { Link, router } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/lib/theme";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!email || !password || !displayName) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    setLoading(false);
    if (error) {
      Alert.alert("Sign up failed", error.message);
    } else {
      router.replace("/onboarding");
    }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.inner}>
        <Text style={s.logo}>PARALLEL</Text>
        <Text style={s.subtitle}>Begin your divergence.</Text>

        <View style={s.form}>
          <TextInput
            style={s.input}
            placeholder="Your name"
            placeholderTextColor={colors.dim}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
          <TextInput
            style={s.input}
            placeholder="Email"
            placeholderTextColor={colors.dim}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={s.input}
            placeholder="Password"
            placeholderTextColor={colors.dim}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleSignup} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Create account</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity><Text style={s.link}>Sign in</Text></TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 32 },
  logo: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: 4, textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.dim, textAlign: "center", marginBottom: 48 },
  form: { gap: 12 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: colors.text, fontSize: 15,
  },
  btn: {
    backgroundColor: colors.accent, borderRadius: 12,
    paddingVertical: 15, alignItems: "center", marginTop: 8,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 32 },
  footerText: { color: colors.dim, fontSize: 14 },
  link: { color: colors.accent, fontSize: 14 },
});
