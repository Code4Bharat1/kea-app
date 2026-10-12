import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity, 
  Alert, 
  Platform,
  Image,
  Dimensions
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import { Button } from '../../src/components/common/Button';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  FileText, 
  Settings, 
  Edit, 
  LogOut,
  Building,
  CheckCircle,
  Award,
  Globe,
  Home,
  Clock,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Sparkles
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, refreshUser, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  };

  const handleLogout = () => {
    const doLogout = async () => {
      await logout();
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to sign out of your KEA account?')) {
        doLogout();
      }
    } else {
      Alert.alert(
        'Logout Confirmation',
        'Are you sure you want to sign out of your KEA account?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: doLogout },
        ]
      );
    }
  };

  const profile = user?.profile;

  const getCategoryDisplay = () => {
    if (!profile?.category) return 'Engineering Member';
    if ((profile.category === 'Other' || profile.category === 'Other Profession') && profile.otherCategory) {
      return profile.otherCategory;
    }
    return profile.category;
  };

  const calculateProfileCompletion = () => {
    if (!user) return 0;
    let score = 0;
    if (user.name) score += 10;
    if (user.email) score += 10;
    if (profile?.phone) score += 10;
    if (profile?.headline) score += 10;
    if (profile?.bio) score += 10;
    if (profile?.location) score += 5;
    if (profile?.nativeAddition) score += 5;
    if (profile?.category) score += 5;
    if (profile?.country) score += 5;
    if (profile?.skills && profile.skills.length > 0) score += 10;
    if (profile?.experience && profile.experience.length > 0) score += 10;
    if (profile?.education && profile.education.length > 0) score += 10;
    return Math.min(score, 100);
  };

  const completionScore = calculateProfileCompletion();

  const getInitials = (name?: string) => {
    if (!name) return 'KM';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.container}>
      <Header
        title="My Profile"
        showBack
        rightAction={
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/settings')} activeOpacity={0.7}>
            <Settings size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Profile Hero Header Card (Dark Navy Theme) */}
        <View style={styles.heroCard}>
          {/* Top Decorative Banner Pattern */}
          <View style={styles.heroTopBanner}>
            <View style={styles.heroBadgeBox}>
              <ShieldCheck size={14} color="#FBBF24" style={{ marginRight: 4 }} />
              <Text style={styles.heroBadgeText}>OFFICIAL KEA MEMBER</Text>
            </View>
          </View>

          <View style={styles.heroBody}>
            <View style={styles.avatarContainer}>
              {profile?.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarLarge}>
                  <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
                </View>
              )}
              {user?.membershipStatus === 'approved' && (
                <View style={styles.verifiedIconBadge}>
                  <CheckCircle size={16} color="#FFFFFF" fill="#10B981" />
                </View>
              )}
            </View>

            <Text style={styles.userName}>{user?.name || 'KEA Engineer'}</Text>
            <Text style={styles.userHeadline}>{profile?.headline || getCategoryDisplay()}</Text>

            <View style={styles.heroStatusRow}>
              <View style={[
                styles.statusTag,
                user?.membershipStatus === 'approved' ? styles.statusApproved : styles.statusPending
              ]}>
                <UserCheck size={12} color={user?.membershipStatus === 'approved' ? '#10B981' : '#F59E0B'} style={{ marginRight: 4 }} />
                <Text style={[
                  styles.statusTagText,
                  { color: user?.membershipStatus === 'approved' ? '#10B981' : '#F59E0B' }
                ]}>
                  {user?.membershipStatus === 'approved' ? 'Profile Verified' : `Status: ${user?.membershipStatus || 'Pending'}`}
                </Text>
              </View>

              {profile?.branch ? (
                <View style={styles.branchTag}>
                  <MapPin size={12} color="#94A3B8" style={{ marginRight: 4 }} />
                  <Text style={styles.branchTagText}>{profile.branch} Chapter</Text>
                </View>
              ) : null}
            </View>

            {/* Edit Profile Action Button */}
            <View style={styles.heroActionsRow}>
              <TouchableOpacity
                style={styles.heroEditBtn}
                onPress={() => router.push('/profile/edit')}
                activeOpacity={0.85}
              >
                <Edit size={15} color="#0D2847" style={{ marginRight: 6 }} />
                <Text style={styles.heroEditBtnText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.heroDocBtn}
                onPress={() => router.push('/profile/resumes')}
                activeOpacity={0.85}
              >
                <FileText size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.heroDocBtnText}>My Resumes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Profile Completion Card */}
        <View style={styles.completionCard}>
          <View style={styles.flexRowBetween}>
            <View style={styles.flexRow}>
              <View style={styles.awardIconBox}>
                <Award size={18} color="#D97706" />
              </View>
              <View>
                <Text style={styles.completionTitle}>Profile Strength</Text>
                <Text style={styles.completionSub}>
                  {completionScore === 100
                    ? '100% Complete — Perfect Profile!'
                    : 'Complete details for better visibility'}
                </Text>
              </View>
            </View>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreBadgeText}>{completionScore}%</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${completionScore}%` }]} />
          </View>
        </View>

        {/* Personal & Professional Details Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Sparkles size={18} color="#0D9488" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Personal & Professional Details</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={[styles.infoIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Mail size={16} color="#2563EB" />
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoText}>{user?.email}</Text>
              </View>
            </View>

            {profile?.phone ? (
              <View style={styles.infoItem}>
                <View style={[styles.infoIconBox, { backgroundColor: '#F0FDFA' }]}>
                  <Phone size={16} color="#0D9488" />
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Phone Contact</Text>
                  <Text style={styles.infoText}>
                    {profile.countryCode ? `${profile.countryCode} ` : ''}{profile.phone}
                  </Text>
                </View>
              </View>
            ) : null}

            {profile?.nativeAddition ? (
              <View style={styles.infoItem}>
                <View style={[styles.infoIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Home size={16} color="#D97706" />
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Native Address (Kokan)</Text>
                  <Text style={styles.infoText}>{profile.nativeAddition}</Text>
                </View>
              </View>
            ) : null}

            {profile?.location ? (
              <View style={styles.infoItem}>
                <View style={[styles.infoIconBox, { backgroundColor: '#FEE2E2' }]}>
                  <MapPin size={16} color="#EF4444" />
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Native Place in Konkan</Text>
                  <Text style={styles.infoText}>{profile.location}</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.infoItem}>
              <View style={[styles.infoIconBox, { backgroundColor: '#F3E8FF' }]}>
                <Briefcase size={16} color="#7C3AED" />
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Stream / Discipline</Text>
                <Text style={styles.infoText}>{getCategoryDisplay()}</Text>
              </View>
            </View>

            {profile?.company || profile?.position ? (
              <View style={styles.infoItem}>
                <View style={[styles.infoIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Building size={16} color="#059669" />
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Current Company & Position</Text>
                  <Text style={styles.infoText}>
                    {profile.position ? profile.position : 'Position'}{profile.company ? ` at ${profile.company}` : ''}
                  </Text>
                </View>
              </View>
            ) : null}

            {profile?.yearsOfExperience ? (
              <View style={styles.infoItem}>
                <View style={[styles.infoIconBox, { backgroundColor: '#FFF7ED' }]}>
                  <Clock size={16} color="#EA580C" />
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Years of Experience</Text>
                  <Text style={styles.infoText}>{profile.yearsOfExperience}</Text>
                </View>
              </View>
            ) : null}
          </View>

          {profile?.bio ? (
            <View style={styles.bioContainer}>
              <Text style={styles.bioTitle}>Professional Summary</Text>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </View>
          ) : null}
        </View>

        {/* Resume Manager Shortcut Banner */}
        <TouchableOpacity 
          style={styles.resumeBannerCard} 
          onPress={() => router.push('/profile/resumes')}
          activeOpacity={0.85}
        >
          <View style={styles.resumeBannerLeft}>
            <View style={styles.resumeIconBadge}>
              <FileText size={22} color="#0D9488" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.resumeBannerTitle}>Resume Manager</Text>
              <Text style={styles.resumeBannerSub}>Upload & manage PDF resumes for engineering job applications</Text>
            </View>
          </View>
          <ChevronRight size={20} color="#0D9488" />
        </TouchableOpacity>

        {/* Skills & Competencies */}
        {profile?.skills && profile.skills.length > 0 ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Skills & Expertise</Text>
            <View style={styles.skillsRow}>
              {profile.skills.map((skill, idx) => (
                <View key={idx} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Work Experience Timeline */}
        {profile?.experience && profile.experience.length > 0 ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {profile.experience.map((exp, idx) => (
              <View key={idx} style={styles.timelineRow}>
                <View style={styles.timelineIconWrapper}>
                  <Briefcase size={16} color="#0D9488" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.expPosition}>{exp.position}</Text>
                  <Text style={styles.expCompany}>{exp.company}</Text>
                  <Text style={styles.expDate}>
                    {exp.from} - {exp.to || 'Present'}
                  </Text>
                  {exp.description ? <Text style={styles.expDesc}>{exp.description}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Education Timeline */}
        {profile?.education && profile.education.length > 0 ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Education History</Text>
            {profile.education.map((edu, idx) => (
              <View key={idx} style={styles.timelineRow}>
                <View style={styles.timelineIconWrapper}>
                  <GraduationCap size={16} color="#2563EB" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.expPosition}>{edu.degree}</Text>
                  <Text style={styles.expCompany}>{edu.institution}</Text>
                  <Text style={styles.expDate}>
                    {edu.from} - {edu.to || 'Present'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Membership & Account Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Membership & System Info</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Member ID</Text>
            <Text style={styles.detailValue}>{user?._id?.substring(0, 8).toUpperCase() || 'KEA-001'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assigned Branch</Text>
            <Text style={styles.detailValue}>{profile?.branch || 'Bangalore'}</Text>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>Membership Status</Text>
            <View style={styles.activeStatusChip}>
              <Text style={styles.activeStatusText}>{user?.membershipStatus || 'Active'}</Text>
            </View>
          </View>
        </View>

        {/* Sign Out CTA Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <LogOut size={18} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Sign Out of KEA Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  headerBtn: { 
    padding: 6 
  },
  scrollContent: { 
    padding: 16, 
    paddingBottom: 40 
  },

  // Dark Navy Hero Card
  heroCard: {
    backgroundColor: '#0D2847',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#0D2847',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  heroTopBanner: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  heroBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 0.5,
  },
  heroBody: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarLarge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  avatarImg: { 
    width: 84, 
    height: 84, 
    borderRadius: 42,
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  avatarText: { 
    fontSize: 30, 
    fontWeight: '800', 
    color: '#FFFFFF' 
  },
  verifiedIconBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#10B981',
    borderRadius: 10,
    padding: 2,
  },
  userName: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#FFFFFF',
    textAlign: 'center',
  },
  userHeadline: { 
    fontSize: 13, 
    color: '#CBD5E1', 
    marginTop: 4, 
    textAlign: 'center',
    maxWidth: '90%',
  },
  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  branchTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  branchTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    width: '100%',
  },
  heroEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 11,
    borderRadius: 12,
  },
  heroEditBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D2847',
  },
  heroDocBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroDocBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Completion Progress Card
  completionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  flexRowBetween: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  flexRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  awardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  completionTitle: { 
    fontSize: 14, 
    fontWeight: '800', 
    color: '#0F172A' 
  },
  completionSub: { 
    fontSize: 11, 
    color: '#64748B', 
    marginTop: 2 
  },
  scoreBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  scoreBadgeText: { 
    fontSize: 13, 
    fontWeight: '800', 
    color: '#D97706' 
  },
  progressTrack: { 
    height: 8, 
    backgroundColor: '#F1F5F9', 
    borderRadius: 4, 
    overflow: 'hidden', 
    marginTop: 12 
  },
  progressFill: { 
    height: '100%', 
    backgroundColor: '#0D9488', 
    borderRadius: 4 
  },

  // Generic Section Cards
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: '#0F172A', 
    marginBottom: 14 
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: { 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
  },
  infoIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: { 
    marginLeft: 12, 
    flex: 1 
  },
  infoLabel: { 
    fontSize: 10.5, 
    color: '#64748B', 
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoText: { 
    fontSize: 13, 
    color: '#0F172A', 
    fontWeight: '700', 
    marginTop: 1 
  },
  bioContainer: { 
    marginTop: 14, 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#F1F5F9' 
  },
  bioTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  bioText: { 
    fontSize: 12.5, 
    color: '#334155', 
    lineHeight: 19 
  },

  // Resume Manager Banner Card
  resumeBannerCard: { 
    backgroundColor: '#F0FDFA', 
    borderWidth: 1,
    borderColor: '#CCFBF1', 
    marginBottom: 16, 
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resumeBannerLeft: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flex: 1,
  },
  resumeIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeBannerTitle: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: '#0F172A' 
  },
  resumeBannerSub: { 
    fontSize: 11, 
    color: '#475569', 
    marginTop: 2 
  },

  // Skills Chips
  skillsRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8 
  },
  skillChip: { 
    backgroundColor: '#F0FDFA', 
    paddingHorizontal: 12, 
    paddingVertical: 7, 
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  skillChipText: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#0D9488' 
  },

  // Timelines
  timelineRow: { 
    flexDirection: 'row', 
    marginBottom: 14, 
    alignItems: 'flex-start' 
  },
  timelineIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expPosition: { 
    fontSize: 13.5, 
    fontWeight: '800', 
    color: '#0F172A' 
  },
  expCompany: { 
    fontSize: 12, 
    color: '#2563EB', 
    fontWeight: '700',
    marginTop: 1,
  },
  expDate: { 
    fontSize: 11, 
    color: '#64748B', 
    marginTop: 2 
  },
  expDesc: { 
    fontSize: 11.5, 
    color: '#475569', 
    marginTop: 4,
    lineHeight: 16,
  },

  // Details List
  detailRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  detailLabel: { 
    fontSize: 12.5, 
    color: '#64748B',
    fontWeight: '600',
  },
  detailValue: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#0F172A' 
  },
  activeStatusChip: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  activeStatusText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#059669',
  },

  // Logout Button
  logoutBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EF4444',
  },
});
