import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchProjectById } from './utils/projectsApi';
import { ProjectDetails } from './types';

const { width } = Dimensions.get('window');

export default function ProjectDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = parseInt(params.projectId as string);
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjectDetails();
  }, []);

  const loadProjectDetails = async () => {
    setLoading(true);
    const data = await fetchProjectById(projectId);
    setProject(data);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'out of stock': return '#ef4444';
      case 'under construction': return '#f59e0b';
      case 'ready': return '#10b981';
      default: return '#6366f1';
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'Price on request';
    return `AED ${price.toLocaleString()}`;
  };

  const openUrl = (url: string) => {
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading project details...</Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Project not found</Text>
        <TouchableOpacity style={styles.backButtonError} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Image */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: project.s3_cover_url || project.cover_image_url?.url }}
          style={styles.coverImage}
        />
        <TouchableOpacity style={styles.backButtonOverlay} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.statusOverlay}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.sale_status) }]}>
            <Text style={styles.statusText}>{project.sale_status}</Text>
          </View>
        </View>
      </View>

      {/* Project Info */}
      <View style={styles.contentContainer}>
        <View style={styles.developerSection}>
          {project.developer_data?.logo_image?.[0] && (
            <Image 
              source={{ uri: project.developer_data.logo_image[0].url }}
              style={styles.developerLogoLarge}
            />
          )}
          <View style={styles.developerInfo}>
            <Text style={styles.developerName}>{project.developer}</Text>
            <TouchableOpacity onPress={() => openUrl(project.developer_data?.website || '')}>
              <Text style={styles.developerWebsite}>Visit Website</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.projectName}>{project.name}</Text>
        
        <View style={styles.locationSection}>
          <Ionicons name="location-outline" size={18} color="#6366f1" />
          <Text style={styles.locationText}>{project.area}, {project.country}</Text>
        </View>

        {/* Key Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailCard}>
            <Ionicons name="calendar-outline" size={22} color="#6366f1" />
            <Text style={styles.detailLabel}>Completion</Text>
            <Text style={styles.detailValue}>
              {project.completion_datetime ? new Date(project.completion_datetime).getFullYear() : 'TBD'}
            </Text>
          </View>
          <View style={styles.detailCard}>
            <Ionicons name="construct-outline" size={22} color="#6366f1" />
            <Text style={styles.detailLabel}>Readiness</Text>
            <Text style={styles.detailValue}>{project.readiness || 'N/A'}</Text>
          </View>
          <View style={styles.detailCard}>
            <Ionicons name="cash-outline" size={22} color="#6366f1" />
            <Text style={styles.detailLabel}>Service Charge</Text>
            <Text style={styles.detailValue}>{project.service_charge || 'N/A'}</Text>
          </View>
          <View style={styles.detailCard}>
            <Ionicons name="home-outline" size={22} color="#6366f1" />
            <Text style={styles.detailLabel}>Furnishing</Text>
            <Text style={styles.detailValue}>{project.furnishing || 'N/A'}</Text>
          </View>
        </View>

        {/* Overview */}
        {project.overview && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.overviewText} numberOfLines={5}>
              {project.overview.replace(/#####/g, '').replace(/\n/g, ' ')}
            </Text>
          </View>
        )}

        {/* Facilities */}
        {project.facilities && project.facilities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities & Facilities</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.facilitiesScroll}>
              {project.facilities.map((facility, index) => (
                <View key={index} style={styles.facilityCard}>
                  <Image source={{ uri: facility.image?.url }} style={styles.facilityImage} />
                  <Text style={styles.facilityName}>{facility.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Map Points */}
        {project.map_points && project.map_points.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nearby Locations</Text>
            {project.map_points.map((point, index) => (
              <View key={index} style={styles.mapPoint}>
                <Ionicons name="location-sharp" size={16} color="#6366f1" />
                <Text style={styles.mapPointName}>{point.name}</Text>
                <Text style={styles.mapPointDistance}>{point.distance_km} km</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {project.video_url && (
            <TouchableOpacity style={styles.actionButton} onPress={() => openUrl(project.video_url!)}>
              <Ionicons name="play-circle" size={20} color="#6366f1" />
              <Text style={styles.actionButtonText}>Watch Video</Text>
            </TouchableOpacity>
          )}
          {project.brochure_url && (
            <TouchableOpacity style={styles.actionButton} onPress={() => openUrl(project.brochure_url!)}>
              <Ionicons name="document-text" size={20} color="#6366f1" />
              <Text style={styles.actionButtonText}>Download </Text>
            </TouchableOpacity>
          )}
          {project.website && (
            <TouchableOpacity style={styles.actionButton} onPress={() => openUrl(project.website!)}>
              <Ionicons name="globe" size={20} color="#6366f1" />
              <Text style={styles.actionButtonText}>Visit Website</Text>
            </TouchableOpacity>
          )}
        </View>
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backButtonOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusOverlay: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  contentContainer: {
    padding: 20,
    marginTop: -20,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  developerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  developerLogoLarge: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
  },
  developerInfo: {
    flex: 1,
  },
  developerName: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  developerWebsite: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '500',
  },
  projectName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  locationText: {
    fontSize: 14,
    color: '#64748b',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  detailCard: {
    flex: 1,
    minWidth: (width - 52) / 2,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  overviewText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  facilitiesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  facilityCard: {
    width: 120,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  facilityImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  facilityName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1e293b',
    textAlign: 'center',
    padding: 8,
  },
  mapPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  mapPointName: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    marginLeft: 12,
  },
  mapPointDistance: {
    fontSize: 12,
    color: '#64748b',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 40,
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
  backButtonError: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#6366f1',
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});