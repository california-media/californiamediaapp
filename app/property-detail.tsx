// // app/property-detail.tsx
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
//   Share,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { PropertyDetails } from "./types";

// const { width, height } = Dimensions.get("window");

// // API configuration
// const API_BASE_URL = "https://crm.mydesk.ae/api";
// const AUTH_TOKEN =
//   "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoibXlfZGVza191c2VyIiwibmFtZSI6Im15X2Rlc2tfdXNlciIsIkFQSV9USU1FIjoxNzc0MzQ1NTU2fQ.DF6on-w_MWS_qli_ejlRl1LEg1_qCw28NT6VinXfkNs";

// // Function to fetch property details
// const fetchPropertyById = async (
//   propertyId: string,
// ): Promise<PropertyDetails | null> => {
//   try {
//     const url = `${API_BASE_URL}/properties/${propertyId}`;
//     console.log("Fetching property details from:", url);

//     const response = await fetch(url, {
//       method: "GET",
//       headers: {
//         Authorization: AUTH_TOKEN,
//         Accept: "application/json",
//         "Content-Type": "application/json",
//       },
//     });

//     if (!response.ok) {
//       throw new Error(
//         `Failed to fetch property details, status: ${response.status}`,
//       );
//     }

//     const data = await response.json();
//     return data;
//   } catch (error) {
//     console.error("Error fetching property details:", error);
//     return null;
//   }
// };

// export default function PropertyDetailScreen() {
//   const router = useRouter();
//   const params = useLocalSearchParams();
//   const propertyId = params.propertyId as string;
//   const [property, setProperty] = useState<PropertyDetails | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [selectedImage, setSelectedImage] = useState<string | null>(null);
//   const [showFullDescription, setShowFullDescription] = useState(false);
//   const [isLiked, setIsLiked] = useState(false);

//   useEffect(() => {
//     loadPropertyDetails();
//   }, []);

//   const loadPropertyDetails = async () => {
//     setLoading(true);
//     const data = await fetchPropertyById(propertyId);
//     setProperty(data);
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
//       case "available":
//         return "#10b981";
//       case "sold":
//         return "#ef4444";
//       case "reserved":
//         return "#f59e0b";
//       default:
//         return "#6366f1";
//     }
//   };

//   const formatPrice = (price: string | null) => {
//     if (!price) return "Price on request";
//     const numPrice = parseFloat(price);
//     if (numPrice >= 1000000) {
//       return `AED ${(numPrice / 1000000).toFixed(1)}M`;
//     }
//     return `AED ${numPrice.toLocaleString()}`;
//   };

//   const formatArea = (area: string | null) => {
//     if (!area) return "Size on request";
//     const numArea = parseFloat(area);
//     if (numArea >= 1000) {
//       return `${(numArea / 1000).toFixed(1)}K sqft`;
//     }
//     return `${numArea.toLocaleString()} sqft`;
//   };

//   const formatDate = (dateString: string | null) => {
//     if (!dateString) return "Not specified";
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     });
//   };

//   const parseImages = (imageString: string | null): string[] => {
//     if (!imageString) return [];
//     try {
//       const parsed = JSON.parse(imageString);
//       return Array.isArray(parsed) ? parsed : [];
//     } catch {
//       return [];
//     }
//   };

