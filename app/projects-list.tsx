// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   FlatList,
//   Image,
//   RefreshControl,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { Project } from "./types";
// import { fetchProjects } from "./utils/projectsApi";

// export default function ProjectsListScreen() {
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [refreshing, setRefreshing] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [loadingMore, setLoadingMore] = useState(false);
//   const router = useRouter();

//   const loadProjects = async (
//     pageNum: number = 1,
//     refresh: boolean = false,
//   ) => {
//     if (pageNum === 1) setLoading(true);
//     else setLoadingMore(true);

//     const data = await fetchProjects(pageNum, 10);

//     if (refresh || pageNum === 1) {
//       setProjects(data.data);
//       setFilteredProjects(data.data);
//     } else {
//       setProjects((prev) => [...prev, ...data.data]);
//       setFilteredProjects((prev) => [...prev, ...data.data]);
//     }

//     setTotalPages(data.totalPages);
//     setPage(pageNum);

//     if (pageNum === 1) setLoading(false);
//     setLoadingMore(false);
//   };

//   useEffect(() => {
//     loadProjects(1, true);
//   }, []);

//   useEffect(() => {
//     if (searchQuery === "") {
//       setFilteredProjects(projects);
//     } else {
//       const filtered = projects.filter(
//         (project) =>
//           project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           project.developer.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           project.area.toLowerCase().includes(searchQuery.toLowerCase()),
//       );
//       setFilteredProjects(filtered);
//     }
//   }, [searchQuery, projects]);

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await loadProjects(1, true);
//     setRefreshing(false);
//   };

