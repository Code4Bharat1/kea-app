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
import { Colors } from '../../../src/constants/theme';
import { Header } from '../../../src/components/common/Header';
import { Card } from '../../../src/components/common/Card';
import { Badge } from '../../../src/components/common/Badge';
import { Loader } from '../../../src/components/common/Loader';
import { Toast } from '../../../src/components/common/Toast';
import { mentorsApi } from '../../../src/api/mentors.api';
import { MentorItem } from '../../../src/types';
import { useAuth } from '../../../src/context/AuthContext';
import {
  Search,
  MapPin,
  Briefcase,
  Star,
  Clock,
  Plus,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  X,
  ChevronDown,
} from 'lucide-react-native';

export default function MentorshipListScreen() {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<MentorItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterExpertise, setFilterExpertise] = useState<string>('');
  const [filterExperience, setFilterExperience] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [myMentorProfile, setMyMentorProfile] = useState<MentorItem | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [showExpPicker, setShowExpPicker] = useState<boolean>(false);
  const [showDiscPicker, setShowDiscPicker] = useState<boolean>(false);

  const [toastConfig, setToastConfig] = useState<{
    visible: boolean;
    message: string;
    type?: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const [newMentor, setNewMentor] = useState({
    name: user?.name || '',
    title: '',
    organization: '',
    bio: '',
    expertise: '',
    skills: '',
    years: '',
    description: '',
    location: user?.profile?.location || '',
    email: user?.email || '',
    linkedin: user?.profile?.socialLinks?.linkedin || '',
  });

  const experienceOptions = [
    { label: 'All Experience', value: '' },
    { label: '5+ years', value: '5' },
    { label: '10+ years', value: '10' },
    { label: '15+ years', value: '15' },
    { label: '20+ years', value: '20' },
  ];

  const disciplineOptions = [
    { label: 'All Disciplines', value: '' },
    { label: 'Civil engineering', value: 'Civil engineering' },
    { label: 'Structural', value: 'Structural' },
    { label: 'Mechanical', value: 'Mechanical' },
    { label: 'Electrical', value: 'Electrical' },
  ];

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastConfig({ visible: true, message, type });
  };

  const fetchMyMentorProfile = useCallback(async () => {
    try {
      const profile = await mentorsApi.getMyMentorProfile();
      setMyMentorProfile(profile);
    } catch (error) {
      setMyMentorProfile(null);
    }
  }, []);

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await mentorsApi.getMentors({
        search: searchQuery,
        expertise: filterExpertise,
        experience: filterExperience,
        page: currentPage,
        limit: 12,
      });

      setMentors(data.mentors || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      setMentors([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterExpertise, filterExperience, currentPage]);

  useEffect(() => {
    fetchMyMentorProfile();
  }, [fetchMyMentorProfile]);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchMyMentorProfile(), fetchMentors()]);
    setRefreshing(false);
  };

  const handleCreateMentor = async () => {
    if (
      !newMentor.name.trim() ||
      !newMentor.title.trim() ||
      !newMentor.organization.trim() ||
      !newMentor.location.trim() ||
      !newMentor.bio.trim() ||
      !newMentor.expertise.trim() ||
      !newMentor.skills.trim() ||
      !newMentor.years ||
      !newMentor.email.trim() ||
      !newMentor.linkedin.trim()
    ) {
      Alert.alert('Missing Fields', 'Please fill in all required fields marked with *');
      return;
    }

    if (newMentor.bio.trim().length < 50) {
      Alert.alert('Bio Too Short', 'Professional Bio must be at least 50 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: newMentor.name.trim(),
        title: newMentor.title.trim(),
        organization: newMentor.organization.trim(),
        bio: newMentor.bio.trim(),
        expertise: newMentor.expertise
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean),
        skills: newMentor.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        experience: {
          years: parseInt(newMentor.years, 10) || 0,
          description: newMentor.description.trim(),
        },
        location: newMentor.location.trim(),
        contact: {
          email: newMentor.email.trim(),
          linkedin: newMentor.linkedin.trim(),
        },
      };

      await mentorsApi.createMentor(payload);
      setShowCreateModal(false);
      fetchMyMentorProfile();
      showToast('Mentor profile submitted for admin review!', 'success');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to create mentor profile';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    const badges: Record<string, { icon: any; text: string; bg: string; color: string; border: string }> = {
      pending: {
        icon: AlertCircle,
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

  const renderMentorCard = ({ item }: { item: MentorItem }) => {
    const yearsExp = item.experience?.years || 0;
    const rating = item.stats?.rating || 0;
    const sessions = item.stats?.totalSessions || 0;

    return (
      <Card style={styles.mentorCard}>
        <View style={styles.mentorCardHeader}>
          {/* Avatar Circle */}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>

          {/* Details */}
          <View style={styles.mentorMainInfo}>
            <View style={styles.titleRatingRow}>
              <Text style={styles.mentorName} numberOfLines={1}>
                {item.name}
              </Text>
              {rating > 0 && (
                <View style={styles.ratingBadge}>
                  <Star size={13} color="#EAB308" fill="#EAB308" />
                  <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                </View>
              )}
            </View>

            <Text style={styles.mentorTitleText} numberOfLines={1}>
              {item.title}
            </Text>
            {item.organization && (
              <Text style={styles.mentorOrgText} numberOfLines={1}>
                {item.organization}
              </Text>
            )}
          </View>
        </View>

        {/* Expertise Badges */}
        <View style={styles.expertiseRow}>
          {item.expertise?.slice(0, 3).map((exp, idx) => (
            <View key={idx} style={styles.expertiseBadge}>
              <Text style={styles.expertiseBadgeText}>{exp}</Text>
            </View>
          ))}
          {item.expertise && item.expertise.length > 3 && (
            <View style={styles.moreExpertiseBadge}>
              <Text style={styles.moreExpertiseText}>+{item.expertise.length - 3} more</Text>
            </View>
          )}
        </View>

        {/* Bio */}
        <Text style={styles.bioText} numberOfLines={2}>
          {item.bio}
        </Text>

        {/* Meta Stats Row */}
        <View style={styles.metaRow}>
          {yearsExp ? (
            <View style={styles.metaItem}>
              <Briefcase size={13} color={Colors.textMuted} />
              <Text style={styles.metaItemText}>{yearsExp}+ yrs</Text>
            </View>
          ) : null}

          {item.location ? (
            <View style={styles.metaItem}>
              <MapPin size={13} color={Colors.textMuted} />
              <Text style={styles.metaItemText} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          ) : null}

          {sessions > 0 ? (
            <View style={styles.metaItem}>
              <Clock size={13} color={Colors.textMuted} />
              <Text style={styles.metaItemText}>{sessions} sessions</Text>
            </View>
          ) : null}
        </View>

        {/* Action Buttons */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={styles.viewProfileBtn}
            onPress={() => router.push(`/community/mentorship/${item._id}` as any)}
          >
            <Text style={styles.viewProfileBtnText}>View profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.requestMentorshipBtn}
            onPress={() => router.push(`/community/mentorship/${item._id}` as any)}
          >
            <Text style={styles.requestMentorshipBtnText}>Request mentorship</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Mentorship" showBack showNotif />

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
        {/* Top Header Section */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.screenTitle}>Mentorship</Text>
            <Text style={styles.screenSubtitle}>
              Connect with experienced engineers & developers for guidance
            </Text>
          </View>

          {!myMentorProfile && (
            <TouchableOpacity
              style={styles.becomeMentorHeaderBtn}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.becomeMentorHeaderBtnText}>Become a mentor</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* My Mentor Profile Banner (If user has submitted profile) */}
        {myMentorProfile && (
          <View style={styles.profileBannerCard}>
            <View style={styles.profileBannerLeft}>
              <View style={styles.profileBannerHeader}>
                <Text style={styles.profileBannerTitle}>Your Mentor Profile</Text>
                {getStatusBadge(myMentorProfile.approvalStatus)}
              </View>
              <Text style={styles.profileBannerSub}>
                {myMentorProfile.approvalStatus === 'pending' &&
                  'Your profile is under review by our administrators.'}
                {myMentorProfile.approvalStatus === 'approved' &&
                  'Your profile is live and visible to students!'}
                {myMentorProfile.approvalStatus === 'rejected' &&
                  `Reason: ${myMentorProfile.rejectionReason || 'Does not meet requirements'}`}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.viewMyProfileBtn}
              onPress={() => router.push(`/community/mentorship/${myMentorProfile._id}` as any)}
            >
              <Text style={styles.viewMyProfileBtnText}>View My Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search & Filter Container Card */}
        <View style={styles.filterCard}>
          {/* Search Input */}
          <View style={styles.searchBar}>
            <Search size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, company, or skill"
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

          {/* Filter Dropdowns Row */}
          <View style={styles.filterDropdownsRow}>
            {/* Experience Selector */}
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setShowExpPicker(true)}
            >
              <Text style={styles.pickerBtnText} numberOfLines={1}>
                {experienceOptions.find((o) => o.value === filterExperience)?.label ||
                  'All Experience'}
              </Text>
              <ChevronDown size={16} color="#6B7280" />
            </TouchableOpacity>

            {/* Discipline Selector */}
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setShowDiscPicker(true)}
            >
              <Text style={styles.pickerBtnText} numberOfLines={1}>
                {disciplineOptions.find((o) => o.value === filterExpertise)?.label ||
                  'All Disciplines'}
              </Text>
              <ChevronDown size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Directory Sub-header */}
        <View style={styles.directoryHeaderRow}>
          <Text style={styles.directoryTitle}>Available Mentors</Text>
          <Text style={styles.directoryPageText}>
            Page {currentPage} of {totalPages}
          </Text>
        </View>

        {/* Mentors List / Empty State */}
        {loading ? (
          <Loader message="Loading mentors..." />
        ) : mentors.length === 0 ? (
          /* Empty State matching exact reference design */
          <View style={styles.emptyStateCard}>
            <User size={64} color="#9CA3AF" strokeWidth={1.5} style={styles.emptyIcon} />
            <Text style={styles.emptyTitleText}>No mentors found</Text>
            {!myMentorProfile && (
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.emptyActionBtnText}>Be the First Mentor</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.mentorsList}>
            {mentors.map((item) => (
              <React.Fragment key={item._id}>
                {renderMentorCard({ item })}
              </React.Fragment>
            ))}

            {/* Pagination */}
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

      {/* Become a Mentor Modal */}
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
              <Text style={styles.modalTitle}>Become a Mentor</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <X size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* Notice */}
              <View style={styles.noticeBox}>
                <AlertCircle size={18} color="#2563EB" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.noticeTitle}>Admin Approval Required</Text>
                  <Text style={styles.noticeSub}>
                    Your mentor profile will be reviewed by administrators before becoming visible to students.
                  </Text>
                </View>
              </View>

              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Dr. Rajesh Kumar"
                placeholderTextColor="#9CA3AF"
                value={newMentor.name}
                onChangeText={(t) => setNewMentor({ ...newMentor, name: t })}
              />

              <Text style={styles.inputLabel}>Professional Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Senior Structural Engineer"
                placeholderTextColor="#9CA3AF"
                value={newMentor.title}
                onChangeText={(t) => setNewMentor({ ...newMentor, title: t })}
              />

              <Text style={styles.inputLabel}>Organization *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Larsen & Toubro"
                placeholderTextColor="#9CA3AF"
                value={newMentor.organization}
                onChangeText={(t) => setNewMentor({ ...newMentor, organization: t })}
              />

              <Text style={styles.inputLabel}>Location *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Mumbai, India"
                placeholderTextColor="#9CA3AF"
                value={newMentor.location}
                onChangeText={(t) => setNewMentor({ ...newMentor, location: t })}
              />

              <Text style={styles.inputLabel}>Years of Experience *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 10"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={newMentor.years}
                onChangeText={(t) => setNewMentor({ ...newMentor, years: t })}
              />

              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="your.email@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                value={newMentor.email}
                onChangeText={(t) => setNewMentor({ ...newMentor, email: t })}
              />

              <Text style={styles.inputLabel}>LinkedIn Profile *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://linkedin.com/in/your-profile"
                placeholderTextColor="#9CA3AF"
                value={newMentor.linkedin}
                onChangeText={(t) => setNewMentor({ ...newMentor, linkedin: t })}
              />

              <Text style={styles.inputLabel}>Professional Bio *</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                placeholder="Tell us about your professional journey, achievements, and what guidance you offer..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={newMentor.bio}
                onChangeText={(t) => setNewMentor({ ...newMentor, bio: t })}
              />

              <Text style={styles.inputLabel}>Areas of Expertise * (comma separated)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Structural Design, Project Management"
                placeholderTextColor="#9CA3AF"
                value={newMentor.expertise}
                onChangeText={(t) => setNewMentor({ ...newMentor, expertise: t })}
              />

              <Text style={styles.inputLabel}>Technical Skills * (comma separated)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. AutoCAD, STAAD Pro, Leadership"
                placeholderTextColor="#9CA3AF"
                value={newMentor.skills}
                onChangeText={(t) => setNewMentor({ ...newMentor, skills: t })}
              />

              <Text style={styles.inputLabel}>Experience Description</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                placeholder="Briefly describe your work experience & accomplishments..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={newMentor.description}
                onChangeText={(t) => setNewMentor({ ...newMentor, description: t })}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  disabled={submitting}
                  onPress={handleCreateMentor}
                >
                  <Text style={styles.submitBtnText}>
                    {submitting ? 'Submitting...' : 'Submit for Review'}
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

      {/* Experience Picker Modal */}
      <Modal
        visible={showExpPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExpPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowExpPicker(false)}
        >
          <View style={styles.pickerContent}>
            <Text style={styles.pickerHeaderTitle}>Select Experience Level</Text>
            {experienceOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.pickerOption}
                onPress={() => {
                  setFilterExperience(opt.value);
                  setCurrentPage(1);
                  setShowExpPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    filterExperience === opt.value && styles.pickerOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Discipline Picker Modal */}
      <Modal
        visible={showDiscPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDiscPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowDiscPicker(false)}
        >
          <View style={styles.pickerContent}>
            <Text style={styles.pickerHeaderTitle}>Select Engineering Discipline</Text>
            {disciplineOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.pickerOption}
                onPress={() => {
                  setFilterExpertise(opt.value);
                  setCurrentPage(1);
                  setShowDiscPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    filterExpertise === opt.value && styles.pickerOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
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
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 18,
  },
  becomeMentorHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAB308',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  becomeMentorHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  profileBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  profileBannerLeft: {
    flex: 1,
  },
  profileBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  profileBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  profileBannerSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewMyProfileBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  viewMyProfileBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  searchBar: {
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
  filterDropdownsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  pickerBtnText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  directoryHeaderRow: {
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
  directoryPageText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 48,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyTitleText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 16,
  },
  emptyActionBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  mentorsList: {
    gap: 12,
  },
  mentorCard: {
    padding: 16,
    marginBottom: 12,
  },
  mentorCardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  mentorMainInfo: {
    flex: 1,
  },
  titleRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mentorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  mentorTitleText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
    marginTop: 2,
  },
  mentorOrgText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  expertiseRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  expertiseBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  expertiseBadgeText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  moreExpertiseBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  moreExpertiseText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  bioText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaItemText: {
    fontSize: 12,
    color: '#6B7280',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  viewProfileBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2563EB',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewProfileBtnText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '700',
  },
  requestMentorshipBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestMentorshipBtnText: {
    fontSize: 13,
    color: '#FFFFFF',
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
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    padding: 16,
  },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  noticeSub: {
    fontSize: 11,
    color: '#1E3A8A',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#111827',
  },
  textAreaInput: {
    height: 90,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
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
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  pickerContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  pickerHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  pickerOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  pickerOptionTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
});
