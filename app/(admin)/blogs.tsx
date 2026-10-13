import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  StatusBar,
  Platform,
  RefreshControl,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Search,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  Check,
  X,
  Tag,
  ChevronDown,
} from 'lucide-react-native';

import { apiClient, getCleanErrorMessage } from '../../src/api/client';

const CATEGORIES = [
  'All categories',
  'Software Engineering',
  'Civil Engineering',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Electronics Engineering',
  'Electronics and Telecommunications',
  'Instrumentation Engineering',
  'Chemical Engineering',
  'Computer Engineering',
  'Automobile Engineering',
  'Aeronautical Engineering',
  'Aerospace Engineering',
  'Petrochemical Engineering',
  'Polymer Engineering',
  'Agricultural Engineering',
  'Biomedical Engineering',
  'Industrial Engineering',
  'Production Engineering',
  'Mining Engineering',
  'Metallurgical Engineering',
  'Environmental Engineering',
  'Marine Engineering',
  'Textile Engineering',
  'Architecture',
  'Data Science and Engineering',
  'Artificial Intelligence & Machine Learning',
  'Robotics & Automation',
  'Cybersecurity Engineering',
  'Cloud Engineering',
  'Mechatronics Engineering',
  'Nuclear Engineering',
  'Materials Science and Engineering',
  'Systems Engineering',
  'Biotechnology Engineering',
  'Food Technology Engineering',
  'Geotechnical Engineering',
  'Safety Engineering',
  'Other',
];

interface BlogItem {
  _id: string;
  title: string;
  content?: string;
  category?: string;
  status: 'pending' | 'published' | 'approved' | 'rejected';
  image?: string;
  coverImage?: string;
  createdAt: string;
  author?: {
    _id?: string;
    name?: string;
    email?: string;
    avatar?: string;
  };
}

