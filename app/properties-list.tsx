// app/properties-list.tsx (Updated version)
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

      // Update total results count
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

      // Check if there are more results
      const hasMoreResults = newProperties.length === 10;
      setHasMore(hasMoreResults);
      setPage(pageNum);

      // Show message if no results found
      if (newProperties.length === 0 && pageNum === 1) {
        // Don't show error, just empty state
        console.log("No properties found for current filters");
      }
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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Properties</Text>
        <TouchableOpacity
          onPress={() => {
            setTempFilters(filters);
            setShowFilters(true);
          }}
          style={styles.filterButton}
        >
          <Ionicons name="options-outline" size={24} color="#6366f1" />
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#94a3b8"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeTab} properties...`}
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

      {/* Stats Bar */}
      {(filteredProperties.length > 0 || hasActiveFilters()) && (
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            {filteredProperties.length > 0
              ? `Showing ${filteredProperties.length} of ${totalResults || filteredProperties.length} ${activeTab} Properties`
              : `No ${activeTab} properties found`}
          </Text>
          {hasActiveFilters() && filteredProperties.length === 0 && (
            <TouchableOpacity onPress={resetFilters}>
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
          {hasActiveFilters() && filteredProperties.length > 0 && (
            <TouchableOpacity onPress={resetFilters}>
              <Text style={styles.clearFiltersText}>Clear All Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {error ? (
        <ErrorStateComponent />
      ) : (
        <FlatList
          data={filteredProperties}
          keyExtractor={(item) => item.id}
          renderItem={renderPropertyCard}
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
          ListEmptyComponent={!loading ? <EmptyStateComponent /> : null}
        />
      )}

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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#ef4444",
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
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  activeTab: {
    backgroundColor: "#6366f1",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },
  activeTabText: {
    color: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
  },
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statsText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  clearFiltersText: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "500",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
});
