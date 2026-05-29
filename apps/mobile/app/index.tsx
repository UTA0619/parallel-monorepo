import { useEffect } from "react";
import { Redirect } from "expo-router";
import { supabase } from "../src/lib/supabase";
import { useSessionStore } from "../src/stores/session";

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

  if (session === undefined) return null; // loading
  if (!session) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(tabs)/dashboard" />;
}
