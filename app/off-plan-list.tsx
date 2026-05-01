// app/off-plan-list.tsx — Reelly off-plan projects listing with filters
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { FilterOptions, FilterParams, fetchFilters, fetchProjects } from "./utils/projectsApi";

const EMPTY_FILTERS: FilterParams = { developers: [], areas: [], statuses: [], payments: [] };

export default function OffPlanListScreen() {
  const [projects, setProjects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);

  // Filter state
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ developers: [], areas: [], statuses: [], payments: [] });
  const [activeFilters, setActiveFilters] = useState<FilterParams>(EMPTY_FILTERS);
  const [pendingFilters, setPendingFilters] = useState<FilterParams>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const router = useRouter();

  const load = async (pageNum: number = 1, refresh: boolean = false, filters: FilterParams = activeFilters) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetchProjects(pageNum, 10, filters);
      setTotalPages(res.totalPages ?? 1);
      setTotalProjects(res.totalProjects ?? 0);
      const items = res.data ?? [];
      if (refresh || pageNum === 1) setProjects(items);
      else setProjects((prev) => [...prev, ...items]);
      setPage(pageNum);
    } catch {
      // silent
    } finally {
      if (pageNum === 1) setLoading(false);
      else setLoadingMore(false);
    }
  };

  useEffect(() => {
    load(1, true);
    fetchFilters().then(setFilterOptions).catch(() => {});
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(1, true, activeFilters);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loadingMore && !loading && page < totalPages) load(page + 1, false, activeFilters);
  };

  const applyFilters = () => {
    setActiveFilters(pendingFilters);
    setShowFilters(false);
    load(1, true, pendingFilters);
  };

  const resetFilters = () => {
    setPendingFilters(EMPTY_FILTERS);
    setActiveFilters(EMPTY_FILTERS);
    setShowFilters(false);
    load(1, true, EMPTY_FILTERS);
  };

  const toggleItem = (key: keyof FilterParams, value: string) => {
    setPendingFilters((prev) => {
      const arr = (prev[key] as string[]) ?? [];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const filteredProjects = searchQuery
    ? projects.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.developer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.area?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : projects;

  const getStatusColor = (s: string) => {
    const l = s?.toLowerCase();
    if (l === "available") return "#10b981";
    if (l === "sold" || l === "out of stock") return "#ef4444";
    if (l === "reserved" || l === "under construction") return "#f59e0b";
    if (l === "completed") return "#3b82f6";
    return "#6366f1";
  };

  const renderCard = ({ item }: { item: any }) => {
    const imgUrl = item.s3_cover_url || item.cover_image_url?.url || "";
    const status = item.sale_status || "Off-Plan";
    const price = item.max_price_aed
      ? `AED ${Number(item.max_price_aed).toLocaleString()}`
      : "Price on Request";

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push({ pathname: "/project-detail", params: { projectId: item.id } })}
        activeOpacity={0.88}
      >
        <View style={styles.imageWrap}>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="business-outline" size={44} color="#c7d2fe" />
            </View>
          )}
          <View style={[styles.badge, { backgroundColor: getStatusColor(status) }]}>
            <Text style={styles.badgeText}>{status}</Text>
          </View>
        </View>
        <View style={styles.info}>
          <View style={styles.devRow}>
            <Ionicons name="business-outline" size={13} color="#6366f1" />
            <Text style={styles.dev} numberOfLines={1}>{item.developer || "Developer"}</Text>
          </View>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <View style={styles.locRow}>
            <Ionicons name="location-outline" size={13} color="#94a3b8" />
            <Text style={styles.loc} numberOfLines={1}>{item.area || "Dubai"}</Text>
          </View>
          <Text style={styles.price}>{price}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Filter section renderer ──
  const FilterSection = ({ title, items, filterKey }: { title: string; items: string[]; filterKey: keyof FilterParams }) => {
    const selected = (pendingFilters[filterKey] as string[]) ?? [];
    if (!items.length) return null;
    return (
      <View style={styles.fsSection}>
        <Text style={styles.fsTitle}>{title}</Text>
        <View style={styles.fsChips}>
          {items.map((item) => {
            const on = selected.includes(item);
            return (
              <TouchableOpacity
                key={item}
                style={[styles.fsChip, on && styles.fsChipOn]}
                onPress={() => toggleItem(filterKey, item)}
              >
                <Text style={[styles.fsChipText, on && styles.fsChipTextOn]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder={
              totalProjects > 0
                ? `Search ${filteredProjects.length} of ${totalProjects} projects`
                : "Search off-plan projects…"
            }
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading off-plan projects…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProjects}
          keyExtractor={(item) => String(item._id || item.id)}
          renderItem={renderCard}
          contentContainerStyle={[styles.list, filteredProjects.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadMore}>
                <ActivityIndicator size="small" color="#6366f1" />
                <Text style={styles.loadMoreText}>Loading more…</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="business-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Off-Plan Projects</Text>
              <Text style={styles.emptyText}>No projects match your filters.</Text>
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <Modal visible={showFilters} animationType="slide" transparent onRequestClose={() => setShowFilters(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Sheet header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filter Projects</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <FilterSection title="Status" items={filterOptions.statuses} filterKey="statuses" />
              <FilterSection title="Area" items={filterOptions.areas} filterKey="areas" />
              <FilterSection title="Developer" items={filterOptions.developers} filterKey="developers" />
              <FilterSection title="Payment Plan" items={filterOptions.payments} filterKey="payments" />
            </ScrollView>

            {/* Actions */}
            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", paddingTop: 30 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#64748b" },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 12, gap: 12, marginBottom: 12,
  },
  backBtn: {
    width: 44, height: 44, justifyContent: "center", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0",
  },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", paddingHorizontal: 16, height: 44,
    borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#1e293b" },
  filterBtn: {
    width: 44, height: 44, justifyContent: "center", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0",
    position: "relative",
  },
  filterBadge: {
    position: "absolute", top: -4, right: -4,
    backgroundColor: "#6366f1", borderRadius: 10,
    minWidth: 18, height: 18,
    justifyContent: "center", alignItems: "center", paddingHorizontal: 3,
  },
  filterBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  list: { paddingHorizontal: 16, paddingBottom: 20 },
  listEmpty: { flexGrow: 1, justifyContent: "center" },

  card: {
    backgroundColor: "#fff", borderRadius: 16, marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  imageWrap: { position: "relative" },
  image: { width: "100%", height: 200, resizeMode: "cover" },
  imagePlaceholder: { backgroundColor: "#eef2ff", justifyContent: "center", alignItems: "center" },
  badge: { position: "absolute", top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  badgeText: { fontSize: 11, color: "#fff", fontWeight: "700" },

  info: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 },
  devRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 },
  dev: { fontSize: 12, color: "#6366f1", fontWeight: "600" },
  name: { fontSize: 17, fontWeight: "700", color: "#0f172a", marginBottom: 8, lineHeight: 22 },
  locRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 10 },
  loc: { fontSize: 13, color: "#64748b" },
  price: { fontSize: 16, fontWeight: "700", color: "#6366f1" },

  loadMore: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 20, gap: 8 },
  loadMoreText: { fontSize: 14, color: "#64748b" },

  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: "600", color: "#1e293b", marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#64748b", textAlign: "center", lineHeight: 20 },

  // ── Filter Modal ──
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: "80%", paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },

  // Filter sections
  fsSection: { paddingHorizontal: 20, paddingTop: 18 },
  fsTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  fsChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  fsChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#f1f5f9", borderWidth: 1.5, borderColor: "transparent",
  },
  fsChipOn: { backgroundColor: "#eef2ff", borderColor: "#6366f1" },
  fsChipText: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  fsChipTextOn: { color: "#6366f1", fontWeight: "600" },

  sheetActions: {
    flexDirection: "row", gap: 12,
    paddingHorizontal: 20, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: "#f1f5f9",
  },
  resetBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: "#e2e8f0", alignItems: "center",
  },
  resetBtnText: { fontSize: 15, fontWeight: "600", color: "#64748b" },
  applyBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: "#6366f1", alignItems: "center" },
  applyBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
});
