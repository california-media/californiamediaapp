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

//   const renderProjectCard = ({ item }: { item: Project }) => {
//     const priceText = item.min_price_aed
//       ? `AED ${item.min_price_aed.toLocaleString()}`
//       : "";
//     return (
//       <TouchableOpacity
//         style={styles.projectCard}
//         onPress={() =>
//           router.push({
//             pathname: "/project-detail",
//             params: { projectId: item.id },
//           })
//         }
//       >
//         <Image
//           source={{ uri: item.s3_cover_url || item.cover_image_url?.url }}
//           style={styles.projectImage}
//         />
//         <View style={styles.projectContent}>
//           <View style={styles.projectHeader}>
//             <View style={styles.developerInfo}>
//               {item.developer_data?.logo_image?.[0] && (
//                 <Image
//                   source={{ uri: item.developer_data.logo_image[0].url }}
//                   style={styles.developerLogo}
//                 />
//               )}
//               <Text style={styles.developerName}>{item.developer}</Text>
//             </View>
//             <View
//               style={[
//                 styles.statusBadge,
//                 { backgroundColor: getStatusColor(item.sale_status) },
//               ]}
//             >
//               <Text style={styles.statusText}>{item.sale_status}</Text>
//             </View>
//           </View>

//           <Text style={styles.projectName}>{item.name}</Text>

//           <View style={styles.projectDetails}>
//             <View style={styles.detailItem}>
//               <Ionicons name="location-outline" size={14} color="#64748b" />
//               <Text style={styles.detailText}>{item.area}</Text>
//             </View>
//             <View style={styles.detailItem}>
//               <Ionicons name="business-outline" size={14} color="#64748b" />
//               <Text style={styles.detailText}>{item.country}</Text>
//             </View>
//           </View>

//           {/* Price Display */}
//           {priceText !== "" && (
//             <View style={styles.projectPriceContainer}>
//               <Text style={styles.projectPrice}>{priceText}</Text>
//             </View>
//           )}
//         </View>
//       </TouchableOpacity>
//     );
//   };

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
//   projectPriceContainer: {
//     marginTop: 6,
//   },
//   projectPrice: {
//     fontSize: 14,
//     fontWeight: "bold",
//     color: "#1e293b", // dark color for readability
//   },
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

// app/projects-list.tsx - Updated with integrated header
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Project } from "./types";
import { fetchProjects } from "./utils/projectsApi";

export default function ProjectsListScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
      const data = await fetchProjects(pageNum, 10);

      if (refresh || pageNum === 1) {
        setProjects(data.data);
        setFilteredProjects(data.data);
      } else {
        setProjects((prev) => [...prev, ...data.data]);
        setFilteredProjects((prev) => [...prev, ...data.data]);
      }

      setTotalPages(data.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error("Error loading projects:", error);
      setError("Failed to load projects. Please try again.");
      if (pageNum === 1) {
        setProjects([]);
        setFilteredProjects([]);
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
    loadProjects(1, true);
  }, []);

  useEffect(() => {
    if (searchQuery === "") {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(
        (project) =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.developer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.area.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredProjects(filtered);
    }
  }, [searchQuery, projects]);

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
          // defaultSource={require("../assets/placeholder.png")}
        />

        {/* Status Badge Overlay */}
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
          {/* Developer Info */}
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

          {/* Project Name */}
          <Text style={styles.projectName} numberOfLines={2}>
            {item.name}
          </Text>

          {/* Location */}
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color="#94a3b8" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.area}, {item.country}
            </Text>
          </View>

          {/* Price Footer */}
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
            placeholder="Search projects by name, developer, or area..."
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

        {/* <View style={styles.placeholderButton} /> */}
      </View>

      {/* Stats Row */}
      {/* <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          {filteredProjects.length} Projects Found
        </Text>
      </View> */}
    </>
  );

  if (loading && page === 1) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading projects...</Text>
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

      {/* Projects List with integrated header */}
      <FlatList
        data={filteredProjects}
        keyExtractor={(item) => item._id}
        renderItem={renderProjectCard}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={[
          styles.listContainer,
          filteredProjects.length === 0 && styles.emptyListContainer,
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
          !loading && !error && filteredProjects.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Projects Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery !== ""
                  ? "No projects match your search criteria"
                  : "No projects available at the moment"}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
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
    paddingVertical: 6,
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
  placeholderButton: {
    width: 44,
    height: 44,
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
  listContainer: {
    paddingBottom: 20,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
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
  detailsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  detailItem: {
    flex: 1,
    minWidth: 70,
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    gap: 4,
  },
  detailLabel: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "500",
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
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
    textAlign: "center",
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
});
