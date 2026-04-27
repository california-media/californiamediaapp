// app/property-detail.tsx
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { downloadAsync, cacheDirectory } from "expo-file-system/legacy";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PropertyDetails } from "./types";
import { getAuthToken, getCrmApiUrl, getCrmCookie, getUserId } from "./utils/config";
import { fetchPropertyById } from "./utils/propertiesApi";

const { width } = Dimensions.get("window");

export default function PropertyDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const propertyId = params.propertyId as string;
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const sliderRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadPropertyDetails();
  }, []);

  const loadPropertyDetails = async () => {
    setLoading(true);
    const data = await fetchPropertyById(propertyId);
    setProperty(data);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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

  const formatPrice = (price: string | null) => {
    if (!price) return "Price on request";
    const numPrice = parseFloat(price);
    if (numPrice >= 1000000) {
      return `AED ${(numPrice / 1000000).toFixed(1)}M`;
    }
    return `AED ${numPrice.toLocaleString()}`;
  };

  const formatArea = (area: string | null) => {
    if (!area) return "Size on request";
    const numArea = parseFloat(area);
    if (numArea >= 1000) {
      return `${(numArea / 1000).toFixed(1)}K sqft`;
    }
    return `${numArea.toLocaleString()} sqft`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const stripHtml = (html: string) => {
    return html?.replace(/<[^>]*>/g, "").replace(/^#{1,6}\s*/gm, "") || "";
  };

  const handleAiPresentation = async () => {
    if (!propertyId) return;
    setPdfLoading(true);
    try {
      const url = `${getCrmApiUrl()}/properties/pdf?id=${propertyId}&output_type=I`;
      const fileUri = `${cacheDirectory}property_${propertyId}.pdf`;
      const result = await downloadAsync(url, fileUri, {
        headers: {
          Authorization: getAuthToken(),
          "X-User-Id": getUserId(),
          Cookie: getCrmCookie(),
        },
      });
      if (result.status === 200) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(result.uri, {
            mimeType: "application/pdf",
            dialogTitle: "AI Presentation",
            UTI: "com.adobe.pdf",
          });
        }
      } else {
        Alert.alert("Error", "Could not load the presentation. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Failed to open the presentation.");
    } finally {
      setPdfLoading(false);
    }
  };

  const parseImages = (imageString: string | null): string[] => {
    if (!imageString) return [];
    try {
      const parsed = JSON.parse(imageString);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  const onShare = async () => {
    try {
      await Share.share({
        message: `${property?.project_name}\n${property?.developer}\n${formatPrice(property?.price)}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const allImages = property
    ? [property.thumbnail, ...parseImages(property.architecture_images)]
    : [];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading property details...</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Property not found</Text>
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
      <Stack.Screen options={{ headerShown: false }} />

      {/* Image Slider */}
      <View style={styles.imageContainer}>
        <ScrollView
          ref={sliderRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(idx);
          }}
        >
          {allImages.map((img, i) => (
            <TouchableOpacity key={i} activeOpacity={0.95} onPress={() => setSelectedImage(img)}>
              <Image source={{ uri: img }} style={styles.coverImage} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionCircle} onPress={onShare}>
            <Ionicons name="share-social-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCircle} onPress={() => setIsLiked(!isLiked)}>
            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? "#ef4444" : "#fff"} />
          </TouchableOpacity>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(property.property_status) }]}>
          <Text style={styles.statusText}>{property.property_status}</Text>
        </View>

        {/* Image counter */}
        {allImages.length > 1 && (
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>{currentImageIndex + 1} / {allImages.length}</Text>
          </View>
        )}

        {/* Dot indicators */}
        {allImages.length > 1 && (
          <View style={styles.dotRow}>
            {allImages.map((_, i) => (
              <View key={i} style={[styles.dot, i === currentImageIndex && styles.dotActive]} />
            ))}
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title Section */}
        <Text style={styles.title}>{property.project_name}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color="#94a3b8" />
          <Text style={styles.location}>
            {property.location || property.bayut_location_name || "Dubai"},
            United Arab Emirates
          </Text>
        </View>

        {/* Price */}
        <Text style={styles.price}>{formatPrice(property.price)}</Text>

        {/* Features Row */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="bed-outline" size={18} color="#6366f1" />
            <Text style={styles.featureText}>{property.bedrooms} Beds</Text>
          </View>
          <View style={styles.featureDivider} />
          <View style={styles.feature}>
            <Ionicons name="water-outline" size={18} color="#6366f1" />
            <Text style={styles.featureText}>{property.bathrooms} Baths</Text>
          </View>
          <View style={styles.featureDivider} />
          <View style={styles.feature}>
            <Ionicons name="resize-outline" size={18} color="#6366f1" />
            <Text style={styles.featureText}>{formatArea(property.area)}</Text>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project general facts</Text>
          <Text
            style={styles.description}
            numberOfLines={showFullDescription ? undefined : 4}
          >
            {stripHtml(property.description) || "No description available"}
          </Text>
          {property.description && property.description.length > 200 && (
            <TouchableOpacity
              onPress={() => setShowFullDescription(!showFullDescription)}
            >
              <Text style={styles.readMore}>
                {showFullDescription ? "Read Less ▲" : "Read More ▼"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Property Details Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>
              {property.property_type || "Apartment"}
            </Text>
            <Text style={styles.infoLabel}>Furnishing</Text>
            <Text style={styles.infoValue}>
              {property.furnishing || "Unfurnished"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Purpose</Text>
            <Text style={styles.infoValue}>{property.purpose}</Text>
            <Text style={styles.infoLabel}>Added on</Text>
            <Text style={styles.infoValue}>
              {formatDate(property.dateadded)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Completion</Text>
            <Text style={styles.infoValue}>
              {property.handover_date
                ? new Date(property.handover_date) < new Date()
                  ? "Ready"
                  : "Off-Plan"
                : "Off-Plan"}
            </Text>
            <Text style={styles.infoLabel}>Handover date</Text>
            <Text style={styles.infoValue}>
              {property.handover_date
                ? formatDate(property.handover_date)
                : "Q1 2029"}
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsScroll}
        >
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {property.handover_date
                ? new Date(property.handover_date).getFullYear()
                : "2024"}
            </Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>30.41%</Text>
            <Text style={styles.statLabel}>Readiness</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {property.furnishing || "Semi"}
            </Text>
            <Text style={styles.statLabel}>Furnishing</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12-15</Text>
            <Text style={styles.statLabel}>Service Charge</Text>
          </View>
        </ScrollView>


        {/* Map + Nearby Locations */}
        {(property.latitude || property.near_by_locations) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>

            {property.latitude && property.longitude && (
              <MapView
                provider={PROVIDER_DEFAULT}
                style={styles.map}
                initialRegion={{
                  latitude: parseFloat(property.latitude) || 25.2048,
                  longitude: parseFloat(property.longitude) || 55.2708,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled
                zoomEnabled
              >
                <Marker
                  coordinate={{
                    latitude: parseFloat(property.latitude) || 25.2048,
                    longitude: parseFloat(property.longitude) || 55.2708,
                  }}
                  title={property.project_name}
                  description={property.location || property.bayut_location_name || ""}
                />
              </MapView>
            )}

            {property.near_by_locations && (
              <>
                <Text style={styles.nearbyLabel}>Nearby</Text>
                <View style={styles.amenitiesGrid}>
                  {stripHtml(property.near_by_locations)
                    .split(",")
                    .map((item, index) => (
                      <View key={index} style={styles.amenityTag}>
                        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                        <Text style={styles.amenityText}>{item.trim()}</Text>
                      </View>
                    ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* Developer Info */}
        <View style={styles.developerCard}>
          <Text style={styles.developerLabel}>Developer</Text>
          <Text style={styles.developerName}>{property.developer}</Text>
          <Text style={styles.agentText}>Agent: {property.agent_name}</Text>
        </View>

        {/* AI Presentation Button */}
        <TouchableOpacity
          style={[styles.contactButton, pdfLoading && { opacity: 0.7 }]}
          onPress={handleAiPresentation}
          disabled={pdfLoading}
        >
          {pdfLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="sparkles-outline" size={20} color="#fff" />
          )}
          <Text style={styles.contactButtonText}>
            {pdfLoading ? "Loading…" : "AI Presentation"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Image Modal */}
      <Modal
        visible={!!selectedImage}
        transparent
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
  imageContainer: {
    position: "relative",
    height: 300,
    overflow: "hidden",
  },
  coverImage: {
    width: width,
    height: 300,
    resizeMode: "cover",
  },
  backButton: {
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
  actionButtons: {
    position: "absolute",
    top: 50,
    right: 20,
    flexDirection: "row",
    gap: 12,
  },
  actionCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    position: "absolute",
    bottom: 20,
    left: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  imageCounter: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  imageCounterText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  dotRow: {
    position: "absolute",
    bottom: 14,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  dotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  location: {
    fontSize: 14,
    color: "#64748b",
  },
  price: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 20,
  },
  features: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 20,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featureText: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "500",
  },
  featureDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#cbd5e1",
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
  description: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 22,
    marginBottom: 8,
  },
  readMore: {
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
  statCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginRight: 12,
    minWidth: 100,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  galleryScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  galleryImage: {
    width: 140,
    height: 100,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#f1f5f9",
  },
  map: {
    width: "100%",
    height: 200,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
  },
  nearbyLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  amenityTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  amenityText: {
    fontSize: 13,
    color: "#475569",
  },
  developerCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  developerLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  developerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  agentText: {
    fontSize: 13,
    color: "#6366f1",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6366f1",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 40,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
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
    height: Dimensions.get("window").height * 0.7,
  },
});
