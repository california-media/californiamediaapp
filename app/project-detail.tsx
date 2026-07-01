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
import { CrmProject } from "./types";
import { fetchCrmProject } from "./utils/api";

const PROJECT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  "1": { label: "Not Started", color: "#64748b", bg: "#f1f5f9" },
  "2": { label: "In Progress", color: "#3b82f6", bg: "#eff6ff" },
  "3": { label: "On Hold",     color: "#f59e0b", bg: "#fffbeb" },
  "4": { label: "Cancelled",   color: "#ef4444", bg: "#fef2f2" },
  "5": { label: "Finished",    color: "#10b981", bg: "#f0fdf4" },
};

const BILLING_TYPES: Record<string, string> = {
  "1": "Fixed Rate",
  "2": "Project Hours",
  "3": "Task Hours",
};

const formatDate = (d: string | null) => {
  if (!d || d === "0000-00-00") return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const formatCurrency = (val: string) => {
  const n = parseFloat(val);
  if (!n) return "—";
  return `AED ${n.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function ProjectDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : (params.projectId as string);

  const [project, setProject] = useState<CrmProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }
    fetchCrmProject(projectId).then((data) => {
      setProject(data);
      setLoading(false);
    });
  }, [projectId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading project...</Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={56} color="#ef4444" />
        <Text style={styles.errorText}>Project not found</Text>
        <TouchableOpacity style={styles.backBtnError} onPress={() => router.back()}>
          <Text style={styles.backBtnErrorText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const st = PROJECT_STATUS[project.status] ?? PROJECT_STATUS["1"];
  const progress = Math.min(100, Math.max(0, Number(project.progress) || 0));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Project Details</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push({ pathname: "/edit-project", params: { projectId } })}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Text style={styles.heroId}>P-{String(project.id).padStart(5, "0")}</Text>
            <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
              <Text style={[styles.statusLabel, { color: st.color }]}>{st.label}</Text>
            </View>
          </View>
          <Text style={styles.heroName}>{project.name}</Text>

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={[styles.progressPct, { color: st.color }]}>{progress}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%` as any, backgroundColor: st.color },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Start Date</Text>
                <Text style={styles.infoValue}>{formatDate(project.start_date)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Deadline</Text>
                <Text style={styles.infoValue}>{formatDate(project.deadline)}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>{formatDate(project.project_created)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Finished</Text>
                <Text style={styles.infoValue}>{formatDate(project.date_finished)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Project Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Details</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Billing Type</Text>
                <Text style={styles.infoValue}>{BILLING_TYPES[project.billing_type] ?? "—"}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Project Cost</Text>
                <Text style={styles.infoValue}>{formatCurrency(project.project_cost)}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Estimated Hours</Text>
                <Text style={styles.infoValue}>
                  {parseFloat(project.estimated_hours) > 0 ? `${project.estimated_hours}h` : "—"}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Rate / Hour</Text>
                <Text style={styles.infoValue}>{formatCurrency(project.project_rate_per_hour)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        {!!project.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.descCard}>
              <Text style={styles.descText}>{project.description}</Text>
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
  backBtnError: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#3b82f6",
    borderRadius: 12,
  },
  backBtnErrorText: { color: "#fff", fontWeight: "600" },

  header: {
    backgroundColor: "#3b82f6",
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "700", color: "#fff" },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", alignItems: "center" },

  content: { paddingHorizontal: 16, paddingTop: 16 },

  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  heroId: { fontSize: 12, fontWeight: "800", color: "#3b82f6", letterSpacing: 0.5 },
  heroName: { fontSize: 20, fontWeight: "700", color: "#0f172a", marginBottom: 16, lineHeight: 26 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusLabel: { fontSize: 12, fontWeight: "700" },

  progressSection: { gap: 6 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressLabel: { fontSize: 12, color: "#94a3b8", fontWeight: "500" },
  progressPct: { fontSize: 13, fontWeight: "700" },
  progressTrack: { height: 8, backgroundColor: "#f1f5f9", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },

  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 10 },

  infoGrid: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 12,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoItem: { flex: 1 },
  infoLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "500",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#0f172a" },

  descCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  descText: { fontSize: 14, color: "#475569", lineHeight: 21 },
});
