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
import { CrmProject } from "./types";
import { fetchCrmProjects } from "./utils/api";

const PROJECT_STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  "1": { label: "Not Started", color: "#64748b", bg: "#f1f5f9" },
  "2": { label: "In Progress", color: "#3b82f6", bg: "#eff6ff" },
  "3": { label: "On Hold",     color: "#f59e0b", bg: "#fffbeb" },
  "4": { label: "Cancelled",   color: "#ef4444", bg: "#fef2f2" },
  "5": { label: "Finished",    color: "#10b981", bg: "#f0fdf4" },
};

const projectStatus = (s: string) =>
  PROJECT_STATUSES[s] ?? { label: "Unknown", color: "#64748b", bg: "#f1f5f9" };

const formatDate = (d: string | null) => {
  if (!d || d === "0000-00-00") return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export default function ProjectsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [projects, setProjects] = useState<CrmProject[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchCrmProjects();
      setProjects(data);
    } catch {
      setProjects([]);
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

  const filtered = projects.filter((p) => {
    const matchSearch = !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = Object.keys(PROJECT_STATUSES).reduce<Record<string, number>>((acc, key) => {
    acc[key] = projects.filter((p) => p.status === key).length;
    return acc;
  }, {});

  const STATUS_TABS = [
    { key: "", label: "All", count: projects.length },
    ...Object.entries(PROJECT_STATUSES).map(([key, val]) => ({
      key,
      label: val.label,
      count: statusCounts[key] || 0,
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
          <Text style={styles.headerTitle}>Projects</Text>
          {projects.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{projects.length}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/create-project")}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={17} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects..."
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

      {/* Status filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScrollView}
        contentContainerStyle={styles.tabsContent}
      >
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.key;
          const st = tab.key ? PROJECT_STATUSES[tab.key] : null;
          return (
            <TouchableOpacity
              key={tab.key || "all"}
              style={[
                styles.tab,
                isActive && { backgroundColor: st?.color ?? "#3b82f6", borderColor: "transparent" },
              ]}
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
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading projects...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
          }
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={56} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No projects found</Text>
              {(search.length > 0 || statusFilter) && (
                <Text style={styles.emptySubtitle}>Try a different search or filter</Text>
              )}
            </View>
          ) : (
            filtered.map((project) => {
              const st = projectStatus(project.status);
              const progress = Math.min(100, Math.max(0, Number(project.progress) || 0));
              return (
                <TouchableOpacity
                  key={project.id}
                  style={[styles.card, { borderLeftColor: st.color }]}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({ pathname: "/project-detail", params: { projectId: project.id } })
                  }
                >
                  {/* ID + Status badge */}
                  <View style={styles.cardTop}>
                    <Text style={styles.projectId}>P-{String(project.id).padStart(5, "0")}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                      <Text style={[styles.statusLabel, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>

                  {/* Project name */}
                  <Text style={styles.projectName} numberOfLines={2}>{project.name}</Text>

                  {/* Dates */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="play-outline" size={12} color="#94a3b8" />
                      <Text style={styles.metaText}>{formatDate(project.start_date)}</Text>
                    </View>
                    {project.deadline && project.deadline !== "0000-00-00" && (
                      <View style={[styles.metaItem, styles.metaItemRight]}>
                        <Ionicons name="flag-outline" size={12} color="#94a3b8" />
                        <Text style={styles.metaText}>{formatDate(project.deadline)}</Text>
                      </View>
                    )}
                  </View>

                  {/* Progress bar */}
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
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center",
    alignItems: "center",
  },
  countBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 20,
  },
  countText: { fontSize: 12, color: "#fff", fontWeight: "700" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1e293b" },

  tabsScrollView: { maxHeight: 50 },
  tabsContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: "row" },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tabText: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  tabTextActive: { color: "#fff" },

  listContent: { paddingHorizontal: 16, paddingTop: 8 },

  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10, padding: 32 },
  loadingText: { fontSize: 14, color: "#64748b" },

  emptyState: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#94a3b8" },
  emptySubtitle: { fontSize: 13, color: "#cbd5e1" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    paddingLeft: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  projectId: { fontSize: 12, fontWeight: "800", color: "#3b82f6", letterSpacing: 0.5 },
  projectName: { fontSize: 15, fontWeight: "600", color: "#0f172a", lineHeight: 21, marginBottom: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusLabel: { fontSize: 11, fontWeight: "700" },

  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  metaItemRight: { justifyContent: "flex-end" },
  metaText: { fontSize: 12, color: "#64748b" },

  progressSection: { gap: 6 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressLabel: { fontSize: 11, color: "#94a3b8", fontWeight: "500" },
  progressPct: { fontSize: 11, fontWeight: "700" },
  progressTrack: { height: 5, backgroundColor: "#f1f5f9", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
});
