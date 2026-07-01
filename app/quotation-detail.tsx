import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { buildAuthHeaders, convertProposal, fetchProposal } from "./utils/api";
import { getCrmBaseUrl } from "./utils/config";
import { Proposal, ProposalItem } from "./types";

const proposalStatus = (s: string): { label: string; color: string; bg: string } => {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    "1": { label: "Draft",    color: "#64748b", bg: "#f1f5f9" },
    "2": { label: "Sent",     color: "#2563eb", bg: "#eff6ff" },
    "3": { label: "Revised",  color: "#d97706", bg: "#fffbeb" },
    "4": { label: "Declined", color: "#dc2626", bg: "#fef2f2" },
    "5": { label: "Accepted", color: "#059669", bg: "#f0fdf4" },
    "6": { label: "Expired",  color: "#7c3aed", bg: "#f5f3ff" },
  };
  return map[s] ?? { label: "Unknown", color: "#64748b", bg: "#f1f5f9" };
};

const formatDate = (d: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const fmt = (val: string | number | undefined, decimals = 2) => {
  const n = parseFloat(String(val ?? "0")) || 0;
  return n.toLocaleString("en-AE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

// ─── Convert Form Modal ──────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().slice(0, 10);
const plusDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

function ConvertFormModal({
  visible,
  type,
  proposal,
  onClose,
  onSuccess,
  setConverting,
}: {
  visible: boolean;
  type: "invoice" | "estimate";
  proposal: Proposal;
  onClose: () => void;
  onSuccess: () => void;
  setConverting: (v: boolean) => void;
}) {
  const insets = useSafeAreaInsets();
  const isInvoice = type === "invoice";
  const title = isInvoice ? "Convert to Invoice" : "Convert to Sales Order";
  const symbol = (proposal as any).symbol || "AED";
  const items: ProposalItem[] = Array.isArray(proposal.items) ? proposal.items : [];
  const subtotal = parseFloat(proposal.subtotal) || 0;
  const totalTax = parseFloat(proposal.total_tax) || 0;
  const grandTotal = parseFloat(proposal.total) || 0;
  const discountTotal = parseFloat(proposal.discount_total) || 0;
  const idPadded = String(proposal.id).padStart(5, "0");

  const [date, setDate] = useState(todayStr());
  const [secondDate, setSecondDate] = useState(plusDays(7));
  const [submitting, setSubmitting] = useState(false);

  const alreadyConverted = isInvoice
    ? !!(proposal as any).invoice_id
    : !!(proposal as any).estimate_id;

  const handleSubmit = async () => {
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert("Invalid date", "Use YYYY-MM-DD format.");
      return;
    }
    if (!secondDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert("Invalid date", "Use YYYY-MM-DD format.");
      return;
    }
    setSubmitting(true);
    setConverting(true);
    const params = isInvoice
      ? { date, duedate: secondDate }
      : { date, expirydate: secondDate };
    const result = await convertProposal(proposal.id, type, params);
    setSubmitting(false);
    setConverting(false);
    if (result.status) {
      const docId = isInvoice ? result.invoice_id : result.estimate_id;
      Alert.alert(
        "Success",
        `${isInvoice ? "Invoice" : "Sales Order"} #${docId} created successfully.`,
        [{ text: "OK", onPress: onSuccess }]
      );
    } else {
      Alert.alert("Error", result.message || "Conversion failed. Try again.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[cf.wrapper, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={cf.header}>
            <TouchableOpacity onPress={onClose} style={cf.closeBtn}>
              <Ionicons name="close" size={22} color="#1e293b" />
            </TouchableOpacity>
            <Text style={cf.headerTitle}>{title}</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            contentContainerStyle={[cf.content, { paddingBottom: insets.bottom + 32 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {alreadyConverted && (
              <View style={cf.alreadyBanner}>
                <Ionicons name="checkmark-circle" size={18} color="#059669" />
                <Text style={cf.alreadyText}>
                  Already converted to {isInvoice ? "invoice" : "sales order"} #{(proposal as any)[isInvoice ? "invoice_id" : "estimate_id"]}
                </Text>
              </View>
            )}

            {/* Quotation reference */}
            <View style={cf.refRow}>
              <Text style={cf.refLabel}>From Quotation</Text>
              <Text style={cf.refValue}>Q-{idPadded}</Text>
            </View>

            {/* Customer */}
            <View style={cf.fieldBlock}>
              <Text style={cf.fieldLabel}>CUSTOMER</Text>
              <View style={cf.readonlyChip}>
                <Ionicons name="person-outline" size={15} color="#6366f1" />
                <Text style={cf.readonlyValue}>{proposal.proposal_to || "—"}</Text>
              </View>
            </View>

            {/* Currency */}
            <View style={cf.fieldBlock}>
              <Text style={cf.fieldLabel}>CURRENCY</Text>
              <View style={cf.readonlyChip}>
                <Ionicons name="cash-outline" size={15} color="#6366f1" />
                <Text style={cf.readonlyValue}>{symbol}</Text>
              </View>
            </View>

            {/* Dates row */}
            <View style={cf.datesRow}>
              <View style={[cf.fieldBlock, { flex: 1 }]}>
                <Text style={cf.fieldLabel}>{isInvoice ? "INVOICE DATE *" : "ORDER DATE *"}</Text>
                <TextInput
                  style={cf.dateInput}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
              <View style={[cf.fieldBlock, { flex: 1 }]}>
                <Text style={cf.fieldLabel}>{isInvoice ? "DUE DATE *" : "EXPIRY DATE *"}</Text>
                <TextInput
                  style={cf.dateInput}
                  value={secondDate}
                  onChangeText={setSecondDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </View>

            {/* Items */}
            {items.length > 0 && (
              <View style={cf.fieldBlock}>
                <Text style={cf.fieldLabel}>ITEMS ({items.length})</Text>
                <View style={cf.itemsCard}>
                  {items.map((item, idx) => {
                    const qty = parseFloat(item.qty) || 0;
                    const rate = parseFloat(item.rate) || 0;
                    const total = qty * rate;
                    return (
                      <View
                        key={item.id ?? idx}
                        style={[cf.itemRow, idx < items.length - 1 && cf.itemBorder]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={cf.itemDesc}>{item.description || "—"}</Text>
                          {item.long_description ? (
                            <Text style={cf.itemSub} numberOfLines={1}>{item.long_description}</Text>
                          ) : null}
                        </View>
                        <Text style={cf.itemQty}>{item.qty}×</Text>
                        <Text style={cf.itemAmount}>{total.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Totals */}
            <View style={cf.totalsCard}>
              <View style={cf.totalRow}>
                <Text style={cf.totalLabel}>Subtotal</Text>
                <Text style={cf.totalVal}>{symbol} {subtotal.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              </View>
              {discountTotal > 0 && (
                <View style={cf.totalRow}>
                  <Text style={cf.totalLabel}>Discount</Text>
                  <Text style={[cf.totalVal, { color: "#dc2626" }]}>-{symbol} {discountTotal.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                </View>
              )}
              {totalTax > 0 && (
                <View style={cf.totalRow}>
                  <Text style={cf.totalLabel}>Tax</Text>
                  <Text style={cf.totalVal}>{symbol} {totalTax.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                </View>
              )}
              <View style={[cf.totalRow, cf.grandRow]}>
                <Text style={cf.grandLabel}>TOTAL</Text>
                <Text style={cf.grandVal}>{symbol} {grandTotal.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[cf.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="git-merge-outline" size={18} color="#fff" />
                  <Text style={cf.submitText}>{title}</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const cf = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#f1f5f9",
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: "#1e293b", textAlign: "center" },

  content: { padding: 16, gap: 0 },

  alreadyBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#f0fdf4", borderRadius: 10,
    padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: "#bbf7d0",
  },
  alreadyText: { fontSize: 13, color: "#059669", fontWeight: "600", flex: 1 },

  refRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#eef2ff", borderRadius: 10, padding: 12, marginBottom: 16,
  },
  refLabel: { fontSize: 12, color: "#6366f1", fontWeight: "600" },
  refValue: { fontSize: 14, color: "#6366f1", fontWeight: "800", letterSpacing: 0.5 },

  fieldBlock: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 10, fontWeight: "800", color: "#94a3b8",
    letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase",
  },
  readonlyChip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fff", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1.5, borderColor: "#e2e8f0",
  },
  readonlyValue: { fontSize: 14, color: "#1e293b", fontWeight: "500" },

  datesRow: { flexDirection: "row", gap: 12 },
  dateInput: {
    backgroundColor: "#fff", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1.5, borderColor: "#e2e8f0",
    fontSize: 14, color: "#1e293b", fontWeight: "500",
  },

  itemsCard: {
    backgroundColor: "#fff", borderRadius: 12,
    borderWidth: 1, borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  itemRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  itemDesc: { fontSize: 13, fontWeight: "600", color: "#1e293b" },
  itemSub: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  itemQty: { fontSize: 12, color: "#64748b", marginHorizontal: 10 },
  itemAmount: { fontSize: 13, fontWeight: "700", color: "#1e293b", minWidth: 70, textAlign: "right" },

  totalsCard: {
    backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1, borderColor: "#e2e8f0",
    padding: 14, marginBottom: 20,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  totalLabel: { fontSize: 13, color: "#64748b" },
  totalVal: { fontSize: 13, color: "#1e293b", fontWeight: "500" },
  grandRow: {
    marginTop: 6, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: "#e2e8f0",
  },
  grandLabel: { fontSize: 15, fontWeight: "800", color: "#1e293b" },
  grandVal: { fontSize: 16, fontWeight: "800", color: "#6366f1" },

  submitBtn: {
    backgroundColor: "#6366f1", borderRadius: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16,
    shadowColor: "#6366f1", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  submitText: { fontSize: 16, fontWeight: "800", color: "#fff" },
});

// ─── PDF Modal ─────────────────────────────────────────────────────────────

function PdfModal({
  visible,
  onClose,
  proposal,
}: {
  visible: boolean;
  onClose: () => void;
  proposal: Proposal;
}) {
  const insets = useSafeAreaInsets();
  const symbol = (proposal as any).symbol || "AED";
  const items: ProposalItem[] = Array.isArray(proposal.items) ? proposal.items : [];
  const subtotal = parseFloat(proposal.subtotal) || 0;
  const discountTotal = parseFloat(proposal.discount_total) || 0;
  const totalTax = parseFloat(proposal.total_tax) || 0;
  const grandTotal = parseFloat(proposal.total) || 0;
  const idPadded = String(proposal.id).padStart(6, "0");

  const [downloading, setDownloading] = useState(false);

  const openInBrowser = async () => {
    const base = getCrmBaseUrl();
    if (base && proposal.hash) {
      await WebBrowser.openBrowserAsync(`${base}/proposals/${proposal.hash}`);
    }
  };

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const base = getCrmBaseUrl();
      const url = `${base}/proposals/pdf/${proposal.id}`;
      const filename = `Quotation-Q-${idPadded}.pdf`;
      const fileUri = FileSystem.documentDirectory + filename;

      // Filter out null/undefined header values; override Accept for PDF
      const rawHeaders = buildAuthHeaders();
      const headers: Record<string, string> = { Accept: "*/*" };
      Object.entries(rawHeaders).forEach(([k, v]) => {
        if (v != null && v !== "" && k !== "Accept") headers[k] = String(v);
      });

      const result = await FileSystem.downloadAsync(url, fileUri, { headers });

      if (result.status === 200) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(result.uri, {
            mimeType: "application/pdf",
            dialogTitle: `Quotation Q-${idPadded}`,
            UTI: "com.adobe.pdf",
          });
        } else {
          Alert.alert("Downloaded", `Saved to: ${result.uri}`);
        }
      } else {
        // PDF route failed — fall back to opening in browser
        Alert.alert(
          "Download unavailable",
          `Could not download (status ${result.status}). Open in browser instead?`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open in Browser", onPress: openInBrowser },
          ]
        );
      }
    } catch (e: any) {
      console.error("PDF download error:", e);
      Alert.alert(
        "Download failed",
        "Open in browser to save the PDF?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open in Browser", onPress: openInBrowser },
        ]
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[pdf.wrapper, { paddingTop: insets.top }]}>
        {/* PDF Modal Header */}
        <View style={pdf.topBar}>
          <TouchableOpacity onPress={onClose} style={pdf.topBtn}>
            <Ionicons name="close" size={22} color="#1e293b" />
          </TouchableOpacity>
          <Text style={pdf.topTitle}>Quotation PDF</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={downloadPdf}
              style={[pdf.topBtn, downloading && { opacity: 0.5 }]}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <Ionicons name="download-outline" size={20} color="#6366f1" />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={openInBrowser} style={pdf.topBtn}>
              <Ionicons name="open-outline" size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={pdf.scroll}
          contentContainerStyle={[pdf.page, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Company Header ── */}
          <View style={pdf.companyHeader}>
            <View style={pdf.companyLeft}>
              <View style={pdf.logoBox}>
                <Text style={pdf.logoLetter}>M</Text>
              </View>
              <View>
                <View style={pdf.companyNameRow}>
                  <Text style={pdf.companyName}>California </Text>
                  <Text style={[pdf.companyName, { color: "#e91e8c" }]}>Media</Text>
                </View>
                <Text style={pdf.companyTagline}>design, develop, deliver</Text>
              </View>
            </View>
            <View style={pdf.quotationLabel}>
              <Text style={pdf.quotationTitle}>QUOTATION</Text>
              <Text style={pdf.quotationNum}>Q-{idPadded}</Text>
            </View>
          </View>

          {/* Company address */}
          <View style={pdf.companyAddress}>
            <Text style={pdf.addressLine}>607, Al Moosa Tower, Trade Center</Text>
            <Text style={pdf.addressLine}>Sheikh Zayed Road, Dubai</Text>
            <Text style={pdf.addressLine}>Tel: +971 55 8894 938</Text>
            <Text style={pdf.addressLine}>TRN: 100375164900003</Text>
          </View>

          <View style={pdf.divider} />

          {/* ── Bill To + Metadata ── */}
          <View style={pdf.billingRow}>
            <View style={pdf.billTo}>
              <Text style={pdf.billToTitle}>BILL TO</Text>
              <Text style={pdf.billToName}>{proposal.proposal_to || "—"}</Text>
              {proposal.address ? (
                <Text style={pdf.billToLine}>{proposal.address}</Text>
              ) : null}
              {proposal.phone ? (
                <Text style={pdf.billToLine}>{proposal.phone}</Text>
              ) : null}
              {proposal.email ? (
                <Text style={pdf.billToLine}>{proposal.email}</Text>
              ) : null}
            </View>
            <View style={pdf.metaBox}>
              <View style={pdf.metaRow}>
                <Text style={pdf.metaLabel}>Subject:</Text>
                <Text style={pdf.metaValue} numberOfLines={2}>{proposal.subject || "—"}</Text>
              </View>
              <View style={pdf.metaRow}>
                <Text style={pdf.metaLabel}>Date:</Text>
                <Text style={pdf.metaValue}>{formatDate(proposal.date)}</Text>
              </View>
              {proposal.open_till ? (
                <View style={pdf.metaRow}>
                  <Text style={pdf.metaLabel}>Open Till:</Text>
                  <Text style={pdf.metaValue}>{formatDate(proposal.open_till)}</Text>
                </View>
              ) : null}
              <View style={pdf.metaRow}>
                <Text style={pdf.metaLabel}>Currency:</Text>
                <Text style={pdf.metaValue}>{symbol}</Text>
              </View>
            </View>
          </View>

          {/* ── Items & Services ── */}
          {items.length > 0 && (
            <View style={pdf.itemsSection}>
              <Text style={pdf.itemsSectionTitle}>ITEMS & SERVICES</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  {/* Table header */}
                  <View style={pdf.tableHead}>
                    <Text style={[pdf.thCell, { width: 28 }]}>#</Text>
                    <Text style={[pdf.thCell, { width: 180 }]}>DESCRIPTION</Text>
                    <Text style={[pdf.thCell, { width: 42, textAlign: "center" }]}>QTY</Text>
                    <Text style={[pdf.thCell, { width: 76, textAlign: "right" }]}>UNIT PRICE</Text>
                    <Text style={[pdf.thCell, { width: 64, textAlign: "right" }]}>TOTAL</Text>
                    <Text style={[pdf.thCell, { width: 48, textAlign: "right" }]}>VAT</Text>
                    <Text style={[pdf.thCell, { width: 76, textAlign: "right" }]}>TOTAL PRICE</Text>
                  </View>
                  {/* Table rows */}
                  {items.map((item, idx) => {
                    const qty = parseFloat(item.qty) || 0;
                    const rate = parseFloat(item.rate) || 0;
                    const lineTotal = qty * rate;
                    const vat = 0; // per-item VAT not in API — shown in footer
                    return (
                      <View
                        key={item.id ?? idx}
                        style={[pdf.tableRow, idx % 2 === 0 && pdf.tableRowAlt]}
                      >
                        <Text style={[pdf.tdCell, { width: 28, color: "#64748b" }]}>
                          {String(idx + 1).padStart(2, "0")}
                        </Text>
                        <View style={{ width: 180 }}>
                          <Text style={[pdf.tdCell, { fontWeight: "600" }]}>
                            {item.description || "—"}
                          </Text>
                          {item.long_description ? (
                            <Text style={pdf.tdSub}>{item.long_description}</Text>
                          ) : null}
                        </View>
                        <Text style={[pdf.tdCell, { width: 42, textAlign: "center" }]}>
                          {item.qty}
                        </Text>
                        <Text style={[pdf.tdCell, { width: 76, textAlign: "right" }]}>
                          {fmt(rate)}
                        </Text>
                        <Text style={[pdf.tdCell, { width: 64, textAlign: "right" }]}>
                          {fmt(lineTotal)}
                        </Text>
                        <Text style={[pdf.tdCell, { width: 48, textAlign: "right" }]}>
                          {fmt(vat)}
                        </Text>
                        <Text style={[pdf.tdCell, { width: 76, textAlign: "right", fontWeight: "700" }]}>
                          {fmt(lineTotal)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}

          {/* ── Bank Details + Totals ── */}
          <View style={pdf.bottomSection}>
            {/* Bank Details */}
            <View style={pdf.bankDetails}>
              <Text style={pdf.bankTitle}>BANK DETAILS</Text>
              <Text style={pdf.bankLine}>Bank Name: Emirates NBD</Text>
              <Text style={pdf.bankLine}>Account Name: CALIFORNIA MEDIA LLC</Text>
              <Text style={pdf.bankLine}>Account No: 1014660203901 (AED)</Text>
              <Text style={pdf.bankLine}>IBAN No (AED): AE370260001014660203901</Text>
              <Text style={pdf.bankLine}>Swift Code: EBILAEAD</Text>
            </View>

            {/* Totals */}
            <View style={pdf.totalsBox}>
              <View style={pdf.totalRow}>
                <Text style={pdf.totalLabel}>SUB-TOTAL</Text>
                <Text style={pdf.totalValue}>{fmt(subtotal)}</Text>
              </View>
              {discountTotal > 0 && (
                <View style={pdf.totalRow}>
                  <Text style={pdf.totalLabel}>
                    DISCOUNT{proposal.discount_percent ? ` (${proposal.discount_percent}%)` : ""}
                  </Text>
                  <Text style={[pdf.totalValue, { color: "#dc2626" }]}>
                    -{fmt(discountTotal)}
                  </Text>
                </View>
              )}
              <View style={pdf.totalRow}>
                <Text style={pdf.totalLabel}>
                  VAT{totalTax > 0 ? ` (${fmt(totalTax / subtotal * 100, 0)}%)` : ""}
                </Text>
                <Text style={pdf.totalValue}>{fmt(totalTax)}</Text>
              </View>
              <View style={[pdf.totalRow, pdf.grandTotalRow]}>
                <Text style={pdf.grandTotalLabel}>TOTAL ({symbol})</Text>
                <Text style={pdf.grandTotalValue}>{fmt(grandTotal)}</Text>
              </View>
            </View>
          </View>

          {/* ── Terms & Conditions ── */}
          <View style={pdf.termsSection}>
            <Text style={pdf.termsTitle}>TERMS &amp; CONDITIONS</Text>
            {[
              "Payment Terms: 50% Advance + 50% Upon Completion",
              "50% of the total invoice amount is due upon signing of this proposal.",
              "Remaining 50% is due upon project completion and before final delivery.",
              "Work will begin only after receipt of the initial 50% payment.",
              "No refunds on the advance payment once the project has commenced.",
              "All prices are inclusive of VAT where applicable.",
              "This proposal is valid for 30 days from the date of issue.",
            ].map((term, i) => (
              <View key={i} style={pdf.termRow}>
                <Text style={pdf.termBullet}>•</Text>
                <Text style={pdf.termText}>{term}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.sectionCard}>{children}</View>;
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | null;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
}) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      {icon && (
        <View style={styles.infoIconWrap}>
          <Ionicons name={icon} size={16} color="#6366f1" />
        </View>
      )}
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function QuotationDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [converting, setConverting] = useState(false);
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [convertType, setConvertType] = useState<"invoice" | "estimate">("invoice");

  const load = async () => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await fetchProposal(id);
      setProposal(data);
    } catch {
      setProposal(null);
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

  const symbol = (proposal as any)?.symbol || "AED";
  const idPadded = proposal ? String(proposal.id).padStart(5, "0") : "";
  const st = proposal ? proposalStatus(proposal.status) : null;

  const headerStyle = [styles.header, { paddingTop: insets.top + 12 }];

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={headerStyle}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quotation Detail</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading quotation...</Text>
        </View>
      </View>
    );
  }

  if (!proposal) {
    return (
      <View style={styles.container}>
        <View style={headerStyle}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quotation Detail</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.center}>
          <Ionicons name="document-text-outline" size={56} color="#cbd5e1" />
          <Text style={styles.notFoundTitle}>Quotation not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const items: ProposalItem[] = Array.isArray(proposal.items) ? proposal.items : [];
  const subtotal = parseFloat(proposal.subtotal) || 0;
  const discountTotal = parseFloat(proposal.discount_total) || 0;
  const totalTax = parseFloat(proposal.total_tax) || 0;
  const grandTotal = parseFloat(proposal.total) || 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={headerStyle}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quotation Detail</Text>
        <View style={styles.headerActions}>
          {/* Convert button */}
          <TouchableOpacity
            style={styles.convertBtn}
            disabled={converting}
            onPress={() => {
              Alert.alert(
                "Convert Q-" + idPadded,
                "Choose conversion type:",
                [
                  {
                    text: "Sales Order",
                    onPress: () => { setConvertType("estimate"); setShowConvertForm(true); },
                  },
                  {
                    text: "Invoice",
                    onPress: () => { setConvertType("invoice"); setShowConvertForm(true); },
                  },
                  { text: "Cancel", style: "cancel" },
                ]
              );
            }}
          >
            {converting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="git-merge-outline" size={16} color="#fff" />
                <Text style={styles.convertBtnText}>Convert</Text>
              </>
            )}
          </TouchableOpacity>
          {/* PDF button */}
          <TouchableOpacity style={styles.pdfBtn} onPress={() => setShowPdf(true)}>
            <Ionicons name="document-text" size={18} color="#fff" />
            <Text style={styles.pdfBtnText}>PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 48 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hero card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroId}>Q-{idPadded}</Text>
          <Text style={styles.heroSubject}>{proposal.subject || "—"}</Text>
          {st && (
            <View style={[styles.heroBadge, { backgroundColor: st.bg }]}>
              <Text style={[styles.heroBadgeText, { color: st.color }]}>{st.label}</Text>
            </View>
          )}
        </View>

        {/* 2. Client Info */}
        <SectionCard>
          <SectionTitle title="Client Information" />
          <InfoRow icon="person-outline" label="Client Name" value={proposal.proposal_to} />
          <InfoRow icon="mail-outline" label="Email" value={proposal.email} />
          <InfoRow icon="call-outline" label="Phone" value={proposal.phone} />
          <InfoRow icon="location-outline" label="Address" value={proposal.address} />
        </SectionCard>

        {/* 3. Dates */}
        <SectionCard>
          <SectionTitle title="Dates" />
          <InfoRow icon="calendar-outline" label="Date" value={formatDate(proposal.date)} />
          {proposal.open_till ? (
            <InfoRow icon="time-outline" label="Open Till" value={formatDate(proposal.open_till)} />
          ) : null}
        </SectionCard>

        {/* 4. Items & Services */}
        {items.length > 0 && (
          <SectionCard>
            <SectionTitle title="Items & Services" />
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colDescription]}>Description</Text>
              <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableHeaderText, styles.colRate]}>Rate</Text>
              <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
            </View>
            {items.map((item, idx) => {
              const qty = parseFloat(item.qty) || 0;
              const rate = parseFloat(item.rate) || 0;
              const amount = qty * rate;
              return (
                <View
                  key={item.id ?? idx}
                  style={[styles.tableRow, idx < items.length - 1 && styles.tableRowBorder]}
                >
                  <View style={styles.colDescription}>
                    <Text style={styles.itemDescription}>{item.description || "—"}</Text>
                    {item.long_description ? (
                      <Text style={styles.itemLongDescription}>{item.long_description}</Text>
                    ) : null}
                  </View>
                  <Text style={[styles.tableCell, styles.colQty]}>{item.qty}</Text>
                  <Text style={[styles.tableCell, styles.colRate]}>
                    {rate.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={[styles.tableCell, styles.colAmount, styles.amountCell]}>
                    {amount.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              );
            })}
          </SectionCard>
        )}

        {/* 5. Summary */}
        <SectionCard>
          <SectionTitle title="Summary" />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{symbol} {fmt(subtotal)}</Text>
          </View>
          {discountTotal > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Discount{proposal.discount_percent ? ` (${proposal.discount_percent}%)` : ""}
              </Text>
              <Text style={[styles.summaryValue, styles.discountValue]}>
                -{symbol} {fmt(discountTotal)}
              </Text>
            </View>
          )}
          {totalTax > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Tax</Text>
              <Text style={styles.summaryValue}>{symbol} {fmt(totalTax)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>{symbol} {fmt(grandTotal)}</Text>
          </View>
        </SectionCard>
      </ScrollView>

      {/* Convert Form Modal */}
      {showConvertForm && (
        <ConvertFormModal
          visible={showConvertForm}
          type={convertType}
          proposal={proposal}
          onClose={() => setShowConvertForm(false)}
          onSuccess={() => { setShowConvertForm(false); load(); }}
          setConverting={setConverting}
        />
      )}

      {/* PDF Modal */}
      {showPdf && (
        <PdfModal
          visible={showPdf}
          onClose={() => setShowPdf(false)}
          proposal={proposal}
        />
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },

  header: {
    backgroundColor: "#6366f1",
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#fff" },
  headerSpacer: { width: 36 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  convertBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    minWidth: 36,
    justifyContent: "center",
  },
  convertBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  pdfBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  pdfBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 12 },
  loadingText: { fontSize: 14, color: "#64748b" },
  notFoundTitle: { fontSize: 17, fontWeight: "600", color: "#64748b" },
  backButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  backButtonText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  scrollContent: { padding: 16, gap: 12 },

  heroCard: {
    backgroundColor: "#6366f1",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 4,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  heroId: { fontSize: 22, fontWeight: "800", color: "#fff", letterSpacing: 1, marginBottom: 6 },
  heroSubject: { fontSize: 15, fontWeight: "500", color: "rgba(255,255,255,0.85)", textAlign: "center", marginBottom: 12 },
  heroBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  heroBadgeText: { fontSize: 12, fontWeight: "700" },

  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6366f1",
    letterSpacing: 0.5,
    marginBottom: 14,
    textTransform: "uppercase",
  },

  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 10, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.4, marginBottom: 2 },
  infoValue: { fontSize: 14, color: "#1e293b", fontWeight: "500" },

  tableHeader: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: "#e2e8f0",
    marginBottom: 4,
  },
  tableHeaderText: { fontSize: 11, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" },
  tableRow: { flexDirection: "row", paddingVertical: 10, alignItems: "flex-start" },
  tableRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  colDescription: { flex: 3 },
  colQty: { flex: 0.7, textAlign: "center" },
  colRate: { flex: 1.2, textAlign: "right" },
  colAmount: { flex: 1.3, textAlign: "right" },
  tableCell: { fontSize: 13, color: "#475569" },
  itemDescription: { fontSize: 13, fontWeight: "600", color: "#1e293b", marginBottom: 2 },
  itemLongDescription: { fontSize: 12, color: "#94a3b8", lineHeight: 16 },
  amountCell: { fontWeight: "600", color: "#1e293b" },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  summaryLabel: { fontSize: 14, color: "#64748b" },
  summaryValue: { fontSize: 14, fontWeight: "500", color: "#1e293b" },
  discountValue: { color: "#dc2626" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#6366f1",
    marginTop: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  totalLabel: { fontSize: 14, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  totalValue: { fontSize: 16, fontWeight: "800", color: "#fff" },
});

// ─── PDF Styles ──────────────────────────────────────────────────────────────

const pdf = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#e8e8e8" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    gap: 12,
  },
  topBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  topTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: "#1e293b", textAlign: "center" },

  scroll: { flex: 1 },
  page: {
    margin: 12,
    backgroundColor: "#fff",
    borderRadius: 4,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  // Company header
  companyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  companyLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBox: {
    width: 44,
    height: 44,
    backgroundColor: "#e91e8c",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  logoLetter: { fontSize: 22, fontWeight: "800", color: "#fff" },
  companyNameRow: { flexDirection: "row" },
  companyName: { fontSize: 18, fontWeight: "800", color: "#1e293b" },
  companyTagline: { fontSize: 10, color: "#94a3b8", fontStyle: "italic", marginTop: 2 },
  quotationLabel: { alignItems: "flex-end" },
  quotationTitle: { fontSize: 20, fontWeight: "800", color: "#6366f1", letterSpacing: 1 },
  quotationNum: { fontSize: 13, color: "#64748b", marginTop: 2 },

  companyAddress: { marginBottom: 12 },
  addressLine: { fontSize: 11, color: "#64748b", lineHeight: 17 },

  divider: { height: 1, backgroundColor: "#e2e8f0", marginBottom: 14 },

  // Bill To row
  billingRow: { flexDirection: "row", gap: 12, marginBottom: 18 },
  billTo: { flex: 1 },
  billToTitle: { fontSize: 11, fontWeight: "800", color: "#475569", letterSpacing: 0.5, marginBottom: 6 },
  billToName: { fontSize: 13, fontWeight: "700", color: "#1e293b", marginBottom: 3 },
  billToLine: { fontSize: 11, color: "#64748b", lineHeight: 16 },
  metaBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 10,
    gap: 5,
  },
  metaRow: { flexDirection: "row", gap: 4 },
  metaLabel: { fontSize: 11, color: "#64748b", fontWeight: "600", minWidth: 64 },
  metaValue: { fontSize: 11, color: "#1e293b", flex: 1 },

  // Items table
  itemsSection: { marginBottom: 18 },
  itemsSectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6366f1",
    letterSpacing: 0.5,
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#6366f1",
    paddingBottom: 4,
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginBottom: 2,
  },
  thCell: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tableRowAlt: { backgroundColor: "#fafafa" },
  tdCell: { fontSize: 11, color: "#334155" },
  tdSub: { fontSize: 10, color: "#94a3b8", marginTop: 2 },

  // Bottom: bank + totals
  bottomSection: { flexDirection: "row", gap: 16, marginBottom: 20, marginTop: 8 },
  bankDetails: { flex: 1 },
  bankTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6366f1",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  bankLine: { fontSize: 10, color: "#475569", lineHeight: 16 },
  totalsBox: { flex: 1 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  totalLabel: { fontSize: 11, color: "#64748b", fontWeight: "500" },
  totalValue: { fontSize: 11, color: "#1e293b", fontWeight: "600" },
  grandTotalRow: {
    backgroundColor: "#1e293b",
    borderRadius: 4,
    paddingHorizontal: 8,
    marginTop: 4,
    borderBottomWidth: 0,
  },
  grandTotalLabel: { fontSize: 12, fontWeight: "800", color: "#fff" },
  grandTotalValue: { fontSize: 13, fontWeight: "800", color: "#fff" },

  // Terms
  termsSection: { borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 14 },
  termsTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6366f1",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  termRow: { flexDirection: "row", gap: 6, marginBottom: 4 },
  termBullet: { fontSize: 11, color: "#64748b", marginTop: 1 },
  termText: { fontSize: 10, color: "#475569", flex: 1, lineHeight: 15 },
});
