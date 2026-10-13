import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  useWindowDimensions,
  RefreshControl,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  FileText,
  Calendar,
  Users,
  MessageSquare,
  Image as ImageIcon,
  GraduationCap,
  Pin,
  Lock,
  Trash2,
  AlertCircle,
  Eye,
  Check,
  RefreshCw,
  Filter,
} from 'lucide-react-native';

import { apiClient, getCleanErrorMessage } from '../../api/client';
import { adminToast } from './ToastOverride';

import { router } from 'expo-router';

export type AdminModuleType =
  | 'approvals'
  | 'members'
  | 'jobs'
  | 'blogs'
  | 'events'
  | 'feedback'
  | 'forums'
  | 'gallery'
  | 'mentors'
  | 'tools'
  | 'analytics'
  | 'admins';

type ModuleListener = (module: AdminModuleType) => void;
export const adminModuleListeners = new Set<ModuleListener>();

export const openAdminModule = (mod: AdminModuleType) => {
  if (mod === 'analytics') {
    router.navigate('/(admin)/analytics' as any);
    return;
  }
  if (mod === 'admins') {
    router.navigate('/(admin)/admins' as any);
    return;
  }
  if (mod === 'blogs') {
    router.navigate('/(admin)/blogs' as any);
    return;
  }
  adminModuleListeners.forEach((listener) => listener(mod));
};

interface AdminModuleManagerModalProps {
  visible: boolean;
  module: AdminModuleType | null;
  onClose: () => void;
  onActionComplete?: () => void;
}

