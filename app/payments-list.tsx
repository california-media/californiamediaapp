import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Payment } from "./types";
import { fetchPayments } from "./utils/api";
import { getStaffInfo } from "./utils/config";

const fmtDate = (d: string) => {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtAmount = (a: string) =>
  parseFloat(a).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PaymentsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filtered, setFiltered] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = getStaffInfo()?.admin === "1";

  const load = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await fetchPayments();
      const sorted = [...data].sort((a, b) => {
        const da = new Date(b.daterecorded || b.date || "").getTime();
        const db = new Date(a.daterecorded || a.date || "").getTime();
        return da - db;
      });
      setPayments(sorted);
      setFiltered(applySearch(sorted, search));
    } catch {
      setPayments([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  const applySearch = (data: Payment[], q: string): Payment[] => {
    if (!q.trim()) return data;
    const lower = q.toLowerCase();
    return data.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(lower) ||
        (p.transactionid || "").toLowerCase().includes(lower) ||
        (p.invoiceid || "").toLowerCase().includes(lower)
    );
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setFiltered(applySearch(payments, search));
  }, [search, payments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  const totalCount = filtered.length;
  const totalAmount = filtered.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payments</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed-outline" size={56} color="#cbd5e1" />
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedSub}>You need admin privileges to view payments.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Summary bar */}
      {!loading && (
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Payments</Text>
            <Text style={styles.summaryValue}>{totalCount}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={[styles.summaryValue, { color: "#16a34a" }]}>
              AED {totalAmount.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by mode, transaction ID, invoice..."
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
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.loadingText}>Loading payments…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />
          }
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="card-outline" size={56} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No payments found</Text>
              {search.length > 0 && (
                <Text style={styles.emptySub}>Try adjusting your search</Text>
              )}
            </View>
          ) : (
            filtered.map((payment) => (
              <TouchableOpacity
                key={payment.id}
                style={styles.card}
                activeOpacity={0.82}
                onPress={() =>
                  router.push({ pathname: "/payment-detail", params: { id: payment.id } })
                }
              >
                <View style={styles.cardInner}>
                  <View style={styles.cardLeft}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="cash" size={22} color="#16a34a" />
                    </View>
                    <View style={styles.cardAmountWrap}>
                      <Text style={styles.cardAmount}>
                        AED {fmtAmount(payment.amount)}
                      </Text>
                      <Text style={styles.cardMode} numberOfLines={1}>
                        {payment.name || "—"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardRight}>
                    <Text style={styles.cardDate}>
                      {fmtDate(payment.daterecorded || payment.date)}
                    </Text>
                    {payment.invoiceid ? (
                      <View style={styles.invBadge}>
                        <Text style={styles.invBadgeText}>INV #{payment.invoiceid}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {!!payment.transactionid && (
                  <Text style={styles.txId} numberOfLines={1}>
                    {payment.transactionid}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f59e0b",
    paddingHorizontal: 12,
    paddingBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },

  summaryBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryLabel: { fontSize: 11, color: "#94a3b8", fontWeight: "600", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.4 },
  summaryValue: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  summaryDivider: { width: 1, backgroundColor: "#e2e8f0", marginVertical: 2 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1e293b" },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4, gap: 10 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, marginRight: 10 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
  },
  cardAmountWrap: { flex: 1 },
  cardAmount: { fontSize: 17, fontWeight: "700", color: "#16a34a" },
  cardMode: { fontSize: 12, color: "#94a3b8", marginTop: 2 },

  cardRight: { alignItems: "flex-end", gap: 6 },
  cardDate: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  invBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  invBadgeText: { fontSize: 10, color: "#d97706", fontWeight: "700" },

  txId: { fontSize: 11, color: "#94a3b8", fontFamily: "monospace", marginTop: 8 },

  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10, paddingTop: 60 },
  loadingText: { fontSize: 14, color: "#64748b" },

  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#94a3b8" },
  emptySub: { fontSize: 13, color: "#cbd5e1" },

  accessDenied: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },
  accessDeniedTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  accessDeniedSub: { fontSize: 14, color: "#94a3b8", textAlign: "center" },
});
