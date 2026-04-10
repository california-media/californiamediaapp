// import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Dimensions,
//   Image,
//   Linking,
//   Modal,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { ProjectDetails } from "./types";
// import { fetchProjectById } from "./utils/projectsApi";

// const { width, height } = Dimensions.get("window");

// export default function ProjectDetailScreen() {
//   const router = useRouter();
//   const params = useLocalSearchParams();
//   const projectId = parseInt(params.projectId as string);
//   const [project, setProject] = useState<ProjectDetails | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [selectedImage, setSelectedImage] = useState<string | null>(null);
//   const [mapReady, setMapReady] = useState(false);

//   const { width } = Dimensions.get("window");

//   // Dynamically import MapView to avoid build errors if not installed
//   let MapView: any = null;
//   let Marker: any = null;
//   try {
//     // This will only work if react-native-maps is properly installed
//     const Maps = require("react-native-maps");
//     MapView = Maps.default;
//     Marker = Maps.Marker;
//   } catch (error) {
//     console.log("react-native-maps not available, using fallback");
//   }

//   useEffect(() => {
//     loadProjectDetails();
//     // Check if MapView is available
//     setMapReady(!!MapView);
//   }, []);
//   // useEffect(() => {
//   //   loadProjectDetails();
//   // }, []);

//   const loadProjectDetails = async () => {
//     setLoading(true);
//     const data = await fetchProjectById(projectId);
//     setProject(data);
//     setLoading(false);
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

//   const formatPrice = (price: number | null) => {
//     if (!price) return "Price on request";
//     if (price >= 1000000) {
//       return `AED ${(price / 1000000).toFixed(1)}M`;
//     }
//     return `AED ${price.toLocaleString()}`;
//   };

//   const formatArea = (area: number | null, unit: string) => {
//     if (!area) return "Size on request";
//     if (area >= 1000) {
//       return `${(area / 1000).toFixed(1)}K ${unit}`;
//     }
//     return `${area.toLocaleString()} ${unit}`;
//   };

//   // Extract unique bedroom and bathroom options
//   const bedroomSet = new Set<string>();
//   const bathroomSet = new Set<string>();
//   project?.parkings?.forEach((parking) => {
//     parking.Unit_bedrooms?.forEach((bed: string) => bedroomSet.add(bed));
//     parking.Unit_bathrooms?.forEach((bath: string) => bathroomSet.add(bath));
//   });
//   const bedrooms = Array.from(bedroomSet).sort();
//   const bathrooms = Array.from(bathroomSet).sort();

//   const coordinateString = project?.coordinates;

//   // Default fallback (Dubai)
//   let mapLatitude = 25.2048;
//   let mapLongitude = 55.2708;

//   if (coordinateString) {
//     const [lat, lng] = coordinateString
//       .split(",")
//       .map((val) => parseFloat(val.trim()));

//     if (!isNaN(lat) && !isNaN(lng)) {
//       mapLatitude = lat;
//       mapLongitude = lng;
//     }
//   }
//   const mapStaticUrl = `https://maps.geoapify.com/v1/staticmap?style=osm-carto&width=600&height=400&center=lonlat:${mapLongitude},${mapLatitude}&zoom=14&apiKey=YOUR_API_KEY`;
//   // Get map coordinates
//   // const mapLatitude = project?.map_points?.[0]?.latitude ?? 25.2048;
//   // const mapLongitude = project?.map_points?.[0]?.longitude ?? 55.2708;
//   // const mapStaticUrl = `https://maps.geoapify.com/v1/staticmap?style=osm-carto&width=600&height=400&center=lonlat:${mapLongitude},${mapLatitude}&zoom=14&apiKey=YOUR_API_KEY`;

//   const openUrl = (url: string) => {
//     if (url) Linking.openURL(url);
//   };

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#6366f1" />
//         <Text style={styles.loadingText}>Loading project details...</Text>
//       </View>
//     );
//   }

//   if (!project) {
//     return (
//       <View style={styles.center}>
//         <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
//         <Text style={styles.errorText}>Project not found</Text>
//         <TouchableOpacity
//           style={styles.backButtonError}
//           onPress={() => router.back()}
//         >
//           <Text style={styles.backButtonText}>Go Back</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       {/* Header Image with Gradient Overlay */}
//       <View style={styles.imageContainer}>
//         <Image
//           source={{ uri: project.s3_cover_url || project.cover_image_url?.url }}
//           style={styles.coverImage}
//         />
//         <LinearGradient
//           colors={["transparent", "rgba(0,0,0,0.8)"]}
//           style={styles.gradientOverlay}
//         />
//         <TouchableOpacity
//           style={styles.backButtonOverlay}
//           onPress={() => router.back()}
//         >
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <View style={styles.statusOverlay}>
//           <View
//             style={[
//               styles.statusBadge,
//               { backgroundColor: getStatusColor(project.sale_status) },
//             ]}
//           >
//             <Text style={styles.statusText}>{project.sale_status}</Text>
//           </View>
//         </View>

//         {/* Project Title Overlay */}
//         <View style={styles.titleOverlay}>
//           <Text style={styles.overlayTitle}>{project.name}</Text>
//           <View style={styles.overlayLocation}>
//             <Ionicons name="location-outline" size={16} color="#fff" />
//             <Text style={styles.overlayLocationText}>
//               {project.area}, {project.country}
//             </Text>
//           </View>
//         </View>
//       </View>

//       {/* Content */}
//       <View style={styles.contentContainer}>
//         {/* Developer Section */}
//         <View style={styles.developerSection}>
//           {project.developer_data?.logo_image?.[0] && (
//             <Image
//               source={{ uri: project.developer_data.logo_image[0].url }}
//               style={styles.developerLogoLarge}
//             />
//           )}
//           <View style={styles.developerInfo}>
//             <Text style={styles.developerLabel}>Developed by</Text>
//             <Text style={styles.developerName}>{project.developer}</Text>
//           </View>
//           {project.developer_data?.website && (
//             <TouchableOpacity
//               style={styles.websiteButton}
//               // onPress={() => openUrl(project.developer_data.website)}
//             >
//               <Ionicons name="open-outline" size={18} color="#6366f1" />
//             </TouchableOpacity>
//           )}
//         </View>

//         {/* Key Metrics - Modern Card Design */}
//         <View style={styles.metricsContainer}>
//           <View style={styles.metricCard}>
//             <View style={styles.metricIconBg}>
//               <Ionicons name="cash-outline" size={24} color="#6366f1" />
//             </View>
//             <Text style={styles.metricLabel}>Starting Price</Text>
//             <Text style={styles.metricValue}>
//               {formatPrice(project.min_price_aed)}
//             </Text>
//           </View>

//           <View style={styles.metricDivider} />

