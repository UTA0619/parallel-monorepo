import { Tabs } from "expo-router";
import { colors } from "../../src/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          height: 60,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.dim,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Parallels",
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} glyph="⬡" />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} glyph="◈" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} glyph="⊙" />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ color, glyph }: { color: string; glyph: string }) {
  const { Text } = require("react-native");
  return <Text style={{ fontSize: 18, color, lineHeight: 22 }}>{glyph}</Text>;
}
