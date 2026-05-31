/**
 * PARALLEL — Push notification helpers (Expo Notifications)
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase } from "./supabase";

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Requests permission and registers for push notifications.
 * Saves the Expo push token to the user's profile in Supabase.
 * Returns the token string or null if permission denied.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("[notif] Push notifications require a physical device");
    return null;
  }

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[notif] Push notification permission denied");
    return null;
  }

  // Android channel setup
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("parallel-default", {
      name: "PARALLEL",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#7B6CF6",
    });
  }

  // Get Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
  });
  const token = tokenData.data;

  // Persist token to Supabase
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from("user_profiles")
      .update({ expo_push_token: token })
      .eq("id", user.id);
  }

  return token;
}

/**
 * Clears the stored push token (e.g. on sign out).
 */
export async function unregisterPushNotifications() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from("user_profiles")
      .update({ expo_push_token: null })
      .eq("id", user.id);
  }
}

/**
 * Sets up listeners for notification events.
 * Returns cleanup function.
 */
export function setupNotificationListeners(
  onNotification: (notification: Notifications.Notification) => void,
  onResponse: (response: Notifications.NotificationResponse) => void,
) {
  const notifSub = Notifications.addNotificationReceivedListener(onNotification);
  const responseSub = Notifications.addNotificationResponseReceivedListener(onResponse);

  return () => {
    Notifications.removeNotificationSubscription(notifSub);
    Notifications.removeNotificationSubscription(responseSub);
  };
}