//   const loadMore = () => {
//     if (page < totalPages && !loadingMore) {
//       loadProjects(page + 1);
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status?.toLowerCase()) {
//       case "out of stock":
//         return "#ef4444";
//       case "under construction":
//         return "#f59e0b";
//       case "ready":
//         return "#10b981";
//       default:
//         return "#6366f1";
//     }
//   };

//   const renderProjectCard = ({ item }: { item: Project }) => (
//     <TouchableOpacity
//       style={styles.projectCard}
//       onPress={() =>
//         router.push({
//           pathname: "/project-detail",
//           params: { projectId: item.id },
//         })
//       }
//     >
//       <Image
//         source={{ uri: item.s3_cover_url || item.cover_image_url?.url }}
//         style={styles.projectImage}
//       />
//       <View style={styles.projectContent}>
//         <View style={styles.projectHeader}>
//           <View style={styles.developerInfo}>
//             {item.developer_data?.logo_image?.[0] && (
//               <Image
//                 source={{ uri: item.developer_data.logo_image[0].url }}
//                 style={styles.developerLogo}
//               />
//             )}
//             <Text style={styles.developerName}>{item.developer}</Text>
//           </View>
//           <View
//             style={[
//               styles.statusBadge,
//               { backgroundColor: getStatusColor(item.sale_status) },
//             ]}
//           >
//             <Text style={styles.statusText}>{item.sale_status}</Text>
//           </View>
//         </View>

//         <Text style={styles.projectName}>{item.name}</Text>

//         <View style={styles.projectDetails}>
//           <View style={styles.detailItem}>
//             <Ionicons name="location-outline" size={14} color="#64748b" />
//             <Text style={styles.detailText}>{item.area}</Text>
//           </View>
//           <View style={styles.detailItem}>
//             <Ionicons name="business-outline" size={14} color="#64748b" />
//             <Text style={styles.detailText}>{item.country}</Text>
//           </View>
//         </View>

//         <View style={styles.projectFooter}>
//           <TouchableOpacity style={styles.viewButton}>
//             <Text style={styles.viewButtonText}>View Details</Text>
//             <Ionicons name="arrow-forward" size={14} color="#6366f1" />
//           </TouchableOpacity>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#6366f1" />
//         <Text style={styles.loadingText}>Loading projects...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity
//           onPress={() => router.back()}
//           style={styles.backButton}
//         >
//           <Ionicons name="arrow-back" size={24} color="#1e293b" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Real Estate Projects</Text>
//         <View style={styles.placeholder} />
//       </View>

//       <View style={styles.searchContainer}>
//         <Ionicons
//           name="search"
//           size={20}
//           color="#94a3b8"
//           style={styles.searchIcon}
//         />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search by project, developer, or area..."
//           placeholderTextColor="#94a3b8"
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//         />
//         {searchQuery !== "" && (
//           <TouchableOpacity onPress={() => setSearchQuery("")}>
//             <Ionicons name="close-circle" size={20} color="#94a3b8" />
//           </TouchableOpacity>
//         )}
//       </View>

//       <View style={styles.statsBar}>
//         <Text style={styles.statsText}>
//           {filteredProjects.length} Projects Found
//         </Text>
//       </View>

//       <FlatList
//         data={filteredProjects}
//         keyExtractor={(item) => item._id}
//         renderItem={renderProjectCard}
//         contentContainerStyle={styles.listContainer}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             tintColor="#6366f1"
//           />
//         }
//         onEndReached={loadMore}
//         onEndReachedThreshold={0.3}
//         ListFooterComponent={
//           loadingMore ? (
//             <View style={styles.loaderMore}>
//               <ActivityIndicator size="small" color="#6366f1" />
//               <Text style={styles.loadingMoreText}>Loading more...</Text>
//             </View>
//           ) : null
//         }
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <Ionicons name="business-outline" size={64} color="#cbd5e1" />
//             <Text style={styles.emptyText}>No projects found</Text>
//           </View>
//         }
//       />
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
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingTop: 60,
//     paddingBottom: 20,
//     backgroundColor: "#fff",
//     borderBottomWidth: 1,
//     borderBottomColor: "#e2e8f0",
//   },
//   backButton: {
//     width: 40,
//     height: 40,
//     justifyContent: "center",
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: "#1e293b",
//   },
//   placeholder: {
//     width: 40,
//   },
//   searchContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     marginHorizontal: 20,
//     marginTop: 20,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#e2e8f0",
//   },
//   searchIcon: {
//     marginRight: 10,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     color: "#1e293b",
//   },
//   statsBar: {
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//   },
//   statsText: {
//     fontSize: 14,
//     color: "#64748b",
//     fontWeight: "500",
//   },
//   listContainer: {
//     paddingHorizontal: 20,
//     paddingBottom: 20,
//   },
//   projectCard: {
//     backgroundColor: "#fff",
//     borderRadius: 16,
//     marginBottom: 16,
//     overflow: "hidden",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   projectImage: {
//     width: "100%",
//     height: 200,
//     resizeMode: "cover",
//   },
//   projectContent: {
//     padding: 16,
//   },
//   projectHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   developerInfo: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   developerLogo: {
//     width: 24,
//     height: 24,
//     resizeMode: "contain",
//   },
//   developerName: {
//     fontSize: 13,
//     color: "#6366f1",
//     fontWeight: "500",
//   },
//   statusBadge: {
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 8,
//   },
//   statusText: {
//     fontSize: 11,
//     color: "#fff",
//     fontWeight: "600",
//   },
//   projectName: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#1e293b",
//     marginBottom: 8,
//   },
//   projectDetails: {
//     flexDirection: "row",
//     gap: 16,
//     marginBottom: 16,
//   },
//   detailItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//   },
//   detailText: {
//     fontSize: 13,
//     color: "#64748b",
//   },
//   projectFooter: {
//     flexDirection: "row",
//     justifyContent: "flex-end",
//   },
//   viewButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     backgroundColor: "#e0e7ff",
//     borderRadius: 8,
//   },
//   viewButtonText: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: "#6366f1",
//   },
//   loaderMore: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 20,
//     gap: 8,
//   },
//   loadingMoreText: {
//     fontSize: 14,
//     color: "#64748b",
//   },
//   emptyContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 60,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: "#94a3b8",
//     marginTop: 16,
//   },
// });

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  TextInput as RNTextInput,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Project } from "./types";
import {
  fetchFilters,
  fetchProjects,
  FilterOptions,
  FilterParams,
} from "./utils/projectsApi";

