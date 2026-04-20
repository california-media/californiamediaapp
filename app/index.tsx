// app/index.tsx (HomeScreen)
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Lead, Project, Property, defaultFilters } from "./types";
import { fetchAllLeads } from "./utils/api";
// import { fetchProjects } from "./utils/projectsApi";
import { fetchProperties } from "./utils/propertiesApi";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [latestLead, setLatestLead] = useState<Lead | null>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [secondaryProperties, setSecondaryProperties] = useState<Property[]>(
    [],
  );
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const router = useRouter();

  const loadData = async () => {
    // Run all three in parallel — a failure in one won't block the others
    const [leadsResult, propertiesResult] = await Promise.allSettled([
      fetchAllLeads({ limit: 100 }),
      // fetchProjects(1, 6),
      fetchProperties("Off-plan", defaultFilters, 1, 6),
    ]);

    // Leads
    if (leadsResult.status === "fulfilled") {
      const allLeads = leadsResult.value.data || [];
      const sortedLeads = [...allLeads].sort(
        (a, b) =>
          new Date(b.dateadded).getTime() - new Date(a.dateadded).getTime(),
      );
      setLeads(allLeads);
      setLatestLead(sortedLeads[0] || null);
      setRecentLeads(sortedLeads.slice(1, 5));
    } else {
      console.log("Leads fetch failed:", leadsResult.reason);
      setLeads([]);
      setLatestLead(null);
      setRecentLeads([]);
    }

    // Off-plan projects
    // if (projectsResult.status === "fulfilled") {
    //   setFeaturedProjects(projectsResult.value.data || []);
    // } else {
    //   console.log("Projects fetch failed:", projectsResult.reason);
    //   setFeaturedProjects([]);
    // }

    // Secondary properties
    if (propertiesResult.status === "fulfilled") {
      setSecondaryProperties(propertiesResult.value.data || []);
    } else {
      console.log("Properties fetch failed:", propertiesResult.reason);
      setSecondaryProperties([]);
    }

    setInitialLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "out of stock":
        return "#ef4444";
      case "under construction":
        return "#f59e0b";
      case "ready":
        return "#10b981";
      case "available":
        return "#10b981";
      case "sold":
        return "#ef4444";
      case "reserved":
        return "#f59e0b";
      default:
        return "#6366f1";
    }
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return `AED ${numPrice.toLocaleString()}`;
  };

  const getPropertyTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "apartment":
        return "business-outline";
      case "villa":
        return "home-outline";
      case "townhouse":
        return "home-outline";
      default:
        return "location-outline";
    }
  };

  // Show loading spinner only during the initial fetch — not if data simply comes back empty
  if (initialLoading) {
    return (
      <View style={styles.center}>
        <View style={styles.loaderContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#6366f1"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello there! 👋</Text>
          <Text style={styles.subGreeting}>Welcome back to Lead Manager</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push("/profile")}
        >
          <Ionicons name="person-circle-outline" size={44} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{leads.length}</Text>
          <Text style={styles.statLabel}>Total Leads</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {
              leads.filter(
                (l) =>
                  new Date(l.dateadded).getTime() >
                  Date.now() - 7 * 24 * 60 * 60 * 1000,
              ).length
            }
          </Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {leads.filter((l) => l.status === "5").length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {/* Latest Lead Highlight - Only show if latestLead exists */}
      {latestLead && (
        <View style={styles.latestCard}>
          <View style={styles.latestBadge}>
            <Ionicons name="flash" size={16} color="#fff" />
            <Text style={styles.latestBadgeText}>NEW LEAD</Text>
          </View>

          <Text style={styles.latestName}>{latestLead.name}</Text>

          <View style={styles.latestCompanyContainer}>
            <Ionicons name="business-outline" size={16} color="#a5b4fc" />
            <Text style={styles.latestCompany}>
              {latestLead.company || "No Company"}
            </Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="mail-outline" size={18} color="#c7d2fe" />
              <Text style={styles.infoText}>{latestLead.email}</Text>
            </View>
            {latestLead.phonenumber && (
              <View style={styles.infoItem}>
                <Ionicons name="call-outline" size={18} color="#c7d2fe" />
                <Text style={styles.infoText}>{latestLead.phonenumber}</Text>
              </View>
            )}
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={18} color="#c7d2fe" />
              <Text style={styles.infoText}>
                Added {formatDate(latestLead.dateadded)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="globe-outline" size={18} color="#c7d2fe" />
              <Text style={styles.infoText}>
                {latestLead.source_name || "Unknown Source"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewLeadButton}
            onPress={() =>
              router.push({
                pathname: "/lead-detail",
                params: { lead: JSON.stringify(latestLead) },
              })
            }
          >
            <Text style={styles.viewLeadButtonText}>View Full Details</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Featured Projects Section - Off-Plan */}
      {/* <View style={styles.projectsSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Global Off-Plan</Text>
            <Text style={styles.sectionSubtitle}>
              Discover luxury off-plan properties
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/projects-list")}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {featuredProjects.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.projectsScroll}
            contentContainerStyle={styles.projectsScrollContent}
          >
            {featuredProjects.map((project) => {
              let priceText = "";
              if (project.min_price_aed && project.max_price_aed) {
                priceText =
                  project.min_price_aed === project.max_price_aed
                    ? `AED ${project.min_price_aed.toLocaleString()}`
                    : `AED ${project.min_price_aed.toLocaleString()} – ${project.max_price_aed.toLocaleString()}`;
              } else if (project.min_price_aed) {
                priceText = `AED ${project.min_price_aed.toLocaleString()}`;
              } else if (project.max_price_aed) {
                priceText = `AED ${project.max_price_aed.toLocaleString()}`;
              }

              return (
                <TouchableOpacity
                  key={project._id}
                  style={styles.projectCard}
                  onPress={() =>
                    router.push({
                      pathname: "/project-detail",
                      params: { projectId: project.id ?? project._id },
                    })
                  }
                >
                  <Image
                    source={{
                      uri: project.s3_cover_url || project.cover_image_url?.url,
                    }}
                    style={styles.projectImage}
                  />
                  <View style={styles.projectOverlay}>
                    <View style={styles.projectDeveloper}>
                      {project.developer_data?.logo_image?.[0] && (
                        <Image
                          source={{
                            uri: project.developer_data.logo_image[0].url,
                          }}
                          style={styles.developerLogo}
                        />
                      )}
                      <Text style={styles.developerName}>
                        {project.developer}
                      </Text>
                    </View>
                    <Text style={styles.projectName}>{project.name}</Text>
                    <View style={styles.projectLocation}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color="#fff"
                      />
                      <Text style={styles.projectArea}>
                        {project.area}, {project.country}
                      </Text>
                    </View>
                    {priceText !== "" && (
                      <Text style={styles.projectPrice}>{priceText}</Text>
                    )}
                    <View
                      style={[
                        styles.projectStatus,
                        {
                          backgroundColor: getStatusColor(project.sale_status),
                        },
                      ]}
                    >
                      <Text style={styles.projectStatusText}>
                        {project.sale_status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyPropertiesContainer}>
            <Ionicons name="business-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyPropertiesText}>
              No off-plan projects available
            </Text>
          </View>
        )}
      </View> */}

      {/* Secondary Properties Section */}
      <View style={styles.propertiesSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Properties</Text>
            <Text style={styles.sectionSubtitle}>
              Ready to move-in properties
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/properties-list?tab=Secondary")}
          >
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {secondaryProperties.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.propertiesScroll}
            contentContainerStyle={styles.propertiesScrollContent}
          >
            {secondaryProperties.map((property) => (
              <TouchableOpacity
                key={property.id}
                style={styles.propertyCard}
                onPress={() =>
                  router.push({
                    pathname: "/property-detail",
                    params: { propertyId: property.id },
                  })
                }
              >
                <Image
                  source={{ uri: property.thumbnail }}
                  style={styles.propertyImage}
                />
                <View style={styles.propertyOverlay}>
                  <View style={styles.propertyHeader}>
                    <View style={styles.propertyDeveloper}>
                      <Ionicons
                        name="business-outline"
                        size={14}
                        color="#6366f1"
                      />
                      <Text style={styles.propertyDeveloperName}>
                        {property.developer}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.propertyStatus,
                        {
                          backgroundColor: getStatusColor(
                            property.property_status,
                          ),
                        },
                      ]}
                    >
                      <Text style={styles.propertyStatusText}>
                        {property.property_status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.propertyName} numberOfLines={1}>
                    {property.project_name}
                  </Text>

                  <View style={styles.propertyLocation}>
                    <Ionicons
                      name="location-outline"
                      size={12}
                      color="#64748b"
                    />
                    <Text style={styles.propertyArea} numberOfLines={1}>
                      {property.location ||
                        property.bayut_location_name ||
                        "Dubai"}
                    </Text>
                  </View>

                  <View style={styles.propertySpecs}>
                    <View style={styles.propertySpec}>
                      <Ionicons
                        name={getPropertyTypeIcon(property.property_type ?? "")}
                        size={12}
                        color="#64748b"
                      />
                      <Text style={styles.propertySpecText}>
                        {property.property_type || property.unit_type}
                      </Text>
                    </View>
                    <View style={styles.propertySpec}>
                      <Ionicons name="bed-outline" size={12} color="#64748b" />
                      <Text style={styles.propertySpecText}>
                        {property.bedrooms} Beds
                      </Text>
                    </View>
                    <View style={styles.propertySpec}>
                      <Ionicons
                        name="water-outline"
                        size={12}
                        color="#64748b"
                      />
                      <Text style={styles.propertySpecText}>
                        {property.bathrooms} Baths
                      </Text>
                    </View>
                  </View>

                  <View style={styles.propertyFooter}>
                    <Text style={styles.propertyPrice}>
                      {formatPrice(property.price)}
                    </Text>
                    <View style={styles.furnishingBadge}>
                      <Text style={styles.furnishingText}>
                        {property.furnishing}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyPropertiesContainer}>
            <Ionicons name="business-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyPropertiesText}>
              No properties available
            </Text>
          </View>
        )}
      </View>

      {/* Recent Leads Section */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Leads</Text>
          <TouchableOpacity onPress={() => router.push("/leads-list")}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentLeads.length > 0 ? (
          recentLeads.map((lead, index) => (
            <TouchableOpacity
              key={lead.id}
              style={styles.recentLeadCard}
              onPress={() =>
                router.push({
                  pathname: "/lead-detail",
                  params: { lead: JSON.stringify(lead) },
                })
              }
            >
              <View style={styles.recentLeadAvatar}>
                <Text style={styles.avatarText}>{lead.name.charAt(0)}</Text>
              </View>
              <View style={styles.recentLeadInfo}>
                <Text style={styles.recentLeadName}>{lead.name}</Text>
                <Text style={styles.recentLeadCompany}>
                  {lead.company || "No Company"}
                </Text>
              </View>
              <View style={styles.recentLeadMeta}>
                <Text style={styles.recentLeadTime}>
                  {formatDate(lead.dateadded)}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyPropertiesContainer}>
            <Ionicons name="people-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyPropertiesText}>No recent leads</Text>
          </View>
        )}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#6366f1" />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/leads-list")}
        >
          <Ionicons name="people" size={24} color="#94a3b8" />
          <Text style={styles.navText}>Leads</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/properties-list")}
        >
          <Ionicons name="business" size={24} color="#94a3b8" />
          <Text style={styles.navText}>Projects</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/profile")}
        >
          <Ionicons name="settings" size={24} color="#94a3b8" />
          <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  projectPrice: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginTop: 4,
  },
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
  loaderContainer: {
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#64748b",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
  },
  subGreeting: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: -20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#6366f1",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  latestCard: {
    backgroundColor: "#6366f1",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  latestBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  latestBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  latestName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  latestCompanyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  latestCompany: {
    fontSize: 16,
    color: "#a5b4fc",
  },
  infoGrid: {
    gap: 12,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: "#c7d2fe",
  },
  viewLeadButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewLeadButtonText: {
    fontSize: 16,
    fontWeight: "600",
    // color: "#6366f1",
    color: "#0F172A",
  },
  projectsSection: {
    marginTop: 32,
    marginBottom: 24,
  },
  propertiesSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "500",
  },
  projectsScroll: {
    paddingLeft: 20,
  },
  projectsScrollContent: {
    paddingRight: 20,
    gap: 16,
  },
  propertiesScroll: {
    paddingLeft: 20,
  },
  propertiesScrollContent: {
    paddingRight: 20,
    gap: 16,
  },
  projectCard: {
    width: 280,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  projectImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  projectOverlay: {
    padding: 12,
  },
  projectDeveloper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  developerLogo: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  developerName: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "500",
  },
  projectName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 6,
  },
  projectLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  projectArea: {
    fontSize: 12,
    color: "#64748b",
  },
  projectStatus: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  projectStatusText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
  },
  propertyCard: {
    width: 280,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  propertyImage: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  propertyOverlay: {
    padding: 12,
  },
  propertyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  propertyDeveloper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  propertyDeveloperName: {
    fontSize: 11,
    color: "#6366f1",
    fontWeight: "500",
  },
  propertyStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  propertyStatusText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
  },
  propertyName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 6,
  },
  propertyLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  propertyArea: {
    fontSize: 11,
    color: "#64748b",
    flex: 1,
  },
  propertySpecs: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  propertySpec: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  propertySpecText: {
    fontSize: 11,
    color: "#64748b",
  },
  propertyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
  },
  furnishingBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  furnishingText: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "500",
  },
  emptyPropertiesContainer: {
    marginHorizontal: 20,
    paddingVertical: 40,
    backgroundColor: "#fff",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyPropertiesText: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 12,
  },
  recentSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 100,
  },
  recentLeadCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recentLeadAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e0e7ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#6366f1",
  },
  recentLeadInfo: {
    flex: 1,
  },
  recentLeadName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  recentLeadCompany: {
    fontSize: 13,
    color: "#64748b",
  },
  recentLeadMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recentLeadTime: {
    fontSize: 12,
    color: "#94a3b8",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  navText: {
    fontSize: 12,
    color: "#94a3b8",
  },
  navTextActive: {
    color: "#6366f1",
    fontWeight: "500",
  },
});
