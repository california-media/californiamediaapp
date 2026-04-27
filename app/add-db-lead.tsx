import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuthToken, getCrmApiUrl, getCrmCookie, getUserId } from './utils/config';
import { DbLead } from './types';

interface Source { id: number; name: string; }
interface LeadStatus { id: number; name: string; color: string; }
interface Agent { staffid: number; firstname: string; lastname: string; }

interface PickerState {
  visible: boolean;
  title: string;
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (value: string) => void;
}

const buildHeaders = (form = false): Record<string, string> => ({
  Authorization: getAuthToken(),
  'X-User-Id': getUserId(),
  Cookie: getCrmCookie(),
  Accept: 'application/json',
  ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
});

const apiGet = async (path: string): Promise<any> => {
  const res = await fetch(`${getCrmApiUrl()}${path}`, { headers: buildHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const apiPostForm = async (path: string, body: Record<string, string>): Promise<any> => {
  const res = await fetch(`${getCrmApiUrl()}${path}`, {
    method: 'POST',
    headers: buildHeaders(true),
    body: new URLSearchParams(body).toString(),
  });
  return res.json();
};

const apiPutForm = async (path: string, body: Record<string, string>): Promise<any> => {
  const res = await fetch(`${getCrmApiUrl()}${path}`, {
    method: 'PUT',
    headers: buildHeaders(true),
    body: new URLSearchParams(body).toString(),
  });
  return res.json();
};

export default function AddDbLeadScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const existingLead: DbLead | null = params.lead
    ? JSON.parse(params.lead as string)
    : null;
  const isEdit = !!existingLead;

  // Form state
  const [fullName, setFullName] = useState(existingLead?.full_name ?? '');
  const [mobile, setMobile] = useState(existingLead?.mobile_number ?? '');
  const [email, setEmail] = useState(existingLead?.email ?? '');
  const [area, setArea] = useState(existingLead?.area ?? '');
  const [city, setCity] = useState(existingLead?.city ?? '');
  const [budget, setBudget] = useState(existingLead?.budget ?? '');

  const [sourceId, setSourceId] = useState(existingLead?.source ?? '');
  const [sourceName, setSourceName] = useState(existingLead?.source_name ?? '');
  const [statusId, setStatusId] = useState(existingLead?.status ?? '');
  const [statusName, setStatusName] = useState(existingLead?.status_name ?? '');
  const [assignedId, setAssignedId] = useState(existingLead?.assigned ?? '');
  const [assignedName, setAssignedName] = useState(existingLead?.assigned_name ?? '');

  // Dropdown data
  const [sources, setSources] = useState<Source[]>([]);
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);

  // Picker modal
  const [picker, setPicker] = useState<PickerState>({
    visible: false, title: '', options: [], selected: '', onSelect: () => {},
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      apiGet('/db_lead_sources').catch(() => []),
      apiGet('/db_lead_statuses').catch(() => []),
      apiGet('/assigned_agents').catch(() => []),
    ]).then(([src, sta, agt]) => {
      setSources(Array.isArray(src) ? src : []);
      setStatuses(Array.isArray(sta) ? sta : []);
      setAgents(Array.isArray(agt) ? agt : []);
    }).finally(() => setMetaLoading(false));
  }, []);

  const openPicker = (
    title: string,
    options: { label: string; value: string }[],
    selected: string,
    onSelect: (v: string) => void,
  ) => setPicker({ visible: true, title, options, selected, onSelect });

  const openSourcePicker = () =>
    openPicker('Source', sources.map(s => ({ label: s.name, value: String(s.id) })), sourceId, v => {
      setSourceId(v);
      setSourceName(sources.find(s => String(s.id) === v)?.name ?? '');
    });

  const openStatusPicker = () =>
    openPicker('Status', statuses.map(s => ({ label: s.name, value: String(s.id) })), statusId, v => {
      setStatusId(v);
      setStatusName(statuses.find(s => String(s.id) === v)?.name ?? '');
    });

  const openAgentPicker = () =>
    openPicker(
      'Assigned Agent',
      agents.map(a => ({ label: `${a.firstname} ${a.lastname}`, value: String(a.staffid) })),
      assignedId,
      v => {
        setAssignedId(v);
        const ag = agents.find(a => String(a.staffid) === v);
        setAssignedName(ag ? `${ag.firstname} ${ag.lastname}` : '');
      },
    );

  const handleSubmit = async () => {
    if (!fullName.trim()) { Alert.alert('Validation', 'Full name is required.'); return; }
    if (!mobile.trim()) { Alert.alert('Validation', 'Mobile number is required.'); return; }

    setSaving(true);
    try {
      const body: Record<string, string> = {
        full_name: fullName.trim(),
        mobile_number: mobile.trim(),
        email: email.trim(),
        area: area.trim(),
        city: city.trim(),
      };
      if (budget.trim()) body.budget = budget.trim();
      if (sourceId) body.source = sourceId;
      if (statusId) body.status = statusId;
      if (assignedId) body.assigned = assignedId;

      if (isEdit && existingLead) {
        const res = await apiPutForm(`/db_leads/${existingLead.id}`, body);
        if (res?.status) {
          Alert.alert('Success', 'DB lead updated successfully.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        } else {
          Alert.alert('Error', res?.message || 'Failed to update DB lead.');
        }
      } else {
        const res = await apiPostForm('/db_leads/data', body);
        if (res?.status) {
          Alert.alert('Success', 'DB lead added successfully.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        } else {
          Alert.alert('Error', res?.message || 'Failed to add DB lead.');
        }
      }
    } catch {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit DB Lead' : 'Add DB Lead'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {metaLoading ? (
        <View style={styles.metaLoader}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.metaLoaderText}>Loading form...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Contact Info */}
          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <Ionicons name="person-outline" size={18} color="#6366f1" style={styles.rowIcon} />
              <TextInput
                style={styles.rowInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Full Name *"
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View style={styles.rowDivider} />

            <View style={styles.fieldRow}>
              <Ionicons name="call-outline" size={18} color="#6366f1" style={styles.rowIcon} />
              <TextInput
                style={styles.rowInput}
                value={mobile}
                onChangeText={setMobile}
                placeholder="Mobile Number *"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.rowDivider} />

            <View style={styles.fieldRow}>
              <Ionicons name="mail-outline" size={18} color="#6366f1" style={styles.rowIcon} />
              <TextInput
                style={styles.rowInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Location */}
          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <Ionicons name="location-outline" size={18} color="#6366f1" style={styles.rowIcon} />
              <TextInput
                style={styles.rowInput}
                value={area}
                onChangeText={setArea}
                placeholder="Area"
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View style={styles.rowDivider} />

            <View style={styles.fieldRow}>
              <Ionicons name="business-outline" size={18} color="#6366f1" style={styles.rowIcon} />
              <TextInput
                style={styles.rowInput}
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* Lead Details */}
          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <Ionicons name="cash-outline" size={18} color="#6366f1" style={styles.rowIcon} />
              <TextInput
                style={styles.rowInput}
                value={budget}
                onChangeText={setBudget}
                placeholder="Budget (e.g. 500000)"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.rowDivider} />

            <TouchableOpacity style={styles.fieldRow} onPress={openSourcePicker} activeOpacity={0.7}>
              <Ionicons name="flash-outline" size={18} color="#6366f1" style={styles.rowIcon} />
              <Text style={[styles.rowInput, sourceName ? styles.rowValueText : styles.rowPlaceholderText]} numberOfLines={1}>
                {sourceName || 'Source'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
            </TouchableOpacity>
            <View style={styles.rowDivider} />

            <TouchableOpacity style={styles.fieldRow} onPress={openStatusPicker} activeOpacity={0.7}>
              <Ionicons name="pulse-outline" size={18} color="#6366f1" style={styles.rowIcon} />
              <Text style={[styles.rowInput, statusName ? styles.rowValueText : styles.rowPlaceholderText]} numberOfLines={1}>
                {statusName || 'Status'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
            </TouchableOpacity>
            <View style={styles.rowDivider} />

            <TouchableOpacity style={styles.fieldRow} onPress={openAgentPicker} activeOpacity={0.7}>
              <Ionicons name="people-outline" size={18} color="#6366f1" style={styles.rowIcon} />
              <Text style={[styles.rowInput, assignedName ? styles.rowValueText : styles.rowPlaceholderText]} numberOfLines={1}>
                {assignedName || 'Assigned Agent'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name={isEdit ? 'checkmark' : 'person-add'} size={20} color="#fff" />
                <Text style={styles.submitText}>
                  {isEdit ? 'Save Changes' : 'Add DB Lead'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Picker Modal */}
      <Modal visible={picker.visible} transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{picker.title}</Text>
              <TouchableOpacity
                onPress={() => setPicker(p => ({ ...p, visible: false }))}
                style={styles.pickerClose}
              >
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={picker.options}
              keyExtractor={item => item.value}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const selected = item.value === picker.selected;
                return (
                  <TouchableOpacity
                    style={[styles.pickerOption, selected && styles.pickerOptionSelected]}
                    onPress={() => {
                      picker.onSelect(item.value);
                      setPicker(p => ({ ...p, visible: false }));
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerOptionText, selected && styles.pickerOptionTextSelected]}>
                      {item.label}
                    </Text>
                    {selected && <Ionicons name="checkmark" size={18} color="#6366f1" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5f9' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 58, paddingBottom: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },

  metaLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  metaLoaderText: { fontSize: 14, color: '#64748b' },

  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 12 },

  card: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },

  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13, minHeight: 48,
  },
  rowIcon: { marginRight: 12, width: 20 },
  rowInput: { flex: 1, fontSize: 14, color: '#1e293b', padding: 0, margin: 0 },
  rowValueText: { color: '#1e293b', fontSize: 14 },
  rowPlaceholderText: { color: '#94a3b8', fontSize: 14 },
  rowDivider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 48 },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#6366f1', paddingVertical: 15, borderRadius: 14,
    shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  pickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '65%', paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  pickerHandle: {
    width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2,
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  pickerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  pickerTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  pickerClose: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center',
  },
  pickerOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f8fafc',
  },
  pickerOptionSelected: { backgroundColor: '#f5f3ff' },
  pickerOptionText: { fontSize: 14, color: '#1e293b' },
  pickerOptionTextSelected: { fontWeight: '600', color: '#6366f1' },
});
