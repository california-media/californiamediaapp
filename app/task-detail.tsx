import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CrmTask } from "./types";
import { fetchTask } from "./utils/api";

const TASK_STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  "1": { label: "Not Started", color: "#64748b", bg: "#f1f5f9" },
  "2": { label: "In Progress", color: "#3b82f6", bg: "#eff6ff" },
  "3": { label: "Testing",     color: "#8b5cf6", bg: "#f5f3ff" },
  "4": { label: "Awaiting Feedback", color: "#f59e0b", bg: "#fffbeb" },
  "5": { label: "Complete",    color: "#10b981", bg: "#f0fdf4" },
};

const TASK_PRIORITIES: Record<string, { label: string; color: string; bg: string }> = {
  "1": { label: "Low",    color: "#10b981", bg: "#f0fdf4" },
  "2": { label: "Medium", color: "#3b82f6", bg: "#eff6ff" },
  "3": { label: "High",   color: "#f59e0b", bg: "#fffbeb" },
  "4": { label: "Urgent", color: "#ef4444", bg: "#fef2f2" },
};

const formatDate = (d: string | null) => {
  if (!d || d === "0000-00-00" || d === "0000-00-00 00:00:00") return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export default function TaskDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const taskId = Array.isArray(params.taskId) ? params.taskId[0] : (params.taskId as string);

  const [task, setTask] = useState<CrmTask | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) { setLoading(false); return; }
    fetchTask(taskId).then((data) => {
      setTask(data);
      setLoading(false);
    });
  }, [taskId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading task...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={56} color="#ef4444" />
        <Text style={styles.errorText}>Task not found</Text>
        <TouchableOpacity style={styles.backBtnError} onPress={() => router.back()}>
          <Text style={styles.backBtnErrorText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const st = TASK_STATUSES[task.status] ?? TASK_STATUSES["1"];
  const pr = TASK_PRIORITIES[task.priority];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Task Details</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push({ pathname: "/edit-task", params: { taskId } })}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Text style={styles.heroId}>T-{String(task.id).padStart(5, "0")}</Text>
            <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
              <Text style={[styles.statusLabel, { color: st.color }]}>{st.label}</Text>
            </View>
          </View>
          <Text style={styles.heroName}>{task.name}</Text>
          {pr && (
            <View style={[styles.priorityBadge, { backgroundColor: pr.bg }]}>
              <View style={[styles.priorityDot, { backgroundColor: pr.color }]} />
              <Text style={[styles.priorityText, { color: pr.color }]}>{pr.label} Priority</Text>
            </View>
          )}
        </View>

        {/* Dates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Start Date</Text>
                <Text style={styles.infoValue}>{formatDate(task.startdate)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Due Date</Text>
                <Text style={styles.infoValue}>{formatDate(task.duedate)}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Date Added</Text>
                <Text style={styles.infoValue}>{formatDate(task.dateadded)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Finished</Text>
                <Text style={styles.infoValue}>{formatDate(task.datefinished)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Related */}
        {(task.rel_type || task.rel_id) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Related To</Text>
            <View style={styles.infoGrid}>
              <View style={[styles.infoRow, styles.infoRowLast]}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Type</Text>
                  <Text style={[styles.infoValue, { textTransform: "capitalize" }]}>{task.rel_type || "—"}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>ID</Text>
                  <Text style={styles.infoValue}>{task.rel_id || "—"}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Assigned */}
        {Array.isArray(task.assigned) && task.assigned.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned To</Text>
            <View style={styles.assignedCard}>
              {task.assigned.map((a) => (
                <View key={a.staffid} style={styles.assigneeRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(a.firstname || "?").charAt(0)}{(a.lastname || "").charAt(0)}
                    </Text>
                  </View>
                  <Text style={styles.assigneeName}>{a.firstname} {a.lastname}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        {!!task.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.descCard}>
              <Text style={styles.descText}>{task.description}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },
  loadingText: { fontSize: 14, color: "#64748b" },
  errorText: { fontSize: 16, color: "#64748b" },
  backBtnError: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: "#8b5cf6", borderRadius: 12 },
  backBtnErrorText: { color: "#fff", fontWeight: "600" },

  header: { backgroundColor: "#8b5cf6", flexDirection: "row", alignItems: "center", paddingBottom: 14, paddingHorizontal: 16, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", alignItems: "center" },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "700", color: "#fff" },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", alignItems: "center" },

  content: { paddingHorizontal: 16, paddingTop: 16 },

  heroCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  heroId: { fontSize: 12, fontWeight: "800", color: "#8b5cf6", letterSpacing: 0.5 },
  heroName: { fontSize: 20, fontWeight: "700", color: "#0f172a", marginBottom: 12, lineHeight: 26 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusLabel: { fontSize: 12, fontWeight: "700" },
  priorityBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: "flex-start" },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityText: { fontSize: 12, fontWeight: "700" },

  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 10 },

  infoGrid: { backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 16, paddingTop: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  infoRow: { flexDirection: "row", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", gap: 12 },
  infoRowLast: { borderBottomWidth: 0 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 11, color: "#94a3b8", fontWeight: "500", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.3 },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#0f172a" },

  assignedCard: { backgroundColor: "#fff", borderRadius: 14, padding: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  assigneeRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 13, fontWeight: "700", color: "#3b82f6" },
  assigneeName: { fontSize: 14, fontWeight: "600", color: "#1e293b" },

  descCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  descText: { fontSize: 14, color: "#475569", lineHeight: 21 },
});
