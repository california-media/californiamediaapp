// import { Text, View } from "react-native";

// export default function Index() {
//   return (
//     <View
//       style={{
//         flex: 1,
//         justifyContent: "center",
//         alignItems: "center",
//       }}
//     >
//       <Text>Edit app/index.tsx to edit this screen.</Text>
//     </View>
//   );
// }
// import { useEffect } from 'react';
// import { Text, View, Button } from 'react-native';
// import { registerForPushNotificationsAsync } from './utils/notifications';

// export default function Index() {
//   const sendTokenToServer = async (token: string) => {
//     console.log('[App] Sending token to server:', token);

//     try {
//       const response = await fetch('http://localhost:8000/api/leads/save_push_token', {
//         method: 'POST',
//         headers: {
//           'Authorization': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoicGFiYmx5X3VzZXIiLCJuYW1lIjoicGFiYmx5X3VzZXIiLCJBUElfVElNRSI6MTc1NDM4MTcwNn0.OedmvEy-R_vRiE5Nv9WrZtsTdPvorpPy795cCOUriz0',
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ token, platform: 'expo' }),
//       });

//       const data = await response.json();
//       console.log('[App] Token saved response:', data);
//     } catch (error) {
//       console.error('[App] Error sending token:', error);
//     }
//   };

//   useEffect(() => {
//     console.log('[App] Registering for push notifications...');
//     registerForPushNotificationsAsync().then((token) => {
//       console.log('[App] registerForPushNotificationsAsync finished with token:', token);
//       if (token) sendTokenToServer(token);
//     });
//   }, []);

//   const sendTestNotification = async () => {
//     console.log('[App] Sending test notification...');
//     try {
//       const response = await fetch('http://localhost:8000/api/leads/send_test_notification', {
//         method: 'POST',
//         headers: {
//           'Authorization': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoicGFiYmx5X3VzZXIiLCJuYW1lIjoicGFiYmx5X3VzZXIiLCJBUElfVElNRSI6MTc1NDM4MTcwNn0.OedmvEy-R_vRiE5Nv9WrZtsTdPvorpPy795cCOUriz0',
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({}),
//       });

//       const data = await response.json();
//       console.log('[App] Test notification response:', data);
//     } catch (error) {
//       console.error('[App] Error sending test notification:', error);
//     }
//   };

//   return (
//     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//       <Text>Edit app/index.tsx to edit this screen.</Text>
//       <Button title="Send test notification" onPress={sendTestNotification} />
//     </View>
//   );
// }


// // app/index.tsx
// import { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
// // import { fetchAllLeads } from './utils/api'; // fetches all leads
// import { fetchLatestLead, fetchAllLeads } from './utils/api';
// import { Lead } from './types';

// export default function HomeScreen() {
//   const [leads, setLeads] = useState<Lead[]>([]);
//   const [latestLead, setLatestLead] = useState<Lead | null>(null);

//   useEffect(() => {
//     const loadLeads = async () => {
//       const allLeads = await fetchAllLeads();
//       setLeads(allLeads);

//       // // Sort leads by dateadded descending and pick the latest
//       // const sortedLeads = allLeads.sort(
//       //   (a, b) => new Date(b.dateadded).getTime() - new Date(a.dateadded).getTime()
//       // );

//       const sortedLeads = allLeads.sort((a: Lead, b: Lead) => {
//         return new Date(b.dateadded).getTime() - new Date(a.dateadded).getTime();
//       });

//       setLatestLead(sortedLeads[0]);
//     };
//     loadLeads();
//   }, []);

//   if (!latestLead) {
//     return (
//       <View style={styles.center}>
//         <Text>Loading leads...</Text>
//       </View>
//     );
//   }

//   const renderLead = ({ item }: { item: Lead }) => (
//     <View style={styles.leadCard}>
//       <Text style={styles.leadName}>{item.name}</Text>
//       <Text style={styles.leadCompany}>{item.company}</Text>
//       <Text style={styles.leadEmail}>{item.email}</Text>
//       <Text style={styles.leadSource}>Source: {item.source_name || item.source}</Text>
//       <Text style={styles.leadDate}>Added: {new Date(item.dateadded).toLocaleString()}</Text>
//       <TouchableOpacity style={styles.viewButton}>
//         <Text style={styles.viewButtonText}>View Lead →</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   return (
//     <ScrollView style={styles.container}>
//       {/* Latest Lead */}
//       <View style={styles.highlightCard}>
//         <Text style={styles.sectionTitle}>Latest Lead</Text>
//         <Text style={styles.latestName}>{latestLead.name}</Text>
//         <Text style={styles.latestInfo}>Email: {latestLead.email}</Text>
//         <Text style={styles.latestInfo}>Company: {latestLead.company}</Text>
//         <Text style={styles.latestInfo}>Added: {new Date(latestLead.dateadded).toLocaleString()}</Text>
//       </View>

