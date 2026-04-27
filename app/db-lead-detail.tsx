import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DbLead } from "./types";
import { getAuthToken, getCrmApiUrl, getCrmCookie, getUserId } from "./utils/config";
import { fetchDbLeadStatuses, fetchDbLeadById } from "./utils/api";
import type { LeadStatus } from "./utils/api";

const formatBudget = (budget: string) => {
  const n = parseFloat(budget);
  if (!n) return "—";
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `AED ${(n / 1_000).toFixed(0)}K`;
  return `AED ${n.toLocaleString()}`;
};

const formatDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
};

export default function DbLeadDetailScreen() {
  const router = useRouter();
  const { lead: leadParam } = useLocalSearchParams<{ lead: string }>();
  const [lead, setLead] = useState<DbLead>(JSON.parse(leadParam ?? "{}"));
  const [deleting, setDeleting] = useState(false);
  const [apiStatuses, setApiStatuses] = useState<LeadStatus[]>([]);

  useEffect(() => { fetchDbLeadStatuses().then(setApiStatuses); }, []);

  useFocusEffect(
    useCallback(() => {
      if (lead.id) {
        fetchDbLeadById(lead.id).then((fresh) => {
          if (fresh) setLead(fresh);
        });
      }
    }, [lead.id]),
  );

  const handleCall = () =>
    Linking.openURL(`tel:${lead.mobile_number?.replace(/\D/g, "")}`).catch(() =>
      alert("Could not call"),
    );

  const handleWhatsApp = () =>
    Linking.openURL(`https://wa.me/${lead.mobile_number?.replace(/\D/g, "")}`).catch(() =>
      alert("Could not open WhatsApp"),
    );

  const handleDelete = () => {
    Alert.alert(
      "Delete DB Lead",
      `Delete "${lead.full_name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const res = await fetch(`${getCrmApiUrl()}/db_leads/${lead.id}`, {
                method: "DELETE",
                headers: {
                  Authorization: getAuthToken(),
                  "X-User-Id": getUserId(),
                  Cookie: getCrmCookie(),
                  Accept: "application/json",
                },
              });
              if (res.ok || res.status === 200) {
                Alert.alert("Deleted", "DB lead deleted successfully.", [
                  { text: "OK", onPress: () => router.back() },
                ]);
              } else {
                Alert.alert("Error", "Failed to delete. Try again.");
              }
            } catch {
              Alert.alert("Error", "Network error. Try again.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const initial = lead.full_name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <View style={styles.container}>
      {/* ── Hero ── */}
      <View style={styles.hero}>
        <TouchableOpacity style={styles.heroBack} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.heroEdit}
          onPress={() =>
            router.push({ pathname: "/add-db-lead", params: { lead: leadParam } })
          }
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.heroAvatar}>
          <Text style={styles.heroAvatarText}>{initial}</Text>
        </View>

        <Text style={styles.heroName}>{lead.full_name}</Text>

        {lead.status_name ? (() => {
          const sc = apiStatuses.find(s => s.name.trim() === lead.status_name?.trim())?.color ?? '#6366f1';
          return (
            <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: sc, marginRight: 6 }} />
              <Text style={styles.heroBadgeText}>{lead.status_name}</Text>
            </View>
          );
        })() : null}

        {lead.mobile_number ? (
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
              <Ionicons name="call" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnWa]} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* ── Details ── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Contact Info">
          <Row icon="call-outline" label="Mobile" value={lead.mobile_number || "—"} />
          <Row icon="mail-outline" label="Email" value={lead.email || "—"} />
        </Section>

        <Section title="Lead Info">
          <Row icon="flash-outline" label="Source" value={lead.source_name || "—"} />
          {lead.status_name ? (() => {
            const sc = apiStatuses.find(s => s.name.trim() === lead.status_name?.trim())?.color ?? "#64748b";
            return (
              <View style={styles.row}>
                <View style={styles.rowIcon}>
                  <Ionicons name="pulse-outline" size={16} color="#6366f1" />
                </View>
                <Text style={styles.rowLabel}>Status</Text>
                <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 6 }}>
                  <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: sc }} />
                  <Text style={{ fontSize: 14, fontWeight: "600", color: sc }}>{lead.status_name}</Text>
                </View>
              </View>
            );
          })() : null}
          <Row icon="person-outline" label="Assigned" value={lead.assigned_name || "—"} />
          <Row icon="cash-outline" label="Budget" value={formatBudget(lead.budget)} />
          <Row icon="home-outline" label="Property Status" value={lead.property_status || "—"} />
          <Row icon="bed-outline" label="Unit Type" value={lead.unit_type || "—"} />
          <Row icon="grid-outline" label="Bedrooms" value={lead.bedroom || "—"} />
        </Section>

        <Section title="Location">
          <Row icon="location-outline" label="Area" value={lead.area || "—"} />
          <Row icon="business-outline" label="City" value={lead.city || "—"} />
          {lead.location_preference ? (
            <Row icon="map-outline" label="Preference" value={lead.location_preference} />
          ) : null}
        </Section>

        <Section title="Dates">
          <Row icon="calendar-outline" label="Date Added" value={formatDate(lead.dateadded)} />
          <Row icon="time-outline" label="Last Status Change" value={formatDate(lead.last_status_change)} />
          <Row icon="alarm-outline" label="Expires At" value={formatDate(lead.expires_at)} />
        </Section>

        {lead.notes ? (
          <Section title="Notes">
            <Text style={styles.notesText}>{lead.notes}</Text>
          </Section>
        ) : null}

        {/* Delete button */}
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
              <Text style={styles.deleteBtnText}>Delete DB Lead</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
        <Ionicons name={icon} size={16} color="#6366f1" />
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
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
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
  heroAvatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  heroAvatarText: { fontSize: 32, fontWeight: "700", color: "#fff" },
  heroName: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 8, textAlign: "center" },
  heroBadge: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 16,
  },
  heroBadgeText: { color: "#fff", fontSize: 13, fontWeight: "600" },
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
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  rowIcon: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: "#eef2ff",
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  rowLabel: { fontSize: 13, color: "#64748b", width: 110 },
  rowValue: { flex: 1, fontSize: 14, color: "#0f172a", fontWeight: "500", textAlign: "right" },

  notesText: { fontSize: 14, color: "#334155", lineHeight: 22, padding: 16 },

  deleteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#fff", borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: "#fecaca", marginTop: 8,
  },
  deleteBtnText: { fontSize: 15, fontWeight: "600", color: "#ef4444" },
});
