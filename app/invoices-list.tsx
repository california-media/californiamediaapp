import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Invoice } from "./types";
import { fetchInvoices } from "./utils/api";
import { getStaffInfo } from "./utils/config";

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

const formatDate = (d: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export default function InvoicesListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filtered, setFiltered] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = getStaffInfo()?.admin === "1";

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchInvoices();
      setInvoices(data);
      setFiltered(data);
    } catch {
      setInvoices([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(invoices);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      invoices.filter(inv =>
        (inv.number && inv.number.toLowerCase().includes(q)) ||
        (inv.prefix && inv.prefix.toLowerCase().includes(q)) ||
        (inv.clientid && inv.clientid.toLowerCase().includes(q)) ||
        (inv.date && inv.date.toLowerCase().includes(q))
      )
    );
  }, [search, invoices]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderCard = ({ item }: { item: Invoice }) => {
    const st = invoiceStatus(item.status);
    const invoiceNum = `${item.prefix || "INV-"}${item.number}`;
    const isPaid = item.status === "2";
    const isOverdue = item.status === "4" || item.status === "1";
    const amountColor = isPaid ? "#059669" : isOverdue ? "#dc2626" : "#1e293b";

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: st.color }]}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: "/invoice-detail", params: { id: item.id } })}
      >
        {/* Top row: number + status */}
        <View style={styles.cardTop}>
          <Text style={styles.invoiceNum}>{invoiceNum}</Text>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        {/* Middle row: dates */}
        <View style={styles.datesRow}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={13} color="#94a3b8" />
            <Text style={styles.dateLabel}>Date:</Text>
            <Text style={styles.dateValue}>{formatDate(item.date)}</Text>
          </View>
          {item.duedate ? (
            <View style={styles.dateItem}>
              <Ionicons name="alarm-outline" size={13} color="#94a3b8" />
              <Text style={styles.dateLabel}>Due:</Text>
              <Text style={styles.dateValue}>{formatDate(item.duedate)}</Text>
            </View>
          ) : null}
        </View>

        {/* Bottom row: amount */}
        <View style={styles.cardBottom}>
          <Text style={styles.amountLabel}>Total</Text>
          <Text style={[styles.amountValue, { color: amountColor }]}>
            {item.symbol || ""}{(parseFloat(item.total) || 0).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Invoices</Text>
          {filtered.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{filtered.length}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/create-invoice")}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by number, client, date..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading invoices...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="receipt-outline" size={56} color="#cbd5e1" />
              <Text style={styles.emptyText}>No invoices found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },

  header: {
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
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  countBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 20,
  },
  countText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "700",
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center",
    alignItems: "center",
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#1e293b" },

  listContent: { padding: 16, gap: 12 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    paddingLeft: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  invoiceNum: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10b981",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  datesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 10,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateLabel: {
    fontSize: 12,
    color: "#94a3b8",
  },
  dateValue: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },

  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
  },
  amountLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "700",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: { fontSize: 14, color: "#64748b" },
  emptyText: { fontSize: 15, color: "#94a3b8", textAlign: "center" },
});
