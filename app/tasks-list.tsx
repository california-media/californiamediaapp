import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CrmTask } from "./types";
import { fetchTasks } from "./utils/api";
import { getStaffInfo } from "./utils/config";

const TASK_STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  "1": { label: "Not Started", color: "#64748b", bg: "#f1f5f9" },
  "2": { label: "In Progress", color: "#3b82f6", bg: "#eff6ff" },
  "3": { label: "Testing",     color: "#8b5cf6", bg: "#f5f3ff" },
  "4": { label: "Awaiting",    color: "#f59e0b", bg: "#fffbeb" },
  "5": { label: "Complete",    color: "#10b981", bg: "#f0fdf4" },
};

const TASK_PRIORITIES: Record<string, { label: string; color: string }> = {
  "1": { label: "Low",    color: "#10b981" },
  "2": { label: "Medium", color: "#3b82f6" },
  "3": { label: "High",   color: "#f59e0b" },
  "4": { label: "Urgent", color: "#ef4444" },
};

const formatDate = (d: string | null) => {
  if (!d || d === "0000-00-00" || d === "0000-00-00 00:00:00") return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export default function TasksListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [myTasksOnly, setMyTasksOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const staffInfo = getStaffInfo();
  const myStaffId = String(staffInfo?.staffid || "");

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchTasks();
      setTasks(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const isMyTask = (t: CrmTask) => {
    if (!myStaffId) return true;
    if (String(t.addedfrom) === myStaffId) return true;
    if (Array.isArray(t.assigned) && t.assigned.some(a => String(a.staffid) === myStaffId)) return true;
    return false;
  };

  const filtered = tasks.filter((t) => {
    if (myTasksOnly && !isMyTask(t)) return false;
    const matchSearch = !search.trim() ||
      t.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const visibleTasks = myTasksOnly ? tasks.filter(isMyTask) : tasks;

  const STATUS_TABS = [
    { key: "", label: "All", count: visibleTasks.length },
    ...Object.entries(TASK_STATUSES).map(([key, val]) => ({
      key,
      label: val.label,
      count: visibleTasks.filter(t => t.status === key).length,
    })),
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Tasks</Text>
          {tasks.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{filtered.length}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.myBtn, myTasksOnly && styles.myBtnActive]}
          onPress={() => setMyTasksOnly((v) => !v)}
        >
          <Ionicons name="person" size={14} color={myTasksOnly ? "#3b82f6" : "#fff"} />
          <Text style={[styles.myBtnText, myTasksOnly && styles.myBtnTextActive]}>
            {myTasksOnly ? "Mine" : "All"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/create-task")}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={17} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={17} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Status tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.key;
          const st = tab.key ? TASK_STATUSES[tab.key] : null;
          return (
            <TouchableOpacity
              key={tab.key || "all"}
              style={[styles.tab, isActive && { backgroundColor: st?.color ?? "#3b82f6", borderColor: "transparent" }]}
              onPress={() => setStatusFilter(tab.key)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}{tab.count > 0 ? ` (${tab.count})` : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-outline" size={56} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No tasks found</Text>
              {(search.length > 0 || statusFilter || myTasksOnly) && (
                <Text style={styles.emptySubtitle}>Try clearing filters</Text>
              )}
            </View>
          ) : (
            filtered.map((task) => {
              const st = TASK_STATUSES[task.status] ?? TASK_STATUSES["1"];
              const pr = TASK_PRIORITIES[task.priority];
              return (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.card, { borderLeftColor: st.color }]}
                  activeOpacity={0.85}
                  onPress={() => router.push({ pathname: "/task-detail", params: { taskId: task.id } })}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.taskId}>T-{String(task.id).padStart(5, "0")}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                      <Text style={[styles.statusLabel, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.taskName} numberOfLines={2}>{task.name}</Text>
                  <View style={styles.metaRow}>
                    {pr && (
                      <View style={styles.metaItem}>
                        <View style={[styles.priorityDot, { backgroundColor: pr.color }]} />
                        <Text style={[styles.metaText, { color: pr.color }]}>{pr.label}</Text>
                      </View>
                    )}
                    {task.duedate && task.duedate !== "0000-00-00 00:00:00" && (
                      <View style={[styles.metaItem, { marginLeft: "auto" }]}>
                        <Ionicons name="flag-outline" size={12} color="#94a3b8" />
                        <Text style={styles.metaText}>{formatDate(task.duedate)}</Text>
                      </View>
                    )}
                  </View>
                  {task.rel_type && task.rel_id && (
                    <Text style={styles.relText}>{task.rel_type} #{task.rel_id}</Text>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },

  header: {
    backgroundColor: "#8b5cf6",
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", alignItems: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  countBadge: { backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: 9, paddingVertical: 2, borderRadius: 20 },
  countText: { fontSize: 12, color: "#fff", fontWeight: "700" },
  myBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1.5, borderColor: "transparent" },
  myBtnActive: { backgroundColor: "#fff", borderColor: "#fff" },
  myBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  myBtnTextActive: { color: "#3b82f6" },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.22)", justifyContent: "center", alignItems: "center" },

  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 16, marginTop: 12, marginBottom: 8, borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1.5, borderColor: "#e2e8f0", gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#1e293b" },

  tabsScroll: { maxHeight: 50 },
  tabsContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: "row" },
  tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0" },
  tabText: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  tabTextActive: { color: "#fff" },

  listContent: { paddingHorizontal: 16, paddingTop: 8 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10, padding: 32 },
  loadingText: { fontSize: 14, color: "#64748b" },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#94a3b8" },
  emptySubtitle: { fontSize: 13, color: "#cbd5e1" },

  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, paddingLeft: 16, marginBottom: 10, borderLeftWidth: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  taskId: { fontSize: 12, fontWeight: "800", color: "#8b5cf6", letterSpacing: 0.5 },
  taskName: { fontSize: 15, fontWeight: "600", color: "#0f172a", lineHeight: 21, marginBottom: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusLabel: { fontSize: 11, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: "#64748b" },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  relText: { fontSize: 11, color: "#94a3b8", marginTop: 4, textTransform: "capitalize" },
});
