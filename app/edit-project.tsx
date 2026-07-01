import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { StaffMember, fetchCrmProject, fetchCrmStaffs, updateCrmProject } from "./utils/api";

const STATUSES = [
  { value: "1", label: "Not Started", color: "#64748b" },
  { value: "2", label: "In Progress", color: "#3b82f6" },
  { value: "3", label: "On Hold",     color: "#f59e0b" },
  { value: "4", label: "Cancelled",   color: "#ef4444" },
  { value: "5", label: "Finished",    color: "#10b981" },
];

const BILLING_TYPES = [
  { value: "1", label: "Fixed Rate" },
  { value: "2", label: "Project Hours" },
  { value: "3", label: "Task Hours" },
  { value: "4", label: "Task Hourly Rate" },
];

export default function EditProjectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : (params.projectId as string);

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<StaffMember[]>([]);
  const [showMemberPicker, setShowMemberPicker] = useState(false);

  const [name, setName] = useState("");
  const [status, setStatus] = useState("1");
  const [billingType, setBillingType] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [projectCost, setProjectCost] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [ratePerHour, setRatePerHour] = useState("");
  const [progress, setProgress] = useState("");

  useEffect(() => {
    fetchCrmStaffs().then(setStaffList);
  }, []);

  const toggleMember = (s: StaffMember) => {
    setSelectedMembers(prev =>
      prev.some(m => String(m.staffid) === String(s.staffid))
        ? prev.filter(m => String(m.staffid) !== String(s.staffid))
        : [...prev, s]
    );
  };

  useEffect(() => {
    if (!projectId) { setLoadingData(false); return; }
    fetchCrmProject(projectId).then((p) => {
      if (p) {
        setName(p.name || "");
        setStatus(p.status || "1");
        setBillingType(p.billing_type || "1");
        setStartDate(p.start_date?.slice(0, 10) || "");
        setDeadline(p.deadline?.slice(0, 10) === "0000-00-00" ? "" : (p.deadline?.slice(0, 10) || ""));
        setDescription(p.description || "");
        setProjectCost(p.project_cost && parseFloat(p.project_cost) > 0 ? p.project_cost : "");
        setEstimatedHours(p.estimated_hours && parseFloat(p.estimated_hours) > 0 ? p.estimated_hours : "");
        setRatePerHour(p.project_rate_per_hour && parseFloat(p.project_rate_per_hour) > 0 ? p.project_rate_per_hour : "");
        setProgress(p.progress || "0");
      }
      setLoadingData(false);
    });
  }, [projectId]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Required";
    if (!startDate.match(/^\d{4}-\d{2}-\d{2}$/)) errs.startDate = "Use YYYY-MM-DD";
    if (deadline && !deadline.match(/^\d{4}-\d{2}-\d{2}$/)) errs.deadline = "Use YYYY-MM-DD";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const result = await updateCrmProject(projectId, {
        name: name.trim(),
        billing_type: billingType,
        start_date: startDate,
        status,
        deadline: deadline || "",
        description: description.trim(),
        project_cost: projectCost || "0",
        estimated_hours: estimatedHours || "0",
        project_rate_per_hour: ratePerHour || "0",
        progress,
        ...(selectedMembers.length > 0 ? { project_members: selectedMembers.map(m => String(m.staffid)) } : {}),
      });

      if (result.status) {
        Alert.alert("Success", "Project updated successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", result.message || "Failed to update project");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading project...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Project</Text>
          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Project Details ── */}
          <Section title="Project Details">
            <Field label="Project Name *" error={errors.name}>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={name}
                onChangeText={setName}
                placeholder="Project name"
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

            <Field label="Billing Type">
              <View style={styles.chipRow}>
                {BILLING_TYPES.map((b) => (
                  <TouchableOpacity
                    key={b.value}
                    style={[styles.chip, billingType === b.value && styles.chipActive]}
                    onPress={() => setBillingType(b.value)}
                  >
                    <Text style={[styles.chipText, billingType === b.value && styles.chipTextActive]}>{b.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Field>

            <Field label="Progress (0–100)">
              <TextInput
                style={styles.input}
                value={progress}
                onChangeText={setProgress}
                placeholder="0"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />
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
                <Field label="Deadline (YYYY-MM-DD)" error={errors.deadline}>
                  <TextInput
                    style={[styles.input, errors.deadline && styles.inputError]}
                    value={deadline}
                    onChangeText={setDeadline}
                    placeholder="2024-06-30"
                    placeholderTextColor="#94a3b8"
                  />
                </Field>
              </View>
            </View>
          </Section>

          {/* ── Financial ── */}
          <Section title="Financial">
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="Project Cost (AED)">
                  <TextInput
                    style={styles.input}
                    value={projectCost}
                    onChangeText={setProjectCost}
                    placeholder="0.00"
                    placeholderTextColor="#94a3b8"
                    keyboardType="decimal-pad"
                  />
                </Field>
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <Field label="Estimated Hours">
                  <TextInput
                    style={styles.input}
                    value={estimatedHours}
                    onChangeText={setEstimatedHours}
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                    keyboardType="decimal-pad"
                  />
                </Field>
              </View>
            </View>

            {(billingType === "2" || billingType === "3" || billingType === "4") && (
              <Field label="Rate Per Hour (AED)">
                <TextInput
                  style={styles.input}
                  value={ratePerHour}
                  onChangeText={setRatePerHour}
                  placeholder="0.00"
                  placeholderTextColor="#94a3b8"
                  keyboardType="decimal-pad"
                />
              </Field>
            )}
          </Section>

          {/* ── Team Members ── */}
          <Section title="Team Members">
            {selectedMembers.length > 0 && (
              <View style={styles.chipRow}>
                {selectedMembers.map((m) => (
                  <TouchableOpacity key={m.staffid} style={styles.memberChip} onPress={() => toggleMember(m)}>
                    <Text style={styles.memberChipText}>{m.firstname} {m.lastname}</Text>
                    <Ionicons name="close-circle" size={15} color="#3b82f6" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity style={styles.pickerToggle} onPress={() => setShowMemberPicker((v) => !v)}>
              <Ionicons name="people-outline" size={16} color="#3b82f6" />
              <Text style={styles.pickerToggleText}>{showMemberPicker ? "Close" : "Add Members"}</Text>
              <Ionicons name={showMemberPicker ? "chevron-up" : "chevron-down"} size={14} color="#3b82f6" />
            </TouchableOpacity>
            {showMemberPicker && (
              <View style={styles.staffList}>
                {staffList.length === 0 ? (
                  <ActivityIndicator size="small" color="#3b82f6" style={{ padding: 12 }} />
                ) : (
                  staffList.map((s) => {
                    const sel = selectedMembers.some((m) => String(m.staffid) === String(s.staffid));
                    return (
                      <TouchableOpacity
                        key={s.staffid}
                        style={[styles.staffRow, sel && styles.staffRowSelected]}
                        onPress={() => toggleMember(s)}
                      >
                        <View style={[styles.staffAvatar, sel && styles.staffAvatarSelected]}>
                          <Text style={[styles.staffAvatarText, sel && { color: "#fff" }]}>
                            {(s.firstname || "?").charAt(0)}{(s.lastname || "").charAt(0)}
                          </Text>
                        </View>
                        <Text style={styles.staffName}>{s.firstname} {s.lastname}</Text>
                        {sel && <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />}
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}
          </Section>

          {/* ── Description ── */}
          <Section title="Description">
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Project description / notes..."
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
                <Text style={styles.bottomBtnText}>Save Changes</Text>
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
  title: { fontSize: 12, fontWeight: "700", color: "#3b82f6", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 14 },
});

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontSize: 11, fontWeight: "600", color: "#64748b", marginBottom: 5, letterSpacing: 0.3 },
  error: { fontSize: 11, color: "#dc2626", marginTop: 3 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },
  loadingText: { fontSize: 14, color: "#64748b" },

  header: { backgroundColor: "#3b82f6", flexDirection: "row", alignItems: "center", paddingBottom: 14, paddingHorizontal: 16, gap: 12 },
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
  chipActive: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  chipTextActive: { color: "#fff" },

  bottomBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#3b82f6", borderRadius: 14, paddingVertical: 16, shadowColor: "#3b82f6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  bottomBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  memberChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: "#eff6ff", borderRadius: 20, borderWidth: 1.5, borderColor: "#bfdbfe", marginBottom: 8 },
  memberChipText: { fontSize: 13, fontWeight: "600", color: "#1d4ed8" },
  pickerToggle: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 4 },
  pickerToggleText: { fontSize: 13, fontWeight: "600", color: "#3b82f6", flex: 1 },
  staffList: { borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 12, overflow: "hidden", marginTop: 4 },
  staffRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", backgroundColor: "#fff" },
  staffRowSelected: { backgroundColor: "#f0f9ff" },
  staffAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#e2e8f0", justifyContent: "center", alignItems: "center" },
  staffAvatarSelected: { backgroundColor: "#3b82f6" },
  staffAvatarText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  staffName: { flex: 1, fontSize: 14, fontWeight: "500", color: "#1e293b" },
});
