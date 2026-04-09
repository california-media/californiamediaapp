import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Lead } from './types';

export default function LeadDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const lead: Lead = JSON.parse(params.lead as string);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCall = () => {
    if (lead.phonenumber) {
      Linking.openURL(`tel:${lead.phonenumber}`);
    }
  };

  const handleEmail = () => {
    if (lead.email) {
      Linking.openURL(`mailto:${lead.email}`);
    }
  };

  const handleWhatsApp = () => {
  const phoneNumber = `${lead.phonenumber}`; // include country code, no "+"
  const message = "Hello, I would like to inquire about your services.";
  
  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  
  Linking.openURL(url).catch(err =>
    console.error("Failed to open WhatsApp", err)
  );
};
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lead Details</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.profileSection}>
        <View style={styles.largeAvatar}>
          <Text style={styles.largeAvatarText}>{lead.name.charAt(0)}</Text>
        </View>
        <Text style={styles.leadName}>{lead.name}</Text>
        <View style={styles.intentBadge}>
          <Text style={styles.intentText}>HIGH INTENT</Text>
        </View>
        <Text style={styles.leadRole}>{lead.title || 'Acquisition Lead'}</Text>
        
        <TouchableOpacity style={styles.callNowButton} onPress={handleCall}>
          <Ionicons name="call" size={20} color="#fff" />
          <Text style={styles.callNowText}>Call Now</Text>
        </TouchableOpacity>
      </View>

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
            <Text style={styles.infoValue}>{lead.company}</Text>
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

        {lead.lead_value && (
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="cash-outline" size={22} color="#6366f1" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>LEAD VALUE</Text>
              <Text style={styles.infoValue}>${parseFloat(lead.lead_value).toLocaleString()}</Text>
            </View>
          </View>
        )}

        {lead.description && (
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="document-text-outline" size={22} color="#6366f1" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>DESCRIPTION</Text>
              <Text style={styles.infoValue}>{lead.description}</Text>
            </View>
          </View>
        )}
      </View>

      {/* <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
          <Ionicons name="mail" size={20} color="#6366f1" />
          <Text style={styles.actionButtonText}>Send Email</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
          <Ionicons name="call" size={20} color="#6366f1" />
          <Text style={styles.actionButtonText}>Call Now</Text>
        </TouchableOpacity>
      </View> */}

<View style={styles.actionButtons}>
  <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
    <Ionicons name="mail" size={20} color="#6366f1" />
    <Text style={styles.actionButtonText}>Send Email</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
    <Ionicons name="call" size={20} color="#6366f1" />
    <Text style={styles.actionButtonText}>Call Now</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.actionButton} onPress={handleWhatsApp}>
    <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
    <Text style={styles.actionButtonText}>WhatsApp</Text>
  </TouchableOpacity>
</View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="people" size={22} color="#94a3b8" />
          <Text style={styles.navText}>LEADS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="time" size={22} color="#94a3b8" />
          <Text style={styles.navText}>ACTIVITY</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="settings" size={22} color="#94a3b8" />
          <Text style={styles.navText}>SETTINGS</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  placeholder: {
    width: 40,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  largeAvatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#6366f1',
  },
  leadName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  intentBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  intentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  leadRole: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  callNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  callNowText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
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
    gap: 16,
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
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 100,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366f1',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
});