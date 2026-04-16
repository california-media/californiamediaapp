import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { initConfig } from "./utils/config";

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Must run after the Stack (navigation container) is mounted.
    // Returning the Stack first ensures navigation is ready before we redirect.
    initConfig().then(({ crmUrl, authToken }) => {
      if (!crmUrl) {
        router.replace("/connect");
      } else if (!authToken) {
        router.replace("/login");
      }
    });
  }, []);

  return (
    <Stack>
      <Stack.Screen name="connect" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false, title: "Home" }} />
      <Stack.Screen name="leads-list" options={{ headerShown: false, title: "All Leads" }} />
      <Stack.Screen name="lead-detail" options={{ headerShown: false, title: "Lead Details" }} />
      <Stack.Screen name="properties-list" options={{ headerShown: false, title: "Properties" }} />
      <Stack.Screen name="projects-list" options={{ headerShown: false, title: "Real Estate Projects" }} />
      <Stack.Screen name="project-detail" options={{ headerShown: false }} />
    </Stack>
  );
}