export default function ProjectsListScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState<FilterParams>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    developers: [],
    areas: [],
    statuses: [],
    payments: [],
  });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempFilters, setTempFilters] = useState<FilterParams>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");

  // Dropdown states
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState("");

  const router = useRouter();

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Debounce: update searchQuery 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInputValue);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInputValue]);

  // Load projects when filters or searchQuery changes
  useEffect(() => {
    loadProjects(1, true);
  }, [filters, searchQuery]);

  const loadFilterOptions = async () => {
    try {
      const options = await fetchFilters();
      setFilterOptions(options);
    } catch (error) {
      console.error("Error loading filter options:", error);
    }
  };

  const loadProjects = async (
    pageNum: number = 1,
    refresh: boolean = false,
  ) => {
    if (pageNum === 1) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const data = await fetchProjects(pageNum, 10, {
        ...filters,
        search: searchQuery,
      });

      if (refresh || pageNum === 1) {
        setProjects(data.data);
      } else {
        setProjects((prev) => [...prev, ...data.data]);
      }

      setTotalPages(data.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error("Error loading projects:", error);
      setError("Failed to load projects. Please try again.");
      if (pageNum === 1) {
        setProjects([]);
      }
    } finally {
      if (pageNum === 1) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await loadProjects(1, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (page < totalPages && !loadingMore && !loading) {
      loadProjects(page + 1);
    }
  };


  const handleClearSearch = () => {
    setSearchInputValue("");
    setSearchQuery("");
  };

  const openFilterModal = () => {
    setTempFilters({ ...filters });
    setShowFilterModal(true);
    setActiveDropdown(null);
    setDropdownSearch("");
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setShowFilterModal(false);
    setActiveDropdown(null);
    setDropdownSearch("");
  };

  const clearFilters = () => {
    setTempFilters({});
    setFilters({});
    setShowFilterModal(false);
    setActiveDropdown(null);
    setDropdownSearch("");
  };

  const updateTempFilter = (key: keyof FilterParams, value: string) => {
    setTempFilters((prev) => {
      const currentValues = (prev[key] as string[]) || [];
      let newValues;

      if (currentValues.includes(value)) {
        newValues = currentValues.filter((v) => v !== value);
      } else {
        newValues = [...currentValues, value];
      }

      return {
        ...prev,
        [key]: newValues.length > 0 ? newValues : undefined,
      };
    });
  };

  const removeFilter = (key: keyof FilterParams, value: string) => {
    const newValues = filters[key]?.filter((v) => v !== value);
    setFilters({
      ...filters,
      [key]: newValues?.length ? newValues : undefined,
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.developers?.length) count += filters.developers.length;
    if (filters.areas?.length) count += filters.areas.length;
    if (filters.statuses?.length) count += filters.statuses.length;
    if (filters.payments?.length) count += filters.payments.length;
    return count;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "out of stock":
        return "#ef4444";
      case "under construction":
        return "#f59e0b";
      case "ready":
        return "#10b981";
      case "off-plan":
        return "#8b5cf6";
      default:
        return "#6366f1";
    }
  };

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return null;
    if (price >= 1000000) {
      return `AED ${(price / 1000000).toFixed(1)}M`;
    }
    return `AED ${price.toLocaleString()}`;
  };

  const renderProjectCard = ({ item }: { item: Project }) => {
    const priceText = formatPrice(item.min_price_aed);

    return (
      <TouchableOpacity
        style={styles.projectCard}
        onPress={() =>
          router.push({
            pathname: "/project-detail",
            params: { projectId: item.id },
          })
        }
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.s3_cover_url || item.cover_image_url?.url }}
          style={styles.projectImage}
        />

        <View
          style={[
            styles.statusOverlay,
            { backgroundColor: getStatusColor(item.sale_status) },
          ]}
        >
          <Text style={styles.statusOverlayText}>
            {item.sale_status || "Available"}
          </Text>
        </View>

        <View style={styles.projectContent}>
          <View style={styles.developerRow}>
            {item.developer_data?.logo_image?.[0] && (
              <Image
                source={{ uri: item.developer_data.logo_image[0].url }}
                style={styles.developerLogo}
              />
            )}
            <Ionicons name="business-outline" size={14} color="#6366f1" />
            <Text style={styles.developerName} numberOfLines={1}>
              {item.developer}
            </Text>
          </View>

          <Text style={styles.projectName} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color="#94a3b8" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.area}, {item.country}
            </Text>
          </View>

          {priceText && (
            <View style={styles.footer}>
              <View>
                <Text style={styles.priceLabel}>Starting Price</Text>
                <Text style={styles.price}>{priceText}</Text>
              </View>
              <View style={styles.viewButton}>
                <Text style={styles.viewButtonText}>View Details</Text>
                <Ionicons name="arrow-forward" size={14} color="#6366f1" />
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderDropdown = (
    title: string,
    items: string[],
    filterKey: keyof FilterParams,
  ) => {
    const isOpen = activeDropdown === filterKey;
    const selectedItems = (tempFilters[filterKey] as string[]) || [];

    // Filter items based on search
    const filteredItems = items.filter((item) =>
      item.toLowerCase().includes(dropdownSearch.toLowerCase()),
    );

    return (
      <View style={styles.dropdownSection}>
        <TouchableOpacity
          style={styles.dropdownHeader}
          onPress={() => {
            setActiveDropdown(isOpen ? null : filterKey);
            setDropdownSearch("");
          }}
        >
          <Text style={styles.dropdownHeaderText}>
            {title} ({selectedItems.length} selected)
          </Text>
          <Ionicons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={20}
            color="#6366f1"
          />
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.dropdownContent}>
            <View style={styles.dropdownSearchContainer}>
              <Ionicons name="search" size={18} color="#94a3b8" />
              <RNTextInput
                style={styles.dropdownSearchInput}
                placeholder={`Search ${title.toLowerCase()}...`}
                placeholderTextColor="#94a3b8"
                value={dropdownSearch}
                onChangeText={setDropdownSearch}
              />
              {dropdownSearch !== "" && (
                <TouchableOpacity onPress={() => setDropdownSearch("")}>
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
              {filteredItems.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.dropdownItem}
                  onPress={() => updateTempFilter(filterKey, item)}
                >
                  <View style={styles.checkbox}>
                    {selectedItems.includes(item) && (
                      <Ionicons name="checkmark" size={16} color="#6366f1" />
                    )}
                  </View>
                  <Text style={styles.dropdownItemText} numberOfLines={2}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
              {filteredItems.length === 0 && (
                <Text style={styles.noResultsText}>No results found</Text>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const header = (
    <>
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
            placeholder="Search projects by name, developer, or area..."
            placeholderTextColor="#94a3b8"
            value={searchInputValue}
            onChangeText={setSearchInputValue}
          />
          {searchInputValue !== "" && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={openFilterModal} style={styles.filterButton}>
          <Ionicons name="options-outline" size={22} color="#6366f1" />
          {getActiveFilterCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {getActiveFilterCount()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading && projects.length > 0 && (
        <View style={styles.searchLoadingBar}>
          <ActivityIndicator size="small" color="#6366f1" />
          <Text style={styles.searchLoadingText}>Updating results...</Text>
        </View>
      )}

      {getActiveFilterCount() > 0 && (
        <View style={styles.activeFiltersWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeFiltersRow}
          >
            {filters.developers?.map((dev) => (
              <View key={dev} style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText} numberOfLines={1}>
                  {dev}
                </Text>
                <TouchableOpacity
                  onPress={() => removeFilter("developers", dev)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {filters.areas?.map((area) => (
              <View key={area} style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText} numberOfLines={1}>
                  {area}
                </Text>
                <TouchableOpacity onPress={() => removeFilter("areas", area)}>
                  <Ionicons name="close-circle" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {filters.statuses?.map((status) => (
              <View key={status} style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText} numberOfLines={1}>
                  {status}
                </Text>
                <TouchableOpacity
                  onPress={() => removeFilter("statuses", status)}
                >
                  <Ionicons name="close-circle" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {filters.payments?.map((payment) => (
              <View key={payment} style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText} numberOfLines={1}>
                  {payment.length > 20
                    ? payment.substring(0, 20) + "..."
                    : payment}
                </Text>
                <TouchableOpacity
                  onPress={() => removeFilter("payments", payment)}
                >
                  <Ionicons name="close-circle" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </>
  );

  if (loading && projects.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading projects...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {header}
      <FlatList
        data={projects}
        keyExtractor={(item) => item._id}
        renderItem={renderProjectCard}
        contentContainerStyle={[
          styles.listContainer,
          projects.length === 0 && styles.emptyListContainer,
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
                Loading more projects...
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading && !error && projects.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Projects Found</Text>
              <Text style={styles.emptyText}>
                {getActiveFilterCount() > 0 || searchQuery
                  ? "No projects match your search or filter criteria"
                  : "No projects available at the moment"}
              </Text>
              {(getActiveFilterCount() > 0 || searchQuery) && (
                <TouchableOpacity
                  style={styles.clearAllButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearAllButtonText}>
                    Clear All Filters
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {renderDropdown(
              "Developers",
              filterOptions.developers,
              "developers",
            )}
            {renderDropdown("Areas", filterOptions.areas, "areas")}
            {renderDropdown("Status", filterOptions.statuses, "statuses")}
            {renderDropdown(
              "Payment Plans",
              filterOptions.payments,
              "payments",
            )}
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
      </Modal>
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
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: "#f8fafc",
    marginTop: 30,
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
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1e293b",
    padding: 0,
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
    top: -5,
    right: -5,
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
  activeFiltersWrapper: {
    backgroundColor: "#f8fafc",
    paddingBottom: 12,
  },
  activeFiltersRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366f1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    maxWidth: 200,
  },
  activeFilterText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyListContainer: {
    flex: 1,
  },
  projectCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  projectImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  statusOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 1,
  },
  statusOverlayText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  projectContent: {
    padding: 16,
  },
  developerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  developerLogo: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  developerName: {
    fontSize: 13,
    color: "#6366f1",
    fontWeight: "600",
    flex: 1,
  },
  projectName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 6,
    lineHeight: 24,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 12,
    color: "#94a3b8",
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "500",
    marginBottom: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6366f1",
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
  searchLoadingBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 8,
    backgroundColor: "#f8fafc",
  },
  searchLoadingText: {
    fontSize: 13,
    color: "#6366f1",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
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
    textAlign: "center",
  },
  clearAllButton: {
    marginTop: 20,
    backgroundColor: "#6366f1",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  clearAllButtonText: {
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
  retryButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Dropdown styles
  dropdownSection: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    overflow: "hidden",
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#f8fafc",
  },
  dropdownHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  dropdownContent: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  dropdownSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    gap: 8,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1e293b",
    padding: 8,
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 14,
    color: "#334155",
  },
  noResultsText: {
    padding: 20,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 14,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#fff",
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
    fontWeight: "600",
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