//   const onShare = async () => {
//     try {
//       await Share.share({
//         message: `${property?.project_name}\n${property?.developer}\n${formatPrice(property?.price)}`,
//         url: property?.thumbnail,
//       });
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   const openUrl = (url: string) => {
//     if (url) Linking.openURL(url);
//   };

//   const makePhoneCall = (phoneNumber: string) => {
//     if (phoneNumber) {
//       Linking.openURL(`tel:${phoneNumber}`);
//     }
//   };

//   const sendEmail = (email: string) => {
//     if (email) {
//       Linking.openURL(`mailto:${email}`);
//     }
//   };

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#6366f1" />
//         <Text style={styles.loadingText}>Loading property details...</Text>
//       </View>
//     );
//   }

//   if (!property) {
//     return (
//       <View style={styles.center}>
//         <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
//         <Text style={styles.errorText}>Property not found</Text>
//         <TouchableOpacity
//           style={styles.backButtonError}
//           onPress={() => router.back()}
//         >
//           <Text style={styles.backButtonText}>Go Back</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   // Parse images
//   const architectureImages = parseImages(property.architecture_images);
//   const allImages = [property.thumbnail, ...architectureImages].filter(Boolean);

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       {/* Header Image with Gradient Overlay */}
//       <View style={styles.imageContainer}>
//         <Image
//           source={{ uri: property.thumbnail }}
//           style={styles.coverImage}
//           // defaultSource={require("./assets/placeholder.png")}
//         />
//         <LinearGradient
//           colors={["transparent", "rgba(0,0,0,0.7)"]}
//           style={styles.gradientOverlay}
//         />

//         {/* Back Button */}
//         <TouchableOpacity
//           style={styles.backButtonOverlay}
//           onPress={() => router.back()}
//         >
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>

//         {/* Share and Like Icons */}
//         <View style={styles.actionIconsOverlay}>
//           <TouchableOpacity style={styles.iconCircle} onPress={onShare}>
//             <Ionicons name="share-social-outline" size={22} color="#fff" />
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={styles.iconCircle}
//             onPress={() => setIsLiked(!isLiked)}
//           >
//             <Ionicons
//               name={isLiked ? "heart" : "heart-outline"}
//               size={22}
//               color={isLiked ? "#ef4444" : "#fff"}
//             />
//           </TouchableOpacity>
//         </View>

//         {/* Title Overlay */}
//         <View style={styles.titleOverlay}>
//           <Text style={styles.overlayTitle}>{property.project_name}</Text>
//           <View style={styles.overlayLocation}>
//             <Ionicons name="location-outline" size={16} color="#fff" />
//             <Text style={styles.overlayLocationText}>
//               {property.location || property.bayut_location_name || "Dubai"}
//             </Text>
//           </View>
//         </View>

//         {/* Status Badge */}
//         <View style={styles.statusOverlay}>
//           <View
//             style={[
//               styles.statusBadge,
//               { backgroundColor: getStatusColor(property.property_status) },
//             ]}
//           >
//             <Text style={styles.statusText}>{property.property_status}</Text>
//           </View>
//         </View>
//       </View>

//       {/* Content */}
//       <View style={styles.contentContainer}>
//         {/* Price - Large and prominent */}
//         <Text style={styles.mainPrice}>{formatPrice(property.price)}</Text>

//         {/* Features Row */}
//         <View style={styles.featuresRow}>
//           <View style={styles.featureItem}>
//             <Ionicons name="bed-outline" size={20} color="#6366f1" />
//             <Text style={styles.featureText}>{property.bedrooms} Beds</Text>
//           </View>
//           <View style={styles.featureDot} />
//           <View style={styles.featureItem}>
//             <Ionicons name="water-outline" size={20} color="#6366f1" />
//             <Text style={styles.featureText}>{property.bathrooms} Baths</Text>
//           </View>
//           <View style={styles.featureDot} />
//           <View style={styles.featureItem}>
//             <Ionicons name="resize-outline" size={20} color="#6366f1" />
//             <Text style={styles.featureText}>{formatArea(property.area)}</Text>
//           </View>
//         </View>

//         {/* Developer Info */}
//         <View style={styles.developerCard}>
//           <View style={styles.developerHeader}>
//             <Ionicons name="business-outline" size={24} color="#6366f1" />
//             <Text style={styles.developerTitle}>Developer</Text>
//           </View>
//           <Text style={styles.developerName}>{property.developer}</Text>
//           <Text style={styles.agentName}>Agent: {property.agent_name}</Text>
//         </View>

//         {/* Description Section */}
//         {property.description && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Description</Text>
//             <Text
//               style={styles.descriptionText}
//               numberOfLines={showFullDescription ? undefined : 4}
//             >
//               {property.description.replace(/<[^>]*>/g, "")}{" "}
//               {/* Remove HTML tags */}
//             </Text>
//             {property.description.length > 200 && (
//               <TouchableOpacity
//                 onPress={() => setShowFullDescription(!showFullDescription)}
//                 style={styles.readMoreButton}
//               >
//                 <Text style={styles.readMoreText}>
//                   {showFullDescription ? "Read Less ▲" : "Read More ▼"}
//                 </Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         )}

//         {/* Property Details Grid */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Property Details</Text>
//           <View style={styles.detailsGrid}>
//             <View style={styles.detailCard}>
//               <Ionicons name="pricetag-outline" size={20} color="#6366f1" />
//               <Text style={styles.detailLabel}>Listing Type</Text>
//               <Text style={styles.detailValue}>{property.listing_type}</Text>
//             </View>
//             <View style={styles.detailCard}>
//               <Ionicons name="flag-outline" size={20} color="#6366f1" />
//               <Text style={styles.detailLabel}>Purpose</Text>
//               <Text style={styles.detailValue}>{property.purpose}</Text>
//             </View>
//             <View style={styles.detailCard}>
//               <Ionicons name="cube-outline" size={20} color="#6366f1" />
//               <Text style={styles.detailLabel}>Unit Type</Text>
//               <Text style={styles.detailValue}>{property.unit_type}</Text>
//             </View>
//             <View style={styles.detailCard}>
//               <Ionicons name="home-outline" size={20} color="#6366f1" />
//               <Text style={styles.detailLabel}>Category</Text>
//               <Text style={styles.detailValue}>{property.category}</Text>
//             </View>
//             <View style={styles.detailCard}>
//               <Ionicons name="bed-outline" size={20} color="#6366f1" />
//               <Text style={styles.detailLabel}>Furnishing</Text>
//               <Text style={styles.detailValue}>{property.furnishing}</Text>
//             </View>
//             <View style={styles.detailCard}>
//               <Ionicons name="car-outline" size={20} color="#6366f1" />
//               <Text style={styles.detailLabel}>Parking</Text>
//               <Text style={styles.detailValue}>
//                 {property.parking_availability || "0"} spaces
//               </Text>
//             </View>
//           </View>
//         </View>

//         {/* Additional Information */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Additional Information</Text>
//           <View style={styles.infoRow}>
//             <Text style={styles.infoLabel}>Property Reference</Text>
//             <Text style={styles.infoValue}>{property.property_reference}</Text>
//           </View>
//           <View style={styles.infoRow}>
//             <Text style={styles.infoLabel}>Date Added</Text>
//             <Text style={styles.infoValue}>
//               {formatDate(property.dateadded)}
//             </Text>
//           </View>
//           <View style={styles.infoRow}>
//             <Text style={styles.infoLabel}>Last Updated</Text>
//             <Text style={styles.infoValue}>
//               {formatDate(property.last_updated)}
//             </Text>
//           </View>
//           {property.handover_date && (
//             <View style={styles.infoRow}>
//               <Text style={styles.infoLabel}>Handover Date</Text>
//               <Text style={styles.infoValue}>
//                 {formatDate(property.handover_date)}
//               </Text>
//             </View>
//           )}
//         </View>

//         {/* Nearby Locations */}
//         {property.near_by_locations && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Nearby Locations</Text>
//             <View style={styles.nearbyContainer}>
//               <Text style={styles.nearbyText}>
//                 {property.near_by_locations.replace(/<[^>]*>/g, "")}
//               </Text>
//             </View>
//           </View>
//         )}

//         {/* Gallery Section */}
//         {allImages.length > 0 && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Gallery</Text>
//             <ScrollView
//               horizontal
//               showsHorizontalScrollIndicator={false}
//               style={styles.galleryScroll}
//               contentContainerStyle={styles.galleryScrollContent}
//             >
//               {allImages.map((image, index) => (
//                 <TouchableOpacity
//                   key={index}
//                   onPress={() => setSelectedImage(image)}
//                   activeOpacity={0.9}
//                 >
//                   <Image
//                     source={{ uri: image }}
//                     style={styles.galleryImage}
//                     // defaultSource={require("../assets/placeholder.png")}
//                   />
//                 </TouchableOpacity>
//               ))}
//             </ScrollView>
//           </View>
//         )}

//         {/* Contact Section */}
//         <View style={styles.contactSection}>
//           <Text style={styles.sectionTitle}>Contact Information</Text>
//           <View style={styles.contactCard}>
//             <View style={styles.contactAvatar}>
//               <Ionicons
//                 name="person-circle-outline"
//                 size={60}
//                 color="#6366f1"
//               />
//             </View>
//             <View style={styles.contactInfo}>
//               <Text style={styles.contactName}>{property.agent_name}</Text>
//               <Text style={styles.contactRole}>Real Estate Agent</Text>
//               {property.owner_name && (
//                 <Text style={styles.contactOwner}>
//                   Owner: {property.owner_name}
//                 </Text>
//               )}
//             </View>
//           </View>

//           <View style={styles.contactButtons}>
//             {property.owner_phone_1 && (
//               <TouchableOpacity
//                 style={styles.contactButton}
//                 onPress={() => makePhoneCall(property.owner_phone_1!)}
//               >
//                 <Ionicons name="call-outline" size={20} color="#fff" />
//                 <Text style={styles.contactButtonText}>Call Primary</Text>
//               </TouchableOpacity>
//             )}
//             {property.owner_phone_2 && (
//               <TouchableOpacity
//                 style={[styles.contactButton, styles.secondaryButton]}
//                 onPress={() => makePhoneCall(property.owner_phone_2!)}
//               >
//                 <Ionicons name="call-outline" size={20} color="#6366f1" />
//                 <Text style={styles.secondaryButtonText}>Call Secondary</Text>
//               </TouchableOpacity>
//             )}
//             {property.email && (
//               <TouchableOpacity
//                 style={[styles.contactButton, styles.emailButton]}
//                 onPress={() => sendEmail(property.email!)}
//               >
//                 <Ionicons name="mail-outline" size={20} color="#fff" />
//                 <Text style={styles.contactButtonText}>Send Email</Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>

//         {/* Map Section (if coordinates available) */}
//         {property.latitude &&
//           property.longitude &&
//           parseFloat(property.latitude) !== 0 &&
//           parseFloat(property.longitude) !== 0 && (
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Location Map</Text>
//               <TouchableOpacity
//                 style={styles.mapContainer}
//                 onPress={() => {
//                   const url = `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`;
//                   openUrl(url);
//                 }}
//               >
//                 <View style={styles.mapPlaceholder}>
//                   <Ionicons name="map-outline" size={48} color="#6366f1" />
//                   <Text style={styles.mapPlaceholderText}>
//                     Tap to view location on map
//                   </Text>
//                   <Text style={styles.mapCoordinates}>
//                     {parseFloat(property.latitude).toFixed(6)},{" "}
//                     {parseFloat(property.longitude).toFixed(6)}
//                   </Text>
//                 </View>
//               </TouchableOpacity>
//             </View>
//           )}
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
//     height: 120,
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
//   actionIconsOverlay: {
//     position: "absolute",
//     top: 50,
//     right: 20,
//     flexDirection: "row",
//     gap: 12,
//   },
//   iconCircle: {
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
//     left: 80,
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
//   },
//   mainPrice: {
//     fontSize: 34,
//     fontWeight: "700",
//     color: "#1e293b",
//     marginBottom: 16,
//   },
//   featuresRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//     marginBottom: 24,
//     flexWrap: "wrap",
//   },
//   featureItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//   },
//   featureText: {
//     fontSize: 14,
//     color: "#475569",
//     fontWeight: "500",
//   },
//   featureDot: {
//     width: 4,
//     height: 4,
//     borderRadius: 2,
//     backgroundColor: "#cbd5e1",
//   },
//   developerCard: {
//     backgroundColor: "#fff",
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 24,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   developerHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     marginBottom: 12,
//   },
//   developerTitle: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#1e293b",
//   },
//   developerName: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#6366f1",
//     marginBottom: 4,
//   },
//   agentName: {
//     fontSize: 14,
//     color: "#64748b",
//   },
//   section: {
//     marginBottom: 24,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: "600",
//     color: "#1e293b",
//     marginBottom: 16,
//   },
//   descriptionText: {
//     fontSize: 15,
//     color: "#475569",
//     lineHeight: 24,
//   },
//   readMoreButton: {
//     marginTop: 8,
//   },
//   readMoreText: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: "#6366f1",
//   },
//   detailsGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 12,
//   },
//   detailCard: {
//     flex: 1,
//     minWidth: "45%",
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 12,
//     alignItems: "center",
//     gap: 8,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   detailLabel: {
//     fontSize: 12,
//     color: "#64748b",
//   },
//   detailValue: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#1e293b",
//   },
//   infoRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#e2e8f0",
//   },
//   infoLabel: {
//     fontSize: 14,
//     color: "#64748b",
//   },
//   infoValue: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: "#1e293b",
//   },
//   nearbyContainer: {
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 16,
//   },
//   nearbyText: {
//     fontSize: 14,
//     color: "#475569",
//     lineHeight: 22,
//   },
//   galleryScroll: {
//     marginHorizontal: -20,
//   },
//   galleryScrollContent: {
//     paddingHorizontal: 20,
//     gap: 12,
//   },
//   galleryImage: {
//     width: 160,
//     height: 120,
//     resizeMode: "cover",
//     borderRadius: 12,
//   },
//   contactSection: {
//     marginBottom: 40,
//   },
//   contactCard: {
//     backgroundColor: "#fff",
//     borderRadius: 16,
//     padding: 16,
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 16,
//     marginBottom: 16,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   contactAvatar: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: "#e0e7ff",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   contactInfo: {
//     flex: 1,
//   },
//   contactName: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#1e293b",
//     marginBottom: 4,
//   },
//   contactRole: {
//     fontSize: 13,
//     color: "#6366f1",
//     marginBottom: 2,
//   },
//   contactOwner: {
//     fontSize: 12,
//     color: "#64748b",
//   },
//   contactButtons: {
//     gap: 12,
//   },
//   contactButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 8,
//     backgroundColor: "#6366f1",
//     paddingVertical: 14,
//     borderRadius: 12,
//   },
//   contactButtonText: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#fff",
//   },
//   secondaryButton: {
//     backgroundColor: "#fff",
//     borderWidth: 1,
//     borderColor: "#6366f1",
//   },
//   secondaryButtonText: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#6366f1",
//   },
//   emailButton: {
//     backgroundColor: "#10b981",
//   },
//   mapContainer: {
//     borderRadius: 12,
//     overflow: "hidden",
//     height: 200,
//     backgroundColor: "#f1f5f9",
//   },
//   mapPlaceholder: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     gap: 8,
//   },
//   mapPlaceholderText: {
//     fontSize: 14,
//     color: "#64748b",
//   },
//   mapCoordinates: {
//     fontSize: 12,
//     color: "#94a3b8",
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

// app/property-detail.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
    return html?.replace(/<[^>]*>/g, "") || "";
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
      {/* Header Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: property.thumbnail }} style={styles.coverImage} />

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Share and Like */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionCircle} onPress={onShare}>
            <Ionicons name="share-social-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCircle}
            onPress={() => setIsLiked(!isLiked)}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={20}
              color={isLiked ? "#ef4444" : "#fff"}
            />
          </TouchableOpacity>
        </View>

        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(property.property_status) },
          ]}
        >
          <Text style={styles.statusText}>{property.property_status}</Text>
        </View>
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

        {/* Master Plan / Gallery */}
        {allImages.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.galleryScroll}
            >
              {allImages.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImage(image)}
                >
                  <Image source={{ uri: image }} style={styles.galleryImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Amenities / Nearby Locations */}
        {property.near_by_locations && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nearby Locations</Text>
            <View style={styles.amenitiesGrid}>
              {stripHtml(property.near_by_locations)
                .split(",")
                .map((item, index) => (
                  <View key={index} style={styles.amenityTag}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#10b981"
                    />
                    <Text style={styles.amenityText}>{item.trim()}</Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* Developer Info */}
        <View style={styles.developerCard}>
          <Text style={styles.developerLabel}>Developer</Text>
          <Text style={styles.developerName}>{property.developer}</Text>
          <Text style={styles.agentText}>Agent: {property.agent_name}</Text>
        </View>

        {/* Contact Button */}
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
          <Text style={styles.contactButtonText}>Contact Agent</Text>
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
  },
  coverImage: {
    width: "100%",
    height: "100%",
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
