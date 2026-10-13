import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  RefreshControl,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  User,
  Calendar,
  Tag,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react-native';

import { apiClient, getCleanErrorMessage } from '../../src/api/client';

interface BlogData {
  _id: string;
  title: string;
  content?: string;
  body?: string;
  excerpt?: string;
  category?: string;
  status: 'pending' | 'published' | 'approved' | 'rejected';
  image?: string;
  coverImage?: string;
  createdAt: string;
  readTime?: number;
  tags?: string[];
  author?: {
    _id?: string;
    name?: string;
    email?: string;
    avatar?: string;
  };
}

export default function AdminBlogDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [blog, setBlog] = useState<BlogData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fetchBlog = useCallback(async () => {
    if (!id) return;
    try {
      setError('');
      const res = await apiClient.get<any>(`/admin/blogs/${id}`);
      const data = res.data?.data || res.data;
      setBlog(data);
    } catch (err: any) {
      console.error('Error fetching admin blog detail:', err);
      setError(getCleanErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBlog();
  }, [fetchBlog]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBlog();
  };

  const handleApprove = async () => {
    if (!id || !blog) return;
    Alert.alert(
      'Approve Blog',
      'Are you sure you want to approve this blog post for publication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await apiClient.post<any>(`/admin/blogs/approve/${id}`);
              const updated = res.data?.data || res.data;
              setBlog((prev) => (prev ? { ...prev, status: 'published', ...updated } : null));
              Alert.alert('Success', 'Blog post approved and published successfully!');
            } catch (err: any) {
              Alert.alert('Approval Failed', getCleanErrorMessage(err));
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!id || !blog) return;
    Alert.alert(
      'Reject Blog',
      'Are you sure you want to reject this blog post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await apiClient.post<any>(`/admin/blogs/reject/${id}`);
              const updated = res.data?.data || res.data;
              setBlog((prev) => (prev ? { ...prev, status: 'rejected', ...updated } : null));
              Alert.alert('Notice', 'Blog post has been rejected.');
            } catch (err: any) {
              Alert.alert('Rejection Failed', getCleanErrorMessage(err));
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
      case 'approved':
        return {
          bg: '#DCFCE7',
          color: '#15803D',
          border: '#BBF7D0',
          label: 'Approved',
        };
      case 'pending':
        return {
          bg: '#FEF3C7',
          color: '#B45309',
          border: '#FDE68A',
          label: 'Pending',
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
          border: '#CBD5E1',
          label: status,
        };
    }
  };

  if (loading && !blog) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingScreenText}>Loading blog details...</Text>
      </View>
    );
  }

  if (!blog) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Blog Details</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.notFoundBox}>
          <AlertCircle size={48} color="#EF4444" />
          <Text style={styles.notFoundTitle}>Blog post not found!</Text>
          <Text style={styles.notFoundDesc}>
            {error || 'The requested publication may have been removed or is unavailable.'}
          </Text>
          <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
            <Text style={styles.goBackBtnText}>Go Back to Blogs</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const badge = getStatusBadge(blog.status);
  const rawContent = blog.content || blog.body || '';
  const cleanContent = rawContent.replace(/<[^>]+>/g, '');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1929" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Blog Details</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {blog.title}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <RefreshCw size={18} color="#93C5FD" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0D9488"
            colors={['#0D9488']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Back Link */}
        <TouchableOpacity style={styles.backLinkRow} onPress={() => router.back()}>
          <ArrowLeft size={16} color="#5EEAD4" />
          <Text style={styles.backLinkText}>Back to Blogs List</Text>
        </TouchableOpacity>

        {/* Blog Header Card */}
        <View style={styles.headerCard}>
          {/* Title & Status Badge */}
          <View style={styles.cardTopRow}>
            <Text style={styles.blogTitle}>{blog.title}</Text>
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

          {/* Meta Info */}
          <View style={styles.metaWrap}>
            <View style={styles.metaItem}>
              <User size={15} color="#14B8A6" />
              <Text style={styles.metaText}>By {blog.author?.name || 'Unknown'}</Text>
            </View>

            <View style={styles.metaItem}>
              <Calendar size={15} color="#14B8A6" />
              <Text style={styles.metaText}>
                {blog.createdAt
                  ? new Date(blog.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </Text>
            </View>

            {blog.category ? (
              <View style={styles.metaItem}>
                <Tag size={15} color="#14B8A6" />
                <Text style={styles.metaText}>{blog.category}</Text>
              </View>
            ) : null}

            {blog.readTime ? (
              <View style={styles.metaItem}>
                <Clock size={15} color="#14B8A6" />
                <Text style={styles.metaText}>{blog.readTime} min read</Text>
              </View>
            ) : null}
          </View>

          {/* Pending Decision Buttons */}
          {blog.status === 'pending' && (
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.btnApprove, actionLoading && styles.btnDisabled]}
                onPress={handleApprove}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <CheckCircle size={18} color="#FFFFFF" />
                    <Text style={styles.btnApproveText}>Approve</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnReject, actionLoading && styles.btnDisabled]}
                onPress={handleReject}
                disabled={actionLoading}
              >
                <XCircle size={18} color="#FFFFFF" />
                <Text style={styles.btnRejectText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Approved Banner */}
          {(blog.status === 'published' || (blog.status as any) === 'approved') && (
            <View style={styles.approvedNoticeBox}>
              <CheckCircle size={18} color="#16A34A" />
              <Text style={styles.approvedNoticeText}>This blog has been approved and published</Text>
            </View>
          )}

          {/* Rejected Banner */}
          {blog.status === 'rejected' && (
            <View style={styles.rejectedNoticeBox}>
              <XCircle size={18} color="#DC2626" />
              <Text style={styles.rejectedNoticeText}>This blog has been rejected</Text>
            </View>
          )}
        </View>

        {/* Content Card */}
        <View style={styles.contentCard}>
          {/* Cover Image */}
          {(blog.image || blog.coverImage) && (
            <Image
              source={{ uri: blog.image || blog.coverImage }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          )}

          {/* Excerpt */}
          {blog.excerpt ? (
            <View style={styles.excerptBox}>
              <Text style={styles.excerptText}>"{blog.excerpt}"</Text>
            </View>
          ) : null}

          {/* Article Text */}
          <Text style={styles.contentHeading}>ARTICLE CONTENT</Text>
          <Text style={styles.contentText}>
            {cleanContent || 'No article content provided.'}
          </Text>
        </View>

        {/* Tags Card */}
        {blog.tags && blog.tags.length > 0 && (
          <View style={styles.tagsCard}>
            <Text style={styles.tagsTitle}>Tags</Text>
            <View style={styles.tagsRow}>
              {blog.tags.map((tag, index) => (
                <View key={index} style={styles.tagPill}>
                  <Text style={styles.tagPillText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  scrollContent: {
    padding: 16,
  },
  backLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  backLinkText: {
    color: '#5EEAD4',
    fontSize: 13,
    fontWeight: '700',
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
  notFoundBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 14,
  },
  notFoundDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  goBackBtn: {
    marginTop: 20,
    backgroundColor: '#0D9488',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  goBackBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  headerCard: {
    backgroundColor: '#0D2847',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.2)',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  blogTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 26,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  metaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12.5,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  btnApprove: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    height: 44,
    borderRadius: 12,
    gap: 8,
  },
  btnApproveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  btnReject: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    height: 44,
    borderRadius: 12,
    gap: 8,
  },
  btnRejectText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  approvedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22,163,74,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.3)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginTop: 6,
  },
  approvedNoticeText: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '700',
  },
  rejectedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220,38,38,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.3)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginTop: 6,
  },
  rejectedNoticeText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '700',
  },
  contentCard: {
    backgroundColor: '#0D2847',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    marginBottom: 16,
  },
  coverImage: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  excerptBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderLeftWidth: 3,
    borderLeftColor: '#14B8A6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  excerptText: {
    fontSize: 13.5,
    fontStyle: 'italic',
    color: '#94A3B8',
    lineHeight: 20,
  },
  contentHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5EEAD4',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  contentText: {
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 24,
  },
  tagsCard: {
    backgroundColor: '#0D2847',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
  },
  tagsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    backgroundColor: 'rgba(20,184,166,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagPillText: {
    color: '#5EEAD4',
    fontSize: 12,
    fontWeight: '700',
  },
});
