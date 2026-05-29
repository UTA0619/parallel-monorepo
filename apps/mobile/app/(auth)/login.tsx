import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from "react-native";
import { Link, router } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/lib/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert("Sign in failed", error.message);
    } else {
      router.replace("/(tabs)/dashboard");
    }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.inner}>
        {/* Logo */}
        <Text style={s.logo}>PARALLEL</Text>
        <Text style={s.subtitle}>Welcome back to your other lives.</Text>

        {/* Form */}
        <View style={s.form}>
          <TextInput
            style={s.input}
            placeholder="Email"
            placeholderTextColor={colors.dim}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextInput
            style={s.input}
            placeholder="Password"
            placeholderTextColor={colors.dim}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Sign in</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>No account? </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity><Text style={s.link}>Create one</Text></TouchableOpacity>
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