//           <View style={styles.metricCard}>
//             <View style={styles.metricIconBg}>
//               <Ionicons name="resize-outline" size={24} color="#6366f1" />
//             </View>
//             <Text style={styles.metricLabel}>Property Size</Text>
//             <Text style={styles.metricValue}>
//               {formatArea(
//                 project.min_area || project.max_size,
//                 project.area_unit || "sqft",
//               )}
//             </Text>
//           </View>
//         </View>

//         {/* Quick Stats Grid */}
//         <View style={styles.statsGrid}>
//           <View style={styles.statItem}>
//             <Ionicons name="calendar-outline" size={20} color="#6366f1" />
//             <Text style={styles.statLabel}>Completion</Text>
//             <Text style={styles.statValue}>
//               {project.completion_datetime
//                 ? new Date(project.completion_datetime).getFullYear()
//                 : "TBD"}
//             </Text>
//           </View>

//           <View style={styles.statItem}>
//             <Ionicons name="speedometer-outline" size={20} color="#6366f1" />
//             <Text style={styles.statLabel}>Readiness</Text>
//             <Text style={styles.statValue}>{project.readiness || "N/A"}%</Text>
//           </View>

//           <View style={styles.statItem}>
//             <Ionicons name="home-outline" size={20} color="#6366f1" />
//             <Text style={styles.statLabel}>Furnishing</Text>
//             <Text style={styles.statValue}>{project.furnishing || "No"}</Text>
//           </View>

//           <View style={styles.statItem}>
//             <Ionicons name="card-outline" size={20} color="#6366f1" />
//             <Text style={styles.statLabel}>Service Charge</Text>
//             <Text style={styles.statValue}>
//               {project.service_charge || "25"} AED/sqft
//             </Text>
//           </View>
//         </View>

//         {/* Overview Section */}
//         {project.overview && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Overview</Text>
//             <Text style={styles.overviewText}>
//               {project.overview.replace(/#####/g, "").replace(/\n/g, " ")}
//             </Text>
//           </View>
//         )}

//         {/* Master Plan Section */}
//         {project.master_plan && project.master_plan.length > 0 && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Master Plan</Text>
//             <ScrollView
//               horizontal
//               showsHorizontalScrollIndicator={false}
//               style={styles.masterplanScroll}
//             >
//               {project.master_plan.map((plan, index) => (
//                 <TouchableOpacity
//                   key={index}
//                   onPress={() => setSelectedImage(plan.url)}
//                   activeOpacity={0.9}
//                 >
//                   <Image
//                     source={{ uri: plan.url }}
//                     style={styles.masterplanImage}
//                   />
//                 </TouchableOpacity>
//               ))}
//             </ScrollView>
//           </View>
//         )}

//         {/* Gallery Section */}
//         {project.interiors && project.interiors.length > 0 && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Gallery</Text>
//             <ScrollView
//               horizontal
//               showsHorizontalScrollIndicator={false}
//               style={styles.galleryScroll}
//             >
//               {project.interiors.map((image, index) => (
//                 <TouchableOpacity
//                   key={index}
//                   onPress={() => setSelectedImage(image.url)}
//                   activeOpacity={0.9}
//                 >
//                   <Image
//                     source={{ uri: image.url }}
//                     style={styles.galleryImage}
//                   />
//                 </TouchableOpacity>
//               ))}
//             </ScrollView>
//           </View>
//         )}

//         {/* Payment Plans */}
//         {project.payment_plans && project.payment_plans.length > 0 && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Payment Plans</Text>
//             {project.payment_plans.map((plan, index) => (
//               <View key={index} style={styles.paymentCard}>
//                 <View style={styles.paymentHeader}>
//                   <Ionicons
//                     name="calendar-clear-outline"
//                     size={22}
//                     color="#6366f1"
//                   />
//                   <Text style={styles.paymentTitle}>{plan.Plan_name}</Text>
//                 </View>
//                 {plan.Payments && plan.Payments.length > 0 ? (
//                   <View style={styles.paymentProgress}>
//                     {plan.Payments.map((payment, idx) => (
//                       <View key={idx} style={styles.paymentStep}>
//                         <View style={styles.paymentStepDot} />
//                         <View style={styles.paymentStepContent}>
//                           <Text style={styles.paymentPercentage}>
//                             {payment.percentage}%
//                           </Text>
//                           <Text style={styles.paymentMilestone}>
//                             {payment.milestone}
//                           </Text>
//                         </View>
//                       </View>
//                     ))}
//                   </View>
//                 ) : (
//                   <Text style={styles.paymentNote}>
//                     Contact sales team for detailed payment plan
//                   </Text>
//                 )}
//                 {plan.months_after_handover > 0 && (
//                   <View style={styles.paymentFooter}>
//                     <Ionicons name="time-outline" size={16} color="#64748b" />
//                     <Text style={styles.paymentSubtitle}>
//                       {plan.months_after_handover} months after handover
//                     </Text>
//                   </View>
//                 )}
//               </View>
//             ))}
//           </View>
//         )}

//         {/* Nearby Locations */}
//         {project.map_points && project.map_points.length > 0 && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Nearby Locations</Text>
//             <View style={styles.locationsGrid}>
//               {project.map_points.map((point, index) => (
//                 <View key={index} style={styles.locationCard}>
//                   <Ionicons name="location-sharp" size={20} color="#6366f1" />
//                   <Text style={styles.locationName}>{point.name}</Text>
//                   <View style={styles.distanceBadge}>
//                     <Text style={styles.distanceText}>
//                       {point.distance_km} km
//                     </Text>
//                   </View>
//                 </View>
//               ))}
//             </View>
//           </View>
//         )}

//         {/* Map View Section */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Location Map</Text>

//           {mapReady && MapView ? (
//             // Interactive Map if available
//             <View style={styles.mapContainer}>
//               <MapView
//                 style={styles.map}
//                 initialRegion={{
//                   latitude: mapLatitude,
//                   longitude: mapLongitude,
//                   latitudeDelta: 0.01,
//                   longitudeDelta: 0.01,
//                 }}
//                 scrollEnabled={true}
//                 zoomEnabled={true}
//               >
//                 <Marker
//                   coordinate={{
//                     latitude: mapLatitude,
//                     longitude: mapLongitude,
//                   }}
//                   title={project.name}
//                   description={`${project.area}, ${project.country}`}
//                 />
//               </MapView>
//             </View>
//           ) : (
//             // Static Map Fallback
//             <TouchableOpacity
//               style={styles.mapContainer}
//               onPress={() => {
//                 const url = `https://www.google.com/maps/search/?api=1&query=${mapLatitude},${mapLongitude}`;
//                 openUrl(url);
//               }}
//             >
//               <View style={styles.mapPlaceholder}>
//                 <Ionicons name="map-outline" size={48} color="#6366f1" />
//                 <Text style={styles.mapPlaceholderText}>
//                   Tap to view location in Maps
//                 </Text>
//                 <Text style={styles.mapCoordinates}>
//                   {mapLatitude.toFixed(4)}°, {mapLongitude.toFixed(4)}°
//                 </Text>
//               </View>
//             </TouchableOpacity>
//           )}

