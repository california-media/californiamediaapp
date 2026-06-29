import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getCrmBaseUrl,
  getCrmApiUrl,
  getCrmCookie,
  getAuthToken,
  getUserId,
  setCrmCookie,
  setUserId,
  setStaffInfo,
  clearConfig,
} from "./utils/config";
import { registerForPushNotificationsAsync } from "./utils/notifications";

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [brandingLogo, setBrandingLogo] = useState<string | null>(null);
  const [brandingName, setBrandingName] = useState<string | null>(null);
  const [brandingLoaded, setBrandingLoaded] = useState(false);

  const crmDomain = getCrmBaseUrl().replace(/^https?:\/\//, "");

  useEffect(() => {
    fetch(`${getCrmApiUrl()}/branding`, {
      headers: {
        Authorization: getAuthToken(),
        Cookie: getCrmCookie(),
        "X-User-Id": getUserId() || "1",
        Accept: "application/json",
      },
    })
      .then(async (r) => {
        const text = await r.text();
        try {
          const d = JSON.parse(text);
          if (d?.company_logo) setBrandingLogo(d.company_logo);
          if (d?.companyname) setBrandingName(d.companyname);
        } catch {}
      })
      .catch(() => {})
      .finally(() => setBrandingLoaded(true));
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${getCrmApiUrl()}/login/data`, {
        method: "POST",
        headers: {
          Authorization: getAuthToken(),
          Cookie: getCrmCookie(),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.status) {
        throw new Error(data.message || "Invalid email or password.");
      }

      // Capture fresh session cookie from the login response if available
      const freshCookie = res.headers.get("set-cookie");
      if (freshCookie) {
        await setCrmCookie(freshCookie);
      }

      await setUserId(data.user_id);
      if (data.staff) {
        await setStaffInfo(data.staff);
      }
      registerForPushNotificationsAsync();
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
        {/* Logo */}
        <View style={[styles.iconContainer, brandingLogo && styles.iconContainerLogo]}>
          {!brandingLoaded ? (
            <ActivityIndicator size="small" color="#6366f1" />
          ) : brandingLogo ? (
            <Image
              source={{ uri: brandingLogo }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          ) : (
            <Ionicons name="lock-closed-outline" size={48} color="#6366f1" />
          )}
        </View>

        <Text style={styles.title}>{brandingName ? `Sign in to ${brandingName}` : "Sign in"}</Text>

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
            placeholder="Email"
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
  iconContainerLogo: {
    backgroundColor: "transparent",
  },
  logoImage: {
    width: 88,
    height: 88,
    borderRadius: 22,
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
