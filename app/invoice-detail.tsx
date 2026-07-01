import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Invoice, InvoiceItem, Payment } from "./types";
import { fetchInvoice, fetchPaymentModes, PaymentMode, recordPayment } from "./utils/api";

const invoiceStatus = (s: string) => {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    "1": { label: "Unpaid",         color: "#dc2626", bg: "#fef2f2" },
    "2": { label: "Paid",           color: "#059669", bg: "#f0fdf4" },
    "3": { label: "Partially Paid", color: "#d97706", bg: "#fffbeb" },
    "4": { label: "Overdue",        color: "#7c3aed", bg: "#f5f3ff" },
    "5": { label: "Cancelled",      color: "#64748b", bg: "#f1f5f9" },
    "6": { label: "Draft",          color: "#64748b", bg: "#f1f5f9" },
  };
  return map[s] ?? { label: "Unknown", color: "#64748b", bg: "#f1f5f9" };
};

const invoiceNumber = (inv: Invoice) => `${inv.prefix || "INV-"}${inv.number}`;

const formatNum = (val: string | number) =>
  (parseFloat(String(val)) || 0).toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (d: string | null | undefined) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const todayISO = () => new Date().toISOString().split("T")[0];

export default function InvoiceDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Payment modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payModes, setPayModes] = useState<PaymentMode[]>([]);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(todayISO());
  const [payModeId, setPayModeId] = useState("");
  const [payTxnId, setPayTxnId] = useState("");
  const [payNote, setPayNote] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const [showModeList, setShowModeList] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchInvoice(id);
      setInvoice(data);
    } catch {
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openPayModal = async (inv: Invoice) => {
    const total = parseFloat(inv.total) || 0;
    const paid = (inv.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    const remaining = Math.max(0, total - paid);
    setPayAmount(remaining.toFixed(2));
    setPayDate(todayISO());
    setPayModeId("");
    setPayTxnId("");
    setPayNote("");
    setPayError("");
    setShowModeList(false);
    setShowPayModal(true);
    const modes = await fetchPaymentModes();
    setPayModes(modes);
    if (modes.length > 0 && !payModeId) setPayModeId(modes[0].id);
  };

  const submitPayment = async () => {
    if (!invoice) return;
    setPayError("");
    const amt = parseFloat(payAmount);
    if (!payAmount || isNaN(amt) || amt <= 0) {
      setPayError("Enter a valid amount > 0");
      return;
    }
    if (!payDate.trim()) {
      setPayError("Payment date is required");
      return;
    }
    if (!payModeId) {
      setPayError("Select a payment mode");
      return;
    }
    setPayLoading(true);
    try {
      const result = await recordPayment({
        invoiceid: id,
        amount: amt.toFixed(2),
        paymentmode: payModeId,
        date: payDate,
        transactionid: payTxnId.trim() || undefined,
        note: payNote.trim() || undefined,
      });
      if (result.status) {
        setShowPayModal(false);
        await load();
      } else {
        setPayError(result.message || "Payment failed. Try again.");
      }
    } catch (e) {
      setPayError("Network error. Try again.");
    } finally {
      setPayLoading(false);
    }
  };

  const selectedModeName = payModes.find((m) => m.id === payModeId)?.name || "Select payment mode";

  const headerStyle = [styles.headerBar, { paddingTop: insets.top + 12 }];

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={headerStyle}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invoice</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading invoice...</Text>
        </View>
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.container}>
        <View style={headerStyle}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invoice</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={56} color="#cbd5e1" />
          <Text style={styles.emptyText}>Invoice not found</Text>
        </View>
      </View>
    );
  }

  const st = invoiceStatus(invoice.status);
  const sym = invoice.symbol || "";
  const discount = parseFloat(invoice.discount_total) || 0;
  const tax = parseFloat(invoice.total_tax) || 0;
  const hasPayments = Array.isArray(invoice.payments) && invoice.payments.length > 0;
  const hasClientNote = !!invoice.clientnote?.trim();
  const hasAdminNote = !!invoice.adminnote?.trim();
  const canRecordPayment = invoice.status === "1" || invoice.status === "3";

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={headerStyle}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
      >
        {/* ── Hero card ── */}
        <View style={styles.heroCard}>
          <Text style={styles.heroInvoiceNum}>{invoiceNumber(invoice)}</Text>
          <View style={[styles.heroBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.heroBadgeText, { color: st.color }]}>{st.label}</Text>
          </View>
          <Text style={styles.heroAmount}>
            {sym}{formatNum(invoice.total)}
          </Text>
        </View>

        {/* ── Record Payment CTA ── */}
        {canRecordPayment && (
          <TouchableOpacity
            style={styles.recordPayBtn}
            activeOpacity={0.85}
            onPress={() => openPayModal(invoice)}
          >
            <Ionicons name="card-outline" size={20} color="#fff" />
            <Text style={styles.recordPayBtnText}>Record Payment</Text>
          </TouchableOpacity>
        )}

        {/* ── Dates card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dates</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateCell}>
              <View style={styles.dateIconWrap}>
                <Ionicons name="calendar-outline" size={18} color="#10b981" />
              </View>
              <View>
                <Text style={styles.dateLabel}>Invoice Date</Text>
                <Text style={styles.dateValue}>{formatDate(invoice.date)}</Text>
              </View>
            </View>
            {invoice.duedate ? (
              <View style={styles.dateCell}>
                <View style={styles.dateIconWrap}>
                  <Ionicons name="alarm-outline" size={18} color="#10b981" />
                </View>
                <View>
                  <Text style={styles.dateLabel}>Due Date</Text>
                  <Text style={styles.dateValue}>{formatDate(invoice.duedate)}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Items card ── */}
        {Array.isArray(invoice.items) && invoice.items.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Items</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Description</Text>
              <Text style={[styles.tableHeaderCell, styles.tableRight, { flex: 1 }]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, styles.tableRight, { flex: 2 }]}>Rate</Text>
              <Text style={[styles.tableHeaderCell, styles.tableRight, { flex: 2 }]}>Amount</Text>
            </View>
            {invoice.items.map((item: InvoiceItem, idx: number) => {
              const amount = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
              return (
                <View key={item.id ?? idx} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                  <View style={{ flex: 3, paddingRight: 6 }}>
                    <Text style={styles.itemDesc}>{item.description || "—"}</Text>
                    {!!item.long_description?.trim() && (
                      <Text style={styles.itemLongDesc}>{item.long_description}</Text>
                    )}
                  </View>
                  <Text style={[styles.tableCell, styles.tableRight, { flex: 1 }]}>{item.qty}</Text>
                  <Text style={[styles.tableCell, styles.tableRight, { flex: 2 }]}>{sym}{formatNum(item.rate)}</Text>
                  <Text style={[styles.tableCell, styles.tableRight, { flex: 2, fontWeight: "600" }]}>{sym}{formatNum(amount)}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Summary card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{sym}{formatNum(invoice.subtotal)}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Discount{invoice.discount_percent && parseFloat(invoice.discount_percent) > 0
                  ? ` (${invoice.discount_percent}%)`
                  : ""}
              </Text>
              <Text style={[styles.summaryValue, { color: "#dc2626" }]}>- {sym}{formatNum(discount)}</Text>
            </View>
          )}
          {tax > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>{sym}{formatNum(tax)}</Text>
            </View>
          )}
          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>TOTAL</Text>
            <Text style={styles.summaryTotalValue}>{sym}{formatNum(invoice.total)}</Text>
          </View>
        </View>

        {/* ── Payment History card ── */}
        {hasPayments && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment History</Text>
            {invoice.payments!.map((p: Payment, idx: number) => (
              <View key={p.id ?? idx} style={styles.paymentRow}>
                <View style={styles.paymentLeft}>
                  <View style={styles.paymentIconWrap}>
                    <Ionicons name="checkmark-circle" size={20} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.paymentMode}>{p.name || p.paymentmode || "Payment"}</Text>
                    <Text style={styles.paymentDate}>{formatDate(p.date)}</Text>
                    {!!p.transactionid?.trim() && (
                      <Text style={styles.paymentTxn}>Txn: {p.transactionid}</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.paymentAmount}>{sym}{formatNum(p.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Notes ── */}
        {(hasClientNote || hasAdminNote) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            {hasClientNote && (
              <View style={styles.noteBox}>
                <View style={styles.noteBoxHeader}>
                  <Ionicons name="person-outline" size={14} color="#2563eb" />
                  <Text style={styles.noteBoxLabel}>Client Note</Text>
                </View>
                <Text style={styles.noteBoxText}>{invoice.clientnote}</Text>
              </View>
            )}
            {hasAdminNote && (
              <View style={[styles.noteBox, styles.noteBoxAmber]}>
                <View style={styles.noteBoxHeader}>
                  <Ionicons name="shield-outline" size={14} color="#d97706" />
                  <Text style={[styles.noteBoxLabel, { color: "#d97706" }]}>Admin Note</Text>
                </View>
                <Text style={[styles.noteBoxText, { color: "#78350f" }]}>{invoice.adminnote}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Record Payment Modal ── */}
      <Modal
        visible={showPayModal}
        animationType="slide"
        transparent
        onRequestClose={() => !payLoading && setShowPayModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => !payLoading && setShowPayModal(false)}
          />
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Record Payment</Text>
                <TouchableOpacity
                  onPress={() => !payLoading && setShowPayModal(false)}
                  style={styles.modalCloseBtn}
                >
                  <Ionicons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
              {invoice && (
                <Text style={styles.modalSubtitle}>{invoiceNumber(invoice)}</Text>
              )}
            </View>

            <ScrollView
              style={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Error banner */}
              {!!payError && (
                <View style={styles.payErrorBanner}>
                  <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
                  <Text style={styles.payErrorText}>{payError}</Text>
                </View>
              )}

              {/* Amount Received */}
              <Text style={styles.fieldLabel}>Amount Received <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputPrefix}>{sym || "AED"}</Text>
                <TextInput
                  style={styles.input}
                  value={payAmount}
                  onChangeText={setPayAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {/* Payment Date */}
              <Text style={styles.fieldLabel}>Payment Date <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrap}>
                <Ionicons name="calendar-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={payDate}
                  onChangeText={setPayDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                />
              </View>

              {/* Payment Mode */}
              <Text style={styles.fieldLabel}>Payment Mode <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={styles.selectorBtn}
                onPress={() => setShowModeList(!showModeList)}
              >
                <Ionicons name="card-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
                <Text style={[styles.selectorText, payModeId ? styles.selectorTextActive : {}]}>
                  {selectedModeName}
                </Text>
                <Ionicons
                  name={showModeList ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#94a3b8"
                />
              </TouchableOpacity>
              {showModeList && (
                <View style={styles.modeList}>
                  {payModes.length === 0 ? (
                    <ActivityIndicator size="small" color="#10b981" style={{ padding: 12 }} />
                  ) : (
                    payModes.map((m, idx) => (
                      <TouchableOpacity
                        key={m.id ? String(m.id) : String(idx)}
                        style={[styles.modeItem, m.id === payModeId && styles.modeItemActive]}
                        onPress={() => { setPayModeId(m.id); setShowModeList(false); }}
                      >
                        {m.id === payModeId && (
                          <Ionicons name="checkmark" size={15} color="#10b981" />
                        )}
                        <Text style={[styles.modeItemText, m.id === payModeId && styles.modeItemTextActive]}>
                          {m.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              {/* Transaction ID */}
              <Text style={styles.fieldLabel}>Transaction ID</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="barcode-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={payTxnId}
                  onChangeText={setPayTxnId}
                  placeholder="Optional"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Admin Note */}
              <Text style={styles.fieldLabel}>Admin Note</Text>
              <View style={[styles.inputWrap, styles.inputWrapMulti]}>
                <TextInput
                  style={[styles.input, styles.inputMulti]}
                  value={payNote}
                  onChangeText={setPayNote}
                  placeholder="Optional note..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, payLoading && styles.submitBtnDisabled]}
                onPress={submitPayment}
                disabled={payLoading}
              >
                {payLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text style={styles.submitBtnText}>Record Payment</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },

  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingBottom: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerSpacer: { width: 36 },

  scrollContent: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },

  heroCard: {
    backgroundColor: "#10b981",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 10,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  heroInvoiceNum: { fontSize: 24, fontWeight: "700", color: "#fff", letterSpacing: 0.5 },
  heroBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  heroBadgeText: { fontSize: 12, fontWeight: "700" },
  heroAmount: { fontSize: 28, fontWeight: "800", color: "#fff", marginTop: 4 },

  recordPayBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#059669",
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  recordPayBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10b981",
    marginBottom: 14,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  dateRow: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  dateCell: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, minWidth: 140 },
  dateIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#d1fae5",
    justifyContent: "center", alignItems: "center",
  },
  dateLabel: { fontSize: 10, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.3, marginBottom: 2 },
  dateValue: { fontSize: 14, fontWeight: "600", color: "#1e293b" },

  tableHeader: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: "#e2e8f0",
    marginBottom: 2,
  },
  tableHeaderCell: { fontSize: 11, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.3, textTransform: "uppercase" },
  tableRight: { textAlign: "right" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    alignItems: "flex-start",
  },
  tableRowAlt: { backgroundColor: "#f8fffe" },
  tableCell: { fontSize: 13, color: "#475569" },
  itemDesc: { fontSize: 13, fontWeight: "500", color: "#1e293b" },
  itemLongDesc: { fontSize: 11, color: "#94a3b8", marginTop: 2, lineHeight: 16 },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  summaryLabel: { fontSize: 14, color: "#64748b" },
  summaryValue: { fontSize: 14, color: "#1e293b", fontWeight: "500" },
  summaryTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#10b981",
    marginTop: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  summaryTotalLabel: { fontSize: 15, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  summaryTotalValue: { fontSize: 18, fontWeight: "800", color: "#fff" },

  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  paymentLeft: { flexDirection: "row", alignItems: "flex-start", gap: 10, flex: 1 },
  paymentIconWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#f0fdf4",
    justifyContent: "center", alignItems: "center",
  },
  paymentMode: { fontSize: 13, fontWeight: "600", color: "#1e293b" },
  paymentDate: { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  paymentTxn: { fontSize: 10, color: "#10b981", marginTop: 1 },
  paymentAmount: { fontSize: 15, fontWeight: "700", color: "#059669", marginLeft: 12 },

  noteBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#2563eb",
  },
  noteBoxAmber: { backgroundColor: "#fffbeb", borderLeftColor: "#d97706", marginBottom: 0 },
  noteBoxHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  noteBoxLabel: { fontSize: 11, fontWeight: "700", color: "#2563eb", letterSpacing: 0.3, textTransform: "uppercase" },
  noteBoxText: { fontSize: 13, color: "#1e3a8a", lineHeight: 19 },

  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60, gap: 12 },
  loadingText: { fontSize: 14, color: "#64748b" },
  emptyText: { fontSize: 15, color: "#94a3b8" },

  // Modal styles
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  modalHandle: { width: 40, height: 4, backgroundColor: "#e2e8f0", borderRadius: 2, alignSelf: "center", marginBottom: 14 },
  modalHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  modalSubtitle: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center", alignItems: "center",
  },

  modalScroll: { paddingHorizontal: 20, paddingTop: 16 },

  payErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  payErrorText: { fontSize: 13, color: "#dc2626", flex: 1 },

  fieldLabel: { fontSize: 12, fontWeight: "700", color: "#475569", marginBottom: 6, marginTop: 14, letterSpacing: 0.2 },
  required: { color: "#dc2626" },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputWrapMulti: { height: undefined, paddingVertical: 10, alignItems: "flex-start" },
  inputPrefix: { fontSize: 14, fontWeight: "600", color: "#475569", marginRight: 6 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: "#1e293b" },
  inputMulti: { minHeight: 72 },

  selectorBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  selectorText: { flex: 1, fontSize: 14, color: "#94a3b8" },
  selectorTextActive: { color: "#1e293b" },

  modeList: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    marginTop: 4,
    overflow: "hidden",
  },
  modeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modeItemActive: { backgroundColor: "#f0fdf4" },
  modeItemText: { fontSize: 14, color: "#1e293b", flex: 1 },
  modeItemTextActive: { color: "#059669", fontWeight: "600" },

  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10b981",
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 20,
    marginBottom: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
