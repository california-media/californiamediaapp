// components/PropertyCard.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Property } from "../types";

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onPress }) => {
  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    if (!price || isNaN(numPrice) || numPrice === 0) return "Price on Request";
    return `AED ${numPrice.toLocaleString()}`;
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

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image
        source={{ uri: property.thumbnail }}
        style={styles.image}
        // defaultSource={require("../assets/placeholder.png")}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.developerInfo}>
            <Ionicons name="business-outline" size={16} color="#6366f1" />
            <Text style={styles.developer}>{property.developer}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(property.property_status) },
            ]}
          >
            <Text style={styles.statusText}>{property.property_status}</Text>
          </View>
        </View>

        <Text style={styles.projectName} numberOfLines={1}>
          {property.project_name}
        </Text>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Ionicons
              name={getPropertyTypeIcon(property.property_type || "")}
              size={14}
              color="#64748b"
            />
            <Text style={styles.detailText}>
              {property.property_type || "Property"} • {property.unit_type}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="bed-outline" size={14} color="#64748b" />
            <Text style={styles.detailText}>{property.bedrooms} Beds</Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="water-outline" size={14} color="#64748b" />
            <Text style={styles.detailText}>{property.bathrooms} Baths</Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="resize-outline" size={14} color="#64748b" />
            <Text style={styles.detailText}>
              {parseFloat(property.area).toFixed(0)} sqft
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.price}>{formatPrice(property.price)}</Text>
          <View style={styles.furnishingBadge}>
            <Text style={styles.furnishingText}>{property.furnishing}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  content: {
    padding: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  developerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  developer: {
    fontSize: 13,
    color: "#6366f1",
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
  },
  projectName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 6,
  },
  details: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 6,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: "#64748b",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },
  furnishingBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  furnishingText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
});

export default PropertyCard;

// components/PropertyCard.tsx
// import { Ionicons } from "@expo/vector-icons";
// import React from "react";
// import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
// import { Property } from "../types";

// interface PropertyCardProps {
//   property: Property;
//   onPress: () => void;
// }

// const PropertyCard: React.FC<PropertyCardProps> = ({ property, onPress }) => {
//   const formatPrice = (price: string) => {
//     const numPrice = parseFloat(price);
//     if (isNaN(numPrice)) return "Price on request";
//     if (numPrice >= 1000000) {
//       return `AED ${(numPrice / 1000000).toFixed(1)}M`;
//     }
//     return `AED ${numPrice.toLocaleString()}`;
//   };

//   const getStatusColor = (status: string) => {
//     switch (status?.toLowerCase()) {
//       case "available":
//         return "#10b981";
//       case "sold":
//         return "#ef4444";
//       case "reserved":
//         return "#f59e0b";
//       case "off-plan":
//         return "#8b5cf6";
//       default:
//         return "#6366f1";
//     }
//   };

//   const getStatusTextColor = (status: string) => {
//     switch (status?.toLowerCase()) {
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

//   const getPropertyTypeIcon = (type: string) => {
//     switch (type?.toLowerCase()) {
//       case "apartment":
//         return "business-outline";
//       case "villa":
//         return "home-outline";
//       case "townhouse":
//         return "home-outline";
//       default:
//         return "location-outline";
//     }
//   };

//   const formatArea = (area: string) => {
//     const numArea = parseFloat(area);
//     if (isNaN(numArea) || numArea === 0) return "N/A";
//     return `${Math.round(numArea)} sqft`;
//   };

//   return (
//     <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
//       <Image
//         source={{ uri: property.thumbnail }}
//         style={styles.image}
//         defaultSource={require("../assets/placeholder.png")}
//       />

//       {/* Status Badge Overlay */}
//       <View
//         style={[
//           styles.statusOverlay,
//           { backgroundColor: getStatusColor(property.property_status) },
//         ]}
//       >
//         <Text style={styles.statusOverlayText}>
//           {property.property_status || "Available"}
//         </Text>
//       </View>

//       <View style={styles.content}>
//         {/* Developer Info */}
//         <View style={styles.developerSection}>
//           <Ionicons name="business-outline" size={14} color="#6366f1" />
//           <Text style={styles.developer} numberOfLines={1}>
//             {property.developer || "Unknown Developer"}
//           </Text>
//         </View>

//         {/* Project Name */}
//         <Text style={styles.projectName} numberOfLines={2}>
//           {property.project_name || "Property Name"}
//         </Text>

//         {/* Location */}
//         <View style={styles.locationSection}>
//           <Ionicons name="location-outline" size={12} color="#94a3b8" />
//           <Text style={styles.locationText} numberOfLines={1}>
//             {property.location || property.bayut_location_name || "Dubai"}
//           </Text>
//         </View>

