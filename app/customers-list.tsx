import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { fetchCustomers } from "./utils/api";
import { getStaffInfo } from "./utils/config";

interface Customer {
  id: string;
  company: string;
  phonenumber: string;
  city: string;
  country: string;
  website: string;
  active: string;
  datecreated: string;
}

const AVATAR_COLORS = ["#6366f1","#8b5cf6","#ec4899","#ef4444","#f59e0b","#10b981","#06b6d4","#3b82f6"];
const avatarColor = (name: string) => AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

export default function CustomersListScreen() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const searchTimer = useRef<any>(null);

  const isAdmin = getStaffInfo()?.admin === "1";

  const loadCustomers = async (pageNum: number = 1, refresh: boolean = false, search?: string) => {
    if (pageNum === 1) { setLoading(true); setError(null); }
    else setLoadingMore(true);

    try {
      const res = await fetchCustomers({
        page: pageNum,
        limit: 20,
        sort_by: "company",
        sort_order: "ASC",
        ...(search ? { search } : searchQuery ? { search: searchQuery } : {}),
      });

      const items = Array.isArray(res.data) ? res.data : [];
      if (res.total !== undefined) setTotalResults(res.total);

      if (refresh || pageNum === 1) {
        setCustomers(items);
      } else {
        setCustomers((prev) => {
          const seen = new Set(prev.map((c) => c.id));
          return [...prev, ...items.filter((c) => !seen.has(c.id))];
        });
      }
      setHasMore(items.length === 20);
      setPage(pageNum);
    } catch {
      setError("Failed to load customers. Please try again.");
      if (pageNum === 1) setCustomers([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { loadCustomers(1, true); }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadCustomers(1, true, searchQuery), 500);
    return () => clearTimeout(searchTimer.current);
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCustomers(1, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore && !loading) loadCustomers(page + 1);
  };

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Ionicons name="lock-closed-outline" size={48} color="#e2e8f0" />
        <Text style={styles.emptyText}>Admin access required</Text>
      </View>
    );
  }

  const renderCard = ({ item }: { item: Customer }) => {
    const color = avatarColor(item.company ?? "");
    const isActive = item.active === "1";

    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: "/customer-detail", params: { id: item.id } })} activeOpacity={0.85}>
        <View style={styles.cardTop}>
          <View style={[styles.avatar, { backgroundColor: color + "22" }]}>
            <Text style={[styles.avatarLetter, { color }]}>
              {item.company?.charAt(0)?.toUpperCase() ?? "?"}
            </Text>
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.companyName} numberOfLines={1}>{item.company}</Text>
            {item.city ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color="#94a3b8" />
                <Text style={styles.locationText} numberOfLines={1}>{item.city}</Text>
              </View>
            ) : null}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? "#dcfce7" : "#fee2e2" }]}>
            <Text style={[styles.statusText, { color: isActive ? "#16a34a" : "#dc2626" }]}>
              {isActive ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>

        {item.phonenumber ? (
          <>
            <View style={styles.divider} />
            <View style={styles.cardBottom}>
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={13} color="#94a3b8" />
                <Text style={styles.phoneText}>{item.phonenumber}</Text>
              </View>
              <View style={styles.actionIcons}>
                <TouchableOpacity
                  style={styles.iconBtnCall}
                  onPress={(e) => { e.stopPropagation?.(); Linking.openURL(`tel:${item.phonenumber.replace(/\D/g, "")}`).catch(() => {}); }}
                >
                  <Ionicons name="call" size={14} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtnWa}
                  onPress={(e) => { e.stopPropagation?.(); Linking.openURL(`https://wa.me/${item.phonenumber.replace(/\D/g, "")}`).catch(() => {}); }}
                >
                  <Ionicons name="logo-whatsapp" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </>
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
          <Text style={styles.title}>Customers</Text>
          {totalResults > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{totalResults}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customers..."
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

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading customers…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={44} color="#fca5a5" />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadCustomers(1, true)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={48} color="#e2e8f0" />
              <Text style={styles.emptyText}>No customers found</Text>
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
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center",
  },
  headerTitle: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "700", color: "#0f172a" },
  countBadge: {
    backgroundColor: "#eef2ff", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20,
  },
  countText: { fontSize: 12, color: "#6366f1", fontWeight: "600" },

  searchBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", marginHorizontal: 16, marginVertical: 10,
    borderRadius: 12, paddingHorizontal: 12, height: 44,
    borderWidth: 1.5, borderColor: "#e2e8f0", gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#1e293b" },

  listContent: { padding: 16, gap: 10, paddingBottom: 40 },

  card: {
    backgroundColor: "#fff", borderRadius: 14,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12,
    shadowColor: "#64748b", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
  },
  avatarLetter: { fontSize: 18, fontWeight: "700" },
  cardMeta: { flex: 1 },
  companyName: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 3 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  locationText: { fontSize: 12, color: "#64748b" },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: "600" },

  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 8 },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  phoneText: { fontSize: 13, color: "#475569" },
  actionIcons: { flexDirection: "row", gap: 8 },
  iconBtnCall: {
    width: 30, height: 30, borderRadius: 9, backgroundColor: "#2563eb",
    justifyContent: "center", alignItems: "center",
  },
  iconBtnWa: {
    width: 30, height: 30, borderRadius: 9, backgroundColor: "#25D366",
    justifyContent: "center", alignItems: "center",
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 10 },
  loadingText: { fontSize: 14, color: "#64748b" },
  emptyText: { fontSize: 14, color: "#94a3b8", textAlign: "center" },
  retryBtn: {
    marginTop: 8, backgroundColor: "#6366f1",
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
  },
  retryText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
