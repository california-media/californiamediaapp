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
import { Lead } from "./types";
import { fetchAllLeads } from "./utils/api";

const SOURCE_OPTIONS = [
  { id: "", label: "All Sources", icon: "globe-outline" },
  { id: "1", label: "Google", icon: "logo-google" },
  { id: "3", label: "Property Finder", icon: "business-outline" },
  { id: "10", label: "Bayut", icon: "home-outline" },
  { id: "5", label: "Dubizzle", icon: "cart-outline" },
  { id: "7", label: "Facebook", icon: "logo-facebook" },
  { id: "8", label: "Instagram", icon: "logo-instagram" },
  { id: "9", label: "Website", icon: "globe-outline" },
  { id: "11", label: "Referral", icon: "people-outline" },
];

const STATUS_OPTIONS = [
  { id: "", label: "All Statuses", color: "#64748b" },
  { id: "1", label: "New Lead", color: "#6366f1" },
  { id: "2", label: "Contacted", color: "#f59e0b" },
  { id: "3", label: "Qualified", color: "#10b981" },
  { id: "4", label: "Focused Follow Up", color: "#8b5cf6" },
  { id: "5", label: "Meeting Scheduled", color: "#06b6d4" },
  { id: "6", label: "Proposal Sent", color: "#ec4899" },
  { id: "7", label: "Negotiation", color: "#ef4444" },
  { id: "8", label: "Closed Won", color: "#22c55e" },
  { id: "9", label: "Closed Lost", color: "#6b7280" },
];

const UNIT_TYPE_OPTIONS = [
  { id: "", label: "All Types" },
  { id: "Studio", label: "Studio" },
  { id: "1BR", label: "1 Bedroom" },
  { id: "2BR", label: "2 Bedrooms" },
  { id: "3BR", label: "3 Bedrooms" },
  { id: "4BR", label: "4 Bedrooms" },
  { id: "5+BR", label: "5+ Bedrooms" },
  { id: "Villa", label: "Villa" },
  { id: "Townhouse", label: "Townhouse" },
  { id: "Penthouse", label: "Penthouse" },
];

// Consistent avatar color per initial letter
const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f59e0b", "#10b981", "#06b6d4", "#3b82f6",
];
const avatarColor = (name: string) =>
  AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

