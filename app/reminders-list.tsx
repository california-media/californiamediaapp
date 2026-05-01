import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "./components/Toast";
import {
  getAuthToken,
  getCrmApiUrl,
  getCrmCookie,
  getUserId,
} from "./utils/config";
import { useToast } from "./utils/useToast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Reminder {
  id: string;
  lead_id: string;
  description: string;
  date: string;
  staff: string;
  isnotified?: string;
  firstname?: string;
  lastname?: string;
}

// ─── Date picker helpers ──────────────────────────────────────────────────────

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function daysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function SpinnerField({
  label, value, min, max, formatter, onChange,
}: {
  label: string; value: number; min: number; max: number;
  formatter?: (v: number) => string; onChange: (v: number) => void;
}) {
  const display = formatter ? formatter(value) : String(value);
  const inc = () => onChange(value >= max ? min : value + 1);
  const dec = () => onChange(value <= min ? max : value - 1);
  return (
    <View style={spinnerStyles.col}>
      <Text style={spinnerStyles.label}>{label}</Text>
      <TouchableOpacity onPress={inc} style={spinnerStyles.btn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="chevron-up" size={20} color="#6366f1" />
      </TouchableOpacity>
      <Text style={spinnerStyles.value}>{display}</Text>
      <TouchableOpacity onPress={dec} style={spinnerStyles.btn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="chevron-down" size={20} color="#6366f1" />
      </TouchableOpacity>
    </View>
  );
}

const spinnerStyles = StyleSheet.create({
  col: { alignItems: 'center', flex: 1 },
  label: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 4 },
  btn: { padding: 4 },
  value: { fontSize: 16, fontWeight: '700', color: '#1e293b', minWidth: 40, textAlign: 'center' },
});

// ─── API helpers ──────────────────────────────────────────────────────────────

const baseHeaders = () => ({
  Authorization: getAuthToken(),
  Cookie: getCrmCookie(),
  "X-User-Id": getUserId(),
  Accept: "application/json",
});

const fmtDate = (raw: string): string => {
  if (!raw) return "";
  try {
    const d = new Date(raw.replace(" ", "T"));
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return raw; }
};

const fmtTime = (raw: string): string => {
  if (!raw) return "";
  try {
    const d = new Date(raw.replace(" ", "T"));
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch { return ""; }
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RemindersListScreen() {
  const router = useRouter();
  const { showToast, toastMsg, toastType, toastAnim } = useToast();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [remModal, setRemModal] = useState(false);
  const [remSaving, setRemSaving] = useState(false);

  // Form state
  const [remLeadId, setRemLeadId] = useState("");
  const [remDesc, setRemDesc] = useState("");
  const [remStaff, setRemStaff] = useState("");

  const _now = new Date();
  const [remDay, setRemDay] = useState(_now.getDate());
  const [remMonth, setRemMonth] = useState(_now.getMonth());
  const [remYear, setRemYear] = useState(_now.getFullYear());
  const [remHour, setRemHour] = useState(_now.getHours());
  const [remMin, setRemMin] = useState(0);

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadReminders = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await fetch(`${getCrmApiUrl()}/lead_reminders`, {
        headers: { ...baseHeaders(), "Content-Type": "application/json" },
      });
      if (!res.ok) { setReminders([]); return; }
      const data = await res.json();
      setReminders(Array.isArray(data) ? data : (data?.data ?? []));
    } catch {
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLeadReminders = async (leadId: string): Promise<Reminder[]> => {
    try {
      const res = await fetch(`${getCrmApiUrl()}/lead_reminders/${leadId}`, {
        headers: { ...baseHeaders(), "Content-Type": "application/json" },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch { return []; }
  };

  useEffect(() => { loadReminders(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReminders(true);
    setRefreshing(false);
  };

  // ── Create ────────────────────────────────────────────────────────────────

  const handleSaveReminder = async () => {
    if (!remDesc.trim() || !remLeadId.trim()) return;
    setRemSaving(true);
    try {
      const maxDay = daysInMonth(remMonth, remYear);
      const safeDay = Math.min(remDay, maxDay);
      const dateStr = `${remYear}-${String(remMonth + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')} ${String(remHour).padStart(2, '0')}:${String(remMin).padStart(2, '0')}:00`;
      const form = new FormData();
      form.append("lead_id", remLeadId.trim());
      form.append("date", dateStr);
      form.append("staff", remStaff.trim() || getUserId());
      form.append("description", remDesc.trim());
      const res = await fetch(`${getCrmApiUrl()}/lead_reminders/data`, {
        method: "POST", headers: baseHeaders(), body: form,
      });
      if (res.ok) {
        setRemModal(false);
        setRemLeadId("");
        setRemDesc("");
        setRemStaff("");
        const fresh = await loadLeadReminders(remLeadId.trim());
        setReminders(prev => {
          const ids = new Set(fresh.map(r => r.id));
          return [...prev.filter(r => r.lead_id !== remLeadId.trim() || !ids.has(r.id)), ...fresh];
        });
        showToast("Reminder created!", "success");
      } else {
        showToast("Could not save reminder.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setRemSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = (r: Reminder) => {
    Alert.alert("Delete Reminder", "Delete this reminder?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          const res = await fetch(`${getCrmApiUrl()}/lead_reminders/${r.id}`, {
            method: "DELETE", headers: baseHeaders(),
          });
          if (res.ok || res.status === 200) {
            setReminders(prev => prev.filter(x => x.id !== r.id));
          } else {
            showToast("Failed to delete.", "error");
          }
        },
      },
    ]);
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const sorted = [...reminders].sort((a, b) => {
    const da = new Date(a.date.replace(" ", "T")).getTime();
    const db = new Date(b.date.replace(" ", "T")).getTime();
    return da - db;
  });

  const pendingCount = sorted.filter(r => r.isnotified !== "1").length;
  const notifiedCount = sorted.filter(r => r.isnotified === "1").length;

  // ── Card ──────────────────────────────────────────────────────────────────

  const renderCard = ({ item }: { item: Reminder }) => {
    const isNotified = item.isnotified === "1";
    const name = item.firstname ? `${item.firstname} ${item.lastname || ""}`.trim() : null;
    const time = fmtTime(item.date);
    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <View style={[styles.dot, { backgroundColor: isNotified ? "#10b981" : "#f59e0b" }]} />
          {time ? <Text style={styles.timeText}>{time}</Text> : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.desc} numberOfLines={2}>{item.description || "No description"}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={11} color="#94a3b8" />
            <Text style={styles.metaText}>{fmtDate(item.date)}</Text>
            {item.lead_id ? (
              <View style={styles.leadBadge}>
                <Ionicons name="person-outline" size={10} color="#6366f1" />
                <Text style={styles.leadBadgeText}>Lead #{item.lead_id}</Text>
              </View>
            ) : null}
          </View>
          {name ? <Text style={styles.staffText}>{name}</Text> : null}
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.statusPill, { backgroundColor: isNotified ? "#d1fae5" : "#fef3c7" }]}>
            <View style={[styles.statusDot, { backgroundColor: isNotified ? "#10b981" : "#f59e0b" }]} />
            <Text style={[styles.statusText, { color: isNotified ? "#059669" : "#d97706" }]}>
              {isNotified ? "Notified" : "Pending"}
            </Text>
          </View>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Ionicons name="trash-outline" size={15} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ── Header ────────────────────────────────────────────────────────────────

  const Header = () => (
    <View style={styles.hero}>
      <View style={styles.heroDeco1} />
      <View style={styles.heroDeco2} />
      <View style={styles.heroTop}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.heroTitle}>Reminders</Text>
          <Text style={styles.heroSub}>{sorted.length} reminder{sorted.length !== 1 ? "s" : ""}</Text>
        </View>
        <TouchableOpacity style={styles.addHeroBtn} onPress={() => setRemModal(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={22} color="#6366f1" />
        </TouchableOpacity>
      </View>
      <View style={styles.heroStats}>
        {[
          { label: "Total", count: sorted.length, color: "#fff", bg: "rgba(255,255,255,0.18)" },
          { label: "Pending", count: pendingCount, color: "#fef3c7", bg: "rgba(245,158,11,0.25)" },
          { label: "Notified", count: notifiedCount, color: "#d1fae5", bg: "rgba(16,185,129,0.25)" },
        ].map(s => (
          <View key={s.label} style={[styles.heroStatPill, { backgroundColor: s.bg }]}>
            <Text style={[styles.heroStatNum, { color: s.color }]}>{s.count}</Text>
            <Text style={[styles.heroStatLbl, { color: s.color }]}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading reminders…</Text>
      </View>
    );
  }

  // ── Main ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <FlatList
        data={sorted}
        keyExtractor={(item, i) => `rem-${item.id}-${i}`}
        renderItem={renderCard}
        ListHeaderComponent={<Header />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" colors={["#6366f1"]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="alarm-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Reminders Yet</Text>
            <Text style={styles.emptySub}>Tap + to create a reminder for a lead</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setRemModal(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Create Reminder Modal */}
      <Modal visible={remModal} animationType="slide" transparent onRequestClose={() => setRemModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setRemModal(false)} />
          <View style={[styles.modalSheet, { maxHeight: "88%" }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Reminder</Text>
              <TouchableOpacity onPress={() => setRemModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>Lead ID *</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 48 }]}
                value={remLeadId}
                onChangeText={setRemLeadId}
                placeholder="e.g. 117"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={styles.textInput}
                value={remDesc}
                onChangeText={setRemDesc}
                placeholder="Reminder description…"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <Text style={styles.inputLabel}>Staff (optional)</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 48 }]}
                value={remStaff}
                onChangeText={setRemStaff}
                placeholder="Staff name or ID"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>Date & Time</Text>
              <View style={styles.spinnerContainer}>
                <View style={styles.spinnerRow}>
                  <SpinnerField label="DAY" value={remDay} min={1} max={daysInMonth(remMonth, remYear)} onChange={setRemDay} formatter={v => String(v).padStart(2, '0')} />
                  <SpinnerField label="MONTH" value={remMonth} min={0} max={11} onChange={setRemMonth} formatter={v => MONTHS_SHORT[v]} />
                  <SpinnerField label="YEAR" value={remYear} min={2024} max={2030} onChange={setRemYear} />
                </View>
                <View style={styles.spinnerDivider} />
                <View style={styles.spinnerRow}>
                  <SpinnerField label="HOUR" value={remHour} min={0} max={23} onChange={setRemHour} formatter={v => String(v).padStart(2, '0')} />
                  <View style={styles.spinnerColon}><Text style={styles.spinnerColonText}>:</Text></View>
                  <SpinnerField label="MIN" value={remMin} min={0} max={59} onChange={setRemMin} formatter={v => String(v).padStart(2, '0')} />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { marginBottom: 8 }, (!remDesc.trim() || !remLeadId.trim() || remSaving) && { opacity: 0.5 }]}
                onPress={handleSaveReminder}
                disabled={!remDesc.trim() || !remLeadId.trim() || remSaving}
                activeOpacity={0.85}
              >
                {remSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="alarm-outline" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>Create Reminder</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Toast msg={toastMsg} type={toastType} anim={toastAnim} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f1f5f9" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#64748b" },

  // ── Hero ──
  hero: {
    backgroundColor: "#4f46e5",
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 20,
    overflow: "hidden",
  },
  heroDeco1: {
    position: "absolute", width: 220, height: 220, borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.06)", top: -80, right: -50,
  },
  heroDeco2: {
    position: "absolute", width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.06)", bottom: -30, left: -20,
  },
  heroTop: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center", alignItems: "center",
  },
  heroTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  heroSub: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2, fontWeight: "500" },
  addHeroBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  heroStats: { flexDirection: "row", gap: 10 },
  heroStatPill: { flex: 1, borderRadius: 14, paddingVertical: 10, alignItems: "center", justifyContent: "center" },
  heroStatNum: { fontSize: 20, fontWeight: "800", marginBottom: 2 },
  heroStatLbl: { fontSize: 10, fontWeight: "600", opacity: 0.85 },

  // ── List ──
  listContent: { paddingBottom: 100, paddingTop: 8 },

  // ── Card ──
  card: {
    backgroundColor: "#fff", borderRadius: 14,
    marginHorizontal: 16, marginTop: 8,
    paddingHorizontal: 14, paddingVertical: 14,
    shadowColor: "#64748b", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
    flexDirection: "row", alignItems: "flex-start", gap: 12,
  },
  cardLeft: { alignItems: "center", gap: 4, paddingTop: 2 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  timeText: { fontSize: 10, color: "#94a3b8", fontWeight: "600" },
  desc: { fontSize: 14, fontWeight: "500", color: "#1e293b", lineHeight: 20, marginBottom: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
  metaText: { fontSize: 11, color: "#94a3b8", fontWeight: "500" },
  staffText: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
  leadBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#eef2ff", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
  },
  leadBadgeText: { fontSize: 10, color: "#6366f1", fontWeight: "700" },
  cardRight: { alignItems: "flex-end", gap: 8 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "700" },
  deleteBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: "#fef2f2", justifyContent: "center", alignItems: "center" },

  // ── FAB ──
  fab: {
    position: "absolute", bottom: 28, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#6366f1", justifyContent: "center", alignItems: "center",
    shadowColor: "#6366f1", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },

  // ── Modal ──
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0",
    alignSelf: "center", marginBottom: 20,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#0f172a" },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center" },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#64748b", marginBottom: 8 },
  textInput: {
    backgroundColor: "#f8fafc", borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0",
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0f172a",
    minHeight: 80, marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: "#6366f1", borderRadius: 14, paddingVertical: 15,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  saveBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  // ── Spinner ──
  spinnerContainer: {
    backgroundColor: "#f8fafc", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0",
    paddingVertical: 16, paddingHorizontal: 12, marginBottom: 16,
  },
  spinnerRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  spinnerDivider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 12 },
  spinnerColon: { alignItems: "center", justifyContent: "center", paddingBottom: 8 },
  spinnerColonText: { fontSize: 20, fontWeight: "700", color: "#94a3b8" },

  // ── Empty ──
  emptyBox: { alignItems: "center", paddingTop: 64, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: "#1e293b", marginTop: 16, textAlign: "center" },
  emptySub: { fontSize: 14, color: "#94a3b8", marginTop: 6, textAlign: "center" },
});