//         {/* Property Details Grid */}
//         <View style={styles.detailsGrid}>
//           <View style={styles.detailBox}>
//             <Ionicons
//               name={getPropertyTypeIcon(property.property_type || "")}
//               size={16}
//               color="#6366f1"
//             />
//             <Text style={styles.detailBoxLabel}>Type</Text>
//             <Text style={styles.detailBoxValue} numberOfLines={1}>
//               {property.unit_type || property.property_type || "Property"}
//             </Text>
//           </View>

//           <View style={styles.detailBox}>
//             <Ionicons name="bed-outline" size={16} color="#6366f1" />
//             <Text style={styles.detailBoxLabel}>Beds</Text>
//             <Text style={styles.detailBoxValue}>{property.bedrooms || 0}</Text>
//           </View>

//           <View style={styles.detailBox}>
//             <Ionicons name="water-outline" size={16} color="#6366f1" />
//             <Text style={styles.detailBoxLabel}>Baths</Text>
//             <Text style={styles.detailBoxValue}>{property.bathrooms || 0}</Text>
//           </View>

//           <View style={styles.detailBox}>
//             <Ionicons name="resize-outline" size={16} color="#6366f1" />
//             <Text style={styles.detailBoxLabel}>Area</Text>
//             <Text style={styles.detailBoxValue}>
//               {formatArea(property.area)}
//             </Text>
//           </View>
//         </View>

//         {/* Footer with Price and Furnishing */}
//         <View style={styles.footer}>
//           <View>
//             <Text style={styles.priceLabel}>Price</Text>
//             <Text style={styles.price}>{formatPrice(property.price)}</Text>
//           </View>
//           <View
//             style={[
//               styles.furnishingBadge,
//               {
//                 backgroundColor:
//                   property.furnishing === "furnished" ? "#d1fae5" : "#fef3c7",
//               },
//             ]}
//           >
//             <Ionicons
//               name={
//                 property.furnishing === "furnished"
//                   ? "checkmark-circle"
//                   : "time-outline"
//               }
//               size={14}
//               color={
//                 property.furnishing === "furnished" ? "#10b981" : "#f59e0b"
//               }
//             />
//             <Text
//               style={[
//                 styles.furnishingText,
//                 {
//                   color:
//                     property.furnishing === "furnished" ? "#065f46" : "#92400e",
//                 },
//               ]}
//             >
//               {property.furnishing === "furnished"
//                 ? "Furnished"
//                 : property.furnishing || "Unfurnished"}
//             </Text>
//           </View>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );
// };

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: "#fff",
//     borderRadius: 20,
//     marginBottom: 16,
//     overflow: "hidden",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.08,
//     shadowRadius: 12,
//     elevation: 4,
//   },
//   image: {
//     width: "100%",
//     height: 200,
//     resizeMode: "cover",
//   },
//   statusOverlay: {
//     position: "absolute",
//     top: 12,
//     right: 12,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//     zIndex: 1,
//   },
//   statusOverlayText: {
//     color: "#fff",
//     fontSize: 12,
//     fontWeight: "600",
//   },
//   content: {
//     padding: 16,
//   },
//   developerSection: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//     marginBottom: 8,
//   },
//   developer: {
//     fontSize: 13,
//     color: "#6366f1",
//     fontWeight: "600",
//     flex: 1,
//   },
//   projectName: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#1e293b",
//     marginBottom: 6,
//     lineHeight: 24,
//   },
//   locationSection: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//     marginBottom: 16,
//   },
//   locationText: {
//     fontSize: 12,
//     color: "#94a3b8",
//     flex: 1,
//   },
//   detailsGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 12,
//     marginBottom: 16,
//     paddingBottom: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f1f5f9",
//   },
//   detailBox: {
//     flex: 1,
//     minWidth: 70,
//     alignItems: "center",
//     backgroundColor: "#f8fafc",
//     paddingVertical: 8,
//     paddingHorizontal: 6,
//     borderRadius: 12,
//     gap: 4,
//   },
//   detailBoxLabel: {
//     fontSize: 10,
//     color: "#94a3b8",
//     fontWeight: "500",
//     textTransform: "uppercase",
//   },
//   detailBoxValue: {
//     fontSize: 13,
//     fontWeight: "600",
//     color: "#1e293b",
//     textAlign: "center",
//   },
//   footer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   priceLabel: {
//     fontSize: 11,
//     color: "#94a3b8",
//     fontWeight: "500",
//     marginBottom: 2,
//   },
//   price: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: "#1e293b",
//   },
//   furnishingBadge: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 12,
//   },
//   furnishingText: {
//     fontSize: 12,
//     fontWeight: "600",
//   },
// });

// export default PropertyCard;
