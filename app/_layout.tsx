import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { initConfig, getStaffInfo } from "./utils/config";
import { NotificationProvider, useNotification } from "./utils/NotificationContext";
import { disconnectPusher, initPusher } from "./utils/pusherService";
import { registerForPushNotificationsAsync } from "./utils/notifications";

function AppContent() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    initConfig().then(({ crmUrl, userId }) => {
      console.log('[Push] initConfig done, userId:', userId, 'crmUrl:', crmUrl);
      if (!crmUrl) {
        router.replace("/connect");
      } else if (!userId) {
        router.replace("/login");
      } else {
        registerForPushNotificationsAsync();
      }
    });

    // In-app WebSocket notifications (app open)
    const pusher = initPusher();
    pusher.bind("leads", "new-lead", (data: unknown) => {
      const d = data as { name?: string; email?: string; assigned?: number };
      const staffInfo = getStaffInfo();
      const isAdmin = staffInfo?.admin === "1";
      const myId = Number(staffInfo?.staffid ?? 0);
      console.log('[Pusher] new-lead assigned:', d.assigned, 'myId:', myId, 'isAdmin:', isAdmin);
      // Only notify if admin OR lead is assigned to current user OR unassigned (assigned=0)
      if (!isAdmin && d.assigned && d.assigned !== myId) {
        console.log('[Pusher] filtered — not for this user');
        return;
      }
      const label = d.name || d.email || "Unknown";
      showNotification(`New lead: ${label}`, "info");
    });

    // Handle notification tap (app background/closed → foreground)
    const tapListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const notifData = response.notification.request.content.data as {
          type?: string;
          lead_id?: number;
        };
        if (notifData?.type === "new_lead" && notifData.lead_id) {
          router.push({ pathname: "/lead-detail", params: { lead_id: String(notifData.lead_id) } });
        }
      }
    );

    cleanupRef.current = () => {
      tapListener.remove();
      disconnectPusher();
    };

    return () => {
      cleanupRef.current?.();
    };
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

export default function RootLayout() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}