export default function AdminApproveBlogsScreen() {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All categories');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'all' | 'approved' | 'rejected'>('pending');

  // Modals
  const [categoryModalVisible, setCategoryModalVisible] = useState<boolean>(false);
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [selectedBlog, setSelectedBlog] = useState<BlogItem | null>(null);

  // 1. Fetch Blogs
  const fetchBlogs = useCallback(async () => {
    try {
      const res = await apiClient.get<any>('/admin/blogs');
      const data = res.data?.data || res.data || [];
      setBlogs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching blogs in mobile app:', err);
      Alert.alert('Fetch Error', getCleanErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBlogs();
  };

  // 2. Approve Blog
  const handleApprove = async (blogId: string) => {
    Alert.alert(
      'Approve Blog',
      'Are you sure you want to approve this blog post for publication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setActionLoadingId(blogId);
            try {
              const res = await apiClient.post<any>(`/admin/blogs/approve/${blogId}`);
              const updated = res.data?.data || res.data;
              setBlogs((prev) =>
                prev.map((b) => (b._id === blogId ? { ...b, status: 'published', ...updated } : b))
              );
              if (selectedBlog?._id === blogId) {
                setSelectedBlog((prev) => prev ? { ...prev, status: 'published', ...updated } : null);
              }
              Alert.alert('Success', 'Blog post approved and published!');
            } catch (err: any) {
              Alert.alert('Approval Failed', getCleanErrorMessage(err));
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  // 3. Reject Blog
  const handleReject = async (blogId: string) => {
    Alert.alert(
      'Reject Blog',
      'Are you sure you want to reject this blog post submission?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoadingId(blogId);
            try {
              const res = await apiClient.post<any>(`/admin/blogs/reject/${blogId}`);
              const updated = res.data?.data || res.data;
              setBlogs((prev) =>
                prev.map((b) => (b._id === blogId ? { ...b, status: 'rejected', ...updated } : b))
              );
              if (selectedBlog?._id === blogId) {
                setSelectedBlog((prev) => prev ? { ...prev, status: 'rejected', ...updated } : null);
              }
              Alert.alert('Notice', 'Blog post has been rejected.');
            } catch (err: any) {
              Alert.alert('Rejection Failed', getCleanErrorMessage(err));
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  // Filter Blogs
  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const title = blog.title || '';
      const authorName = blog.author?.name || '';
      const category = blog.category || '';

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        title.toLowerCase().includes(query) ||
        authorName.toLowerCase().includes(query) ||
        category.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === 'All categories' || blog.category === categoryFilter;

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'pending'
          ? blog.status === 'pending'
          : statusFilter === 'approved'
          ? blog.status === 'published' || (blog.status as any) === 'approved'
          : statusFilter === 'rejected'
          ? blog.status === 'rejected'
          : true;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [blogs, searchQuery, categoryFilter, statusFilter]);

  const pendingCount = useMemo(
    () => blogs.filter((b) => b.status === 'pending').length,
    [blogs]
  );
  const approvedCount = useMemo(
    () => blogs.filter((b) => b.status === 'published' || (b.status as any) === 'approved').length,
    [blogs]
  );
  const rejectedCount = useMemo(
    () => blogs.filter((b) => b.status === 'rejected').length,
    [blogs]
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          bg: '#FEF3C7',
          color: '#B45309',
          border: '#FDE68A',
          label: 'Pending',
        };
      case 'published':
      case 'approved':
        return {
          bg: '#DCFCE7',
          color: '#15803D',
          border: '#BBF7D0',
          label: 'Approved',
        };
      case 'rejected':
        return {
          bg: '#FEE2E2',
          color: '#B91C1C',
          border: '#FECACA',
          label: 'Rejected',
        };
      default:
        return {
          bg: '#F1F5F9',
          color: '#475569',
          border: '#E2E8F0',
          label: status,
        };
    }
  };

  const openBlogDetail = (blog: BlogItem) => {
    router.push({
      pathname: '/(admin)/blog-details',
      params: { id: blog._id },
    } as any);
  };

  if (loading && blogs.length === 0) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingScreenText}>Loading Submitted Blogs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1929" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Approve Blogs</Text>
          <Text style={styles.headerSubtitle}>
            {pendingCount} blog{pendingCount !== 1 ? 's' : ''} awaiting moderation
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <RefreshCw size={18} color="#93C5FD" />
        </TouchableOpacity>
      </View>

      {/* Sticky Filter Section */}
      <View style={styles.filterBar}>
        {/* Search Input */}
        <View style={styles.searchWrap}>
          <Search size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, author, category..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Picker Trigger */}
        <TouchableOpacity
          style={styles.categoryTrigger}
          onPress={() => setCategoryModalVisible(true)}
          activeOpacity={0.8}
        >
          <Tag size={14} color="#60A5FA" />
          <Text style={styles.categoryTriggerText} numberOfLines={1}>
            {categoryFilter}
          </Text>
          <ChevronDown size={14} color="#94A3B8" />
        </TouchableOpacity>

        {/* Status Chips Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusChipsRow}
        >
          <TouchableOpacity
            style={[
              styles.statusChip,
              statusFilter === 'pending' && styles.statusChipActivePending,
            ]}
            onPress={() => setStatusFilter('pending')}
          >
            <Clock size={12} color={statusFilter === 'pending' ? '#FFFFFF' : '#F59E0B'} />
            <Text
              style={[
                styles.statusChipText,
                statusFilter === 'pending' && styles.statusChipTextActive,
              ]}
            >
              Pending ({pendingCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusChip,
              statusFilter === 'all' && styles.statusChipActiveAll,
            ]}
            onPress={() => setStatusFilter('all')}
          >
            <FileText size={12} color={statusFilter === 'all' ? '#FFFFFF' : '#93C5FD'} />
            <Text
              style={[
                styles.statusChipText,
                statusFilter === 'all' && styles.statusChipTextActive,
              ]}
            >
              All ({blogs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusChip,
              statusFilter === 'approved' && styles.statusChipActiveApproved,
            ]}
            onPress={() => setStatusFilter('approved')}
          >
            <CheckCircle size={12} color={statusFilter === 'approved' ? '#FFFFFF' : '#10B981'} />
            <Text
              style={[
                styles.statusChipText,
                statusFilter === 'approved' && styles.statusChipTextActive,
              ]}
            >
              Approved ({approvedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusChip,
              statusFilter === 'rejected' && styles.statusChipActiveRejected,
            ]}
            onPress={() => setStatusFilter('rejected')}
          >
            <XCircle size={12} color={statusFilter === 'rejected' ? '#FFFFFF' : '#EF4444'} />
            <Text
              style={[
                styles.statusChipText,
                statusFilter === 'rejected' && styles.statusChipTextActive,
              ]}
            >
              Rejected ({rejectedCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredBlogs.length === 0 ? (
          <View style={styles.emptyWrap}>
            <FileText size={48} color="#475569" />
            <Text style={styles.emptyTitle}>No blogs found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || categoryFilter !== 'All categories' || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or category filter.'
                : 'No blog posts have been submitted yet.'}
            </Text>
          </View>
        ) : (
          filteredBlogs.map((blog) => {
            const badge = getStatusBadge(blog.status);
            const isActionLoading = actionLoadingId === blog._id;

            return (
              <TouchableOpacity
                key={blog._id}
                style={styles.blogCard}
                onPress={() => openBlogDetail(blog)}
                activeOpacity={0.9}
              >
                {/* Header Row: Category & Status Badge */}
                <View style={styles.cardTopRow}>
                  <View style={styles.categoryPill}>
                    <Tag size={11} color="#60A5FA" />
                    <Text style={styles.categoryPillText} numberOfLines={1}>
                      {blog.category || 'General'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: badge.bg, borderColor: badge.border },
                    ]}
                  >
                    <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                {/* Blog Title */}
                <Text style={styles.blogTitle} numberOfLines={2}>
                  {blog.title}
                </Text>

                {/* Excerpt if present */}
                {blog.content ? (
                  <Text style={styles.blogExcerpt} numberOfLines={2}>
                    {blog.content.replace(/<[^>]+>/g, '')}
                  </Text>
                ) : null}

                {/* Meta Information: Author & Date */}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <User size={13} color="#94A3B8" />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {blog.author?.name || 'Unknown Author'}
                    </Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Calendar size={13} color="#94A3B8" />
                    <Text style={styles.metaText}>
                      {blog.createdAt
                        ? new Date(blog.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Recent'}
                    </Text>
                  </View>
                </View>

                {/* Actions Row */}
                <View style={styles.actionRow}>
                  {blog.status === 'pending' ? (
                    <>
                      <TouchableOpacity
                        style={[styles.btnApprove, isActionLoading && styles.btnDisabled]}
                        onPress={() => handleApprove(blog._id)}
                        disabled={isActionLoading}
                      >
                        {isActionLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Check size={14} color="#FFFFFF" />
                            <Text style={styles.btnApproveText}>Approve</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.btnReject, isActionLoading && styles.btnDisabled]}
                        onPress={() => handleReject(blog._id)}
                        disabled={isActionLoading}
                      >
                        <X size={14} color="#FFFFFF" />
                        <Text style={styles.btnRejectText}>Reject</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.btnDetails}
                        onPress={() => openBlogDetail(blog)}
                      >
                        <Eye size={14} color="#93C5FD" />
                        <Text style={styles.btnDetailsText}>Preview</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.btnFullDetails}
                      onPress={() => openBlogDetail(blog)}
                    >
                      <Eye size={14} color="#60A5FA" />
                      <Text style={styles.btnFullDetailsText}>View Full Blog Post</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Category Picker Modal */}
      <Modal
        visible={categoryModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.categoryModalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Filter by Category</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={true}>
              {CATEGORIES.map((cat, idx) => {
                const isSelected = categoryFilter === cat;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.categoryOption,
                      isSelected && styles.categoryOptionSelected,
                    ]}
                    onPress={() => {
                      setCategoryFilter(cat);
                      setCategoryModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        isSelected && styles.categoryOptionTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                    {isSelected && <Check size={16} color="#3B82F6" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Blog Detail / Full Preview Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.detailModalBox}>
            {/* Header */}
            <View style={styles.detailHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailHeaderTitle}>Blog Post Review</Text>
                <Text style={styles.detailHeaderSub}>Review submitted content before decision</Text>
              </View>
              <TouchableOpacity
                onPress={() => setDetailModalVisible(false)}
                style={styles.modalCloseCircle}
              >
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {selectedBlog && (
              <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
                {/* Status and Category Badges */}
                <View style={styles.detailBadgeRow}>
                  <View style={styles.categoryPill}>
                    <Tag size={12} color="#60A5FA" />
                    <Text style={styles.categoryPillText}>
                      {selectedBlog.category || 'General'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getStatusBadge(selectedBlog.status).bg,
                        borderColor: getStatusBadge(selectedBlog.status).border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: getStatusBadge(selectedBlog.status).color },
                      ]}
                    >
                      {getStatusBadge(selectedBlog.status).label}
                    </Text>
                  </View>
                </View>

                {/* Title */}
                <Text style={styles.detailTitle}>{selectedBlog.title}</Text>

                {/* Author Info Card */}
                <View style={styles.authorCard}>
                  <View style={styles.authorAvatar}>
                    <Text style={styles.authorAvatarText}>
                      {(selectedBlog.author?.name || 'A').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.authorName}>{selectedBlog.author?.name || 'Unknown Author'}</Text>
                    <Text style={styles.authorEmail}>{selectedBlog.author?.email || 'N/A'}</Text>
                  </View>
                  <Text style={styles.authorDate}>
                    {selectedBlog.createdAt
                      ? new Date(selectedBlog.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : ''}
                  </Text>
                </View>

                {/* Cover Image */}
                {(selectedBlog.coverImage || selectedBlog.image) && (
                  <Image
                    source={{ uri: selectedBlog.coverImage || selectedBlog.image }}
                    style={styles.detailCoverImage}
                    resizeMode="cover"
                  />
                )}

                {/* Content */}
                <Text style={styles.contentSectionHeading}>ARTICLE CONTENT</Text>
                <View style={styles.contentContainer}>
                  <Text style={styles.detailContentText}>
                    {selectedBlog.content
                      ? selectedBlog.content.replace(/<[^>]+>/g, '')
                      : 'No detailed content provided.'}
                  </Text>
                </View>

                {/* Actions inside Modal if pending */}
                {selectedBlog.status === 'pending' && (
                  <View style={styles.modalActionRow}>
                    <TouchableOpacity
                      style={styles.modalApproveBtn}
                      onPress={() => {
                        handleApprove(selectedBlog._id);
                      }}
                    >
                      <Check size={16} color="#FFFFFF" />
                      <Text style={styles.modalApproveBtnText}>Approve & Publish</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalRejectBtn}
                      onPress={() => {
                        handleReject(selectedBlog._id);
                      }}
                    >
                      <X size={16} color="#FFFFFF" />
                      <Text style={styles.modalRejectBtnText}>Reject Blog</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={{ height: 30 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1929',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0A1929',
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#93C5FD',
    marginTop: 1,
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  filterBar: {
    backgroundColor: '#0D2847',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  categoryTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 38,
    gap: 8,
  },
  categoryTriggerText: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 12.5,
    fontWeight: '600',
  },
  statusChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  statusChipActivePending: {
    backgroundColor: '#D97706',
    borderColor: '#F59E0B',
  },
  statusChipActiveAll: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  statusChipActiveApproved: {
    backgroundColor: '#16A34A',
    borderColor: '#22C55E',
  },
  statusChipActiveRejected: {
    backgroundColor: '#DC2626',
    borderColor: '#EF4444',
  },
  statusChipTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#0A1929',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingScreenText: {
    marginTop: 12,
    color: '#93C5FD',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  blogCard: {
    backgroundColor: '#0D2847',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 5,
    maxWidth: '65%',
  },
  categoryPillText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  blogTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 6,
  },
  blogExcerpt: {
    fontSize: 12.5,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnApprove: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    height: 36,
    borderRadius: 10,
    gap: 6,
  },
  btnApproveText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  btnReject: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    height: 36,
    borderRadius: 10,
    gap: 6,
  },
  btnRejectText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  btnDetails: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  btnDetailsText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '700',
  },
  btnFullDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    height: 38,
    borderRadius: 10,
    gap: 6,
  },
  btnFullDetailsText: {
    color: '#93C5FD',
    fontSize: 13,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  categoryModalBox: {
    backgroundColor: '#0F233B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    marginBottom: 8,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  categoryOptionSelected: {
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderRadius: 8,
  },
  categoryOptionText: {
    fontSize: 13.5,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  categoryOptionTextSelected: {
    color: '#60A5FA',
    fontWeight: '800',
  },
  detailModalBox: {
    backgroundColor: '#0F233B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  detailHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  detailHeaderSub: {
    fontSize: 11.5,
    color: '#93C5FD',
    marginTop: 2,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailBody: {
    padding: 18,
  },
  detailBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 26,
    marginBottom: 14,
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    gap: 10,
  },
  authorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorAvatarText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '900',
  },
  authorName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  authorEmail: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  authorDate: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  detailCoverImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  contentSectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  contentContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  detailContentText: {
    fontSize: 13.5,
    color: '#E2E8F0',
    lineHeight: 22,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalApproveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    height: 46,
    borderRadius: 12,
    gap: 8,
  },
  modalApproveBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  modalRejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    height: 46,
    borderRadius: 12,
    gap: 8,
  },
  modalRejectBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
});
