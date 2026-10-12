import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../../src/constants/theme';
import { Header } from '../../../src/components/common/Header';
import { Card } from '../../../src/components/common/Card';
import { Badge } from '../../../src/components/common/Badge';
import { Loader } from '../../../src/components/common/Loader';
import { Toast } from '../../../src/components/common/Toast';
import { groupsApi, GroupCategoryStat } from '../../../src/api/groups.api';
import { GroupItem } from '../../../src/types';
import { useAuth } from '../../../src/context/AuthContext';
import {
  Search,
  Users,
  Lock,
  Globe,
  Filter,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  X,
} from 'lucide-react-native';

export default function MyGroupsScreen() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [categories, setCategories] = useState<GroupCategoryStat[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All groups');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [myPendingGroups, setMyPendingGroups] = useState<GroupItem[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);

  const [toastConfig, setToastConfig] = useState<{
    visible: boolean;
    message: string;
    type?: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const categoryTabs = [
    'All groups',
    'General',
    'Discipline-based',
    'Interest-based',
    'Career-focused',
    'City chapters',
  ];

  const filterOptions = ['All', 'Public', 'Private'];

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastConfig({ visible: true, message, type });
  };

  const fetchCategories = useCallback(async () => {
    try {
      const stats = await groupsApi.getCategoriesStats();
      setCategories(stats);
    } catch (error) {
      console.error('Error fetching group categories:', error);
    }
  }, []);

  const fetchMyPendingGroups = useCallback(async () => {
    try {
      const pending = await groupsApi.getMyPendingGroups();
      setMyPendingGroups(pending);
    } catch (error) {
      setMyPendingGroups([]);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await groupsApi.getGroups({
        category: selectedCategory,
        search: searchQuery,
        type: filterType,
        page: currentPage,
        limit: 12,
      });

      setGroups(data.groups || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, filterType, currentPage]);

  useEffect(() => {
    fetchCategories();
    fetchMyPendingGroups();
  }, [fetchCategories, fetchMyPendingGroups]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchCategories(), fetchMyPendingGroups(), fetchGroups()]);
    setRefreshing(false);
  };

  const handleJoinGroup = async (groupId: string, groupName: string) => {
    try {
      await groupsApi.joinGroup(groupId);
      showToast(`Joined ${groupName} successfully!`, 'success');
      fetchGroups();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to join group';
      Alert.alert('Join Request', msg);
    }
  };

  const getGroupIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'public':
        return <Globe size={14} color={Colors.textSecondary} />;
      case 'private':
      case 'secret':
        return <Lock size={14} color={Colors.textSecondary} />;
      default:
        return <Users size={14} color={Colors.textSecondary} />;
    }
  };

  const getStatusBadge = (status?: string) => {
    const badges: Record<string, { icon: any; text: string; bg: string; color: string; border: string }> = {
      pending: {
        icon: Clock,
        text: 'Pending Review',
        bg: '#FEF3C7',
        color: '#B45309',
        border: '#FCD34D',
      },
      approved: {
        icon: CheckCircle,
        text: 'Approved',
        bg: '#D1FAE5',
        color: '#047857',
        border: '#6EE7B7',
      },
      rejected: {
        icon: XCircle,
        text: 'Rejected',
        bg: '#FEE2E2',
        color: '#B91C1C',
        border: '#FCA5A5',
      },
    };

    const b = badges[status || 'pending'] || badges.pending;
    const Icon = b.icon;

    return (
      <View style={[styles.statusBadge, { backgroundColor: b.bg, borderColor: b.border }]}>
        <Icon size={12} color={b.color} />
        <Text style={[styles.statusBadgeText, { color: b.color }]}>{b.text}</Text>
      </View>
    );
  };

  const renderGroupCard = ({ item }: { item: GroupItem }) => (
    <Card style={styles.groupCard}>
      {/* Top Banner Color Bar */}
      <View style={styles.cardBannerBar} />

      <View style={styles.cardContent}>
        {/* Title & Type Badge */}
        <View style={styles.cardHeaderRow}>
          <Text style={styles.groupName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.typeBadge}>
            {getGroupIcon(item.type)}
            <Text style={styles.typeBadgeText}>
              {item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Public'}
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.groupDescription} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Category & Region Meta info */}
        <View style={styles.metaBadgesRow}>
          {item.category && <Badge label={item.category} variant="primary" />}
          {item.discipline ? (
            <View style={styles.subMetaBadge}>
              <Text style={styles.subMetaText}>{item.discipline}</Text>
            </View>
          ) : null}
          {item.region ? (
            <View style={styles.subMetaBadge}>
              <Text style={styles.subMetaText}>📍 {item.region}</Text>
            </View>
          ) : null}
        </View>

        {/* Card Footer: Members Count & Join Action */}
        <View style={styles.cardFooter}>
          <View style={styles.memberCountGroup}>
            <Users size={14} color={Colors.textMuted} />
            <Text style={styles.memberCountText}>
              {item.memberCount || 0} members
            </Text>
          </View>

          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => handleJoinGroup(item._id, item.name)}
          >
            <Text style={styles.joinBtnText}>Join group</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header title="My Groups" showBack showNotif />

      <Toast
        visible={toastConfig.visible}
        message={toastConfig.message}
        type={toastConfig.type}
        onDismiss={() => setToastConfig({ ...toastConfig, visible: false })}
      />

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.screenTitle}>My Groups</Text>
          <Text style={styles.screenSubtitle}>
            Join sub-groups, share experiences, and learn from the KEA members
          </Text>
        </View>

        {/* Pending Groups Notification Banner */}
        {myPendingGroups.length > 0 && (
          <View style={styles.pendingBannerContainer}>
            <View style={styles.pendingBannerHeader}>
              <AlertCircle size={18} color="#D97706" />
              <Text style={styles.pendingBannerTitle}>
                Groups Awaiting Approval ({myPendingGroups.length})
              </Text>
            </View>
            <View style={styles.pendingList}>
              {myPendingGroups.map((group) => (
                <View key={group._id} style={styles.pendingItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pendingItemName}>{group.name}</Text>
                    <Text style={styles.pendingItemDesc} numberOfLines={1}>
                      {group.description}
                    </Text>
                  </View>
                  {getStatusBadge(group.approvalStatus)}
                </View>
              ))}
            </View>
            <Text style={styles.pendingBannerFooter}>
              Your group requests are being reviewed by administrators. You'll be notified once approved.
            </Text>
          </View>
        )}

        {/* Search and Filter Container Card */}
        <View style={styles.searchFilterCard}>
          <View style={styles.searchFilterTopRow}>
            {/* Search Input */}
            <View style={styles.searchBar}>
              <Search size={18} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search groups by name, location or keyword"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setCurrentPage(1);
                }}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={16} color="#9CA3AF" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Dropdown Selector */}
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() => setShowFilterModal(true)}
            >
              <Text style={styles.dropdownSelectorText}>{filterType}</Text>
              <ChevronDown size={16} color="#4B5563" />
            </TouchableOpacity>

            {/* Filter Icon Button */}
            <TouchableOpacity
              style={styles.filterIconButton}
              onPress={() => setShowFilterModal(true)}
            >
              <Filter size={18} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Category Tabs (Horizontally Scrollable) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryTabsScroll}
            contentContainerStyle={styles.categoryTabsContainer}
          >
            {categoryTabs.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryTab, isSelected && styles.categoryTabActive]}
                  onPress={() => {
                    setSelectedCategory(cat);
                    setCurrentPage(1);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      isSelected && styles.categoryTabTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Directory Section Header */}
        <View style={styles.directoryHeader}>
          <Text style={styles.directoryTitle}>My Groups directory</Text>
          <Text style={styles.directoryCount}>Showing {groups.length} groups</Text>
        </View>

        {/* Groups Content Area */}
        {loading ? (
          <Loader message="Loading groups directory..." />
        ) : groups.length === 0 ? (
          /* Empty State Component matching exact reference design */
          <View style={styles.emptyStateCard}>
            <Users size={64} color="#9CA3AF" strokeWidth={1.5} style={styles.emptyStateIcon} />
            <Text style={styles.emptyStateText}>No groups found</Text>
          </View>
        ) : (
          /* Groups List */
          <View style={styles.groupsListContainer}>
            {groups.map((group) => (
              <React.Fragment key={group._id}>
                {renderGroupCard({ item: group })}
              </React.Fragment>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                  disabled={currentPage === 1}
                  onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <Text style={styles.pageBtnText}>Previous</Text>
                </TouchableOpacity>

                <View style={styles.pageNumbersGroup}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    const isActive = pageNum === currentPage;
                    return (
                      <TouchableOpacity
                        key={pageNum}
                        style={[styles.pageNumBtn, isActive && styles.pageNumBtnActive]}
                        onPress={() => setCurrentPage(pageNum)}
                      >
                        <Text
                          style={[
                            styles.pageNumText,
                            isActive && styles.pageNumTextActive,
                          ]}
                        >
                          {pageNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
                  disabled={currentPage === totalPages}
                  onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <Text style={styles.pageBtnText}>Next</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Filter Modal for Type Selection */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.filterModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Groups by Type</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalOptionsList}>
              {filterOptions.map((opt) => {
                const isSelected = filterType === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.filterOptionItem, isSelected && styles.filterOptionItemActive]}
                    onPress={() => {
                      setFilterType(opt);
                      setCurrentPage(1);
                      setShowFilterModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        isSelected && styles.filterOptionTextActive,
                      ]}
                    >
                      {opt === 'All' ? 'All Types (Public & Private)' : `${opt} Groups`}
                    </Text>
                    {isSelected && <CheckCircle size={18} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  pendingBannerContainer: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  pendingBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pendingBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#78350F',
  },
  pendingList: {
    gap: 8,
    marginBottom: 8,
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  pendingItemDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  pendingBannerFooter: {
    fontSize: 11,
    color: '#92400E',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  searchFilterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchFilterTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    marginLeft: 6,
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    gap: 6,
  },
  dropdownSelectorText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  filterIconButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTabsScroll: {
    marginHorizontal: -2,
  },
  categoryTabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  categoryTabActive: {
    backgroundColor: '#2563EB',
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  directoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  directoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  directoryCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 56,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  emptyStateIcon: {
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  groupsListContainer: {
    gap: 12,
  },
  groupCard: {
    marginBottom: 12,
    padding: 0,
    overflow: 'hidden',
  },
  cardBannerBar: {
    height: 6,
    backgroundColor: '#2563EB',
  },
  cardContent: {
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  groupName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
  },
  groupDescription: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 10,
  },
  metaBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  subMetaBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subMetaText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
    marginTop: 4,
  },
  memberCountGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  memberCountText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  joinBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
    gap: 8,
  },
  pageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  pageNumbersGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  pageNumBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  pageNumBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  pageNumText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  pageNumTextActive: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  filterModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  modalOptionsList: {
    padding: 12,
  },
  filterOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  filterOptionItemActive: {
    backgroundColor: '#EFF6FF',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  filterOptionTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
});
