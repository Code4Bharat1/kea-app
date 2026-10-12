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
  Linking,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  FileText,
  Settings,
  Edit3,
  LogOut,
  Building,
  CheckCircle2,
  Home,
  Clock,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  Plus,
} from 'lucide-react-native';

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
        'Sign Out',
        'Are you sure you want to sign out of your KEA account?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: doLogout },
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

  const getInitials = (name?: string) => {
    if (!name) return 'KM';
    return name
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const memberId = user?._id ? `KEA-${user._id.substring(user._id.length - 6).toUpperCase()}` : 'KEA-MEMBER';

  const handleEmailPress = (email?: string) => {
    if (email) Linking.openURL(`mailto:${email}`);
  };

  const handlePhonePress = (phone?: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Profile"
        showBack
        rightAction={
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push('/settings')}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Settings size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        scrollEventThrottle={16}
        removeClippedSubviews={Platform.OS === 'android'}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* PROFILE HEADER CARD (LinkedIn / Real App Standard) */}
        <View style={styles.profileHeaderCard}>
          {/* Subtle Brand Cover Bar */}
          <View style={styles.coverBar} />

          {/* Profile Identity Info */}
          <View style={styles.headerBody}>
            {/* Avatar Row */}
            <View style={styles.avatarRow}>
              <View style={styles.avatarContainer}>
                {profile?.avatar ? (
                  <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>{getInitials(user?.name)}</Text>
                  </View>
                )}
                {user?.membershipStatus === 'approved' ? (
                  <View style={styles.verifiedCheckBadge}>
                    <CheckCircle2 size={16} color="#FFFFFF" fill="#10B981" />
                  </View>
                ) : null}
              </View>

              {/* Edit Profile Action */}
              <TouchableOpacity
                style={styles.editPillBtn}
                onPress={() => router.push('/profile/edit')}
                activeOpacity={0.75}
              >
                <Edit3 size={14} color={Colors.primary} style={{ marginRight: 5 }} />
                <Text style={styles.editPillBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            {/* User Name & Headline */}
            <Text style={styles.userName}>{user?.name || 'KEA Member'}</Text>
            <Text style={styles.userHeadline}>
              {profile?.headline || (profile?.position ? `${profile.position}${profile.company ? ` at ${profile.company}` : ''}` : getCategoryDisplay())}
            </Text>

            {/* Quick Meta Row */}
            <View style={styles.metaRow}>
              {profile?.location || profile?.branch ? (
                <View style={styles.metaItem}>
                  <MapPin size={13} color="#64748B" style={{ marginRight: 4 }} />
                  <Text style={styles.metaItemText}>
                    {profile?.location || `${profile?.branch} Chapter`}
                  </Text>
                </View>
              ) : null}

              <View style={styles.metaItem}>
                <Briefcase size={13} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={styles.metaItemText}>{getCategoryDisplay()}</Text>
              </View>

              <View style={styles.metaItem}>
                <ShieldCheck size={13} color="#D97706" style={{ marginRight: 4 }} />
                <Text style={styles.memberIdText}>{memberId}</Text>
              </View>
            </View>

            {/* Quick Action Pills */}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={styles.resumesActionBtn}
                onPress={() => router.push('/profile/resumes')}
                activeOpacity={0.75}
              >
                <FileText size={14} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.resumesActionBtnText}>Manage Resumes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsActionBtn}
                onPress={() => router.push('/settings')}
                activeOpacity={0.75}
              >
                <Settings size={14} color="#475569" style={{ marginRight: 6 }} />
                <Text style={styles.settingsActionBtnText}>Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SECTION: ABOUT / PROFESSIONAL SUMMARY */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>About</Text>
            <TouchableOpacity
              onPress={() => router.push('/profile/edit')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Edit3 size={15} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          {profile?.bio ? (
            <Text style={styles.bioText}>{profile.bio}</Text>
          ) : (
            <Text style={styles.emptyText}>
              Add a summary about your engineering background, specializations, and career highlights.
            </Text>
          )}
        </View>

        {/* SECTION: KONKAN ROOTS & HERITAGE (Official KEA Field) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Konkan Heritage & Roots</Text>
            <TouchableOpacity
              onPress={() => router.push('/profile/edit')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Edit3 size={15} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <View style={styles.fieldList}>
            <View style={styles.fieldItem}>
              <Text style={styles.fieldLabel}>Native Place in Konkan</Text>
              <Text style={styles.fieldValue}>{profile?.location || 'Not specified'}</Text>
            </View>

            <View style={styles.fieldItem}>
              <Text style={styles.fieldLabel}>Native Address (Village / Town)</Text>
              <Text style={styles.fieldValue}>{profile?.nativeAddition || 'Not specified'}</Text>
            </View>

            <View style={[styles.fieldItem, { borderBottomWidth: 0 }]}>
              <Text style={styles.fieldLabel}>Assigned KEA Chapter</Text>
              <Text style={styles.fieldValue}>{profile?.branch ? `${profile.branch} Chapter` : 'Kokan Region'}</Text>
            </View>
          </View>
        </View>

        {/* SECTION: PROFESSIONAL EXPERIENCE */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Experience</Text>
            <TouchableOpacity
              onPress={() => router.push('/profile/edit')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Plus size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Current Company Row */}
          {profile?.company || profile?.position ? (
            <View style={styles.currentJobCard}>
              <View style={styles.companyIconBox}>
                <Building size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.jobRoleText}>{profile.position || 'Engineering Professional'}</Text>
                <Text style={styles.jobCompanyText}>{profile.company || 'Company'}</Text>
                {profile?.yearsOfExperience ? (
                  <Text style={styles.jobPeriodText}>{profile.yearsOfExperience} years of experience</Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Experience Timeline */}
          {profile?.experience && profile.experience.length > 0 ? (
            <View style={styles.timelineList}>
              {profile.experience.map((exp, idx) => (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.timelineLineWrapper}>
                    <View style={styles.timelineDot} />
                    {idx < (profile?.experience?.length || 0) - 1 ? (
                      <View style={styles.timelineVerticalLine} />
                    ) : null}
                  </View>
                  <View style={styles.timelineDetails}>
                    <Text style={styles.timelinePosition}>{exp.position}</Text>
                    <Text style={styles.timelineCompany}>{exp.company}</Text>
                    <Text style={styles.timelineDate}>{exp.from} – {exp.to || 'Present'}</Text>
                    {exp.description ? (
                      <Text style={styles.timelineDesc}>{exp.description}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : !profile?.company ? (
            <Text style={styles.emptyText}>No work experience listed yet.</Text>
          ) : null}
        </View>

        {/* SECTION: EDUCATION */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Education</Text>
            <TouchableOpacity
              onPress={() => router.push('/profile/edit')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Plus size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {profile?.education && profile.education.length > 0 ? (
            <View style={styles.timelineList}>
              {profile.education.map((edu, idx) => (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.timelineLineWrapper}>
                    <View style={[styles.timelineDot, { backgroundColor: '#0D9488' }]} />
                    {idx < (profile?.education?.length || 0) - 1 ? (
                      <View style={styles.timelineVerticalLine} />
                    ) : null}
                  </View>
                  <View style={styles.timelineDetails}>
                    <Text style={styles.timelinePosition}>{edu.degree}</Text>
                    <Text style={styles.timelineCompany}>{edu.institution}</Text>
                    <Text style={styles.timelineDate}>{edu.from} – {edu.to || 'Present'}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No education history added yet.</Text>
          )}
        </View>

        {/* SECTION: SKILLS */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Skills</Text>
            <TouchableOpacity
              onPress={() => router.push('/profile/edit')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Edit3 size={15} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {profile?.skills && profile.skills.length > 0 ? (
            <View style={styles.skillsWrapper}>
              {profile.skills.map((skill, idx) => (
                <View key={idx} style={styles.skillBadge}>
                  <Text style={styles.skillBadgeText}>{skill}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Add skills to showcase your engineering expertise.</Text>
          )}
        </View>

        {/* SECTION: CONTACT DETAILS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Details</Text>

          <View style={styles.contactList}>
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => handleEmailPress(user?.email)}
              activeOpacity={0.7}
            >
              <View style={styles.contactIconCircle}>
                <Mail size={16} color="#475569" />
              </View>
              <View style={styles.contactCol}>
                <Text style={styles.contactLabel}>Email Address</Text>
                <Text style={styles.contactLink}>{user?.email || 'Not provided'}</Text>
              </View>
              <ExternalLink size={14} color="#94A3B8" />
            </TouchableOpacity>

            {profile?.phone ? (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => handlePhonePress(profile?.phone)}
                activeOpacity={0.7}
              >
                <View style={styles.contactIconCircle}>
                  <Phone size={16} color="#475569" />
                </View>
                <View style={styles.contactCol}>
                  <Text style={styles.contactLabel}>Phone Number</Text>
                  <Text style={styles.contactLink}>
                    {profile.countryCode ? `${profile.countryCode} ` : '+91 '}{profile.phone}
                  </Text>
                </View>
                <ExternalLink size={14} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* SECTION: MEMBERSHIP INFORMATION */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>KEA Membership</Text>

          <View style={styles.fieldList}>
            <View style={styles.fieldItem}>
              <Text style={styles.fieldLabel}>Member ID</Text>
              <Text style={styles.memberIdVal}>{memberId}</Text>
            </View>

            <View style={styles.fieldItem}>
              <Text style={styles.fieldLabel}>Membership Status</Text>
              <View style={styles.statusInline}>
                <View style={styles.statusDotGreen} />
                <Text style={styles.statusInlineText}>
                  {user?.membershipStatus === 'approved' ? 'Verified & Active' : 'Under Review'}
                </Text>
              </View>
            </View>

            <View style={[styles.fieldItem, { borderBottomWidth: 0 }]}>
              <Text style={styles.fieldLabel}>Discipline</Text>
              <Text style={styles.fieldValue}>{getCategoryDisplay()}</Text>
            </View>
          </View>
        </View>

        {/* SIGN OUT BUTTON */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleLogout}
          activeOpacity={0.75}
        >
          <LogOut size={16} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={styles.signOutBtnText}>Sign Out of KEA</Text>
        </TouchableOpacity>

        {/* Association Footer */}
        <View style={styles.footerWrap}>
          <Text style={styles.footerOrgText}>Kokani Engineers & Professional Association</Text>
          <Text style={styles.footerVersionText}>Official Member Portal · v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerIconBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // PROFILE HEADER CARD (LinkedIn Style)
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  coverBar: {
    height: 64,
    backgroundColor: '#1E3A8A', // Official KEA Royal Blue
  },
  headerBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: -38,
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#E2E8F0',
  },
  avatarFallback: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#1E3A8A',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifiedCheckBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    padding: 1,
  },
  editPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#1E3A8A',
    backgroundColor: '#FFFFFF',
  },
  editPillBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  userHeadline: {
    fontSize: 13.5,
    color: '#475569',
    marginTop: 3,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItemText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  memberIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  resumesActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  resumesActionBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  settingsActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  settingsActionBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },

  // STANDARD HUMAN-MADE CARDS
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  bioText: {
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 21,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 19,
  },

  // FIELD LISTS
  fieldList: {
    gap: 2,
  },
  fieldItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  fieldLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '500',
  },
  memberIdVal: {
    fontSize: 13.5,
    color: '#1E3A8A',
    fontWeight: '700',
  },
  statusInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusInlineText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },

  // CURRENT JOB HIGHLIGHT
  currentJobCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  companyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobRoleText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  jobCompanyText: {
    fontSize: 12.5,
    color: '#475569',
    marginTop: 1,
  },
  jobPeriodText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 3,
  },

  // TIMELINE
  timelineList: {
    gap: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineLineWrapper: {
    alignItems: 'center',
    width: 16,
    marginRight: 10,
    marginTop: 5,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E3A8A',
  },
  timelineVerticalLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
  },
  timelineDetails: {
    flex: 1,
    paddingBottom: 8,
  },
  timelinePosition: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  timelineCompany: {
    fontSize: 12.5,
    color: '#475569',
    marginTop: 1,
  },
  timelineDate: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  timelineDesc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    lineHeight: 17,
  },

  // SKILLS
  skillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  skillBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  skillBadgeText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },

  // CONTACT
  contactList: {
    gap: 8,
    marginTop: 6,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  contactIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactCol: {
    marginLeft: 12,
    flex: 1,
  },
  contactLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  contactLink: {
    fontSize: 13.5,
    color: '#1E3A8A',
    fontWeight: '500',
    marginTop: 1,
  },

  // SIGN OUT
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  signOutBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#DC2626',
  },

  // FOOTER
  footerWrap: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerOrgText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  footerVersionText: {
    fontSize: 10.5,
    color: '#CBD5E1',
    marginTop: 2,
  },
});
