

// import * as Notifications from 'expo-notifications';
// import * as Device from 'expo-device';
// import Constants from 'expo-constants';

// // Set notification handler for foreground notifications
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: false,
//     shouldSetBadge: false,
//     shouldShowBanner: true,
//     shouldShowList: true,
//   }),
// });

// // Function to get Expo push token
// export async function registerForPushNotificationsAsync() {
//   console.log('[Notifications] Checking device...');
//   let token;

//   if (Device.isDevice) {
//     console.log('[Notifications] Requesting permissions...');
//     const { status: existingStatus } = await Notifications.getPermissionsAsync();
//     let finalStatus = existingStatus;
//     console.log('[Notifications] Existing status:', existingStatus);

//     if (existingStatus !== 'granted') {
//       const { status } = await Notifications.requestPermissionsAsync();
//       finalStatus = status;
//       console.log('[Notifications] Requested status:', finalStatus);
//     }

//     if (finalStatus !== 'granted') {
//       alert('Failed to get push token for push notifications!');
//       console.log('[Notifications] Permission not granted.');
//       return;
//     }

//     token = (await Notifications.getExpoPushTokenAsync()).data;
//     console.log('[Notifications] Push token received:', token);
//   } else {
//     alert('Must use physical device for Push Notifications');
//     console.log('[Notifications] Not a physical device.');
//   }

//   return token;
// }// utils/notifications.ts
export default function Notifications() {
  return null; // or your component JSX
}