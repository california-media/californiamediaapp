import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Deal } from "./types";
import { fetchDealById } from "./utils/api";
import { getAuthToken, getCrmApiUrl, getCrmCookie, getUserId } from "./utils/config";
import { Toast } from "./components/Toast";
import { useToast } from "./utils/useToast";

const fmt = (v: string | null, prefix = "AED ") => {
  const n = parseFloat(v ?? "0");
  if (!n) return "—";
  return prefix + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const STATUS_COLORS: Record<string, string> = {
  "in progress": "#f59e0b",
  "new": "#6366f1",
  "pending payment": "#8b5cf6",
  "closed won": "#10b981",
  "closed lost": "#ef4444",
};
const statusColor = (name: string | null) =>
  STATUS_COLORS[(name ?? "").toLowerCase()] ?? "#6366f1";

export default function DealDetailScreen() {
  const router = useRouter();
  const { showToast, toastMsg, toastType, toastAnim } = useToast();
  const { deal: dealParam } = useLocalSearchParams<{ deal: string }>();
  const [deal, setDeal] = useState<Deal>(JSON.parse(dealParam ?? "{}"));
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (deal.id) {
        fetchDealById(deal.id).then((fresh) => {
          if (fresh) setDeal(fresh);
        });
      }
    }, [deal.id]),
  );

  const sColor = statusColor(deal.status_name);

  const handleDelete = () => {
    Alert.alert(
      "Delete Deal",
      `Delete "${deal.deal_name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const res = await fetch(`${getCrmApiUrl()}/deals/${deal.id}`, {
                method: "DELETE",
                headers: {
                  Authorization: getAuthToken(),
                  "X-User-Id": getUserId(),
                  Cookie: getCrmCookie(),
                  Accept: "application/json",
                },
              });
              if (res.ok || res.status === 200) {
                showToast("Deal deleted successfully.", "success");
                setTimeout(() => router.back(), 1200);
              } else {
                showToast("Failed to delete. Try again.", "error");
              }
            } catch {
              showToast("Network error. Try again.", "error");
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* ── Hero ── */}
      <View style={styles.hero}>
        <TouchableOpacity style={styles.heroBack} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.heroEdit}
          onPress={() => router.push({ pathname: "/add-deal", params: { deal: dealParam } })}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.heroIcon}>
          <Ionicons name="briefcase" size={34} color="#fff" />
        </View>

        <Text style={styles.heroName} numberOfLines={2}>{deal.deal_name}</Text>

        <View style={[styles.heroBadge, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <View style={[styles.heroBadgeDot, { backgroundColor: sColor }]} />
          <Text style={styles.heroBadgeText}>
            {deal.status_name || "New"}
          </Text>
        </View>

        {/* Client call / WA */}
        {deal.client_phone ? (
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Linking.openURL(`tel:${deal.client_phone.replace(/\D/g, "")}`).catch(() => {})}
            >
              <Ionicons name="call" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Call Client</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnWa]}
              onPress={() => Linking.openURL(`https://wa.me/${deal.client_phone.replace(/\D/g, "")}`).catch(() => {})}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>

        {/* Summary chips */}
        <View style={styles.summaryRow}>
          <SummaryChip icon="cash-outline" label="Deal Value" value={fmt(deal.deal_value)} color="#6366f1" />
          <SummaryChip icon="calendar-outline" label="Close Date" value={fmtDate(deal.close_date)} color="#8b5cf6" />
          <SummaryChip icon="checkmark-done-outline" label="Paid" value={fmt(deal.paid_amount)} color="#10b981" />
        </View>

        <Section title="Client Info">
          <Row icon="person-outline" label="Name" value={deal.client_name || "—"} />
          <Row icon="call-outline" label="Phone" value={deal.client_phone || "—"} />
          <Row icon="mail-outline" label="Email" value={deal.client_email || "—"} />
          <Row icon="ribbon-outline" label="Classification" value={deal.client_classification || "—"} />
          <Row icon="pulse-outline" label="Activity" value={deal.client_activity || "—"} />
          <Row icon="globe-outline" label="Country" value={deal.client_country || "—"} />
        </Section>

        <Section title="Deal Info">
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="pulse-outline" size={15} color="#6366f1" />
            </View>
            <Text style={styles.rowLabel}>Status</Text>
            <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 6 }}>
              <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: sColor }} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: sColor }}>{deal.status_name || "—"}</Text>
            </View>
          </View>
          <Row icon="flash-outline" label="Source" value={deal.source_name || deal.deal_source || "—"} />
          <Row icon="layers-outline" label="Type" value={deal.type_name || deal.deal_type || "—"} />
          <Row icon="person-circle-outline" label="Agent" value={deal.agent || "—"} />
          <Row icon="person-outline" label="Added By" value={deal.addedfrom_name || "—"} />
          <Row icon="calendar-outline" label="Date Created" value={fmtDate(deal.datecreated)} />
        </Section>

        <Section title="Property">
          <Row icon="home-outline" label="Project" value={deal.project || "—"} />
          <Row icon="business-outline" label="Developers" value={deal.developers || "—"} />
          <Row icon="bed-outline" label="Unit Type" value={deal.unit_type || "—"} />
          <Row icon="keypad-outline" label="Unit No." value={deal.unit_number || "—"} />
          <Row icon="layers-outline" label="Building" value={deal.building_number || "—"} />
          <Row icon="filter-outline" label="Floor" value={deal.floor_number || "—"} />
          <Row icon="pricetag-outline" label="Unit Price" value={fmt(deal.unit_price)} />
        </Section>

        <Section title="Financials">
          <Row icon="cash-outline" label="Deal Value" value={fmt(deal.deal_value)} />
          <Row icon="arrow-down-circle-outline" label="Down Payment" value={fmt(deal.down_payment)} />
          <Row icon="receipt-outline" label="DLD Fee" value={fmt(deal.dld_fee)} />
          <Row icon="trending-up-outline" label="Total Commission" value={fmt(deal.total_commission)} />
          <Row icon="business-outline" label="Company Comm." value={fmt(deal.company_commission)} />
          <Row icon="share-outline" label="Outside Comm." value={fmt(deal.outside_commission)} />
          <Row icon="person-outline" label="Agent Comm." value={fmt(deal.agent_commission)} />
          <Row icon="checkmark-circle-outline" label="Resolved" value={fmt(deal.resolved_amount)} />
          <Row icon="wallet-outline" label="Admin Fee" value={fmt(deal.admin_fee)} />
          <Row icon="checkmark-done-outline" label="Paid" value={fmt(deal.paid_amount)} />
          <Row icon="alert-circle-outline" label="Unpaid" value={fmt(deal.unpaid_amount)} />
        </Section>

        {/* Delete */}
        <TouchableOpacity
          style={[styles.deleteBtn, deleting && { opacity: 0.6 }]}
          onPress={handleDelete}
          disabled={deleting}
          activeOpacity={0.8}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
              <Text style={styles.deleteBtnText}>Delete Deal</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
      <Toast msg={toastMsg} type={toastType} anim={toastAnim} />
    </View>
  );
}

