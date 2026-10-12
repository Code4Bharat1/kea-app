import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Share,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import { Loader } from '../../src/components/common/Loader';
import { Toast } from '../../src/components/common/Toast';
import { forumsApi } from '../../src/api/forums.api';
import { ForumThread, ForumComment } from '../../src/types';
import { useAuth } from '../../src/context/AuthContext';
import {
  ArrowLeft,
  MessageSquare,
  Eye,
  ThumbsUp,
  Share2,
  Pin,
  Lock,
  User,
  Clock,
  MoreVertical,
  Send,
  Heart,
  ChevronRight,
  BookOpen,
} from 'lucide-react-native';

export default function ThreadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [thread, setThread] = useState<ForumThread | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [relatedThreads, setRelatedThreads] = useState<ForumThread[]>([]);

  const [toastConfig, setToastConfig] = useState<{
    visible: boolean;
    message: string;
    type?: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastConfig({ visible: true, message, type });
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

  const fetchThreadDetail = useCallback(async () => {
    if (!id) return;
    try {
      const data = await forumsApi.getThreadById(id);
      setThread(data);
      setLikesCount(data.likesCount || data.likes?.length || 0);
      setIsLiked(!!data.isLiked);
    } catch (error) {
      console.error('Error fetching thread detail:', error);
      showToast('Failed to load thread details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchRelatedThreads = useCallback(async () => {
    if (!id) return;
    try {
      const data = await forumsApi.getThreads({ limit: 5 });
      const filtered = (data.threads || []).filter((t) => t._id !== id);
      setRelatedThreads(filtered);
    } catch (error) {
      console.error('Error fetching related threads:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchThreadDetail();
    fetchRelatedThreads();
  }, [fetchThreadDetail, fetchRelatedThreads]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchThreadDetail(), fetchRelatedThreads()]);
    setRefreshing(false);
  };

  const handleToggleLike = async () => {
    if (!thread) return;
    try {
      if (isLiked) {
        await forumsApi.unlikeThread(thread._id);
        setIsLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        await forumsApi.likeThread(thread._id);
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (error) {
      showToast('Failed to update like', 'error');
    }
  };

  const handleShare = async () => {
    if (!thread) return;
    try {
      await Share.share({
        title: thread.title,
        message: `Check out this engineering discussion on KEA Forums: "${thread.title}"`,
      });
    } catch (error) {
      console.error('Error sharing thread:', error);
    }
  };

  const handlePostReply = async () => {
    if (!thread || !replyText.trim()) return;
    setSubmitting(true);
    try {
      await forumsApi.addReply(thread._id, replyText.trim());
      setReplyText('');
      showToast('Reply posted successfully!', 'success');
      fetchThreadDetail();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to post reply';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeReply = async (replyId: string) => {
    if (!thread) return;
    try {
      await forumsApi.likeReply(thread._id, replyId);
      showToast('Liked reply!', 'success');
      fetchThreadDetail();
    } catch (error) {
      showToast('Failed to like reply', 'error');
    }
  };

  if (loading) {
    return <Loader message="Loading thread..." fullScreen />;
  }

  if (!thread) {
    return (
      <View style={styles.container}>
        <Header title="Thread Detail" showBack />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Thread not found or has been removed.</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.replace('/community' as any)}
          >
            <Text style={styles.backBtnText}>Back to Forums</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const authorName =
    typeof thread.author === 'string'
      ? thread.author
      : thread.author?.name || 'KEA Member';
  const authorHeadline =
    typeof thread.author === 'object' && (thread.author as any)?.profile?.headline
      ? (thread.author as any).profile.headline
      : 'Engineering Member';

  const repliesList: ForumComment[] = thread.replies || thread.comments || [];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Header title="Community Forum" showBack showNotif />

      <Toast
        visible={toastConfig.visible}
        message={toastConfig.message}
        type={toastConfig.type}
        onDismiss={() => setToastConfig({ ...toastConfig, visible: false })}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Navigation Bar */}
        <TouchableOpacity
          style={styles.backNavRow}
          onPress={() => router.back()}
        >
          <ArrowLeft size={18} color={Colors.textSecondary} />
          <Text style={styles.backNavText}>Back to Forums</Text>
        </TouchableOpacity>

        {/* Main Thread Details Card */}
        <Card style={styles.threadCard}>
          {/* Category & Tags Header */}
          <View style={styles.metaRow}>
            {thread.category && <Badge label={thread.category} variant="primary" />}
            {thread.tags?.map((tag, idx) => (
              <View key={idx} style={styles.tagChip}>
                <Text style={styles.tagChipText}>#{tag}</Text>
              </View>
            ))}
          </View>

          {/* Title Row with Pinned / Locked Indicators */}
          <View style={styles.titleRow}>
            {thread.isPinned && <Pin size={20} color={Colors.primary} style={styles.statusIcon} />}
            {thread.isLocked && <Lock size={20} color="#6B7280" style={styles.statusIcon} />}
            <Text style={styles.threadTitle}>{thread.title}</Text>
          </View>

          {/* Author info & Created / View stats */}
          <View style={styles.authorMetaRow}>
            <View style={styles.authorGroup}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarText}>{authorName.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.authorName}>{authorName}</Text>
                <Text style={styles.authorSub}>{authorHeadline}</Text>
              </View>
            </View>

            <View style={styles.metaRight}>
              <View style={styles.iconMeta}>
                <Clock size={13} color={Colors.textMuted} />
                <Text style={styles.metaText}>
                  {thread.createdAt
                    ? new Date(thread.createdAt).toLocaleDateString('en-IN')
                    : 'Recently'}
                </Text>
              </View>
              <View style={styles.iconMeta}>
                <Eye size={13} color={Colors.textMuted} />
                <Text style={styles.metaText}>{thread.views || 0} views</Text>
              </View>
            </View>
          </View>

          {/* Content Body */}
          <Text style={styles.threadBody}>{thread.content}</Text>

          {/* Action Row (Like & Share) */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, isLiked && styles.actionBtnActive]}
              onPress={handleToggleLike}
            >
              <Heart
                size={16}
                color={isLiked ? Colors.danger : Colors.textSecondary}
                fill={isLiked ? Colors.danger : 'none'}
              />
              <Text style={[styles.actionBtnText, isLiked && styles.actionBtnTextActive]}>
                {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Share2 size={16} color={Colors.textSecondary} />
              <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Replies Section */}
        <View style={styles.repliesSection}>
          <Text style={styles.repliesHeaderTitle}>
            Replies ({repliesList.length})
          </Text>

          {repliesList.length === 0 ? (
            <View style={styles.emptyRepliesBox}>
              <MessageSquare size={32} color={Colors.textMuted} />
              <Text style={styles.emptyRepliesText}>
                No replies yet. Be the first to start the discussion!
              </Text>
            </View>
          ) : (
            repliesList.map((rep: any, idx: number) => {
              const repAuthor =
                typeof rep.author === 'string'
                  ? rep.author
                  : rep.author?.name ||
                    (typeof rep.user === 'string' ? rep.user : rep.user?.name) ||
                    'Anonymous';

              const repLikes = rep.likes?.length || 0;

              return (
                <Card key={rep._id || idx.toString()} style={styles.replyCard}>
                  <View style={styles.replyHeader}>
                    <View style={styles.replyAuthorGroup}>
                      <View style={styles.replyAvatar}>
                        <Text style={styles.replyAvatarText}>{repAuthor.charAt(0)}</Text>
                      </View>
                      <View>
                        <Text style={styles.replyAuthorName}>{repAuthor}</Text>
                        <Text style={styles.replyTimeText}>{getTimeAgo(rep.createdAt)}</Text>
                      </View>
                    </View>

                    <TouchableOpacity style={styles.moreBtn}>
                      <MoreVertical size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.replyBody}>{rep.content}</Text>

                  <View style={styles.replyFooter}>
                    <TouchableOpacity
                      style={styles.replyLikeBtn}
                      onPress={() => handleLikeReply(rep._id)}
                    >
                      <ThumbsUp size={14} color={Colors.primary} />
                      <Text style={styles.replyLikeText}>{repLikes} Likes</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })
          )}

          {/* Add Reply Form or Locked Notice */}
          {!thread.isLocked ? (
            <Card style={styles.addReplyCard}>
              <Text style={styles.addReplyTitle}>Add your reply</Text>
              <TextInput
                style={styles.replyTextArea}
                placeholder="Write your answer, share references or engineering insights..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={replyText}
                onChangeText={setReplyText}
              />
              <View style={styles.replyFormFooter}>
                <Text style={styles.replyGuideText}>
                  Keep discussion professional and relevant to KEA guidelines.
                </Text>
                <TouchableOpacity
                  style={[styles.postReplyBtn, (!replyText.trim() || submitting) && styles.btnDisabled]}
                  disabled={!replyText.trim() || submitting}
                  onPress={handlePostReply}
                >
                  <Send size={14} color="#FFFFFF" />
                  <Text style={styles.postReplyBtnText}>
                    {submitting ? 'Posting...' : 'Post reply'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          ) : (
            <View style={styles.lockedNoticeBox}>
              <Lock size={20} color="#CA8A04" />
              <Text style={styles.lockedNoticeText}>
                This thread has been locked and no longer accepts new replies.
              </Text>
            </View>
          )}
        </View>

        {/* Sidebar Info Section */}
        <View style={styles.infoSection}>
          {/* Thread Info Card */}
          <Card style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Thread info</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Category:</Text>
              <Text style={styles.infoValue}>{thread.category || 'General'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created:</Text>
              <Text style={styles.infoValue}>
                {thread.createdAt
                  ? new Date(thread.createdAt).toLocaleDateString('en-IN')
                  : 'N/A'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last activity:</Text>
              <Text style={styles.infoValue}>
                {getTimeAgo(thread.lastActivity || thread.createdAt)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Views:</Text>
              <Text style={styles.infoValue}>{thread.views || 0}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Replies:</Text>
              <Text style={styles.infoValue}>{repliesList.length}</Text>
            </View>
          </Card>

          {/* Related Threads */}
          {relatedThreads.length > 0 && (
            <Card style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Related threads</Text>
              {relatedThreads.map((relThread) => (
                <TouchableOpacity
                  key={relThread._id}
                  style={styles.relatedThreadItem}
                  onPress={() => router.push(`/community/${relThread._id}` as any)}
                >
                  <Text style={styles.relatedTitle} numberOfLines={2}>
                    {relThread.title}
                  </Text>
                  <View style={styles.relatedMeta}>
                    <Text style={styles.relatedCat}>{relThread.category}</Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={styles.relatedReplies}>
                      {(relThread.replies?.length || relThread.commentsCount || 0)} replies
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          )}

          {/* Resources & Help Card */}
          <View style={styles.proTipCard}>
            <BookOpen size={20} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.proTipTitle}>Engineers Knowledge Base</Text>
              <Text style={styles.proTipSubtitle}>
                Access engineering design standards, code references & guides.
              </Text>
              <TouchableOpacity onPress={() => router.push('/knowledge' as any)}>
                <Text style={styles.proTipLink}>View all resources →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  backNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  backNavText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  notFoundContainer: {
    padding: 32,
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 15,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  threadCard: {
    marginBottom: 16,
    padding: 16,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tagChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagChipText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusIcon: {
    marginRight: 6,
    marginTop: 4,
  },
  threadTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  authorMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  authorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  authorSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  metaRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  iconMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  threadBody: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 23,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionBtnActive: {
    backgroundColor: '#FEE2E2',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  actionBtnTextActive: {
    color: Colors.danger,
  },
  repliesSection: {
    marginBottom: 20,
  },
  repliesHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  emptyRepliesBox: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyRepliesText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  replyCard: {
    marginBottom: 12,
    padding: 14,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyAuthorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyAvatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  replyAuthorName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  replyTimeText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  moreBtn: {
    padding: 4,
  },
  replyBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  replyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  replyLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  replyLikeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  addReplyCard: {
    padding: 16,
    marginTop: 8,
  },
  addReplyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  replyTextArea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    height: 100,
    marginBottom: 10,
  },
  replyFormFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  replyGuideText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textMuted,
  },
  postReplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  postReplyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  lockedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE047',
    padding: 14,
    borderRadius: 10,
    gap: 10,
    marginTop: 8,
  },
  lockedNoticeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#854D0E',
  },
  infoSection: {
    gap: 12,
    marginTop: 12,
  },
  infoCard: {
    padding: 16,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  relatedThreadItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  relatedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  relatedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  relatedCat: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  dotSeparator: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  relatedReplies: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  proTipCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  proTipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  proTipSubtitle: {
    fontSize: 12,
    color: '#1E3A8A',
    marginBottom: 8,
    lineHeight: 16,
  },
  proTipLink: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});

