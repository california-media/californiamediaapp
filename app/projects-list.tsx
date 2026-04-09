import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchProjects, searchProjects } from './utils/projectsApi';
import { Project } from './types';
import { Ionicons } from '@expo/vector-icons';

export default function ProjectsListScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();

  const loadProjects = async (pageNum: number = 1, refresh: boolean = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    const data = await fetchProjects(pageNum, 10);
    
    if (refresh || pageNum === 1) {
      setProjects(data.data);
      setFilteredProjects(data.data);
    } else {
      setProjects(prev => [...prev, ...data.data]);
      setFilteredProjects(prev => [...prev, ...data.data]);
    }
    
    setTotalPages(data.totalPages);
    setPage(pageNum);
    
    if (pageNum === 1) setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    loadProjects(1, true);
  }, []);

  useEffect(() => {
    if (searchQuery === '') {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.developer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.area.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  }, [searchQuery, projects]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProjects(1, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (page < totalPages && !loadingMore) {
      loadProjects(page + 1);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'out of stock': return '#ef4444';
      case 'under construction': return '#f59e0b';
      case 'ready': return '#10b981';
      default: return '#6366f1';
    }
  };

  const renderProjectCard = ({ item }: { item: Project }) => (
    <TouchableOpacity 
      style={styles.projectCard}
      onPress={() => router.push({ pathname: '/project-detail', params: { projectId: item.id } })}
    >
      <Image 
        source={{ uri: item.s3_cover_url || item.cover_image_url?.url }}
        style={styles.projectImage}
      />
      <View style={styles.projectContent}>
        <View style={styles.projectHeader}>
          <View style={styles.developerInfo}>
            {item.developer_data?.logo_image?.[0] && (
              <Image 
                source={{ uri: item.developer_data.logo_image[0].url }}
                style={styles.developerLogo}
              />
            )}
            <Text style={styles.developerName}>{item.developer}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.sale_status) }]}>
            <Text style={styles.statusText}>{item.sale_status}</Text>
          </View>
        </View>
        
        <Text style={styles.projectName}>{item.name}</Text>
        
        <View style={styles.projectDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={14} color="#64748b" />
            <Text style={styles.detailText}>{item.area}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="business-outline" size={14} color="#64748b" />
            <Text style={styles.detailText}>{item.country}</Text>
          </View>
        </View>
        
        <View style={styles.projectFooter}>
          <TouchableOpacity style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Details</Text>
            <Ionicons name="arrow-forward" size={14} color="#6366f1" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading projects...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Real Estate Projects</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by project, developer, or area..."
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
        <Text style={styles.statsText}>{filteredProjects.length} Projects Found</Text>
      </View>

      <FlatList
        data={filteredProjects}
        keyExtractor={(item) => item._id}
        renderItem={renderProjectCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loaderMore}>
              <ActivityIndicator size="small" color="#6366f1" />
              <Text style={styles.loadingMoreText}>Loading more...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>No projects found</Text>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
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
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  projectImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  projectContent: {
    padding: 16,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  developerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  developerLogo: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  developerName: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  projectDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#64748b',
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366f1',
  },
  loaderMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#64748b',
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