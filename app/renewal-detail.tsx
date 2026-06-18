import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "./components/Toast";
import { useToast } from "./utils/useToast";
import {
  addRenewalNote,
  cancelRenewal,
  deleteRenewal,
  deleteRenewalNote,
  fetchRenewalById,
  fetchRenewalHistory,
  fetchRenewalNotes,
  renewRenewal,
} from "./utils/api";
import { getStaffInfo } from "./utils/config";

type Tab = "details" | "notes" | "history";

const STATUS_COLORS: Record<string, string> = {
  active: "#16a34a",
  expiring: "#f59e0b",
  expired: "#ef4444",
  cancelled: "#94a3b8",
};

const STATUS_BG: Record<string, string> = {
  active: "#dcfce7",
  expiring: "#fef9c3",
  expired: "#fee2e2",
  cancelled: "#f1f5f9",
};

const formatDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const formatDateTime = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const formatPrice = (p: string | number) => {
  const n = parseFloat(String(p));
  if (!n) return "—";
  return `AED ${n.toLocaleString()}`;
};

const daysUntil = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);

function InfoRow({ icon, label, value, valueColor }: { icon: any; label: string; value?: string | null; valueColor?: string }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}><Ionicons name={icon} size={18} color="#6366f1" /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
      </View>
    </View>
  );
}

