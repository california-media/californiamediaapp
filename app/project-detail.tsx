import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Sharing from "expo-sharing";
import { ProjectDetails } from "./types";
import { downloadBrochure, fetchProjectById } from "./utils/projectsApi";

const { width, height } = Dimensions.get("window");

export default function ProjectDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = parseInt(params.projectId as string);
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showFullOverview, setShowFullOverview] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Dynamically import MapView to avoid build errors if not installed
  let MapView: any = null;
  let Marker: any = null;
  try {
    const Maps = require("react-native-maps");
    MapView = Maps.default;
    Marker = Maps.Marker;
  } catch (error) {
    console.log("react-native-maps not available, using fallback");
  }

  useEffect(() => {
    loadProjectDetails();
    setMapReady(!!MapView);
  }, []);

  const loadProjectDetails = async () => {
    setLoading(true);
    const data = await fetchProjectById(projectId);
    setProject(data);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "out of stock":
        return "#ef4444";
      case "under construction":
        return "#f59e0b";
      case "ready":
        return "#10b981";
      default:
        return "#6366f1";
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "Price on request";
    // if (price >= 1000000) {
    //   return `AED ${(price / 1000000).toFixed(1)}M`;
    // }
    return `AED ${price.toLocaleString()}`;
  };

  const formatArea = (area: number | null, unit: string) => {
    if (!area) return "Size on request";
    if (area >= 1000) {
      return `${(area / 1000).toFixed(1)}K ${unit}`;
    }
    return `${area.toLocaleString()} ${unit}`;
  };

  const coordinateString = project?.coordinates;
  let mapLatitude = 25.2048;
  let mapLongitude = 55.2708;

  if (coordinateString) {
    const [lat, lng] = coordinateString
      .split(",")
      .map((val) => parseFloat(val.trim()));
    if (!isNaN(lat) && !isNaN(lng)) {
      mapLatitude = lat;
      mapLongitude = lng;
    }
  }

  const openUrl = (url: string) => {
    if (url) Linking.openURL(url);
  };

  const onDownloadBrochure = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const filePath = await downloadBrochure(projectId);
      await Sharing.shareAsync(filePath, { mimeType: "application/pdf" });
    } catch (error) {
      console.error("Error downloading brochure:", error);
    } finally {
      setDownloading(false);
    }
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `${project?.name}\n${project?.area}, ${project?.country}\n${formatPrice(project?.min_price_aed)}`,
        url: project?.website,
      });
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading project details...</Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Project not found</Text>
        <TouchableOpacity
          style={styles.backButtonError}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Image with Gradient Overlay */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: project.s3_cover_url || project.cover_image_url?.url }}
          style={styles.coverImage}
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.6)"]}
          style={styles.gradientOverlay}
        />

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButtonOverlay}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.titleOverlay}>
          <Text style={styles.overlayTitle}>{project.name}</Text>
          <View style={styles.overlayLocation}>
            <Ionicons name="location-outline" size={16} color="#fff" />
            <Text style={styles.overlayLocationText}>
              {project.area}, {project.country}
            </Text>
          </View>
        </View>

        {/* Share and Like Icons */}
        <View style={styles.actionIconsOverlay}>
          <TouchableOpacity style={styles.iconCircle} onPress={onShare}>
            <Ionicons name="share-social-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={() => setIsLiked(!isLiked)}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={22}
              color={isLiked ? "#ef4444" : "#fff"}
            />
          </TouchableOpacity>
        </View>

        {/* Status Badge */}
        <View style={styles.statusOverlay}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(project.sale_status) },
            ]}
          >
            <Text style={styles.statusText}>{project.sale_status}</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Price - Large and prominent */}
        <Text style={styles.mainPrice}>
          {formatPrice(project.min_price_aed)}
        </Text>

        {/* Location */}
        {/* <Text style={styles.locationText}>
          {project.name}, {project.area}, {project.country}
        </Text> */}

        {/* Features Row */}
        <View style={styles.featuresRow}>
          <View style={styles.featureItem}>
            <Ionicons name="bed-outline" size={18} color="#6366f1" />
            <Text style={styles.featureText}>3 Beds</Text>
          </View>
          <View style={styles.featureDot} />
          <View style={styles.featureItem}>
            <Ionicons name="water-outline" size={18} color="#6366f1" />
            <Text style={styles.featureText}>4 Baths</Text>
          </View>
          <View style={styles.featureDot} />
          <View style={styles.featureItem}>
            <Ionicons name="resize-outline" size={18} color="#6366f1" />
            <Text style={styles.featureText}>
              Built-up:{" "}
              {formatArea(
                project.min_area || project.max_size,
                project.area_unit || "sqft",
              )}
            </Text>
          </View>
        </View>

        {/* Tagline */}
        {project.tagline && (
          <View style={styles.taglineContainer}>
            <Text style={styles.taglineText}>{project.tagline}</Text>
          </View>
        )}

        {/* Overview Section */}
        {project.overview && (
          <View style={styles.section}>
            <Text
              style={styles.overviewText}
              numberOfLines={showFullOverview ? undefined : 4}
            >
              {project.overview.replace(/#####/g, "").replace(/\n/g, " ")}
            </Text>
            {project.overview.length > 200 && (
              <TouchableOpacity
                onPress={() => setShowFullOverview(!showFullOverview)}
                style={styles.readMoreButton}
              >
                <Text style={styles.readMoreText}>
                  {showFullOverview ? "Read Less ▲" : "Read More ▼"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Property Information Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>
              {project.property_type || "Townhouse"}
            </Text>
            <Text style={styles.infoLabel}>Furnishing</Text>
            <Text style={styles.infoValue}>
              {project.furnishing || "Unfurnished"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Purpose</Text>
            <Text style={styles.infoValue}>For Sale</Text>
            <Text style={styles.infoLabel}>Added on</Text>
            <Text style={styles.infoValue}>
              {project.created_at
                ? new Date(project.created_at).toLocaleDateString()
                : "3 April 2026"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Completion</Text>
            <Text style={styles.infoValue}>
              {project.completion_datetime
                ? new Date(project.completion_datetime).getFullYear() ===
                  new Date().getFullYear() + 3
                  ? "Off-Plan"
                  : "Ready"
                : "Off-Plan"}
            </Text>
            <Text style={styles.infoLabel}>Handover date</Text>
            <Text style={styles.infoValue}>
              {project.completion_datetime
                ? new Date(project.completion_datetime).toLocaleDateString()
                : "Q1 2029"}
            </Text>
          </View>
        </View>

        {/* Quick Stats - Minimal horizontal scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsScroll}
          contentContainerStyle={styles.statsScrollContent}
        >
          <View style={styles.statMinimal}>
            <Text style={styles.statValueMinimal}>
              {project.completion_datetime
                ? new Date(project.completion_datetime).getFullYear()
                : "2024"}
            </Text>
            <Text style={styles.statLabelMinimal}>Completion</Text>
          </View>

          <View style={styles.statMinimal}>
            <Text style={styles.statValueMinimal}>
              {project.readiness || "30.41"}%
            </Text>
            <Text style={styles.statLabelMinimal}>Readiness</Text>
          </View>

          <View style={styles.statMinimal}>
            <Text style={styles.statValueMinimal}>
              {project.furnishing || "Semi-furnished"}
            </Text>
            <Text style={styles.statLabelMinimal}>Furnishing</Text>
          </View>

          <View style={styles.statMinimal}>
            <Text style={styles.statValueMinimal}>
              {project.service_charge || "12-15"} AED/sqft
            </Text>
            <Text style={styles.statLabelMinimal}>Service Charge</Text>
          </View>
        </ScrollView>

        {/* Master Plan Section */}
        {project.master_plan && project.master_plan.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Master Plan</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.masterplanScroll}
            >
              {project.master_plan.map((plan, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImage(plan.url)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: plan.url }}
                    style={styles.masterplanImage}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Gallery Section */}
        {project.interiors && project.interiors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.galleryScroll}
            >
              {project.interiors.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImage(image.url)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: image.url }}
                    style={styles.galleryImage}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Payment Plans */}
        {project.payment_plans && project.payment_plans.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Plans</Text>

            {project.payment_plans.map((plan, index) => {
              // Flatten + sort payments safely
              const payments =
                plan?.Payments?.flat()?.sort((a, b) => a.Order - b.Order) || [];

              return (
                <View key={index} style={styles.paymentPlanContainer}>
                  {/* Header */}
                  <View style={styles.paymentPlanHeader}>
                    <Ionicons
                      name="calendar-clear-outline"
                      size={22}
                      color="#6366f1"
                    />
                    <Text style={styles.paymentPlanTitle}>
                      {plan.Plan_name || "Payment Plan"}
                    </Text>
                  </View>

                  {/* Timeline */}
                  {payments.length > 0 ? (
                    <View style={styles.paymentTimeline}>
                      {payments.map((payment, idx) => (
                        <View key={idx} style={styles.paymentStep}>
                          {/* Left (timeline line) */}
                          <View style={styles.paymentStepLeft}>
                            <View style={styles.paymentStepCircle} />
                            {idx < payments.length - 1 && (
                              <View style={styles.paymentStepLine} />
                            )}
                          </View>

                          {/* Right (content) */}
                          <View style={styles.paymentStepRight}>
                            <Text style={styles.paymentPercentage}>
                              {payment?.Percent_of_payment || "0"}%
                            </Text>
                            <Text style={styles.paymentMilestone}>
                              {payment?.Payment_time || "N/A"}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyPaymentState}>
                      <Text style={styles.emptyPaymentText}>
                        Contact sales team for detailed payment plan
                      </Text>
                    </View>
                  )}

                  {/* Handover Note */}
                  {plan?.months_after_handover > 0 && (
                    <View style={styles.handoverNote}>
                      <Ionicons name="time-outline" size={14} color="#64748b" />
                      <Text style={styles.handoverText}>
                        {plan.months_after_handover} months after handover
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Map View Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          {mapReady && MapView ? (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: mapLatitude,
                  longitude: mapLongitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={true}
                zoomEnabled={true}
              >
                <Marker
                  coordinate={{
                    latitude: mapLatitude,
                    longitude: mapLongitude,
                  }}
                  title={project.name}
                  description={`${project.area}, ${project.country}`}
                />
              </MapView>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.mapContainer}
              onPress={() => {
                const url = `https://www.google.com/maps/search/?api=1&query=${mapLatitude},${mapLongitude}`;
                openUrl(url);
              }}
            >
              <View style={styles.mapPlaceholder}>
                <Ionicons name="map-outline" size={48} color="#6366f1" />
                <Text style={styles.mapPlaceholderText}>
                  Tap to view location
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Nearby Locations */}
        {project.map_points && project.map_points.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nearby Locations</Text>
            <View style={styles.locationsGrid}>
              {project.map_points.map((point, index) => (
                <View key={index} style={styles.locationCard}>
                  <Ionicons name="location-sharp" size={18} color="#6366f1" />
                  <Text style={styles.locationName}>{point.name}</Text>
                  <Text style={styles.distanceText}>
                    {point.distance_km} km
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Amenities */}
        {project.facilities && project.facilities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {project.facilities.map((facility, index) => (
                <View key={index} style={styles.amenityItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                  <Text style={styles.amenityName}>{facility.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {project.video_url && (
            <TouchableOpacity
              style={styles.actionButtonPrimary}
              onPress={() => openUrl(project.video_url!)}
            >
              <Ionicons name="play-circle" size={20} color="#fff" />
              <Text style={styles.actionButtonPrimaryText}>Watch Video</Text>
            </TouchableOpacity>
          )}
          {project.brochure_url && (
            <TouchableOpacity
              style={styles.actionButtonSecondary}
              onPress={() => openUrl(project.brochure_url!)}
            >
              <Ionicons name="document-text" size={20} color="#6366f1" />
              <Text style={styles.actionButtonSecondaryText}>Brochure</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButtonSecondary}
            onPress={onDownloadBrochure}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#3919da" />
            ) : null}
            <Text
              style={[styles.actionButtonSecondaryText, { color: "#3919da" }]}
            >
              {downloading ? "Downloading..." : "Download"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Image Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  titleOverlay: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  overlayTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  overlayLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  overlayLocationText: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
  },
  imageContainer: {
    position: "relative",
    height: 350,
  },
  coverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  backButtonOverlay: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionIconsOverlay: {
    position: "absolute",
    top: 50,
    right: 20,
    flexDirection: "row",
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusOverlay: {
    position: "absolute",
    top: 50,
    left: 80,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  contentContainer: {
    padding: 20,
  },
  mainPrice: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 16,
    lineHeight: 20,
  },
  featuresRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featureText: {
    fontSize: 14,
    color: "#475569",
  },
  featureDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#cbd5e1",
  },
  taglineContainer: {
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  taglineText: {
    fontSize: 13,
    color: "#6366f1",
    fontWeight: "500",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  overviewText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 22,
  },
  readMoreButton: {
    marginTop: 8,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6366f1",
  },
  infoGrid: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748b",
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1e293b",
    flex: 1,
  },
  statsScroll: {
    marginBottom: 24,
  },
  statsScrollContent: {
    gap: 16,
    paddingRight: 20,
  },
  statMinimal: {
    alignItems: "center",
    minWidth: 100,
  },
  statValueMinimal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  statLabelMinimal: {
    fontSize: 12,
    color: "#94a3b8",
  },
  masterplanScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  masterplanImage: {
    width: width - 80,
    height: 180,
    resizeMode: "contain",
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#f1f5f9",
  },
  galleryScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  galleryImage: {
    width: 140,
    height: 100,
    resizeMode: "cover",
    borderRadius: 12,
    marginRight: 12,
  },
  paymentPlanContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  paymentPlanHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  paymentPlanTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  paymentTimeline: {
    padding: 16,
  },
  paymentStep: {
    flexDirection: "row",
    marginBottom: 12,
  },
  paymentStepLeft: {
    width: 24,
    alignItems: "center",
    marginRight: 12,
  },
  paymentStepCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#6366f1",
  },
  paymentStepLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#e2e8f0",
    marginTop: 4,
  },
  paymentStepRight: {
    flex: 1,
    paddingBottom: 8,
  },
  paymentPercentage: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  paymentMilestone: {
    fontSize: 12,
    color: "#64748b",
  },
  emptyPaymentState: {
    padding: 20,
    alignItems: "center",
  },
  emptyPaymentText: {
    fontSize: 14,
    color: "#64748b",
    fontStyle: "italic",
  },
  handoverNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  handoverText: {
    fontSize: 12,
    color: "#64748b",
  },
  mapContainer: {
    borderRadius: 12,
    overflow: "hidden",
    height: 200,
    backgroundColor: "#f1f5f9",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: "#64748b",
  },
  locationsGrid: {
    gap: 12,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  locationName: {
    flex: 1,
    fontSize: 14,
    color: "#1e293b",
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6366f1",
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  amenityName: {
    fontSize: 13,
    color: "#475569",
  },
  actionButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 40,
    marginTop: 8,
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#6366f1",
  },
  actionButtonPrimaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  actionButtonSecondaryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6366f1",
  },
  backButtonError: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#6366f1",
    borderRadius: 12,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: width,
    height: height * 0.7,
  },
});
