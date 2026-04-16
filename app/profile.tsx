import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  clearConfig,
  getCrmBaseUrl,
  getStaffInfo,
  getUserId,
  logout,
} from "./utils/config";

export default function ProfileScreen() {
  const router = useRouter();
  const staff = getStaffInfo();
  const userId = getUserId();
  const crmDomain = getCrmBaseUrl().replace(/^https?:\/\//, "");

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);

  const fullName = staff
    ? `${staff.firstname} ${staff.lastname}`.trim()
    : "User";
  const initials = staff
    ? `${staff.firstname?.[0] ?? ""}${staff.lastname?.[0] ?? ""}`.toUpperCase()
    : "U";
  const isAdmin = staff?.admin === "1";

  const formatLastLogin = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace("/login");
  };

  const handleChangeServer = async () => {
    setShowServerModal(false);
    await clearConfig();
    router.replace("/connect");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.fullName}>{fullName}</Text>
          <Text style={styles.emailText}>{staff?.email ?? "—"}</Text>
          <View
            style={[
              styles.roleBadge,
              isAdmin ? styles.adminBadge : styles.staffBadge,
            ]}
          >
            <Ionicons
              name={isAdmin ? "shield-checkmark" : "person"}
              size={13}
              color={isAdmin ? "#7c3aed" : "#0369a1"}
            />
            <Text
              style={[
                styles.roleText,
                isAdmin ? styles.adminText : styles.staffText,
              ]}
            >
              {isAdmin ? "Administrator" : "Staff"}
            </Text>
          </View>
        </View>

        {/* Account details */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account Details</Text>
          <View style={styles.card}>
            <InfoRow
              icon="finger-print-outline"
              label="User ID"
              value={`#${userId}`}
            />
            <Divider />
            <InfoRow
              icon="call-outline"
              label="Extension"
              value={staff?.extension || "—"}
            />
            <Divider />
            <InfoRow
              icon="phone-portrait-outline"
              label="Phone"
              value={staff?.phonenumber || "—"}
            />
            <Divider />
            <InfoRow
              icon="time-outline"
              label="Last Login"
              value={formatLastLogin(staff?.last_login ?? "")}
            />
          </View>
        </View>

        {/* Server */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Server</Text>
          <View style={styles.card}>
            <InfoRow
              icon="server-outline"
              label="CRM Domain"
              value={crmDomain || "—"}
            />
          </View>
        </View>

        {/* Change server */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.rowAction}
            onPress={() => setShowServerModal(true)}
            activeOpacity={0.75}
          >
            <View style={styles.rowActionIcon}>
              <Ionicons name="swap-horizontal-outline" size={20} color="#6366f1" />
            </View>
            <Text style={styles.rowActionText}>Change Server</Text>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.appLabel}>MyDesk CRM</Text>
      </ScrollView>

      {/* Logout modal */}
      <ConfirmModal
        visible={showLogoutModal}
        iconName="log-out-outline"
        iconBg="#fef2f2"
        iconColor="#ef4444"
        title="Log Out?"
        body="You'll need to sign in again to access the CRM."
        confirmLabel="Log Out"
        confirmColor="#ef4444"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />

      {/* Change server modal */}
      <ConfirmModal
        visible={showServerModal}
        iconName="swap-horizontal-outline"
        iconBg="#eef2ff"
        iconColor="#6366f1"
        title="Change Server?"
        body="This will clear all session data and return you to the Connect screen."
        confirmLabel="Continue"
        confirmColor="#6366f1"
        onCancel={() => setShowServerModal(false)}
        onConfirm={handleChangeServer}
      />
    </View>
  );
}

/* ─── sub-components ─── */

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon as any} size={18} color="#6366f1" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function ConfirmModal({
  visible,
  iconName,
  iconBg,
  iconColor,
  title,
  body,
  confirmLabel,
  confirmColor,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  iconName: string;
  iconBg: string;
  iconColor: string;
  title: string;
  body: string;
  confirmLabel: string;
  confirmColor: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={[styles.modalIconWrap, { backgroundColor: iconBg }]}>
            <Ionicons name={iconName as any} size={30} color={iconColor} />
          </View>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalBody}>{body}</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: confirmColor }]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ─── styles ─── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  header: {
    backgroundColor: "#6366f1",
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },

  scroll: { paddingBottom: 48 },

  avatarCard: {
    backgroundColor: "#6366f1",
    alignItems: "center",
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.45)",
  },
  avatarText: { fontSize: 34, fontWeight: "700", color: "#fff" },
  fullName: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 4 },
  emailText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 14,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  adminBadge: { backgroundColor: "#ede9fe" },
  staffBadge: { backgroundColor: "#e0f2fe" },
  roleText: { fontSize: 13, fontWeight: "600" },
  adminText: { color: "#7c3aed" },
  staffText: { color: "#0369a1" },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: "#94a3b8", marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: "500", color: "#1e293b" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginLeft: 66 },

  rowAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  rowActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
  },
  rowActionText: { flex: 1, fontSize: 15, fontWeight: "500", color: "#1e293b" },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#ef4444",
    marginHorizontal: 20,
    marginTop: 28,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: { fontSize: 16, fontWeight: "600", color: "#fff" },

  appLabel: {
    textAlign: "center",
    marginTop: 28,
    fontSize: 12,
    color: "#cbd5e1",
    letterSpacing: 0.5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    alignItems: "center",
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: { flexDirection: "row", gap: 12, width: "100%" },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "600", color: "#64748b" },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmText: { fontSize: 15, fontWeight: "600", color: "#fff" },
});
