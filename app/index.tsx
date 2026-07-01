// app/index.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SCREEN_W = Dimensions.get("window").width;
import { Lead } from "./types";
import { LeadStatus, fetchAllLeads, fetchCalendarEvents, fetchCustomers, fetchDbLeads, fetchLeadStatuses, fetchRenewals } from "./utils/api";
import { StaffInfo, getStaffInfo, initConfig } from "./utils/config";


const AVATAR_COLORS = ["#6366f1","#8b5cf6","#ec4899","#ef4444","#f59e0b","#10b981","#06b6d4","#3b82f6"];
const avatarBg = (name: string) => AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

export default function HomeScreen() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [latestLead, setLatestLead] = useState<Lead | null>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [leadsTotal, setLeadsTotal] = useState<number>(0);
  const [dbLeadsTotal, setDbLeadsTotal] = useState<number>(0);
  const [customersTotal, setCustomersTotal] = useState<number>(0);
  const [apiStatuses, setApiStatuses] = useState<LeadStatus[]>([]);
  const [allCalEvents, setAllCalEvents] = useState<any[]>([]);
  const [selectedCalDate, setSelectedCalDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expiringRenewals, setExpiringRenewals] = useState<any[]>([]);
  const [staffInfo, setStaffInfoState] = useState<StaffInfo | null>(() => getStaffInfo());
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const router = useRouter();

  const isAdmin = staffInfo?.admin === "1";

  const loadData = async () => {
    await initConfig();
    const info = getStaffInfo();
    setStaffInfoState(info);
    const admin = info?.admin === "1";
    const todayDate = new Date();
    const calStart  = todayDate.toISOString().slice(0, 10);
    const calEnd    = new Date(todayDate.getTime() + 7 * 86400000).toISOString().slice(0, 10);

    const [leadsRes, dbRes, customersRes, statusRes, eventsRes, renewalsRes] = await Promise.allSettled([
      fetchAllLeads({ limit: 10, sort_by: "dateadded", sort_order: "DESC" }),
      fetchDbLeads({ limit: 1, page: 1 }),
      admin ? fetchCustomers({ limit: 1, page: 1 }) : Promise.resolve({ data: [], total: 0, page: 1, limit: 1, hasMore: false }),
      fetchLeadStatuses(),
      fetchCalendarEvents(calStart, calEnd),
      fetchRenewals({ status: "expiring", limit: 5 }),
    ]);
    if (leadsRes.status === "fulfilled") {
      const all = leadsRes.value.data || [];
      setLeads(all);
      setLeadsTotal(Number(leadsRes.value.total) || all.length);
      setLatestLead(all[0] || null);
      setRecentLeads(all.slice(1, 7));
    }
    if (dbRes.status === "fulfilled") setDbLeadsTotal(Number(dbRes.value.total) || 0);
    if (customersRes.status === "fulfilled") setCustomersTotal(Number(customersRes.value.total) || 0);
    if (statusRes.status === "fulfilled") setApiStatuses(statusRes.value);
    if (eventsRes.status === "fulfilled") {
      const sorted = [...eventsRes.value].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      setAllCalEvents(sorted);
    }
    if (renewalsRes.status === "fulfilled") setExpiringRenewals(renewalsRes.value.data || []);
    setInitialLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

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

  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const calToday = new Date();
  const calTodayStr = calToday.toISOString().slice(0, 10);
  const calDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(calToday.getTime() + i * 86400000);
    return {
      label: d.toLocaleDateString("en-US", { weekday: "short" }).charAt(0),
      num: d.getDate(),
      dateStr: d.toISOString().slice(0, 10),
      isToday: i === 0,
    };
  });
  const calEventDates = new Set(allCalEvents.map(e => (e.start ?? "").slice(0, 10)));
  const filteredEvents = allCalEvents.filter(e => (e.start ?? "").slice(0, 10) === selectedCalDate);

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
    { label: "Leads", value: leadsTotal, icon: "people" as const, color: "#6366f1", bg: "#eef2ff", route: "/leads-list" },
    { label: "DB Leads", value: dbLeadsTotal, icon: "server" as const, color: "#8b5cf6", bg: "#f5f3ff", route: "/db-leads-list" },
    ...(isAdmin ? [{ label: "Customers", value: customersTotal, icon: "people-circle" as const, color: "#0ea5e9", bg: "#f0f9ff", route: "/customers-list" }] : []),
  ];

  const QUICK = [
    { label: "New To Do", icon: "checkmark-done" as const, color: "#f59e0b", bg: "#fffbeb", route: "/todos-list" },
    { label: "Calendar", icon: "calendar" as const, color: "#6366f1", bg: "#eef2ff", route: "/calendar" },
    ...(isAdmin ? [{ label: "Renewals", icon: "reload-circle" as const, color: "#10b981", bg: "#f0fdf4", route: "/renewals-list" }] : []),
    ...(isAdmin ? [{ label: "Timesheet", icon: "time" as const, color: "#0ea5e9", bg: "#f0f9ff", route: "/timesheet" }] : []),
    ...(isAdmin ? [{ label: "Quotations", icon: "document-text" as const, color: "#6366f1", bg: "#eef2ff", route: "/quotations-list" }] : []),
    ...(isAdmin ? [{ label: "Invoices", icon: "receipt" as const, color: "#10b981", bg: "#f0fdf4", route: "/invoices-list" }] : []),
    ...(isAdmin ? [{ label: "Payments", icon: "card" as const, color: "#f59e0b", bg: "#fffbeb", route: "/payments-list" }] : []),
    ...(isAdmin ? [{ label: "Projects", icon: "folder" as const, color: "#3b82f6", bg: "#eff6ff", route: "/projects-list" }] : []),
    { label: "Tasks", icon: "checkmark-circle" as const, color: "#8b5cf6", bg: "#f5f3ff", route: "/tasks-list" },
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
            <Text style={styles.heroGreet}>Hello, {staffInfo?.firstname ?? "there"} 👋</Text>
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
          {QUICK.map((q) => {
            const cols = QUICK.length === 3 ? 3 : 2;
            const cardW = (SCREEN_W - 32 - 8 * (cols - 1)) / cols;
            return (
              <TouchableOpacity key={q.label} style={[styles.quickCard, { width: cardW }]} onPress={() => router.push(q.route as any)} activeOpacity={0.75}>
                <View style={[styles.quickIcon, { backgroundColor: q.bg }]}>
                  <Ionicons name={q.icon} size={22} color={q.color} />
                </View>
                <Text style={[styles.quickLabel, { color: q.color }]}>{q.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ─────── CALENDAR WIDGET ─────── */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Calendar</Text>
          <TouchableOpacity onPress={() => router.push("/calendar" as any)}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* Week strip */}
        <View style={styles.calWeekStrip}>
          {calDays.map((d) => {
            const isSelected = d.dateStr === selectedCalDate;
            return (
              <TouchableOpacity
                key={d.dateStr}
                style={[styles.calDayCell, isSelected && styles.calDayCellToday]}
                onPress={() => setSelectedCalDate(d.dateStr)}
                activeOpacity={0.7}
              >
                <Text style={[styles.calDayLabel, isSelected && styles.calDayLabelToday]}>{d.label}</Text>
                <Text style={[styles.calDayNum, isSelected && styles.calDayNumToday]}>{d.num}</Text>
                {calEventDates.has(d.dateStr) && (
                  <View style={[styles.calEventDot, isSelected && styles.calEventDotToday]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Events for selected date */}
        {filteredEvents.length > 0 ? (
          <View style={styles.calEventsList}>
            {filteredEvents.map((ev, i) => {
              const evDate = new Date(ev.start);
              const isEvToday = evDate.toISOString().slice(0, 10) === calTodayStr;
              const dayLabel = isEvToday ? "Today" : evDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
              const timeLabel = (ev.start ?? "").length > 10 ? evDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";
              return (
                <TouchableOpacity
                  key={ev.id ?? i}
                  style={styles.calEventRow}
                  onPress={() => router.push({ pathname: "/calendar", params: { date: (ev.start ?? "").slice(0, 10) || selectedCalDate } } as any)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.calEventAccent, { backgroundColor: ev.color || "#6366f1" }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.calEventTitle} numberOfLines={1}>{ev.title}</Text>
                    <Text style={styles.calEventMeta}>{dayLabel}{timeLabel ? `  ·  ${timeLabel}` : ""}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="#c7d2fe" />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.calEmpty}>
            <Ionicons name="calendar-outline" size={28} color="#cbd5e1" />
            <Text style={styles.calEmptyText}>
              {selectedCalDate === calTodayStr ? "No events today" : "No events on this day"}
            </Text>
          </View>
        )}
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

      {/* ─────── EXPIRING RENEWALS ─────── */}
      {isAdmin && expiringRenewals.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Expiring Renewals</Text>
            <TouchableOpacity onPress={() => router.push("/renewals-list" as any)}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {expiringRenewals.map((r) => {
            const expiry = new Date(r.expiry_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const days = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
            const urgent = days <= 7;
            const dayLabel = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days}d left`;
            return (
              <TouchableOpacity
                key={r.id}
                style={styles.renewalCard}
                onPress={() => router.push({ pathname: "/renewal-detail", params: { renewal: JSON.stringify(r) } } as any)}
                activeOpacity={0.75}
              >
                <View style={[styles.renewalAccent, { backgroundColor: urgent ? "#f59e0b" : "#6366f1" }]} />
                <View style={styles.renewalInner}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.renewalName} numberOfLines={1}>{r.name || r.domain}</Text>
                    <Text style={styles.renewalCustomer} numberOfLines={1}>{r.customer_name || r.client_name || ""}</Text>
                  </View>
                  <View style={styles.renewalRight}>
                    <Text style={[styles.renewalDays, { color: urgent ? "#f59e0b" : "#6366f1" }]}>{dayLabel}</Text>
                    {r.renewal_price ? (
                      <Text style={styles.renewalPrice}>AED {Number(r.renewal_price).toLocaleString()}</Text>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
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
        {isAdmin && (
          <TouchableOpacity style={styles.navItem} onPress={() => router.push("/renewals-list" as any)}>
            <Ionicons name="reload-circle-outline" size={22} color="#94a3b8" />
            <Text style={styles.navText}>Renewals</Text>
          </TouchableOpacity>
        )}
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
  // 2 cols, 16px padding each side, 1 gap of 8px = (SCREEN_W - 32 - 8) / 2
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickCard: {
    width: (SCREEN_W - 32 - 8) / 2,
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

  // ── Calendar widget ──
  calWeekStrip: {
    flexDirection: "row", justifyContent: "space-between",
    backgroundColor: "#fff", borderRadius: 16, padding: 10,
    marginBottom: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  calDayCell: {
    alignItems: "center", paddingVertical: 8, paddingHorizontal: 6,
    borderRadius: 12, gap: 4, minWidth: 36,
  },
  calDayCellToday: { backgroundColor: "#6366f1" },
  calDayLabel: { fontSize: 10, fontWeight: "600", color: "#94a3b8", textTransform: "uppercase" },
  calDayLabelToday: { color: "rgba(255,255,255,0.75)" },
  calDayNum: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  calDayNumToday: { color: "#fff" },
  calEventDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#6366f1" },
  calEventDotToday: { backgroundColor: "#fff" },
  calEventsList: {
    backgroundColor: "#fff", borderRadius: 16, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  calEventRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  calEventAccent: { width: 4, height: 36, borderRadius: 2 },
  calEventTitle: { fontSize: 13, fontWeight: "700", color: "#0f172a", marginBottom: 2 },
  calEventMeta: { fontSize: 11, color: "#94a3b8", fontWeight: "500" },
  calEmpty: { alignItems: "center", paddingVertical: 24, gap: 8, backgroundColor: "#fff", borderRadius: 16 },
  calEmptyText: { fontSize: 13, color: "#94a3b8" },

  renewalCard: {
    backgroundColor: "#fff", borderRadius: 14, marginBottom: 8, flexDirection: "row", overflow: "hidden",
    shadowColor: "#64748b", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 5, elevation: 2,
  },
  renewalAccent: { width: 4 },
  renewalInner: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 12, gap: 10 },
  renewalName: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  renewalCustomer: { fontSize: 12, color: "#64748b", marginTop: 2 },
  renewalRight: { alignItems: "flex-end", gap: 3 },
  renewalDays: { fontSize: 12, fontWeight: "700" },
  renewalPrice: { fontSize: 12, color: "#6366f1", fontWeight: "600" },

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
