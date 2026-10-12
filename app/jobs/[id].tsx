import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Share,
  Alert,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { Loader } from '../../src/components/common/Loader';
import { Toast } from '../../src/components/common/Toast';
import { jobsApi } from '../../src/api/jobs.api';
import { userApi } from '../../src/api/user.api';
import { JobItem, ResumeItem } from '../../src/types';
import {
  MapPin,
  DollarSign,
  Building2,
  Clock,
  Bookmark,
  BookmarkCheck,
  Share2,
  Briefcase,
  ExternalLink,
  Award,
  FileText,
  X,
  CheckCircle,
} from 'lucide-react-native';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<JobItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Apply Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(msg);
    setToastType(type);
  };

  const fetchJobDetails = async () => {
    if (!id) return;
    try {
      const data = await jobsApi.getJobById(id);
      setJob(data);
      setIsSaved(!!data.isSaved);
    } catch (err) {
      console.error('Failed fetching job details:', err);
      showToast('Unable to load job details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!id) return;
      try {
        const data = await jobsApi.getJobById(id);
        if (isMounted) {
          setJob(data);
          setIsSaved(!!data.isSaved);
        }
      } catch (err) {
        console.error('Failed fetching job details:', err);
        if (isMounted) {
          setToastMessage('Unable to load job details.');
          setToastType('error');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobDetails();
    setRefreshing(false);
  };

  const handleToggleSave = async () => {
    if (!job) return;
    setSaving(true);
    try {
      if (isSaved) {
        await userApi.deleteSavedJob(job._id);
        setIsSaved(false);
        showToast('Removed from saved jobs', 'info');
      } else {
        await userApi.saveJob(job._id);
        setIsSaved(true);
        showToast('Job saved successfully!', 'success');
      }
    } catch (err) {
      showToast('Failed updating saved status', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!job) return;
    try {
      await Share.share({
        title: job.title,
        message: `Check out this job opportunity: ${job.title} at ${job.company}`,
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleOpenApplyModal = async () => {
    if (job?.applyUrl) {
      try {
        const canOpen = await Linking.canOpenURL(job.applyUrl);
        if (canOpen) {
          await Linking.openURL(job.applyUrl);
          return;
        }
      } catch (e) {
        console.error('Cannot open apply URL:', e);
      }
    }

    // Open native Apply Modal
    setShowApplyModal(true);
    try {
      const myResumes = await userApi.getMyResumes();
      setResumes(myResumes);
      if (myResumes.length > 0) {
        setSelectedResumeId(myResumes[0]._id);
      }
    } catch (err) {
      console.error('Error loading resumes:', err);
    }
  };

  const handleSubmitApplication = async () => {
    if (!job) return;
    if (resumes.length === 0) {
      Alert.alert('Resume Required', 'Please upload a resume first in My Documents.');
      return;
    }
    if (!selectedResumeId) {
      Alert.alert('Validation Error', 'Please select a resume to submit.');
      return;
    }

    setSubmittingApp(true);
    try {
      await userApi.applyForJob(job._id, selectedResumeId, coverLetter);
      setShowApplyModal(false);
      setCoverLetter('');
      showToast('Application submitted successfully! 🎉', 'success');
    } catch (err: any) {
      console.error('Apply error:', err);
      Alert.alert('Application Failed', err?.response?.data?.message || 'Failed to submit application.');
    } finally {
      setSubmittingApp(false);
    }
  };

  const getTimeAgo = (date?: string) => {
    if (!date) return 'Recently';
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    const days = Math.floor(seconds / 86400);

    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  if (loading) {
    return <Loader message="Loading job specifications..." fullScreen />;
  }

  if (!job) {
    return (
      <View style={styles.container}>
        <Header title="Job Details" showBack />
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Job listing not found or expired.</Text>
        </View>
      </View>
    );
  }

  const postedByName = typeof job.postedBy === 'object' ? (job.postedBy as any)?.name : job.postedBy;
  const categoryName = job.category || job.discipline;
  const expText = job.experience || job.experienceLevel;

  return (
    <View style={styles.container}>
      <Header
        title={job.title}
        showBack
        rightAction={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={handleShare} style={styles.headerIconBtn}>
              <Share2 size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleToggleSave} disabled={saving} style={styles.headerIconBtn}>
              {isSaved ? (
                <BookmarkCheck size={22} color={Colors.primary} />
              ) : (
                <Bookmark size={22} color={Colors.textPrimary} />
              )}
            </TouchableOpacity>
          </View>
        }
      />

      <Toast
        visible={!!toastMessage}
        message={toastMessage || ''}
        type={toastType}
        onDismiss={() => setToastMessage(null)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Main Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.companyRow}>
            <View style={styles.iconBox}>
              <Building2 size={26} color={Colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.title}>{job.title}</Text>
              <Text style={styles.companyName}>{job.company}</Text>
            </View>
          </View>

          {/* Key Badges */}
          <View style={styles.tagRow}>
            <View style={styles.badgeChip}>
              <MapPin size={13} color="#64748B" style={{ marginRight: 4 }} />
              <Text style={styles.badgeChipText}>{job.location}</Text>
            </View>

            <View style={[styles.badgeChip, styles.typeBadge]}>
              <Briefcase size={13} color="#1D61FF" style={{ marginRight: 4 }} />
              <Text style={styles.typeBadgeText}>{job.type || 'Full-time'}</Text>
            </View>

            {job.salary ? (
              <View style={[styles.badgeChip, { backgroundColor: '#F0FDF4' }]}>
                <DollarSign size={13} color="#166534" style={{ marginRight: 3 }} />
                <Text style={[styles.badgeChipText, { color: '#166534', fontWeight: '700' }]}>
                  {job.salary}
                </Text>
              </View>
            ) : null}

            {categoryName ? (
              <View style={[styles.badgeChip, { backgroundColor: '#EFF6FF' }]}>
                <Text style={{ fontSize: 11, color: '#1D4ED8', fontWeight: '700' }}>
                  {categoryName.toUpperCase()}
                </Text>
              </View>
            ) : null}

            {expText ? (
              <View style={styles.badgeChip}>
                <Award size={13} color="#64748B" style={{ marginRight: 3 }} />
                <Text style={styles.badgeChipText}>{expText} Exp</Text>
              </View>
            ) : null}

            <View style={styles.badgeChip}>
              <Clock size={13} color="#94A3B8" style={{ marginRight: 4 }} />
              <Text style={styles.badgeChipText}>Posted {getTimeAgo(job.createdAt)}</Text>
            </View>
          </View>

          {/* Tags */}
          {job.tags && job.tags.length > 0 ? (
            <View style={styles.tagsContainer}>
              {job.tags.map((t, idx) => (
                <View key={idx} style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{t}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </Card>

        {/* Overview Specifications Card */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Overview Specifications</Text>
          <View style={styles.specGrid}>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Job Type</Text>
              <Text style={styles.specValue}>{job.type || 'Full-time'}</Text>
            </View>
            {job.salary ? (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Salary</Text>
                <Text style={styles.specValue}>{job.salary}</Text>
              </View>
            ) : null}
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Location</Text>
              <Text style={styles.specValue}>{job.location}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Posted Date</Text>
              <Text style={styles.specValue}>{getTimeAgo(job.createdAt)}</Text>
            </View>
            {expText ? (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Experience</Text>
                <Text style={styles.specValue}>{expText}</Text>
              </View>
            ) : null}
            {categoryName ? (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Category</Text>
                <Text style={[styles.specValue, { color: Colors.primary, fontWeight: '700' }]}>
                  {categoryName}
                </Text>
              </View>
            ) : null}
          </View>
        </Card>

        {/* Description Section */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.bodyText}>{job.description}</Text>
        </Card>

        {/* Requirements Section */}
        {job.requirements && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Requirements & Qualifications</Text>
            {Array.isArray(job.requirements) ? (
              job.requirements.map((req, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{req}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.bodyText}>{job.requirements}</Text>
            )}
          </Card>
        )}

        {/* About Company */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About the Company</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.companyLogoCircle}>
              <Building2 size={24} color={Colors.primary} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.companyNameBold}>{job.company}</Text>
              {postedByName ? (
                <Text style={styles.postedByText}>Posted by {postedByName}</Text>
              ) : null}
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Bottom CTA Bar */}
      <View style={styles.bottomCtaBar}>
        <TouchableOpacity
          style={styles.saveToggleBtn}
          onPress={handleToggleSave}
          disabled={saving}
        >
          {isSaved ? (
            <BookmarkCheck size={20} color={Colors.primary} />
          ) : (
            <Bookmark size={20} color={Colors.textPrimary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.applyNowMainBtn}
          onPress={handleOpenApplyModal}
          activeOpacity={0.85}
        >
          <Text style={styles.applyNowMainBtnText}>
            {job.applyUrl ? 'Apply on Company Website' : 'Apply Now'}
          </Text>
          {job.applyUrl ? (
            <ExternalLink size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
          ) : null}
        </TouchableOpacity>
      </View>

      {/* Apply Modal Component */}
      <Modal visible={showApplyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Apply for {job.title}</Text>
                <Text style={styles.modalSub}>at {job.company}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                <X size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Select Resume *</Text>
              {resumes.length === 0 ? (
                <View style={styles.noResumeBox}>
                  <FileText size={24} color="#D97706" />
                  <Text style={styles.noResumeText}>
                    You haven't uploaded any resumes yet. Please upload one in My Documents first.
                  </Text>
                  <TouchableOpacity
                    style={styles.uploadResumeLinkBtn}
                    onPress={() => {
                      setShowApplyModal(false);
                      router.push('/profile/resumes' as any);
                    }}
                  >
                    <Text style={styles.uploadResumeLinkBtnText}>Go to My Documents</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.resumesListContainer}>
                  {resumes.map((r) => {
                    const isSelected = selectedResumeId === r._id;
                    const rTitle = r.title || r.originalName || r.fileName || 'Resume Document';
                    return (
                      <TouchableOpacity
                        key={r._id}
                        style={[styles.resumeItemRow, isSelected && styles.resumeItemRowSelected]}
                        onPress={() => setSelectedResumeId(r._id)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <FileText
                            size={18}
                            color={isSelected ? Colors.primary : Colors.textMuted}
                            style={{ marginRight: 8 }}
                          />
                          <Text
                            style={[
                              styles.resumeItemTitle,
                              isSelected && styles.resumeItemTitleSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {rTitle}
                          </Text>
                        </View>
                        {isSelected ? <CheckCircle size={18} color={Colors.primary} /> : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <Text style={[styles.label, { marginTop: 16 }]}>Cover Letter (Optional)</Text>
              <TextInput
                style={styles.textArea}
                value={coverLetter}
                onChangeText={setCoverLetter}
                placeholder="Tell us why you're interested in this role..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              <View style={styles.modalActions}>
                <Button
                  title={submittingApp ? 'Submitting...' : 'Submit Application'}
                  onPress={handleSubmitApplication}
                  loading={submittingApp}
                  disabled={submittingApp || resumes.length === 0}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowApplyModal(false)}
                  disabled={submittingApp}
                  style={{ flex: 1, marginLeft: 10 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 16, paddingBottom: 110 },
  headerIconBtn: { padding: 6 },
  headerCard: { marginBottom: 14, padding: 16 },
  companyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  companyName: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginTop: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 10 },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  badgeChipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  typeBadge: { backgroundColor: '#EFF6FF' },
  typeBadgeText: { fontSize: 12, color: '#1D61FF', fontWeight: '600' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tagPill: {
    backgroundColor: '#CCFBF1',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  tagPillText: { fontSize: 12, color: '#0F766E', fontWeight: '600' },
  sectionCard: { marginBottom: 14, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  bodyText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 7, marginRight: 10 },
  bulletText: { fontSize: 14, color: Colors.textSecondary, flex: 1, lineHeight: 20 },
  specGrid: { gap: 10 },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  specLabel: { fontSize: 13, color: Colors.textMuted },
  specValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  companyLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyNameBold: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  postedByText: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  bottomCtaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 8,
  },
  saveToggleBtn: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyNowMainBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyNowMainBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  errorBox: { padding: 32, alignItems: 'center' },
  errorText: { fontSize: 15, color: Colors.textMuted },

  // Apply Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  modalSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  modalBody: { paddingTop: 16 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  noResumeBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  noResumeText: { fontSize: 13, color: '#92400E', textAlign: 'center', marginVertical: 8 },
  uploadResumeLinkBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  uploadResumeLinkBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  resumesListContainer: { gap: 8 },
  resumeItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
  },
  resumeItemRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  resumeItemTitle: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
  resumeItemTitleSelected: { color: Colors.primary, fontWeight: '700' },
  textArea: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 20,
  },
});
