import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { initConfig } from "./utils/config";

// Kick off config loading immediately at module eval — before any screen mounts
initConfig();

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    initConfig().then(({ crmUrl, userId }) => {
      if (!crmUrl) {
        router.replace("/connect");
      } else if (!userId) {
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
      <Stack.Screen name="off-plan-list" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false, title: "Profile" }} />
      <Stack.Screen name="add-lead" options={{ headerShown: false, title: "Add Lead" }} />
      <Stack.Screen name="db-leads-list" options={{ headerShown: false, title: "DB Leads" }} />
      <Stack.Screen name="db-lead-detail" options={{ headerShown: false, title: "DB Lead Details" }} />
      <Stack.Screen name="add-db-lead" options={{ headerShown: false, title: "Add DB Lead" }} />
      <Stack.Screen name="customers-list" options={{ headerShown: false, title: "Customers" }} />
      <Stack.Screen name="customer-detail" options={{ headerShown: false, title: "Customer Detail" }} />
      <Stack.Screen name="todos-list" options={{ headerShown: false, title: "Todos" }} />
      <Stack.Screen name="reminders-list" options={{ headerShown: false, title: "Reminders" }} />
      <Stack.Screen name="calendar" options={{ headerShown: false, title: "Calendar" }} />
      <Stack.Screen name="renewals-list" options={{ headerShown: false, title: "Renewals" }} />
      <Stack.Screen name="renewal-detail" options={{ headerShown: false, title: "Renewal Detail" }} />
      <Stack.Screen name="add-renewal" options={{ headerShown: false, title: "Add Renewal" }} />
      <Stack.Screen name="timesheet" options={{ headerShown: false, title: "Timesheet" }} />
    </Stack>
  );
}
