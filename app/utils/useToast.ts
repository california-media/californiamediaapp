import { useRef, useState } from "react";
import { Animated } from "react-native";

export type ToastType = "success" | "error" | "info";

export function useToast() {
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const toastAnim = useRef(new Animated.Value(0)).current;

  const showToast = (msg: string, type: ToastType = "success") => {
    setToastMsg(msg);
    setToastType(type);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 9 }),
      Animated.delay(2200),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  return { showToast, toastMsg, toastType, toastAnim };
}
