import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { router } from 'expo-router';
import { Colors } from '../src/constants/theme';
import { Header } from '../src/components/common/Header';
import { Card } from '../src/components/common/Card';
import { Input } from '../src/components/common/Input';
import { Button } from '../src/components/common/Button';
import { apiClient, getCleanErrorMessage } from '../src/api/client';
import { securityService } from '../src/utils/security';
import { storage } from '../src/utils/storage';
import { PatternLockModal } from '../src/components/common/PatternLockModal';
import {
  Save,
  ShieldCheck,
  Server,
  LogOut,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Fingerprint,
  Lock,
  Shield,
  Smartphone,
} from 'lucide-react-native';

import { biometricService } from '../src/services/biometricService';

export default function SettingsScreen() {
  const { user, token: activeAuthToken, logout, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'security'>('security');

  // Security Settings State
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [patternEnabled, setPatternEnabled] = useState(false);
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [patternModalMode, setPatternModalMode] = useState<'setup' | 'change'>('setup');

  useEffect(() => {
    const loadSecuritySettings = async () => {
      const bioOn = await biometricService.isEnabled();
      const patOn = await securityService.isPatternEnabled();
      setBiometricsEnabled(bioOn);
      setPatternEnabled(patOn);
    };
    loadSecuritySettings();
  }, []);

  const handleToggleBiometrics = async (val: boolean) => {
    if (val) {
      if (Platform.OS === 'web') {
        Alert.alert('Web Notice', 'Biometric login is available on native Android & iOS devices.');
        return;
      }
      const { hasHardware, isEnrolled } = await biometricService.checkAvailability();
      if (!hasHardware) {
        Alert.alert('Biometric Unavailable', 'Your device does not support biometric authentication.');
        return;
      }
      if (!isEnrolled) {
        Alert.alert('Biometrics Not Set Up', 'Please enroll fingerprint or Face ID in your device settings first.');
        return;
      }

      const activeToken = activeAuthToken || (await storage.getToken());
      if (activeToken) {
        await biometricService.enableBiometric(activeToken);
        setBiometricsEnabled(true);
        Alert.alert('Biometric Login Enabled', 'You can now log in quickly using Fingerprint / Face ID.');
      } else {
        Alert.alert('Session Missing', 'Please log in again to enable biometric login.');
      }
    } else {
      await biometricService.disableBiometric();
      setBiometricsEnabled(false);
    }
  };

  const handleTogglePattern = async (val: boolean) => {
    if (val) {
      setPatternModalMode('setup');
      setShowPatternModal(true);
    } else {
      await securityService.disablePattern();
      setPatternEnabled(false);
      Alert.alert('Pattern Lock Disabled', 'Security pattern lock has been removed.');
    }
  };

  // Developer settings state
  const [showDevSettings, setShowDevSettings] = useState(false);
  const [customIp, setCustomIp] = useState('');
  const [currentBaseUrl, setCurrentBaseUrl] = useState(
    apiClient.defaults.baseURL || process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.172:7101/api'
  );
  const [testingServer, setTestingServer] = useState(false);

  // Account settings
  const [accountData, setAccountData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.profile?.phone || '',
    branch: user?.profile?.branch || '',
    city: user?.profile?.location || '',
    discipline: user?.profile?.category || '',
  });

  // Notification preferences
  const [notificationData, setNotificationData] = useState({
    email: true,
    jobUpdates: true,
    eventReminders: true,
    newsletter: true,
    communityActivity: true,
  });

  // Password change data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      let data: any = null;
      try {
        const res = await apiClient.get('/settings/user');
        data = res.data;
      } catch (err) {
        const resMe = await apiClient.get('/users/me');
        data = (resMe.data as any)?.user || resMe.data;
      }

      if (data) {
        setAccountData({
          name: data.name || user?.name || '',
          email: data.email || user?.email || '',
          phone: data.profile?.phone || data.phone || '',
          branch: data.profile?.branch || '',
          city: data.profile?.location || data.profile?.city || '',
          discipline: data.profile?.category || data.profile?.discipline || '',
        });

        if (data.notificationPreferences) {
          setNotificationData({
            email: data.notificationPreferences.email ?? true,
            jobUpdates: data.notificationPreferences.jobUpdates ?? true,
            eventReminders: data.notificationPreferences.eventReminders ?? true,
            newsletter: data.notificationPreferences.newsletter ?? true,
            communityActivity: data.notificationPreferences.communityActivity ?? true,
          });
        }
      }
    } catch (error) {
      // Fallback to user context
      if (user) {
        setAccountData({
          name: user.name || '',
          email: user.email || '',
          phone: user.profile?.phone || '',
          branch: user.profile?.branch || '',
          city: user.profile?.location || '',
          discipline: user.profile?.category || '',
        });
      }
    }
  };

  const handleUpdateAccount = async () => {
    setLoading(true);
    try {
      try {
        await apiClient.put('/settings/user/account', accountData);
      } catch (err) {
        await apiClient.patch('/users/me', {
          name: accountData.name,
          profile: {
            phone: accountData.phone,
            branch: accountData.branch,
            location: accountData.city,
            category: accountData.discipline,
          },
        });
      }
      if (refreshUser) await refreshUser();
      Alert.alert('Success', 'Account settings updated successfully!');
      fetchUserSettings();
    } catch (error) {
      const msg = getCleanErrorMessage(error);
      Alert.alert('Error', msg || 'Failed to update account settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotifications = async () => {
    setLoading(true);
    try {
      try {
        await apiClient.patch('/users/me/preferences', { notificationPreferences: notificationData });
      } catch (err) {
        await apiClient.put('/settings/user/notifications', notificationData);
      }
      Alert.alert('Success', 'Notification preferences updated successfully!');
    } catch (error) {
      const msg = getCleanErrorMessage(error);
      Alert.alert('Error', msg || 'Failed to update notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword.trim()) {
      Alert.alert('Validation Error', 'Please enter your current password.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Validation Error', 'New passwords do not match.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.put('/settings/user/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      Alert.alert('Success', 'Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      const msg = getCleanErrorMessage(error);
      Alert.alert('Error', msg || 'Failed to change password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestServerConnection = async () => {
    setTestingServer(true);
    try {
      const response = await apiClient.get('/users/dashboard-stats');
      Alert.alert(
        'Server Connected ✅',
        `Successfully connected to backend server!\nStatus: ${response.status} OK\nBase URL: ${currentBaseUrl}`
      );
    } catch (err: any) {
      if (err?.response?.status >= 500) {
        Alert.alert(
          'Server Error (500) 🚨',
          `The backend server is reachable at ${currentBaseUrl} but returned HTTP 500 Internal Server Error.`
        );
      } else if (err?.response?.status) {
        Alert.alert(
          'Server Response Received',
          `Server reached at ${currentBaseUrl} with HTTP Status: ${err.response.status}`
        );
      } else {
        Alert.alert(
          'Connection Failed ⚠️',
          `Could not connect to backend server at:\n${currentBaseUrl}\n\nPlease verify your backend server process is running.`
        );
      }
    } finally {
      setTestingServer(false);
    }
  };

  const handleUpdateBaseUrl = () => {
    if (!customIp.trim()) {
      Alert.alert('Invalid Input', 'Enter a valid computer LAN IP address (e.g., 192.168.1.15).');
      return;
    }
    const newUrl = `http://${customIp.trim()}:7101/api`;
    apiClient.defaults.baseURL = newUrl;
    setCurrentBaseUrl(newUrl);
    Alert.alert('API Config Updated', `Backend API Base URL configured to:\n${newUrl}`);
  };

  const handleLogout = () => {
    const doLogout = async () => {
      await logout();
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to sign out?')) {
        doLogout();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="User settings" showBack showNotif={false} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header Title Section */}
        <View style={styles.headerBox}>
          <Text style={styles.mainTitle}>User settings</Text>
          <Text style={styles.subtitle}>Manage your account settings and security</Text>
        </View>

        {/* Outer Tab Container */}
        <Card style={styles.tabsCard}>
          {/* Horizontal Scrollable Tab Bar Header */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabHeaderRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveTab('account')}
              style={[styles.tabButton, activeTab === 'account' && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, activeTab === 'account' && styles.tabButtonTextActive]}>
                Account settings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveTab('notifications')}
              style={[styles.tabButton, activeTab === 'notifications' && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, activeTab === 'notifications' && styles.tabButtonTextActive]}>
                Notification preferences
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveTab('security')}
              style={[styles.tabButton, activeTab === 'security' && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, activeTab === 'security' && styles.tabButtonTextActive]}>
                Security & privacy
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* TAB 1: Account Settings */}
          {activeTab === 'account' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Account settings</Text>
              <Text style={styles.sectionSubtitle}>Update your profile and personal details</Text>

              <View style={styles.inputGroup}>
                <Input
                  label="Full name"
                  value={accountData.name}
                  onChangeText={(text) => setAccountData((prev) => ({ ...prev, name: text }))}
                  placeholder="Your full name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Input
                  label="Email address"
                  value={accountData.email}
                  onChangeText={(text) => setAccountData((prev) => ({ ...prev, email: text }))}
                  placeholder="Your email address"
                  keyboardType="email-address"
                  editable={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Input
                  label="Phone number"
                  value={accountData.phone}
                  onChangeText={(text) => setAccountData((prev) => ({ ...prev, phone: text }))}
                  placeholder="Your contact number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Input
                  label="Branch / City"
                  value={accountData.branch}
                  onChangeText={(text) => setAccountData((prev) => ({ ...prev, branch: text }))}
                  placeholder="e.g. Ratnagiri / Mumbai"
                />
              </View>

              <View style={styles.inputGroup}>
                <Input
                  label="Engineering & Professional Discipline"
                  value={accountData.discipline}
                  onChangeText={(text) => setAccountData((prev) => ({ ...prev, discipline: text }))}
                  placeholder="e.g. Civil Engineering / IT"
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.actionBtnRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={fetchUserSettings}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={loading}
                  onPress={handleUpdateAccount}
                  style={[styles.primaryBlueBtn, loading && styles.btnDisabled]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Save size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.primaryBlueBtnText}>Save changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TAB 2: Notification Preferences */}
          {activeTab === 'notifications' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Notification preferences</Text>
              <Text style={styles.sectionSubtitle}>Choose how and when KEA contacts you</Text>

              {/* Toggles List */}
              <View style={styles.toggleList}>
                {/* 1. Email */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleLabelBox}>
                    <Text style={styles.toggleTitle}>Email</Text>
                    <Text style={styles.toggleDescription}>Receive email notifications</Text>
                  </View>
                  <Switch
                    trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
                    thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
                    ios_backgroundColor="#E5E7EB"
                    onValueChange={(val) => setNotificationData((prev) => ({ ...prev, email: val }))}
                    value={notificationData.email}
                  />
                </View>

                {/* 2. Job Updates */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleLabelBox}>
                    <Text style={styles.toggleTitle}>Job updates</Text>
                    <Text style={styles.toggleDescription}>New job postings and career opportunities</Text>
                  </View>
                  <Switch
                    trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
                    thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
                    ios_backgroundColor="#E5E7EB"
                    onValueChange={(val) => setNotificationData((prev) => ({ ...prev, jobUpdates: val }))}
                    value={notificationData.jobUpdates}
                  />
                </View>

                {/* 3. Event Reminders */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleLabelBox}>
                    <Text style={styles.toggleTitle}>Event reminders</Text>
                    <Text style={styles.toggleDescription}>Upcoming webinars, seminars, and KEA events</Text>
                  </View>
                  <Switch
                    trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
                    thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
                    ios_backgroundColor="#E5E7EB"
                    onValueChange={(val) => setNotificationData((prev) => ({ ...prev, eventReminders: val }))}
                    value={notificationData.eventReminders}
                  />
                </View>

                {/* 4. KEA Newsletter */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleLabelBox}>
                    <Text style={styles.toggleTitle}>KEA newsletter</Text>
                    <Text style={styles.toggleDescription}>Monthly updates and important announcements</Text>
                  </View>
                  <Switch
                    trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
                    thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
                    ios_backgroundColor="#E5E7EB"
                    onValueChange={(val) => setNotificationData((prev) => ({ ...prev, newsletter: val }))}
                    value={notificationData.newsletter}
                  />
                </View>

                {/* 5. Community Activity */}
                <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
                  <View style={styles.toggleLabelBox}>
                    <Text style={styles.toggleTitle}>Community activity</Text>
                    <Text style={styles.toggleDescription}>
                      Forum replies, group updates, and community milestones
                    </Text>
                  </View>
                  <Switch
                    trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
                    thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
                    ios_backgroundColor="#E5E7EB"
                    onValueChange={(val) => setNotificationData((prev) => ({ ...prev, communityActivity: val }))}
                    value={notificationData.communityActivity}
                  />
                </View>
              </View>

              {/* Update Preferences Button */}
              <View style={styles.actionBtnRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={loading}
                  onPress={handleUpdateNotifications}
                  style={[styles.primaryBlueBtn, loading && styles.btnDisabled]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Save size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.primaryBlueBtnText}>Update preferences</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TAB 3: Security & Privacy */}
          {activeTab === 'security' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Security & privacy</Text>
              <Text style={styles.sectionSubtitle}>Manage app lock, biometrics & account password</Text>

              {/* App Authentication & Hardware Locks */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabelBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Fingerprint size={18} color="#0D9488" style={{ marginRight: 6 }} />
                    <Text style={styles.toggleTitle}>Biometric Login</Text>
                  </View>
                  <Text style={styles.toggleDescription}>Use Fingerprint / Face ID for quick app access</Text>
                </View>
                <Switch
                  trackColor={{ false: '#E5E7EB', true: '#0D9488' }}
                  thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
                  ios_backgroundColor="#E5E7EB"
                  onValueChange={handleToggleBiometrics}
                  value={biometricsEnabled}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleLabelBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Lock size={18} color="#2563EB" style={{ marginRight: 6 }} />
                    <Text style={styles.toggleTitle}>Pattern Lock</Text>
                  </View>
                  <Text style={styles.toggleDescription}>Require a 3x3 security pattern upon app launch</Text>
                </View>
                <Switch
                  trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
                  thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
                  ios_backgroundColor="#E5E7EB"
                  onValueChange={handleTogglePattern}
                  value={patternEnabled}
                />
              </View>

              {patternEnabled && (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: 10,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    marginTop: 8,
                    marginBottom: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onPress={() => {
                    setPatternModalMode('change');
                    setShowPatternModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0D9488' }}>
                    Change Security Pattern ›
                  </Text>
                </TouchableOpacity>
              )}

              <View style={styles.divider} />

              <Text style={styles.changePasswordHeading}>Change password</Text>

              {/* Current Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current password</Text>
                <View style={styles.passwordInputContainer}>
                  <Input
                    value={passwordData.currentPassword}
                    onChangeText={(text) => setPasswordData((prev) => ({ ...prev, currentPassword: text }))}
                    secureTextEntry={!showPassword.current}
                    placeholder="Enter current password"
                    style={{ marginBottom: 0, flex: 1 }}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((prev) => ({ ...prev, current: !prev.current }))}
                  >
                    {showPassword.current ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New password</Text>
                <View style={styles.passwordInputContainer}>
                  <Input
                    value={passwordData.newPassword}
                    onChangeText={(text) => setPasswordData((prev) => ({ ...prev, newPassword: text }))}
                    secureTextEntry={!showPassword.new}
                    placeholder="Enter new password"
                    style={{ marginBottom: 0, flex: 1 }}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((prev) => ({ ...prev, new: !prev.new }))}
                  >
                    {showPassword.new ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm New Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm new password</Text>
                <View style={styles.passwordInputContainer}>
                  <Input
                    value={passwordData.confirmPassword}
                    onChangeText={(text) => setPasswordData((prev) => ({ ...prev, confirmPassword: text }))}
                    secureTextEntry={!showPassword.confirm}
                    placeholder="Confirm new password"
                    style={{ marginBottom: 0, flex: 1 }}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
                  >
                    {showPassword.confirm ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Change Password Action Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={loading}
                onPress={handleChangePassword}
                style={[styles.primaryBlueBtnFull, loading && styles.btnDisabled]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBlueBtnText}>Change password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Collapsible Developer LAN Configuration & System Info */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowDevSettings(!showDevSettings)}
          style={styles.accordionHeader}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Server size={18} color={Colors.textMuted} />
            <Text style={styles.accordionTitle}>Developer & System Settings</Text>
          </View>
          {showDevSettings ? <ChevronUp size={18} color={Colors.textMuted} /> : <ChevronDown size={18} color={Colors.textMuted} />}
        </TouchableOpacity>

        {showDevSettings && (
          <Card style={styles.devCard}>
            <View style={styles.row}>
              <ShieldCheck size={20} color={Colors.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.cardTitle}>Account Logged In</Text>
                <Text style={styles.cardSub}>{user?.email || 'User Account'}</Text>
              </View>
            </View>

            <View style={styles.urlBox}>
              <Text style={styles.urlLabel}>Current Active Base URL:</Text>
              <Text style={styles.urlValue}>{currentBaseUrl}</Text>
            </View>

            <Input
              label="Configure Local Computer IP Address"
              placeholder="e.g. 192.168.1.15"
              value={customIp}
              onChangeText={setCustomIp}
              keyboardType="numeric"
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <Button
                title="Update IP"
                onPress={handleUpdateBaseUrl}
                variant="outline"
                size="small"
                style={{ flex: 1 }}
              />

              <Button
                title={testingServer ? 'Testing...' : 'Test Connection'}
                onPress={handleTestServerConnection}
                loading={testingServer}
                variant="primary"
                size="small"
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        )}

        {/* Sign Out Button */}
        <Button
          title="Sign Out of Account"
          onPress={handleLogout}
          variant="danger"
          icon={<LogOut size={18} color="#FFFFFF" />}
          style={styles.logoutBtn}
        />
      </ScrollView>

      {/* Security Pattern Configuration Modal */}
      <PatternLockModal
        visible={showPatternModal}
        mode={patternModalMode}
        onSuccess={() => {
          setShowPatternModal(false);
          setPatternEnabled(true);
          Alert.alert('Pattern Saved', 'Security pattern lock is now active for KEA App.');
        }}
        onCancel={() => setShowPatternModal(false)}
      />
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
    paddingBottom: 32,
  },
  headerBox: {
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#4B5563',
  },
  tabsCard: {
    padding: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 16,
  },
  tabHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#2563EB',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  tabButtonTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  tabContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  toggleList: {
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  toggleLabelBox: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  toggleDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  primaryBlueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  primaryBlueBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  primaryBlueBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  changePasswordHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  passwordInputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 14,
    zIndex: 10,
    padding: 4,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 12,
  },
  accordionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    marginLeft: 8,
  },
  devCard: {
    marginBottom: 16,
    padding: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  cardSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  urlBox: { backgroundColor: Colors.inputBg, borderRadius: 8, padding: 10, marginVertical: 10 },
  urlLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '700' },
  urlValue: { fontSize: 12, color: Colors.primary, fontWeight: '700', marginTop: 2 },
  logoutBtn: {
    marginTop: 8,
    paddingVertical: 14,
  },
});
