import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Mail,
  Lock,
  Camera,
  Save,
  X,
  Eye,
  EyeOff,
  Shield,
  Calendar,
  LogOut,
  CheckCircle,
  Briefcase,
  FileText,
  Phone,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react-native';

import { useAuth } from '../../src/context/AuthContext';
import { apiClient, getCleanErrorMessage } from '../../src/api/client';
import { storage } from '../../src/utils/storage';

interface AdminData {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  avatar?: string;
  createdAt?: string;
  profile?: {
    phone?: string;
    avatar?: string;
    [key: string]: any;
  };
}

interface AdminStats {
  membersApproved: number;
  jobsApproved: number;
  blogsApproved: number;
  eventsApproved: number;
  totalReviews: number;
}

export default function AdminProfileScreen() {
  const { user: authUser, logout, refreshUser } = useAuth();

  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState<boolean>(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [stats, setStats] = useState<AdminStats>({
    membersApproved: 0,
    jobsApproved: 0,
    blogsApproved: 0,
    eventsApproved: 0,
    totalReviews: 0,
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // 1. Fetch Profile
  const fetchAdminProfile = useCallback(async () => {
    try {
      const res = await apiClient.get<any>('/admin/profile');
      if (res.data) {
        const d = res.data;
        setAdmin(d);
        setFormData({
          name: d.name || '',
          email: d.email || '',
          phone: d.profile?.phone || d.phone || '',
          avatar: d.profile?.avatar || d.avatar || '',
        });
      }
    } catch (err: any) {
      console.warn('Error fetching admin profile:', err);
      if (authUser) {
        setAdmin(authUser);
        setFormData({
          name: authUser.name || '',
          email: authUser.email || '',
          phone: authUser.profile?.phone || '',
          avatar: authUser.profile?.avatar || '',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  // 2. Fetch Stats
  const fetchAdminStats = useCallback(async () => {
    try {
      const res = await apiClient.get<any>('/admin/stats');
      const d = res.data?.data || res.data;
      if (d) {
        setStats({
          membersApproved: d.members?.approved || 0,
          jobsApproved: d.jobs?.approved || 0,
          blogsApproved: d.blogs?.approved || 0,
          eventsApproved: d.events?.approved || 0,
          totalReviews: d.feedback?.resolved || 0,
        });
      }
    } catch (err) {
      console.warn('Error fetching admin stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchAdminProfile();
    fetchAdminStats();
  }, [fetchAdminProfile, fetchAdminStats]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setStatusMessage(null);
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    setStatusMessage(null);
  };

  // 3. Save Profile Changes
  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your full name.' });
      return;
    }
    if (!formData.email.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await apiClient.patch<any>('/admin/profile', formData);
      if (res.data) {
        setAdmin(res.data);
        await storage.setUserData(res.data);
        await refreshUser();
      }

      setIsEditing(false);
      setStatusMessage({ type: 'success', text: 'Admin profile updated successfully!' });
    } catch (err: any) {
      const msg = getCleanErrorMessage(err) || 'Failed to update admin profile.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  // 4. Change Password
  const handleChangePassword = async () => {
    if (!passwordData.currentPassword) {
      setStatusMessage({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (!passwordData.newPassword) {
      setStatusMessage({ type: 'error', text: 'Please enter your new password.' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      await apiClient.patch('/admin/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setShowPasswordChange(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setStatusMessage({ type: 'success', text: 'Password updated successfully!' });
    } catch (err: any) {
      const msg = getCleanErrorMessage(err) || 'Failed to change password. Please check your current password.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (admin) {
      setFormData({
        name: admin.name || '',
        email: admin.email || '',
        phone: admin.profile?.phone || admin.phone || '',
        avatar: admin.profile?.avatar || admin.avatar || '',
      });
    }
    setIsEditing(false);
    setStatusMessage(null);
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to sign out of the administrator portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AD';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>Loading Admin Profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>My Profile</Text>
        <TouchableOpacity
          style={styles.navLogoutBtn}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={18} color="#F87171" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Subtitle */}
        <View style={styles.headerTitleWrap}>
          <Text style={styles.pageHeaderTitle}>Administrator Account</Text>
          <Text style={styles.pageHeaderSub}>Manage your credentials, security and preferences</Text>
        </View>

        {/* Status Notification Message */}
        {statusMessage && (
          <View
            style={[
              styles.statusBanner,
              statusMessage.type === 'success' ? styles.statusSuccess : styles.statusError,
            ]}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 size={16} color="#059669" />
            ) : (
              <AlertCircle size={16} color="#DC2626" />
            )}
            <Text
              style={[
                styles.statusBannerText,
                statusMessage.type === 'success' ? styles.statusTextSuccess : styles.statusTextError,
              ]}
            >
              {statusMessage.text}
            </Text>
          </View>
        )}

        {/* Main Profile Card */}
        <View style={styles.profileCard}>
          {/* Cover Gradient */}
          <LinearGradient
            colors={['#0D9488', '#06B6D4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coverGradient}
          />

          <View style={styles.profileCardBody}>
            {/* Avatar & Action Button Row */}
            <View style={styles.avatarActionRow}>
              <View style={styles.avatarWrapper}>
                {formData.avatar ? (
                  <Image source={{ uri: formData.avatar }} style={styles.avatarImage} />
                ) : (
                  <LinearGradient
                    colors={['#0D9488', '#06B6D4']}
                    style={styles.avatarPlaceholder}
                  >
                    <Text style={styles.avatarInitials}>
                      {getInitials(formData.name || admin?.name)}
                    </Text>
                  </LinearGradient>
                )}

                {isEditing && (
                  <TouchableOpacity
                    style={styles.cameraBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      Alert.prompt
                        ? Alert.prompt(
                            'Avatar Image URL',
                            'Enter direct URL for profile picture:',
                            (url) => url && handleInputChange('avatar', url)
                          )
                        : Alert.alert('Avatar', 'Enter avatar URL in input field.');
                    }}
                  >
                    <Camera size={15} color="#475569" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtonsWrap}>
                {!isEditing ? (
                  <TouchableOpacity
                    style={styles.editProfileBtn}
                    onPress={() => setIsEditing(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.editProfileBtnText}>Edit Profile</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.editingActionsRow}>
                    <TouchableOpacity
                      style={[styles.saveBtn, saving && styles.btnDisabled]}
                      onPress={handleSaveProfile}
                      disabled={saving}
                      activeOpacity={0.8}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Save size={15} color="#FFFFFF" />
                          <Text style={styles.saveBtnText}>Save</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={handleCancelEdit}
                      disabled={saving}
                      activeOpacity={0.8}
                    >
                      <X size={15} color="#FFFFFF" />
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Profile Fields List */}
            <View style={styles.fieldsContainer}>
              {/* Full Name */}
              <View style={styles.fieldItem}>
                <View style={styles.fieldLabelRow}>
                  <User size={14} color="#0D9488" />
                  <Text style={styles.fieldLabel}>FULL NAME</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={formData.name}
                    onChangeText={(v) => handleInputChange('name', v)}
                    placeholder="Enter full name"
                    placeholderTextColor="#94A3B8"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{admin?.name || 'Not set'}</Text>
                )}
              </View>

              {/* Email Address */}
              <View style={styles.fieldItem}>
                <View style={styles.fieldLabelRow}>
                  <Mail size={14} color="#0D9488" />
                  <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={formData.email}
                    onChangeText={(v) => handleInputChange('email', v)}
                    placeholder="admin@kea.org"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#94A3B8"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{admin?.email || 'Not set'}</Text>
                )}
              </View>

              {/* Phone Number */}
              <View style={styles.fieldItem}>
                <View style={styles.fieldLabelRow}>
                  <Phone size={14} color="#0D9488" />
                  <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={formData.phone}
                    onChangeText={(v) => handleInputChange('phone', v)}
                    placeholder="+91 98765 43210"
                    keyboardType="phone-pad"
                    placeholderTextColor="#94A3B8"
                  />
                ) : (
                  <Text style={styles.fieldValue}>
                    {admin?.profile?.phone || admin?.phone || 'Not provided'}
                  </Text>
                )}
              </View>

              {/* Role Badge */}
              <View style={styles.fieldItem}>
                <View style={styles.fieldLabelRow}>
                  <Shield size={14} color="#0D9488" />
                  <Text style={styles.fieldLabel}>CLEARANCE ROLE</Text>
                </View>
                <View style={styles.roleBadgeContainer}>
                  <Shield size={12} color="#0D9488" strokeWidth={2.5} />
                  <Text style={styles.roleBadgeText}>
                    {admin?.role?.toUpperCase() || 'ADMINISTRATOR'}
                  </Text>
                </View>
              </View>

              {/* Member Since */}
              <View style={styles.fieldItem}>
                <View style={styles.fieldLabelRow}>
                  <Calendar size={14} color="#0D9488" />
                  <Text style={styles.fieldLabel}>MEMBER SINCE</Text>
                </View>
                <Text style={styles.fieldValue}>
                  {admin?.createdAt
                    ? new Date(admin.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'System Registration'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Security / Password Change Section */}
        <View style={styles.securityCard}>
          <View style={styles.securityHeaderRow}>
            <View style={styles.securityHeaderLeft}>
              <View style={styles.securityIconWrap}>
                <Lock size={18} color="#0D9488" />
              </View>
              <View>
                <Text style={styles.securityTitle}>Security & Credentials</Text>
                <Text style={styles.securitySub}>Manage your account access password</Text>
              </View>
            </View>

            {!showPasswordChange && (
              <TouchableOpacity
                style={styles.changePasswordToggleBtn}
                onPress={() => setShowPasswordChange(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.changePasswordToggleText}>Change Password</Text>
              </TouchableOpacity>
            )}
          </View>

          {showPasswordChange && (
            <View style={styles.passwordFormContainer}>
              {/* Current Password */}
              <View style={styles.passwordInputGroup}>
                <Text style={styles.passwordInputLabel}>Current Password</Text>
                <View style={styles.passwordInputWrap}>
                  <TextInput
                    style={styles.passwordTextInput}
                    secureTextEntry={!showCurrentPassword}
                    value={passwordData.currentPassword}
                    onChangeText={(v) => handlePasswordChange('currentPassword', v)}
                    placeholder="Enter current password"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={16} color="#94A3B8" />
                    ) : (
                      <Eye size={16} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View style={styles.passwordInputGroup}>
                <Text style={styles.passwordInputLabel}>New Password</Text>
                <View style={styles.passwordInputWrap}>
                  <TextInput
                    style={styles.passwordTextInput}
                    secureTextEntry={!showNewPassword}
                    value={passwordData.newPassword}
                    onChangeText={(v) => handlePasswordChange('newPassword', v)}
                    placeholder="Enter new password (min. 6 chars)"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff size={16} color="#94A3B8" />
                    ) : (
                      <Eye size={16} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.passwordInputGroup}>
                <Text style={styles.passwordInputLabel}>Confirm New Password</Text>
                <View style={styles.passwordInputWrap}>
                  <TextInput
                    style={styles.passwordTextInput}
                    secureTextEntry={!showConfirmPassword}
                    value={passwordData.confirmPassword}
                    onChangeText={(v) => handlePasswordChange('confirmPassword', v)}
                    placeholder="Re-type new password"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} color="#94A3B8" />
                    ) : (
                      <Eye size={16} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.passwordActionsRow}>
                <TouchableOpacity
                  style={[styles.updatePasswordBtn, saving && styles.btnDisabled]}
                  onPress={handleChangePassword}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Save size={15} color="#FFFFFF" />
                      <Text style={styles.updatePasswordBtnText}>Update Password</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelPasswordBtn}
                  onPress={() => {
                    setShowPasswordChange(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  }}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  <X size={15} color="#FFFFFF" />
                  <Text style={styles.cancelPasswordBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Activity & Performance Stats Grid */}
        <View style={styles.statsSectionHeader}>
          <Text style={styles.statsSectionTitle}>Activity Performance</Text>
          <Text style={styles.statsSectionSub}>Review approval milestones across system records</Text>
        </View>

        <View style={styles.statsGrid}>
          {/* Card 1: Members Approved */}
          <View style={styles.statCard}>
            <View style={styles.statCardContent}>
              <Text style={styles.statCardLabel}>Members Approved</Text>
              <Text style={styles.statCardValue}>{stats.membersApproved}</Text>
            </View>
            <View style={[styles.statIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <User size={20} color="#2563EB" />
            </View>
          </View>

          {/* Card 2: Jobs Approved */}
          <View style={styles.statCard}>
            <View style={styles.statCardContent}>
              <Text style={styles.statCardLabel}>Jobs Approved</Text>
              <Text style={styles.statCardValue}>{stats.jobsApproved}</Text>
            </View>
            <View style={[styles.statIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Briefcase size={20} color="#059669" />
            </View>
          </View>

          {/* Card 3: Blogs Approved */}
          <View style={styles.statCard}>
            <View style={styles.statCardContent}>
              <Text style={styles.statCardLabel}>Blogs Approved</Text>
              <Text style={styles.statCardValue}>{stats.blogsApproved}</Text>
            </View>
            <View style={[styles.statIconWrap, { backgroundColor: '#F5F3FF' }]}>
              <FileText size={20} color="#7C3AED" />
            </View>
          </View>

          {/* Card 4: Total Reviews / Feedback */}
          <View style={styles.statCard}>
            <View style={styles.statCardContent}>
              <Text style={styles.statCardLabel}>Total Reviews</Text>
              <Text style={styles.statCardValue}>{stats.totalReviews}</Text>
            </View>
            <View style={[styles.statIconWrap, { backgroundColor: '#FFF7ED' }]}>
              <CheckCircle size={20} color="#EA580C" />
            </View>
          </View>
        </View>

        {/* Bottom Log Out Action Button */}
        <TouchableOpacity
          style={styles.bottomLogoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={16} color="#EF4444" />
          <Text style={styles.bottomLogoutText}>Sign Out from Administrator Console</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDFA',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 14,
    color: '#0F766E',
    fontSize: 14,
    fontWeight: '600',
  },

  // Top Nav
  topNav: {
    backgroundColor: '#0F172A',
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNavTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  navLogoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  headerTitleWrap: {
    marginBottom: 16,
  },
  pageHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  pageHeaderSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },

  // Status Banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECDD3',
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  statusTextSuccess: {
    color: '#065F46',
  },
  statusTextError: {
    color: '#991B1B',
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 18,
  },
  coverGradient: {
    height: 90,
  },
  profileCardBody: {
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  avatarActionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: -45,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#E2E8F0',
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#FFFFFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },

  actionButtonsWrap: {
    paddingBottom: 4,
  },
  editProfileBtn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editProfileBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editingActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#64748B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },

  // Fields Container
  fieldsContainer: {
    gap: 14,
  },
  fieldItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F766E',
    letterSpacing: 0.4,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  fieldInput: {
    height: 42,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14.5,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  roleBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.5,
  },

  // Security Card
  securityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 18,
  },
  securityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  securityHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  securityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  securityTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  securitySub: {
    fontSize: 11.5,
    color: '#64748B',
  },
  changePasswordToggleBtn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  changePasswordToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  passwordFormContainer: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  passwordInputGroup: {},
  passwordInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  passwordInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    height: 44,
    paddingHorizontal: 12,
  },
  passwordTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  eyeBtn: {
    padding: 6,
  },
  passwordActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  updatePasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  updatePasswordBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelPasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#64748B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelPasswordBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Stats Performance
  statsSectionHeader: {
    marginBottom: 12,
  },
  statsSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statsSectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardContent: {
    flex: 1,
  },
  statCardLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  statCardValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  // Bottom Logout
  bottomLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingVertical: 13,
    borderRadius: 12,
  },
  bottomLogoutText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#DC2626',
  },
});
