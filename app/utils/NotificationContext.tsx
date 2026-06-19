import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { Toast } from '../components/Toast';
import { ToastType } from './useToast';

interface NotificationContextValue {
  showNotification: (msg: string, type?: ToastType) => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  showNotification: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const anim = useRef(new Animated.Value(0)).current;

  const showNotification = useCallback(
    (message: string, notifType: ToastType = 'info') => {
      setMsg(message);
      setType(notifType);
      anim.stopAnimation(() => {
        anim.setValue(0);
        Animated.sequence([
          Animated.spring(anim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 80,
            friction: 9,
          }),
          Animated.delay(3500),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [anim],
  );

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      <View style={{ flex: 1 }}>
        {children}
        <Toast msg={msg} type={type} anim={anim} />
      </View>
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
