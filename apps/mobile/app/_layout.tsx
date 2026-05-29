import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
      </Stack>
    </GestureHandlerRootView>
  );
}
