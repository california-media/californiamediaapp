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
import { fetchProposals } from "./utils/api";
import { getStaffInfo } from "./utils/config";
import { Proposal } from "./types";

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

export default function QuotationsListScreen() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filtered, setFiltered] = useState<Proposal[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const insets = useSafeAreaInsets();
  const isAdmin = getStaffInfo()?.admin === "1";

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchProposals();
      setProposals(data);
      setFiltered(data);
    } catch {
      setProposals([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(proposals);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      proposals.filter(
        (p) =>
          p.subject?.toLowerCase().includes(q) ||
          p.proposal_to?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q)
      )
    );
  }, [search, proposals]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quotations</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed-outline" size={56} color="#cbd5e1" />
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedText}>
            You need administrator privileges to view quotations.
          </Text>
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Quotations</Text>
          {proposals.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{proposals.length}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/create-quotation" as any)}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={17} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by subject, client, email..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={17} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading quotations...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
          }
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={56} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No quotations found</Text>
              {search.length > 0 && (
                <Text style={styles.emptySubtitle}>Try a different search term</Text>
              )}
            </View>
          ) : (
            filtered.map((proposal) => {
              const st = proposalStatus(proposal.status);
              const idPadded = String(proposal.id).padStart(5, "0");
              const total = parseFloat(proposal.total) || 0;
              return (
                <TouchableOpacity
                  key={proposal.id}
                  style={[styles.card, { borderLeftColor: st.color }]}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({ pathname: "/quotation-detail", params: { id: proposal.id } })
                  }
                >
                  {/* Row 1: ID + Status badge */}
                  <View style={styles.cardTop}>
                    <Text style={styles.proposalId}>Q-{idPadded}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                      <Text style={[styles.statusLabel, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>

                  {/* Row 2: Subject */}
                  <Text style={styles.proposalSubject} numberOfLines={2}>
                    {proposal.subject || "—"}
                  </Text>

                  {/* Row 3: Client + Date */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="person-outline" size={12} color="#94a3b8" />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {proposal.proposal_to || "—"}
                      </Text>
                    </View>
                    <View style={[styles.metaItem, styles.metaItemRight]}>
                      <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
                      <Text style={styles.metaText}>{formatDate(proposal.date)}</Text>
                    </View>
                  </View>

                  {/* Row 4: Total + Open till */}
                  <View style={styles.cardBottom}>
                    <Text style={[styles.totalAmount, { color: st.color }]}>
                      {(proposal as any).symbol || "AED"}{" "}
                      {total.toLocaleString("en-AE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                    {proposal.open_till ? (
                      <View style={styles.openTillWrap}>
                        <Ionicons name="time-outline" size={11} color="#94a3b8" />
                        <Text style={styles.openTill}>{formatDate(proposal.open_till)}</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

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
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  headerSpacer: { width: 36 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center",
    alignItems: "center",
  },
  countBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 20,
  },
  countText: { fontSize: 12, color: "#fff", fontWeight: "700" },

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

  listContent: { paddingHorizontal: 16, paddingTop: 4 },

  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10, padding: 32 },
  loadingText: { fontSize: 14, color: "#64748b" },

  emptyState: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#94a3b8" },
  emptySubtitle: { fontSize: 13, color: "#cbd5e1" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    paddingLeft: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  proposalId: { fontSize: 12, fontWeight: "800", color: "#6366f1", letterSpacing: 0.5 },
  proposalSubject: { fontSize: 15, fontWeight: "600", color: "#0f172a", lineHeight: 21, marginBottom: 10 },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusLabel: { fontSize: 11, fontWeight: "700" },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  metaItemRight: { justifyContent: "flex-end" },
  metaText: { fontSize: 12, color: "#64748b", flex: 1 },

  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
  },
  totalAmount: { fontSize: 15, fontWeight: "800" },
  openTillWrap: { flexDirection: "row", alignItems: "center", gap: 3 },
  openTill: { fontSize: 11, color: "#94a3b8" },

  accessDenied: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 12 },
  accessDeniedTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  accessDeniedText: { fontSize: 14, color: "#64748b", textAlign: "center", lineHeight: 20 },
});
