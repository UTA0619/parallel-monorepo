import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Notifications from "expo-notifications";

import { supabase } from "../src/lib/supabase";
import { initPurchases } from "../src/lib/purchases";
import { registerForPushNotifications, setupNotificationListeners } from "../src/lib/notifications";
import { useNetworkStatus } from "../src/hooks/useNetworkStatus";
import { colors } from "../src/lib/theme";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = !isConnected || !isInternetReachable;
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  // Animate offline banner in/out
  useEffect(() => {
    Animated.timing(bannerOpacity, {
      toValue: isOffline ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline, bannerOpacity]);

  // Wire up push notifications + purchases on auth change
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          // Init RevenueCat with user ID for subscription tracking
          initPurchases(session.user.id);
          // Register for push (non-blocking — user may deny)
          registerForPushNotifications().catch(console.warn);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  // Notification tap handler — deep-link to the relevant Parallel
  useEffect(() => {
    const cleanup = setupNotificationListeners(
      (_notification) => {
        // App is foregrounded — notification already shown by handler
      },
      (response) => {
        const parallelId = response.notification.request.content.data?.parallelId as string | undefined;
        if (parallelId) {
          router.push(`/parallel/${parallelId}`);
        }
      }
    );
    return cleanup;
  }, []);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" backgroundColor="#0A0B0F" />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0A0B0F" },
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="parallel/[id]" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
        <Stack.Screen name="paywall" options={{ animation: "slide_from_bottom", presentation: "modal" }} />
      </Stack>

      {/* Offline banner — floats above all screens */}
      <Animated.View
        style={[s.offlineBanner, { opacity: bannerOpacity }]}
        pointerEvents={isOffline ? "auto" : "none"}
        accessibilityLiveRegion="polite"
      >
        <Text style={s.offlineText}>⚡ No connection — messages will retry when online</Text>
      </Animated.View>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  offlineBanner: {
    position: "absolute",
    bottom: 90, // above tab bar
    left: 16,
    right: 16,
    backgroundColor: "#92400E",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  offlineText: {
    color: "#FCD34D",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
});
