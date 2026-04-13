// app/leads-list.tsx - Final Version with Integrated Header
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

// Source options
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

// Status options with colors
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

// Unit type options
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

    if (pageNum === 1) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const filterParams: any = {};
      if (searchQuery) filterParams.search = searchQuery;
      if (currentFilters.source) filterParams.source = currentFilters.source;
      if (currentFilters.status) filterParams.status = currentFilters.status;
      if (currentFilters.unit_type)
        filterParams.unit_type = currentFilters.unit_type;
      filterParams.sort_by = currentFilters.sort_by;
      filterParams.sort_order = currentFilters.sort_order;
      filterParams.limit = 20;
      filterParams.page = pageNum;

      const response = await fetchAllLeads(filterParams);
      const newLeads = Array.isArray(response.data) ? response.data : [];

      if (response.total !== undefined) {
        setTotalResults(response.total);
      }

      if (refresh || pageNum === 1) {
        setLeads(newLeads);
      } else {
        setLeads((prev) => [...prev, ...newLeads]);
      }

      setHasMore(newLeads.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error("Error loading leads:", error);
      setError("Failed to load leads. Please try again.");
      if (pageNum === 1) setLeads([]);
    } finally {
      if (pageNum === 1) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    loadLeads(1, true);
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => loadLeads(1, true), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeads(1, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore && !loading && leads.length > 0) {
      loadLeads(page + 1);
    }
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setShowFilterModal(false);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const clearFilters = () => {
    const resetFilters = {
      source: "",
      status: "",
      unit_type: "",
      sort_by: "dateadded",
      sort_order: "DESC" as const,
    };
    setFilters(resetFilters);
    setTempFilters(resetFilters);
    setSearchQuery("");
    setShowFilterModal(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber.replace(/\D/g, "")}`).catch(() =>
      alert("Could not make call"),
    );
  };

  const handleWhatsApp = (phoneNumber: string) => {
    Linking.openURL(`https://wa.me/${phoneNumber.replace(/\D/g, "")}`).catch(
      () => alert("Could not open WhatsApp"),
    );
  };

  const getStatusColor = (statusName: string) => {
    const status = STATUS_OPTIONS.find((s) => s.label === statusName);
    return status?.color || "#64748b";
  };

  const renderLeadCard = ({ item }: { item: Lead }) => (
    <TouchableOpacity
      style={styles.leadCard}
      onPress={() =>
        router.push({
          pathname: "/lead-detail",
          params: { lead: JSON.stringify(item) },
        })
      }
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{item.name?.charAt(0) || "?"}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.leadName}>{item.name}</Text>
          <Text style={styles.leadCompany}>
            {item.company || "Independent"}
          </Text>
        </View>
        <View
          style={[
            styles.statusChip,
            { backgroundColor: getStatusColor(item.status_name) + "20" },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(item.status_name) },
            ]}
          />
          <Text
            style={[
              styles.statusChipText,
              { color: getStatusColor(item.status_name) },
            ]}
          >
            {item.status_name || "New"}
          </Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="mail-outline" size={14} color="#64748b" />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color="#64748b" />
            <Text style={styles.detailText}>{formatDate(item.dateadded)}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          {item.phonenumber && (
            <View style={styles.detailItem}>
              <Ionicons name="call-outline" size={14} color="#64748b" />
              <Text style={styles.detailText}>{item.phonenumber}</Text>
            </View>
          )}
          {item.lead_value && parseFloat(item.lead_value) > 0 && (
            <View style={styles.detailItem}>
              <Ionicons name="cash-outline" size={14} color="#64748b" />
              <Text style={styles.detailText}>
                AED {parseFloat(item.lead_value).toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardFooter}>
        {item.phonenumber && (
          <>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleCall(item.phonenumber)}
            >
              <Ionicons name="call" size={18} color="#fff" />
              <Text style={styles.buttonText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={() => handleWhatsApp(item.phonenumber)}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              <Text style={styles.whatsappButtonText}>WhatsApp</Text>
            </TouchableOpacity>
          </>
        )}
        <View style={styles.sourceBadge}>
          <Ionicons name="location-outline" size={12} color="#6366f1" />
          <Text style={styles.sourceText}>{item.source_name || "Lead"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const FilterModalComponent = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Leads</Text>
            <TouchableOpacity
              onPress={() => setShowFilterModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
            {/* Source Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Source</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipContainer}>
                  {SOURCE_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.chip,
                        tempFilters.source === option.id && styles.chipActive,
                      ]}
                      onPress={() =>
                        setTempFilters({ ...tempFilters, source: option.id })
                      }
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={16}
                        color={
                          tempFilters.source === option.id ? "#fff" : "#64748b"
                        }
                      />
                      <Text
                        style={[
                          styles.chipText,
                          tempFilters.source === option.id &&
                            styles.chipTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipContainer}>
                  {STATUS_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.chip,
                        tempFilters.status === option.id && styles.chipActive,
                      ]}
                      onPress={() =>
                        setTempFilters({ ...tempFilters, status: option.id })
                      }
                    >
                      <View
                        style={[
                          styles.statusDotSmall,
                          { backgroundColor: option.color },
                        ]}
                      />
                      <Text
                        style={[
                          styles.chipText,
                          tempFilters.status === option.id &&
                            styles.chipTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Unit Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Unit Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipContainer}>
                  {UNIT_TYPE_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.chip,
                        tempFilters.unit_type === option.id &&
                          styles.chipActive,
                      ]}
                      onPress={() =>
                        setTempFilters({ ...tempFilters, unit_type: option.id })
                      }
                    >
                      <Text
                        style={[
                          styles.chipText,
                          tempFilters.unit_type === option.id &&
                            styles.chipTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Sort By</Text>
              <View style={styles.sortContainer}>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    tempFilters.sort_order === "DESC" &&
                      styles.sortButtonActive,
                  ]}
                  onPress={() =>
                    setTempFilters({ ...tempFilters, sort_order: "DESC" })
                  }
                >
                  <Ionicons
                    name="arrow-down"
                    size={18}
                    color={
                      tempFilters.sort_order === "DESC" ? "#fff" : "#64748b"
                    }
                  />
                  <Text
                    style={[
                      styles.sortButtonText,
                      tempFilters.sort_order === "DESC" &&
                        styles.sortButtonTextActive,
                    ]}
                  >
                    Newest First
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    tempFilters.sort_order === "ASC" && styles.sortButtonActive,
                  ]}
                  onPress={() =>
                    setTempFilters({ ...tempFilters, sort_order: "ASC" })
                  }
                >
                  <Ionicons
                    name="arrow-up"
                    size={18}
                    color={
                      tempFilters.sort_order === "ASC" ? "#fff" : "#64748b"
                    }
                  />
                  <Text
                    style={[
                      styles.sortButtonText,
                      tempFilters.sort_order === "ASC" &&
                        styles.sortButtonTextActive,
                    ]}
                  >
                    Oldest First
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const hasActiveFilters = () => {
    return Object.entries(filters).some(
      ([key, value]) =>
        value !== "" && key !== "sort_by" && key !== "sort_order",
    );
  };

  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(
      ([key, value]) =>
        value !== "" && key !== "sort_by" && key !== "sort_order",
    ).length;
  };

  // Header component that scrolls with the list
  const ListHeader = () => (
    <>
      {/* Animated Success Message */}
      <Animated.View style={[styles.successMessage, { opacity: fadeAnim }]}>
        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
        <Text style={styles.successText}>Filters applied successfully!</Text>
      </Animated.View>

      {/* Search and Filter Row with Back Button */}
      <View style={styles.searchWrapper}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search leads..."
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

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="options-outline" size={22} color="#6366f1" />
          {hasActiveFilters() && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {getActiveFilterCount()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats and Clear Filters Row */}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          {leads.length > 0
            ? `${leads.length} of ${totalResults || leads.length} leads`
            : "No leads found"}
        </Text>
        {hasActiveFilters() && (
          <TouchableOpacity
            style={styles.clearFiltersChip}
            onPress={clearFilters}
          >
            <Ionicons name="close-circle" size={14} color="#6366f1" />
            <Text style={styles.clearFiltersChipText}>Clear all filters</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  if (loading && page === 1) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading leads...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Leads List with integrated header */}
      <FlatList
        data={leads}
        keyExtractor={(item) => item.id}
        renderItem={renderLeadCard}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loaderMore}>
              <ActivityIndicator size="small" color="#6366f1" />
              <Text style={styles.loadingMoreText}>Loading more...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading && !error && leads.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Leads Found</Text>
              <Text style={styles.emptyText}>
                {hasActiveFilters()
                  ? "Try adjusting your filters"
                  : "Pull down to refresh"}
              </Text>
            </View>
          ) : null
        }
      />

      <FilterModalComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
  },
  successMessage: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  successText: {
    fontSize: 14,
    color: "#065f46",
    fontWeight: "500",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1e293b",
  },
  filterButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#6366f1",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  statsText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  clearFiltersChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  clearFiltersChipText: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "500",
  },
  listContainer: {
    paddingBottom: 20,
  },
  leadCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#e0e7ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#6366f1",
  },
  cardInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  leadCompany: {
    fontSize: 13,
    color: "#64748b",
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardDetails: {
    gap: 8,
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  detailText: {
    fontSize: 13,
    color: "#475569",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  callButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#10b981",
  },
  whatsappButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#25D366",
    backgroundColor: "#fff",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  whatsappButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#25D366",
  },
  sourceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  sourceText: {
    fontSize: 11,
    color: "#6366f1",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 8,
  },
  loaderMore: {
    paddingVertical: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: "#64748b",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
  },
  closeButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 20,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  chipActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  chipText: {
    fontSize: 14,
    color: "#475569",
  },
  chipTextActive: {
    color: "#fff",
  },
  statusDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sortContainer: {
    flexDirection: "row",
    gap: 12,
  },
  sortButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  sortButtonActive: {
    backgroundColor: "#6366f1",
  },
  sortButtonText: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "500",
  },
  sortButtonTextActive: {
    color: "#fff",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#64748b",
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#6366f1",
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

// import { Ionicons } from "@expo/vector-icons";
// import * as Linking from "expo-linking";
// import { useRouter } from "expo-router";
// import { useEffect, useRef, useState } from "react";
// import {
//   ActivityIndicator,
//   Animated,
//   FlatList,
//   Modal,
//   RefreshControl,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { Lead } from "./types";
// import { fetchAllLeads } from "./utils/api";

// // Source options
// const SOURCE_OPTIONS = [
//   { id: "", label: "All Sources", icon: "globe-outline" },
//   { id: "1", label: "Google", icon: "logo-google" },
//   { id: "3", label: "Property Finder", icon: "business-outline" },
//   { id: "10", label: "Bayut", icon: "home-outline" },
//   { id: "5", label: "Dubizzle", icon: "cart-outline" },
//   { id: "7", label: "Facebook", icon: "logo-facebook" },
//   { id: "8", label: "Instagram", icon: "logo-instagram" },
//   { id: "9", label: "Website", icon: "globe-outline" },
//   { id: "11", label: "Referral", icon: "people-outline" },
// ];

// // Status options with colors
// const STATUS_OPTIONS = [
//   { id: "", label: "All Statuses", color: "#64748b" },
//   { id: "1", label: "New Lead", color: "#6366f1" },
//   { id: "2", label: "Contacted", color: "#f59e0b" },
//   { id: "3", label: "Qualified", color: "#10b981" },
//   { id: "4", label: "Focused Follow Up", color: "#8b5cf6" },
//   { id: "5", label: "Meeting Scheduled", color: "#06b6d4" },
//   { id: "6", label: "Proposal Sent", color: "#ec4899" },
//   { id: "7", label: "Negotiation", color: "#ef4444" },
//   { id: "8", label: "Closed Won", color: "#22c55e" },
//   { id: "9", label: "Closed Lost", color: "#6b7280" },
// ];

// // Unit type options
// const UNIT_TYPE_OPTIONS = [
//   { id: "", label: "All Types" },
//   { id: "Studio", label: "Studio" },
//   { id: "1BR", label: "1 Bedroom" },
//   { id: "2BR", label: "2 Bedrooms" },
//   { id: "3BR", label: "3 Bedrooms" },
//   { id: "4BR", label: "4 Bedrooms" },
//   { id: "5+BR", label: "5+ Bedrooms" },
//   { id: "Villa", label: "Villa" },
//   { id: "Townhouse", label: "Townhouse" },
//   { id: "Penthouse", label: "Penthouse" },
// ];

// export default function LeadsListScreen() {
//   const [leads, setLeads] = useState<Lead[]>([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [refreshing, setRefreshing] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [loadingMore, setLoadingMore] = useState(false);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);
//   const [totalResults, setTotalResults] = useState(0);
//   const [showFilterModal, setShowFilterModal] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const [filters, setFilters] = useState({
//     source: "",
//     status: "",
//     unit_type: "",
//     sort_by: "dateadded",
//     sort_order: "DESC" as "ASC" | "DESC",
//   });

//   const [tempFilters, setTempFilters] = useState(filters);
//   const fadeAnim = useRef(new Animated.Value(0)).current;

//   const router = useRouter();

//   const loadLeads = async (
//     pageNum: number = 1,
//     refresh: boolean = false,
//     newFilters?: typeof filters,
//   ) => {
//     const currentFilters = newFilters || filters;

//     if (pageNum === 1) {
//       setLoading(true);
//       setError(null);
//     } else {
//       setLoadingMore(true);
//     }

//     try {
//       const filterParams: any = {};
//       if (searchQuery) filterParams.search = searchQuery;
//       if (currentFilters.source) filterParams.source = currentFilters.source;
//       if (currentFilters.status) filterParams.status = currentFilters.status;
//       if (currentFilters.unit_type)
//         filterParams.unit_type = currentFilters.unit_type;
//       filterParams.sort_by = currentFilters.sort_by;
//       filterParams.sort_order = currentFilters.sort_order;
//       filterParams.limit = 20;
//       filterParams.page = pageNum;

//       const response = await fetchAllLeads(filterParams);
//       const newLeads = Array.isArray(response.data) ? response.data : [];

//       if (response.total !== undefined) {
//         setTotalResults(response.total);
//       }

//       if (refresh || pageNum === 1) {
//         setLeads(newLeads);
//       } else {
//         setLeads((prev) => [...prev, ...newLeads]);
//       }

//       setHasMore(newLeads.length === 20);
//       setPage(pageNum);
//     } catch (error) {
//       console.error("Error loading leads:", error);
//       setError("Failed to load leads. Please try again.");
//       if (pageNum === 1) setLeads([]);
//     } finally {
//       if (pageNum === 1) {
//         setLoading(false);
//       } else {
//         setLoadingMore(false);
//       }
//     }
//   };

//   const debounce = (func: Function, delay: number) => {
//     let timeoutId: NodeJS.Timeout;
//     return (...args: any[]) => {
//       if (timeoutId) {
//         clearTimeout(timeoutId);
//       }
//       timeoutId = setTimeout(() => {
//         func(...args);
//       }, delay);
//     };
//   };

//   const debouncedLoadLeads = debounce(
//     (pageNum: number) => loadLeads(pageNum, true),
//     500,
//   );

//   useEffect(() => {
//     loadLeads(1, true);
//   }, [filters]);

//   useEffect(() => {
//     debouncedLoadLeads(1);
//   }, [searchQuery]);

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await loadLeads(1, true);
//     setRefreshing(false);
//   };

//   const loadMore = () => {
//     if (hasMore && !loadingMore && !loading && leads.length > 0) {
//       loadLeads(page + 1);
//     }
//   };

//   const applyFilters = () => {
//     setFilters(tempFilters);
//     setShowFilterModal(false);
//     Animated.sequence([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 300,
//         useNativeDriver: true,
//       }),
//       Animated.timing(fadeAnim, {
//         toValue: 0,
//         duration: 2000,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   };

//   const clearFilters = () => {
//     const resetFilters = {
//       source: "",
//       status: "",
//       unit_type: "",
//       sort_by: "dateadded",
//       sort_order: "DESC" as const,
//     };
//     setFilters(resetFilters);
//     setTempFilters(resetFilters);
//     setSearchQuery("");
//     setShowFilterModal(false);
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     const now = new Date();
//     const diffTime = Math.abs(now.getTime() - date.getTime());
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

//     if (diffDays === 0) return "Today";
//     if (diffDays === 1) return "Yesterday";
//     if (diffDays < 7) return `${diffDays}d ago`;
//     return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
//   };

//   const handleCall = (phoneNumber: string) => {
//     Linking.openURL(`tel:${phoneNumber.replace(/\D/g, "")}`).catch(() =>
//       alert("Could not make call"),
//     );
//   };

//   const handleWhatsApp = (phoneNumber: string) => {
//     Linking.openURL(`https://wa.me/${phoneNumber.replace(/\D/g, "")}`).catch(
//       () => alert("Could not open WhatsApp"),
//     );
//   };

//   const getStatusColor = (statusName: string) => {
//     const status = STATUS_OPTIONS.find((s) => s.label === statusName);
//     return status?.color || "#64748b";
//   };

//   const renderLeadCard = ({ item }: { item: Lead }) => (
//     <TouchableOpacity
//       style={styles.leadCard}
//       onPress={() =>
//         router.push({
//           pathname: "/lead-detail",
//           params: { lead: JSON.stringify(item) },
//         })
//       }
//       activeOpacity={0.7}
//     >
//       <View style={styles.cardHeader}>
//         <View style={styles.avatarContainer}>
//           <Text style={styles.avatarText}>{item.name?.charAt(0) || "?"}</Text>
//         </View>
//         <View style={styles.cardInfo}>
//           <Text style={styles.leadName}>{item.name}</Text>
//           <Text style={styles.leadCompany}>
//             {item.company || "Independent"}
//           </Text>
//         </View>
//         <View
//           style={[
//             styles.statusChip,
//             { backgroundColor: getStatusColor(item.status_name) + "20" },
//           ]}
//         >
//           <View
//             style={[
//               styles.statusDot,
//               { backgroundColor: getStatusColor(item.status_name) },
//             ]}
//           />
//           <Text
//             style={[
//               styles.statusChipText,
//               { color: getStatusColor(item.status_name) },
//             ]}
//           >
//             {item.status_name || "New"}
//           </Text>
//         </View>
//       </View>

//       <View style={styles.cardDetails}>
//         <View style={styles.detailRow}>
//           <View style={styles.detailItem}>
//             <Ionicons name="mail-outline" size={14} color="#64748b" />
//             <Text style={styles.detailText} numberOfLines={1}>
//               {item.email}
//             </Text>
//           </View>
//           <View style={styles.detailItem}>
//             <Ionicons name="calendar-outline" size={14} color="#64748b" />
//             <Text style={styles.detailText}>{formatDate(item.dateadded)}</Text>
//           </View>
//         </View>

//         <View style={styles.detailRow}>
//           {item.phonenumber && (
//             <View style={styles.detailItem}>
//               <Ionicons name="call-outline" size={14} color="#64748b" />
//               <Text style={styles.detailText}>{item.phonenumber}</Text>
//             </View>
//           )}
//           {item.lead_value && parseFloat(item.lead_value) > 0 && (
//             <View style={styles.detailItem}>
//               <Ionicons name="cash-outline" size={14} color="#64748b" />
//               <Text style={styles.detailText}>
//                 AED {parseFloat(item.lead_value).toLocaleString()}
//               </Text>
//             </View>
//           )}
//         </View>
//       </View>

//       <View style={styles.cardFooter}>
//         {item.phonenumber && (
//           <>
//             <TouchableOpacity
//               style={styles.callButton}
//               onPress={() => handleCall(item.phonenumber)}
//             >
//               <Ionicons name="call" size={18} color="#fff" />
//               <Text style={styles.buttonText}>Call</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={styles.whatsappButton}
//               onPress={() => handleWhatsApp(item.phonenumber)}
//             >
//               <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
//               <Text style={styles.whatsappButtonText}>WhatsApp</Text>
//             </TouchableOpacity>
//           </>
//         )}
//         <View style={styles.sourceBadge}>
//           <Ionicons name="location-outline" size={12} color="#6366f1" />
//           <Text style={styles.sourceText}>{item.source_name || "Lead"}</Text>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );

//   const FilterModalComponent = () => (
//     <Modal
//       visible={showFilterModal}
//       animationType="slide"
//       transparent={true}
//       onRequestClose={() => setShowFilterModal(false)}
//     >
//       <View style={styles.modalOverlay}>
//         <View style={styles.modalContent}>
//           <View style={styles.modalHeader}>
//             <Text style={styles.modalTitle}>Filter Leads</Text>
//             <TouchableOpacity
//               onPress={() => setShowFilterModal(false)}
//               style={styles.closeButton}
//             >
//               <Ionicons name="close" size={24} color="#1e293b" />
//             </TouchableOpacity>
//           </View>

//           <ScrollView
//             showsVerticalScrollIndicator={false}
//             contentContainerStyle={styles.modalScrollContent}
//           >
//             {/* Source Filter */}
//             <View style={styles.filterSection}>
//               <Text style={styles.sectionTitle}>Source</Text>
//               <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//                 <View style={styles.chipContainer}>
//                   {SOURCE_OPTIONS.map((option) => (
//                     <TouchableOpacity
//                       key={option.id}
//                       style={[
//                         styles.chip,
//                         tempFilters.source === option.id && styles.chipActive,
//                       ]}
//                       onPress={() =>
//                         setTempFilters({ ...tempFilters, source: option.id })
//                       }
//                     >
//                       <Ionicons
//                         name={option.icon as any}
//                         size={16}
//                         color={
//                           tempFilters.source === option.id ? "#fff" : "#64748b"
//                         }
//                       />
//                       <Text
//                         style={[
//                           styles.chipText,
//                           tempFilters.source === option.id &&
//                             styles.chipTextActive,
//                         ]}
//                       >
//                         {option.label}
//                       </Text>
//                     </TouchableOpacity>
//                   ))}
//                 </View>
//               </ScrollView>
//             </View>

//             {/* Status Filter */}
//             <View style={styles.filterSection}>
//               <Text style={styles.sectionTitle}>Status</Text>
//               <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//                 <View style={styles.chipContainer}>
//                   {STATUS_OPTIONS.map((option) => (
//                     <TouchableOpacity
//                       key={option.id}
//                       style={[
//                         styles.chip,
//                         tempFilters.status === option.id && styles.chipActive,
//                       ]}
//                       onPress={() =>
//                         setTempFilters({ ...tempFilters, status: option.id })
//                       }
//                     >
//                       <View
//                         style={[
//                           styles.statusDotSmall,
//                           { backgroundColor: option.color },
//                         ]}
//                       />
//                       <Text
//                         style={[
//                           styles.chipText,
//                           tempFilters.status === option.id &&
//                             styles.chipTextActive,
//                         ]}
//                       >
//                         {option.label}
//                       </Text>
//                     </TouchableOpacity>
//                   ))}
//                 </View>
//               </ScrollView>
//             </View>

//             {/* Unit Type Filter */}
//             <View style={styles.filterSection}>
//               <Text style={styles.sectionTitle}>Unit Type</Text>
//               <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//                 <View style={styles.chipContainer}>
//                   {UNIT_TYPE_OPTIONS.map((option) => (
//                     <TouchableOpacity
//                       key={option.id}
//                       style={[
//                         styles.chip,
//                         tempFilters.unit_type === option.id &&
//                           styles.chipActive,
//                       ]}
//                       onPress={() =>
//                         setTempFilters({ ...tempFilters, unit_type: option.id })
//                       }
//                     >
//                       <Text
//                         style={[
//                           styles.chipText,
//                           tempFilters.unit_type === option.id &&
//                             styles.chipTextActive,
//                         ]}
//                       >
//                         {option.label}
//                       </Text>
//                     </TouchableOpacity>
//                   ))}
//                 </View>
//               </ScrollView>
//             </View>

//             {/* Sort Options */}
//             <View style={styles.filterSection}>
//               <Text style={styles.sectionTitle}>Sort By</Text>
//               <View style={styles.sortContainer}>
//                 <TouchableOpacity
//                   style={[
//                     styles.sortButton,
//                     tempFilters.sort_order === "DESC" &&
//                       styles.sortButtonActive,
//                   ]}
//                   onPress={() =>
//                     setTempFilters({ ...tempFilters, sort_order: "DESC" })
//                   }
//                 >
//                   <Ionicons
//                     name="arrow-down"
//                     size={18}
//                     color={
//                       tempFilters.sort_order === "DESC" ? "#fff" : "#64748b"
//                     }
//                   />
//                   <Text
//                     style={[
//                       styles.sortButtonText,
//                       tempFilters.sort_order === "DESC" &&
//                         styles.sortButtonTextActive,
//                     ]}
//                   >
//                     Newest First
//                   </Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                   style={[
//                     styles.sortButton,
//                     tempFilters.sort_order === "ASC" && styles.sortButtonActive,
//                   ]}
//                   onPress={() =>
//                     setTempFilters({ ...tempFilters, sort_order: "ASC" })
//                   }
//                 >
//                   <Ionicons
//                     name="arrow-up"
//                     size={18}
//                     color={
//                       tempFilters.sort_order === "ASC" ? "#fff" : "#64748b"
//                     }
//                   />
//                   <Text
//                     style={[
//                       styles.sortButtonText,
//                       tempFilters.sort_order === "ASC" &&
//                         styles.sortButtonTextActive,
//                     ]}
//                   >
//                     Oldest First
//                   </Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </ScrollView>

//           <View style={styles.modalFooter}>
//             <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
//               <Text style={styles.clearButtonText}>Clear All</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
//               <Text style={styles.applyButtonText}>Apply Filters</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );

//   const hasActiveFilters = () => {
//     return Object.entries(filters).some(
//       ([key, value]) =>
//         value !== "" && key !== "sort_by" && key !== "sort_order",
//     );
//   };

//   const getActiveFilterCount = () => {
//     return Object.entries(filters).filter(
//       ([key, value]) =>
//         value !== "" && key !== "sort_by" && key !== "sort_order",
//     ).length;
//   };

//   // Header component that scrolls with the list
//   const ListHeader = () => (
//     <>
//       {/* Animated Success Message */}
//       <Animated.View style={[styles.successMessage, { opacity: fadeAnim }]}>
//         <Ionicons name="checkmark-circle" size={20} color="#10b981" />
//         <Text style={styles.successText}>Filters applied successfully!</Text>
//       </Animated.View>

//       {/* Search and Filter Row with Back Button */}
//       <View style={styles.searchWrapper}>
//         <TouchableOpacity
//           onPress={() => router.back()}
//           style={styles.backButton}
//         >
//           <Ionicons name="arrow-back" size={24} color="#1e293b" />
//         </TouchableOpacity>

//         <View style={styles.searchContainer}>
//           <Ionicons name="search" size={20} color="#94a3b8" />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search leads..."
//             placeholderTextColor="#94a3b8"
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//           />
//           {searchQuery !== "" && (
//             <TouchableOpacity onPress={() => setSearchQuery("")}>
//               <Ionicons name="close-circle" size={20} color="#94a3b8" />
//             </TouchableOpacity>
//           )}
//         </View>

//         <TouchableOpacity
//           style={styles.filterButton}
//           onPress={() => setShowFilterModal(true)}
//         >
//           <Ionicons name="options-outline" size={22} color="#6366f1" />
//           {hasActiveFilters() && (
//             <View style={styles.filterBadge}>
//               <Text style={styles.filterBadgeText}>
//                 {getActiveFilterCount()}
//               </Text>
//             </View>
//           )}
//         </TouchableOpacity>
//       </View>

//       {/* Stats and Clear Filters Row */}
//       <View style={styles.statsRow}>
//         <Text style={styles.statsText}>
//           {leads.length > 0
//             ? `${leads.length} of ${totalResults || leads.length} leads`
//             : "No leads found"}
//         </Text>
//         {hasActiveFilters() && (
//           <TouchableOpacity
//             style={styles.clearFiltersChip}
//             onPress={clearFilters}
//           >
//             <Ionicons name="close-circle" size={14} color="#6366f1" />
//             <Text style={styles.clearFiltersChipText}>Clear all filters</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//     </>
//   );

//   if (loading && page === 1) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#6366f1" />
//         <Text style={styles.loadingText}>Loading leads...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Error State */}
//       {error && (
//         <View style={styles.errorContainer}>
//           <Ionicons name="alert-circle" size={48} color="#ef4444" />
//           <Text style={styles.errorText}>{error}</Text>
//           <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
//             <Text style={styles.retryButtonText}>Try Again</Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       {/* Leads List with integrated header */}
//       <FlatList
//         data={leads}
//         keyExtractor={(item) => item.id}
//         renderItem={renderLeadCard}
//         ListHeaderComponent={<ListHeader />}
//         contentContainerStyle={styles.listContainer}
//         showsVerticalScrollIndicator={false}
//         onEndReached={loadMore}
//         onEndReachedThreshold={0.3}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             tintColor="#6366f1"
//           />
//         }
//         ListFooterComponent={
//           loadingMore ? (
//             <View style={styles.loaderMore}>
//               <ActivityIndicator size="small" color="#6366f1" />
//               <Text style={styles.loadingMoreText}>Loading more...</Text>
//             </View>
//           ) : null
//         }
//         ListEmptyComponent={
//           !loading && !error && leads.length === 0 ? (
//             <View style={styles.emptyContainer}>
//               <Ionicons name="people-outline" size={64} color="#cbd5e1" />
//               <Text style={styles.emptyTitle}>No Leads Found</Text>
//               <Text style={styles.emptyText}>
//                 {hasActiveFilters()
//                   ? "Try adjusting your filters"
//                   : "Pull down to refresh"}
//               </Text>
//             </View>
//           ) : null
//         }
//       />

//       <FilterModalComponent />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f8fafc",
//   },
//   center: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#f8fafc",
//   },
//   loadingText: {
//     marginTop: 12,
//     fontSize: 14,
//     color: "#64748b",
//   },
//   successMessage: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#d1fae5",
//     marginHorizontal: 20,
//     marginBottom: 12,
//     padding: 12,
//     borderRadius: 12,
//     gap: 8,
//   },
//   successText: {
//     fontSize: 14,
//     color: "#065f46",
//     fontWeight: "500",
//   },
//   searchWrapper: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     gap: 12,
//     marginBottom: 12,
//   },
//   backButton: {
//     width: 44,
//     height: 44,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#e2e8f0",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.03,
//     shadowRadius: 4,
//     elevation: 1,
//   },
//   searchContainer: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     paddingHorizontal: 16,
//     paddingVertical: 4,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#e2e8f0",
//     gap: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.03,
//     shadowRadius: 4,
//     elevation: 1,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 15,
//     color: "#1e293b",
//   },
//   filterButton: {
//     width: 44,
//     height: 44,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#e2e8f0",
//     position: "relative",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.03,
//     shadowRadius: 4,
//     elevation: 1,
//   },
//   filterBadge: {
//     position: "absolute",
//     top: -4,
//     right: -4,
//     backgroundColor: "#6366f1",
//     borderRadius: 10,
//     minWidth: 18,
//     height: 18,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 4,
//   },
//   filterBadgeText: {
//     color: "#fff",
//     fontSize: 10,
//     fontWeight: "600",
//   },
//   statsRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//   },
//   statsText: {
//     fontSize: 13,
//     color: "#64748b",
//     fontWeight: "500",
//   },
//   clearFiltersChip: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#e0e7ff",
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//     gap: 6,
//   },
//   clearFiltersChipText: {
//     fontSize: 12,
//     color: "#6366f1",
//     fontWeight: "500",
//   },
//   listContainer: {
//     paddingBottom: 20,
//   },
//   leadCard: {
//     backgroundColor: "#fff",
//     borderRadius: 20,
//     padding: 16,
//     marginHorizontal: 20,
//     marginBottom: 16,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.05,
//     shadowRadius: 12,
//     elevation: 3,
//   },
//   cardHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 14,
//   },
//   avatarContainer: {
//     width: 52,
//     height: 52,
//     borderRadius: 26,
//     backgroundColor: "#e0e7ff",
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 14,
//   },
//   avatarText: {
//     fontSize: 22,
//     fontWeight: "600",
//     color: "#6366f1",
//   },
//   cardInfo: {
//     flex: 1,
//   },
//   leadName: {
//     fontSize: 17,
//     fontWeight: "600",
//     color: "#1e293b",
//     marginBottom: 4,
//   },
//   leadCompany: {
//     fontSize: 13,
//     color: "#64748b",
//   },
//   statusChip: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     borderRadius: 12,
//     gap: 5,
//   },
//   statusDot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//   },
//   statusChipText: {
//     fontSize: 11,
//     fontWeight: "600",
//   },
//   cardDetails: {
//     gap: 8,
//     marginBottom: 16,
//     paddingTop: 12,
//     borderTopWidth: 1,
//     borderTopColor: "#f1f5f9",
//   },
//   detailRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     gap: 12,
//   },
//   detailItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//     flex: 1,
//   },
//   detailText: {
//     fontSize: 13,
//     color: "#475569",
//     flex: 1,
//   },
//   cardFooter: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 10,
//     paddingTop: 12,
//     borderTopWidth: 1,
//     borderTopColor: "#f1f5f9",
//   },
//   callButton: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 8,
//     paddingVertical: 10,
//     borderRadius: 12,
//     backgroundColor: "#10b981",
//   },
//   whatsappButton: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 8,
//     paddingVertical: 10,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#25D366",
//     backgroundColor: "#fff",
//   },
//   buttonText: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#fff",
//   },
//   whatsappButtonText: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#25D366",
//   },
//   sourceBadge: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//     backgroundColor: "#f1f5f9",
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 10,
//   },
//   sourceText: {
//     fontSize: 11,
//     color: "#6366f1",
//     fontWeight: "500",
//   },
//   errorContainer: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 40,
//   },
//   errorText: {
//     fontSize: 16,
//     color: "#64748b",
//     textAlign: "center",
//     marginTop: 12,
//     marginBottom: 20,
//   },
//   retryButton: {
//     backgroundColor: "#6366f1",
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 12,
//   },
//   retryButtonText: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#fff",
//   },
//   emptyContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 60,
//   },
//   emptyTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#1e293b",
//     marginTop: 16,
//   },
//   emptyText: {
//     fontSize: 14,
//     color: "#94a3b8",
//     marginTop: 8,
//   },
//   loaderMore: {
//     paddingVertical: 20,
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//     gap: 8,
//   },
//   loadingMoreText: {
//     fontSize: 14,
//     color: "#64748b",
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//     justifyContent: "flex-end",
//   },
//   modalContent: {
//     backgroundColor: "#fff",
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     padding: 20,
//     maxHeight: "85%",
//   },
//   modalHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 20,
//     paddingBottom: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: "#e2e8f0",
//   },
//   modalTitle: {
//     fontSize: 22,
//     fontWeight: "700",
//     color: "#1e293b",
//   },
//   closeButton: {
//     width: 36,
//     height: 36,
//     justifyContent: "center",
//     alignItems: "center",
//     borderRadius: 18,
//     backgroundColor: "#f1f5f9",
//   },
//   modalScrollContent: {
//     paddingBottom: 20,
//   },
//   filterSection: {
//     marginBottom: 24,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#1e293b",
//     marginBottom: 12,
//   },
//   chipContainer: {
//     flexDirection: "row",
//     gap: 10,
//     paddingRight: 20,
//   },
//   chip: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderRadius: 24,
//     backgroundColor: "#f1f5f9",
//     borderWidth: 1,
//     borderColor: "#e2e8f0",
//   },
//   chipActive: {
//     backgroundColor: "#6366f1",
//     borderColor: "#6366f1",
//   },
//   chipText: {
//     fontSize: 14,
//     color: "#475569",
//   },
//   chipTextActive: {
//     color: "#fff",
//   },
//   statusDotSmall: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//   },
//   sortContainer: {
//     flexDirection: "row",
//     gap: 12,
//   },
//   sortButton: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 8,
//     paddingVertical: 12,
//     borderRadius: 12,
//     backgroundColor: "#f1f5f9",
//   },
//   sortButtonActive: {
//     backgroundColor: "#6366f1",
//   },
//   sortButtonText: {
//     fontSize: 14,
//     color: "#475569",
//     fontWeight: "500",
//   },
//   sortButtonTextActive: {
//     color: "#fff",
//   },
//   modalFooter: {
//     flexDirection: "row",
//     gap: 12,
//     marginTop: 20,
//     paddingTop: 20,
//     borderTopWidth: 1,
//     borderTopColor: "#e2e8f0",
//   },
//   clearButton: {
//     flex: 1,
//     paddingVertical: 14,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#e2e8f0",
//     alignItems: "center",
//   },
//   clearButtonText: {
//     fontSize: 16,
//     fontWeight: "500",
//     color: "#64748b",
//   },
//   applyButton: {
//     flex: 1,
//     paddingVertical: 14,
//     borderRadius: 12,
//     backgroundColor: "#6366f1",
//     alignItems: "center",
//   },
//   applyButtonText: {
//     fontSize: 16,
//     fontWeight: "500",
//     color: "#fff",
//   },
// });
