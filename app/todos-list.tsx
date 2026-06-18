import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getAuthToken,
  getCrmApiUrl,
  getCrmCookie,
  getUserId,
} from "./utils/config";
import { Toast } from "./components/Toast";
import { useToast } from "./utils/useToast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Todo {
  todoid: string;
  description: string;
  staffid: string;
  dateadded: string;
  finished: string;
  datefinished: string;
  item_order: string;
  lead_id: string;
  is_shown: string;
}

type FilterTab = "all" | "pending" | "done";

// ─── API helpers ──────────────────────────────────────────────────────────────

const baseHeaders = () => ({
  Authorization: getAuthToken(),
  Cookie: getCrmCookie(),
  "X-User-Id": getUserId(),
  Accept: "application/json",
});

const fetchTodosPage = async (finished: 0 | 1): Promise<Todo[]> => {
  const res = await fetch(
    `${getCrmApiUrl()}/todos/listing?page=0&finished=${finished}`,
    {
      method: "GET",
      headers: { ...baseHeaders(), "Content-Type": "application/json" },
    },
  );
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Status: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.data ?? []);
};

const fetchTodos = async (): Promise<Todo[]> => {
  const [pending, done] = await Promise.all([
    fetchTodosPage(0),
    fetchTodosPage(1),
  ]);
  return [...pending, ...done];
};

const addTodo = async (description: string): Promise<boolean> => {
  const form = new FormData();
  form.append("description", description);
  form.append("finished", "0");
  const res = await fetch(`${getCrmApiUrl()}/todos/data`, {
    method: "POST",
    headers: baseHeaders(),
    body: form,
  });
  return res.ok;
};

const updateTodo = async (
  id: string,
  description: string,
  finished: string,
): Promise<boolean> => {
  const form = new FormData();
  form.append("description", description);
  form.append("finished", finished);
  const res = await fetch(`${getCrmApiUrl()}/todos/${id}`, {
    method: "PUT",
    headers: baseHeaders(),
    body: form,
  });
  return res.ok;
};

const deleteTodo = async (id: string): Promise<boolean> => {
  const res = await fetch(`${getCrmApiUrl()}/todos/${id}`, {
    method: "DELETE",
    headers: baseHeaders(),
  });
  return res.ok || res.status === 200;
};

// ─── Date format ──────────────────────────────────────────────────────────────

