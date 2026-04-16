import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getCrmBaseUrl, setAuthToken, clearConfig } from "./utils/config";

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const crmDomain = getCrmBaseUrl().replace(/^https?:\/\//, "");

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // TODO: Replace with real login API call once available.
      // Example:
      // const res = await fetch(`${getCrmBaseUrl()}/api/auth/login`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ username, password }),
      // });
      // const data = await res.json();
      // if (!res.ok) throw new Error(data.message || "Login failed");
      // await setAuthToken(data.token);

      // Placeholder: store a session marker until the real API is ready
      await setAuthToken("__placeholder_token__");
      router.replace("/");
    } catch (err: any) {
      setError(err?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeServer = async () => {
    await clearConfig();
    router.replace("/connect");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed-outline" size={48} color="#6366f1" />
        </View>

        <Text style={styles.title}>Sign in</Text>

        {/* CRM badge */}
        <View style={styles.serverBadge}>
          <Ionicons name="server-outline" size={14} color="#6366f1" />
          <Text style={styles.serverText} numberOfLines={1}>
            {crmDomain}
          </Text>
          <TouchableOpacity onPress={handleChangeServer} hitSlop={8}>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Username */}
        <View style={styles.inputWrapper}>
          <Ionicons
            name="person-outline"
            size={20}
            color="#94a3b8"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#94a3b8"
            value={username}
            onChangeText={(t) => {
              setUsername(t);
              if (error) setError("");
            }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
        </View>

        {/* Password */}
        <View style={styles.inputWrapper}>
          <Ionicons
            name="key-outline"
            size={20}
            color="#94a3b8"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (error) setError("");
            }}
            secureTextEntry={!showPassword}
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((p) => !p)}
            hitSlop={8}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#94a3b8"
            />
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={14} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>
          Login API integration pending. Tap Sign In to continue.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 16,
  },
  serverBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#eef2ff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    marginBottom: 28,
    maxWidth: "90%",
  },
  serverText: {
    fontSize: 13,
    color: "#6366f1",
    fontWeight: "500",
    flex: 1,
  },
  changeText: {
    fontSize: 13,
    color: "#6366f1",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: "#ef4444",
  },
  button: {
    backgroundColor: "#6366f1",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  note: {
    marginTop: 20,
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 18,
  },
});