//       {/* All Leads */}
//       <Text style={styles.sectionTitle}>All Leads</Text>
//       {/* <FlatList
//         data={leads}
//         keyExtractor={(item) => item.id}
//         renderItem={renderLead}
//         contentContainerStyle={{ paddingBottom: 16 }}
//       /> */}
//    <FlatList
//   data={leads}
//   keyExtractor={(item) => item.id}
//   renderItem={renderLead}
//   ListHeaderComponent={() => (
//     <View style={styles.highlightCard}>
//       <Text style={styles.sectionTitle}>Latest Lead</Text>
//       <Text style={styles.latestName}>{latestLead.name}</Text>
//       <Text style={styles.latestInfo}>Email: {latestLead.email}</Text>
//       <Text style={styles.latestInfo}>Company: {latestLead.company}</Text>
//       <Text style={styles.latestInfo}>
//         Added: {new Date(latestLead.dateadded).toLocaleString()}
//       </Text>
//     </View>
//   )}
//   contentContainerStyle={{ padding: 16 }}
// />
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#f0f4f7', padding: 16 },
//   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   highlightCard: {
//     padding: 20,
//     backgroundColor: '#4caf50',
//     borderRadius: 10,
//     marginBottom: 20,
//     elevation: 3,
//   },
//   sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
//   latestName: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
//   latestInfo: { fontSize: 14, color: '#e0f2f1', marginBottom: 2 },
//   leadCard: {
//     padding: 16,
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     marginBottom: 12,
//     elevation: 2,
//   },
//   leadName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
//   leadCompany: { fontSize: 14, color: '#555' },
//   leadEmail: { fontSize: 14, color: '#555', marginBottom: 4 },
//   leadSource: { fontSize: 12, color: '#888', marginBottom: 4 },
//   leadDate: { fontSize: 12, color: '#aaa' },
//   viewButton: {
//     marginTop: 8,
//     padding: 10,
//     backgroundColor: '#1b5e20',
//     borderRadius: 6,
//     alignItems: 'center',
//   },
//   viewButtonText: { color: '#fff', fontWeight: 'bold' },
// });

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchAllLeads } from './utils/api';
import { Lead } from './types';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [latestLead, setLatestLead] = useState<Lead | null>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadLeads = async () => {
    const allLeads = await fetchAllLeads();
    setLeads(allLeads);
    
    const sortedLeads = [...allLeads].sort((a: Lead, b: Lead) => {
      return new Date(b.dateadded).getTime() - new Date(a.dateadded).getTime();
    });
    
    setLatestLead(sortedLeads[0]);
    setRecentLeads(sortedLeads.slice(1, 6));
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeads();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (!latestLead) {
    return (
      <View style={styles.center}>
        <View style={styles.loaderContainer}>
          <Text style={styles.loadingText}>Loading leads...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello there! 👋</Text>
          <Text style={styles.subGreeting}>Welcome back to Lead Manager</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person-circle-outline" size={44} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{leads.length}</Text>
          <Text style={styles.statLabel}>Total Leads</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {leads.filter(l => new Date(l.dateadded).getTime() > Date.now() - 7*24*60*60*1000).length}
          </Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {leads.filter(l => l.status === '5').length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {/* Latest Lead Highlight */}
      <View style={styles.latestCard}>
        <View style={styles.latestBadge}>
          <Ionicons name="flash" size={16} color="#fff" />
          <Text style={styles.latestBadgeText}>NEW LEAD</Text>
        </View>
        
        <Text style={styles.latestName}>{latestLead.name}</Text>
        
        <View style={styles.latestCompanyContainer}>
          <Ionicons name="business-outline" size={16} color="#a5b4fc" />
          <Text style={styles.latestCompany}>{latestLead.company}</Text>
        </View>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={18} color="#c7d2fe" />
            <Text style={styles.infoText}>{latestLead.email}</Text>
          </View>
          {latestLead.phonenumber && (
            <View style={styles.infoItem}>
              <Ionicons name="call-outline" size={18} color="#c7d2fe" />
              <Text style={styles.infoText}>{latestLead.phonenumber}</Text>
            </View>
          )}
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={18} color="#c7d2fe" />
            <Text style={styles.infoText}>Added {formatDate(latestLead.dateadded)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="globe-outline" size={18} color="#c7d2fe" />
            <Text style={styles.infoText}>{latestLead.source_name || 'Unknown Source'}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.viewLeadButton}
          onPress={() => router.push({ pathname: '/lead-detail', params: { lead: JSON.stringify(latestLead) } })}
        >
          <Text style={styles.viewLeadButtonText}>View Full Details</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Recent Leads Section */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Leads</Text>
          <TouchableOpacity onPress={() => router.push('/leads-list')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentLeads.map((lead, index) => (
          <TouchableOpacity 
            key={lead.id} 
            style={styles.recentLeadCard}
            onPress={() => router.push({ pathname: '/lead-detail', params: { lead: JSON.stringify(lead) } })}
          >
            <View style={styles.recentLeadAvatar}>
              <Text style={styles.avatarText}>{lead.name.charAt(0)}</Text>
            </View>
            <View style={styles.recentLeadInfo}>
              <Text style={styles.recentLeadName}>{lead.name}</Text>
              <Text style={styles.recentLeadCompany}>{lead.company}</Text>
            </View>
            <View style={styles.recentLeadMeta}>
              <Text style={styles.recentLeadTime}>{formatDate(lead.dateadded)}</Text>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#6366f1" />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/leads-list')}>
          <Ionicons name="people" size={24} color="#94a3b8" />
          <Text style={styles.navText}>Leads</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="stats-chart" size={24} color="#94a3b8" />
          <Text style={styles.navText}>Activity</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="settings" size={24} color="#94a3b8" />
          <Text style={styles.navText}>Settings</Text>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loaderContainer: {
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  subGreeting: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  latestCard: {
    backgroundColor: '#6366f1',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  latestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  latestBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  latestName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  latestCompanyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  latestCompany: {
    fontSize: 16,
    color: '#a5b4fc',
  },
  infoGrid: {
    gap: 12,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#c7d2fe',
  },
  viewLeadButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewLeadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  recentSection: {
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  seeAllText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  recentLeadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recentLeadAvatar: {
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
  recentLeadInfo: {
    flex: 1,
  },
  recentLeadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  recentLeadCompany: {
    fontSize: 13,
    color: '#64748b',
  },
  recentLeadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recentLeadTime: {
    fontSize: 12,
    color: '#94a3b8',
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    fontSize: 12,
    color: '#94a3b8',
  },
  navTextActive: {
    color: '#6366f1',
    fontWeight: '500',
  },
});