const fmtDate = (raw: string): string => {
  if (!raw) return "";
  try {
    const d = new Date(raw.replace(" ", "T"));
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return raw;
  }
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TodosListScreen() {
  const router = useRouter();
  const { showToast, toastMsg, toastType, toastAnim } = useToast();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("pending");

  // modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [inputText, setInputText] = useState("");
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  // ── Data ──────────────────────────────────────────────────────────────────

  const load = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      setTodos(await fetchTodos());
    } catch {
      setError("Failed to load todos. Pull down to try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  // ── Modal helpers ─────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditingTodo(null);
    setInputText("");
    setModalVisible(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const openEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setInputText((todo.description || "").replace(/<br\s*\/?>\n?/gi, "\n").replace(/<[^>]+>/g, ""));
    setModalVisible(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingTodo(null);
    setInputText("");
  };

  const handleSave = async () => {
    const text = inputText.trim();
    if (!text) return;
    setSaving(true);
    try {
      let ok = false;
      if (editingTodo) {
        ok = await updateTodo(editingTodo.todoid, text, editingTodo.finished);
      } else {
        ok = await addTodo(text);
      }
      if (ok) {
        closeModal();
        await load(true);
      } else {
        showToast("Could not save. Please try again.", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle done ───────────────────────────────────────────────────────────

  const handleToggle = async (todo: Todo) => {
    setTogglingId(todo.todoid);
    const newFinished = todo.finished === "1" ? "0" : "1";
    try {
      const ok = await updateTodo(todo.todoid, todo.description, newFinished);
      if (ok) {
        setTodos((prev) =>
          prev.map((t) =>
            t.todoid === todo.todoid ? { ...t, finished: newFinished } : t,
          ),
        );
      }
    } catch {
      /* silent */
    } finally {
      setTogglingId(null);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = (todo: Todo) => {
    Alert.alert("Delete Todo", "Are you sure you want to delete this todo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const ok = await deleteTodo(todo.todoid);
          if (ok) {
            setTodos((prev) => prev.filter((t) => t.todoid !== todo.todoid));
          } else {
            showToast("Failed to delete. Try again.", "error");
          }
        },
      },
    ]);
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const filtered = todos.filter((t) => {
    if (activeTab === "pending") return t.finished === "0";
    if (activeTab === "done") return t.finished === "1";
    return true;
  });

  const counts = {
    all: todos.length,
    pending: todos.filter((t) => t.finished === "0").length,
    done: todos.filter((t) => t.finished === "1").length,
  };

  // ── Card ──────────────────────────────────────────────────────────────────

  const renderCard = ({ item }: { item: Todo }) => {
    const isDone = item.finished === "1";
    const hasLead = item.lead_id && item.lead_id !== "0";
    const toggling = togglingId === item.todoid;

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          {/* Checkbox */}
          <TouchableOpacity
            onPress={() => handleToggle(item)}
            style={[styles.checkbox, isDone ? styles.cbDone : styles.cbPending]}
            disabled={toggling}
            activeOpacity={0.7}
          >
            {toggling ? (
              <ActivityIndicator
                size={12}
                color={isDone ? "#fff" : "#6366f1"}
              />
            ) : isDone ? (
              <Ionicons name="checkmark" size={13} color="#fff" />
            ) : null}
          </TouchableOpacity>

          {/* Content */}
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.desc, isDone && styles.descDone]}
              numberOfLines={2}
            >
              {(item.description || "No description").replace(/<br\s*\/?>\n?/gi, "\n").replace(/<[^>]+>/g, "")}
            </Text>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={11} color="#94a3b8" />
              <Text style={styles.metaText}>{fmtDate(item.dateadded)}</Text>
              {hasLead ? (
                <View style={styles.leadBadge}>
                  <Ionicons name="person-outline" size={10} color="#6366f1" />
                  <Text style={styles.leadBadgeText}>Lead #{item.lead_id}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Status + actions */}
          <View style={styles.cardRight}>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: isDone ? "#d1fae5" : "#fef3c7" },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isDone ? "#10b981" : "#f59e0b" },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isDone ? "#059669" : "#d97706" },
                ]}
              >
                {isDone ? "Done" : "Pending"}
              </Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => openEdit(item)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="create-outline" size={15} color="#6366f1" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="trash-outline" size={15} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ── Header ────────────────────────────────────────────────────────────────

  const Header = () => (
    <>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroDeco1} />
        <View style={styles.heroDeco2} />

        <View style={styles.heroTop}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.heroTitle}>To Do’s</Text>
            <Text style={styles.heroSub}>
              {counts.pending} pending · {counts.done} done
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addHeroBtn}
            onPress={openAdd}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={22} color="#6366f1" />
          </TouchableOpacity>
        </View>

        {/* Stat pills inside hero */}
        <View style={styles.heroStats}>
          {[
            {
              label: "All",
              count: counts.all,
              color: "#fff",
              bg: "rgba(255,255,255,0.18)",
            },
            {
              label: "Pending",
              count: counts.pending,
              color: "#fef3c7",
              bg: "rgba(245,158,11,0.25)",
            },
            {
              label: "Done",
              count: counts.done,
              color: "#d1fae5",
              bg: "rgba(16,185,129,0.25)",
            },
          ].map((s) => (
            <View
              key={s.label}
              style={[styles.heroStatPill, { backgroundColor: s.bg }]}
            >
              <Text style={[styles.heroStatNum, { color: s.color }]}>
                {s.count}
              </Text>
              <Text style={[styles.heroStatLbl, { color: s.color }]}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.tabRow}>
        {(["pending", "done", "all"] as FilterTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab && styles.tabLabelActive,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            <View
              style={[
                styles.tabBadge,
                activeTab === tab && styles.tabBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.tabBadgeText,
                  activeTab === tab && styles.tabBadgeTextActive,
                ]}
              >
                {counts[tab]}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  // ── Loading / Error ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading todos…</Text>
      </View>
    );
  }

  if (error && todos.length === 0) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={56} color="#ef4444" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Main ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item, i) => `todo-${item.todoid}-${i}`}
        renderItem={renderCard}
        ListHeaderComponent={<Header />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
            colors={["#6366f1"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="checkmark-done-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>
              {activeTab === "done"
                ? "No Completed Todos"
                : activeTab === "pending"
                  ? "No Pending Todos"
                  : "No Todos Yet"}
            </Text>
            <Text style={styles.emptySub}>Tap + to add your first todo</Text>
          </View>
        }
      />

      {/* FAB – secondary add shortcut */}
      <TouchableOpacity
        style={styles.fab}
        onPress={openAdd}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Add / Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={closeModal}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTodo ? "Edit Todo" : "New To Do"}
              </Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="What needs to be done?"
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.saveBtn,
                (!inputText.trim() || saving) && { opacity: 0.5 },
              ]}
              onPress={handleSave}
              disabled={!inputText.trim() || saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={editingTodo ? "checkmark-circle" : "add-circle"}
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.saveBtnText}>
                    {editingTodo ? "Save Changes" : "Add Todo"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
  },
  loadingText: { marginTop: 12, fontSize: 14, color: "#64748b" },

  // ── Hero header ──
  hero: {
    backgroundColor: "#4f46e5",
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 20,
    overflow: "hidden",
  },
  heroDeco1: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -80,
    right: -50,
  },
  heroDeco2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -30,
    left: -20,
  },
  heroTop: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  heroSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
    fontWeight: "500",
  },
  addHeroBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heroStats: { flexDirection: "row", gap: 10 },
  heroStatPill: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  heroStatNum: { fontSize: 20, fontWeight: "800", marginBottom: 2 },
  heroStatLbl: { fontSize: 10, fontWeight: "600", opacity: 0.85 },

  // ── Tabs ──
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tabActive: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  tabLabel: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  tabLabelActive: { color: "#fff" },
  tabBadge: {
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  tabBadgeActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  tabBadgeText: { fontSize: 11, fontWeight: "700", color: "#64748b" },
  tabBadgeTextActive: { color: "#fff" },

  // ── List ──
  listContent: { paddingBottom: 100, paddingTop: 8 },

  // ── Card ──
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },

  // Checkbox
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
    flexShrink: 0,
  },
  cbDone: { backgroundColor: "#10b981" },
  cbPending: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#cbd5e1",
  },

  // Text
  desc: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1e293b",
    lineHeight: 20,
    marginBottom: 6,
  },
  descDone: { textDecorationLine: "line-through", color: "#94a3b8" },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
  },
  metaText: { fontSize: 11, color: "#94a3b8", fontWeight: "500" },
  leadBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#eef2ff",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  leadBadgeText: { fontSize: 10, color: "#6366f1", fontWeight: "700" },

  // Right side
  cardRight: { alignItems: "flex-end", gap: 8 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "700" },
  actionRow: { flexDirection: "row", gap: 6 },
  editBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
  },

  // ── FAB ──
  fab: {
    position: "absolute",
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },

  // ── Modal ──
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e2e8f0",
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#0f172a" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0f172a",
    minHeight: 80,
    marginBottom: 20,
  },
  saveBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  // ── Empty / Error ──
  emptyBox: { alignItems: "center", paddingTop: 64, paddingHorizontal: 32 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 16,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 6,
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e293b",
    marginTop: 14,
  },
  errorSub: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 12,
  },
  retryText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
