import { Ionicons } from "@expo/vector-icons";
import { Animated, StyleSheet, Text, View } from "react-native";
import { ToastType } from "../utils/useToast";

interface ToastProps {
  msg: string;
  type: ToastType;
  anim: Animated.Value;
}

const COLORS: Record<ToastType, string> = {
  success: "#10b981",
  error: "#ef4444",
  info: "#6366f1",
};

const ICONS: Record<ToastType, string> = {
  success: "checkmark",
  error: "close",
  info: "information-circle",
};

const TITLES: Record<ToastType, string> = {
  success: "Success",
  error: "Error",
  info: "Info",
};

export function Toast({ msg, type, anim }: ToastProps) {
  const color = COLORS[type];

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        { borderLeftColor: color },
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-90, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: color }]}>
        <Ionicons name={ICONS[type] as any} size={16} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{TITLES[type]}</Text>
        <Text style={styles.msg}>{msg}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 16,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#0f172a",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 10,
    borderLeftWidth: 4,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 1,
  },
  msg: {
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 16,
  },
});