export default function RenewalDetailScreen() {
  const router = useRouter();
  const { showToast, toastMsg, toastType, toastAnim } = useToast();
  const { renewal: renewalParam } = useLocalSearchParams<{ renewal: string }>();
  const [renewal, setRenewal] = useState<any>(JSON.parse(renewalParam ?? "{}"));
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const isAdmin = getStaffInfo()?.admin === "1";

  const [notes, setNotes] = useState<any[]>([]);
  const [notesFetched, setNotesFetched] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteModal, setNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  const [history, setHistory] = useState<any[]>([]);
  const [historyFetched, setHistoryFetched] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const fabAnim = useRef(new Animated.Value(0)).current;
  const [fabOpen, setFabOpen] = useState(false);

  const toggleFab = () => {
    Animated.spring(fabAnim, { toValue: fabOpen ? 0 : 1, useNativeDriver: true, tension: 80, friction: 8 }).start();
    setFabOpen(p => !p);
  };

  useFocusEffect(useCallback(() => {
    if (renewal.id) {
      fetchRenewalById(renewal.id).then(fresh => { if (fresh) setRenewal(fresh); });
    }
  }, [renewal.id]));

  useEffect(() => {
    if (activeTab === "notes" && !notesFetched) loadNotes();
    if (activeTab === "history" && !historyFetched) loadHistory();
  }, [activeTab]);

  const loadNotes = async () => {
    setNotesLoading(true);
    fetchRenewalNotes(renewal.id).then(data => {
      setNotes(Array.isArray(data) ? data : []);
      setNotesFetched(true);
      setNotesLoading(false);
    });
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    fetchRenewalHistory(renewal.id).then(data => {
      setHistory(Array.isArray(data) ? data : []);
      setHistoryFetched(true);
      setHistoryLoading(false);
    });
  };

  const saveNote = async () => {
    if (!noteText.trim()) return;
    setNoteSaving(true);
    const res = await addRenewalNote(renewal.id, noteText.trim());
    setNoteSaving(false);
    if (res.status) {
      setNoteText("");
      setNoteModal(false);
      setNotesFetched(false);
      loadNotes();
      setHistoryFetched(false);
    } else {
      showToast(res.message || "Failed to save note.", "error");
    }
  };

  const confirmDeleteNote = (note: any) => {
    Alert.alert("Delete Note", "Delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          const res = await deleteRenewalNote(note.id);
          if (res.status) setNotes(prev => prev.filter(n => n.id !== note.id));
          else showToast("Failed to delete note.", "error");
        },
      },
    ]);
  };

  const handleRenew = () => {
    Alert.alert(
      "Renew",
      `Extend "${renewal.domain}" by one ${renewal.renewal_type?.toLowerCase() ?? "period"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Renew", onPress: async () => {
            setActionLoading(true);
            const res = await renewRenewal(renewal.id);
            setActionLoading(false);
            if (res.status) {
              showToast(`Renewed! New expiry: ${res.new_expiry}`, "success");
              if (res.data) setRenewal(res.data);
              setHistoryFetched(false);
            } else {
              showToast(res.message || "Failed to renew.", "error");
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert("Cancel Renewal", `Cancel "${renewal.domain}"? This cannot be undone.`, [
      { text: "Back", style: "cancel" },
      {
        text: "Cancel Renewal", style: "destructive",
        onPress: async () => {
          setActionLoading(true);
          const res = await cancelRenewal(renewal.id);
          setActionLoading(false);
          if (res.status) {
            showToast("Renewal cancelled.", "success");
            setRenewal((p: any) => ({ ...p, status: "cancelled" }));
          } else {
            showToast(res.message || "Failed.", "error");
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert("Delete", `Delete renewal for "${renewal.domain}"? Cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          const res = await deleteRenewal(renewal.id);
          if (res.status) {
            showToast("Deleted.", "success");
            setTimeout(() => router.back(), 1000);
          } else {
            showToast("Failed to delete.", "error");
          }
        },
      },
    ]);
  };

  const sc = STATUS_COLORS[renewal.status] ?? "#64748b";
  const sbg = STATUS_BG[renewal.status] ?? "#f1f5f9";
  const days = renewal.expiry_date ? daysUntil(renewal.expiry_date) : 0;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <TouchableOpacity style={styles.heroBack} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.heroEdit}
            onPress={() => router.push({ pathname: "/add-renewal", params: { renewal: renewalParam } })}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
          </TouchableOpacity>
          {isAdmin && (
            <TouchableOpacity style={styles.heroDelete} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color="#fca5a5" />
            </TouchableOpacity>
          )}

          <View style={styles.heroIcon}>
            <Ionicons name="reload-circle" size={32} color="#fff" />
          </View>
          <Text style={styles.heroDomain} numberOfLines={2}>{renewal.domain || "—"}</Text>
          <Text style={styles.heroCustomer}>{renewal.customer_name || ""}</Text>

          <View style={[styles.heroBadge, { backgroundColor: sbg }]}>
            <View style={[styles.heroBadgeDot, { backgroundColor: sc }]} />
            <Text style={[styles.heroBadgeText, { color: sc }]}>{renewal.status}</Text>
          </View>

          {/* Expiry countdown */}
          {renewal.expiry_date && renewal.status !== "cancelled" ? (
            <View style={styles.heroExpiry}>
              <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.75)" />
              <Text style={styles.heroExpiryText}>
                {days < 0 ? `Expired ${Math.abs(days)}d ago` : days === 0 ? "Expires today" : `${days} days left`}
                {"  ·  "}{formatDate(renewal.expiry_date)}
              </Text>
            </View>
          ) : null}

          {/* Action buttons */}
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={[styles.heroBtn, { backgroundColor: "#10b981" }]}
              onPress={handleRenew}
              disabled={actionLoading}
            >
              {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <Ionicons name="refresh" size={15} color="#fff" />
                  <Text style={styles.heroBtnText}>Renew</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.heroBtn,
                { backgroundColor: "rgba(239,68,68,0.25)", borderWidth: 1, borderColor: "rgba(239,68,68,0.4)" },
                renewal.status === "cancelled" && { opacity: 0.4 },
              ]}
              onPress={handleCancel}
              disabled={actionLoading || renewal.status === "cancelled"}
            >
              <Ionicons name="close-circle-outline" size={15} color="#fca5a5" />
              <Text style={[styles.heroBtnText, { color: "#fca5a5" }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab strip */}
        <View style={styles.tabStrip}>
          {(["details", "notes", "history"] as Tab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {tab === "notes" && notesFetched && notes.length > 0 && (
                <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{notes.length}</Text></View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Details */}
        {activeTab === "details" && (
          <View style={styles.section}>
            <InfoRow icon="globe-outline" label="Domain" value={renewal.domain} />
            <InfoRow icon="business-outline" label="Customer" value={renewal.customer_name} />
            <InfoRow icon="cube-outline" label="Product" value={renewal.product_name} />
            <InfoRow icon="cash-outline" label="Price" value={formatPrice(renewal.price)} valueColor="#6366f1" />
            <InfoRow icon="refresh-outline" label="Renewal Type" value={renewal.renewal_type} />
            <InfoRow icon="calendar-outline" label="Registration Date" value={formatDate(renewal.registration_date)} />
            <InfoRow icon="alert-circle-outline" label="Expiry Date" value={formatDate(renewal.expiry_date)} valueColor={days <= 30 && renewal.status !== "cancelled" ? "#f59e0b" : undefined} />
            <InfoRow icon="time-outline" label="Last Renewed" value={formatDate(renewal.last_renewed_at)} />
            <InfoRow icon="create-outline" label="Added" value={formatDateTime(renewal.created_at)} />
            {renewal.notes ? <InfoRow icon="document-text-outline" label="Notes" value={renewal.notes} /> : null}
          </View>
        )}

        {/* Notes */}
        {activeTab === "notes" && (
          <View style={styles.tabContent}>
            <View style={styles.tabContentHeader}>
              <Text style={styles.tabContentTitle}>Notes</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => { setNoteText(""); setNoteModal(true); }}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.addButtonText}>Add Note</Text>
              </TouchableOpacity>
            </View>
            {notesLoading ? (
              <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
            ) : notes.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={44} color="#cbd5e1" />
                <Text style={styles.emptyText}>No notes yet</Text>
              </View>
            ) : notes.map(note => (
              <View key={note.id} style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <View style={styles.noteAvatar}>
                    <Text style={styles.noteAvatarText}>{note.firstname?.charAt(0) ?? "S"}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noteAuthor}>{[note.firstname, note.lastname].filter(Boolean).join(" ") || "Staff"}</Text>
                    <Text style={styles.noteDate}>{formatDateTime(note.created_at)}</Text>
                  </View>
                  {isAdmin && (
                    <TouchableOpacity style={styles.deleteNoteBtn} onPress={() => confirmDeleteNote(note)}>
                      <Ionicons name="trash-outline" size={15} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.noteBody}>{note.note}</Text>
              </View>
            ))}
          </View>
        )}

        {/* History */}
        {activeTab === "history" && (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentTitle}>Activity History</Text>
            {historyLoading ? (
              <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
            ) : history.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={44} color="#cbd5e1" />
                <Text style={styles.emptyText}>No history yet</Text>
              </View>
            ) : history.map((h, idx) => (
              <View key={h.id ?? idx} style={styles.historyRow}>
                <View style={styles.historyDotCol}>
                  <View style={[styles.historyDot, { backgroundColor: h.action === "renewed" ? "#10b981" : h.action === "cancelled" ? "#ef4444" : "#6366f1" }]} />
                  {idx < history.length - 1 && <View style={styles.historyLine} />}
                </View>
                <View style={styles.historyBody}>
                  <Text style={styles.historyAction}>{h.action?.charAt(0).toUpperCase() + h.action?.slice(1)}</Text>
                  {h.old_expiry_date || h.new_expiry_date ? (
                    <Text style={styles.historyDates}>
                      {h.old_expiry_date ? `${formatDate(h.old_expiry_date)} → ` : ""}{h.new_expiry_date ? formatDate(h.new_expiry_date) : ""}
                    </Text>
                  ) : null}
                  <Text style={styles.historyMeta}>
                    {[h.firstname, h.lastname].filter(Boolean).join(" ") || "System"} · {formatDateTime(h.created_at)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.fabMiniRow,
            {
              opacity: fabAnim,
              transform: [
                { translateY: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -64] }) },
                { scale: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
              ],
            },
          ]}
          pointerEvents={fabOpen ? "auto" : "none"}
        >
          <View style={styles.fabLabel}><Text style={styles.fabLabelText}>Add Note</Text></View>
          <TouchableOpacity
            style={[styles.fabMini, { backgroundColor: "#6366f1" }]}
            onPress={() => {
              Animated.spring(fabAnim, { toValue: 0, useNativeDriver: true }).start();
              setFabOpen(false);
              setNoteText("");
              setNoteModal(true);
              setActiveTab("notes");
            }}
          >
            <Ionicons name="create" size={18} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={styles.fab} onPress={toggleFab} activeOpacity={0.85}>
          <Animated.View style={{ transform: [{ rotate: fabAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "45deg"] }) }] }}>
            <Ionicons name="add" size={28} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Note Modal */}
      <Modal visible={noteModal} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Note</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={5}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Write your note..."
              placeholderTextColor="#94a3b8"
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setNoteModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, !noteText.trim() && { opacity: 0.4 }]}
                onPress={saveNote}
                disabled={noteSaving || !noteText.trim()}
              >
                {noteSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSaveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Toast msg={toastMsg} type={toastType} anim={toastAnim} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },

  hero: {
    backgroundColor: "#6366f1",
    paddingTop: 56, paddingBottom: 24, paddingHorizontal: 24,
    alignItems: "center",
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroBack: {
    position: "absolute", top: 54, left: 18,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", alignItems: "center",
  },
  heroEdit: {
    position: "absolute", top: 54, right: 18,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", alignItems: "center",
  },
  heroDelete: {
    position: "absolute", top: 54, right: 60,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(239,68,68,0.2)", justifyContent: "center", alignItems: "center",
  },
  heroIcon: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center", marginBottom: 10,
  },
  heroDomain: { fontSize: 20, fontWeight: "700", color: "#fff", textAlign: "center", marginBottom: 4 },
  heroCustomer: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 10 },
  heroBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 10,
  },
  heroBadgeDot: { width: 7, height: 7, borderRadius: 4 },
  heroBadgeText: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  heroExpiry: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 14 },
  heroExpiryText: { fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: "500" },
  heroActions: { flexDirection: "row", gap: 10, width: "100%" },
  heroBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 10, borderRadius: 12,
  },
  heroBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  tabStrip: {
    flexDirection: "row", marginHorizontal: 20, marginTop: 16,
    backgroundColor: "#fff", borderRadius: 14, padding: 4,
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  tabItem: { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: 10, flexDirection: "row", justifyContent: "center", gap: 4 },
  tabActive: { backgroundColor: "#6366f1" },
  tabText: { fontSize: 12, fontWeight: "600", color: "#94a3b8" },
  tabTextActive: { color: "#fff" },
  tabBadge: { backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  tabBadgeText: { fontSize: 10, fontWeight: "700", color: "#6366f1" },

  section: {
    backgroundColor: "#fff", marginTop: 16, marginHorizontal: 20,
    borderRadius: 20, padding: 20, gap: 16,
  },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  infoIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#e0e7ff", justifyContent: "center", alignItems: "center" },
  infoLabel: { fontSize: 10, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 14, color: "#1e293b", fontWeight: "500" },

  tabContent: { marginTop: 16, marginHorizontal: 20 },
  tabContentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  tabContentTitle: { fontSize: 17, fontWeight: "700", color: "#1e293b", marginBottom: 14 },
  addButton: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#6366f1", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  addButtonText: { fontSize: 13, fontWeight: "600", color: "#fff" },

  emptyState: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 14, color: "#94a3b8" },

  noteCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: "#f1f5f9",
  },
  noteHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  noteAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#e0e7ff", justifyContent: "center", alignItems: "center" },
  noteAvatarText: { fontSize: 13, fontWeight: "700", color: "#6366f1" },
  noteAuthor: { fontSize: 13, fontWeight: "600", color: "#1e293b" },
  noteDate: { fontSize: 11, color: "#94a3b8" },
  deleteNoteBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#fff1f2", justifyContent: "center", alignItems: "center" },
  noteBody: { fontSize: 13, color: "#475569", lineHeight: 19 },

  historyRow: { flexDirection: "row", gap: 12, marginBottom: 4 },
  historyDotCol: { alignItems: "center", width: 18, paddingTop: 3 },
  historyDot: { width: 10, height: 10, borderRadius: 5 },
  historyLine: { flex: 1, width: 2, backgroundColor: "#e2e8f0", marginTop: 4 },
  historyBody: { flex: 1, paddingBottom: 16 },
  historyAction: { fontSize: 13, fontWeight: "600", color: "#1e293b", marginBottom: 2, textTransform: "capitalize" },
  historyDates: { fontSize: 12, color: "#6366f1", marginBottom: 2 },
  historyMeta: { fontSize: 11, color: "#94a3b8" },

  fabContainer: { position: "absolute", bottom: 28, right: 20, alignItems: "center" },
  fabMiniRow: { position: "absolute", bottom: 0, right: 0, flexDirection: "row", alignItems: "center", gap: 10 },
  fabLabel: { backgroundColor: "#1e293b", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  fabLabelText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  fabMini: {
    width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  fab: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: "#6366f1",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#6366f1", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },

  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  modalSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24, paddingTop: 12,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 16 },
  textArea: {
    backgroundColor: "#f8fafc", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0",
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#1e293b", minHeight: 110,
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  modalCancel: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: "#f1f5f9", alignItems: "center" },
  modalCancelText: { fontSize: 15, fontWeight: "600", color: "#64748b" },
  modalSave: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: "#6366f1", alignItems: "center", justifyContent: "center" },
  modalSaveText: { fontSize: 15, fontWeight: "600", color: "#fff" },
});
