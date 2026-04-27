import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Deal } from "./types";
import { fetchDeals } from "./utils/api";

const STATUS_OPTIONS = [
  { id: "", label: "All Statuses", color: "#64748b" },
  { id: "1", label: "New", color: "#6366f1" },
  { id: "2", label: "In Progress", color: "#f59e0b" },
  { id: "3", label: "Pending Payment", color: "#8b5cf6" },
  { id: "4", label: "Closed Won", color: "#10b981" },
  { id: "5", label: "Closed Lost", color: "#ef4444" },
];

const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f59e0b", "#10b981", "#06b6d4", "#3b82f6",
];
const avatarColor = (name: string) =>
  AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

const formatValue = (v: string | null) => {
  const n = parseFloat(v ?? "0");
  if (!n) return null;
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `AED ${(n / 1_000).toFixed(0)}K`;
  return `AED ${n.toLocaleString()}`;
};

const getStatusColor = (name: string | null) => {
  if (!name) return "#64748b";
  return STATUS_OPTIONS.find(
    (s) => s.label.toLowerCase() === name.toLowerCase(),
  )?.color ?? "#6366f1";
};

export default function DealsListScreen() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [tempStatus, setTempStatus] = useState("");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [tempSortOrder, setTempSortOrder] = useState<"ASC" | "DESC">("DESC");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const loadDeals = async (
    pageNum = 1,
    refresh = false,
    newStatus = statusFilter,
    newSort = sortOrder,
  ) => {
    if (pageNum === 1) { setLoading(true); setError(null); }
    else setLoadingMore(true);

    try {
      const params: any = { sort_by: "datecreated", sort_order: newSort, limit: 20, page: pageNum };
      if (searchQuery) params.search = searchQuery;
      if (newStatus) params.status = newStatus;

      const response = await fetchDeals(params);
      const newDeals = Array.isArray(response.data) ? response.data : [];
      if (response.total !== undefined) setTotalResults(response.total);

      if (refresh || pageNum === 1) {
        setDeals(newDeals);
      } else {
        setDeals((prev) => {
          const seen = new Set(prev.map((d) => d.id));
          return [...prev, ...newDeals.filter((d) => !seen.has(d.id))];
        });
      }
      setHasMore(newDeals.length === 20);
      setPage(pageNum);
    } catch {
      setError("Failed to load deals. Please try again.");
      if (pageNum === 1) setDeals([]);
    } finally {
      if (pageNum === 1) setLoading(false);
      else setLoadingMore(false);
    }
  };

  useEffect(() => { loadDeals(1, true); }, [statusFilter, sortOrder]);
  useEffect(() => {
    const t = setTimeout(() => loadDeals(1, true), 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDeals(1, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore && !loading && deals.length > 0) loadDeals(page + 1);
  };

  const applyFilters = () => {
    setStatusFilter(tempStatus);
    setSortOrder(tempSortOrder);
    setShowFilterModal(false);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
    ]).start();
  };

  const clearFilters = () => {
    setStatusFilter(""); setTempStatus("");
    setSortOrder("DESC"); setTempSortOrder("DESC");
    setSearchQuery("");
    setShowFilterModal(false);
  };

  const hasActiveFilters = () => statusFilter !== "";

  /* ── Card ── */
  const renderCard = ({ item }: { item: Deal }) => {
    const color = avatarColor(item.deal_name ?? "");
    const statusColor = getStatusColor(item.status_name);
    const value = formatValue(item.deal_value);
    const hasPhone = !!item.client_phone;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({ pathname: "/deal-detail", params: { deal: JSON.stringify(item) } })
        }
        activeOpacity={0.72}
      >
        {/* Top row */}
        <View style={styles.cardTop}>
          <View style={[styles.avatar, { backgroundColor: color + "22" }]}>
            <Ionicons name="briefcase-outline" size={20} color={color} />
          </View>

          <View style={styles.cardMeta}>
            <Text style={styles.dealName} numberOfLines={1}>{item.deal_name}</Text>
            <View style={styles.clientRow}>
              <Ionicons name="person-outline" size={11} color="#94a3b8" />
              <Text style={styles.clientText} numberOfLines={1}>{item.client_name || "—"}</Text>
            </View>
          </View>

          {hasPhone && (
            <View style={styles.actionIcons}>
              <TouchableOpacity
                style={styles.iconBtnCall}
                onPress={(e) => {
                  e.stopPropagation();
                  Linking.openURL(`tel:${item.client_phone.replace(/\D/g, "")}`).catch(() => {});
                }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="call" size={15} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtnWa}
                onPress={(e) => {
                  e.stopPropagation();
                  Linking.openURL(`https://wa.me/${item.client_phone.replace(/\D/g, "")}`).catch(() => {});
                }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="logo-whatsapp" size={15} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.cardDivider} />

        {/* Bottom row */}
        <View style={styles.cardBottom}>
          {value ? (
            <View style={styles.valueBadge}>
              <Ionicons name="cash-outline" size={11} color="#6366f1" />
              <Text style={styles.valueText}>{value}</Text>
            </View>
          ) : (
            <View style={styles.valueBadge}>
              <Ionicons name="flash-outline" size={11} color="#94a3b8" />
              <Text style={styles.sourceText}>{item.source_name || item.deal_source || "Direct"}</Text>
            </View>
          )}

          <View style={[styles.statusPill, { backgroundColor: statusColor + "18" }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusLabel, { color: statusColor }]} numberOfLines={1}>
              {item.status_name || "New"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /* ── Header ── */
  const ListHeader = () => (
    <>
      <Animated.View style={[styles.successBanner, { opacity: fadeAnim }]}>
        <Ionicons name="checkmark-circle" size={18} color="#10b981" />
        <Text style={styles.successText}>Filters applied</Text>
      </Animated.View>

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1e293b" />
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search deals…"
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilterModal(true)}>
          <Ionicons name="options-outline" size={22} color="#6366f1" />
          {hasActiveFilters() && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>1</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          {deals.length > 0
            ? `${deals.length} of ${totalResults} deals`
            : "No deals found"}
        </Text>
        {hasActiveFilters() && (
          <TouchableOpacity style={styles.clearChip} onPress={clearFilters}>
            <Ionicons name="close-circle" size={13} color="#6366f1" />
            <Text style={styles.clearChipText}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  /* ── Filter modal ── */
  const filterModal = (
    <Modal visible={showFilterModal} animationType="slide" transparent onRequestClose={() => setShowFilterModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Deals</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#1e293b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionLabel}>Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {STATUS_OPTIONS.map((o) => (
                    <TouchableOpacity
                      key={o.id || "all"}
                      style={[styles.chip, tempStatus === o.id && styles.chipActive]}
                      onPress={() => setTempStatus(o.id)}
                    >
                      <View style={[styles.dotSmall, { backgroundColor: o.color }]} />
                      <Text style={[styles.chipText, tempStatus === o.id && styles.chipTextActive]}>
                        {o.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionLabel}>Sort</Text>
              <View style={styles.sortRow}>
                {(["DESC", "ASC"] as const).map((order) => (
                  <TouchableOpacity
                    key={order}
                    style={[styles.sortBtn, tempSortOrder === order && styles.sortBtnActive]}
                    onPress={() => setTempSortOrder(order)}
                  >
                    <Ionicons name={order === "DESC" ? "arrow-down" : "arrow-up"} size={16}
                      color={tempSortOrder === order ? "#fff" : "#64748b"} />
                    <Text style={[styles.sortBtnText, tempSortOrder === order && styles.sortBtnTextActive]}>
                      {order === "DESC" ? "Newest First" : "Oldest First"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && deals.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading deals…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={40} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={deals}
        keyExtractor={(item, index) => `deal-${item.id}-${index}`}
        renderItem={renderCard}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#6366f1" />
              <Text style={styles.loadingMoreText}>Loading more…</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyBox}>
              <Ionicons name="briefcase-outline" size={60} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Deals Found</Text>
              <Text style={styles.emptySubtitle}>
                {hasActiveFilters() ? "Try adjusting your filters" : "Pull down to refresh"}
              </Text>
            </View>
          ) : null
        }
      />
      {filterModal}

      {/* FAB — Add Deal */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/add-deal")}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f1f5f9" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#64748b" },

  topBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    backgroundColor: "#fff", gap: 10,
    borderBottomWidth: 1, borderBottomColor: "#e2e8f0",
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: "#f8fafc", justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "#f8fafc", borderRadius: 12, paddingHorizontal: 12,
    borderWidth: 1, borderColor: "#e2e8f0", gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#1e293b" },
  filterBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: "#eef2ff", justifyContent: "center", alignItems: "center",
    position: "relative",
  },
  filterBadge: {
    position: "absolute", top: -4, right: -4,
    backgroundColor: "#6366f1", borderRadius: 9,
    minWidth: 18, height: 18, justifyContent: "center", alignItems: "center", paddingHorizontal: 3,
  },
  filterBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  statsRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  statsText: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  clearChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#eef2ff", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
  },
  clearChipText: { fontSize: 12, color: "#6366f1", fontWeight: "500" },

  successBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#d1fae5", marginHorizontal: 16, marginTop: 12,
    padding: 10, borderRadius: 10,
  },
  successText: { fontSize: 13, color: "#065f46", fontWeight: "500" },

  listContent: { paddingBottom: 28, paddingTop: 4 },

  card: {
    backgroundColor: "#fff", borderRadius: 14,
    marginHorizontal: 16, marginTop: 8,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10,
    shadowColor: "#64748b", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  cardTop: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 10 },
  cardMeta: { flex: 1, marginRight: 8 },
  dealName: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 2 },
  clientRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  clientText: { fontSize: 12, color: "#64748b", flex: 1 },
  actionIcons: { flexDirection: "row", gap: 6 },
  iconBtnCall: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: "#2563eb",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#2563eb", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2,
  },
  iconBtnWa: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: "#25D366",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#25D366", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  cardDivider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 8 },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  valueBadge: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  valueText: { fontSize: 11, color: "#6366f1", fontWeight: "600" },
  sourceText: { fontSize: 11, color: "#94a3b8", fontWeight: "500" },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, maxWidth: 140 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusLabel: { fontSize: 10, fontWeight: "600" },

  emptyBox: { alignItems: "center", paddingTop: 60, paddingBottom: 40 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: "#1e293b", marginTop: 14 },
  emptySubtitle: { fontSize: 14, color: "#94a3b8", marginTop: 6 },
  errorBox: { alignItems: "center", padding: 32 },
  errorText: { fontSize: 15, color: "#64748b", textAlign: "center", marginTop: 10, marginBottom: 18 },
  retryBtn: { backgroundColor: "#6366f1", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { fontSize: 14, fontWeight: "600", color: "#fff" },

  footerLoader: { paddingVertical: 20, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  loadingMoreText: { fontSize: 13, color: "#64748b" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, maxHeight: "80%",
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#0f172a" },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center" },

  filterSection: { marginBottom: 22 },
  filterSectionLabel: { fontSize: 12, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  chipRow: { flexDirection: "row", gap: 8, paddingRight: 20 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22,
    backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0",
  },
  chipActive: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  chipText: { fontSize: 13, color: "#475569" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  dotSmall: { width: 7, height: 7, borderRadius: 4 },

  sortRow: { flexDirection: "row", gap: 10 },
  sortBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 7, paddingVertical: 12, borderRadius: 12,
    backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0",
  },
  sortBtnActive: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  sortBtnText: { fontSize: 13, color: "#475569", fontWeight: "500" },
  sortBtnTextActive: { color: "#fff", fontWeight: "600" },

  modalFooter: { flexDirection: "row", gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  clearBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center" },
  clearBtnText: { fontSize: 15, fontWeight: "600", color: "#64748b" },
  applyBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: "#6366f1", alignItems: "center" },
  applyBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },

  fab: {
    position: "absolute", bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#6366f1",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#6366f1", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
});
