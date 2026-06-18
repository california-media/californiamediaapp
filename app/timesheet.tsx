import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  getCrmApiUrl,
  getAuthToken,
  getCrmCookie,
  getUserId,
} from "./utils/config";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "#6366f1";
const SCREEN_W = Dimensions.get("window").width;

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "today" | "this_week" | "last_week" | "this_month" | "last_month";

interface LogEntry {
  id: number;
  task_id: number;
  staff_id: number;
  staff_name: string;
  task_name: string;
  project_name: string;
  rel_type: string;
  rel_id: number;
  start_time: number;
  end_time: number | null;
  note: string;
  time_seconds: number | null;
  time_formatted: string | null;
}

interface FilterItem {
  id: number;
  name: string;
}

interface ChartBar {
  label: string;
  seconds: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function getFilterDates(period: Period): { date_from: string; date_to: string } {
  const now = new Date();
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (period === "today") {
    const t = fmt(now);
    return { date_from: t, date_to: t };
  }
  if (period === "this_week") {
    const day = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((day + 6) % 7));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { date_from: fmt(mon), date_to: fmt(sun) };
  }
  if (period === "last_week") {
    const day = now.getDay();
    const lastMon = new Date(now);
    lastMon.setDate(now.getDate() - ((day + 6) % 7) - 7);
    const lastSun = new Date(lastMon);
    lastSun.setDate(lastMon.getDate() + 6);
    return { date_from: fmt(lastMon), date_to: fmt(lastSun) };
  }
  if (period === "this_month") {
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return {
      date_from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
      date_to: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(last)}`,
    };
  }
  const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayLm = new Date(lm.getFullYear(), lm.getMonth() + 1, 0).getDate();
  return {
    date_from: `${lm.getFullYear()}-${pad(lm.getMonth() + 1)}-01`,
    date_to: `${lm.getFullYear()}-${pad(lm.getMonth() + 1)}-${pad(lastDayLm)}`,
  };
}

function fmtSecs(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${pad(h)}:${pad(m)}`;
}

function fmtSecsHuman(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${pad(m)}m`;
}

function fmtTimestamp(ts: number): string {
  const d = new Date(ts * 1000);
  const h = d.getHours() % 12 || 12;
  const ampm = d.getHours() >= 12 ? "PM" : "AM";
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${h}:${pad(d.getMinutes())} ${ampm}`;
}

function buildChartBars(entries: LogEntry[], period: Period): ChartBar[] {
  if (entries.length === 0) return [];
  const buckets: Record<string, number> = {};
  const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  if (period === "today") {
    for (let h = 0; h < 24; h++) buckets[pad(h)] = 0;
    for (const e of entries) {
      if (!e.time_seconds) continue;
      const h = new Date(e.start_time * 1000).getHours();
      buckets[pad(h)] = (buckets[pad(h)] || 0) + e.time_seconds;
    }
    return Object.entries(buckets).map(([k, v]) => ({ label: k + "h", seconds: v }));
  }

  if (period === "this_week" || period === "last_week") {
    for (let i = 0; i < 7; i++) buckets[i] = 0;
    for (const e of entries) {
      if (!e.time_seconds) continue;
      const dow = (new Date(e.start_time * 1000).getDay() + 6) % 7;
      buckets[dow] = (buckets[dow] || 0) + e.time_seconds;
    }
    return WEEK_DAYS.map((label, i) => ({ label, seconds: buckets[i] || 0 }));
  }

  for (const e of entries) {
    if (!e.time_seconds) continue;
    const key = pad(new Date(e.start_time * 1000).getDate());
    buckets[key] = (buckets[key] || 0) + e.time_seconds;
  }
  return Object.keys(buckets)
    .sort((a, b) => Number(a) - Number(b))
    .map((d) => ({ label: d, seconds: buckets[d] }));
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

const CHART_H = 120;
const Y_STEPS = 4;

function BarChart({ bars }: { bars: ChartBar[] }) {
  if (bars.length === 0) {
    return (
      <View style={{ height: CHART_H, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 12, color: "#cbd5e1" }}>No data for this period</Text>
      </View>
    );
  }

  const maxSec = Math.max(...bars.map((b) => b.seconds), 1);
  const availW = SCREEN_W - 80;
  const barW = Math.max(22, Math.floor((availW - 4 * (bars.length - 1)) / bars.length));

  const yLabels: string[] = [];
  for (let i = Y_STEPS; i >= 0; i--) {
    yLabels.push(fmtSecs(Math.round((maxSec * i) / Y_STEPS)));
  }

  return (
    <View style={{ flexDirection: "row", paddingTop: 8 }}>
      <View style={{ width: 48, height: CHART_H + 20, justifyContent: "space-between", alignItems: "flex-end", paddingRight: 6, paddingBottom: 20 }}>
        {yLabels.map((l, i) => (
          <Text key={i} style={{ fontSize: 9, color: "#94a3b8", fontWeight: "500" }}>{l}</Text>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
        <View>
          <View style={{ height: CHART_H, position: "relative", justifyContent: "flex-end" }}>
            {yLabels.map((_, i) => (
              <View key={i} style={{ position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "#f1f5f9", top: (i / Y_STEPS) * CHART_H }} />
            ))}
            <View style={{ flexDirection: "row", alignItems: "flex-end", height: CHART_H, gap: 4 }}>
              {bars.map((bar, i) => {
                const barH = (bar.seconds / maxSec) * CHART_H;
                return (
                  <View key={i} style={{ width: barW, alignItems: "center", justifyContent: "flex-end", height: CHART_H }}>
                    <View style={{ width: barW - 4, height: Math.max(barH, barH > 0 ? 3 : 0), backgroundColor: bar.seconds > 0 ? ACCENT : "#e2e8f0", borderRadius: 4 }} />
                  </View>
                );
              })}
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 4, marginTop: 4 }}>
            {bars.map((bar, i) => (
              <Text key={i} style={{ width: barW, fontSize: 9, color: "#94a3b8", textAlign: "center", fontWeight: "500" }} numberOfLines={1}>{bar.label}</Text>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Generic Filter Picker ────────────────────────────────────────────────────

function FilterPicker({
  icon,
  allLabel,
  sheetTitle,
  items,
  selected,
  onSelect,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  allLabel: string;
  sheetTitle: string;
  items: FilterItem[];
  selected: FilterItem | null;
  onSelect: (item: FilterItem | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const isActive = selected !== null;

  return (
    <>
      <TouchableOpacity
        style={[pickerStyles.chip, isActive && pickerStyles.chipActive]}
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
      >
        <Ionicons name={icon} size={13} color={isActive ? ACCENT : "#64748b"} />
        <Text style={[pickerStyles.chipText, isActive && pickerStyles.chipTextActive]} numberOfLines={1}>
          {selected ? selected.name : allLabel}
        </Text>
        <Ionicons name="chevron-down" size={12} color={isActive ? ACCENT : "#94a3b8"} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={pickerStyles.overlay} onPress={() => setOpen(false)}>
          <View style={pickerStyles.sheet}>
            <View style={pickerStyles.sheetHandle} />
            <Text style={pickerStyles.sheetTitle}>{sheetTitle}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[pickerStyles.option, !selected && pickerStyles.optionActive]}
                onPress={() => { onSelect(null); setOpen(false); }}
              >
                <Text style={[pickerStyles.optionText, !selected && pickerStyles.optionTextActive]}>
                  {allLabel}
                </Text>
                {!selected && <Ionicons name="checkmark" size={16} color={ACCENT} />}
              </TouchableOpacity>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[pickerStyles.option, selected?.id === item.id && pickerStyles.optionActive]}
                  onPress={() => { onSelect(item); setOpen(false); }}
                >
                  <Text style={[pickerStyles.optionText, selected?.id === item.id && pickerStyles.optionTextActive]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {selected?.id === item.id && <Ionicons name="checkmark" size={16} color={ACCENT} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const pickerStyles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "transparent",
    flex: 1,
  },
  chipActive: {
    backgroundColor: "#eef2ff",
    borderColor: "#c7d2fe",
  },
  chipText: { flex: 1, fontSize: 12, color: "#374151", fontWeight: "600" },
  chipTextActive: { color: ACCENT },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: "65%",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a", marginBottom: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
  },
  optionActive: { backgroundColor: "#eef2ff" },
  optionText: { fontSize: 14, color: "#374151", flex: 1 },
  optionTextActive: { color: ACCENT, fontWeight: "600" },
});

// ─── Main Component ───────────────────────────────────────────────────────────

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "this_week", label: "This Week" },
  { key: "last_week", label: "Last Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
];

export default function TimesheetScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("this_week");
  const [selectedStaff, setSelectedStaff] = useState<FilterItem | null>(null);
  const [selectedProject, setSelectedProject] = useState<FilterItem | null>(null);
  const [staffList, setStaffList] = useState<FilterItem[]>([]);
  const [projectList, setProjectList] = useState<FilterItem[]>([]);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const authHeaders = {
    Authorization: getAuthToken(),
    Cookie: getCrmCookie(),
    "X-User-Id": getUserId(),
  };

  // Fetch staff + project filter lists once on mount
  useEffect(() => {
    const base = getCrmApiUrl();
    const h = authHeaders;
    Promise.allSettled([
      fetch(`${base}/timesheets/staff`,    { headers: h }).then((r) => r.json()),
      fetch(`${base}/timesheets/projects`, { headers: h }).then((r) => r.json()),
    ]).then(([sRes, pRes]) => {
      if (sRes.status === "fulfilled" && sRes.value.status) setStaffList(sRes.value.data);
      if (pRes.status === "fulfilled" && pRes.value.status) setProjectList(pRes.value.data);
    });
  }, []);

  const fetchLogs = useCallback(
    async (pg: number, currentPeriod: Period, staffId: number, projectId: number) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      if (pg === 1) setLoading(true);
      setError(null);

      try {
        const dates = getFilterDates(currentPeriod);
        let url = `${getCrmApiUrl()}/timesheets/logs?page=${pg}&limit=100`;
        url += `&date_from=${dates.date_from}&date_to=${dates.date_to}`;
        if (staffId > 0)   url += `&staff_id=${staffId}`;
        if (projectId > 0) url += `&project_id=${projectId}`;

        const res = await fetch(url, { headers: authHeaders });
        const json = await res.json();

        if (json.status) {
          setEntries((prev) => (pg === 1 ? json.data : [...prev, ...json.data]));
          setHasMore(json.hasMore);
          setPage(pg);
        } else {
          setError(json.message || "Failed to load timesheets.");
        }
      } catch (e: any) {
        setError(e.message || "Network error.");
      } finally {
        fetchingRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    setEntries([]);
    setPage(1);
    setHasMore(true);
    fetchLogs(1, period, selectedStaff?.id ?? 0, selectedProject?.id ?? 0);
  }, [period, selectedStaff, selectedProject]);

  const onRefresh = () => {
    setRefreshing(true);
    setEntries([]);
    fetchLogs(1, period, selectedStaff?.id ?? 0, selectedProject?.id ?? 0);
  };

  const loadMore = () => {
    if (hasMore && !fetchingRef.current) {
      fetchLogs(page + 1, period, selectedStaff?.id ?? 0, selectedProject?.id ?? 0);
    }
  };

  const totalSecs = entries.reduce((sum, e) => sum + (e.time_seconds ?? 0), 0);
  const chartBars = buildChartBars(entries, period);
  const activeFilterCount = (selectedStaff ? 1 : 0) + (selectedProject ? 1 : 0);

  // ─── Entry card ─────────────────────────────────────────────────────────

  const renderEntry = ({ item }: { item: LogEntry }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>
          <Ionicons name="time-outline" size={16} color={ACCENT} />
        </View>
        <View style={styles.cardTitleCol}>
          <Text style={styles.taskName} numberOfLines={2}>
            {item.task_name || "—"}
          </Text>
          <View style={styles.metaRow}>
            {!!item.project_name && (
              <View style={styles.metaItem}>
                <Ionicons name="folder-outline" size={11} color="#94a3b8" />
                <Text style={styles.metaText}>{item.project_name}</Text>
              </View>
            )}
            {!!item.staff_name && !selectedStaff && staffList.length > 1 && (
              <View style={styles.metaItem}>
                <Ionicons name="person-outline" size={11} color="#94a3b8" />
                <Text style={styles.metaText}>{item.staff_name}</Text>
              </View>
            )}
          </View>
        </View>
        {item.time_formatted ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{item.time_formatted}</Text>
          </View>
        ) : (
          <View style={[styles.durationBadge, { backgroundColor: "#f0fdf4" }]}>
            <Text style={[styles.durationText, { color: "#16a34a" }]}>Active</Text>
          </View>
        )}
      </View>

      <View style={styles.timeRow}>
        <View style={styles.timeItem}>
          <Ionicons name="play-circle-outline" size={12} color="#94a3b8" />
          <Text style={styles.timeLabel}>Start</Text>
          <Text style={styles.timeValue}>{fmtTimestamp(item.start_time)}</Text>
        </View>
        <Ionicons name="arrow-forward" size={12} color="#e2e8f0" />
        <View style={styles.timeItem}>
          <Ionicons name="stop-circle-outline" size={12} color="#94a3b8" />
          <Text style={styles.timeLabel}>End</Text>
          <Text style={styles.timeValue}>
            {item.end_time ? fmtTimestamp(item.end_time) : "—"}
          </Text>
        </View>
      </View>

      {!!item.note && (
        <Text style={styles.note} numberOfLines={2}>{item.note}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>Timesheets</Text>
          {entries.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{entries.length}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* ── Period pills ── */}
      <View style={styles.periodBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContent}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.pill, period === p.key && styles.pillActive]}
              onPress={() => setPeriod(p.key)}
            >
              <Text style={[styles.pillText, period === p.key && styles.pillTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Filter chips: Staff + Project ── */}
      <View style={styles.filterRow}>
        <FilterPicker
          icon="person-outline"
          allLabel="All Staff"
          sheetTitle="Filter by Staff Member"
          items={staffList}
          selected={selectedStaff}
          onSelect={setSelectedStaff}
        />
        <FilterPicker
          icon="folder-outline"
          allLabel="All Projects"
          sheetTitle="Filter by Project"
          items={projectList}
          selected={selectedProject}
          onSelect={setSelectedProject}
        />
        {activeFilterCount > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => { setSelectedStaff(null); setSelectedProject(null); }}
          >
            <Ionicons name="close-circle" size={16} color="#94a3b8" />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderEntry}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ACCENT]} tintColor={ACCENT} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <>
            {/* ── Chart card ── */}
            <View style={styles.chartCard}>
              <View style={styles.chartTopRow}>
                <View>
                  <Text style={styles.chartLabel}>Logged Hours</Text>
                  <Text style={styles.chartTotal}>{fmtSecsHuman(totalSecs)}</Text>
                </View>
                <View style={styles.chartMeta}>
                  {activeFilterCount > 0 && (
                    <View style={styles.activeFilterBadge}>
                      <Text style={styles.activeFilterText}>{activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active</Text>
                    </View>
                  )}
                </View>
              </View>
              {loading && entries.length === 0 ? (
                <View style={{ height: CHART_H + 30, justifyContent: "center", alignItems: "center" }}>
                  <ActivityIndicator color={ACCENT} />
                </View>
              ) : (
                <BarChart bars={chartBars} />
              )}
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {entries.length > 0 && (
              <Text style={styles.sectionLabel}>{entries.length} entries</Text>
            )}
          </>
        }
        ListFooterComponent={
          hasMore && entries.length > 0 ? (
            <ActivityIndicator style={{ marginVertical: 16 }} color={ACCENT} />
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyBox}>
              <Ionicons name="time-outline" size={48} color="#e2e8f0" />
              <Text style={styles.emptyTitle}>No time logs found</Text>
              <Text style={styles.emptySubtitle}>
                No timesheets for the selected filters.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  headerTitleRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "700", color: "#0f172a" },
  countBadge: { backgroundColor: "#eef2ff", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  countText: { fontSize: 12, color: ACCENT, fontWeight: "600" },

  periodBar: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  pillsContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  pill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: "#f1f5f9" },
  pillActive: { backgroundColor: ACCENT },
  pillText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  pillTextActive: { color: "#fff" },

  // Filter row
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  clearText: { fontSize: 12, color: "#94a3b8", fontWeight: "600" },

  listContent: { padding: 16, gap: 10, paddingBottom: 40 },

  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  chartTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 },
  chartLabel: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  chartTotal: { fontSize: 22, fontWeight: "700", color: "#0f172a", marginTop: 2 },
  chartMeta: { alignItems: "flex-end", justifyContent: "flex-start" },
  activeFilterBadge: { backgroundColor: "#eef2ff", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  activeFilterText: { fontSize: 11, color: ACCENT, fontWeight: "600" },

  sectionLabel: { fontSize: 12, color: "#94a3b8", fontWeight: "600", marginBottom: 4, marginTop: 4 },

  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8, padding: 12,
    backgroundColor: "#fef2f2", borderRadius: 10, borderWidth: 1, borderColor: "#fecaca", marginBottom: 8,
  },
  errorText: { flex: 1, color: "#dc2626", fontSize: 13 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  iconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "#eef2ff", justifyContent: "center", alignItems: "center",
  },
  cardTitleCol: { flex: 1, gap: 4 },
  taskName: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 12, color: "#64748b" },
  durationBadge: { backgroundColor: "#eef2ff", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  durationText: { fontSize: 12, fontWeight: "700", color: ACCENT },

  timeRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#f8fafc", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
  },
  timeItem: { flex: 1, alignItems: "center", gap: 2 },
  timeLabel: { fontSize: 10, color: "#94a3b8", fontWeight: "500" },
  timeValue: { fontSize: 11, color: "#374151", fontWeight: "600" },

  note: { fontSize: 12, color: "#64748b", lineHeight: 18 },

  emptyBox: { alignItems: "center", paddingTop: 48, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptySubtitle: { fontSize: 13, color: "#94a3b8", textAlign: "center", paddingHorizontal: 32 },
});
