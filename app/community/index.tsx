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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import { Loader } from '../../src/components/common/Loader';
import { EmptyState } from '../../src/components/common/EmptyState';
import { Toast } from '../../src/components/common/Toast';
import { forumsApi, CategoryStat } from '../../src/api/forums.api';
import { ForumThread } from '../../src/types';
import { useAuth } from '../../src/context/AuthContext';
import {
  Search,
  Plus,
  MessageSquare,
  Pin,
  Lock,
  Clock,
  User,
  Trash2,
  Shield,
  Eye,
  X,
  ChevronRight,
  Filter,
} from 'lucide-react-native';

export default function CommunityForumScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'admin' || user?.role === 'moderator';

  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All discussions');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);

  const [toastConfig, setToastConfig] = useState<{
    visible: boolean;
    message: string;
    type?: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const [newThread, setNewThread] = useState<{
    title: string;
    content: string;
    category: string;
    tags: string;
  }>({
    title: '',
    content: '',
    category: '',
    tags: '',
  });

  const [newCategory, setNewCategory] = useState<string>('');
  const [posting, setPosting] = useState<boolean>(false);

  const availableCategories = [
    'Structural engineering',
    'Civil & Infrastructure',
    'Mechanical & manufacturing',
    'Materials & testing',
    'Jobs & opportunities',
    'Geotechnical Engineering',
    'Transportation Engineering',
    'Environmental Engineering',
    'Water Resources & Hydrology',
    'Construction Management',
    'Automation & Robotics',
    'BIM & CAD',
    'Software & IT',
    'Quality & Safety (HSE)',
    'Jobs & Opportunities',
    'Internships & Training',
    'General',
  ];

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastConfig({ visible: true, message, type });
  };

  const fetchCategories = useCallback(async () => {
    try {
      const stats = await forumsApi.getCategoriesStats();
      setCategories(stats);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await forumsApi.getThreads({
        category: selectedCategory,
        search: searchQuery,
        sort: sortBy,
        page: currentPage,
        limit: 20,
      });

      setThreads(data.threads || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching threads:', error);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, sortBy, currentPage]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchCategories(), fetchThreads()]);
    setRefreshing(false);
  };

  const getTimeAgo = (date?: string) => {
    if (!date) return 'Recently';
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (isNaN(seconds) || seconds < 0) return 'Recently';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleCreateThread = async () => {
    if (!newThread.title.trim() || !newThread.content.trim() || !newThread.category) {
      Alert.alert('Missing Fields', 'Please enter Title, Category and Content details.');
      return;
    }

    setPosting(true);
    try {
      const tagsArray = newThread.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await forumsApi.createThread({
        title: newThread.title.trim(),
        content: newThread.content.trim(),
        category: newThread.category,
        tags: tagsArray,
      });

      setShowCreateModal(false);
      resetForm();
      showToast('Thread sent for admin approval', 'success');
      fetchThreads();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to create thread';
      Alert.alert('Error', msg);
    } finally {
      setPosting(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      Alert.alert('Missing Name', 'Please enter category name.');
      return;
    }

    try {
      await forumsApi.createCategory(newCategory.trim());
      setNewCategory('');
      setShowCategoryModal(false);
      showToast('Category added successfully', 'success');
      fetchCategories();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to add category';
      Alert.alert('Error', msg);
    }
  };

  const handleDeleteThread = (threadId: string) => {
    Alert.alert(
      'Delete Thread',
      'Are you sure you want to delete this thread? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await forumsApi.deleteThread(threadId);
              showToast('Thread deleted successfully', 'success');
              fetchThreads();
            } catch (error: any) {
              const msg = error?.response?.data?.message || 'Failed to delete thread';
              Alert.alert('Error', msg);
            }
          },
        },
      ]
    );
  };

  const handleTogglePin = async (threadId: string) => {
    try {
      await forumsApi.togglePin(threadId);
      fetchThreads();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to pin thread';
      Alert.alert('Error', msg);
    }
  };

  const handleToggleLock = async (threadId: string) => {
    try {
      await forumsApi.toggleLock(threadId);
      fetchThreads();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to lock thread';
      Alert.alert('Error', msg);
    }
  };

  const resetForm = () => {
    setNewThread({
      title: '',
      content: '',
      category: '',
      tags: '',
    });
  };

  const renderThreadCard = ({ item }: { item: ForumThread }) => {
    const repliesCount = item.replies?.length || item.commentsCount || item.comments?.length || 0;
    const viewsCount = item.views || 0;

    return (
      <Card style={styles.card} onPress={() => router.push(`/community/${item._id}` as any)}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.authorContainer}>
            <View style={styles.authorAvatar}>
              <Text style={styles.authorInitial}>{item.author?.name?.charAt(0) || 'M'}</Text>
            </View>
            <View style={styles.authorDetails}>
              <Text style={styles.authorName} numberOfLines={1}>
                {item.author?.name || 'KEA Member'}
              </Text>
              <View style={styles.timeRow}>
                <Clock size={11} color={Colors.textMuted} />
                <Text style={styles.timeText}>{getTimeAgo(item.lastActivity || item.createdAt)}</Text>
              </View>
            </View>
          </View>

          {/* Moderator & Admin Controls */}
          {isModerator && (
            <View style={styles.modControls}>
              <TouchableOpacity
                onPress={() => handleTogglePin(item._id)}
                style={[styles.modBtn, item.isPinned && styles.modBtnActivePin]}
              >
                <Pin size={14} color={item.isPinned ? Colors.primary : Colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleToggleLock(item._id)}
                style={[styles.modBtn, item.isLocked && styles.modBtnActiveLock]}
              >
                <Lock size={14} color={item.isLocked ? '#EA580C' : Colors.textMuted} />
              </TouchableOpacity>
              {isAdmin && (
                <TouchableOpacity
                  onPress={() => handleDeleteThread(item._id)}
                  style={[styles.modBtn, styles.modBtnDelete]}
                >
                  <Trash2 size={14} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          {item.isPinned && <Pin size={16} color={Colors.primary} style={styles.statusIcon} />}
          {item.isLocked && <Lock size={16} color="#6B7280" style={styles.statusIcon} />}
          <Text style={styles.threadTitle} numberOfLines={2}>
            {item.title}
          </Text>
        </View>

        {/* Categories & Tags */}
        <View style={styles.badgesRow}>
          {item.category && <Badge label={item.category} variant="primary" />}
          {item.tags?.map((tag, idx) => (
            <View key={idx} style={styles.tagBadge}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        {/* Footer Stats */}
        <View style={styles.cardFooter}>
          <View style={styles.statsGroup}>
            <View style={styles.statItem}>
              <MessageSquare size={14} color={Colors.primary} />
              <Text style={styles.statText}>{repliesCount} replies</Text>
            </View>
            <View style={styles.statItem}>
              <Eye size={14} color={Colors.textMuted} />
              <Text style={styles.statText}>{viewsCount} views</Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.textMuted} />
        </View>
      </Card>
    );
  };

  const renderCategoryPill = (catName: string, count?: number) => {
    const isSelected = selectedCategory === catName;
    return (
      <TouchableOpacity
        key={catName}
        style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
        onPress={() => {
          setSelectedCategory(catName);
          setCurrentPage(1);
        }}
      >
        <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
          {catName}
        </Text>
        {typeof count === 'number' && count > 0 && (
          <View style={[styles.countBadge, isSelected && styles.countBadgeActive]}>
            <Text style={[styles.countBadgeText, isSelected && styles.countBadgeTextActive]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Forums" showBack showNotif />

      <Toast
        visible={toastConfig.visible}
        message={toastConfig.message}
        type={toastConfig.type}
        onDismiss={() => setToastConfig({ ...toastConfig, visible: false })}
      />

      {/* Admin Mode Notice Banner */}
      {isAdmin && (
        <View style={styles.adminBanner}>
          <Shield size={16} color="#1E40AF" />
          <Text style={styles.adminBannerText}>Admin mode: You have moderation privileges</Text>
        </View>
      )}

      {/* Top Action Header Bar */}
      <View style={styles.actionHeader}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.subHeaderTitle}>Discussion Forums</Text>
          <Text style={styles.subHeaderSubtitle}>Ask questions & learn from KEA members</Text>
        </View>

        <View style={styles.headerButtonsGroup}>
          {isAdmin && (
            <TouchableOpacity
              style={styles.addCategoryBtn}
              onPress={() => setShowCategoryModal(true)}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addCategoryBtnText}>Category</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.newThreadBtn} onPress={() => setShowCreateModal(true)}>
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.newThreadBtnText}>New Thread</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar & Sort Selector */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search threads, tags..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setCurrentPage(1);
            }}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Sort Options */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortContainer}>
          {[
            { id: 'latest', label: 'Latest' },
            { id: 'popular', label: 'Most Popular' },
            { id: 'unanswered', label: 'Unanswered' },
          ].map((sortOption) => (
            <TouchableOpacity
              key={sortOption.id}
              style={[styles.sortChip, sortBy === sortOption.id && styles.sortChipActive]}
              onPress={() => {
                setSortBy(sortOption.id);
                setCurrentPage(1);
              }}
            >
              <Text
                style={[
                  styles.sortChipText,
                  sortBy === sortOption.id && styles.sortChipTextActive,
                ]}
              >
                {sortOption.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Categories Horizontal Scroll */}
      <View style={styles.categorySection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {renderCategoryPill('All discussions')}
          {categories.map((cat) => renderCategoryPill(cat.name, cat.count))}
        </ScrollView>
      </View>

      {/* Threads List */}
      {loading ? (
        <Loader message="Loading forum discussions..." fullScreen />
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item._id}
          renderItem={renderThreadCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Threads Found"
              description="No engineering discussions found. Be the first to start a conversation!"
              actionTitle="Start First Thread"
              onAction={() => setShowCreateModal(true)}
            />
          }
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                  disabled={currentPage === 1}
                  onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <Text style={styles.pageBtnText}>Prev</Text>
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
            ) : null
          }
        />
      )}

      {/* Floating Plus FAB Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowCreateModal(true)}>
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Create New Thread Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Thread</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.closeModalBtn}>
                <X size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="What's your question or topic?"
                placeholderTextColor={Colors.textMuted}
                value={newThread.title}
                onChangeText={(text) => setNewThread({ ...newThread, title: text })}
              />

              <Text style={styles.inputLabel}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                {availableCategories.map((cat) => {
                  const isCatSelected = newThread.category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catPickChip, isCatSelected && styles.catPickChipActive]}
                      onPress={() => setNewThread({ ...newThread, category: cat })}
                    >
                      <Text
                        style={[
                          styles.catPickChipText,
                          isCatSelected && styles.catPickChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.inputLabel}>Content *</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                placeholder="Describe your question or topic in detail..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={newThread.content}
                onChangeText={(text) => setNewThread({ ...newThread, content: text })}
              />

              <Text style={styles.inputLabel}>Tags (comma separated)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., design, analysis, steel"
                placeholderTextColor={Colors.textMuted}
                value={newThread.tags}
                onChangeText={(text) => setNewThread({ ...newThread, tags: text })}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.submitBtn, posting && styles.btnDisabled]}
                  disabled={posting}
                  onPress={handleCreateThread}
                >
                  <Text style={styles.submitBtnText}>
                    {posting ? 'Posting...' : 'Post Thread'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Category Modal (Admin) */}
      <Modal
        visible={showCategoryModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { maxHeight: 280 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Forum Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <X size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16 }}>
              <Text style={styles.inputLabel}>Category Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Environmental Engineering"
                placeholderTextColor={Colors.textMuted}
                value={newCategory}
                onChangeText={setNewCategory}
              />

              <View style={[styles.modalActions, { marginTop: 16 }]}>
                <TouchableOpacity style={styles.submitBtn} onPress={handleAddCategory}>
                  <Text style={styles.submitBtnText}>Add Category</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowCategoryModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  adminBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitleGroup: {
    flex: 1,
  },
  subHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subHeaderSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerButtonsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  addCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4B5563',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  addCategoryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  newThreadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  newThreadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  sortContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: Colors.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  sortChipTextActive: {
    color: '#FFFFFF',
  },
  categorySection: {
    marginBottom: 8,
  },
  categoryScroll: {
    paddingHorizontal: 16,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  categoryPillText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  countBadgeActive: {
    backgroundColor: '#DBEAFE',
  },
  countBadgeText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  countBadgeTextActive: {
    color: Colors.primary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    marginBottom: 12,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitial: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  authorDetails: {
    marginLeft: 10,
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  modControls: {
    flexDirection: 'row',
    gap: 4,
  },
  modBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  modBtnActivePin: {
    backgroundColor: '#DBEAFE',
  },
  modBtnActiveLock: {
    backgroundColor: '#FFEDD5',
  },
  modBtnDelete: {
    backgroundColor: '#FEE2E2',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  statusIcon: {
    marginRight: 6,
    marginTop: 3,
  },
  threadTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  statsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
    gap: 8,
  },
  pageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  pageNumbersGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  pageNumBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pageNumBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pageNumText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  pageNumTextActive: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeModalBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  textAreaInput: {
    height: 120,
  },
  pickerScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  catPickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 6,
  },
  catPickChipActive: {
    backgroundColor: Colors.primary,
  },
  catPickChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  catPickChipTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

