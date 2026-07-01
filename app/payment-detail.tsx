import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Payment } from "./types";
import { fetchPayment } from "./utils/api";

const fmtDate = (d: string) => {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtAmount = (amount: string) =>
  parseFloat(amount).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function DetailRow({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value && value !== "0") return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, mono && styles.detailValueMono]} numberOfLines={0}>
        {value || "—"}
      </Text>
    </View>
  );
}

export default function PaymentDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await fetchPayment(id);
      setPayment(data);
    } catch {
      setPayment(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  const headerStyle = [styles.header, { paddingTop: insets.top + 12 }];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={headerStyle}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Detail</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.loadingText}>Loading payment…</Text>
        </View>
      ) : !payment ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={56} color="#cbd5e1" />
          <Text style={styles.errorText}>Payment not found</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 48 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Hero card */}
          <View style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="cash" size={32} color="#fff" />
            </View>
            <Text style={styles.heroAmount}>
              AED {fmtAmount(payment.amount)}
            </Text>
            <Text style={styles.heroMode}>{payment.name || "—"}</Text>
            <Text style={styles.heroDate}>
              {fmtDate(payment.daterecorded || payment.date)}
            </Text>
          </View>

          {/* Details card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="receipt-outline" size={16} color="#f59e0b" />
              <Text style={styles.cardTitle}>Payment Details</Text>
            </View>

            <View style={styles.divider} />

            <DetailRow label="Payment Mode" value={payment.name} />
            <DetailRow label="Invoice #" value={payment.invoiceid} />
            <DetailRow label="Date" value={fmtDate(payment.date)} />
            <DetailRow label="Date Recorded" value={fmtDate(payment.daterecorded)} />
            {!!payment.transactionid && (
              <DetailRow label="Transaction ID" value={payment.transactionid} mono />
            )}
            {!!payment.paymentmethod && (
              <DetailRow label="Payment Method" value={payment.paymentmethod} />
            )}
          </View>

          {/* Note card */}
          {!!payment.note && (
            <View style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <Ionicons name="document-text-outline" size={16} color="#d97706" />
                <Text style={styles.noteTitle}>Note</Text>
              </View>
              <Text style={styles.noteText}>{payment.note}</Text>
            </View>
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

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },

  heroCard: {
    backgroundColor: "#f59e0b",
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
    gap: 6,
  },
  heroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  heroMode: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
  heroDate: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },

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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginBottom: 12,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
    gap: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
    flex: 1,
    paddingTop: 1,
  },
  detailValue: {
    fontSize: 13,
    color: "#1e293b",
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  detailValueMono: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#475569",
  },

  noteCard: {
    backgroundColor: "#fffbeb",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fde68a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400e",
  },
  noteText: {
    fontSize: 13,
    color: "#78350f",
    lineHeight: 20,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingTop: 60,
  },
  loadingText: { fontSize: 14, color: "#64748b" },
  errorText: { fontSize: 16, fontWeight: "600", color: "#94a3b8" },
  retryBtn: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  retryBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
});
