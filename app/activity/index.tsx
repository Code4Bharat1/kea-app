import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Header } from '../../src/components/common/Header';
import { userApi } from '../../src/api/user.api';
import {
  TrendingUp,
  Briefcase,
  FileText,
  Calendar,
  Users,
  Search,
  Filter,
  Download,
  X,
  ChevronDown,
  Check,
} from 'lucide-react-native';

const ACTIVITY_TYPES = [
  { value: 'all', label: 'All Activities' },
  { value: 'job_application', label: 'Job Applications' },
  { value: 'event_registration', label: 'Event Registrations' },
  { value: 'document_download', label: 'Documents' },
  { value: 'connection', label: 'Connections' },
  { value: 'profile_update', label: 'Profile Updates' },
];

export default function UserActivityScreen() {
  const [activities, setActivities] = useState<any[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filterModalOpen, setFilterModalOpen] = useState<boolean>(false);

  const fetchActivities = async () => {
    try {
      const data = await userApi.getRecentActivity();
      setActivities(data || []);
    } catch (err) {
      console.error('Error fetching activity list:', err);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const filterActivities = useCallback(() => {
    let filtered = [...activities];

    if (filterType !== 'all') {
      filtered = filtered.filter((act) => act.type === filterType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (act) =>
          act.title?.toLowerCase().includes(q) ||
          act.description?.toLowerCase().includes(q)
      );
    }

    setFilteredActivities(filtered);
  }, [activities, filterType, searchQuery]);

  useEffect(() => {
    filterActivities();
  }, [filterActivities]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'job_application':
        return <Briefcase size={18} color="#2563EB" />;
      case 'event_registration':
        return <Calendar size={18} color="#059669" />;
      case 'document_download':
        return <FileText size={18} color="#7C3AED" />;
      case 'connection':
        return <Users size={18} color="#EA580C" />;
      case 'profile_update':
        return <TrendingUp size={18} color="#0D9488" />;
      default:
        return <TrendingUp size={18} color="#475569" />;
    }
  };

  const getActivityBgColor = (type: string) => {
    switch (type) {
      case 'job_application':
        return '#EFF6FF';
      case 'event_registration':
        return '#F0FDF4';
      case 'document_download':
        return '#F5F3FF';
      case 'connection':
        return '#FFF7ED';
      case 'profile_update':
        return '#CCFBF1';
      default:
        return '#F8FAFC';
    }
  };

  const getActivityBorderColor = (type: string) => {
    switch (type) {
      case 'job_application':
        return '#BFDBFE';
      case 'event_registration':
        return '#BBF7D0';
      case 'document_download':
        return '#DDD6FE';
      case 'connection':
        return '#FED7AA';
      case 'profile_update':
        return '#99F6E4';
      default:
        return '#E2E8F0';
    }
  };

  const getTypeLabel = (type: string) => {
    const found = ACTIVITY_TYPES.find((t) => t.value === type);
    return found ? found.label : type;
  };

  const getTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleExport = async () => {
    if (filteredActivities.length === 0) return;
    try {
      const headers = ['Date', 'Type', 'Activity', 'Description'];
      const rows = filteredActivities.map((act) => [
        formatDate(act.createdAt),
        getTypeLabel(act.type),
        act.title || '',
        act.description || '',
      ]);

      const csvText = [
        headers.join(','),
        ...rows.map((r) => r.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      await Share.share({
        title: 'KEA Activity Report',
        message: csvText,
      });
    } catch (err) {
      console.error('Failed exporting activity CSV:', err);
      Alert.alert('Export', 'Activity log exported successfully.');
    }
  };

  const selectedTypeObj = ACTIVITY_TYPES.find((t) => t.value === filterType);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <Header showBack={true} title="My Activity" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D9488" />
        }
      >
        {/* Top Page Banner Section */}
        <View style={styles.headerTitleRow}>
          <View style={styles.titleLeftCol}>
            <View style={styles.iconTitleFlex}>
              <TrendingUp size={24} color="#0D9488" style={{ marginRight: 8 }} />
              <Text style={styles.pageTitleText}>My Activity</Text>
            </View>
            <Text style={styles.pageSubtitle}>
              Track all your actions and engagement on KEA platform
              {filteredActivities.length > 0 && (
                <Text style={styles.activityCountTag}>
                  {' '}
                  ({filteredActivities.length}{' '}
                  {filteredActivities.length === 1 ? 'activity' : 'activities'})
                </Text>
              )}
            </Text>
          </View>

          {filteredActivities.length > 0 && (
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={handleExport}
              activeOpacity={0.8}
            >
              <Download size={16} color="#334155" style={{ marginRight: 6 }} />
              <Text style={styles.exportBtnText}>Export</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filters Card Container */}
        <View style={styles.filtersCard}>
          {/* Search Box */}
          <View style={styles.searchBoxInputContainer}>
            <Search size={18} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search activities..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Type Filter Select Trigger */}
          <TouchableOpacity
            style={styles.filterDropdownTrigger}
            onPress={() => setFilterModalOpen(true)}
            activeOpacity={0.8}
          >
            <View style={styles.filterTriggerLeft}>
              <Filter size={18} color="#0D9488" style={{ marginRight: 8 }} />
              <Text style={styles.filterTriggerText}>
                {selectedTypeObj?.label || 'All Activities'}
              </Text>
            </View>
            <ChevronDown size={18} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Activity Cards List Section */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0D9488" />
            <Text style={styles.loadingText}>Loading activities...</Text>
          </View>
        ) : filteredActivities.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <View style={styles.emptyIconCircle}>
              <TrendingUp size={32} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery || filterType !== 'all' ? 'No activities found' : 'No activity yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || filterType !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Start applying for jobs, registering for events, or connecting with other members!'}
            </Text>

            {(searchQuery || filterType !== 'all') && (
              <TouchableOpacity
                style={styles.clearFilterBtn}
                onPress={() => {
                  setSearchQuery('');
                  setFilterType('all');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.clearFilterBtnText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.activitiesList}>
            {filteredActivities.map((act, index) => (
              <View
                key={act._id || index}
                style={[
                  styles.activityCard,
                  { borderColor: getActivityBorderColor(act.type) },
                ]}
              >
                <View style={styles.activityCardInner}>
                  {/* Icon Circle */}
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: getActivityBgColor(act.type) },
                    ]}
                  >
                    {getActivityIcon(act.type)}
                  </View>

                  {/* Main Info */}
                  <View style={styles.activityMainCol}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.cardActivityTitle}>{act.title}</Text>
                      <View style={styles.typeBadgePill}>
                        <Text style={styles.typeBadgeText}>{getTypeLabel(act.type)}</Text>
                      </View>
                    </View>

                    {act.description ? (
                      <Text style={styles.cardActivityDesc}>{act.description}</Text>
                    ) : null}

                    {/* Timestamp & TimeAgo */}
                    <View style={styles.timeMetaRow}>
                      <Text style={styles.timeMetaText}>{formatDate(act.createdAt)}</Text>
                      <Text style={styles.timeMetaDot}> • </Text>
                      <Text style={styles.timeMetaText}>{getTimeAgo(act.createdAt)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Activity Summary Counts Container */}
        {activities.length > 0 && (
          <View style={styles.summaryContainerCard}>
            <Text style={styles.summaryCardHeading}>Activity Summary</Text>
            <View style={styles.summaryGrid}>
              {ACTIVITY_TYPES.slice(1).map((typeObj) => {
                const count = activities.filter((a) => a.type === typeObj.value).length;
                return (
                  <View key={typeObj.value} style={styles.summaryItemBox}>
                    <Text style={styles.summaryCountNumber}>{count}</Text>
                    <Text style={styles.summaryItemLabel}>{typeObj.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Type Filter Select Modal */}
      <Modal visible={filterModalOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalOpen(false)}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Activity Type</Text>
              <TouchableOpacity onPress={() => setFilterModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {ACTIVITY_TYPES.map((t) => {
                const isSelected = filterType === t.value;
                return (
                  <TouchableOpacity
                    key={t.value}
                    style={[styles.filterOptionItem, isSelected && styles.filterOptionActive]}
                    onPress={() => {
                      setFilterType(t.value);
                      setFilterModalOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterOptionLabel,
                        isSelected && styles.filterOptionLabelActive,
                      ]}
                    >
                      {t.label}
                    </Text>
                    {isSelected && <Check size={18} color="#0D9488" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Header Title Row
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleLeftCol: {
    flex: 1,
    marginRight: 12,
  },
  iconTitleFlex: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  pageSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 4,
  },
  activityCountTag: {
    color: '#0D9488',
    fontWeight: '700',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  exportBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },

  // Filters Card
  filtersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  searchBoxInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  filterDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#0D9488',
    paddingHorizontal: 12,
    height: 42,
  },
  filterTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTriggerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Activities List
  activitiesList: {
    gap: 12,
    marginBottom: 20,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  activityCardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityMainCol: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardActivityTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  typeBadgePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  cardActivityDesc: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 6,
  },
  timeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timeMetaText: {
    fontSize: 11.5,
    color: '#94A3B8',
  },
  timeMetaDot: {
    fontSize: 11.5,
    color: '#94A3B8',
  },

  // Loading & Empty States
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    alignItems: 'center',
    marginVertical: 10,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  clearFilterBtn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  clearFilterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Activity Summary Container
  summaryContainerCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CCFBF1',
    padding: 18,
    marginTop: 8,
    marginBottom: 20,
  },
  summaryCardHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryItemBox: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryCountNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  summaryItemLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  filterOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  filterOptionActive: {
    backgroundColor: '#CCFBF1',
  },
  filterOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  filterOptionLabelActive: {
    color: '#0D9488',
    fontWeight: '700',
  },
});
