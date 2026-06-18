import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
import { fetchRenewals } from "./utils/api";

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "active", label: "Active" },
  { key: "expiring", label: "Expiring" },
  { key: "expired", label: "Expired" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  active:    { bg: "#dcfce7", text: "#16a34a", dot: "#16a34a" },
  expiring:  { bg: "#fef9c3", text: "#ca8a04", dot: "#f59e0b" },
  expired:   { bg: "#fee2e2", text: "#dc2626", dot: "#ef4444" },
  cancelled: { bg: "#f1f5f9", text: "#64748b", dot: "#94a3b8" },
};

const daysUntil = (date: string) => {
  const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  return diff;
};

const formatDate = (d: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const formatPrice = (p: string | number) => {
  const n = parseFloat(String(p));
  if (!n) return "—";
  if (n >= 1000) return `AED ${(n / 1000).toFixed(0)}K`;
  return `AED ${n.toLocaleString()}`;
};

export default function RenewalsListScreen() {
  const router = useRouter();
  const [renewals, setRenewals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const searchTimer = useRef<any>(null);

  const load = async (pageNum = 1, refresh = false, search?: string, status?: string) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetchRenewals({
        page: pageNum,
        limit: 20,
        status: status !== undefined ? status : activeTab,
        ...(search !== undefined ? (search ? { search } : {}) : searchQuery ? { search: searchQuery } : {}),
      });
      const items = res.data || [];
      if (res.total !== undefined) setTotalResults(res.total);

      if (refresh || pageNum === 1) setRenewals(items);
      else setRenewals(prev => {
        const seen = new Set(prev.map(r => r.id));
        return [...prev, ...items.filter((r: any) => !seen.has(r.id))];
      });

      setHasMore(items.length === 20);
      setPage(pageNum);
    } catch {
      if (pageNum === 1) setRenewals([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { load(1, true, undefined, activeTab); }, [activeTab]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(1, true, searchQuery), 500);
    return () => clearTimeout(searchTimer.current);
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(1, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore && !loading) load(page + 1);
  };

  const renderCard = ({ item }: { item: any }) => {
    const sc = STATUS_COLORS[item.status] ?? STATUS_COLORS.cancelled;
    const days = daysUntil(item.expiry_date);
    const isExpired = item.status === "expired" || item.status === "cancelled";

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: "/renewal-detail", params: { renewal: JSON.stringify(item) } })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.domainWrap}>
            <Ionicons name="reload-circle" size={16} color="#6366f1" />
            <Text style={styles.domain} numberOfLines={1}>{item.domain || "—"}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: sc.dot }]} />
            <Text style={[styles.statusText, { color: sc.text }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.metaRow}>
            <Ionicons name="business-outline" size={12} color="#94a3b8" />
            <Text style={styles.metaText} numberOfLines={1}>{item.customer_name || "—"}</Text>
          </View>
          {item.product_name ? (
            <View style={styles.metaRow}>
              <Ionicons name="cube-outline" size={12} color="#94a3b8" />
              <Text style={styles.metaText} numberOfLines={1}>{item.product_name}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.expiryWrap}>
            <Ionicons name="calendar-outline" size={12} color={isExpired ? "#ef4444" : days <= 30 ? "#f59e0b" : "#64748b"} />
            <Text style={[styles.expiryDate, { color: isExpired ? "#ef4444" : days <= 30 ? "#f59e0b" : "#64748b" }]}>
              {formatDate(item.expiry_date)}
            </Text>
            {!isExpired && (
              <Text style={[styles.daysChip, { color: days <= 0 ? "#ef4444" : days <= 30 ? "#f59e0b" : "#10b981" }]}>
                {days <= 0 ? `${Math.abs(days)}d ago` : `${days}d left`}
              </Text>
            )}
          </View>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
        </View>

        {item.renewal_type ? (
          <View style={styles.typeChip}>
            <Text style={styles.typeChipText}>{item.renewal_type}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Renewals</Text>
          {totalResults > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{totalResults}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/add-renewal")}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search domain, customer, product..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Status tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {STATUS_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading renewals…</Text>
        </View>
      ) : (
        <FlatList
          data={renewals}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="reload-circle-outline" size={52} color="#e2e8f0" />
              <Text style={styles.emptyText}>No renewals found</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#6366f1" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center",
  },
  headerTitle: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "700", color: "#0f172a" },
  countBadge: { backgroundColor: "#eef2ff", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  countText: { fontSize: 12, color: "#6366f1", fontWeight: "600" },
  addBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "#6366f1", justifyContent: "center", alignItems: "center",
  },

  searchBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", marginHorizontal: 16, marginTop: 10, marginBottom: 4,
    borderRadius: 12, paddingHorizontal: 12, height: 44,
    borderWidth: 1.5, borderColor: "#e2e8f0", gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#1e293b" },

  tabsScroll: { backgroundColor: "#fff", maxHeight: 48 },
  tabsContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  tabActive: { backgroundColor: "#6366f1" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  tabTextActive: { color: "#fff" },

  listContent: { padding: 16, gap: 10, paddingBottom: 40 },

  card: {
    backgroundColor: "#fff", borderRadius: 16,
    padding: 14,
    shadowColor: "#64748b", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  domainWrap: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1, marginRight: 8 },
  domain: { fontSize: 15, fontWeight: "700", color: "#0f172a", flex: 1 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },

  cardBody: { gap: 4, marginBottom: 10 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, color: "#64748b", flex: 1 },

  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  expiryWrap: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  expiryDate: { fontSize: 12, fontWeight: "600" },
  daysChip: { fontSize: 11, fontWeight: "700" },
  price: { fontSize: 14, fontWeight: "700", color: "#6366f1" },

  typeChip: {
    alignSelf: "flex-start", marginTop: 8,
    backgroundColor: "#eef2ff", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  typeChipText: { fontSize: 11, color: "#6366f1", fontWeight: "600" },

  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 10 },
  loadingText: { fontSize: 14, color: "#64748b" },
  emptyText: { fontSize: 14, color: "#94a3b8", textAlign: "center" },
});
