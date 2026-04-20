import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Lead } from './types';
import { getAuthToken, getCrmApiUrl, getCrmCookie, getUserId } from './utils/config';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'details' | 'notes' | 'reminders' | 'activity';

interface Note {
  id: number;
  rel_id: number | string;
  rel_type: string;
  description: string;
  dateadded: string;
  addedfrom: number | string;
  staff_firstname?: string;
  staff_lastname?: string;
}

interface Reminder {
  id: number;
  description: string;
  date: string;
  isnotified: string;
  rel_id: number | string;
  staff: number | string;
  rel_type: string;
}

interface Activity {
  id: string;
  leadid: string;
  description: string;
  additional_data: string;
  date: string;
  staffid: string;
  full_name: string;
  custom_activity: string;
}

// Extract string values from PHP serialized data e.g. a:2:{i:0;s:13:"Admin Account";...}
const parsePHPStrings = (data: string): string[] => {
  const results: string[] = [];
  const regex = /s:\d+:"((?:[^"\\]|\\.)*)"/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(data)) !== null) {
    const cleaned = m[1].replace(/<[^>]+>/g, '').trim();
    if (cleaned) results.push(cleaned);
  }
  return results;
};

const formatActivityDescription = (key: string, additionalData: string): string => {
  const p = parsePHPStrings(additionalData);
  switch (key) {
    case 'not_lead_activity_assigned_to':
      return p.length >= 2 ? `${p[0]} assigned lead to ${p[1]}` : 'Lead assigned';
    case 'not_lead_activity_status_updated':
      return p.length >= 3
        ? `${p[0]} changed status from "${p[1]}" to "${p[2]}"`
        : 'Status updated';
    case 'not_lead_activity_note_added':
      return p.length >= 1 ? `${p[0]} added a note` : 'Note added';
    case 'not_lead_activity_reminder_added':
      return p.length >= 1 ? `${p[0]} added a reminder` : 'Reminder added';
    case 'not_lead_activity_converted':
      return p.length >= 1 ? `${p[0]} converted lead` : 'Lead converted';
    case 'not_lead_activity_lost':
      return p.length >= 1 ? `${p[0]} marked lead as lost` : 'Lead marked lost';
    case 'not_lead_activity_junk':
      return p.length >= 1 ? `${p[0]} marked lead as junk` : 'Lead marked junk';
    case 'not_lead_activity_call_logged':
      return p.length >= 1 ? `${p[0]} logged a call` : 'Call logged';
    default:
      if (key.startsWith('not_lead_activity_')) {
        const label = key.replace('not_lead_activity_', '').replace(/_/g, ' ');
        return label.charAt(0).toUpperCase() + label.slice(1);
      }
      return key;
  }
};

// ─── API helpers ──────────────────────────────────────────────────────────────

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
  const res = await fetch(`${getCrmApiUrl()}${path}`, {
    headers: baseHeaders(),
  });
  // 404 means "no records found" on this CRM — return empty array
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

const apiDelete = async (path: string): Promise<any> => {
  const res = await fetch(`${getCrmApiUrl()}${path}`, {
    method: 'DELETE',
    headers: baseHeaders(),
  });
  return res.json();
};

