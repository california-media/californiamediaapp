import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage'; // you can use it manually if needed
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCVgOgTbXysC51gKZR_8kzJltKzTxSb9VA",
  authDomain: "mycrm-notifications.firebaseapp.com",
  projectId: "mycrm-notifications",
  storageBucket: "mycrm-notifications.appspot.com",
  messagingSenderId: "452330627373",
  appId: "1:452330627373:android:669d19005c2625c31fb3a4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Use getAuth without persistence (memory only)
export const auth = getAuth(app);

// Firestore DB
export const db = getFirestore(app);

export default app;