function SummaryChip({ icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <View style={[styles.chip, { borderColor: color + "33" }]}>
      <View style={[styles.chipIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={[styles.chipValue, { color }]}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Row({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={15} color="#6366f1" />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },

  hero: {
    backgroundColor: "#6366f1",
    paddingTop: 56, paddingBottom: 28, paddingHorizontal: 24,
    alignItems: "center",
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    shadowColor: "#6366f1", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 8,
  },
  heroBack: {
    position: "absolute", top: 52, left: 16,
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center", alignItems: "center",
  },
  heroEdit: {
    position: "absolute", top: 52, right: 16,
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center", alignItems: "center",
  },
  heroIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  heroName: {
    fontSize: 20, fontWeight: "700", color: "#fff",
    marginBottom: 10, textAlign: "center",
  },
  heroBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 16,
  },
  heroBadgeDot: { width: 7, height: 7, borderRadius: 4 },
  heroBadgeText: { fontSize: 13, fontWeight: "600" },
  heroActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12,
  },
  actionBtnWa: { backgroundColor: "#25D366" },
  actionBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 40 },

  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  chip: {
    flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 12,
    alignItems: "center", borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  chipIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 6 },
  chipLabel: { fontSize: 10, color: "#94a3b8", fontWeight: "500", textAlign: "center", marginBottom: 2 },
  chipValue: { fontSize: 12, fontWeight: "700", textAlign: "center" },

  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12, fontWeight: "700", color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, paddingLeft: 4,
  },
  sectionCard: {
    backgroundColor: "#fff", borderRadius: 16, paddingVertical: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  row: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  rowIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: "#eef2ff",
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  rowLabel: { fontSize: 13, color: "#64748b", width: 120 },
  rowValue: { flex: 1, fontSize: 13, color: "#0f172a", fontWeight: "500", textAlign: "right" },

  deleteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#fff", borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: "#fecaca", marginTop: 8,
  },
  deleteBtnText: { fontSize: 15, fontWeight: "600", color: "#ef4444" },
});