// ─── Date picker helpers ──────────────────────────────────────────────────────

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function daysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function SpinnerField({
  label,
  value,
  min,
  max,
  formatter,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  formatter?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const display = formatter ? formatter(value) : String(value);
  const inc = () => onChange(value >= max ? min : value + 1);
  const dec = () => onChange(value <= min ? max : value - 1);
  return (
    <View style={spinnerStyles.col}>
      <Text style={spinnerStyles.label}>{label}</Text>
      <TouchableOpacity onPress={inc} style={spinnerStyles.btn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="chevron-up" size={20} color="#6366f1" />
      </TouchableOpacity>
      <Text style={spinnerStyles.value}>{display}</Text>
      <TouchableOpacity onPress={dec} style={spinnerStyles.btn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="chevron-down" size={20} color="#6366f1" />
      </TouchableOpacity>
    </View>
  );
}

const spinnerStyles = StyleSheet.create({
  col: { alignItems: 'center', flex: 1 },
  label: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 4 },
  btn: { padding: 4 },
  value: { fontSize: 16, fontWeight: '700', color: '#1e293b', minWidth: 40, textAlign: 'center' },
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeadDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const lead: Lead = JSON.parse(params.lead as string);

  const [activeTab, setActiveTab] = useState<Tab>('details');

  // ── Notes state ─────────────────────────────────────────────────────────────
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesFetched, setNotesFetched] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  // ── Reminders state ─────────────────────────────────────────────────────────
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [remindersFetched, setRemindersFetched] = useState(false);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [rdDay, setRdDay] = useState(new Date().getDate());
  const [rdMonth, setRdMonth] = useState(new Date().getMonth());
  const [rdYear, setRdYear] = useState(new Date().getFullYear());
  const [rdHour, setRdHour] = useState(new Date().getHours());
  const [rdMin, setRdMin] = useState(Math.floor(new Date().getMinutes() / 5) * 5);
  const [reminderDesc, setReminderDesc] = useState('');
  const [reminderSaving, setReminderSaving] = useState(false);

  const getReminderDateStr = () => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${rdYear}-${pad(rdMonth + 1)}-${pad(rdDay)} ${pad(rdHour)}:${pad(rdMin)}:00`;
  };

  // ── FAB speed dial ──────────────────────────────────────────────────────────
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

  // ── Activity state ───────────────────────────────────────────────────────────
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesFetched, setActivitiesFetched] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [activityText, setActivityText] = useState('');
  const [activitySaving, setActivitySaving] = useState(false);

  useEffect(() => {
    if (activeTab === 'notes' && !notesFetched) loadNotes();
    if (activeTab === 'reminders' && !remindersFetched) loadReminders();
    if (activeTab === 'activity' && !activitiesFetched) loadActivities();
  }, [activeTab]);

  // ── Note CRUD ────────────────────────────────────────────────────────────────

  const loadNotes = async () => {
    setNotesLoading(true);
    try {
      const data = await apiGet(`/lead_notes/${lead.id}`);
      setNotes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('loadNotes error:', e);
    } finally {
      setNotesLoading(false);
      setNotesFetched(true);
    }
  };

  const openAddNote = () => {
    setEditingNote(null);
    setNoteText('');
    setNoteModalVisible(true);
  };

  const openEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteText(note.description);
    setNoteModalVisible(true);
  };

  const saveNote = async () => {
    if (!noteText.trim()) return;
    setNoteSaving(true);
    try {
      if (editingNote) {
        await apiPostForm('/lead_notes/data', {
          id: String(editingNote.id),
          lead_id: String(lead.id),
          description: noteText.trim(),
        });
        setNotes(prev =>
          prev.map(n =>
            n.id === editingNote.id ? { ...n, description: noteText.trim() } : n,
          ),
        );
      } else {
        const res = await apiPostForm('/lead_notes/data', {
          lead_id: String(lead.id),
          description: noteText.trim(),
        });
        if (res?.status) {
          setNotesFetched(false);
          await loadNotes();
        }
      }
      setNoteModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save note. Please try again.');
    } finally {
      setNoteSaving(false);
    }
  };

  const confirmDeleteNote = (note: Note) => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiDelete(`/lead_notes/${note.id}`);
            setNotes(prev => prev.filter(n => n.id !== note.id));
          } catch {
            Alert.alert('Error', 'Failed to delete note.');
          }
        },
      },
    ]);
  };

  // ── Reminder CRUD ────────────────────────────────────────────────────────────

  const loadReminders = async () => {
    setRemindersLoading(true);
    try {
      const data = await apiGet(`/lead_reminders/${lead.id}`);
      setReminders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('loadReminders error:', e);
    } finally {
      setRemindersLoading(false);
      setRemindersFetched(true);
    }
  };

  const openAddReminder = () => {
    setEditingReminder(null);
    const now = new Date();
    setRdDay(now.getDate());
    setRdMonth(now.getMonth());
    setRdYear(now.getFullYear());
    setRdHour(now.getHours());
    setRdMin(Math.floor(now.getMinutes() / 5) * 5);
    setReminderDesc('');
    setReminderModalVisible(true);
  };

  const openEditReminder = (r: Reminder) => {
    setEditingReminder(r);
    const d = r.date ? new Date(r.date) : new Date();
    setRdDay(isNaN(d.getTime()) ? new Date().getDate() : d.getDate());
    setRdMonth(isNaN(d.getTime()) ? new Date().getMonth() : d.getMonth());
    setRdYear(isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear());
    setRdHour(isNaN(d.getTime()) ? new Date().getHours() : d.getHours());
    setRdMin(isNaN(d.getTime()) ? 0 : d.getMinutes());
    setReminderDesc(r.description);
    setReminderModalVisible(true);
  };

  const saveReminder = async () => {
    if (!reminderDesc.trim()) return;
    const dateStr = getReminderDateStr();
    setReminderSaving(true);
    try {
      if (editingReminder) {
        await apiPostForm('/lead_reminders/data', {
          id: String(editingReminder.id),
          lead_id: String(lead.id),
          date: dateStr,
          staff: getUserId(),
          description: reminderDesc.trim(),
        });
        setReminders(prev =>
          prev.map(r =>
            r.id === editingReminder.id
              ? { ...r, date: dateStr, description: reminderDesc.trim() }
              : r,
          ),
        );
      } else {
        await apiPostForm('/lead_reminders/data', {
          lead_id: String(lead.id),
          date: dateStr,
          staff: getUserId(),
          description: reminderDesc.trim(),
        });
        setRemindersFetched(false);
        await loadReminders();
      }
      setReminderModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save reminder.');
    } finally {
      setReminderSaving(false);
    }
  };

  const confirmDeleteReminder = (r: Reminder) => {
    Alert.alert('Delete Reminder', 'Are you sure you want to delete this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiDelete(`/lead_reminders/${r.id}`);
            setReminders(prev => prev.filter(item => item.id !== r.id));
          } catch {
            Alert.alert('Error', 'Failed to delete reminder.');
          }
        },
      },
    ]);
  };

  // ── Activity CRUD ────────────────────────────────────────────────────────────

  const loadActivities = async () => {
    setActivitiesLoading(true);
    try {
      const data = await apiGet(`/lead_activity/${lead.id}`);
      setActivities(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('loadActivities error:', e);
    } finally {
      setActivitiesLoading(false);
      setActivitiesFetched(true);
    }
  };

  const addActivity = async () => {
    if (!activityText.trim()) return;
    setActivitySaving(true);
    try {
      const res = await apiPostForm('/lead_activity/data', {
        lead_id: String(lead.id),
        activity: activityText.trim(),
      });
      if (res?.status) {
        setActivityText('');
        setActivityModalVisible(false);
        setActivitiesFetched(false);
        await loadActivities();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to log activity.');
    } finally {
      setActivitySaving(false);
    }
  };

  // ── Misc helpers ─────────────────────────────────────────────────────────────

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCall = () => {
    if (lead.phonenumber) Linking.openURL(`tel:${lead.phonenumber}`);
  };

  const handleWhatsApp = () => {
    const msg = 'Hello, I would like to inquire about your services.';
    const url = `https://wa.me/${lead.phonenumber}?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(err => console.error('Failed to open WhatsApp', err));
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── Hero section ── */}
        <View style={styles.hero}>
          {/* Floating back button */}
          <TouchableOpacity onPress={() => router.back()} style={styles.heroBack}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Edit button */}
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/add-lead', params: { lead: JSON.stringify(lead) } })}
            style={styles.heroEdit}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.heroAvatar}>
            <Text style={styles.heroAvatarText}>{lead.name.charAt(0).toUpperCase()}</Text>
          </View>

          <Text style={styles.heroName}>{lead.name}</Text>

          {lead.status_name ? (
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{lead.status_name}</Text>
            </View>
          ) : null}

          <Text style={styles.heroSub}>
            {lead.source_name || lead.title || 'Lead'}
          </Text>

          {/* Call + WhatsApp */}
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
        </View>

        {/* Tab strip */}
        <View style={styles.tabStrip}>
          {(['details', 'notes', 'reminders', 'activity'] as Tab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <View style={styles.tabInner}>
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'details'
                    ? 'Details'
                    : tab === 'notes'
                      ? 'Notes'
                      : tab === 'reminders'
                        ? 'Reminders'
                        : 'Activity'}
                </Text>
                {tab === 'notes' && notesFetched && notes.length > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{notes.length}</Text>
                  </View>
                )}
                {tab === 'reminders' && remindersFetched && reminders.length > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: '#fbbf24' }]}>
                    <Text style={styles.tabBadgeText}>{reminders.length}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Details tab ── */}
        {activeTab === 'details' && (
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="mail-outline" size={22} color="#6366f1" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>EMAIL ADDRESS</Text>
                <Text style={styles.infoValue}>{lead.email}</Text>
              </View>
            </View>

            {lead.phonenumber && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="call-outline" size={22} color="#6366f1" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>MOBILE NUMBER</Text>
                  <Text style={styles.infoValue}>{lead.phonenumber}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="business-outline" size={22} color="#6366f1" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>COMPANY</Text>
                <Text style={styles.infoValue}>{lead.company || '—'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar-outline" size={22} color="#6366f1" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>LAST ACTIVE</Text>
                <Text style={styles.infoValue}>
                  {lead.lastcontact ? formatDate(lead.lastcontact) : formatDate(lead.dateadded)}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="globe-outline" size={22} color="#6366f1" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>SOURCE</Text>
                <Text style={styles.infoValue}>{lead.source_name || 'Website Form'}</Text>
              </View>
            </View>

            {lead.lead_value ? (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="cash-outline" size={22} color="#6366f1" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>LEAD VALUE</Text>
                  <Text style={styles.infoValue}>
                    ${parseFloat(lead.lead_value).toLocaleString()}
                  </Text>
                </View>
              </View>
            ) : null}

            {lead.description ? (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="document-text-outline" size={22} color="#6366f1" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>DESCRIPTION</Text>
                  <Text style={styles.infoValue}>{lead.description}</Text>
                </View>
              </View>
            ) : null}
          </View>
        )}

        {/* ── Notes tab ── */}
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
                    <TouchableOpacity
                      style={styles.cardIconBtn}
                      onPress={() => openEditNote(note)}
                    >
                      <Ionicons name="create-outline" size={18} color="#6366f1" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cardIconBtn}
                      onPress={() => confirmDeleteNote(note)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cardBody}>{note.description}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── Reminders tab ── */}
        {activeTab === 'reminders' && (
          <View style={styles.tabContent}>
            <View style={styles.tabContentHeader}>
              <Text style={styles.tabContentTitle}>Reminders</Text>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: '#f59e0b' }]}
                onPress={openAddReminder}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addButtonText}>Add Reminder</Text>
              </TouchableOpacity>
            </View>

            {remindersLoading ? (
              <ActivityIndicator size="large" color="#f59e0b" style={styles.loader} />
            ) : reminders.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="alarm-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>No reminders yet</Text>
                <Text style={styles.emptySubtext}>Tap "Add Reminder" to schedule one</Text>
              </View>
            ) : (
              reminders.map(r => (
                <View key={r.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.cardAvatar, styles.cardAvatarAmber]}>
                      <Ionicons name="alarm-outline" size={18} color="#d97706" />
                    </View>
                    <View style={styles.cardMeta}>
                      <Text style={styles.cardAuthor}>{r.date ? formatDate(r.date) : '—'}</Text>
                      <View style={styles.statusPill}>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: r.isnotified === '1' ? '#10b981' : '#f59e0b' },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            { color: r.isnotified === '1' ? '#10b981' : '#f59e0b' },
                          ]}
                        >
                          {r.isnotified === '1' ? 'Notified' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.cardIconBtn}
                      onPress={() => openEditReminder(r)}
                    >
                      <Ionicons name="create-outline" size={18} color="#6366f1" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cardIconBtn}
                      onPress={() => confirmDeleteReminder(r)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cardBody}>{r.description}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── Activity tab ── */}
        {activeTab === 'activity' && (
          <View style={styles.tabContent}>
            <View style={styles.tabContentHeader}>
              <Text style={styles.tabContentTitle}>Activity Log</Text>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: '#0ea5e9' }]}
                onPress={() => { setActivityText(''); setActivityModalVisible(true); }}
              >
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
                    <View style={[
                      styles.activityDot,
                      a.custom_activity === '1' && { backgroundColor: '#0ea5e9' },
                    ]} />
                    <View style={styles.activityLine} />
                  </View>
                  <View style={styles.activityBody}>
                    <Text style={styles.activityText}>
                      {a.custom_activity === '1'
                        ? a.description
                        : formatActivityDescription(a.description, a.additional_data)}
                    </Text>
                    <Text style={styles.activityMeta}>
                      {a.full_name}  ·  {formatDate(a.date)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Speed dial FAB ── */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        {/* Mini items */}
        {(['note', 'reminder', 'activity'] as const).map((type, i) => {
          const configs = {
            note:     { label: 'Note',     icon: 'create',     color: '#6366f1', translateY: -(72 + i * 0) },
            reminder: { label: 'Reminder', icon: 'alarm',      color: '#f59e0b', translateY: -(72 + i * 0) },
            activity: { label: 'Activity', icon: 'time',       color: '#0ea5e9', translateY: -(72 + i * 0) },
          };
          const cfg = configs[type];
          const offset = type === 'note' ? -64 : type === 'reminder' ? -128 : -196;
          return (
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
              <View style={styles.fabMiniLabel}>
                <Text style={styles.fabMiniLabelText}>{cfg.label}</Text>
              </View>
              <TouchableOpacity
                style={[styles.fabMini, { backgroundColor: cfg.color }]}
                onPress={() => closeFabAndRun(() => {
                  if (type === 'note') { setActiveTab('notes'); openAddNote(); }
                  else if (type === 'reminder') { setActiveTab('reminders'); openAddReminder(); }
                  else { setActiveTab('activity'); setActivityText(''); setActivityModalVisible(true); }
                })}
              >
                <Ionicons name={cfg.icon as any} size={18} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Main FAB */}
        <TouchableOpacity style={styles.fab} onPress={toggleFab} activeOpacity={0.85}>
          <Animated.View style={{
            transform: [{
              rotate: fabAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }),
            }],
          }}>
            <Ionicons name="add" size={28} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* ── Note Modal ── */}
      <Modal visible={noteModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {editingNote ? 'Edit Note' : 'Add Note'}
            </Text>
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
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setNoteModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, !noteText.trim() && styles.modalSaveBtnDisabled]}
                onPress={saveNote}
                disabled={noteSaving || !noteText.trim()}
              >
                {noteSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Reminder Modal ── */}
      <Modal visible={reminderModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {editingReminder ? 'Edit Reminder' : 'Add Reminder'}
            </Text>

            <View style={styles.spinnerContainer}>
              {/* Date row */}
              <View style={styles.spinnerRow}>
                <SpinnerField
                  label="DAY"
                  value={rdDay}
                  min={1}
                  max={daysInMonth(rdMonth, rdYear)}
                  onChange={setRdDay}
                />
                <SpinnerField
                  label="MONTH"
                  value={rdMonth}
                  min={0}
                  max={11}
                  formatter={v => MONTHS_SHORT[v]}
                  onChange={setRdMonth}
                />
                <SpinnerField
                  label="YEAR"
                  value={rdYear}
                  min={2024}
                  max={2030}
                  onChange={setRdYear}
                />
              </View>
              <View style={styles.spinnerDivider} />
              {/* Time row */}
              <View style={styles.spinnerRow}>
                <SpinnerField
                  label="HOUR"
                  value={rdHour}
                  min={0}
                  max={23}
                  formatter={v => String(v).padStart(2, '0')}
                  onChange={setRdHour}
                />
                <View style={styles.spinnerColon}>
                  <Text style={styles.spinnerColonText}>:</Text>
                </View>
                <SpinnerField
                  label="MIN"
                  value={rdMin}
                  min={0}
                  max={55}
                  formatter={v => String(v).padStart(2, '0')}
                  onChange={v => setRdMin(Math.floor(v / 5) * 5)}
                />
              </View>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Description</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              value={reminderDesc}
              onChangeText={setReminderDesc}
              placeholder="Reminder details..."
              placeholderTextColor="#94a3b8"
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setReminderModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSaveBtn,
                  { backgroundColor: '#f59e0b' },
                  !reminderDesc.trim() && styles.modalSaveBtnDisabled,
                ]}
                onPress={saveReminder}
                disabled={reminderSaving || !reminderDesc.trim()}
              >
                {reminderSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Activity Modal ── */}
      <Modal visible={activityModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Log Activity</Text>
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
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setActivityModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSaveBtn,
                  { backgroundColor: '#0ea5e9' },
                  !activityText.trim() && styles.modalSaveBtnDisabled,
                ]}
                onPress={addActivity}
                disabled={activitySaving || !activityText.trim()}
              >
                {activitySaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Log</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 48,
  },

  // Hero
  hero: {
    backgroundColor: '#6366f1',
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroEdit: {
    position: 'absolute',
    top: 54,
    right: 18,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBack: {
    position: 'absolute',
    top: 54,
    left: 18,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroAvatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  heroName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 4,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 18,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  heroCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroWaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    backgroundColor: '#25D366',
    borderRadius: 12,
  },
  heroBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Tabs
  tabStrip: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: '#6366f1',
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabBadge: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366f1',
  },

  // Details tab
  infoSection: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    gap: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },

  // Notes / Reminders tab
  tabContent: {
    marginTop: 16,
    marginHorizontal: 20,
  },
  tabContentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  tabContentTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6366f1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },

  loader: {
    marginTop: 48,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#cbd5e1',
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  cardAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardAvatarAmber: {
    backgroundColor: '#fef3c7',
  },
  cardAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6366f1',
  },
  cardMeta: {
    flex: 1,
    gap: 2,
  },
  cardAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  cardDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  cardIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },

  // Status pill
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1e293b',
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1e293b',
    minHeight: 110,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtnDisabled: {
    opacity: 0.4,
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // Activity timeline
  activityRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  activityDotCol: {
    alignItems: 'center',
    width: 20,
    paddingTop: 3,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366f1',
  },
  activityLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#e2e8f0',
    marginTop: 4,
    marginBottom: -4,
  },
  activityBody: {
    flex: 1,
    paddingBottom: 18,
  },
  activityText: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 3,
  },
  activityMeta: {
    fontSize: 11,
    color: '#94a3b8',
  },

  // Spinner date picker
  spinnerContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 8,
    marginBottom: 4,
  },
  spinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  spinnerDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
  spinnerColon: {
    paddingHorizontal: 4,
    paddingTop: 18,
  },
  spinnerColonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6366f1',
  },

  // Speed dial FAB
  fabContainer: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    alignItems: 'center',
  },
  fabMiniRow: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fabMiniLabel: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  fabMiniLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  fabMini: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
