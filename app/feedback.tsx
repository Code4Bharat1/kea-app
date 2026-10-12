import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  Modal,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Header } from '../src/components/common/Header';
import { feedbackApi, FeedbackItem, FeedbackStats } from '../src/api/feedback.api';
import { Colors } from '../src/constants/theme';
import {
  Send,
  Star,
  Clock,
  AlertCircle,
  CheckCircle,
  Trash2,
  MessageSquare,
  ChevronDown,
  Check,
  RotateCcw,
  Tag,
  Flag,
  UserX,
  FileQuestion,
  HelpCircle,
} from 'lucide-react-native';

const CATEGORIES = [
  'Bug Report',
  'Feature Request',
  'General Feedback',
  'Complaint',
  'Suggestion',
  'Other',
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const RATING_LABELS: Record<number, string> = {
  1: '1/5 - Poor',
  2: '2/5 - Fair',
  3: '3/5 - Good',
  4: '4/5 - Very Good',
  5: '5/5 - Excellent!',
};

export default function FeedbackScreen() {
  const params = useLocalSearchParams();

  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Stats
  const [stats, setStats] = useState<FeedbackStats>({
    total: 0,
    pending: 0,
    'in-progress': 0,
    resolved: 0,
  });

  // History
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);

  // Form State
  const [category, setCategory] = useState<string>(
    typeof params.category === 'string' ? params.category : ''
  );
  const [priority, setPriority] = useState<string>('Medium');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

  // Dropdown Modals
  const [categoryModalVisible, setCategoryModalVisible] = useState<boolean>(false);
  const [priorityModalVisible, setPriorityModalVisible] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, feedbackData] = await Promise.all([
        feedbackApi.getStats(),
        feedbackApi.getFeedbacks(1, 20),
      ]);
      setStats(statsData);
      setFeedbacks(feedbackData.feedbacks || []);
    } catch (err: any) {
      console.warn('Feedback loading error:', err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleClear = () => {
    setCategory('');
    setPriority('Medium');
    setSubject('');
    setMessage('');
    setRating(0);
    setIsAnonymous(false);
  };

  const handleSubmit = async () => {
    if (!category.trim()) {
      showAlert('Category Required', 'Please select a category for your feedback.');
      return;
    }
    if (!subject.trim()) {
      showAlert('Subject Required', 'Please enter a brief subject.');
      return;
    }
    if (!message.trim()) {
      showAlert('Message Required', 'Please provide detailed feedback in the message box.');
      return;
    }

    try {
      setSubmitting(true);
      const result = await feedbackApi.submitFeedback({
        category,
        priority,
        subject: subject.trim(),
        message: message.trim(),
        rating: rating > 0 ? rating : undefined,
        isAnonymous,
      });

      showAlert('Success', result.message || 'Feedback submitted successfully!');
      handleClear();
      setActiveTab('history');
      await loadData();
    } catch (err: any) {
      showAlert('Error', err?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    const confirmDelete = async () => {
      try {
        await feedbackApi.deleteFeedback(id);
        showAlert('Deleted', 'Feedback deleted successfully');
        await loadData();
      } catch (err: any) {
        showAlert('Error', err?.message || 'Failed to delete feedback');
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to delete this feedback?')) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Delete Feedback',
        'Are you sure you want to delete this feedback?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const getTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${Math.max(seconds, 1)}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: '#FEF9C3', text: '#854D0E', border: '#FEF08A' };
      case 'in-progress':
        return { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' };
      case 'resolved':
        return { bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' };
      case 'closed':
        return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };
      default:
        return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={12} color="#854D0E" />;
      case 'in-progress':
        return <AlertCircle size={12} color="#1E40AF" />;
      case 'resolved':
        return <CheckCircle size={12} color="#166534" />;
      case 'closed':
        return <CheckCircle size={12} color="#475569" />;
      default:
        return <Clock size={12} color="#854D0E" />;
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Feedback & Support" showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        scrollEventThrottle={16}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Standardized Title Card */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Feedback & Support</Text>
          <Text style={styles.pageSubtitle}>
            Share your thoughts or report issues to help us improve
          </Text>
        </View>

        {/* 4 Stats Cards Grid - Clean, Standardized 2x2 Layout */}
        <View style={styles.statsGrid}>
          {/* Card 1: Total Feedback */}
          <View style={[styles.statCard, styles.statCardTotal]}>
            <View style={styles.statCardTopRow}>
              <Text style={styles.statLabelTotal}>Total Feedback</Text>
              <View style={[styles.statIconBadge, { backgroundColor: '#F1F5F9' }]}>
                <MessageSquare size={14} color="#475569" />
              </View>
            </View>
            <Text style={styles.statValueTotal}>{stats.total ?? 0}</Text>
          </View>

          {/* Card 2: Pending */}
          <View style={[styles.statCard, styles.statCardPending]}>
            <View style={styles.statCardTopRow}>
              <Text style={styles.statLabelPending}>Pending</Text>
              <View style={[styles.statIconBadge, { backgroundColor: '#FEF08A' }]}>
                <Clock size={14} color="#854D0E" />
              </View>
            </View>
            <Text style={styles.statValuePending}>{stats.pending ?? 0}</Text>
          </View>

          {/* Card 3: In Progress */}
          <View style={[styles.statCard, styles.statCardProgress]}>
            <View style={styles.statCardTopRow}>
              <Text style={styles.statLabelProgress}>In Progress</Text>
              <View style={[styles.statIconBadge, { backgroundColor: '#BFDBFE' }]}>
                <AlertCircle size={14} color="#1E40AF" />
              </View>
            </View>
            <Text style={styles.statValueProgress}>{stats['in-progress'] ?? 0}</Text>
          </View>

          {/* Card 4: Resolved */}
          <View style={[styles.statCard, styles.statCardResolved]}>
            <View style={styles.statCardTopRow}>
              <Text style={styles.statLabelResolved}>Resolved</Text>
              <View style={[styles.statIconBadge, { backgroundColor: '#BBF7D0' }]}>
                <CheckCircle size={14} color="#166534" />
              </View>
            </View>
            <Text style={styles.statValueResolved}>{stats.resolved ?? 0}</Text>
          </View>
        </View>

        {/* Standardized Card Container */}
        <View style={styles.mainCard}>
          {/* Tabs Bar */}
          <View style={styles.tabsHeader}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'submit' && styles.tabButtonActive]}
              onPress={() => setActiveTab('submit')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'submit' && styles.tabTextActive]}>
                Submit Feedback
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
              onPress={() => setActiveTab('history')}
              activeOpacity={0.7}
            >
              <View style={styles.tabTextWithBadge}>
                <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
                  Feedback History
                </Text>
                {feedbacks.length > 0 && (
                  <View
                    style={[
                      styles.tabBadge,
                      activeTab === 'history' ? styles.tabBadgeActive : styles.tabBadgeInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        activeTab === 'history' ? styles.tabBadgeTextActive : styles.tabBadgeTextInactive,
                      ]}
                    >
                      {feedbacks.length}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* TAB 1: SUBMIT FEEDBACK */}
          {activeTab === 'submit' && (
            <View style={styles.formContainer}>
              {/* Category & Priority Dropdown Row */}
              <View style={styles.dropdownRow}>
                {/* Category Dropdown */}
                <View style={styles.dropdownCol}>
                  <Text style={styles.inputLabel}>
                    Category <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setCategoryModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dropdownSelectedText,
                        !category && styles.dropdownPlaceholderText,
                      ]}
                      numberOfLines={1}
                    >
                      {category || 'Select category'}
                    </Text>
                    <ChevronDown size={17} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Priority Dropdown */}
                <View style={styles.dropdownCol}>
                  <Text style={styles.inputLabel}>Priority</Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setPriorityModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dropdownSelectedText} numberOfLines={1}>
                      {priority}
                    </Text>
                    <ChevronDown size={17} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Subject Input */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>
                  Subject <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Brief description of your feedback"
                  placeholderTextColor="#94A3B8"
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>

              {/* Message Input */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>
                  Message <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Provide detailed feedback or describe the issue..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  value={message}
                  onChangeText={setMessage}
                />
              </View>

              {/* Rate Your Experience (Optional) */}
              <View style={styles.formGroup}>
                <View style={styles.ratingHeaderRow}>
                  <Text style={styles.inputLabel}>Rate your experience (optional)</Text>
                  {rating > 0 && (
                    <Text style={styles.ratingLabelText}>{RATING_LABELS[rating]}</Text>
                  )}
                </View>
                <View style={styles.ratingStarsRow}>
                  {[1, 2, 3, 4, 5].map((starIndex) => (
                    <TouchableOpacity
                      key={starIndex}
                      onPress={() => setRating(rating === starIndex ? 0 : starIndex)}
                      activeOpacity={0.7}
                      style={styles.starTouchArea}
                    >
                      <Star
                        size={29}
                        color={starIndex <= rating ? '#F59E0B' : '#CBD5E1'}
                        fill={starIndex <= rating ? '#F59E0B' : 'transparent'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Submit Anonymously Checkbox */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setIsAnonymous(!isAnonymous)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkboxBox, isAnonymous && styles.checkboxBoxChecked]}>
                  {isAnonymous && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={styles.checkboxLabel}>Submit anonymously</Text>
              </TouchableOpacity>

              {/* Action Buttons: Clear & Submit Feedback */}
              <View style={styles.formActionButtonsRow}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClear}
                  activeOpacity={0.7}
                >
                  <RotateCcw size={14} color="#475569" style={{ marginRight: 6 }} />
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Send size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.submitButtonText}>Submit Feedback</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TAB 2: FEEDBACK HISTORY */}
          {activeTab === 'history' && (
            <View style={styles.historyContainer}>
              {loading && feedbacks.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                </View>
              ) : feedbacks.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <MessageSquare size={32} color="#94A3B8" />
                  </View>
                  <Text style={styles.emptyTitle}>No feedback submitted yet</Text>
                  <Text style={styles.emptySub}>
                    Your submitted inquiries and responses will appear here.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyActionBtn}
                    onPress={() => setActiveTab('submit')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.emptyActionBtnText}>Submit Your First Feedback</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.feedbackList}>
                  {feedbacks.map((item) => {
                    const statusConfig = getStatusColor(item.status);
                    return (
                      <View key={item._id} style={styles.feedbackCard}>
                        {/* Header: Title + Status + Delete */}
                        <View style={styles.feedbackCardHeader}>
                          <View style={{ flex: 1, marginRight: 8 }}>
                            <View style={styles.feedbackTitleRow}>
                              <Text style={styles.feedbackSubject} numberOfLines={2}>
                                {item.subject}
                              </Text>
                              <View
                                style={[
                                  styles.statusBadge,
                                  {
                                    backgroundColor: statusConfig.bg,
                                    borderColor: statusConfig.border,
                                  },
                                ]}
                              >
                                {getStatusIcon(item.status)}
                                <Text
                                  style={[
                                    styles.statusBadgeText,
                                    { color: statusConfig.text },
                                  ]}
                                >
                                  {item.status.replace('-', ' ')}
                                </Text>
                              </View>
                            </View>

                            {/* Tags: Category, Priority, Date, Rating */}
                            <View style={styles.feedbackMetaRow}>
                              <View style={styles.metaChip}>
                                <Text style={styles.metaChipText}>{item.category}</Text>
                              </View>
                              <View style={styles.metaChip}>
                                <Text style={styles.metaChipText}>{item.priority}</Text>
                              </View>
                              <Text style={styles.metaDateText}>
                                {getTimeAgo(item.createdAt)}
                              </Text>
                              {typeof item.rating === 'number' && item.rating > 0 && (
                                <View style={styles.starRatingBadge}>
                                  <Star size={11} color="#D97706" fill="#F59E0B" />
                                  <Text style={styles.starRatingText}>{item.rating}/5</Text>
                                </View>
                              )}
                            </View>
                          </View>

                          <TouchableOpacity
                            style={styles.trashBtn}
                            onPress={() => handleDelete(item._id)}
                            activeOpacity={0.7}
                          >
                            <Trash2 size={16} color="#DC2626" />
                          </TouchableOpacity>
                        </View>

                        {/* Feedback Message */}
                        <Text style={styles.feedbackBodyMessage}>{item.message}</Text>

                        {/* Admin Response Box */}
                        {item.adminResponse && (
                          <View style={styles.adminResponseBox}>
                            <View style={styles.adminResponseHeader}>
                              <CheckCircle size={15} color="#2563EB" style={{ marginRight: 6 }} />
                              <Text style={styles.adminResponseTitle}>Admin Response</Text>
                            </View>
                            <Text style={styles.adminResponseMessage}>
                              {item.adminResponse.message}
                            </Text>
                            <Text style={styles.adminResponseFooter}>
                              Responded by {item.adminResponse.respondedBy?.name || 'Admin'} •{' '}
                              {getTimeAgo(item.adminResponse.respondedAt)}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Category Picker Modal */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCategoryModalVisible(false)}
        >
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerHeaderRow}>
              <Tag size={18} color={Colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.pickerModalTitle}>Select Category</Text>
            </View>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.pickerOptionItem,
                  category === cat && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  setCategory(cat);
                  setCategoryModalVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    category === cat && styles.pickerOptionTextSelected,
                  ]}
                >
                  {cat}
                </Text>
                {category === cat && <Check size={18} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Priority Picker Modal */}
      <Modal
        visible={priorityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPriorityModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setPriorityModalVisible(false)}
        >
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerHeaderRow}>
              <Flag size={18} color={Colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.pickerModalTitle}>Select Priority</Text>
            </View>
            {PRIORITIES.map((pri) => (
              <TouchableOpacity
                key={pri}
                style={[
                  styles.pickerOptionItem,
                  priority === pri && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  setPriority(pri);
                  setPriorityModalVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    priority === pri && styles.pickerOptionTextSelected,
                  ]}
                >
                  {pri}
                </Text>
                {priority === pri && <Check size={18} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Standardized Page Header
  pageHeader: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },

  // Stats Grid - 2x2 Clean Layout
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statCardTotal: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  statLabelTotal: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  statValueTotal: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },

  statCardPending: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A',
  },
  statLabelPending: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#854D0E',
  },
  statValuePending: {
    fontSize: 24,
    fontWeight: '900',
    color: '#713F12',
  },

  statCardProgress: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  statLabelProgress: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E40AF',
  },
  statValueProgress: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E3A8A',
  },

  statCardResolved: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  statLabelResolved: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#166534',
  },
  statValueResolved: {
    fontSize: 24,
    fontWeight: '900',
    color: '#14532D',
  },

  // Main Card Container
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  // Tabs Header
  tabsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  tabButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
  tabTextWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: '#DBEAFE',
  },
  tabBadgeInactive: {
    backgroundColor: '#F1F5F9',
  },
  tabBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  tabBadgeTextActive: {
    color: '#1E40AF',
  },
  tabBadgeTextInactive: {
    color: '#64748B',
  },

  // Form Container
  formContainer: {
    padding: 18,
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dropdownCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: '#DC2626',
    fontWeight: '800',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    minHeight: 46,
  },
  dropdownSelectedText: {
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '500',
    flex: 1,
  },
  dropdownPlaceholderText: {
    color: '#94A3B8',
  },
  formGroup: {
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13.5,
    color: '#0F172A',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 11,
  },
  ratingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  ratingStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  starTouchArea: {
    padding: 2,
  },

  // Checkbox Row
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 2,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginRight: 10,
  },
  checkboxBoxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkboxLabel: {
    fontSize: 13.5,
    color: '#334155',
    fontWeight: '600',
  },

  // Action Buttons
  formActionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  clearButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Feedback History
  historyContainer: {
    padding: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'center',
    maxWidth: 240,
  },
  emptyActionBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  emptyActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  feedbackList: {
    gap: 12,
  },
  feedbackCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  feedbackCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  feedbackTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  feedbackSubject: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  feedbackMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  metaChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  metaDateText: {
    fontSize: 11,
    color: '#64748B',
  },
  starRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  starRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  trashBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  feedbackBodyMessage: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    marginVertical: 4,
  },
  adminResponseBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  adminResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  adminResponseTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  adminResponseMessage: {
    fontSize: 12.5,
    color: '#1E293B',
    lineHeight: 18,
    marginBottom: 4,
  },
  adminResponseFooter: {
    fontSize: 11,
    color: '#64748B',
  },

  // Modal Picker
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  pickerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 6,
  },
  pickerModalTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  pickerOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  pickerOptionSelected: {
    backgroundColor: '#EFF6FF',
  },
  pickerOptionText: {
    fontSize: 13.5,
    color: '#334155',
    fontWeight: '500',
  },
  pickerOptionTextSelected: {
    color: '#2563EB',
    fontWeight: '700',
  },
});
