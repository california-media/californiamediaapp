import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Linking, Modal, TextInput, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DbLead } from './types';
import { LeadStatus, fetchDbLeadStatuses, fetchDbLeadById } from './utils/api';
import { getAuthToken, getCrmApiUrl, getCrmCookie, getUserId, getStaffInfo } from './utils/config';
import { Toast } from './components/Toast';
import { useToast } from './utils/useToast';

type Tab = 'details' | 'notes' | 'activity';

interface DbNote {
  id: number;
  lead_id: number | string;
  description: string;
  dateadded: string;
  staff_firstname?: string;
  staff_lastname?: string;
}

interface DbActivity {
  id: string;
  leadid: string;
  description: string;
  additional_data: string;
  date: string;
  staffid: string;
  full_name: string;
  custom_activity: string;
}

const formatBudget = (budget: string) => {
  const n = parseFloat(budget);
  if (!n) return '—';
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `AED ${(n / 1_000).toFixed(0)}K`;
  return `AED ${n.toLocaleString()}`;
};

const formatDate = (d: string | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const baseHeaders = (contentType?: string): Record<string, string> => {
  const h: Record<string, string> = {
    Authorization: getAuthToken(),
    'X-User-Id': getUserId(),
    Cookie: getCrmCookie(),
    Accept: 'application/json',
  };
  if (contentType) h['Content-Type'] = contentType;
  return h;
};

const apiGet = async (path: string): Promise<any> => {
  const res = await fetch(`${getCrmApiUrl()}${path}`, { headers: baseHeaders() });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const apiPostForm = async (path: string, body: Record<string, string>): Promise<any> => {
  const res = await fetch(`${getCrmApiUrl()}${path}`, {
    method: 'POST',
    headers: baseHeaders('application/x-www-form-urlencoded'),
    body: new URLSearchParams(body).toString(),
  });
  return res.json();
};

const apiPutForm = async (path: string, body: Record<string, string>): Promise<any> => {
  const res = await fetch(`${getCrmApiUrl()}${path}`, {
    method: 'PUT',
    headers: baseHeaders('application/x-www-form-urlencoded'),
    body: new URLSearchParams(body).toString(),
  });
  return res.json();
};

const apiDelete = async (path: string): Promise<any> => {
  const res = await fetch(`${getCrmApiUrl()}${path}`, {
    method: 'DELETE',
    headers: baseHeaders(),
  });
  return res.json();
};

export default function DbLeadDetailScreen() {
  const router = useRouter();
  const { showToast, toastMsg, toastType, toastAnim } = useToast();
  const { lead: leadParam } = useLocalSearchParams<{ lead: string }>();
  const [lead, setLead] = useState<DbLead>(JSON.parse(leadParam ?? '{}'));
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [apiStatuses, setApiStatuses] = useState<LeadStatus[]>([]);
  const isAdmin = getStaffInfo()?.admin === '1';

  // Notes state
  const [notes, setNotes] = useState<DbNote[]>([]);
  const [notesFetched, setNotesFetched] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<DbNote | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  // Activity state
  const [activities, setActivities] = useState<DbActivity[]>([]);
  const [activitiesFetched, setActivitiesFetched] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [editingActivity, setEditingActivity] = useState<DbActivity | null>(null);
  const [activityText, setActivityText] = useState('');
  const [activitySaving, setActivitySaving] = useState(false);

  // FAB speed dial
  const [fabOpen, setFabOpen] = useState(false);
  const fabAnim = useRef(new Animated.Value(0)).current;

  const toggleFab = () => {
    Animated.spring(fabAnim, {
      toValue: fabOpen ? 0 : 1,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
    setFabOpen(prev => !prev);
  };

  const closeFabAndRun = (fn: () => void) => {
    Animated.spring(fabAnim, { toValue: 0, useNativeDriver: true }).start();
    setFabOpen(false);
    fn();
  };

  useEffect(() => { fetchDbLeadStatuses().then(setApiStatuses); }, []);

  useFocusEffect(
    useCallback(() => {
      if (lead.id) {
        fetchDbLeadById(lead.id).then((fresh) => { if (fresh) setLead(fresh); });
      }
    }, [lead.id]),
  );

  useEffect(() => {
    if (activeTab === 'notes' && !notesFetched) loadNotes();
    if (activeTab === 'activity' && !activitiesFetched) loadActivities();
  }, [activeTab]);

  // Notes CRUD
  const loadNotes = async () => {
    setNotesLoading(true);
    try {
      const data = await apiGet(`/db_lead_notes/${lead.id}`);
      setNotes(Array.isArray(data) ? data : []);
    } catch { } finally {
      setNotesLoading(false);
      setNotesFetched(true);
    }
  };

  const openAddNote = () => { setEditingNote(null); setNoteText(''); setNoteModalVisible(true); };
  const openEditNote = (n: DbNote) => { setEditingNote(n); setNoteText(n.description); setNoteModalVisible(true); };

  const saveNote = async () => {
    if (!noteText.trim()) return;
    setNoteSaving(true);
    try {
      if (editingNote) {
        await apiPostForm('/db_lead_notes/data', {
          id: String(editingNote.id),
          lead_id: String(lead.id),
          description: noteText.trim(),
        });
        setNotes(prev => prev.map(n => n.id === editingNote.id ? { ...n, description: noteText.trim() } : n));
      } else {
        await apiPostForm('/db_lead_notes/data', {
          lead_id: String(lead.id),
          description: noteText.trim(),
        });
        setNotesFetched(false);
        await loadNotes();
      }
      setNoteModalVisible(false);
      setActivitiesFetched(false);
    } catch {
      showToast('Failed to save note.', 'error');
    } finally {
      setNoteSaving(false);
    }
  };

  const confirmDeleteNote = (note: DbNote) => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await apiDelete(`/db_lead_notes/${note.id}`);
            setNotes(prev => prev.filter(n => n.id !== note.id));
          } catch { showToast('Failed to delete note.', 'error'); }
        },
      },
    ]);
  };

  // Activity CRUD
  const loadActivities = async () => {
    setActivitiesLoading(true);
    try {
      const data = await apiGet(`/db_lead_activity/${lead.id}`);
      setActivities(Array.isArray(data) ? data : []);
    } catch { } finally {
      setActivitiesLoading(false);
      setActivitiesFetched(true);
    }
  };

  const openAddActivity = () => { setEditingActivity(null); setActivityText(''); setActivityModalVisible(true); };
  const openEditActivity = (a: DbActivity) => { setEditingActivity(a); setActivityText(a.description); setActivityModalVisible(true); };

  const saveActivity = async () => {
    if (!activityText.trim()) return;
    setActivitySaving(true);
    try {
      if (editingActivity) {
        await apiPutForm(`/db_lead_activity/${editingActivity.id}`, { description: activityText.trim() });
        setActivities(prev => prev.map(a => a.id === editingActivity.id ? { ...a, description: activityText.trim() } : a));
      } else {
        await apiPostForm('/db_lead_activity/data', {
          lead_id: String(lead.id),
          activity: activityText.trim(),
        });
        setActivitiesFetched(false);
        await loadActivities();
      }
      setActivityModalVisible(false);
    } catch {
      showToast('Failed to save activity.', 'error');
    } finally {
      setActivitySaving(false);
    }
  };

  const confirmDeleteActivity = (a: DbActivity) => {
    Alert.alert('Delete Activity', 'Delete this activity log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await apiDelete(`/db_lead_activity/${a.id}`);
            setActivities(prev => prev.filter(item => item.id !== a.id));
          } catch { showToast('Failed to delete activity.', 'error'); }
        },
      },
    ]);
  };

  // Delete lead
  const handleDelete = () => {
    Alert.alert('Delete DB Lead', `Delete "${lead.full_name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await apiDelete(`/db_leads/${lead.id}`);
            showToast('DB lead deleted successfully.', 'success');
            setTimeout(() => router.back(), 1200);
          } catch { showToast('Failed to delete. Try again.', 'error'); }
        },
      },
    ]);
  };

  const handleCall = () => Linking.openURL(`tel:${lead.mobile_number?.replace(/\D/g, '')}`).catch(() => alert('Could not call'));
  const handleWhatsApp = () => Linking.openURL(`https://wa.me/${lead.mobile_number?.replace(/\D/g, '')}`).catch(() => alert('Could not open WhatsApp'));

  const initial = lead.full_name?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <View style={styles.hero}>
          <TouchableOpacity style={styles.heroBack} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.heroEdit}
            onPress={() => router.push({ pathname: '/add-db-lead', params: { lead: leadParam } })}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity style={styles.heroDelete} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color="#fca5a5" />
            </TouchableOpacity>
          )}

          <View style={styles.heroAvatar}>
            <Text style={styles.heroAvatarText}>{initial}</Text>
          </View>

          <Text style={styles.heroName}>{lead.full_name}</Text>

          {lead.status_name ? (() => {
            const sc = apiStatuses.find(s => s.name.trim() === lead.status_name?.trim())?.color ?? '#6366f1';
            return (
              <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: sc, marginRight: 6 }} />
                <Text style={styles.heroBadgeText}>{lead.status_name}</Text>
              </View>
            );
          })() : null}

          {lead.mobile_number ? (
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.heroCallBtn} onPress={handleCall}>
                <Ionicons name="call" size={17} color="#fff" />
                <Text style={styles.heroBtnText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroWaBtn} onPress={handleWhatsApp}>
                <Ionicons name="logo-whatsapp" size={17} color="#fff" />
                <Text style={styles.heroBtnText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Tab strip */}
        <View style={styles.tabStrip}>
          {(['details', 'notes', 'activity'] as Tab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <View style={styles.tabInner}>
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'details' ? 'Details' : tab === 'notes' ? 'Notes' : 'Activity'}
                </Text>
                {tab === 'notes' && notesFetched && notes.length > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{notes.length}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Details tab */}
        {activeTab === 'details' && (
          <View style={styles.infoSection}>
            <InfoRow icon="call-outline" label="MOBILE" value={lead.mobile_number || '—'} />
            <InfoRow icon="mail-outline" label="EMAIL" value={lead.email || '—'} />
            <InfoRow icon="flash-outline" label="SOURCE" value={lead.source_name || '—'} />
            {lead.status_name ? (() => {
              const sc = apiStatuses.find(s => s.name.trim() === lead.status_name?.trim())?.color ?? '#64748b';
              return (
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}><Ionicons name="pulse-outline" size={22} color="#6366f1" /></View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>STATUS</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: sc }} />
                      <Text style={[styles.infoValue, { color: sc }]}>{lead.status_name}</Text>
                    </View>
                  </View>
                </View>
              );
            })() : null}
            <InfoRow icon="person-outline" label="ASSIGNED TO" value={lead.assigned_name || '—'} />
            <InfoRow icon="cash-outline" label="BUDGET" value={formatBudget(lead.budget)} />
            <InfoRow icon="home-outline" label="PROPERTY STATUS" value={lead.property_status || '—'} />
            <InfoRow icon="bed-outline" label="UNIT TYPE" value={lead.unit_type || '—'} />
            <InfoRow icon="grid-outline" label="BEDROOMS" value={lead.bedroom || '—'} />
            <InfoRow icon="location-outline" label="AREA" value={lead.area || '—'} />
            <InfoRow icon="business-outline" label="CITY" value={lead.city || '—'} />
            <InfoRow icon="calendar-outline" label="DATE ADDED" value={formatDate(lead.dateadded)} />
            <InfoRow icon="time-outline" label="LAST STATUS CHANGE" value={formatDate(lead.last_status_change)} />
            {lead.notes ? <InfoRow icon="document-text-outline" label="NOTES" value={lead.notes} /> : null}
          </View>
        )}

        {/* Notes tab */}
        {activeTab === 'notes' && (
          <View style={styles.tabContent}>
            <View style={styles.tabContentHeader}>
              <Text style={styles.tabContentTitle}>Notes</Text>
              <TouchableOpacity style={styles.addButton} onPress={openAddNote}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addButtonText}>Add Note</Text>
              </TouchableOpacity>
            </View>

            {notesLoading ? (
              <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
            ) : notes.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>No notes yet</Text>
                <Text style={styles.emptySubtext}>Tap "Add Note" to create the first one</Text>
              </View>
            ) : (
              notes.map(note => (
                <View key={note.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardAvatar}>
                      <Text style={styles.cardAvatarText}>
                        {note.staff_firstname ? note.staff_firstname.charAt(0) : 'S'}
                      </Text>
                    </View>
                    <View style={styles.cardMeta}>
                      <Text style={styles.cardAuthor}>
                        {note.staff_firstname || note.staff_lastname
                          ? `${note.staff_firstname || ''} ${note.staff_lastname || ''}`.trim()
                          : 'Staff'}
                      </Text>
                      <Text style={styles.cardDate}>{formatDate(note.dateadded)}</Text>
                    </View>
                    <TouchableOpacity style={styles.cardIconBtn} onPress={() => openEditNote(note)}>
                      <Ionicons name="create-outline" size={18} color="#6366f1" />
                    </TouchableOpacity>
                    {isAdmin && (
                      <TouchableOpacity style={styles.cardIconBtn} onPress={() => confirmDeleteNote(note)}>
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.cardBody}>{note.description}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Activity tab */}
        {activeTab === 'activity' && (
          <View style={styles.tabContent}>
            <View style={styles.tabContentHeader}>
              <Text style={styles.tabContentTitle}>Activity Log</Text>
              <TouchableOpacity style={[styles.addButton, { backgroundColor: '#0ea5e9' }]} onPress={openAddActivity}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addButtonText}>Log Activity</Text>
              </TouchableOpacity>
            </View>

            {activitiesLoading ? (
              <ActivityIndicator size="large" color="#0ea5e9" style={styles.loader} />
            ) : activities.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>No activity yet</Text>
                <Text style={styles.emptySubtext}>Actions on this lead will appear here</Text>
              </View>
            ) : (
              activities.map(a => (
                <View key={a.id} style={styles.activityRow}>
                  <View style={styles.activityDotCol}>
                    <View style={[styles.activityDot, a.custom_activity === '1' && { backgroundColor: '#0ea5e9' }]} />
                    <View style={styles.activityLine} />
                  </View>
                  <View style={styles.activityBody}>
                    <Text style={styles.activityText}>{a.description}</Text>
                    <Text style={styles.activityMeta}>{a.full_name}  ·  {formatDate(a.date)}</Text>
                    {a.custom_activity === '1' && (
                      <View style={styles.activityActions}>
                        <TouchableOpacity onPress={() => openEditActivity(a)} style={styles.activityBtn}>
                          <Ionicons name="create-outline" size={14} color="#6366f1" />
                        </TouchableOpacity>
                        {isAdmin && (
                          <TouchableOpacity onPress={() => confirmDeleteActivity(a)} style={styles.activityBtn}>
                            <Ionicons name="trash-outline" size={14} color="#ef4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Speed dial FAB */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        {([
          { type: 'note', label: 'Note', icon: 'create', color: '#6366f1', offset: -64 },
          { type: 'activity', label: 'Activity', icon: 'time', color: '#0ea5e9', offset: -128 },
        ] as const).map(({ type, label, icon, color, offset }) => (
          <Animated.View
            key={type}
            style={[
              styles.fabMiniRow,
              {
                opacity: fabAnim,
                transform: [
                  { translateY: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, offset] }) },
                  { scale: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
                ],
              },
            ]}
            pointerEvents={fabOpen ? 'auto' : 'none'}
          >
            <View style={styles.fabMiniLabel}><Text style={styles.fabMiniLabelText}>{label}</Text></View>
            <TouchableOpacity
              style={[styles.fabMini, { backgroundColor: color }]}
              onPress={() => closeFabAndRun(() => {
                if (type === 'note') { setActiveTab('notes'); openAddNote(); }
                else { setActiveTab('activity'); openAddActivity(); }
              })}
            >
              <Ionicons name={icon as any} size={18} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        ))}

        <TouchableOpacity style={styles.fab} onPress={toggleFab} activeOpacity={0.85}>
          <Animated.View style={{
            transform: [{ rotate: fabAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }],
          }}>
            <Ionicons name="add" size={28} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Note Modal */}
      <Modal visible={noteModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editingNote ? 'Edit Note' : 'Add Note'}</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={5}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Write your note here..."
              placeholderTextColor="#94a3b8"
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setNoteModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, !noteText.trim() && styles.modalSaveBtnDisabled]}
                onPress={saveNote}
                disabled={noteSaving || !noteText.trim()}
              >
                {noteSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSaveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Activity Modal */}
      <Modal visible={activityModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editingActivity ? 'Edit Activity' : 'Log Activity'}</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              value={activityText}
              onChangeText={setActivityText}
              placeholder="Describe the activity..."
              placeholderTextColor="#94a3b8"
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setActivityModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: '#0ea5e9' }, !activityText.trim() && styles.modalSaveBtnDisabled]}
                onPress={saveActivity}
                disabled={activitySaving || !activityText.trim()}
              >
                {activitySaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSaveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Toast msg={toastMsg} type={toastType} anim={toastAnim} />
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}><Ionicons name={icon} size={22} color="#6366f1" /></View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { paddingBottom: 48 },

  hero: {
    backgroundColor: '#6366f1',
    paddingTop: 56, paddingBottom: 24, paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroBack: {
    position: 'absolute', top: 54, left: 18,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroEdit: {
    position: 'absolute', top: 54, right: 18,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroDelete: {
    position: 'absolute', top: 54, right: 60,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(239,68,68,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroAvatar: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.45)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  heroAvatarText: { fontSize: 26, fontWeight: '700', color: '#fff' },
  heroName: { fontSize: 19, fontWeight: '700', color: '#fff', marginBottom: 6, textAlign: 'center' },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 16,
  },
  heroBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  heroActions: { flexDirection: 'row', gap: 10, width: '100%' },
  heroCallBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  heroWaBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, backgroundColor: '#25D366', borderRadius: 12,
  },
  heroBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  tabStrip: {
    flexDirection: 'row', marginHorizontal: 20, marginTop: 16,
    backgroundColor: '#fff', borderRadius: 14, padding: 4,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  tabItem: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  tabItemActive: { backgroundColor: '#6366f1' },
  tabInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tabText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  tabTextActive: { color: '#fff' },
  tabBadge: {
    backgroundColor: '#fff', borderRadius: 8,
    paddingHorizontal: 5, paddingVertical: 1, minWidth: 18, alignItems: 'center',
  },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: '#6366f1' },

  infoSection: {
    backgroundColor: '#fff', marginTop: 16, marginHorizontal: 20,
    borderRadius: 20, padding: 20, gap: 20,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  infoIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center',
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.6, marginBottom: 3 },
  infoValue: { fontSize: 14, color: '#1e293b', fontWeight: '500' },

  tabContent: { marginTop: 16, marginHorizontal: 20 },
  tabContentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  tabContentTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  addButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#6366f1', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  addButtonText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  loader: { marginTop: 48 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#94a3b8' },
  emptySubtext: { fontSize: 13, color: '#cbd5e1' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center',
  },
  cardAvatarText: { fontSize: 15, fontWeight: '700', color: '#6366f1' },
  cardMeta: { flex: 1, gap: 2 },
  cardAuthor: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  cardDate: { fontSize: 11, color: '#94a3b8' },
  cardIconBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center',
  },
  cardBody: { fontSize: 14, color: '#475569', lineHeight: 20 },

  activityRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  activityDotCol: { alignItems: 'center', width: 20, paddingTop: 3 },
  activityDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#6366f1' },
  activityLine: { flex: 1, width: 2, backgroundColor: '#e2e8f0', marginTop: 4, marginBottom: -4 },
  activityBody: { flex: 1, paddingBottom: 18 },
  activityText: { fontSize: 13, color: '#1e293b', fontWeight: '500', lineHeight: 18, marginBottom: 3 },
  activityMeta: { fontSize: 11, color: '#94a3b8' },
  activityActions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  activityBtn: {
    width: 28, height: 28, borderRadius: 7,
    backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center',
  },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 12,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#e2e8f0', alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  textArea: {
    backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1e293b', minHeight: 110,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  modalSaveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  modalSaveBtnDisabled: { opacity: 0.4 },
  modalSaveText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  fabContainer: { position: 'absolute', bottom: 28, right: 20, alignItems: 'center' },
  fabMiniRow: { position: 'absolute', bottom: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  fabMiniLabel: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  fabMiniLabelText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  fabMini: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  fab: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
});
