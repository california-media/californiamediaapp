import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, FlatList,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuthToken, getCrmApiUrl, getCrmCookie, getUserId } from './utils/config';
import { Deal } from './types';

// ─── Static options ───────────────────────────────────────────────────────────
const DEAL_STATUSES = [
  { label: 'New', value: '1' },
  { label: 'In Progress', value: '2' },
  { label: 'Pending Payment', value: '3' },
  { label: 'Closed Won', value: '4' },
  { label: 'Closed Lost', value: '5' },
];

const DEAL_TYPES = [
  { label: 'Primary', value: '1' },
  { label: 'Secondary', value: '2' },
  { label: 'Off-Plan', value: '3' },
  { label: 'Rental', value: '4' },
  { label: 'Commercial', value: '5' },
];

const DEAL_SOURCES = [
  { label: 'DATA', value: '1' },
  { label: 'Referral', value: '2' },
  { label: 'Website', value: '3' },
  { label: 'Social Media', value: '4' },
  { label: 'Campaign', value: '5' },
  { label: 'Walk-in', value: '6' },
  { label: 'Property Finder', value: '7' },
  { label: 'Bayut', value: '8' },
];

// ─── API helpers ──────────────────────────────────────────────────────────────
const buildHeaders = (form = false): Record<string, string> => ({
  Authorization: getAuthToken(),
  'X-User-Id': getUserId(),
  Cookie: getCrmCookie(),
  Accept: 'application/json',
  ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
});

const apiPostForm = async (path: string, body: Record<string, string>) => {
  const res = await fetch(`${getCrmApiUrl()}${path}`, {
    method: 'POST',
    headers: buildHeaders(true),
    body: new URLSearchParams(body).toString(),
  });
  return res.json();
};