export default function AdminModuleManagerModal({
  visible,
  module,
  onClose,
  onActionComplete,
}: AdminModuleManagerModalProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<any[]>([]);

  // Titles & Info
  const getModuleTitle = () => {
    switch (module) {
      case 'approvals':
        return 'Approvals Hub';
      case 'members':
        return 'Members Moderation';
      case 'jobs':
        return 'Job Postings Moderation';
      case 'blogs':
        return 'Blog Posts Moderation';
      case 'events':
        return 'Events Moderation';
      case 'feedback':
        return 'Feedbacks & Inquiries';
      case 'forums':
        return 'Forums & Threads Moderation';
      case 'gallery':
        return 'Testimonials & Gallery';
      case 'mentors':
        return 'Mentor Applications';
      case 'tools':
        return 'Tools Management';
      default:
        return 'Admin Moderation';
    }
  };

  // 1. Fetch Backend Data based on module
  const fetchModuleData = useCallback(async () => {
    if (!module) return;
    setLoading(true);
    try {
      let data: any[] = [];

      if (module === 'members') {
        const res = await apiClient.get('/admin/members', {
          params: { status: statusFilter === 'all' ? 'all' : statusFilter === 'pending' ? 'pending' : 'approved', limit: 50 },
        });
        data = res.data?.members || (Array.isArray(res.data) ? res.data : []);
      } else if (module === 'jobs') {
        const res = await apiClient.get('/admin/jobs');
        const allJobs = Array.isArray(res.data) ? res.data : res.data?.jobs || [];
        if (statusFilter === 'pending') {
          data = allJobs.filter((j: any) => j.status === 'pending');
        } else if (statusFilter === 'approved') {
          data = allJobs.filter((j: any) => j.status === 'approved');
        } else {
          data = allJobs;
        }
      } else if (module === 'blogs') {
        const res = await apiClient.get('/admin/blogs');
        const allBlogs = Array.isArray(res.data) ? res.data : res.data?.blogs || [];
        if (statusFilter === 'pending') {
          data = allBlogs.filter((b: any) => b.status === 'pending');
        } else if (statusFilter === 'approved') {
          data = allBlogs.filter((b: any) => b.status === 'published' || b.status === 'approved');
        } else {
          data = allBlogs;
        }
      } else if (module === 'events') {
        const res = await apiClient.get('/admin/events');
        const allEvents = Array.isArray(res.data) ? res.data : res.data?.events || [];
        if (statusFilter === 'pending') {
          data = allEvents.filter((e: any) => e.status === 'pending');
        } else if (statusFilter === 'approved') {
          data = allEvents.filter((e: any) => e.status === 'approved');
        } else {
          data = allEvents;
        }
      } else if (module === 'feedback') {
        const res = await apiClient.get('/admin/feedback');
        const allFeedback = Array.isArray(res.data) ? res.data : res.data?.feedbacks || [];
        if (statusFilter === 'pending') {
          data = allFeedback.filter((f: any) => f.status === 'pending');
        } else if (statusFilter === 'approved') {
          data = allFeedback.filter((f: any) => f.status === 'resolved');
        } else {
          data = allFeedback;
        }
      } else if (module === 'forums') {
        const res = await apiClient.get('/forums', { params: { limit: 50 } });
        data = res.data?.threads || (Array.isArray(res.data) ? res.data : []);
      } else if (module === 'gallery') {
        const res = await apiClient.get('/admin/gallery');
        const allGallery = Array.isArray(res.data) ? res.data : res.data?.gallery || [];
        if (statusFilter === 'pending') {
          data = allGallery.filter((g: any) => g.isApproved === false);
        } else if (statusFilter === 'approved') {
          data = allGallery.filter((g: any) => g.isApproved === true);
        } else {
          data = allGallery;
        }
      } else if (module === 'mentors') {
        const res = await apiClient.get('/mentors/admin/all', { params: { limit: 50 } });
        data = res.data?.mentors || (Array.isArray(res.data) ? res.data : []);
        if (statusFilter === 'pending') {
          data = data.filter((m: any) => m.status === 'pending');
        } else if (statusFilter === 'approved') {
          data = data.filter((m: any) => m.status === 'approved');
        }
      } else if (module === 'approvals') {
        // Approvals Hub: fetch pending items across all key modules
        const [membersRes, jobsRes, blogsRes, eventsRes] = await Promise.allSettled([
          apiClient.get('/admin/members/pending'),
          apiClient.get('/admin/jobs/pending'),
          apiClient.get('/admin/blogs/pending'),
          apiClient.get('/admin/events/pending'),
        ]);

        const getArr = (r: PromiseSettledResult<any>) =>
          r.status === 'fulfilled' && Array.isArray(r.value.data) ? r.value.data : [];

        const pendingMembers = getArr(membersRes).map((m: any) => ({ ...m, _hubType: 'member' }));
        const pendingJobs = getArr(jobsRes).map((j: any) => ({ ...j, _hubType: 'job' }));
        const pendingBlogs = getArr(blogsRes).map((b: any) => ({ ...b, _hubType: 'blog' }));
        const pendingEvents = getArr(eventsRes).map((e: any) => ({ ...e, _hubType: 'event' }));

        data = [...pendingMembers, ...pendingJobs, ...pendingBlogs, ...pendingEvents];
      }

      setItems(data);
    } catch (err: any) {
      console.error('Admin module fetch error:', err);
      adminToast.error(getCleanErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [module, statusFilter]);

  useEffect(() => {
    if (visible && module) {
      fetchModuleData();
    }
  }, [visible, module, fetchModuleData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchModuleData();
  };

  // =====================
  // ACTION HANDLERS
  // =====================

  // 1. Members
  const handleApproveMember = async (id: string, name?: string) => {
    setActionLoadingId(id);
    try {
      await apiClient.patch(`/admin/members/${id}/approve`, {});
      adminToast.success(`Member "${name || ''}" approved successfully!`);
      setItems((prev) => prev.filter((item) => item._id !== id));
      onActionComplete?.();
    } catch (err: any) {
      adminToast.error(getCleanErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectMember = async (id: string, name?: string) => {
    setActionLoadingId(id);
    try {
      await apiClient.patch(`/admin/members/${id}/reject`, { reason: 'Rejected by administrator' });
      adminToast.warning(`Member "${name || ''}" rejected.`);
      setItems((prev) => prev.filter((item) => item._id !== id));
      onActionComplete?.();
    } catch (err: any) {
      adminToast.error(getCleanErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. Jobs
  const handleApproveJob = async (id: string, title?: string) => {
    setActionLoadingId(id);
    try {
      await apiClient.post(`/admin/jobs/approve/${id}`, {});
      adminToast.success(`Job "${title || ''}" approved!`);
      setItems((prev) => prev.filter((item) => item._id !== id));
      onActionComplete?.();
    } catch (err: any) {
      adminToast.error(getCleanErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectJob = async (id: string, title?: string) => {
    setActionLoadingId(id);
    try {
      await apiClient.post(`/admin/jobs/reject/${id}`, { reason: 'Requirements not met' });
      adminToast.warning(`Job "${title || ''}" rejected.`);
      setItems((prev) => prev.filter((item) => item._id !== id));
      onActionComplete?.();
    } catch (err: any) {
      adminToast.error(getCleanErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. Blogs
  const handleApproveBlog = async (id: string, title?: string) => {
    setActionLoadingId(id);
    try {
      await apiClient.post(`/admin/blogs/approve/${id}`, {});
      adminToast.success(`Blog "${title || ''}" approved & published!`);
      setItems((prev) => prev.filter((item) => item._id !== id));
      onActionComplete?.();
    } catch (err: any) {
      adminToast.error(getCleanErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectBlog = async (id: string, title?: string) => {
    setActionLoadingId(id);
    try {
      await apiClient.post(`/admin/blogs/reject/${id}`, { reason: 'Content guidelines check' });
      adminToast.warning(`Blog "${title || ''}" rejected.`);
      setItems((prev) => prev.filter((item) => item._id !== id));
      onActionComplete?.();
    } catch (err: any) {
      adminToast.error(getCleanErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. Events
  const handleApproveEvent = async (id: string, title?: string) => {
    setActionLoadingId(id);
    try {
      await apiClient.post(`/admin/events/approve/${id}`, {});
      adminToast.success(`Event "${title || ''}" approved!`);
      setItems((prev) => prev.filter((item) => item._id !== id));
      onActionComplete?.();
    } catch (err: any) {
      adminToast.error(getCleanErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectEvent = async (id: string, title?: string) => {
    setActionLoadingId(id);
    try {
      await apiClient.post(`/admin/events/reject/${id}`, {});
      adminToast.warning(`Event "${title || ''}" rejected.`);
      setItems((prev) => prev.filter((item) => item._id !== id));
      onActionComplete?.();
    } catch (err: any) {
      adminToast.error(getCleanErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  // 5. Feedbacks
  const handleResolveFeedback = async (id: string) => {
    setActionLoadingId(id);
    try {
      await apiClient.put(`/admin/feedback/${id}`, { status: 'resolved' });
      adminToast.success('Feedback marked as resolved!');
      setItems((prev) => prev.map((f) => (f._id === id ? { ...f, status: 'resolved' } : f)));
      onActionComplete?.();
    } catch (err: any) {
      adminToast.error(getCleanErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  // 6. Forums
  const handleTogglePinThread = async (id: string, current: boolean) => {
    setActionLoadingId(id);
    try {
      await apiClient.patch(`/forums/${id}/pin`, {});
      adminToast.info(current ? 'Thread unpinned' : 'Thread pinned to top');
      setItems((prev) => prev.map((t) => (t._id === id ? { ...t, isPinned: !current } : t)));
    } catch (err: any) {
      adminToast.error(getCleanErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleLockThread = async (id: string, current: boolean) => {
    setActionLoadingId(id);
    try {
      await apiClient.patch(`/forums/${id}/lock`, {});
      adminToast.info(current ? 'Thread unlocked' : 'Thread locked');
      setItems((prev) => prev.map((t) => (t._id === id ? { ...t, isLocked: !current } : t)));
    } catch (err: any) {
      adminToast.error(getCleanErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteThread = async (id: string) => {
    Alert.alert('Delete Thread', 'Are you sure you want to delete this discussion thread?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setActionLoadingId(id);
          try {
            await apiClient.delete(`/forums/${id}`);
            adminToast.success('Thread deleted.');
            setItems((prev) => prev.filter((t) => t._id !== id));
            onActionComplete?.();
          } catch (err: any) {
            adminToast.error(getCleanErrorMessage(err));
          } finally {
            setActionLoadingId(null);
          }
        },
      },
    ]);
  };

  // Filter items by search query
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const str = JSON.stringify(item).toLowerCase();
    return str.includes(query);
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        {/* Header */}
        <LinearGradient
          colors={['#0D2847', '#1a3a5c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.modalHeader,
            { paddingTop: Math.max(insets.top, 14) + 6 },
          ]}
        >
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleBox}>
              <Text style={styles.moduleBadge}>ADMIN CONSOLE</Text>
              <Text style={styles.headerTitleText}>{getModuleTitle()}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchBar}>
            <Search size={16} color="#94A3B8" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search records by name, email, or title..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Status Tabs (if not Approvals Hub) */}
          {module !== 'approvals' && (
            <View style={styles.tabsRow}>
              <TouchableOpacity
                onPress={() => setStatusFilter('pending')}
                style={[
                  styles.tabButton,
                  statusFilter === 'pending' && styles.tabButtonActive,
                ]}
              >
                <Clock size={13} color={statusFilter === 'pending' ? '#FFFFFF' : '#BFDBFE'} />
                <Text
                  style={[
                    styles.tabButtonText,
                    statusFilter === 'pending' && styles.tabButtonTextActive,
                  ]}
                >
                  Pending
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStatusFilter('approved')}
                style={[
                  styles.tabButton,
                  statusFilter === 'approved' && styles.tabButtonActive,
                ]}
              >
                <CheckCircle size={13} color={statusFilter === 'approved' ? '#FFFFFF' : '#BFDBFE'} />
                <Text
                  style={[
                    styles.tabButtonText,
                    statusFilter === 'approved' && styles.tabButtonTextActive,
                  ]}
                >
                  Approved
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStatusFilter('all')}
                style={[
                  styles.tabButton,
                  statusFilter === 'all' && styles.tabButtonActive,
                ]}
              >
                <Filter size={13} color={statusFilter === 'all' ? '#FFFFFF' : '#BFDBFE'} />
                <Text
                  style={[
                    styles.tabButtonText,
                    statusFilter === 'all' && styles.tabButtonTextActive,
                  ]}
                >
                  All Records
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>

        {/* Content List */}
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
          }
          showsVerticalScrollIndicator={false}
        >
          {loading && !refreshing ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.emptyText}>Loading admin records from backend...</Text>
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <AlertCircle size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No records found</Text>
              <Text style={styles.emptyText}>
                No entries match the selected status or search filter.
              </Text>
              <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
                <RefreshCw size={14} color="#FFFFFF" />
                <Text style={styles.retryButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredItems.map((item, idx) => {
              const itemId = item._id || String(idx);
              const isActionLoading = actionLoadingId === itemId;

              // Render Item Card based on item type / module
              const hubType = item._hubType;
              const isMember = module === 'members' || hubType === 'member';
              const isJob = module === 'jobs' || hubType === 'job';
              const isBlog = module === 'blogs' || hubType === 'blog';
              const isEvent = module === 'events' || hubType === 'event';
              const isFeedback = module === 'feedback';
              const isForum = module === 'forums';

              const itemTitle =
                item.name || item.title || item.subject || 'Administrative Record';
              const itemSubtitle =
                item.email ||
                item.company ||
                item.author?.name ||
                item.user?.name ||
                item.location ||
                '';
              const itemDate = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString()
                : '';
              const itemStatus = item.membershipStatus || item.status || (item.isApproved ? 'approved' : 'pending');

              return (
                <View key={itemId} style={styles.cardContainer}>
                  {/* Card Header */}
                  <View style={styles.cardTop}>
                    <View style={styles.cardInfoCol}>
                      <View style={styles.categoryBadgeRow}>
                        {hubType && (
                          <View style={styles.hubTypeBadge}>
                            <Text style={styles.hubTypeBadgeText}>{hubType.toUpperCase()}</Text>
                          </View>
                        )}
                        <View
                          style={[
                            styles.statusBadge,
                            itemStatus === 'pending'
                              ? styles.statusBadgePending
                              : styles.statusBadgeApproved,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              itemStatus === 'pending'
                                ? styles.statusBadgeTextPending
                                : styles.statusBadgeTextApproved,
                            ]}
                          >
                            {String(itemStatus).toUpperCase()}
                          </Text>
                        </View>
                        {item.memberId ? (
                          <Text style={styles.memberIdText}>ID: {item.memberId}</Text>
                        ) : null}
                      </View>

                      <Text style={styles.cardTitle}>{itemTitle}</Text>
                      {itemSubtitle ? (
                        <Text style={styles.cardSubtitle}>{itemSubtitle}</Text>
                      ) : null}
                      {item.message || item.description ? (
                        <Text style={styles.cardDesc} numberOfLines={3}>
                          {item.message || item.description}
                        </Text>
                      ) : null}
                    </View>

                    <Text style={styles.dateText}>{itemDate}</Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.cardActions}>
                    {isActionLoading ? (
                      <ActivityIndicator size="small" color="#2563EB" />
                    ) : (
                      <>
                        {/* Approve Buttons */}
                        {isMember && itemStatus === 'pending' && (
                          <TouchableOpacity
                            onPress={() => handleApproveMember(itemId, item.name)}
                            style={[styles.btnAction, styles.btnApprove]}
                          >
                            <Check size={14} color="#FFFFFF" />
                            <Text style={styles.btnActionText}>Approve</Text>
                          </TouchableOpacity>
                        )}

                        {isMember && itemStatus === 'pending' && (
                          <TouchableOpacity
                            onPress={() => handleRejectMember(itemId, item.name)}
                            style={[styles.btnAction, styles.btnReject]}
                          >
                            <X size={14} color="#EF4444" />
                            <Text style={[styles.btnActionText, { color: '#EF4444' }]}>Reject</Text>
                          </TouchableOpacity>
                        )}

                        {isJob && itemStatus === 'pending' && (
                          <TouchableOpacity
                            onPress={() => handleApproveJob(itemId, item.title)}
                            style={[styles.btnAction, styles.btnApprove]}
                          >
                            <Check size={14} color="#FFFFFF" />
                            <Text style={styles.btnActionText}>Approve Job</Text>
                          </TouchableOpacity>
                        )}

                        {isJob && itemStatus === 'pending' && (
                          <TouchableOpacity
                            onPress={() => handleRejectJob(itemId, item.title)}
                            style={[styles.btnAction, styles.btnReject]}
                          >
                            <X size={14} color="#EF4444" />
                            <Text style={[styles.btnActionText, { color: '#EF4444' }]}>Reject</Text>
                          </TouchableOpacity>
                        )}

                        {isBlog && itemStatus === 'pending' && (
                          <TouchableOpacity
                            onPress={() => handleApproveBlog(itemId, item.title)}
                            style={[styles.btnAction, styles.btnApprove]}
                          >
                            <Check size={14} color="#FFFFFF" />
                            <Text style={styles.btnActionText}>Publish Blog</Text>
                          </TouchableOpacity>
                        )}

                        {isBlog && itemStatus === 'pending' && (
                          <TouchableOpacity
                            onPress={() => handleRejectBlog(itemId, item.title)}
                            style={[styles.btnAction, styles.btnReject]}
                          >
                            <X size={14} color="#EF4444" />
                            <Text style={[styles.btnActionText, { color: '#EF4444' }]}>Reject</Text>
                          </TouchableOpacity>
                        )}

                        {isEvent && itemStatus === 'pending' && (
                          <TouchableOpacity
                            onPress={() => handleApproveEvent(itemId, item.title)}
                            style={[styles.btnAction, styles.btnApprove]}
                          >
                            <Check size={14} color="#FFFFFF" />
                            <Text style={styles.btnActionText}>Approve Event</Text>
                          </TouchableOpacity>
                        )}

                        {isEvent && itemStatus === 'pending' && (
                          <TouchableOpacity
                            onPress={() => handleRejectEvent(itemId, item.title)}
                            style={[styles.btnAction, styles.btnReject]}
                          >
                            <X size={14} color="#EF4444" />
                            <Text style={[styles.btnActionText, { color: '#EF4444' }]}>Reject</Text>
                          </TouchableOpacity>
                        )}

                        {isFeedback && itemStatus === 'pending' && (
                          <TouchableOpacity
                            onPress={() => handleResolveFeedback(itemId)}
                            style={[styles.btnAction, styles.btnApprove]}
                          >
                            <Check size={14} color="#FFFFFF" />
                            <Text style={styles.btnActionText}>Mark Resolved</Text>
                          </TouchableOpacity>
                        )}

                        {isForum && (
                          <View style={styles.forumActionsRow}>
                            <TouchableOpacity
                              onPress={() => handleTogglePinThread(itemId, item.isPinned)}
                              style={[
                                styles.btnForum,
                                item.isPinned && { backgroundColor: '#EFF6FF' },
                              ]}
                            >
                              <Pin size={13} color={item.isPinned ? '#2563EB' : '#64748B'} />
                              <Text style={styles.btnForumText}>
                                {item.isPinned ? 'Unpin' : 'Pin'}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => handleToggleLockThread(itemId, item.isLocked)}
                              style={[
                                styles.btnForum,
                                item.isLocked && { backgroundColor: '#FEF2F2' },
                              ]}
                            >
                              <Lock size={13} color={item.isLocked ? '#EF4444' : '#64748B'} />
                              <Text style={styles.btnForumText}>
                                {item.isLocked ? 'Unlock' : 'Lock'}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => handleDeleteThread(itemId)}
                              style={[styles.btnForum, { borderColor: '#FCA5A5' }]}
                            >
                              <Trash2 size={13} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitleBox: {
    flex: 1,
  },
  moduleBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#60A5FA',
    letterSpacing: 0.8,
  },
  headerTitleText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: 13,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButtonActive: {
    backgroundColor: '#2563EB',
  },
  tabButtonText: {
    fontSize: 12,
    color: '#BFDBFE',
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfoCol: {
    flex: 1,
    marginRight: 10,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  hubTypeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hubTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeApproved: {
    backgroundColor: '#DEF7EC',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadgeTextPending: {
    color: '#D97706',
  },
  statusBadgeTextApproved: {
    color: '#059669',
  },
  memberIdText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  btnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  btnApprove: {
    backgroundColor: '#10B981',
  },
  btnReject: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  btnActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  forumActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnForum: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnForumText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
