// app/properties-list.tsx - Final version with proper spacing
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import FilterModal from "./components/FilterModal";
import PropertyCard from "./components/PropertyCard";
import { FilterOptions, Property, defaultFilters } from "./types";
import { fetchProperties } from "./utils/propertiesApi";

export default function PropertiesListScreen() {
  const [activeTab, setActiveTab] = useState<"Off-plan" | "Secondary">(
    "Off-plan",
  );
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState<FilterOptions>(defaultFilters);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const loadProperties = async (
    pageNum: number = 1,
    refresh: boolean = false,
    newFilters?: FilterOptions,
  ) => {
    const currentFilters = newFilters || filters;

    if (pageNum === 1) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await fetchProperties(
        activeTab,
        currentFilters,
        pageNum,
        10,
      );

      if (response.total !== undefined) {
        setTotalResults(response.total);
      }

      const newProperties = response.data || [];

      if (refresh || pageNum === 1) {
        setProperties(newProperties);
        setFilteredProperties(newProperties);
      } else {
        setProperties((prev) => [...prev, ...newProperties]);
        setFilteredProperties((prev) => [...prev, ...newProperties]);
      }

      const hasMoreResults = newProperties.length === 10;
      setHasMore(hasMoreResults);
      setPage(pageNum);
    } catch (error) {
      console.error("Error loading properties:", error);
      setError("Failed to load properties. Please try again.");
      if (pageNum === 1) {
        setProperties([]);
        setFilteredProperties([]);
      }
    } finally {
      if (pageNum === 1) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    loadProperties(1, true);
  }, [activeTab]);

  // Apply search filter locally
  useEffect(() => {
    if (searchQuery === "") {
      setFilteredProperties(properties);
    } else {
      const filtered = properties.filter(
        (property) =>
          property.project_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          property.developer
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          property.property_type
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          property.unit_type?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredProperties(filtered);
    }
  }, [searchQuery, properties]);

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await loadProperties(1, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore && !loading && properties.length > 0) {
      loadProperties(page + 1);
    }
  };

  const applyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setShowFilters(false);
    setPage(1);
    loadProperties(1, true, newFilters);
  };

  const resetFilters = () => {
    const resetFiltersData = defaultFilters;
    setTempFilters(resetFiltersData);
    setFilters(resetFiltersData);
    setShowFilters(false);
    setPage(1);
    loadProperties(1, true, resetFiltersData);
  };

  const hasActiveFilters = () => {
    return Object.entries(filters).some(
      ([key, value]) =>
        value !== "" &&
        value !== null &&
        key !== "sort_by" &&
        key !== "sort_order",
    );
  };

  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(
      ([key, value]) =>
        value !== "" &&
        value !== null &&
        key !== "sort_by" &&
        key !== "sort_order",
    ).length;
  };

  const renderPropertyCard = ({ item }: { item: Property }) => (
    <PropertyCard
      property={item}
      onPress={() =>
        router.push({
          pathname: "/property-detail",
          params: { propertyId: item.id },
        })
      }
    />
  );

  const EmptyStateComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>No Properties Found</Text>
      <Text style={styles.emptyText}>
        {hasActiveFilters()
          ? "No properties match your current filters. Try adjusting your search criteria."
          : `No ${activeTab} properties available at the moment.`}
      </Text>
      {hasActiveFilters() && (
        <TouchableOpacity
          style={styles.resetFiltersButton}
          onPress={resetFilters}
        >
          <Ionicons name="refresh-outline" size={20} color="#fff" />
          <Text style={styles.resetFiltersButtonText}>Clear All Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const ErrorStateComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
      <Text style={styles.emptyTitle}>Something Went Wrong</Text>
      <Text style={styles.emptyText}>
        {error || "Failed to load properties"}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
        <Ionicons name="refresh-outline" size={20} color="#fff" />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  // Header component that scrolls with the list
  const ListHeader = () => (
    <>
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
            // placeholder={`Search ${activeTab} properties...`}
            placeholder={
              filteredProperties.length > 0
                ? `Search ${filteredProperties.length} of ${totalResults || filteredProperties.length} properties`
                : `No ${activeTab} properties found`
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

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            setTempFilters(filters);
            setShowFilters(true);
          }}
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

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Off-plan" && styles.activeTab]}
          onPress={() => {
            setActiveTab("Off-plan");
            setPage(1);
            setSearchQuery("");
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Off-plan" && styles.activeTabText,
            ]}
          >
            Off-Plan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Secondary" && styles.activeTab]}
          onPress={() => {
            setActiveTab("Secondary");
            setPage(1);
            setSearchQuery("");
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Secondary" && styles.activeTabText,
            ]}
          >
            Secondary
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  if (loading && page === 1) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>
          Loading {activeTab} properties...
        </Text>
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

      {/* Properties List with integrated header */}
      <FlatList
        data={filteredProperties}
        keyExtractor={(item) => item.id}
        renderItem={renderPropertyCard}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={[
          styles.listContainer,
          filteredProperties.length === 0 && styles.emptyListContainer,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loaderMore}>
              <ActivityIndicator size="small" color="#6366f1" />
              <Text style={styles.loadingMoreText}>
                Loading more properties...
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading && !error && filteredProperties.length === 0 ? (
            <EmptyStateComponent />
          ) : null
        }
      />

      <FilterModal
        visible={showFilters}
        filters={tempFilters}
        onClose={() => setShowFilters(false)}
        onApply={applyFilters}
        onReset={resetFilters}
        setFilters={setTempFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
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
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    marginBottom: 16,
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
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
  },
  activeTab: {
    backgroundColor: "#6366f1",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  activeTabText: {
    color: "#fff",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
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
    paddingHorizontal: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
  },
  loaderMore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: "#64748b",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  resetFiltersButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#6366f1",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  resetFiltersButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ef4444",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
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
});
