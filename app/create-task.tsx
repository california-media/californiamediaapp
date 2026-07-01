import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StaffMember, createTask, fetchAllLeads, fetchCrmProjects, fetchCrmStaffs, fetchCustomers, fetchInvoices, fetchProposals } from "./utils/api";
import { getStaffInfo } from "./utils/config";

const STATUSES = [
  { value: "1", label: "Not Started", color: "#64748b" },
  { value: "2", label: "In Progress",  color: "#3b82f6" },
  { value: "3", label: "Testing",      color: "#8b5cf6" },
  { value: "4", label: "Awaiting",     color: "#f59e0b" },
  { value: "5", label: "Complete",     color: "#10b981" },
];

const PRIORITIES = [
  { value: "1", label: "Low",    color: "#10b981" },
  { value: "2", label: "Medium", color: "#3b82f6" },
  { value: "3", label: "High",   color: "#f59e0b" },
  { value: "4", label: "Urgent", color: "#ef4444" },
];

const REL_TYPES = ["project", "customer", "invoice", "lead", "ticket", "expense", "proposal"];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function CreateTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const staffInfo = getStaffInfo();

  const [name, setName] = useState("");
  const [status, setStatus] = useState("1");
  const [priority, setPriority] = useState("2");
  const [startDate, setStartDate] = useState(todayStr());
  const [dueDate, setDueDate] = useState("");
  const [relType, setRelType] = useState("project");
  const [relId, setRelId] = useState("");
  const [relSelected, setRelSelected] = useState<{ id: string; name: string } | null>(null);
  const [relSearch, setRelSearch] = useState("");
  const [relResults, setRelResults] = useState<Array<{ id: string; name: string }>>([]);
  const [relLoading, setRelLoading] = useState(false);
  const relTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [billable, setBillable] = useState(false);
  const [hourlyRate, setHourlyRate] = useState("");

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<StaffMember[]>([]);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Clear related selection when type changes
  useEffect(() => {
    setRelSelected(null);
    setRelId("");
    setRelSearch("");
    setRelResults([]);
  }, [relType]);

  // Debounced related search
  useEffect(() => {
    if (relTimer.current) clearTimeout(relTimer.current);
    if (!relSearch.trim()) { setRelResults([]); return; }
    relTimer.current = setTimeout(async () => {
      setRelLoading(true);
      try {
        let results: Array<{ id: string; name: string }> = [];
        if (relType === "project") {
          const data = await fetchCrmProjects();
          results = data
            .filter(p => p.name.toLowerCase().includes(relSearch.toLowerCase()))
            .slice(0, 8)
            .map(p => ({ id: String(p.id), name: p.name }));
        } else if (relType === "customer") {
          const res = await fetchCustomers({ search: relSearch, limit: 8 });
          results = res.data.map(c => ({
            id: String(c.id || c.userid),
            name: c.company || `${c.firstname || ""} ${c.lastname || ""}`.trim() || `Client #${c.id || c.userid}`,
          }));
        } else if (relType === "lead") {
          const res = await fetchAllLeads({ search: relSearch, limit: 8 });
          results = res.data.map((l: any) => ({
            id: String(l.id),
            name: l.name || `${l.firstname || ""} ${l.lastname || ""}`.trim() || `Lead #${l.id}`,
          }));
        } else if (relType === "invoice") {
          const data = await fetchInvoices();
          results = data
            .filter(i => String(i.number || i.id).includes(relSearch) || String(i.id).includes(relSearch))
            .slice(0, 8)
            .map(i => ({ id: String(i.id), name: `${i.prefix || ""}${i.number || i.id}` }));
        } else if (relType === "proposal") {
          const data = await fetchProposals();
          results = data
            .filter(p => (p.subject || "").toLowerCase().includes(relSearch.toLowerCase()) || String(p.id).includes(relSearch))
            .slice(0, 8)
            .map(p => ({ id: String(p.id), name: p.subject || `Proposal #${p.id}` }));
        }
        setRelResults(results);
      } finally {
        setRelLoading(false);
      }
    }, 350);
  }, [relSearch, relType]);

  const selectRelated = (item: { id: string; name: string }) => {
    setRelSelected(item);
    setRelId(item.id);
    setRelSearch("");
    setRelResults([]);
  };

  const clearRelated = () => {
    setRelSelected(null);
    setRelId("");
    setRelSearch("");
    setRelResults([]);
  };

  useEffect(() => {
    fetchCrmStaffs().then(setStaffList);
    if (staffInfo) {
      const me: StaffMember = {
        staffid: Number(staffInfo.staffid),
        firstname: staffInfo.firstname,
        lastname: staffInfo.lastname,
        email: staffInfo.email,
      };
      setSelectedAssignees([me]);
    }
  }, []);

  const toggleAssignee = (s: StaffMember) => {
    setSelectedAssignees(prev =>
      prev.some(m => String(m.staffid) === String(s.staffid))
        ? prev.filter(m => String(m.staffid) !== String(s.staffid))
        : [...prev, s]
    );
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Required";
    if (!startDate.match(/^\d{4}-\d{2}-\d{2}$/)) errs.startDate = "Use YYYY-MM-DD";
    if (dueDate && !dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) errs.dueDate = "Use YYYY-MM-DD";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const result = await createTask({
        name: name.trim(),
        startdate: startDate,
        duedate: dueDate || undefined,
        priority,
        status,
        rel_type: relType || undefined,
        rel_id: relId || undefined,
        description: description.trim() || undefined,
        is_public: isPublic ? "on" : undefined,
        billable: billable ? "on" : undefined,
        hourly_rate: hourlyRate || undefined,
        assigned: selectedAssignees.length > 0 ? selectedAssignees.map(m => String(m.staffid)) : undefined,
      });

      if (result.status) {
        Alert.alert("Success", "Task created successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", result.message || "Failed to create task");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Task</Text>
          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Task Details ── */}
          <Section title="Task Details">
            <Field label="Task Name *" error={errors.name}>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={name}
                onChangeText={setName}
                placeholder="Task name"
                placeholderTextColor="#94a3b8"
              />
            </Field>

            <Field label="Status">
              <View style={styles.chipRow}>
                {STATUSES.map((s) => (
                  <TouchableOpacity
                    key={s.value}
                    style={[styles.chip, status === s.value && { backgroundColor: s.color, borderColor: s.color }]}
                    onPress={() => setStatus(s.value)}
                  >
                    <Text style={[styles.chipText, status === s.value && styles.chipTextActive]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Field>

            <Field label="Priority">
              <View style={styles.chipRow}>
                {PRIORITIES.map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    style={[styles.chip, priority === p.value && { backgroundColor: p.color, borderColor: p.color }]}
                    onPress={() => setPriority(p.value)}
                  >
                    <Text style={[styles.chipText, priority === p.value && styles.chipTextActive]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Field>
          </Section>

          {/* ── Dates ── */}
          <Section title="Dates">
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="Start Date * (YYYY-MM-DD)" error={errors.startDate}>
                  <TextInput
                    style={[styles.input, errors.startDate && styles.inputError]}
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="2024-01-01"
                    placeholderTextColor="#94a3b8"
                  />
                </Field>
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <Field label="Due Date (YYYY-MM-DD)" error={errors.dueDate}>
                  <TextInput
                    style={[styles.input, errors.dueDate && styles.inputError]}
                    value={dueDate}
                    onChangeText={setDueDate}
                    placeholder="2024-06-30"
                    placeholderTextColor="#94a3b8"
                  />
                </Field>
              </View>
            </View>
          </Section>

          {/* ── Related ── */}
          <Section title="Related To (Optional)">
            <Field label="Type">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={[styles.chipRow, { flexWrap: "nowrap" }]}>
                  {REL_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.chip, relType === t && styles.chipActive]}
                      onPress={() => setRelType(t)}
                    >
                      <Text style={[styles.chipText, relType === t && styles.chipTextActive, { textTransform: "capitalize" }]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </Field>

            {["project", "customer", "lead", "invoice", "proposal"].includes(relType) ? (
              <Field label={`Select ${relType.charAt(0).toUpperCase() + relType.slice(1)}`}>
                {relSelected ? (
                  <View style={styles.selectedEntity}>
                    <View style={styles.selectedEntityLeft}>
                      <Ionicons name="checkmark-circle" size={18} color="#059669" />
                      <View>
                        <Text style={styles.selectedEntityName}>{relSelected.name}</Text>
                        <Text style={styles.selectedEntityId}>{relType.charAt(0).toUpperCase() + relType.slice(1)} #{relSelected.id}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={clearRelated} style={styles.clearBtn}>
                      <Ionicons name="close" size={16} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={styles.searchWrap}>
                      <Ionicons name="search-outline" size={16} color="#94a3b8" />
                      <TextInput
                        style={styles.searchInner}
                        value={relSearch}
                        onChangeText={setRelSearch}
                        placeholder={`Search ${relType}s...`}
                        placeholderTextColor="#94a3b8"
                        autoCorrect={false}
                        autoCapitalize="none"
                      />
                      {relLoading && <ActivityIndicator size="small" color="#8b5cf6" />}
                    </View>
                    {relResults.length > 0 && (
                      <View style={styles.searchResults}>
                        {relResults.map((item) => (
                          <TouchableOpacity
                            key={item.id}
                            style={styles.searchResultRow}
                            onPress={() => selectRelated(item)}
                          >
                            <Ionicons name="link-outline" size={15} color="#8b5cf6" />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.searchResultName}>{item.name}</Text>
                              <Text style={styles.searchResultId}>ID: {item.id}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={14} color="#cbd5e1" />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </Field>
            ) : (
              <Field label="Related ID">
                <TextInput
                  style={styles.input}
                  value={relId}
                  onChangeText={setRelId}
                  placeholder="e.g. 12"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
              </Field>
            )}
          </Section>

          {/* ── Assignees ── */}
          <Section title="Assigned To">
            {selectedAssignees.length > 0 && (
              <View style={styles.chipRow}>
                {selectedAssignees.map((m) => (
                  <TouchableOpacity key={m.staffid} style={styles.memberChip} onPress={() => toggleAssignee(m)}>
                    <Text style={styles.memberChipText}>{m.firstname} {m.lastname}</Text>
                    <Ionicons name="close-circle" size={15} color="#8b5cf6" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity style={styles.pickerToggle} onPress={() => setShowAssigneePicker((v) => !v)}>
              <Ionicons name="people-outline" size={16} color="#8b5cf6" />
              <Text style={styles.pickerToggleText}>{showAssigneePicker ? "Close" : "Browse Staff"}</Text>
              <Ionicons name={showAssigneePicker ? "chevron-up" : "chevron-down"} size={14} color="#8b5cf6" />
            </TouchableOpacity>
            {showAssigneePicker && (
              <View style={styles.staffList}>
                {staffList.length === 0 ? (
                  <ActivityIndicator size="small" color="#8b5cf6" style={{ padding: 12 }} />
                ) : (
                  staffList.map((s) => {
                    const sel = selectedAssignees.some((m) => String(m.staffid) === String(s.staffid));
                    return (
                      <TouchableOpacity
                        key={s.staffid}
                        style={[styles.staffRow, sel && styles.staffRowSelected]}
                        onPress={() => toggleAssignee(s)}
                      >
                        <View style={[styles.staffAvatar, sel && styles.staffAvatarSelected]}>
                          <Text style={[styles.staffAvatarText, sel && { color: "#fff" }]}>
                            {(s.firstname || "?").charAt(0)}{(s.lastname || "").charAt(0)}
                          </Text>
                        </View>
                        <Text style={styles.staffName}>{s.firstname} {s.lastname}</Text>
                        {sel && <Ionicons name="checkmark-circle" size={18} color="#8b5cf6" />}
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}
          </Section>

          {/* ── Options ── */}
          <Section title="Options">
            <View style={styles.toggleRow}>
              <TouchableOpacity style={[styles.toggle, isPublic && styles.toggleActive]} onPress={() => setIsPublic((v) => !v)}>
                <Ionicons name={isPublic ? "globe" : "globe-outline"} size={16} color={isPublic ? "#fff" : "#64748b"} />
                <Text style={[styles.toggleText, isPublic && styles.toggleTextActive]}>Public</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggle, billable && styles.toggleActive]} onPress={() => setBillable((v) => !v)}>
                <Ionicons name={billable ? "cash" : "cash-outline"} size={16} color={billable ? "#fff" : "#64748b"} />
                <Text style={[styles.toggleText, billable && styles.toggleTextActive]}>Billable</Text>
              </TouchableOpacity>
            </View>
            {billable && (
              <Field label="Hourly Rate (AED)">
                <TextInput
                  style={styles.input}
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  placeholder="0.00"
                  placeholderTextColor="#94a3b8"
                  keyboardType="decimal-pad"
                />
              </Field>
            )}
          </Section>

          {/* ── Description ── */}
          <Section title="Description">
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Task description..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </Section>

          {/* Bottom save */}
          <TouchableOpacity style={[styles.bottomBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.bottomBtnText}>Create Task</Text>
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.wrap}>
      <Text style={sectionStyles.title}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      {children}
      {error ? <Text style={fieldStyles.error}>{error}</Text> : null}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrap: { backgroundColor: "#fff", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  title: { fontSize: 12, fontWeight: "700", color: "#8b5cf6", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 14 },
});

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontSize: 11, fontWeight: "600", color: "#64748b", marginBottom: 5, letterSpacing: 0.3 },
  error: { fontSize: 11, color: "#dc2626", marginTop: 3 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },

  header: { backgroundColor: "#8b5cf6", flexDirection: "row", alignItems: "center", paddingBottom: 14, paddingHorizontal: 16, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", alignItems: "center" },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "700", color: "#fff" },
  saveBtn: { backgroundColor: "rgba(255,255,255,0.22)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  scroll: { padding: 16, gap: 14 },

  input: { height: 44, backgroundColor: "#f8fafc", borderRadius: 10, borderWidth: 1.5, borderColor: "#e2e8f0", paddingHorizontal: 12, fontSize: 14, color: "#1e293b" },
  textarea: { height: 110, paddingTop: 10 },
  inputError: { borderColor: "#fca5a5" },

  row: { flexDirection: "row", alignItems: "flex-start" },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" },
  chipActive: { backgroundColor: "#8b5cf6", borderColor: "#8b5cf6" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  chipTextActive: { color: "#fff" },

  toggleRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  toggle: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" },
  toggleActive: { backgroundColor: "#8b5cf6", borderColor: "#8b5cf6" },
  toggleText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  toggleTextActive: { color: "#fff" },

  searchWrap: { flexDirection: "row", alignItems: "center", height: 44, backgroundColor: "#f8fafc", borderRadius: 10, borderWidth: 1.5, borderColor: "#e2e8f0", paddingHorizontal: 12, gap: 8 },
  searchInner: { flex: 1, fontSize: 14, color: "#1e293b" },
  searchResults: { borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 10, marginTop: 4, overflow: "hidden" },
  searchResultRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", backgroundColor: "#fff" },
  searchResultName: { fontSize: 14, fontWeight: "600", color: "#1e293b" },
  searchResultId: { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  selectedEntity: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f0fdf4", borderRadius: 10, borderWidth: 1.5, borderColor: "#86efac", padding: 12 },
  selectedEntityLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  selectedEntityName: { fontSize: 14, fontWeight: "600", color: "#1e293b" },
  selectedEntityId: { fontSize: 11, color: "#64748b", marginTop: 1 },
  clearBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: "#e2e8f0", justifyContent: "center", alignItems: "center" },

  memberChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: "#f5f3ff", borderRadius: 20, borderWidth: 1.5, borderColor: "#ddd6fe", marginBottom: 8 },
  memberChipText: { fontSize: 13, fontWeight: "600", color: "#6d28d9" },
  pickerToggle: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 4 },
  pickerToggleText: { fontSize: 13, fontWeight: "600", color: "#8b5cf6", flex: 1 },
  staffList: { borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 12, overflow: "hidden", marginTop: 4 },
  staffRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", backgroundColor: "#fff" },
  staffRowSelected: { backgroundColor: "#faf5ff" },
  staffAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#e2e8f0", justifyContent: "center", alignItems: "center" },
  staffAvatarSelected: { backgroundColor: "#8b5cf6" },
  staffAvatarText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  staffName: { flex: 1, fontSize: 14, fontWeight: "500", color: "#1e293b" },

  bottomBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#8b5cf6", borderRadius: 14, paddingVertical: 16, shadowColor: "#8b5cf6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  bottomBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