//           <TouchableOpacity
//             style={styles.mapButton}
//             onPress={() => {
//               const url = `https://www.google.com/maps/search/?api=1&query=${mapLatitude},${mapLongitude}`;
//               openUrl(url);
//             }}
//           >
//             <Ionicons name="navigate-outline" size={18} color="#6366f1" />
//             <Text style={styles.mapButtonText}>Open in Google Maps</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Amenities */}
//         {project.facilities && project.facilities.length > 0 && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Amenities</Text>
//             <View style={styles.amenitiesGrid}>
//               {project.facilities.slice(0, 8).map((facility, index) => (
//                 <View key={index} style={styles.amenityItem}>
//                   {facility.image?.url ? (
//                     <Image
//                       source={{ uri: facility.image.url }}
//                       style={styles.amenityIcon}
//                     />
//                   ) : (
//                     <Ionicons
//                       name="checkmark-circle"
//                       size={24}
//                       color="#10b981"
//                     />
//                   )}
//                   <Text style={styles.amenityName}>{facility.name}</Text>
//                 </View>
//               ))}
//             </View>
//           </View>
//         )}

//         {/* Action Buttons */}
//         <View style={styles.actionButtons}>
//           {project.video_url && (
//             <TouchableOpacity
//               style={styles.actionButtonPrimary}
//               onPress={() => openUrl(project.video_url!)}
//             >
//               <Ionicons name="play-circle" size={20} color="#fff" />
//               <Text style={styles.actionButtonPrimaryText}>Watch Video</Text>
//             </TouchableOpacity>
//           )}
//           {project.brochure_url && (
//             <TouchableOpacity
//               style={styles.actionButtonSecondary}
//               onPress={() => openUrl(project.brochure_url!)}
//             >
//               <Ionicons name="document-text" size={20} color="#6366f1" />
//               <Text style={styles.actionButtonSecondaryText}>Brochure</Text>
//             </TouchableOpacity>
//           )}
//           {project.website && (
//             <TouchableOpacity
//               style={styles.actionButtonSecondary}
//               onPress={() => openUrl(project.website!)}
//             >
//               <Ionicons name="globe" size={20} color="#6366f1" />
//               <Text style={styles.actionButtonSecondaryText}>Website</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//       {/* Image Modal */}
//       <Modal
//         visible={!!selectedImage}
//         transparent={true}
//         animationType="fade"
//         onRequestClose={() => setSelectedImage(null)}
//       >
//         <View style={styles.modalContainer}>
//           <TouchableOpacity
//             style={styles.modalClose}
//             onPress={() => setSelectedImage(null)}
//           >
//             <Ionicons name="close" size={28} color="#fff" />
//           </TouchableOpacity>
//           {selectedImage && (
//             <Image
//               source={{ uri: selectedImage }}
//               style={styles.modalImage}
//               resizeMode="contain"
//             />
//           )}
//         </View>
//       </Modal>
//     </ScrollView>
//   );
// }

// // Note: You'll need to add LinearGradient import:
// // import { LinearGradient } from 'expo-linear-gradient';
// // Run: npx expo install expo-linear-gradient

