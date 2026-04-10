// components/FilterModal.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { FilterOptions } from "../types";

interface FilterModalProps {
  visible: boolean;
  filters: FilterOptions;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  onReset: () => void;
  setFilters: (filters: FilterOptions) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  filters,
  onClose,
  onApply,
  onReset,
  setFilters,
}) => {
  const filterSections = [
    {
      title: "Property Type",
      key: "property_type",
      options: [
        "",
        "Apartment",
        "Villa",
        "Townhouse",
        "Penthouse",
        "Office Space",
      ],
    },
    {
      title: "Category",
      key: "category",
      options: ["", "Residential", "Commercial"],
    },
    {
      title: "Purpose",
      key: "purpose",
      options: ["", "For Sale", "For Rent"],
    },
    {
      title: "Property Status",
      key: "property_status",
      options: ["", "Available", "Sold", "Reserved"],
    },
    {
      title: "Unit Type",
      key: "unit_type",
      options: ["", "Studio", "1BR", "2BR", "3BR", "4BR", "5BR+"],
    },
    {
      title: "Furnishing",
      key: "furnishing",
      options: ["", "Furnished", "Unfurnished", "Semi-furnished"],
    },
    {
      title: "Bedrooms",
      key: "bedrooms",
      options: ["", "1", "2", "3", "4", "5+"],
    },
    {
      title: "Bathrooms",
      key: "bathrooms",
      options: ["", "1", "2", "3", "4", "5+"],
    },
    {
      title: "Sort By",
      key: "sort_by",
      options: ["dateadded", "price", "area"],
    },
    {
      title: "Sort Order",
      key: "sort_order",
      options: ["DESC", "ASC"],
    },
  ];

  const updateFilter = (key: keyof FilterOptions, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Price Range */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Price Range (AED)</Text>
              <View style={styles.rangeContainer}>
                <TextInput
                  style={styles.rangeInput}
                  placeholder="Min"
                  placeholderTextColor="#94a3b8"
                  value={filters.price_min}
                  onChangeText={(value) => updateFilter("price_min", value)}
                  keyboardType="numeric"
                />
                <Text style={styles.rangeSeparator}>-</Text>
                <TextInput
                  style={styles.rangeInput}
                  placeholder="Max"
                  placeholderTextColor="#94a3b8"
                  value={filters.price_max}
                  onChangeText={(value) => updateFilter("price_max", value)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Area Range */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Area (sq ft)</Text>
              <View style={styles.rangeContainer}>
                <TextInput
                  style={styles.rangeInput}
                  placeholder="Min"
                  placeholderTextColor="#94a3b8"
                  value={filters.area_min}
                  onChangeText={(value) => updateFilter("area_min", value)}
                  keyboardType="numeric"
                />
                <Text style={styles.rangeSeparator}>-</Text>
                <TextInput
                  style={styles.rangeInput}
                  placeholder="Max"
                  placeholderTextColor="#94a3b8"
                  value={filters.area_max}
                  onChangeText={(value) => updateFilter("area_max", value)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Other Filters */}
            {filterSections.map((section) => (
              <View key={section.key} style={styles.filterSection}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.optionsContainer}>
                    {section.options.map((option) => (
                      <TouchableOpacity
                        key={option || "all"}
                        style={[
                          styles.optionButton,
                          filters[section.key as keyof FilterOptions] ===
                            option && styles.optionButtonActive,
                        ]}
                        onPress={() =>
                          updateFilter(
                            section.key as keyof FilterOptions,
                            option,
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.optionText,
                            filters[section.key as keyof FilterOptions] ===
                              option && styles.optionTextActive,
                          ]}
                        >
                          {option || "All"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.resetButton} onPress={onReset}>
              <Text style={styles.resetButtonText}>Reset All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => onApply(filters)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    marginRight: 8,
  },
  optionButtonActive: {
    backgroundColor: "#6366f1",
  },
  optionText: {
    fontSize: 14,
    color: "#64748b",
  },
  optionTextActive: {
    color: "#fff",
  },
  rangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rangeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#1e293b",
  },
  rangeSeparator: {
    fontSize: 16,
    color: "#94a3b8",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#64748b",
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#6366f1",
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
  },
});

export default FilterModal;
