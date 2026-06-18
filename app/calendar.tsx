import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  fetchCalendarEvents,
  updateCalendarEvent,
} from "./utils/api";

const SCREEN_W = Dimensions.get("window").width;
const CELL_SIZE = Math.floor((SCREEN_W - 32) / 7);

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const EVENT_COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#0ea5e9"];

const pad = (n: number) => String(n).padStart(2, "0");
const toDateStr = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const getFirstDow = (y: number, m: number) => new Date(y, m, 1).getDay();

const formatTime = (dt: string) => {
  if (!dt) return "";
  const parts = dt.split(" ");
  if (parts.length < 2) return "";
  const [h, min] = parts[1].split(":");
  return `${h}:${min}`;
};

const stripHtml = (s: string) => (s || "").replace(/<[^>]+>/g, "");

export default function CalendarScreen() {
  const router = useRouter();
  const { date: paramDate } = useLocalSearchParams<{ date?: string }>();
  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const initDate = paramDate && /^\d{4}-\d{2}-\d{2}$/.test(paramDate) ? paramDate : todayStr;
  const initParsed = new Date(initDate + "T00:00:00");

  const [year, setYear] = useState(initParsed.getFullYear());
  const [month, setMonth] = useState(initParsed.getMonth());
  const [selectedDate, setSelectedDate] = useState(initDate);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [fTitle, setFTitle] = useState("");
  const [fDate, setFDate] = useState("");
  const [fStartTime, setFStartTime] = useState("09:00");
  const [fEndDate, setFEndDate] = useState("");
  const [fEndTime, setFEndTime] = useState("10:00");
  const [fDesc, setFDesc] = useState("");
  const [fColor, setFColor] = useState(EVENT_COLORS[0]);
  const [fPublic, setFPublic] = useState(false);

  const loadEvents = async (y: number, m: number) => {
    setLoading(true);
    const start = toDateStr(y, m, 1);
    const end = toDateStr(y, m, getDaysInMonth(y, m));
    const data = await fetchCalendarEvents(start, end);
    setEvents(data);
    setLoading(false);
  };

  useEffect(() => { loadEvents(year, month); }, [year, month]);

  const changeMonth = (delta: number) => {
    let nm = month + delta;
    let ny = year;
    if (nm < 0) { nm = 11; ny--; }
    if (nm > 11) { nm = 0; ny++; }
    setMonth(nm);
    setYear(ny);
  };

  const buildGrid = () => {
    const total = getDaysInMonth(year, month);
    const startDow = getFirstDow(year, month);
    const cells: (number | null)[] = Array(startDow).fill(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  };

  const eventsForDate = (dateStr: string) =>
    events.filter(e => e.start && e.start.startsWith(dateStr));

  const openAdd = () => {
    setEditingEvent(null);
    setFTitle("");
    setFDate(selectedDate);
    setFStartTime("09:00");
    setFEndDate(selectedDate);
    setFEndTime("10:00");
    setFDesc("");
    setFColor(EVENT_COLORS[0]);
    setFPublic(false);
    setModalVisible(true);
  };

  const openEdit = (ev: any) => {
    setEditingEvent(ev);
    setFTitle(ev.title || "");
    setFDate(ev.start ? ev.start.split(" ")[0] : selectedDate);
    setFStartTime(formatTime(ev.start) || "09:00");
    setFEndDate(ev.end ? ev.end.split(" ")[0] : (ev.start ? ev.start.split(" ")[0] : selectedDate));
    setFEndTime(formatTime(ev.end) || "");
    setFDesc(stripHtml(ev.description || ""));
    setFColor(ev.color || EVENT_COLORS[0]);
    setFPublic(ev.public == 1);
    setModalVisible(true);
  };

  const saveEvent = async () => {
    if (!fTitle.trim()) { Alert.alert("Required", "Title is required."); return; }
    setSaving(true);
    const payload: any = {
      title: fTitle.trim(),
      start: `${fDate} ${fStartTime}:00`,
      description: fDesc,
      color: fColor,
      public: fPublic ? 1 : 0,
    };
    if (fEndTime) payload.end = `${fEndDate || fDate} ${fEndTime}:00`;

    const result = editingEvent
      ? await updateCalendarEvent(editingEvent.id, payload)
      : await createCalendarEvent(payload);

    setSaving(false);
    if (result.status) {
      setModalVisible(false);
      loadEvents(year, month);
    } else {
      Alert.alert("Error", result.message || "Failed to save event.");
    }
  };

  const confirmDelete = (ev: any) => {
    Alert.alert("Delete Event", `Delete "${ev.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          await deleteCalendarEvent(ev.id);
          loadEvents(year, month);
        },
      },
    ]);
  };

  const grid = buildGrid();
  const selectedEvents = eventsForDate(selectedDate);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Month nav */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={20} color="#6366f1" />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTHS[month]} {year}</Text>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color="#6366f1" />
          </TouchableOpacity>
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarWrap}>
          <View style={styles.dowRow}>
            {DAYS_SHORT.map(d => (
              <Text key={d} style={styles.dowText}>{d}</Text>
            ))}
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#6366f1" size="large" />
            </View>
          ) : (
            <View style={styles.gridWrap}>
              {grid.map((day, idx) => {
                const dateStr = day !== null ? toDateStr(year, month, day) : "";
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const dotColors = day !== null
                  ? eventsForDate(dateStr).slice(0, 3).map(e => e.color || "#6366f1")
                  : [];
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.cell,
                      dotColors.length > 0 && !isSelected && styles.cellHasEvents,
                      isSelected && styles.cellSelected,
                    ]}
                    onPress={() => day !== null && setSelectedDate(dateStr)}
                    activeOpacity={day !== null ? 0.7 : 1}
                    disabled={day === null}
                  >
                    <View style={[isToday && !isSelected && styles.todayRing]}>
                      <Text style={[
                        styles.cellText,
                        isToday && !isSelected && styles.cellTodayText,
                        dotColors.length > 0 && !isSelected && !isToday && styles.cellHasEventsText,
                        isSelected && styles.cellTextSelected,
                      ]}>
                        {day ?? ""}
                      </Text>
                    </View>
                    <View style={styles.dotsRow}>
                      {dotColors.map((c, i) => (
                        <View key={i} style={[styles.dot, { backgroundColor: isSelected ? "#fff" : c }]} />
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Events for selected day */}
        <View style={styles.eventsSection}>
          <View style={styles.eventsSectionHeader}>
            <Text style={styles.eventsSectionTitle}>
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-GB", {
                weekday: "long", day: "numeric", month: "long",
              })}
            </Text>
            {selectedEvents.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{selectedEvents.length}</Text>
              </View>
            )}
          </View>

          {selectedEvents.length === 0 ? (
            <View style={styles.emptyEvents}>
              <Ionicons name="calendar-outline" size={40} color="#e2e8f0" />
              <Text style={styles.emptyText}>No events on this day</Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={openAdd}>
                <Text style={styles.emptyAddText}>Add Event</Text>
              </TouchableOpacity>
            </View>
          ) : (
            selectedEvents.map(ev => {
              const isReminder = ev.type === "reminder";
              return (
                <TouchableOpacity
                  key={ev.id}
                  style={styles.eventCard}
                  onPress={() => !isReminder && openEdit(ev)}
                  activeOpacity={isReminder ? 1 : 0.85}
                >
                  <View style={[styles.eventStripe, { backgroundColor: ev.color || "#6366f1" }]} />
                  <View style={styles.eventBody}>
                    <View style={styles.eventTitleRow}>
                      <Text style={styles.eventTitle} numberOfLines={1}>{ev.title}</Text>
                      {isReminder && (
                        <View style={styles.reminderBadge}>
                          <Ionicons name="alarm-outline" size={10} color="#f59e0b" />
                          <Text style={styles.reminderBadgeText}>Reminder</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.eventMeta}>
                      {ev.start ? (
                        <View style={styles.eventMetaRow}>
                          <Ionicons name="time-outline" size={12} color="#94a3b8" />
                          <Text style={styles.eventMetaText}>
                            {formatTime(ev.start)}{ev.end && ev.end !== ev.start ? ` – ${formatTime(ev.end)}` : ""}
                          </Text>
                        </View>
                      ) : null}
                      {ev.public == 1 && (
                        <View style={styles.publicBadge}>
                          <Text style={styles.publicText}>Public</Text>
                        </View>
                      )}
                    </View>
                    {ev.description ? (
                      <Text style={styles.eventDesc} numberOfLines={2}>{stripHtml(ev.description)}</Text>
                    ) : null}
                  </View>
                  {!isReminder && (
                    <TouchableOpacity onPress={() => confirmDelete(ev)} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingEvent ? "Edit Event" : "New Event"}</Text>
            <TouchableOpacity onPress={saveEvent} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color="#6366f1" />
                : <Text style={styles.saveBtn}>Save</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title *</Text>
              <TextInput
                style={styles.formInput}
                value={fTitle}
                onChangeText={setFTitle}
                placeholder="Event title"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Date</Text>
                <TextInput
                  style={styles.formInput}
                  value={fDate}
                  onChangeText={setFDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Start Time</Text>
                <TextInput
                  style={styles.formInput}
                  value={fStartTime}
                  onChangeText={setFStartTime}
                  placeholder="HH:MM"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>End Date</Text>
                <TextInput
                  style={styles.formInput}
                  value={fEndDate}
                  onChangeText={setFEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>End Time</Text>
                <TextInput
                  style={styles.formInput}
                  value={fEndTime}
                  onChangeText={setFEndTime}
                  placeholder="HH:MM (optional)"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextarea]}
                value={fDesc}
                onChangeText={setFDesc}
                placeholder="Optional description"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Color</Text>
              <View style={styles.colorRow}>
                {EVENT_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorSwatch, { backgroundColor: c }, fColor === c && styles.colorSwatchSelected]}
                    onPress={() => setFColor(c)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.formSwitchRow}>
              <View>
                <Text style={styles.formLabel}>Public</Text>
                <Text style={styles.formSubLabel}>Visible to all staff</Text>
              </View>
              <Switch
                value={fPublic}
                onValueChange={setFPublic}
                trackColor={{ false: "#e2e8f0", true: "#a5b4fc" }}
                thumbColor={fPublic ? "#6366f1" : "#94a3b8"}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "700", color: "#0f172a" },
  addBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "#6366f1", justifyContent: "center", alignItems: "center",
  },

  monthNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff",
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#eef2ff", justifyContent: "center", alignItems: "center",
  },
  monthLabel: { fontSize: 18, fontWeight: "700", color: "#0f172a" },

  calendarWrap: { backgroundColor: "#fff", paddingHorizontal: 16, paddingBottom: 16 },
  dowRow: { flexDirection: "row", marginBottom: 4 },
  dowText: {
    width: CELL_SIZE, textAlign: "center",
    fontSize: 11, fontWeight: "600", color: "#94a3b8", paddingVertical: 4,
  },
  loadingRow: { height: 220, justifyContent: "center", alignItems: "center" },
  gridWrap: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: CELL_SIZE, height: CELL_SIZE + 10,
    alignItems: "center", justifyContent: "center",
    borderRadius: 10, gap: 2,
  },
  cellSelected: { backgroundColor: "#6366f1" },
  cellHasEvents: { backgroundColor: "#eef2ff", borderRadius: 10 },
  todayRing: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "#6366f1",
    alignItems: "center", justifyContent: "center",
  },
  cellText: { fontSize: 14, fontWeight: "500", color: "#1e293b" },
  cellTodayText: { color: "#6366f1", fontWeight: "700" },
  cellHasEventsText: { color: "#4338ca", fontWeight: "700" },
  cellTextSelected: { color: "#fff", fontWeight: "700" },
  dotsRow: { flexDirection: "row", gap: 3, height: 6, alignItems: "center" },
  dot: { width: 6, height: 6, borderRadius: 3 },

  divider: { height: 8, backgroundColor: "#f1f5f9" },

  eventsSection: { padding: 16, paddingBottom: 60 },
  eventsSectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  eventsSectionTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  countBadge: { backgroundColor: "#eef2ff", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  countText: { fontSize: 12, color: "#6366f1", fontWeight: "600" },

  emptyEvents: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 13, color: "#94a3b8" },
  emptyAddBtn: { marginTop: 4, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: "#eef2ff", borderRadius: 20 },
  emptyAddText: { fontSize: 13, fontWeight: "600", color: "#6366f1" },

  eventCard: {
    backgroundColor: "#fff", borderRadius: 14, flexDirection: "row", alignItems: "stretch",
    marginBottom: 10, overflow: "hidden",
    shadowColor: "#64748b", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  eventStripe: { width: 4 },
  eventBody: { flex: 1, padding: 12 },
  eventTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  eventTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a", flexShrink: 1 },
  reminderBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#fef3c7", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  reminderBadgeText: { fontSize: 10, color: "#f59e0b", fontWeight: "600" },
  eventMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  eventMetaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  eventMetaText: { fontSize: 11, color: "#64748b" },
  publicBadge: { backgroundColor: "#eef2ff", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  publicText: { fontSize: 10, color: "#6366f1", fontWeight: "600" },
  eventDesc: { fontSize: 12, color: "#64748b", lineHeight: 17 },
  deleteBtn: { paddingHorizontal: 12, justifyContent: "center" },

  // Modal
  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : 20,
    paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#0f172a" },
  saveBtn: { fontSize: 15, fontWeight: "700", color: "#6366f1" },
  modalBody: { padding: 16 },

  formGroup: { marginBottom: 16 },
  formRow: { flexDirection: "row", gap: 12 },
  formLabel: { fontSize: 11, fontWeight: "700", color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  formSubLabel: { fontSize: 11, color: "#94a3b8", marginTop: -4, marginBottom: 0 },
  formInput: {
    backgroundColor: "#f8fafc", borderWidth: 1.5, borderColor: "#e2e8f0",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, color: "#1e293b",
  },
  formTextarea: { height: 80, paddingTop: 10 },
  colorRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  colorSwatch: { width: 32, height: 32, borderRadius: 16 },
  colorSwatchSelected: { borderWidth: 3, borderColor: "#0f172a" },
  formSwitchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
});
