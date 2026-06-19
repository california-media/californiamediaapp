import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getCrmBaseUrl, getUserId, STATIC_TOKEN } from './config';

const PROJECT_ID = 'd771165e-0599-4af1-9f62-a87f97da1928';

// Foreground notification display — must be set at module level
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<void> {
  if (!Device.isDevice) {
    console.log('[Push] Physical device required');
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'California CRM',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1e3a5f',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Permission denied');
    return;
  }

  const projectId =
    (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ?? PROJECT_ID;

  let token: string;
  try {
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('[Push] Token:', token);
  } catch (e) {
    console.log('[Push] getExpoPushTokenAsync failed:', e);
    return;
  }

  const crmUrl = getCrmBaseUrl();
  if (!crmUrl) return;

  try {
    const res = await fetch(`${crmUrl}/push_token.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STATIC_TOKEN}`,
      },
      body: JSON.stringify({ token, staff_id: getUserId() }),
    });
    console.log('[Push] Registered with CRM, status:', res.status);
  } catch (e) {
    console.log('[Push] CRM registration failed:', e);
  }
}
