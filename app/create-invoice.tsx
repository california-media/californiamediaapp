import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CreateInvoiceItem,
  createInvoice,
  CrmItem,
  Currency,
  fetchCurrencies,
  fetchCustomerById,
  fetchCustomers,
  fetchInvoiceInit,
  fetchItems,
  fetchPaymentModes,
  PaymentMode,
} from "./utils/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const plusDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

interface ItemRow extends CreateInvoiceItem { key: string }

const DISCOUNT_TYPES = [
  { value: "0", label: "No Discount" },
  { value: "1", label: "Before Tax" },
  { value: "2", label: "After Tax" },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function CreateInvoiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Customer
  const [custSearch, setCustSearch] = useState("");
  const [custResults, setCustResults] = useState<Array<{ id: string; name: string }>>([]);
  const [custSelected, setCustSelected] = useState<{ id: string; name: string } | null>(null);
  const [custLoading, setCustLoading] = useState(false);
  const custTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Invoice number
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");

  // Billing address
  const [billingStreet, setBillingStreet] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingZip, setBillingZip] = useState("");
  const [billingCountry, setBillingCountry] = useState("");

  // Dates
  const [date, setDate] = useState(todayStr());
  const [dueDate, setDueDate] = useState(plusDays(30));

  // Currency
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [currencyId, setCurrencyId] = useState("1");

  // Payment modes
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [selectedModes, setSelectedModes] = useState<string[]>([]);

  // Discount
  const [discountType, setDiscountType] = useState("0");
  const [discountPercent, setDiscountPercent] = useState("");
  const [adjustment, setAdjustment] = useState("0");

  // Items
  const [items, setItems] = useState<ItemRow[]>([
    { key: "0", description: "", qty: "1", rate: "", unit: "", long_description: "" },
  ]);

  // Item picker
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [itemPickerSearch, setItemPickerSearch] = useState("");
  const [crmItems, setCrmItems] = useState<CrmItem[]>([]);
  const [crmItemsLoading, setCrmItemsLoading] = useState(false);
  const itemSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Load init data ──
  useEffect(() => {
    fetchInvoiceInit().then(({ next_number, prefix }) => {
      setInvoiceNumber(String(next_number));
      setInvoicePrefix(prefix || "INV-");
    });
    fetchCurrencies().then((data) => {
      if (data.length > 0) {
        setCurrencies(data);
        const def = data.find((c) => c.isdefault === "1") || data[0];
        setCurrencyId(def.id);
      }
    });
    fetchPaymentModes().then((modes) => {
      setPaymentModes(modes);
      const defaults = modes.filter((m) => m.selected_by_default === "1").map((m) => m.id);
      setSelectedModes(defaults.length > 0 ? defaults : modes.slice(0, 1).map((m) => m.id));
    });
  }, []);

  // ── Customer search ──
  useEffect(() => {
    if (custTimer.current) clearTimeout(custTimer.current);
    if (!custSearch.trim()) { setCustResults([]); return; }
    custTimer.current = setTimeout(async () => {
      setCustLoading(true);
      try {
        const res = await fetchCustomers({ search: custSearch, limit: 6 });
        setCustResults(
          res.data.map((c) => ({
            id: c.id || c.userid,
            name: c.company || `${c.firstname || ""} ${c.lastname || ""}`.trim() || `Client #${c.id || c.userid}`,
          }))
        );
      } finally {
        setCustLoading(false);
      }
    }, 350);
  }, [custSearch]);

  const selectCustomer = async (item: { id: string; name: string }) => {
    setCustSelected(item);
    setCustSearch("");
    setCustResults([]);
    // Auto-fill billing address and currency from customer detail
    try {
      const detail = await fetchCustomerById(item.id);
      if (detail) {
        if (detail.billing_street) setBillingStreet(detail.billing_street);
        else if (detail.address) setBillingStreet(detail.address);
        if (detail.billing_city) setBillingCity(detail.billing_city);
        if (detail.billing_state) setBillingState(detail.billing_state);
        if (detail.zip) setBillingZip(detail.zip);
        if (detail.country) setBillingCountry(detail.country);
        if (detail.default_currency && detail.default_currency !== "0") {
          setCurrencyId(detail.default_currency);
        }
      }
    } catch { /* ignore */ }
  };

  const clearCustomer = () => {
    setCustSelected(null);
    setCustSearch("");
    setCustResults([]);
  };

  // ── CRM Item picker ──
  const openItemPicker = () => {
    setItemPickerSearch("");
    setCrmItemsLoading(true);
    setShowItemPicker(true);
    fetchItems().then((data) => { setCrmItems(data); setCrmItemsLoading(false); });
  };

  useEffect(() => {
    if (!showItemPicker) return;
    if (itemSearchTimer.current) clearTimeout(itemSearchTimer.current);
    itemSearchTimer.current = setTimeout(async () => {
      setCrmItemsLoading(true);
      const data = await fetchItems(itemPickerSearch);
      setCrmItems(data);
      setCrmItemsLoading(false);
    }, 300);
  }, [itemPickerSearch]);

  const pickCrmItem = (ci: CrmItem) => {
    setItems((prev) => [
      ...prev,
      {
        key: String(Date.now()),
        description: ci.description || "",
        long_description: ci.long_description || "",
        qty: "1",
        rate: ci.rate || "",
        unit: ci.unit || "",
      },
    ]);
    setShowItemPicker(false);
  };

  // ── Items ──
  const addItem = () =>
    setItems((p) => [...p, { key: String(Date.now()), description: "", qty: "1", rate: "", unit: "", long_description: "" }]);

  const removeItem = (key: string) => {
    if (items.length === 1) return;
    setItems((p) => p.filter((i) => i.key !== key));
  };

  const updateItem = (key: string, field: keyof CreateInvoiceItem, val: string) =>
    setItems((p) => p.map((i) => (i.key === key ? { ...i, [field]: val } : i)));

  // ── Payment mode toggle ──
  const toggleMode = (id: string) => {
    setSelectedModes((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  // ── Totals ──
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0), 0);
  const discountTotal = discountType !== "0" && discountPercent
    ? subtotal * ((parseFloat(discountPercent) || 0) / 100)
    : 0;
  const adjustmentNum = parseFloat(adjustment) || 0;
  const total = subtotal - discountTotal + adjustmentNum;

  const selectedCurrency = currencies.find((c) => c.id === currencyId);
  const currSymbol = selectedCurrency?.symbol || "AED";

  // ── Validation ──
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!custSelected) errs.customer = "Select a customer";
    if (!invoiceNumber.trim()) errs.invoiceNumber = "Required";
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) errs.date = "Use YYYY-MM-DD";
    if (dueDate && !dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) errs.dueDate = "Use YYYY-MM-DD";
    if (!billingStreet.trim()) errs.billingStreet = "Required";
    if (selectedModes.length === 0) errs.paymentModes = "Select at least one payment mode";
    items.forEach((item, idx) => {
      if (!item.description.trim()) errs[`item_${idx}`] = "Required";
      if (!item.rate || parseFloat(item.rate) <= 0) errs[`item_${idx}_rate`] = "Rate must be > 0";
    });
    if (subtotal <= 0) errs.subtotal = "At least one item must have a rate greater than 0";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const result = await createInvoice({
        clientid: custSelected!.id,
        number: invoiceNumber.trim(),
        date,
        duedate: dueDate || undefined,
        currency: currencyId,
        billing_street: billingStreet.trim(),
        billing_city: billingCity.trim() || undefined,
        billing_state: billingState.trim() || undefined,
        billing_zip: billingZip.trim() || undefined,
        billing_country: billingCountry.trim() || undefined,
        subtotal: subtotal.toFixed(2),
        total: total.toFixed(2),
        discount_percent: discountPercent || "0",
        discount_total: discountTotal.toFixed(2),
        discount_type: discountType,
        adjustment: adjustment || "0",
        allowed_payment_modes: selectedModes,
        items: items.map(({ key: _k, ...rest }) => rest),
      });

      if (result.status) {
        Alert.alert("Success", "Invoice created successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", result.message || "Failed to create invoice");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Invoice</Text>
          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Customer ── */}
          <Section title="Customer *">
            {custSelected ? (
              <View style={styles.selectedEntity}>
                <View style={styles.selectedEntityLeft}>
                  <Ionicons name="checkmark-circle" size={18} color="#059669" />
                  <View>
                    <Text style={styles.selectedEntityName}>{custSelected.name}</Text>
                    <Text style={styles.selectedEntityId}>Customer #{custSelected.id}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={clearCustomer} style={styles.clearEntityBtn}>
                  <Ionicons name="close" size={16} color="#64748b" />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={[styles.searchInputWrap, errors.customer && styles.inputError]}>
                  <Ionicons name="search-outline" size={16} color="#94a3b8" />
                  <TextInput
                    style={styles.searchInputInner}
                    value={custSearch}
                    onChangeText={setCustSearch}
                    placeholder="Search customers..."
                    placeholderTextColor="#94a3b8"
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                  {custLoading && <ActivityIndicator size="small" color="#10b981" />}
                </View>
                {errors.customer && <Text style={styles.errorText}>{errors.customer}</Text>}
                {custResults.length > 0 && (
                  <View style={styles.searchResults}>
                    {custResults.map((item) => (
                      <TouchableOpacity key={item.id} style={styles.searchResultRow} onPress={() => selectCustomer(item)}>
                        <Ionicons name="business-outline" size={15} color="#10b981" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.searchResultName}>{item.name}</Text>
                          <Text style={styles.searchResultId}>ID: {item.id}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={14} color="#cbd5e1" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
          </Section>

          {/* ── Invoice Details ── */}
          <Section title="Invoice Details">
            <View style={styles.row}>
              <View style={{ flex: 1.2 }}>
                <Field label="Invoice Number *" error={errors.invoiceNumber}>
                  <TextInput
                    style={[styles.input, errors.invoiceNumber && styles.inputError]}
                    value={invoiceNumber}
                    onChangeText={setInvoiceNumber}
                    placeholder="e.g. 42"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                  />
                </Field>
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1.5 }}>
                <Field label="Prefix">
                  <View style={styles.prefixDisplay}>
                    <Text style={styles.prefixText}>{invoicePrefix}</Text>
                  </View>
                </Field>
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="Date * (YYYY-MM-DD)" error={errors.date}>
                  <TextInput style={[styles.input, errors.date && styles.inputError]} value={date} onChangeText={setDate} placeholder="2024-01-01" placeholderTextColor="#94a3b8" />
                </Field>
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <Field label="Due Date (YYYY-MM-DD)" error={errors.dueDate}>
                  <TextInput style={[styles.input, errors.dueDate && styles.inputError]} value={dueDate} onChangeText={setDueDate} placeholder="2024-02-01" placeholderTextColor="#94a3b8" />
                </Field>
              </View>
            </View>
          </Section>

          {/* ── Billing Address ── */}
          <Section title="Billing Address">
            <Field label="Street *" error={errors.billingStreet}>
              <TextInput
                style={[styles.input, { height: 60, paddingTop: 10, textAlignVertical: "top" }, errors.billingStreet && styles.inputError]}
                value={billingStreet}
                onChangeText={setBillingStreet}
                placeholder="Street / Address (auto-filled from customer)"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={2}
              />
            </Field>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="City">
                  <TextInput style={styles.input} value={billingCity} onChangeText={setBillingCity} placeholder="City" placeholderTextColor="#94a3b8" />
                </Field>
              </View>
              <View style={{ width: 8 }} />
              <View style={{ flex: 1 }}>
                <Field label="State">
                  <TextInput style={styles.input} value={billingState} onChangeText={setBillingState} placeholder="State" placeholderTextColor="#94a3b8" />
                </Field>
              </View>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="ZIP">
                  <TextInput style={styles.input} value={billingZip} onChangeText={setBillingZip} placeholder="ZIP / Postal" placeholderTextColor="#94a3b8" />
                </Field>
              </View>
              <View style={{ width: 8 }} />
              <View style={{ flex: 1 }}>
                <Field label="Country">
                  <TextInput style={styles.input} value={billingCountry} onChangeText={setBillingCountry} placeholder="Country" placeholderTextColor="#94a3b8" />
                </Field>
              </View>
            </View>
          </Section>

          {/* ── Currency & Payment ── */}
          <Section title="Settings">
            <Field label="Currency *">
              {currencies.length > 0 ? (
                <View style={styles.chipRow}>
                  {currencies.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.chip, currencyId === c.id && styles.chipActive]}
                      onPress={() => setCurrencyId(c.id)}
                    >
                      <Text style={[styles.chipText, currencyId === c.id && styles.chipTextActive]}>
                        {c.symbol} {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <TextInput style={styles.input} value={currencyId} onChangeText={setCurrencyId} placeholder="Currency ID" placeholderTextColor="#94a3b8" keyboardType="numeric" />
              )}
            </Field>

            <Field label="Payment Modes *" error={errors.paymentModes}>
              <View style={styles.chipRow}>
                {paymentModes.map((m) => {
                  const active = selectedModes.includes(m.id);
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => toggleMode(m.id)}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Ionicons
                          name={active ? "checkbox" : "square-outline"}
                          size={14}
                          color={active ? "#fff" : "#64748b"}
                        />
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{m.name}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.paymentModes && <Text style={styles.errorText}>{errors.paymentModes}</Text>}
            </Field>

            <Field label="Discount Type">
              <View style={styles.chipRow}>
                {DISCOUNT_TYPES.map((d) => (
                  <TouchableOpacity key={d.value} style={[styles.chip, discountType === d.value && styles.chipActive]} onPress={() => setDiscountType(d.value)}>
                    <Text style={[styles.chipText, discountType === d.value && styles.chipTextActive]}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Field>

            {discountType !== "0" && (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Field label="Discount %">
                    <TextInput style={styles.input} value={discountPercent} onChangeText={setDiscountPercent} placeholder="0" placeholderTextColor="#94a3b8" keyboardType="decimal-pad" />
                  </Field>
                </View>
                <View style={{ width: 10 }} />
                <View style={{ flex: 1 }}>
                  <Field label="Adjustment">
                    <TextInput style={styles.input} value={adjustment} onChangeText={setAdjustment} placeholder="0" placeholderTextColor="#94a3b8" keyboardType="decimal-pad" />
                  </Field>
                </View>
              </View>
            )}
          </Section>

          {/* ── Line Items ── */}
          <Section
            title="Line Items"
            action={
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity style={styles.addItemBtn} onPress={openItemPicker}>
                  <Ionicons name="cube-outline" size={15} color="#10b981" />
                  <Text style={styles.addItemText}>CRM Items</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
                  <Ionicons name="add" size={16} color="#10b981" />
                  <Text style={styles.addItemText}>Manual</Text>
                </TouchableOpacity>
              </View>
            }
          >
            {items.map((item, idx) => (
              <View key={item.key} style={styles.itemCard}>
                <View style={styles.itemCardHeader}>
                  <Text style={styles.itemCardTitle}>Item {idx + 1}</Text>
                  {items.length > 1 && (
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item.key)}>
                      <Ionicons name="trash-outline" size={14} color="#dc2626" />
                    </TouchableOpacity>
                  )}
                </View>

                <Field label="Description *" error={errors[`item_${idx}`]}>
                  <TextInput style={[styles.input, errors[`item_${idx}`] && styles.inputError]} value={item.description} onChangeText={(v) => updateItem(item.key, "description", v)} placeholder="Item / service name" placeholderTextColor="#94a3b8" />
                </Field>

                <Field label="Long Description">
                  <TextInput style={[styles.input, { height: 60, paddingTop: 8, textAlignVertical: "top" }]} value={item.long_description} onChangeText={(v) => updateItem(item.key, "long_description", v)} placeholder="Optional details..." placeholderTextColor="#94a3b8" multiline numberOfLines={2} />
                </Field>

                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Field label="Qty">
                      <TextInput style={styles.input} value={item.qty} onChangeText={(v) => updateItem(item.key, "qty", v)} placeholder="1" placeholderTextColor="#94a3b8" keyboardType="decimal-pad" />
                    </Field>
                  </View>
                  <View style={{ width: 8 }} />
                  <View style={{ flex: 1.3 }}>
                    <Field label={`Rate (${currSymbol})`} error={errors[`item_${idx}_rate`]}>
                      <TextInput style={[styles.input, errors[`item_${idx}_rate`] && styles.inputError]} value={item.rate} onChangeText={(v) => updateItem(item.key, "rate", v)} placeholder="0.00" placeholderTextColor="#94a3b8" keyboardType="decimal-pad" />
                    </Field>
                  </View>
                  <View style={{ width: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Field label="Unit">
                      <TextInput style={styles.input} value={item.unit} onChangeText={(v) => updateItem(item.key, "unit", v)} placeholder="pcs" placeholderTextColor="#94a3b8" />
                    </Field>
                  </View>
                </View>

                {(parseFloat(item.qty) > 0 && parseFloat(item.rate) > 0) && (
                  <View style={styles.itemSubtotalRow}>
                    <Text style={styles.itemSubtotalLabel}>Subtotal</Text>
                    <Text style={styles.itemSubtotalValue}>
                      {currSymbol} {((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                )}
              </View>
            ))}

            {errors.subtotal && (
              <View style={styles.subtotalError}>
                <Ionicons name="warning-outline" size={14} color="#dc2626" />
                <Text style={styles.subtotalErrorText}>{errors.subtotal}</Text>
              </View>
            )}
            <View style={styles.totalsCard}>
              <TotalRow label="Sub Total" value={`${currSymbol} ${subtotal.toLocaleString("en-AE", { minimumFractionDigits: 2 })}`} />
              {discountTotal > 0 && (
                <TotalRow label={`Discount (${discountPercent}%)`} value={`- ${currSymbol} ${discountTotal.toLocaleString("en-AE", { minimumFractionDigits: 2 })}`} valueColor="#dc2626" />
              )}
              {adjustmentNum !== 0 && (
                <TotalRow label="Adjustment" value={`${adjustmentNum >= 0 ? "+" : ""}${currSymbol} ${adjustmentNum.toLocaleString("en-AE", { minimumFractionDigits: 2 })}`} />
              )}
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>TOTAL</Text>
                <Text style={styles.grandTotalValue}>
                  {currSymbol} {total.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          </Section>

          {/* Bottom save */}
          <TouchableOpacity style={[styles.bottomBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.bottomBtnText}>Create Invoice</Text>
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </View>

      {/* ── CRM Item Picker Modal ── */}
      <Modal visible={showItemPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowItemPicker(false)}>
        <View style={pickerStyles.container}>
          <View style={pickerStyles.header}>
            <Text style={pickerStyles.title}>Select Item</Text>
            <TouchableOpacity onPress={() => setShowItemPicker(false)} style={pickerStyles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={pickerStyles.searchWrap}>
            <Ionicons name="search-outline" size={17} color="#94a3b8" />
            <TextInput
              style={pickerStyles.searchInput}
              value={itemPickerSearch}
              onChangeText={setItemPickerSearch}
              placeholder="Search items..."
              placeholderTextColor="#94a3b8"
              autoCorrect={false}
              autoFocus
            />
            {crmItemsLoading && <ActivityIndicator size="small" color="#10b981" />}
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {crmItems.length === 0 && !crmItemsLoading ? (
              <View style={pickerStyles.empty}>
                <Ionicons name="cube-outline" size={40} color="#cbd5e1" />
                <Text style={pickerStyles.emptyText}>No items found</Text>
              </View>
            ) : (
              crmItems.map((ci) => (
                <TouchableOpacity key={ci.id} style={pickerStyles.itemRow} onPress={() => pickCrmItem(ci)}>
                  <View style={pickerStyles.itemRowLeft}>
                    <Text style={pickerStyles.itemName}>{ci.description}</Text>
                    {!!ci.long_description?.trim() && (
                      <Text style={pickerStyles.itemDesc} numberOfLines={1}>{ci.long_description}</Text>
                    )}
                  </View>
                  <View style={pickerStyles.itemRowRight}>
                    <Text style={pickerStyles.itemRate}>
                      {parseFloat(ci.rate || "0") > 0 ? `${currSymbol} ${parseFloat(ci.rate).toLocaleString("en-AE", { minimumFractionDigits: 2 })}` : "—"}
                    </Text>
                    {ci.unit ? <Text style={pickerStyles.itemUnit}>{ci.unit}</Text> : null}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <View style={sectionStyles.wrap}>
      <View style={sectionStyles.header}>
        <Text style={sectionStyles.title}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      {children}
      {error ? <Text style={fieldStyles.error}>{error}</Text> : null}
    </View>
  );
}

function TotalRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={totalRowStyles.row}>
      <Text style={totalRowStyles.label}>{label}</Text>
      <Text style={[totalRowStyles.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const sectionStyles = StyleSheet.create({
  wrap: { backgroundColor: "#fff", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  title: { fontSize: 12, fontWeight: "700", color: "#10b981", letterSpacing: 0.6, textTransform: "uppercase" },
});

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontSize: 11, fontWeight: "600", color: "#64748b", marginBottom: 5, letterSpacing: 0.3 },
  error: { fontSize: 11, color: "#dc2626", marginTop: 3 },
});

const totalRowStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  label: { fontSize: 13, color: "#64748b" },
  value: { fontSize: 13, fontWeight: "600", color: "#1e293b" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },


  header: { backgroundColor: "#10b981", flexDirection: "row", alignItems: "center", paddingBottom: 14, paddingHorizontal: 16, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", alignItems: "center" },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "700", color: "#fff" },
  saveBtn: { backgroundColor: "rgba(255,255,255,0.22)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  scroll: { padding: 16, gap: 14 },

  input: { height: 44, backgroundColor: "#f8fafc", borderRadius: 10, borderWidth: 1.5, borderColor: "#e2e8f0", paddingHorizontal: 12, fontSize: 14, color: "#1e293b" },
  inputError: { borderColor: "#fca5a5" },
  errorText: { fontSize: 11, color: "#dc2626", marginTop: 3 },

  row: { flexDirection: "row", alignItems: "flex-start" },

  prefixDisplay: { height: 44, backgroundColor: "#f1f5f9", borderRadius: 10, borderWidth: 1.5, borderColor: "#e2e8f0", paddingHorizontal: 12, justifyContent: "center" },
  prefixText: { fontSize: 14, color: "#64748b", fontWeight: "600" },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" },
  chipActive: { backgroundColor: "#10b981", borderColor: "#10b981" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  chipTextActive: { color: "#fff" },

  searchInputWrap: { flexDirection: "row", alignItems: "center", height: 44, backgroundColor: "#f8fafc", borderRadius: 10, borderWidth: 1.5, borderColor: "#e2e8f0", paddingHorizontal: 12, gap: 8 },
  searchInputInner: { flex: 1, fontSize: 14, color: "#1e293b" },

  searchResults: { borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 10, marginTop: 4, overflow: "hidden" },
  searchResultRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", backgroundColor: "#fff" },
  searchResultName: { fontSize: 14, fontWeight: "600", color: "#1e293b" },
  searchResultId: { fontSize: 11, color: "#94a3b8", marginTop: 1 },

  selectedEntity: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f0fdf4", borderRadius: 10, borderWidth: 1.5, borderColor: "#86efac", padding: 12 },
  selectedEntityLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  selectedEntityName: { fontSize: 14, fontWeight: "600", color: "#1e293b" },
  selectedEntityId: { fontSize: 11, color: "#64748b", marginTop: 1 },
  clearEntityBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: "#e2e8f0", justifyContent: "center", alignItems: "center" },

  addItemBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#ecfdf5", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addItemText: { fontSize: 13, fontWeight: "600", color: "#10b981" },

  itemCard: { borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 12, padding: 12, marginBottom: 10, backgroundColor: "#fafbff" },
  itemCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  itemCardTitle: { fontSize: 12, fontWeight: "700", color: "#10b981" },
  removeBtn: { width: 26, height: 26, borderRadius: 7, backgroundColor: "#fef2f2", justifyContent: "center", alignItems: "center" },
  itemSubtotalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 8, marginTop: 4 },
  itemSubtotalLabel: { fontSize: 11, color: "#94a3b8", fontWeight: "600" },
  itemSubtotalValue: { fontSize: 13, fontWeight: "700", color: "#1e293b" },

  totalsCard: { borderTopWidth: 1.5, borderTopColor: "#e2e8f0", marginTop: 4, paddingTop: 12 },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#10b981", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginTop: 10 },
  grandTotalLabel: { fontSize: 13, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  grandTotalValue: { fontSize: 18, fontWeight: "800", color: "#fff" },

  bottomBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#10b981", borderRadius: 14, paddingVertical: 16, shadowColor: "#10b981", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  bottomBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  subtotalError: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fef2f2", borderRadius: 8, padding: 10, marginBottom: 8 },
  subtotalErrorText: { fontSize: 12, color: "#dc2626", flex: 1 },
});

const pickerStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  title: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  closeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center" },
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 16, marginVertical: 12, borderRadius: 12, paddingHorizontal: 12, height: 46, borderWidth: 1.5, borderColor: "#e2e8f0", gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#1e293b" },
  itemRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", gap: 12 },
  itemRowLeft: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "600", color: "#1e293b", marginBottom: 2 },
  itemDesc: { fontSize: 12, color: "#94a3b8" },
  itemRowRight: { alignItems: "flex-end", gap: 3 },
  itemRate: { fontSize: 14, fontWeight: "700", color: "#10b981" },
  itemUnit: { fontSize: 11, color: "#94a3b8" },
  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 15, color: "#94a3b8" },
});
