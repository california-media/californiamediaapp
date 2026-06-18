import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { DatePickerModal, formatDateDisplay } from "./components/DatePickerModal";
import { Toast } from "./components/Toast";
import { useToast } from "./utils/useToast";
import { createRenewal, fetchCustomers, fetchRenewalProducts, updateRenewal } from "./utils/api";

const RENEWAL_TYPES = ["Monthly", "Quarterly", "Half Yearly", "Yearly"];
const STATUSES = ["active", "expiring", "expired", "cancelled"];

interface PickerState {
  visible: boolean;
  title: string;
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (v: string) => void;
}

export default function AddRenewalScreen() {
  const router = useRouter();
  const { showToast, toastMsg, toastType, toastAnim } = useToast();
  const { renewal: renewalParam } = useLocalSearchParams<{ renewal: string }>();
  const existing = renewalParam ? JSON.parse(renewalParam) : null;
  const isEdit = !!existing;

  // Form state
  const [domain, setDomain] = useState(existing?.domain ?? "");
  const [customerId, setCustomerId] = useState(String(existing?.customer_id ?? ""));
  const [customerName, setCustomerName] = useState(existing?.customer_name ?? "");
  const [productId, setProductId] = useState(String(existing?.product_id ?? ""));
  const [productName, setProductName] = useState(existing?.product_name ?? "");
  const [price, setPrice] = useState(String(existing?.price ?? ""));
  const [registrationDate, setRegistrationDate] = useState(existing?.registration_date ?? "");
  const [expiryDate, setExpiryDate] = useState(existing?.expiry_date ?? "");
  const [renewalType, setRenewalType] = useState(existing?.renewal_type ?? "");
  const [status, setStatus] = useState(existing?.status ?? "active");
  const [notes, setNotes] = useState(existing?.notes ?? "");

  // Data
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [picker, setPicker] = useState<PickerState>({
    visible: false, title: "", options: [], selected: "", onSelect: () => {},
  });

  // Date picker
  const [datePicker, setDatePicker] = useState<"registration" | "expiry" | null>(null);

  // Customer search modal
  const [customerModal, setCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSearching, setCustomerSearching] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchRenewalProducts().catch(() => []),
      fetchCustomers({ limit: 50, sort_by: "company", sort_order: "ASC" }).catch(() => ({ data: [] })),
    ]).then(([prods, custRes]) => {
      setProducts(Array.isArray(prods) ? prods : []);
      setCustomers(Array.isArray((custRes as any).data) ? (custRes as any).data : []);
    }).finally(() => setMetaLoading(false));
  }, []);

  const searchCustomers = async (q: string) => {
    setCustomerSearching(true);
    const res = await fetchCustomers({ search: q, limit: 30, sort_by: "company", sort_order: "ASC" }).catch(() => ({ data: [] }));
    setCustomers(Array.isArray((res as any).data) ? (res as any).data : []);
    setCustomerSearching(false);
  };

  const openPicker = (title: string, options: { label: string; value: string }[], selected: string, onSelect: (v: string) => void) =>
    setPicker({ visible: true, title, options, selected, onSelect });

  const handleSubmit = async () => {
    if (!domain.trim()) { showToast("Domain is required.", "error"); return; }
    if (!expiryDate.trim()) { showToast("Expiry date is required.", "error"); return; }
    if (!renewalType) { showToast("Renewal type is required.", "error"); return; }

    setSaving(true);
    const body: Record<string, string> = {
      domain: domain.trim(),
      expiry_date: expiryDate.trim(),
      renewal_type: renewalType,
      status,
    };
    if (customerId) body.customer_id = customerId;
    if (productId) body.product_id = productId;
    if (price) body.price = price;
    if (registrationDate) body.registration_date = registrationDate;
    if (notes.trim()) body.notes = notes.trim();

    try {
      const res = isEdit
        ? await updateRenewal(existing.id, body)
        : await createRenewal(body);

      if (res.status) {
        showToast(isEdit ? "Renewal updated." : "Renewal created.", "success");
        setTimeout(() => router.back(), 1100);
      } else {
        showToast(res.message || "Failed.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (metaLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading form…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? "Edit Renewal" : "Add Renewal"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Domain */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Renewal Info</Text>

          <View style={styles.fieldRow}>
            <Ionicons name="globe-outline" size={18} color="#6366f1" style={styles.rowIcon} />
            <TextInput
              style={styles.rowInput}
              value={domain}
              onChangeText={setDomain}
              placeholder="Domain / Service Name *"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.rowDivider} />

          {/* Customer picker */}
          <TouchableOpacity style={styles.fieldRow} onPress={() => { setCustomerSearch(""); setCustomerModal(true); }}>
            <Ionicons name="business-outline" size={18} color="#6366f1" style={styles.rowIcon} />
            <Text style={[styles.rowInput, !customerName && styles.placeholder]}>
              {customerName || "Select Customer"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#94a3b8" />
          </TouchableOpacity>
          <View style={styles.rowDivider} />

          {/* Product picker */}
          <TouchableOpacity
            style={styles.fieldRow}
            onPress={() => openPicker(
              "Product",
              [{ label: "None", value: "" }, ...products.map(p => ({ label: p.name, value: String(p.id) }))],
              productId,
              v => {
                setProductId(v);
                const found = products.find((p: any) => String(p.id) === v);
                setProductName(found?.name ?? "");
                if (found?.default_price && !price) setPrice(String(found.default_price));
              }
            )}
          >
            <Ionicons name="cube-outline" size={18} color="#6366f1" style={styles.rowIcon} />
            <Text style={[styles.rowInput, !productName && styles.placeholder]}>
              {productName || "Select Product"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#94a3b8" />
          </TouchableOpacity>
          <View style={styles.rowDivider} />

          {/* Price */}
          <View style={styles.fieldRow}>
            <Ionicons name="cash-outline" size={18} color="#6366f1" style={styles.rowIcon} />
            <TextInput
              style={styles.rowInput}
              value={price}
              onChangeText={setPrice}
              placeholder="Price (AED)"
              placeholderTextColor="#94a3b8"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Dates */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Dates</Text>

          <TouchableOpacity style={styles.fieldRow} onPress={() => setDatePicker("registration")}>
            <Ionicons name="calendar-outline" size={18} color="#6366f1" style={styles.rowIcon} />
            <Text style={[styles.rowInput, !registrationDate && styles.placeholder]}>
              {registrationDate ? formatDateDisplay(registrationDate) : "Registration Date"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#94a3b8" />
          </TouchableOpacity>
          <View style={styles.rowDivider} />

          <TouchableOpacity style={styles.fieldRow} onPress={() => setDatePicker("expiry")}>
            <Ionicons name="alert-circle-outline" size={18} color="#ef4444" style={styles.rowIcon} />
            <Text style={[styles.rowInput, !expiryDate && styles.placeholder]}>
              {expiryDate ? formatDateDisplay(expiryDate) : "Expiry Date *"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Type & Status */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Type & Status</Text>

          <TouchableOpacity
            style={styles.fieldRow}
            onPress={() => openPicker(
              "Renewal Type",
              RENEWAL_TYPES.map(t => ({ label: t, value: t })),
              renewalType,
              setRenewalType
            )}
          >
            <Ionicons name="refresh-outline" size={18} color="#6366f1" style={styles.rowIcon} />
            <Text style={[styles.rowInput, !renewalType && styles.placeholder]}>
              {renewalType || "Select Renewal Type *"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#94a3b8" />
          </TouchableOpacity>
          <View style={styles.rowDivider} />

          <TouchableOpacity
            style={styles.fieldRow}
            onPress={() => openPicker(
              "Status",
              STATUSES.map(s => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s })),
              status,
              setStatus
            )}
          >
            <Ionicons name="pulse-outline" size={18} color="#6366f1" style={styles.rowIcon} />
            <Text style={styles.rowInput}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Notes</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes..."
            placeholderTextColor="#94a3b8"
            textAlignVertical="top"
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, saving && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.submitText}>{isEdit ? "Update Renewal" : "Add Renewal"}</Text>
          }
        </TouchableOpacity>
      </ScrollView>

      {/* Generic Picker Modal */}
      <Modal visible={picker.visible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPicker(p => ({ ...p, visible: false }))}>
          <View style={styles.pickerSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>{picker.title}</Text>
            <FlatList
              data={picker.options}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerOption, picker.selected === item.value && styles.pickerOptionActive]}
                  onPress={() => { picker.onSelect(item.value); setPicker(p => ({ ...p, visible: false })); }}
                >
                  <Text style={[styles.pickerOptionText, picker.selected === item.value && { color: "#6366f1", fontWeight: "700" }]}>
                    {item.label}
                  </Text>
                  {picker.selected === item.value && <Ionicons name="checkmark" size={16} color="#6366f1" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Customer Search Modal */}
      <Modal visible={customerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerSheet, { maxHeight: "80%" }]}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Select Customer</Text>
            <View style={styles.customerSearch}>
              <Ionicons name="search-outline" size={16} color="#94a3b8" />
              <TextInput
                style={styles.customerSearchInput}
                value={customerSearch}
                onChangeText={q => {
                  setCustomerSearch(q);
                  if (q.length >= 2) searchCustomers(q);
                  else if (q.length === 0) fetchCustomers({ limit: 50, sort_by: "company", sort_order: "ASC" }).then(r => setCustomers((r as any).data || []));
                }}
                placeholder="Search company..."
                placeholderTextColor="#94a3b8"
                autoFocus
              />
              {customerSearching && <ActivityIndicator size="small" color="#6366f1" />}
            </View>
            <TouchableOpacity
              style={styles.pickerOption}
              onPress={() => { setCustomerId(""); setCustomerName(""); setCustomerModal(false); }}
            >
              <Text style={styles.pickerOptionText}>None</Text>
            </TouchableOpacity>
            <FlatList
              data={customers}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerOption, customerId === String(item.id) && styles.pickerOptionActive]}
                  onPress={() => {
                    setCustomerId(String(item.id));
                    setCustomerName(item.company || "");
                    setCustomerModal(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, customerId === String(item.id) && { color: "#6366f1", fontWeight: "700" }]}>
                    {item.company}
                  </Text>
                  {customerId === String(item.id) && <Ionicons name="checkmark" size={16} color="#6366f1" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <DatePickerModal
        visible={datePicker === "registration"}
        value={registrationDate}
        onSelect={setRegistrationDate}
        onClose={() => setDatePicker(null)}
        label="Registration Date"
      />
      <DatePickerModal
        visible={datePicker === "expiry"}
        value={expiryDate}
        onSelect={setExpiryDate}
        onClose={() => setDatePicker(null)}
        label="Expiry Date"
      />

      <Toast msg={toastMsg} type={toastType} anim={toastAnim} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14, color: "#64748b" },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", gap: 12,
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#0f172a", textAlign: "center" },

  scrollContent: { padding: 16, gap: 14, paddingBottom: 40 },

  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    shadowColor: "#64748b", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  cardSectionTitle: { fontSize: 12, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 },

  fieldRow: { flexDirection: "row", alignItems: "center", minHeight: 42 },
  rowIcon: { marginRight: 10 },
  rowInput: { flex: 1, fontSize: 14, color: "#1e293b", paddingVertical: 6 },
  placeholder: { color: "#94a3b8" },
  rowDivider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 4, marginLeft: 28 },

  textArea: {
    backgroundColor: "#f8fafc", borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0",
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1e293b", minHeight: 90,
  },

  submitBtn: {
    backgroundColor: "#6366f1", borderRadius: 14, paddingVertical: 16,
    alignItems: "center", justifyContent: "center", marginTop: 4,
    shadowColor: "#6366f1", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  pickerSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: Platform.OS === "ios" ? 40 : 24, paddingTop: 12,
    maxHeight: "60%",
  },
  pickerHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginBottom: 16 },
  pickerTitle: { fontSize: 17, fontWeight: "700", color: "#1e293b", marginBottom: 12 },
  pickerOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  pickerOptionActive: { backgroundColor: "#f5f3ff" },
  pickerOptionText: { fontSize: 14, color: "#1e293b" },

  customerSearch: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f1f5f9", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
  customerSearchInput: { flex: 1, fontSize: 14, color: "#1e293b" },
});
