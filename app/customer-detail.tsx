import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { fetchCustomerDetail } from "./utils/api";

interface Contact {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phonenumber: string;
  title: string;
}

interface CustomerDetail {
  id: string;
  company: string;
  phonenumber: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  address: string;
  website: string;
  vat: string;
  active: string;
  datecreated: string;
  billing_street: string;
  billing_city: string;
  billing_state: string;
  billing_zip: string;
  billing_country: string;
  contacts: Contact[];
}

const AVATAR_COLORS = ["#6366f1","#8b5cf6","#ec4899","#ef4444","#f59e0b","#10b981","#06b6d4","#3b82f6"];
const avatarColor = (name: string) => AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

const formatDate = (d: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const Row = ({ icon, label, value }: { icon: string; label: string; value?: string | null }) => {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Ionicons name={icon as any} size={15} color="#94a3b8" style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
};

export default function CustomerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchCustomerDetail(id).then((data) => {
      setCustomer(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={44} color="#fca5a5" />
        <Text style={styles.emptyText}>Customer not found</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const color = avatarColor(customer.company ?? "");
  const isActive = customer.active === "1";

  const billingAddress = [
    customer.billing_street,
    customer.billing_city,
    customer.billing_state,
    customer.billing_zip,
  ].filter(Boolean).join(", ");

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Customer Detail</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={[styles.avatar, { backgroundColor: color + "22" }]}>
            <Text style={[styles.avatarLetter, { color }]}>
              {customer.company?.charAt(0)?.toUpperCase() ?? "?"}
            </Text>
          </View>
          <Text style={styles.companyName}>{customer.company}</Text>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? "#dcfce7" : "#fee2e2" }]}>
            <Text style={[styles.statusText, { color: isActive ? "#16a34a" : "#dc2626" }]}>
              {isActive ? "Active" : "Inactive"}
            </Text>
          </View>

          {customer.phonenumber ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#2563eb" }]}
                onPress={() => Linking.openURL(`tel:${customer.phonenumber.replace(/\D/g, "")}`).catch(() => {})}
              >
                <Ionicons name="call" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#25D366" }]}
                onPress={() => Linking.openURL(`https://wa.me/${customer.phonenumber.replace(/\D/g, "")}`).catch(() => {})}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>WhatsApp</Text>
              </TouchableOpacity>
              {customer.website ? (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#6366f1" }]}
                  onPress={() => {
                    const url = customer.website.startsWith("http") ? customer.website : `https://${customer.website}`;
                    Linking.openURL(url).catch(() => {});
                  }}
                >
                  <Ionicons name="globe-outline" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Website</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <Row icon="call-outline" label="Phone" value={customer.phonenumber} />
          <Row icon="location-outline" label="City" value={customer.city} />
          <Row icon="map-outline" label="Address" value={customer.address} />
          <Row icon="globe-outline" label="Website" value={customer.website} />
          <Row icon="receipt-outline" label="VAT" value={customer.vat} />
          <Row icon="calendar-outline" label="Date Created" value={formatDate(customer.datecreated)} />
          {billingAddress ? (
            <Row icon="home-outline" label="Billing Address" value={billingAddress} />
          ) : null}
        </View>

        {/* Contacts */}
        {customer.contacts && customer.contacts.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contacts ({customer.contacts.length})</Text>
            {customer.contacts.map((c) => (
              <View key={c.id} style={styles.contactCard}>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>
                    {[c.firstname, c.lastname].filter(Boolean).join(" ") || "—"}
                  </Text>
                  {c.title ? <Text style={styles.contactTitle}>{c.title}</Text> : null}
                  {c.email ? <Text style={styles.contactEmail}>{c.email}</Text> : null}
                  {c.phonenumber ? <Text style={styles.contactPhone}>{c.phonenumber}</Text> : null}
                </View>
                {c.phonenumber ? (
                  <View style={styles.contactActions}>
                    <TouchableOpacity
                      style={styles.iconBtnCall}
                      onPress={() => Linking.openURL(`tel:${c.phonenumber.replace(/\D/g, "")}`).catch(() => {})}
                    >
                      <Ionicons name="call" size={13} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconBtnWa}
                      onPress={() => Linking.openURL(`https://wa.me/${c.phonenumber.replace(/\D/g, "")}`).catch(() => {})}
                    >
                      <Ionicons name="logo-whatsapp" size={13} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10, padding: 32 },
  emptyText: { fontSize: 14, color: "#94a3b8", textAlign: "center" },
  retryBtn: { backgroundColor: "#6366f1", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center",
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#0f172a" },

  content: { padding: 16, gap: 12, paddingBottom: 40 },

  heroCard: {
    backgroundColor: "#fff", borderRadius: 16,
    padding: 20, alignItems: "center",
    shadowColor: "#64748b", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  avatar: { width: 64, height: 64, borderRadius: 18, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  avatarLetter: { fontSize: 26, fontWeight: "700" },
  companyName: { fontSize: 18, fontWeight: "700", color: "#0f172a", textAlign: "center", marginBottom: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 16 },
  statusText: { fontSize: 12, fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  actionBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  section: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16,
    shadowColor: "#64748b", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, gap: 10,
  },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },

  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  rowLabel: { fontSize: 11, color: "#94a3b8", marginBottom: 1 },
  rowValue: { fontSize: 14, color: "#1e293b", fontWeight: "500" },

  contactCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#f1f5f9",
  },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  contactTitle: { fontSize: 12, color: "#64748b", marginTop: 1 },
  contactEmail: { fontSize: 12, color: "#6366f1", marginTop: 2 },
  contactPhone: { fontSize: 12, color: "#475569", marginTop: 1 },
  contactActions: { flexDirection: "row", gap: 6 },
  iconBtnCall: { width: 28, height: 28, borderRadius: 8, backgroundColor: "#2563eb", justifyContent: "center", alignItems: "center" },
  iconBtnWa: { width: 28, height: 28, borderRadius: 8, backgroundColor: "#25D366", justifyContent: "center", alignItems: "center" },
});
