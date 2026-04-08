import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchAllLeads } from './utils/api';
import { Lead } from './types';
import { Ionicons } from '@expo/vector-icons';

export default function LeadsListScreen() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadLeads = async () => {
    const allLeads = await fetchAllLeads();
    const sortedLeads = [...allLeads].sort((a, b) => 
      new Date(b.dateadded).getTime() - new Date(a.dateadded).getTime()
    );
    setLeads(sortedLeads);
    setFilteredLeads(sortedLeads);
  };

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    if (searchQuery === '') {
      setFilteredLeads(leads);
    } else {
      const filtered = leads.filter(lead => 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLeads(filtered);
    }
  }, [searchQuery, leads]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeads();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderLeadCard = ({ item }: { item: Lead }) => (
    <TouchableOpacity 
      style={styles.leadCard}
      onPress={() => router.push({ pathname: '/lead-detail', params: { lead: JSON.stringify(item) } })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.leadName}>{item.name}</Text>
          <Text style={styles.leadCompany}>{item.company}</Text>
        </View>
        <View style={styles.cardBadge}>
          <Text style={styles.badgeText}>{item.source_name || 'Lead'}</Text>
        </View>
      </View>
      
      <View style={styles.cardDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="mail-outline" size={14} color="#64748b" />
          <Text style={styles.detailText}>{item.email}</Text>
        </View>
        {item.phonenumber && (
          <View style={styles.detailItem}>
            <Ionicons name="call-outline" size={14} color="#64748b" />
            <Text style={styles.detailText}>{item.phonenumber}</Text>
          </View>
        )}
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={14} color="#64748b" />
          <Text style={styles.detailText}>Added {formatDate(item.dateadded)}</Text>
        </View>
        {item.lead_value && (
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={14} color="#64748b" />
            <Text style={styles.detailText}>${parseFloat(item.lead_value).toLocaleString()}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.callButton}>
          <Ionicons name="call" size={16} color="#6366f1" />
          <Text style={styles.callButtonText}>Call Now</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => router.push({ pathname: '/lead-detail', params: { lead: JSON.stringify(item) } })}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
          <Ionicons name="arrow-forward" size={14} color="#6366f1" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Leads</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or company..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>{filteredLeads.length} Leads Found</Text>
      </View>

      <FlatList
        data={filteredLeads}
        keyExtractor={(item) => item.id}
        renderItem={renderLeadCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>No leads found</Text>
          </View>
        }
      />
    </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  statsBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statsText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  leadCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6366f1',
  },
  cardInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  leadCompany: {
    fontSize: 13,
    color: '#64748b',
  },
  cardBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6366f1',
  },
  cardDetails: {
    gap: 8,
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#475569',
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6366f1',
    backgroundColor: '#fff',
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366f1',
  },
  detailsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#6366f1',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 16,
  },
});