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
    // if (numPrice >= 1000000) {
    //   return `AED ${(numPrice / 1000000).toFixed(1)}M`;
    // }
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
    padding: 16,
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
    marginBottom: 12,
  },
  details: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
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