export default function LeadsListScreen() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    source: "",
    status: "",
    unit_type: "",
    sort_by: "dateadded",
    sort_order: "DESC" as "ASC" | "DESC",
  });
  const [tempFilters, setTempFilters] = useState(filters);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const loadLeads = async (
    pageNum: number = 1,
    refresh: boolean = false,
    newFilters?: typeof filters,
  ) => {
    const currentFilters = newFilters || filters;
    if (pageNum === 1) { setLoading(true); setError(null); }
    else setLoadingMore(true);

    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (currentFilters.source) params.source = currentFilters.source;
      if (currentFilters.status) params.status = currentFilters.status;
      if (currentFilters.unit_type) params.unit_type = currentFilters.unit_type;
      params.sort_by = currentFilters.sort_by;
      params.sort_order = currentFilters.sort_order;
      params.limit = 20;
      params.page = pageNum;

      const response = await fetchAllLeads(params);
      const newLeads = Array.isArray(response.data) ? response.data : [];
      if (response.total !== undefined) setTotalResults(response.total);
      if (refresh || pageNum === 1) setLeads(newLeads);
      else setLeads((prev) => [...prev, ...newLeads]);
      setHasMore(newLeads.length === 20);
      setPage(pageNum);
    } catch {
      setError("Failed to load leads. Please try again.");
      if (pageNum === 1) setLeads([]);
    } finally {
      if (pageNum === 1) setLoading(false);
      else setLoadingMore(false);
    }
  };

  useEffect(() => { loadLeads(1, true); }, [filters]);
  useEffect(() => {
    const t = setTimeout(() => loadLeads(1, true), 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeads(1, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore && !loading && leads.length > 0)
      loadLeads(page + 1);
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setShowFilterModal(false);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
    ]).start();
  };

  const clearFilters = () => {
    const reset = { source: "", status: "", unit_type: "", sort_by: "dateadded", sort_order: "DESC" as const };
    setFilters(reset);
    setTempFilters(reset);
    setSearchQuery("");
    setShowFilterModal(false);
  };

  const handleCall = (phone: string) =>
    Linking.openURL(`tel:${phone.replace(/\D/g, "")}`).catch(() => alert("Could not call"));

  const handleWhatsApp = (phone: string) =>
    Linking.openURL(`https://wa.me/${phone.replace(/\D/g, "")}`).catch(() => alert("Could not open WhatsApp"));

  const getStatusColor = (name: string) =>
    STATUS_OPTIONS.find((s) => s.label === name)?.color ?? "#64748b";

  const hasActiveFilters = () =>
    Object.entries(filters).some(([k, v]) => v !== "" && k !== "sort_by" && k !== "sort_order");

  const getActiveFilterCount = () =>
    Object.entries(filters).filter(([k, v]) => v !== "" && k !== "sort_by" && k !== "sort_order").length;

  /* ── Card ── */
  const renderLeadCard = ({ item }: { item: Lead }) => {
    const color = avatarColor(item.name ?? "");
    const statusColor = getStatusColor(item.status_name);
    const hasPhone = !!item.phonenumber;

    return (
      <TouchableOpacity
        style={styles.leadCard}
        onPress={() => router.push({ pathname: "/lead-detail", params: { lead: JSON.stringify(item) } })}
        activeOpacity={0.72}
      >
        {/* Top row: avatar · name/phone · status */}
        <View style={styles.cardTop}>
          <View style={[styles.avatar, { backgroundColor: color + "22" }]}>
            <Text style={[styles.avatarLetter, { color }]}>
              {item.name?.charAt(0)?.toUpperCase() ?? "?"}
            </Text>
          </View>

          <View style={styles.cardMeta}>
            <Text style={styles.leadName} numberOfLines={1}>{item.name}</Text>
            {hasPhone && (
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={12} color="#94a3b8" />
                <Text style={styles.phoneText}>{item.phonenumber}</Text>
              </View>
            )}
          </View>

          <View style={[styles.statusPill, { backgroundColor: statusColor + "18" }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusLabel, { color: statusColor }]} numberOfLines={1}>
              {item.status_name || "New"}
            </Text>
          </View>
        </View>

        {/* Bottom row: source · action icons */}
        <View style={styles.cardBottom}>
          <View style={styles.sourceBadge}>
            <Ionicons name="flash-outline" size={12} color="#6366f1" />
            <Text style={styles.sourceText}>{item.source_name || "Lead"}</Text>
          </View>

          {hasPhone && (
            <View style={styles.actionIcons}>
              <TouchableOpacity
                style={styles.iconBtnCall}
                onPress={() => handleCall(item.phonenumber)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="call" size={17} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtnWa}
                onPress={() => handleWhatsApp(item.phonenumber)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="logo-whatsapp" size={17} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
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

      {/* Sticky search bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1e293b" />
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search leads…"
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
              <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          {leads.length > 0 ? `${leads.length} of ${totalResults || leads.length} leads` : "No leads found"}
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
            <Text style={styles.modalTitle}>Filter Leads</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#1e293b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <FilterSection label="Source">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {SOURCE_OPTIONS.map((o) => (
                    <TouchableOpacity
                      key={o.id}
                      style={[styles.chip, tempFilters.source === o.id && styles.chipActive]}
                      onPress={() => setTempFilters({ ...tempFilters, source: o.id })}
                    >
                      <Ionicons name={o.icon as any} size={14} color={tempFilters.source === o.id ? "#fff" : "#64748b"} />
                      <Text style={[styles.chipText, tempFilters.source === o.id && styles.chipTextActive]}>{o.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </FilterSection>

            <FilterSection label="Status">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {STATUS_OPTIONS.map((o) => (
                    <TouchableOpacity
                      key={o.id}
                      style={[styles.chip, tempFilters.status === o.id && styles.chipActive]}
                      onPress={() => setTempFilters({ ...tempFilters, status: o.id })}
                    >
                      <View style={[styles.dotSmall, { backgroundColor: o.color }]} />
                      <Text style={[styles.chipText, tempFilters.status === o.id && styles.chipTextActive]}>{o.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </FilterSection>

            <FilterSection label="Unit Type">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {UNIT_TYPE_OPTIONS.map((o) => (
                    <TouchableOpacity
                      key={o.id}
                      style={[styles.chip, tempFilters.unit_type === o.id && styles.chipActive]}
                      onPress={() => setTempFilters({ ...tempFilters, unit_type: o.id })}
                    >
                      <Text style={[styles.chipText, tempFilters.unit_type === o.id && styles.chipTextActive]}>{o.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </FilterSection>

            <FilterSection label="Sort">
              <View style={styles.sortRow}>
                {(["DESC", "ASC"] as const).map((order) => (
                  <TouchableOpacity
                    key={order}
                    style={[styles.sortBtn, tempFilters.sort_order === order && styles.sortBtnActive]}
                    onPress={() => setTempFilters({ ...tempFilters, sort_order: order })}
                  >
                    <Ionicons name={order === "DESC" ? "arrow-down" : "arrow-up"} size={16}
                      color={tempFilters.sort_order === order ? "#fff" : "#64748b"} />
                    <Text style={[styles.sortBtnText, tempFilters.sort_order === order && styles.sortBtnTextActive]}>
                      {order === "DESC" ? "Newest First" : "Oldest First"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </FilterSection>
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

  if (loading && leads.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading leads…</Text>
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
        data={leads}
        keyExtractor={(item) => item.id}
        renderItem={renderLeadCard}
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
              <Ionicons name="people-outline" size={60} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Leads Found</Text>
              <Text style={styles.emptySubtitle}>
                {hasActiveFilters() ? "Try adjusting your filters" : "Pull down to refresh"}
              </Text>
            </View>
          ) : null
        }
      />

      {filterModal}
    </View>
  );
}

/* ── helper component ── */
function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterSectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

/* ── styles ── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f1f5f9" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#64748b" },

  /* top bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: "#fff",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: "#f8fafc", justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "#f8fafc", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
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

  /* stats */
  statsRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
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

  /* list */
  listContent: { paddingBottom: 28, paddingTop: 4 },

  /* card */
  leadCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  /* card top */
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  avatarLetter: { fontSize: 20, fontWeight: "700" },
  cardMeta: { flex: 1, marginRight: 8 },
  leadName: { fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 3 },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  phoneText: { fontSize: 13, color: "#64748b" },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, maxWidth: 130,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 11, fontWeight: "600" },

  /* card bottom */
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sourceBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#eef2ff", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  sourceText: { fontSize: 12, color: "#6366f1", fontWeight: "600" },
  actionIcons: { flexDirection: "row", gap: 8 },
  iconBtnCall: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "#2563eb", justifyContent: "center", alignItems: "center",
    shadowColor: "#2563eb", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 5, elevation: 3,
  },
  iconBtnWa: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "#25D366", justifyContent: "center", alignItems: "center",
    shadowColor: "#25D366", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 5, elevation: 3,
  },

  /* empty / error */
  emptyBox: { alignItems: "center", paddingTop: 60, paddingBottom: 40 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: "#1e293b", marginTop: 14 },
  emptySubtitle: { fontSize: 14, color: "#94a3b8", marginTop: 6 },
  errorBox: { alignItems: "center", padding: 32 },
  errorText: { fontSize: 15, color: "#64748b", textAlign: "center", marginTop: 10, marginBottom: 18 },
  retryBtn: { backgroundColor: "#6366f1", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { fontSize: 14, fontWeight: "600", color: "#fff" },

  /* footer loader */
  footerLoader: { paddingVertical: 20, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  loadingMoreText: { fontSize: 13, color: "#64748b" },

  /* filter modal */
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, maxHeight: "88%",
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
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 22, backgroundColor: "#f8fafc",
    borderWidth: 1, borderColor: "#e2e8f0",
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
  clearBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center",
  },
  clearBtnText: { fontSize: 15, fontWeight: "600", color: "#64748b" },
  applyBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: "#6366f1", alignItems: "center" },
  applyBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
});