// const styles = StyleSheet.create({
//   mapContainer: {
//     borderRadius: 20,
//     overflow: "hidden",
//     marginBottom: 12,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   map: {
//     width: "100%",
//     height: 220,
//   },
//   mapPlaceholder: {
//     width: "100%",
//     height: 220,
//     backgroundColor: "#f1f5f9",
//     justifyContent: "center",
//     alignItems: "center",
//     gap: 12,
//   },
//   mapPlaceholderText: {
//     fontSize: 14,
//     color: "#64748b",
//     fontWeight: "500",
//   },
//   mapCoordinates: {
//     fontSize: 12,
//     color: "#94a3b8",
//   },
//   mapButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 8,
//     paddingVertical: 12,
//     borderRadius: 12,
//     backgroundColor: "#f1f5f9",
//     marginTop: 8,
//   },
//   mapButtonText: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: "#6366f1",
//   },
//   mapPoint: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#e2e8f0",
//   },
//   mapPointName: {
//     flex: 1,
//     fontSize: 14,
//     color: "#1e293b",
//     marginLeft: 12,
//   },
//   mapPointDistance: {
//     fontSize: 12,
//     color: "#64748b",
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
//   errorText: {
//     marginTop: 12,
//     fontSize: 16,
//     color: "#64748b",
//   },
//   imageContainer: {
//     position: "relative",
//     height: 400,
//   },
//   coverImage: {
//     width: "100%",
//     height: "100%",
//     resizeMode: "cover",
//   },
//   gradientOverlay: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     height: 150,
//   },
//   backButtonOverlay: {
//     position: "absolute",
//     top: 50,
//     left: 20,
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   statusOverlay: {
//     position: "absolute",
//     top: 50,
//     right: 20,
//   },
//   statusBadge: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//   },
//   statusText: {
//     fontSize: 12,
//     color: "#fff",
//     fontWeight: "600",
//   },
//   titleOverlay: {
//     position: "absolute",
//     bottom: 20,
//     left: 20,
//     right: 20,
//   },
//   overlayTitle: {
//     fontSize: 28,
//     fontWeight: "700",
//     color: "#fff",
//     marginBottom: 8,
//   },
//   overlayLocation: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//   },
//   overlayLocationText: {
//     fontSize: 14,
//     color: "#fff",
//     opacity: 0.9,
//   },
//   contentContainer: {
//     padding: 20,
//     marginTop: -20,
//     backgroundColor: "#f8fafc",
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//   },
//   developerSection: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//     marginBottom: 24,
//     backgroundColor: "#fff",
//     padding: 16,
//     borderRadius: 16,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   developerLogoLarge: {
//     width: 50,
//     height: 50,
//     resizeMode: "contain",
//     borderRadius: 12,
//   },
//   developerInfo: {
//     flex: 1,
//   },
//   developerLabel: {
//     fontSize: 11,
//     color: "#94a3b8",
//     marginBottom: 2,
//   },
//   developerName: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#1e293b",
//   },
//   websiteButton: {
//     padding: 8,
//     backgroundColor: "#eef2ff",
//     borderRadius: 10,
//   },
//   metricsContainer: {
//     flexDirection: "row",
//     backgroundColor: "#fff",
//     borderRadius: 20,
//     marginBottom: 24,
//     padding: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 12,
//     elevation: 5,
//   },
//   metricCard: {
//     flex: 1,
//     alignItems: "center",
//   },
//   metricIconBg: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: "#eef2ff",
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   metricLabel: {
//     fontSize: 12,
//     color: "#64748b",
//     marginBottom: 4,
//   },
//   metricValue: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#1e293b",
//     textAlign: "center",
//   },
//   metricDivider: {
//     width: 1,
//     height: 50,
//     backgroundColor: "#e2e8f0",
//     marginHorizontal: 16,
//   },
//   statsGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 12,
//     marginBottom: 24,
//   },
//   statItem: {
//     flex: 1,
//     minWidth: (width - 52) / 2,
//     backgroundColor: "#fff",
//     padding: 16,
//     borderRadius: 16,
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.04,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: "#94a3b8",
//     marginTop: 8,
//     marginBottom: 4,
//   },
//   statValue: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#1e293b",
//   },
//   section: {
//     marginBottom: 28,
//   },
//   sectionTitle: {
//     fontSize: 22,
//     fontWeight: "700",
//     color: "#1e293b",
//     marginBottom: 16,
//   },
//   overviewText: {
//     fontSize: 15,
//     color: "#475569",
//     lineHeight: 24,
//   },
//   masterplanScroll: {
//     marginHorizontal: -20,
//     paddingHorizontal: 20,
//   },
//   masterplanImage: {
//     width: width - 80,
//     height: 200,
//     resizeMode: "contain",
//     borderRadius: 16,
//     marginRight: 12,
//     backgroundColor: "#f1f5f9",
//   },
//   galleryScroll: {
//     marginHorizontal: -20,
//     paddingHorizontal: 20,
//   },
//   galleryImage: {
//     width: 160,
//     height: 120,
//     resizeMode: "cover",
//     borderRadius: 16,
//     marginRight: 12,
//   },
//   paymentCard: {
//     backgroundColor: "#fff",
//     padding: 20,
//     borderRadius: 20,
//     marginBottom: 12,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.04,
//     shadowRadius: 8,
//     elevation: 2,
//   },
//   paymentHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//     marginBottom: 16,
//   },
//   paymentTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#1e293b",
//   },
//   paymentProgress: {
//     gap: 12,
//   },
//   paymentStep: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//   },
//   paymentStepDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: "#6366f1",
//   },
//   paymentStepContent: {
//     flex: 1,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   paymentPercentage: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#1e293b",
//   },
//   paymentMilestone: {
//     fontSize: 13,
//     color: "#64748b",
//   },
//   paymentFooter: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//     marginTop: 16,
//     paddingTop: 12,
//     borderTopWidth: 1,
//     borderTopColor: "#e2e8f0",
//   },
//   paymentSubtitle: {
//     fontSize: 13,
//     color: "#64748b",
//   },
//   paymentNote: {
//     fontSize: 14,
//     color: "#64748b",
//     fontStyle: "italic",
//   },
//   locationsGrid: {
//     gap: 12,
//   },
//   locationCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     padding: 16,
//     borderRadius: 16,
//     gap: 12,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.04,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   locationName: {
//     flex: 1,
//     fontSize: 15,
//     fontWeight: "500",
//     color: "#1e293b",
//   },
//   distanceBadge: {
//     backgroundColor: "#eef2ff",
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   distanceText: {
//     fontSize: 12,
//     fontWeight: "600",
//     color: "#6366f1",
//   },
//   amenitiesGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 12,
//   },
//   amenityItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     borderRadius: 12,
//     gap: 8,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.04,
//     shadowRadius: 2,
//     elevation: 1,
//   },
//   amenityIcon: {
//     width: 20,
//     height: 20,
//     resizeMode: "contain",
//   },
//   amenityName: {
//     fontSize: 13,
//     color: "#475569",
//   },
//   actionButtons: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 12,
//     marginBottom: 40,
//   },
//   actionButtonPrimary: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 8,
//     paddingVertical: 14,
//     borderRadius: 14,
//     backgroundColor: "#6366f1",
//     shadowColor: "#6366f1",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   actionButtonPrimaryText: {
//     fontSize: 15,
//     fontWeight: "600",
//     color: "#fff",
//   },
//   actionButtonSecondary: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 8,
//     paddingVertical: 14,
//     borderRadius: 14,
//     backgroundColor: "#fff",
//     borderWidth: 1,
//     borderColor: "#6366f1",
//   },
//   actionButtonSecondaryText: {
//     fontSize: 15,
//     fontWeight: "500",
//     color: "#6366f1",
//   },
//   backButtonError: {
//     marginTop: 20,
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     backgroundColor: "#6366f1",
//     borderRadius: 12,
//   },
//   backButtonText: {
//     color: "#fff",
//     fontWeight: "600",
//   },
//   modalContainer: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.95)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   modalClose: {
//     position: "absolute",
//     top: 50,
//     right: 20,
//     zIndex: 1,
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "rgba(255,255,255,0.2)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   modalImage: {
//     width: width,
//     height: height * 0.7,
//   },
// });

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
import { ProjectDetails } from "./types";
import { fetchProjectById } from "./utils/projectsApi";

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
        {/* {project.payment_plans && project.payment_plans.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Plans</Text>
            {project.payment_plans.map((plan, index) => (
              <View key={index} style={styles.paymentPlanContainer}>
                <View style={styles.paymentPlanHeader}>
                  <Ionicons
                    name="calendar-clear-outline"
                    size={22}
                    color="#6366f1"
                  />
                  <Text style={styles.paymentPlanTitle}>{plan.Plan_name}</Text>
                </View>

                {plan.Payments && plan.Payments.length > 0 ? (
                  <View style={styles.paymentTimeline}>
                    {plan.Payments.map((payment, idx) => (
                      <View key={idx} style={styles.paymentStep}>
                        <View style={styles.paymentStepLeft}>
                          <View style={styles.paymentStepCircle} />
                          {idx < plan.Payments.length - 1 && (
                            <View style={styles.paymentStepLine} />
                          )}
                        </View>
                        <View style={styles.paymentStepRight}>
                          <Text style={styles.paymentPercentage}>
                            {payment.percentage}%
                          </Text>
                          <Text style={styles.paymentMilestone}>
                            {payment.milestone}
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

                {plan.months_after_handover > 0 && (
                  <View style={styles.handoverNote}>
                    <Ionicons name="time-outline" size={14} color="#64748b" />
                    <Text style={styles.handoverText}>
                      {plan.months_after_handover} months after handover
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )} */}

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
            // onPress={() => {
            //   const url = `https://wa.me/?text=${encodeURIComponent(`${project.name}\n${formatPrice(project.min_price_aed)}`)}`;
            //   openUrl(url);
            // }}
          >
            {/* <Ionicons name="logo-whatsapp" size={20} color="#25D366" /> */}
            <Text
              style={[styles.actionButtonSecondaryText, { color: "#3919da" }]}
            >
              Download
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
// import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Dimensions,
//   Image,
//   Linking,
//   Modal,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { ProjectDetails } from "./types";
// import { fetchProjectById } from "./utils/projectsApi";

// const { width, height } = Dimensions.get("window");

// export default function ProjectDetailScreen() {
//   const router = useRouter();
//   const params = useLocalSearchParams();
//   const projectId = parseInt(params.projectId as string);
//   const [project, setProject] = useState<ProjectDetails | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [selectedImage, setSelectedImage] = useState<string | null>(null);
//   const [mapReady, setMapReady] = useState(false);
//   const [showFullOverview, setShowFullOverview] = useState(false);

//   // Dynamically import MapView to avoid build errors if not installed
//   let MapView: any = null;
//   let Marker: any = null;
//   try {
//     const Maps = require("react-native-maps");
//     MapView = Maps.default;
//     Marker = Maps.Marker;
//   } catch (error) {
//     console.log("react-native-maps not available, using fallback");
//   }

//   useEffect(() => {
//     loadProjectDetails();
//     setMapReady(!!MapView);
//   }, []);

//   const loadProjectDetails = async () => {
//     setLoading(true);
//     const data = await fetchProjectById(projectId);
//     setProject(data);
//     setLoading(false);
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

//   const formatPrice = (price: number | null) => {
//     if (!price) return "Price on request";
//     if (price >= 1000000) {
//       return `AED ${(price / 1000000).toFixed(1)}M`;
//     }
//     return `AED ${price.toLocaleString()}`;
//   };

//   const formatArea = (area: number | null, unit: string) => {
//     if (!area) return "Size on request";
//     if (area >= 1000) {
//       return `${(area / 1000).toFixed(1)}K ${unit}`;
//     }
//     return `${area.toLocaleString()} ${unit}`;
//   };

//   const coordinateString = project?.coordinates;
//   let mapLatitude = 25.2048;
//   let mapLongitude = 55.2708;

//   if (coordinateString) {
//     const [lat, lng] = coordinateString
//       .split(",")
//       .map((val) => parseFloat(val.trim()));
//     if (!isNaN(lat) && !isNaN(lng)) {
//       mapLatitude = lat;
//       mapLongitude = lng;
//     }
//   }

//   const openUrl = (url: string) => {
//     if (url) Linking.openURL(url);
//   };

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#6366f1" />
//         <Text style={styles.loadingText}>Loading project details...</Text>
//       </View>
//     );
//   }

//   if (!project) {
//     return (
//       <View style={styles.center}>
//         <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
//         <Text style={styles.errorText}>Project not found</Text>
//         <TouchableOpacity
//           style={styles.backButtonError}
//           onPress={() => router.back()}
//         >
//           <Text style={styles.backButtonText}>Go Back</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       {/* Header Image with Gradient Overlay */}
//       <View style={styles.imageContainer}>
//         <Image
//           source={{ uri: project.s3_cover_url || project.cover_image_url?.url }}
//           style={styles.coverImage}
//         />
//         <LinearGradient
//           colors={["transparent", "rgba(0,0,0,0.8)"]}
//           style={styles.gradientOverlay}
//         />
//         <TouchableOpacity
//           style={styles.backButtonOverlay}
//           onPress={() => router.back()}
//         >
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <View style={styles.statusOverlay}>
//           <View
//             style={[
//               styles.statusBadge,
//               { backgroundColor: getStatusColor(project.sale_status) },
//             ]}
//           >
//             <Text style={styles.statusText}>{project.sale_status}</Text>
//           </View>
//         </View>

//         {/* Project Title Overlay */}
//         <View style={styles.titleOverlay}>
//           <Text style={styles.overlayTitle}>{project.name}</Text>
//           <View style={styles.overlayLocation}>
//             <Ionicons name="location-outline" size={16} color="#fff" />
//             <Text style={styles.overlayLocationText}>
//               {project.area}, {project.country}
//             </Text>
//           </View>
//         </View>
//       </View>

//       {/* Content */}
//       <View style={styles.contentContainer}>
//         {/* Developer Section */}
//         <View style={styles.developerSection}>
//           {project.developer_data?.logo_image?.[0] && (
//             <Image
//               source={{ uri: project.developer_data.logo_image[0].url }}
//               style={styles.developerLogoLarge}
//             />
//           )}
//           <View style={styles.developerInfo}>
//             <Text style={styles.developerLabel}>Developed by</Text>
//             <Text style={styles.developerName}>{project.developer}</Text>
//           </View>
//           {project.developer_data?.website && (
//             <TouchableOpacity
//               style={styles.websiteButton}
//               onPress={() => openUrl(project.developer_data.website)}
//             >
//               <Ionicons name="open-outline" size={18} color="#6366f1" />
//             </TouchableOpacity>
//           )}
//         </View>

//         {/* Key Metrics - Clean design without cards */}
//         <View style={styles.metricsRow}>
//           <View style={styles.metricItem}>
//             <View style={styles.metricIconCircle}>
//               <Ionicons name="cash-outline" size={28} color="#6366f1" />
//             </View>
//             <View style={styles.metricContent}>
//               <Text style={styles.metricLabel}>Price</Text>
//               <Text style={styles.metricValue}>
//                 {formatPrice(project.min_price_aed)}
//               </Text>
//             </View>
//           </View>

//           <View style={styles.metricDividerLine} />

//           <View style={styles.metricItem}>
//             <View style={styles.metricIconCircle}>
//               <Ionicons name="resize-outline" size={28} color="#6366f1" />
//             </View>
//             <View style={styles.metricContent}>
//               <Text style={styles.metricLabel}>Size</Text>
//               <Text style={styles.metricValue}>
//                 {formatArea(
//                   project.min_area || project.max_size,
//                   project.area_unit || "sqft",
//                 )}
//               </Text>
//             </View>
//           </View>
//         </View>

//         {/* Property Features Row */}
//         <View style={styles.featuresRow}>
//           <View style={styles.featureItem}>
//             <Ionicons name="bed-outline" size={20} color="#6366f1" />
//             <Text style={styles.featureText}>
//               {project.bedrooms || project.beds || "3"} Beds
//             </Text>
//           </View>
//           <View style={styles.featureDot} />
//           <View style={styles.featureItem}>
//             <Ionicons name="water-outline" size={20} color="#6366f1" />
//             <Text style={styles.featureText}>
//               {project.bathrooms || project.baths || "4"} Baths
//             </Text>
//           </View>
//           <View style={styles.featureDot} />
//           <View style={styles.featureItem}>
//             <Ionicons name="home-outline" size={20} color="#6366f1" />
//             <Text style={styles.featureText}>
//               Built-up:{" "}
//               {formatArea(
//                 project.min_area || project.max_size,
//                 project.area_unit || "sqft",
//               )}
//             </Text>
//           </View>
//         </View>

//         {/* Quick Stats - Minimal Design */}
//         <View style={styles.statsRow}>
//           <View style={styles.statItemMinimal}>
//             <Text style={styles.statValueMinimal}>
//               {project.completion_datetime
//                 ? new Date(project.completion_datetime).getFullYear()
//                 : "TBD"}
//             </Text>
//             <Text style={styles.statLabelMinimal}>Completion</Text>
//           </View>

//           <View style={styles.statItemMinimal}>
//             <Text style={styles.statValueMinimal}>
//               {project.readiness || "56.55"}%
//             </Text>
//             <Text style={styles.statLabelMinimal}>Readiness</Text>
//           </View>

//           <View style={styles.statItemMinimal}>
//             <Text style={styles.statValueMinimal}>
//               {project.furnishing || "No"}
//             </Text>
//             <Text style={styles.statLabelMinimal}>Furnishing</Text>
//           </View>

//           <View style={styles.statItemMinimal}>
//             <Text style={styles.statValueMinimal}>
//               {project.service_charge || "25"}
//             </Text>
//             <Text style={styles.statLabelMinimal}>Service Charge</Text>
//           </View>
//         </View>

//         {/* Tagline / Description */}
//         {project.tagline && (
//           <View style={styles.taglineContainer}>
//             <Text style={styles.taglineText}>{project.tagline}</Text>
//           </View>
//         )}

//         {/* Overview Section - Expandable */}
//         {project.overview && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Overview</Text>
//             <Text
//               style={styles.overviewText}
//               numberOfLines={showFullOverview ? undefined : 5}
//             >
//               {project.overview.replace(/#####/g, "").replace(/\n/g, " ")}
//             </Text>
//             {project.overview.length > 300 && (
//               <TouchableOpacity
//                 onPress={() => setShowFullOverview(!showFullOverview)}
//                 style={styles.readMoreButton}
//               >
//                 <Text style={styles.readMoreText}>
//                   {showFullOverview ? "Show Less" : "Read More"}
//                 </Text>
//                 <Ionicons
//                   name={showFullOverview ? "chevron-up" : "chevron-down"}
//                   size={16}
//                   color="#6366f1"
//                 />
//               </TouchableOpacity>
//             )}
//           </View>
//         )}

//         {/* Master Plan Section */}
//         {project.master_plan && project.master_plan.length > 0 && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Master Plan</Text>
//             <ScrollView
//               horizontal
//               showsHorizontalScrollIndicator={false}
//               style={styles.masterplanScroll}
//             >
//               {project.master_plan.map((plan, index) => (
//                 <TouchableOpacity
//                   key={index}
//                   onPress={() => setSelectedImage(plan.url)}
//                   activeOpacity={0.9}
//                 >
//                   <Image
//                     source={{ uri: plan.url }}
//                     style={styles.masterplanImage}
//                   />
//                 </TouchableOpacity>
//               ))}
//             </ScrollView>
//           </View>
//         )}

//         {/* Gallery Section */}
//         {project.interiors && project.interiors.length > 0 && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Gallery</Text>
//             <ScrollView
//               horizontal
//               showsHorizontalScrollIndicator={false}
//               style={styles.galleryScroll}
//             >
//               {project.interiors.map((image, index) => (
//                 <TouchableOpacity
//                   key={index}
//                   onPress={() => setSelectedImage(image.url)}
//                   activeOpacity={0.9}
//                 >
//                   <Image
//                     source={{ uri: image.url }}
//                     style={styles.galleryImage}
//                   />
//                 </TouchableOpacity>
//               ))}
//             </ScrollView>
//           </View>
//         )}

//         {/* Payment Plans - Improved Design */}
//         {project.payment_plans && project.payment_plans.length > 0 && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Payment Plans</Text>
//             {project.payment_plans.map((plan, index) => (
//               <View key={index} style={styles.paymentPlanContainer}>
//                 <View style={styles.paymentPlanHeader}>
//                   <Ionicons
//                     name="calendar-clear-outline"
//                     size={24}
//                     color="#6366f1"
//                   />
//                   <Text style={styles.paymentPlanTitle}>{plan.Plan_name}</Text>
//                 </View>

//                 {plan.Payments && plan.Payments.length > 0 ? (
//                   <View style={styles.paymentTimeline}>
//                     {plan.Payments.map((payment, idx) => (
//                       <View key={idx} style={styles.paymentStep}>
//                         <View style={styles.paymentStepLeft}>
//                           <View style={styles.paymentStepCircle} />
//                           <View style={styles.paymentStepLine} />
//                         </View>
//                         <View style={styles.paymentStepRight}>
//                           <Text style={styles.paymentPercentage}>
//                             {payment.percentage}%
//                           </Text>
//                           <Text style={styles.paymentMilestone}>
//                             {payment.milestone}
//                           </Text>
//                         </View>
//                       </View>
//                     ))}
//                   </View>
//                 ) : (
//                   <View style={styles.emptyPaymentState}>
//                     <Ionicons
//                       name="document-text-outline"
//                       size={48}
//                       color="#cbd5e1"
//                     />
//                     <Text style={styles.emptyPaymentText}>
//                       Detailed payment plan coming soon
//                     </Text>
//                     <Text style={styles.emptyPaymentSubtext}>
//                       Contact our sales team for more information
//                     </Text>
//                     <TouchableOpacity style={styles.contactButton}>
//                       <Text style={styles.contactButtonText}>
//                         Request Details
//                       </Text>
//                     </TouchableOpacity>
//                   </View>
//                 )}

//                 {plan.months_after_handover > 0 && (
//                   <View style={styles.handoverNote}>
//                     <Ionicons name="time-outline" size={16} color="#64748b" />
//                     <Text style={styles.handoverText}>
//                       {plan.months_after_handover} months after handover
//                     </Text>
//                   </View>
//                 )}
//               </View>
//             ))}
//           </View>
//         )}

//         {/* Map View Section */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Location Map</Text>

//           {mapReady && MapView ? (
//             <View style={styles.mapContainer}>
//               <MapView
//                 style={styles.map}
//                 initialRegion={{
//                   latitude: mapLatitude,
//                   longitude: mapLongitude,
//                   latitudeDelta: 0.01,
//                   longitudeDelta: 0.01,
//                 }}
//                 scrollEnabled={true}
//                 zoomEnabled={true}
//               >
//                 <Marker
//                   coordinate={{
//                     latitude: mapLatitude,
//                     longitude: mapLongitude,
//                   }}
//                   title={project.name}
//                   description={`${project.area}, ${project.country}`}
//                 />
//               </MapView>
//             </View>
//           ) : (
//             <TouchableOpacity
//               style={styles.mapContainer}
//               onPress={() => {
//                 const url = `https://www.google.com/maps/search/?api=1&query=${mapLatitude},${mapLongitude}`;
//                 openUrl(url);
//               }}
//             >
//               <View style={styles.mapPlaceholder}>
//                 <Ionicons name="map-outline" size={48} color="#6366f1" />
//                 <Text style={styles.mapPlaceholderText}>
//                   Tap to view location in Maps
//                 </Text>
//                 <Text style={styles.mapCoordinates}>
//                   {mapLatitude.toFixed(4)}°, {mapLongitude.toFixed(4)}°
//                 </Text>
//               </View>
//             </TouchableOpacity>
//           )}

//           <TouchableOpacity
//             style={styles.mapButton}
//             onPress={() => {
//               const url = `https://www.google.com/maps/search/?api=1&query=${mapLatitude},${mapLongitude}`;
//               openUrl(url);
//             }}
//           >
//             <Ionicons name="navigate-outline" size={18} color="#6366f1" />
//             <Text style={styles.mapButtonText}>Open in Google Maps</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Nearby Locations */}
//         {project.map_points && project.map_points.length > 0 && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Nearby Locations</Text>
//             <View style={styles.locationsGrid}>
//               {project.map_points.map((point, index) => (
//                 <View key={index} style={styles.locationCard}>
//                   <Ionicons name="location-sharp" size={20} color="#6366f1" />
//                   <Text style={styles.locationName}>{point.name}</Text>
//                   <View style={styles.distanceBadge}>
//                     <Text style={styles.distanceText}>
//                       {point.distance_km} km
//                     </Text>
//                   </View>
//                 </View>
//               ))}
//             </View>
//           </View>
//         )}

//         {/* Amenities */}
//         {project.facilities && project.facilities.length > 0 && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Amenities</Text>
//             <View style={styles.amenitiesGrid}>
//               {project.facilities.map((facility, index) => (
//                 <View key={index} style={styles.amenityItem}>
//                   {facility.image?.url ? (
//                     <Image
//                       source={{ uri: facility.image.url }}
//                       style={styles.amenityIcon}
//                     />
//                   ) : (
//                     <Ionicons
//                       name="checkmark-circle"
//                       size={22}
//                       color="#10b981"
//                     />
//                   )}
//                   <Text style={styles.amenityName}>{facility.name}</Text>
//                 </View>
//               ))}
//             </View>
//           </View>
//         )}

//         {/* Action Buttons */}
//         <View style={styles.actionButtons}>
//           {project.video_url && (
//             <TouchableOpacity
//               style={styles.actionButtonPrimary}
//               onPress={() => openUrl(project.video_url!)}
//             >
//               <Ionicons name="play-circle" size={20} color="#fff" />
//               <Text style={styles.actionButtonPrimaryText}>Watch Video</Text>
//             </TouchableOpacity>
//           )}
//           {project.brochure_url && (
//             <TouchableOpacity
//               style={styles.actionButtonSecondary}
//               onPress={() => openUrl(project.brochure_url!)}
//             >
//               <Ionicons name="document-text" size={20} color="#6366f1" />
//               <Text style={styles.actionButtonSecondaryText}>Brochure</Text>
//             </TouchableOpacity>
//           )}
//           {project.website && (
//             <TouchableOpacity
//               style={styles.actionButtonSecondary}
//               onPress={() => openUrl(project.website!)}
//             >
//               <Ionicons name="globe" size={20} color="#6366f1" />
//               <Text style={styles.actionButtonSecondaryText}>Website</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//       {/* Image Modal */}
//       <Modal
//         visible={!!selectedImage}
//         transparent={true}
//         animationType="fade"
//         onRequestClose={() => setSelectedImage(null)}
//       >
//         <View style={styles.modalContainer}>
//           <TouchableOpacity
//             style={styles.modalClose}
//             onPress={() => setSelectedImage(null)}
//           >
//             <Ionicons name="close" size={28} color="#fff" />
//           </TouchableOpacity>
//           {selectedImage && (
//             <Image
//               source={{ uri: selectedImage }}
//               style={styles.modalImage}
//               resizeMode="contain"
//             />
//           )}
//         </View>
//       </Modal>
//     </ScrollView>
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
//   errorText: {
//     marginTop: 12,
//     fontSize: 16,
//     color: "#64748b",
//   },
//   imageContainer: {
//     position: "relative",
//     height: 400,
//   },
//   coverImage: {
//     width: "100%",
//     height: "100%",
//     resizeMode: "cover",
//   },
//   gradientOverlay: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     height: 150,
//   },
//   backButtonOverlay: {
//     position: "absolute",
//     top: 50,
//     left: 20,
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   statusOverlay: {
//     position: "absolute",
//     top: 50,
//     right: 20,
//   },
//   statusBadge: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//   },
//   statusText: {
//     fontSize: 12,
//     color: "#fff",
//     fontWeight: "600",
//   },
//   titleOverlay: {
//     position: "absolute",
//     bottom: 20,
//     left: 20,
//     right: 20,
//   },
//   overlayTitle: {
//     fontSize: 28,
//     fontWeight: "700",
//     color: "#fff",
//     marginBottom: 8,
//   },
//   overlayLocation: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//   },
//   overlayLocationText: {
//     fontSize: 14,
//     color: "#fff",
//     opacity: 0.9,
//   },
//   contentContainer: {
//     padding: 20,
//     marginTop: -20,
//     backgroundColor: "#f8fafc",
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//   },
//   developerSection: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//     marginBottom: 24,
//     backgroundColor: "#fff",
//     padding: 16,
//     borderRadius: 16,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   developerLogoLarge: {
//     width: 50,
//     height: 50,
//     resizeMode: "contain",
//     borderRadius: 12,
//   },
//   developerInfo: {
//     flex: 1,
//   },
//   developerLabel: {
//     fontSize: 11,
//     color: "#94a3b8",
//     marginBottom: 2,
//   },
//   developerName: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#1e293b",
//   },
//   websiteButton: {
//     padding: 8,
//     backgroundColor: "#eef2ff",
//     borderRadius: 10,
//   },
//   // New clean metrics design without cards
//   metricsRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     borderRadius: 20,
//     padding: 20,
//     marginBottom: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 10,
//     elevation: 3,
//   },
//   metricItem: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//   },
//   metricIconCircle: {
//     width: 52,
//     height: 52,
//     borderRadius: 26,
//     backgroundColor: "#eef2ff",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   metricContent: {
//     flex: 1,
//   },
//   metricLabel: {
//     fontSize: 12,
//     color: "#94a3b8",
//     marginBottom: 4,
//   },
//   metricValue: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#1e293b",
//   },
//   metricDividerLine: {
//     width: 1,
//     height: 40,
//     backgroundColor: "#e2e8f0",
//     marginHorizontal: 16,
//   },
//   featuresRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     backgroundColor: "#fff",
//     padding: 16,
//     borderRadius: 16,
//     marginBottom: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   featureItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//   },
//   featureText: {
//     fontSize: 13,
//     fontWeight: "500",
//     color: "#475569",
//   },
//   featureDot: {
//     width: 4,
//     height: 4,
//     borderRadius: 2,
//     backgroundColor: "#cbd5e1",
//   },
//   statsRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 20,
//     gap: 12,
//   },
//   statItemMinimal: {
//     flex: 1,
//     alignItems: "center",
//     backgroundColor: "#fff",
//     padding: 12,
//     borderRadius: 12,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   statValueMinimal: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#1e293b",
//     marginBottom: 4,
//   },
//   statLabelMinimal: {
//     fontSize: 11,
//     color: "#94a3b8",
//   },
//   taglineContainer: {
//     backgroundColor: "#eef2ff",
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 24,
//   },
//   taglineText: {
//     fontSize: 14,
//     color: "#6366f1",
//     fontWeight: "500",
//     textAlign: "center",
//   },
//   section: {
//     marginBottom: 28,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: "#1e293b",
//     marginBottom: 16,
//   },
//   overviewText: {
//     fontSize: 15,
//     color: "#475569",
//     lineHeight: 24,
//   },
//   readMoreButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 6,
//     marginTop: 12,
//     paddingVertical: 8,
//   },
//   readMoreText: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: "#6366f1",
//   },
//   masterplanScroll: {
//     marginHorizontal: -20,
//     paddingHorizontal: 20,
//   },
//   masterplanImage: {
//     width: width - 80,
//     height: 200,
//     resizeMode: "contain",
//     borderRadius: 16,
//     marginRight: 12,
//     backgroundColor: "#f1f5f9",
//   },
//   galleryScroll: {
//     marginHorizontal: -20,
//     paddingHorizontal: 20,
//   },
//   galleryImage: {
//     width: 160,
//     height: 120,
//     resizeMode: "cover",
//     borderRadius: 16,
//     marginRight: 12,
//   },
//   // Improved Payment Plans
//   paymentPlanContainer: {
//     backgroundColor: "#fff",
//     borderRadius: 20,
//     marginBottom: 16,
//     overflow: "hidden",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   paymentPlanHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//     padding: 20,
//     backgroundColor: "#f8fafc",
//     borderBottomWidth: 1,
//     borderBottomColor: "#e2e8f0",
//   },
//   paymentPlanTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#1e293b",
//   },
//   paymentTimeline: {
//     padding: 20,
//   },
//   paymentStep: {
//     flexDirection: "row",
//     marginBottom: 16,
//   },
//   paymentStepLeft: {
//     width: 30,
//     alignItems: "center",
//     marginRight: 12,
//   },
//   paymentStepCircle: {
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     backgroundColor: "#6366f1",
//     borderWidth: 3,
//     borderColor: "#eef2ff",
//   },
//   paymentStepLine: {
//     width: 2,
//     flex: 1,
//     backgroundColor: "#e2e8f0",
//     marginTop: 4,
//   },
//   paymentStepRight: {
//     flex: 1,
//     paddingBottom: 16,
//   },
//   paymentPercentage: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#1e293b",
//     marginBottom: 4,
//   },
//   paymentMilestone: {
//     fontSize: 13,
//     color: "#64748b",
//   },
//   emptyPaymentState: {
//     alignItems: "center",
//     padding: 32,
//   },
//   emptyPaymentText: {
//     fontSize: 16,
//     fontWeight: "500",
//     color: "#64748b",
//     marginTop: 12,
//     marginBottom: 4,
//   },
//   emptyPaymentSubtext: {
//     fontSize: 13,
//     color: "#94a3b8",
//     marginBottom: 16,
//   },
//   contactButton: {
//     backgroundColor: "#6366f1",
//     paddingHorizontal: 24,
//     paddingVertical: 10,
//     borderRadius: 20,
//   },
//   contactButtonText: {
//     color: "#fff",
//     fontWeight: "500",
//     fontSize: 14,
//   },
//   handoverNote: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     padding: 16,
//     backgroundColor: "#f1f5f9",
//     borderTopWidth: 1,
//     borderTopColor: "#e2e8f0",
//   },
//   handoverText: {
//     fontSize: 13,
//     color: "#64748b",
//   },
//   // Map styles
//   mapContainer: {
//     borderRadius: 20,
//     overflow: "hidden",
//     marginBottom: 12,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   map: {
//     width: "100%",
//     height: 220,
//   },
//   mapPlaceholder: {
//     width: "100%",
//     height: 220,
//     backgroundColor: "#f1f5f9",
//     justifyContent: "center",
//     alignItems: "center",
//     gap: 12,
//   },
//   mapPlaceholderText: {
//     fontSize: 14,
//     color: "#64748b",
//     fontWeight: "500",
//   },
//   mapCoordinates: {
//     fontSize: 12,
//     color: "#94a3b8",
//   },
//   mapButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 8,
//     paddingVertical: 12,
//     borderRadius: 12,
//     backgroundColor: "#f1f5f9",
//     marginTop: 8,
//   },
//   mapButtonText: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: "#6366f1",
//   },
//   locationsGrid: {
//     gap: 12,
//   },
//   locationCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     padding: 16,
//     borderRadius: 16,
//     gap: 12,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.04,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   locationName: {
//     flex: 1,
//     fontSize: 15,
//     fontWeight: "500",
//     color: "#1e293b",
//   },
//   distanceBadge: {
//     backgroundColor: "#eef2ff",
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   distanceText: {
//     fontSize: 12,
//     fontWeight: "600",
//     color: "#6366f1",
//   },
//   amenitiesGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 10,
//   },
//   amenityItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     paddingHorizontal: 14,
//     paddingVertical: 8,
//     borderRadius: 12,
//     gap: 8,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.04,
//     shadowRadius: 2,
//     elevation: 1,
//   },
//   amenityIcon: {
//     width: 20,
//     height: 20,
//     resizeMode: "contain",
//   },
//   amenityName: {
//     fontSize: 13,
//     color: "#475569",
//   },
//   actionButtons: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 12,
//     marginBottom: 40,
//   },
//   actionButtonPrimary: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 8,
//     paddingVertical: 14,
//     borderRadius: 14,
//     backgroundColor: "#6366f1",
//     shadowColor: "#6366f1",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   actionButtonPrimaryText: {
//     fontSize: 15,
//     fontWeight: "600",
//     color: "#fff",
//   },
//   actionButtonSecondary: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 8,
//     paddingVertical: 14,
//     borderRadius: 14,
//     backgroundColor: "#fff",
//     borderWidth: 1,
//     borderColor: "#6366f1",
//   },
//   actionButtonSecondaryText: {
//     fontSize: 15,
//     fontWeight: "500",
//     color: "#6366f1",
//   },
//   backButtonError: {
//     marginTop: 20,
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     backgroundColor: "#6366f1",
//     borderRadius: 12,
//   },
//   backButtonText: {
//     color: "#fff",
//     fontWeight: "600",
//   },
//   modalContainer: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.95)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   modalClose: {
//     position: "absolute",
//     top: 50,
//     right: 20,
//     zIndex: 1,
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "rgba(255,255,255,0.2)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   modalImage: {
//     width: width,
//     height: height * 0.7,
//   },
// });
