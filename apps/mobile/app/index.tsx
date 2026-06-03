import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { supabase } from "../src/lib/supabase";
import { useSessionStore } from "../src/stores/session";
import { colors } from "../src/lib/theme";

export default function Index() {
  const { session, setSession } = useSessionStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Show a centered spinner while session is being determined (avoids white/black flash)
  if (session === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(tabs)/dashboard" />;
}
