// app/index.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SCREEN_W = Dimensions.get("window").width;
import { Lead } from "./types";
import { LeadStatus, fetchAllLeads, fetchDbLeads, fetchDeals, fetchLeadStatuses } from "./utils/api";
import { fetchProjects } from "./utils/projectsApi";
import { getStaffInfo } from "./utils/config";


const AVATAR_COLORS = ["#6366f1","#8b5cf6","#ec4899","#ef4444","#f59e0b","#10b981","#06b6d4","#3b82f6"];
const avatarBg = (name: string) => AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

export default function HomeScreen() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [latestLead, setLatestLead] = useState<Lead | null>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [dbLeadsTotal, setDbLeadsTotal] = useState<number>(0);
  const [dealsTotal, setDealsTotal] = useState<number>(0);
  const [properties, setProperties] = useState<any[]>([]);
  const [apiStatuses, setApiStatuses] = useState<LeadStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const router = useRouter();

  const loadData = async () => {
    const [leadsRes, propsRes, dbRes, dealsRes, statusRes] = await Promise.allSettled([
      fetchAllLeads({ limit: 100 }),
      fetchProjects(1, 6),
      fetchDbLeads({ limit: 1, page: 1 }),
      fetchDeals({ limit: 1, page: 1 }),
      fetchLeadStatuses(),
    ]);
    if (leadsRes.status === "fulfilled") {
      const all = leadsRes.value.data || [];
      const sorted = [...all].sort((a, b) => new Date(b.dateadded).getTime() - new Date(a.dateadded).getTime());
      setLeads(all);
      setLatestLead(sorted[0] || null);
      setRecentLeads(sorted.slice(1, 7));
    }
    if (propsRes.status === "fulfilled") setProperties(propsRes.value.data ?? []);
    if (dbRes.status === "fulfilled") setDbLeadsTotal(Number(dbRes.value.total) || 0);
    if (dealsRes.status === "fulfilled") setDealsTotal(Number(dealsRes.value.total) || 0);
    if (statusRes.status === "fulfilled") setApiStatuses(statusRes.value);
    setInitialLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const getStatusColor = (name: string) =>
    apiStatuses.find((s) => s.name.trim() === name?.trim())?.color ?? "#64748b";

  const formatDate = (d: string) => {
    const date = new Date(d);
    const diff = Math.ceil(Math.abs(Date.now() - date.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff}d ago`;
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const getPropStatusColor = (s: string) => {
    const l = s?.toLowerCase();
    if (l === "available" || l === "ready" || l === "completed") return "#10b981";
    if (l === "sold" || l === "out of stock") return "#ef4444";
    if (l === "reserved" || l === "under construction") return "#f59e0b";
    return "#6366f1";
  };

  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  if (initialLoading) {
    return (
      <View style={styles.center}>
        <View style={styles.loadingIcon}>
          <Ionicons name="home" size={30} color="#6366f1" />
        </View>
        <Text style={styles.loadingText}>Loading dashboard…</Text>
      </View>
    );
  }

  const STATS = [
    { label: "Leads", value: leads.length, icon: "people" as const, color: "#6366f1", bg: "#eef2ff", route: "/leads-list" },
    { label: "DB Leads", value: dbLeadsTotal, icon: "server" as const, color: "#8b5cf6", bg: "#f5f3ff", route: "/db-leads-list" },
    { label: "Deals", value: dealsTotal, icon: "briefcase" as const, color: "#10b981", bg: "#f0fdf4", route: "/deals-list" },
  ];

  const QUICK = [
    { label: "New To Do", icon: "checkmark-done" as const, color: "#f59e0b", bg: "#fffbeb", route: "/todos-list" },
    { label: "Calendar", icon: "calendar" as const, color: "#6366f1", bg: "#eef2ff", route: "/todos-list" },
    { label: "Properties", icon: "business" as const, color: "#06b6d4", bg: "#ecfeff", route: "/properties-list" },
    { label: "Profile", icon: "person-circle" as const, color: "#3b82f6", bg: "#eff6ff", route: "/profile" },
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
    >
      {/* ─────── HERO ─────── */}
      <View style={styles.hero}>
        {/* decorative circles */}
        <View style={styles.deco1} />
        <View style={styles.deco2} />
        <View style={styles.deco3} />

        {/* top bar */}
        <View style={styles.heroBar}>
          <View style={styles.heroBarLeft}>
            <Text style={styles.heroDate}>{todayStr}</Text>
            <Text style={styles.heroGreet}>Hello, {getStaffInfo()?.firstname ?? "there"} 👋</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => router.push("/profile")}>
            <Ionicons name="person" size={20} color="#6366f1" />
          </TouchableOpacity>
        </View>

        <Text style={styles.heroSub}>Welcome back to Lead Manager</Text>
      </View>

      {/* ─────── STAT CARDS (float below hero) ─────── */}
      <View style={styles.statsRow}>
        {STATS.map((s) => (
          <TouchableOpacity key={s.label} style={styles.statCard} onPress={() => router.push(s.route as any)} activeOpacity={0.78}>
            <View style={[styles.statIconWrap, { backgroundColor: s.bg }]}>
              <Ionicons name={s.icon} size={16} color={s.color} />
            </View>
            <Text style={[styles.statNum, { color: s.color }]}>{String(s.value)}</Text>
            <Text style={styles.statLbl}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─────── QUICK ACCESS ─────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.quickGrid}>
          {QUICK.map((q) => (
            <TouchableOpacity key={q.label} style={styles.quickCard} onPress={() => router.push(q.route as any)} activeOpacity={0.75}>
              <View style={[styles.quickIcon, { backgroundColor: q.bg }]}>
                <Ionicons name={q.icon} size={22} color={q.color} />
              </View>
              <Text style={[styles.quickLabel, { color: q.color }]}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ─────── LATEST LEAD ─────── */}
      {latestLead && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Lead</Text>
          <TouchableOpacity
            style={styles.latestCard}
            activeOpacity={0.88}
            onPress={() => router.push({ pathname: "/lead-detail", params: { lead: JSON.stringify(latestLead) } })}
          >
            {/* coloured accent bar */}
            <View style={[styles.latestAccent, { backgroundColor: avatarBg(latestLead.name) }]} />

            <View style={styles.latestInner}>
              {/* avatar */}
              <View style={[styles.latestAvatar, { backgroundColor: avatarBg(latestLead.name) }]}>
                <Text style={styles.latestAvatarText}>{latestLead.name?.charAt(0)?.toUpperCase()}</Text>
              </View>

              {/* info */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <Text style={styles.latestName} numberOfLines={1}>{latestLead.name}</Text>
                  <View style={styles.newBadge}>
                    <Ionicons name="flash" size={9} color="#fff" />
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                </View>
                <Text style={styles.latestCompany} numberOfLines={1}>
                  {latestLead.company || latestLead.email || "No company"}
                </Text>
                <View style={styles.latestMeta}>
                  {latestLead.source_name ? (
                    <View style={styles.srcBadge}>
                      <Ionicons name="flash-outline" size={10} color="#6366f1" />
                      <Text style={styles.srcBadgeText}>{latestLead.source_name}</Text>
                    </View>
                  ) : null}
                  <View style={styles.latestTimeBadge}>
                    <Ionicons name="time-outline" size={10} color="#94a3b8" />
                    <Text style={styles.latestTimeText}>{formatDate(latestLead.dateadded)}</Text>
                  </View>
                </View>
              </View>

              {/* call + wa buttons */}
              {latestLead.phonenumber ? (
                <View style={{ gap: 8 }}>
                  <TouchableOpacity
                    style={styles.iconBtnCall}
                    onPress={(e) => { e.stopPropagation(); Linking.openURL(`tel:${latestLead.phonenumber.replace(/\D/g,"")}`).catch(()=>{}); }}
                  >
                    <Ionicons name="call" size={14} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtnWa}
                    onPress={(e) => { e.stopPropagation(); Linking.openURL(`https://wa.me/${latestLead.phonenumber.replace(/\D/g,"")}`).catch(()=>{}); }}
                  >
                    <Ionicons name="logo-whatsapp" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={18} color="#c7d2fe" />
              )}
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ─────── PROPERTIES ─────── */}
      {properties.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Properties</Text>
            <TouchableOpacity onPress={() => router.push("/properties-list" as any)}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 4 }}>
            {properties.map((p) => {
              const imgUrl = p.s3_cover_url || p.cover_image_url?.url || "";
              const status = p.sale_status || "Off-Plan";
              const price = p.max_price_aed ? `AED ${Number(p.max_price_aed).toLocaleString()}` : "Price on Request";
              return (
                <TouchableOpacity
                  key={p._id || p.id}
                  style={styles.propCard}
                  onPress={() => router.push({ pathname: "/property-detail", params: { propertyId: p.id } })}
                  activeOpacity={0.88}
                >
                  <Image source={{ uri: imgUrl }} style={styles.propImage} />
                  <View style={styles.propOverlay} />
                  <View style={[styles.propBadge, { backgroundColor: getPropStatusColor(status) }]}>
                    <Text style={styles.propBadgeText}>{status}</Text>
                  </View>
                  <View style={styles.propInfo}>
                    <Text style={styles.propName} numberOfLines={1}>{p.name}</Text>
                    <View style={styles.propLocRow}>
                      <Ionicons name="location-outline" size={11} color="#94a3b8" />
                      <Text style={styles.propLoc} numberOfLines={1}>{p.area || "Dubai"}</Text>
                    </View>
                    <View style={styles.propFooter}>
                      <Text style={styles.propPrice} numberOfLines={1}>{price}</Text>
                      {p.developer ? (
                        <View style={styles.bedBadge}>
                          <Ionicons name="business-outline" size={10} color="#6366f1" />
                          <Text style={styles.bedText} numberOfLines={1}>{p.developer}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ─────── RECENT LEADS ─────── */}
      <View style={[styles.section, { marginBottom: 100 }]}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recent Leads</Text>
          <TouchableOpacity onPress={() => router.push("/leads-list" as any)}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentLeads.length > 0 ? recentLeads.map((lead) => {
          const color = avatarBg(lead.name ?? "");
          const statusColor = getStatusColor(lead.status_name);
          const hasPhone = !!lead.phonenumber;
          return (
            <TouchableOpacity
              key={lead.id}
              style={styles.leadCard}
              onPress={() => router.push({ pathname: "/lead-detail", params: { lead: JSON.stringify(lead) } })}
              activeOpacity={0.72}
            >
              {/* top */}
              <View style={styles.cardTop}>
                <View style={[styles.avatar, { backgroundColor: color + "22" }]}>
                  <Text style={[styles.avatarLetter, { color }]}>{lead.name?.charAt(0)?.toUpperCase() ?? "?"}</Text>
                </View>
                <View style={styles.cardMeta}>
                  <Text style={styles.leadName} numberOfLines={1}>{lead.name}</Text>
                  {hasPhone ? (
                    <View style={styles.phoneRow}>
                      <Ionicons name="call-outline" size={11} color="#94a3b8" />
                      <Text style={styles.phoneText}>{lead.phonenumber}</Text>
                    </View>
                  ) : (
                    <Text style={styles.phoneText}>{lead.email || formatDate(lead.dateadded)}</Text>
                  )}
                </View>
                {hasPhone ? (
                  <View style={styles.actionIcons}>
                    <TouchableOpacity
                      style={styles.iconBtnCall}
                      onPress={(e) => { e.stopPropagation(); Linking.openURL(`tel:${lead.phonenumber.replace(/\D/g,"")}`).catch(()=>{}); }}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="call" size={14} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconBtnWa}
                      onPress={(e) => { e.stopPropagation(); Linking.openURL(`https://wa.me/${lead.phonenumber.replace(/\D/g,"")}`).catch(()=>{}); }}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="logo-whatsapp" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.leadTime}>{formatDate(lead.dateadded)}</Text>
                )}
              </View>

              {/* divider */}
              <View style={styles.cardDivider} />

              {/* bottom */}
              <View style={styles.cardBottom}>
                <View style={styles.sourceBadge}>
                  <Ionicons name="flash-outline" size={11} color="#6366f1" />
                  <Text style={styles.sourcePrefix}>Source: </Text>
                  <Text style={styles.sourceText} numberOfLines={1}>{lead.source_name || "Direct"}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: statusColor + "18" }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusLabel, { color: statusColor }]} numberOfLines={1}>
                    {lead.status_name || "New"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }) : (
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={44} color="#cbd5e1" />
            <Text style={styles.emptyText}>No recent leads</Text>
          </View>
        )}
      </View>

      {/* ─────── BOTTOM NAV ─────── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navActiveBar} />
          <Ionicons name="home" size={22} color="#6366f1" />
          <Text style={[styles.navText, { color: "#6366f1", fontWeight: "700" }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/leads-list" as any)}>
          <Ionicons name="people-outline" size={22} color="#94a3b8" />
          <Text style={styles.navText}>Leads</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/properties-list" as any)}>
          <Ionicons name="business-outline" size={22} color="#94a3b8" />
          <Text style={styles.navText}>Properties</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/profile" as any)}>
          <Ionicons name="person-outline" size={22} color="#94a3b8" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },

  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f1f5f9" },
  loadingIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: "#eef2ff", justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  loadingText: { fontSize: 14, color: "#64748b" },

  // ── Hero ──
  hero: {
    backgroundColor: "#4f46e5",
    paddingTop: 58,
    paddingHorizontal: 22,
    paddingBottom: 48,
    overflow: "hidden",
  },
  deco1: {
    position: "absolute", width: 260, height: 260, borderRadius: 130,
    backgroundColor: "rgba(255,255,255,0.06)", top: -90, right: -60,
  },
  deco2: {
    position: "absolute", width: 150, height: 150, borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.06)", top: 20, right: 70,
  },
  deco3: {
    position: "absolute", width: 100, height: 100, borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)", bottom: -20, left: -10,
  },
  heroBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  heroBarLeft: { flex: 1 },
  heroDate: { fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: "500", letterSpacing: 0.4, marginBottom: 6 },
  heroGreet: { fontSize: 28, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  profileBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },

  // ── Stat cards (float up over hero) ──
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: -30,
    gap: 10,
    marginBottom: 4,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: "center",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  statIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    justifyContent: "center", alignItems: "center", marginBottom: 8,
  },
  statNum: { fontSize: 20, fontWeight: "800", marginBottom: 2 },
  statLbl: { fontSize: 10, color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },

  // ── Sections ──
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#0f172a", marginBottom: 14 },
  seeAll: { fontSize: 13, color: "#6366f1", fontWeight: "600" },

  // ── Quick access (full-width grid) ──
  // 4 cards, 16px padding each side, 3 gaps of 8px = (SCREEN_W - 32 - 24) / 4
  quickGrid: { flexDirection: "row", gap: 8 },
  quickCard: {
    width: (SCREEN_W - 32 - 24) / 4,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  quickIcon: {
    width: 46, height: 46, borderRadius: 14,
    justifyContent: "center", alignItems: "center", marginBottom: 8,
  },
  quickLabel: { fontSize: 11, fontWeight: "700" },

  // ── Properties ──
  propCard: {
    width: SCREEN_W * 0.52,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  propImage: { width: "100%", height: 126, resizeMode: "cover" },
  propOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, height: 126,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  propBadge: {
    position: "absolute", top: 10, left: 10,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  propBadgeText: { fontSize: 10, color: "#fff", fontWeight: "700" },
  propInfo: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 },
  propName: { fontSize: 13, fontWeight: "700", color: "#0f172a", marginBottom: 4 },
  propLocRow: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 8 },
  propLoc: { fontSize: 11, color: "#94a3b8", flex: 1 },
  propFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  propPrice: { fontSize: 11, fontWeight: "700", color: "#0f172a", flex: 1, flexShrink: 1 },
  bedBadge: {
    flexDirection: "row", alignItems: "center", gap: 3, flexShrink: 0,
    backgroundColor: "#eef2ff", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7,
  },
  bedText: { fontSize: 10, color: "#6366f1", fontWeight: "600" },

  // ── Lead cards ──
  leadCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: "center", alignItems: "center", marginRight: 10,
  },
  avatarLetter: { fontSize: 18, fontWeight: "700" },
  cardMeta: { flex: 1, marginRight: 8 },
  leadName: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 2 },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  phoneText: { fontSize: 12, color: "#64748b" },
  leadTime: { fontSize: 11, color: "#94a3b8" },
  actionIcons: { flexDirection: "row", gap: 6 },
  iconBtnCall: {
    width: 30, height: 30, borderRadius: 9, backgroundColor: "#2563eb",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#2563eb", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2,
  },
  iconBtnWa: {
    width: 30, height: 30, borderRadius: 9, backgroundColor: "#25D366",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#25D366", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2,
  },
  cardDivider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 8 },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sourceBadge: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  sourcePrefix: { fontSize: 11, color: "#94a3b8", fontWeight: "500" },
  sourceText: { fontSize: 11, color: "#6366f1", fontWeight: "600" },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, maxWidth: 120,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusLabel: { fontSize: 10, fontWeight: "600" },

  // ── Empty ──
  emptyBox: { paddingVertical: 36, alignItems: "center" },
  emptyText: { fontSize: 14, color: "#94a3b8", marginTop: 10 },

  // ── Bottom nav ──
  bottomNav: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingTop: 10, paddingBottom: 28, paddingHorizontal: 8,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 12,
  },
  navItem: { flex: 1, alignItems: "center", gap: 3, position: "relative" },
  navActiveBar: {
    position: "absolute", top: -10,
    width: 28, height: 3, borderRadius: 2, backgroundColor: "#6366f1",
  },
  navText: { fontSize: 11, color: "#94a3b8", fontWeight: "500" },

  // ── Latest Lead card ──
  latestCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  latestAccent: { height: 4, width: "100%" },
  latestInner: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  latestAvatar: {
    width: 50, height: 50, borderRadius: 15,
    justifyContent: "center", alignItems: "center",
  },
  latestAvatarText: { fontSize: 21, fontWeight: "800", color: "#fff" },
  newBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#6366f1", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20,
  },
  newBadgeText: { fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },
  srcBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#eef2ff", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20,
  },
  srcBadgeText: { fontSize: 10, fontWeight: "600", color: "#6366f1" },
  latestName: { fontSize: 15, fontWeight: "700", color: "#0f172a", flex: 1 },
  latestCompany: { fontSize: 12, color: "#64748b", marginBottom: 7 },
  latestMeta: { flexDirection: "row", gap: 6, alignItems: "center" },
  latestTimeBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  latestTimeText: { fontSize: 11, color: "#94a3b8", fontWeight: "500" },
  metaChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#eef2ff", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  metaChipText: { fontSize: 11, color: "#6366f1", fontWeight: "500" },
});
