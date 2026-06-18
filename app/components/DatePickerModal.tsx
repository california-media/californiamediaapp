import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SCREEN_W = Dimensions.get("window").width;
const CELL = Math.floor((SCREEN_W - 48) / 7);

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const pad = (n: number) => String(n).padStart(2, "0");
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const firstDow = (y: number, m: number) => new Date(y, m, 1).getDay();
const toStr = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export function formatDateDisplay(dateStr: string) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

interface Props {
  visible: boolean;
  value: string;
  onSelect: (date: string) => void;
  onClose: () => void;
  label?: string;
}

export function DatePickerModal({ visible, value, onSelect, onClose, label = "Select Date" }: Props) {
  const today = new Date();
  const todayStr = toStr(today.getFullYear(), today.getMonth(), today.getDate());

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  useEffect(() => {
    if (visible) {
      if (value && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        setYear(parseInt(value.split("-")[0]));
        setMonth(parseInt(value.split("-")[1]) - 1);
      } else {
        setYear(today.getFullYear());
        setMonth(today.getMonth());
      }
    }
  }, [visible]);

  const changeMonth = (delta: number) => {
    let nm = month + delta;
    let ny = year;
    if (nm < 0) { nm = 11; ny--; }
    if (nm > 11) { nm = 0; ny++; }
    setMonth(nm);
    setYear(ny);
  };

  const buildGrid = () => {
    const total = daysInMonth(year, month);
    const start = firstDow(year, month);
    const cells: (number | null)[] = Array(start).fill(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  };

  const grid = buildGrid();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{label}</Text>
            {value ? (
              <TouchableOpacity onPress={() => { onSelect(""); onClose(); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>

          {/* Month nav */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={18} color="#6366f1" />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{MONTHS[month]} {year}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={18} color="#6366f1" />
            </TouchableOpacity>
          </View>

          {/* Day of week header */}
          <View style={styles.dowRow}>
            {DAYS.map(d => (
              <Text key={d} style={styles.dowText}>{d}</Text>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {grid.map((day, idx) => {
              const dateStr = day !== null ? toStr(year, month, day) : "";
              const isSelected = !!dateStr && dateStr === value;
              const isToday = dateStr === todayStr;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.cell, isSelected && styles.cellSelected]}
                  onPress={() => { if (day !== null) { onSelect(dateStr); onClose(); } }}
                  disabled={day === null}
                  activeOpacity={day !== null ? 0.7 : 1}
                >
                  <View style={[isToday && !isSelected && styles.todayRing]}>
                    <Text style={[
                      styles.cellText,
                      isToday && !isSelected && styles.cellTodayText,
                      isSelected && styles.cellTextSelected,
                      day === null && styles.cellEmpty,
                    ]}>
                      {day ?? ""}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected display */}
          {value ? (
            <View style={styles.selectedRow}>
              <Ionicons name="checkmark-circle" size={16} color="#6366f1" />
              <Text style={styles.selectedText}>{formatDateDisplay(value)}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0",
    alignSelf: "center", marginBottom: 16,
  },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12,
  },
  title: { fontSize: 17, fontWeight: "700", color: "#0f172a" },
  cancelText: { fontSize: 14, color: "#64748b", fontWeight: "500" },
  clearText: { fontSize: 14, color: "#ef4444", fontWeight: "600" },

  monthNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 12,
  },
  navBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "#eef2ff", justifyContent: "center", alignItems: "center",
  },
  monthLabel: { fontSize: 16, fontWeight: "700", color: "#0f172a" },

  dowRow: { flexDirection: "row", marginBottom: 4 },
  dowText: {
    width: CELL, textAlign: "center",
    fontSize: 11, fontWeight: "600", color: "#94a3b8", paddingVertical: 4,
  },

  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: CELL, height: CELL,
    alignItems: "center", justifyContent: "center",
    borderRadius: 10,
  },
  cellSelected: { backgroundColor: "#6366f1" },
  todayRing: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 2, borderColor: "#6366f1",
    alignItems: "center", justifyContent: "center",
  },
  cellText: { fontSize: 14, fontWeight: "500", color: "#1e293b" },
  cellTodayText: { color: "#6366f1", fontWeight: "700" },
  cellTextSelected: { color: "#fff", fontWeight: "700" },
  cellEmpty: { color: "transparent" },

  selectedRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: "#f1f5f9",
  },
  selectedText: { fontSize: 14, fontWeight: "600", color: "#6366f1" },
});