const apiPutForm = async (path: string, body: Record<string, string>) => {
  const res = await fetch(`${getCrmApiUrl()}${path}`, {
    method: 'PUT',
    headers: buildHeaders(true),
    body: new URLSearchParams(body).toString(),
  });
  return res.json();
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface PickerState {
  visible: boolean;
  title: string;
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (v: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AddDealScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const existingDeal: Deal | null = params.deal
    ? JSON.parse(params.deal as string)
    : null;
  const isEdit = !!existingDeal;

  // ── Form fields ─────────────────────────────────────────────────────────────
  const [dealName, setDealName] = useState(existingDeal?.deal_name ?? '');
  const [clientName, setClientName] = useState(existingDeal?.client_name ?? '');
  const [clientPhone, setClientPhone] = useState(existingDeal?.client_phone ?? '');
  const [clientEmail, setClientEmail] = useState(existingDeal?.client_email ?? '');
  const [clientCountry, setClientCountry] = useState(existingDeal?.client_country ?? '');
  const [project, setProject] = useState(existingDeal?.project ?? '');
  const [developers, setDevelopers] = useState(existingDeal?.developers ?? '');
  const [unitType, setUnitType] = useState(existingDeal?.unit_type ?? '');
  const [unitNumber, setUnitNumber] = useState(existingDeal?.unit_number ?? '');
  const [unitPrice, setUnitPrice] = useState(existingDeal?.unit_price ?? '');
  const [dealValue, setDealValue] = useState(existingDeal?.deal_value ?? '');
  const [totalCommission, setTotalCommission] = useState(existingDeal?.total_commission ?? '');
  const [downPayment, setDownPayment] = useState(existingDeal?.down_payment ?? '');
  const [dldFee, setDldFee] = useState(existingDeal?.dld_fee ?? '');
  const [agent, setAgent] = useState(existingDeal?.agent ?? '');

  // ── Picker fields ───────────────────────────────────────────────────────────
  const resolveLabel = (list: { label: string; value: string }[], id: string) =>
    list.find((o) => o.value === id)?.label ?? '';

  const [statusId, setStatusId] = useState(existingDeal?.deal_status ?? '');
  const [statusName, setStatusName] = useState(resolveLabel(DEAL_STATUSES, existingDeal?.deal_status ?? ''));
  const [typeId, setTypeId] = useState(existingDeal?.deal_type ?? '');
  const [typeName, setTypeName] = useState(resolveLabel(DEAL_TYPES, existingDeal?.deal_type ?? ''));
  const [sourceId, setSourceId] = useState(existingDeal?.deal_source ?? '');
  const [sourceName, setSourceName] = useState(resolveLabel(DEAL_SOURCES, existingDeal?.deal_source ?? ''));

  const [picker, setPicker] = useState<PickerState>({
    visible: false, title: '', options: [], selected: '', onSelect: () => {},
  });
  const [saving, setSaving] = useState(false);

  const openPicker = (
    title: string,
    options: { label: string; value: string }[],
    selected: string,
    onSelect: (v: string) => void,
  ) => setPicker({ visible: true, title, options, selected, onSelect });

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!dealName.trim()) { Alert.alert('Validation', 'Deal name is required.'); return; }
    if (!clientName.trim()) { Alert.alert('Validation', 'Client name is required.'); return; }

    setSaving(true);
    try {
      const body: Record<string, string> = {
        deal_name: dealName.trim(),
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        client_email: clientEmail.trim(),
        client_country: clientCountry.trim(),
        project: project.trim(),
        developers: developers.trim(),
        unit_type: unitType.trim(),
        unit_number: unitNumber.trim(),
        agent: agent.trim(),
      };
      if (unitPrice.trim()) body.unit_price = unitPrice.trim();
      if (dealValue.trim()) body.deal_value = dealValue.trim();
      if (totalCommission.trim()) body.total_commission = totalCommission.trim();
      if (downPayment.trim()) body.down_payment = downPayment.trim();
      if (dldFee.trim()) body.dld_fee = dldFee.trim();
      if (statusId) body.deal_status = statusId;
      if (typeId) body.deal_type = typeId;
      if (sourceId) body.deal_source = sourceId;

      let res: any;
      if (isEdit && existingDeal) {
        res = await apiPutForm(`/deals/${existingDeal.id}`, body);
      } else {
        res = await apiPostForm('/deals/data', body);
      }

      if (res?.status) {
        Alert.alert('Success', isEdit ? 'Deal updated successfully.' : 'Deal added successfully.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', res?.message || `Failed to ${isEdit ? 'update' : 'add'} deal.`);
      }
    } catch {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Deal' : 'Add Deal'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Deal Info */}
        <View style={styles.card}>
          <FieldRow icon="briefcase-outline" placeholder="Deal Name *" value={dealName} onChangeText={setDealName} />
          <Divider />
          <PickerRow icon="pulse-outline" label="Status" value={statusName}
            onPress={() => openPicker('Status', DEAL_STATUSES, statusId, (v) => {
              setStatusId(v); setStatusName(resolveLabel(DEAL_STATUSES, v));
            })} />
          <Divider />
          <PickerRow icon="layers-outline" label="Type" value={typeName}
            onPress={() => openPicker('Deal Type', DEAL_TYPES, typeId, (v) => {
              setTypeId(v); setTypeName(resolveLabel(DEAL_TYPES, v));
            })} />
          <Divider />
          <PickerRow icon="flash-outline" label="Source" value={sourceName}
            onPress={() => openPicker('Deal Source', DEAL_SOURCES, sourceId, (v) => {
              setSourceId(v); setSourceName(resolveLabel(DEAL_SOURCES, v));
            })} />
        </View>

        {/* Client Info */}
        <View style={styles.card}>
          <FieldRow icon="person-outline" placeholder="Client Name *" value={clientName} onChangeText={setClientName} />
          <Divider />
          <FieldRow icon="call-outline" placeholder="Client Phone" value={clientPhone} onChangeText={setClientPhone} keyboardType="phone-pad" />
          <Divider />
          <FieldRow icon="mail-outline" placeholder="Client Email" value={clientEmail} onChangeText={setClientEmail} keyboardType="email-address" autoCapitalize="none" />
          <Divider />
          <FieldRow icon="globe-outline" placeholder="Client Country" value={clientCountry} onChangeText={setClientCountry} />
        </View>

        {/* Property */}
        <View style={styles.card}>
          <FieldRow icon="home-outline" placeholder="Project" value={project} onChangeText={setProject} />
          <Divider />
          <FieldRow icon="business-outline" placeholder="Developers" value={developers} onChangeText={setDevelopers} />
          <Divider />
          <FieldRow icon="bed-outline" placeholder="Unit Type (e.g. 2BR)" value={unitType} onChangeText={setUnitType} />
          <Divider />
          <FieldRow icon="keypad-outline" placeholder="Unit Number" value={unitNumber} onChangeText={setUnitNumber} />
          <Divider />
          <FieldRow icon="person-circle-outline" placeholder="Agent Name" value={agent} onChangeText={setAgent} />
        </View>

        {/* Financials */}
        <View style={styles.card}>
          <FieldRow icon="pricetag-outline" placeholder="Unit Price (AED)" value={unitPrice} onChangeText={setUnitPrice} keyboardType="numeric" />
          <Divider />
          <FieldRow icon="cash-outline" placeholder="Deal Value (AED)" value={dealValue} onChangeText={setDealValue} keyboardType="numeric" />
          <Divider />
          <FieldRow icon="trending-up-outline" placeholder="Total Commission (AED)" value={totalCommission} onChangeText={setTotalCommission} keyboardType="numeric" />
          <Divider />
          <FieldRow icon="arrow-down-circle-outline" placeholder="Down Payment (AED)" value={downPayment} onChangeText={setDownPayment} keyboardType="numeric" />
          <Divider />
          <FieldRow icon="receipt-outline" placeholder="DLD Fee (AED)" value={dldFee} onChangeText={setDldFee} keyboardType="numeric" />
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
              <Ionicons name={isEdit ? 'checkmark' : 'briefcase'} size={20} color="#fff" />
              <Text style={styles.submitText}>{isEdit ? 'Save Changes' : 'Add Deal'}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Picker Modal */}
      <Modal visible={picker.visible} transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{picker.title}</Text>
              <TouchableOpacity onPress={() => setPicker((p) => ({ ...p, visible: false }))} style={styles.pickerClose}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={picker.options}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const selected = item.value === picker.selected;
                return (
                  <TouchableOpacity
                    style={[styles.pickerOption, selected && styles.pickerOptionSelected]}
                    onPress={() => { picker.onSelect(item.value); setPicker((p) => ({ ...p, visible: false })); }}
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

// ─── Small helpers ────────────────────────────────────────────────────────────
function FieldRow({ icon, placeholder, value, onChangeText, keyboardType, autoCapitalize }: any) {
  return (
    <View style={styles.fieldRow}>
      <Ionicons name={icon} size={18} color="#6366f1" style={styles.rowIcon} />
      <TextInput
        style={styles.rowInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'sentences'}
      />
    </View>
  );
}

function PickerRow({ icon, label, value, onPress }: any) {
  return (
    <TouchableOpacity style={styles.fieldRow} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={18} color="#6366f1" style={styles.rowIcon} />
      <Text style={[styles.rowInput, value ? styles.rowValueText : styles.rowPlaceholderText]} numberOfLines={1}>
        {value || label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.rowDivider} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5f9' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 58, paddingBottom: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },

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
