import React, { useState, useEffect, useCallback } from 'react';
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
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Shield,
  Users,
  Plus,
  Mail,
  Phone,
  Lock,
  User,
  Calendar,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react-native';

import { apiClient, getCleanErrorMessage } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';

interface AdminAccount {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
  profile?: {
    phone?: string;
    [key: string]: any;
  };
}

export default function ManageAdminsScreen() {
  const { user: authUser } = useAuth();

  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [currentAdminId, setCurrentAdminId] = useState<string>('');
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Form Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminAccount | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // 1. Fetch Admin Profile to verify Superadmin
  const fetchProfile = useCallback(async () => {
    try {
      const res = await apiClient.get<any>('/admin/profile');
      const data = res.data?.data || res.data;
      setUserRole(data?.role || authUser?.role || '');
      setCurrentAdminId(data?._id || authUser?._id || '');
    } catch (err) {
      console.error('Error fetching admin profile in mobile app:', err);
      if (authUser?.role) {
        setUserRole(authUser.role);
        setCurrentAdminId(authUser._id || '');
      }
    } finally {
      setLoadingProfile(false);
    }
  }, [authUser]);

  // 2. Fetch All Admins
  const fetchAdmins = useCallback(async () => {
    try {
      const res = await apiClient.get<any>('/admin/admins');
      const data = res.data?.data || res.data || [];
      setAdmins(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching admins in mobile app:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchAdmins();
  }, [fetchProfile, fetchAdmins]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdmins();
  };

  const handleOpenCreate = () => {
    setEditingAdmin(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    });
    setShowPassword(false);
    setModalVisible(true);
  };

  const handleOpenEdit = (admin: AdminAccount) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name || '',
      email: admin.email || '',
      phone: admin.profile?.phone || admin.phone || '',
      password: '',
      confirmPassword: '',
    });
    setShowPassword(false);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert('Required Fields', 'Full Name and Email Address are required.');
      return;
    }

    if (!editingAdmin && !formData.password) {
      Alert.alert('Password Required', 'Password is required to create a new administrator account.');
      return;
    }

    if (formData.password) {
      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Mismatch', 'Passwords do not match.');
        return;
      }
      if (formData.password.length < 6) {
        Alert.alert('Too Short', 'Password must be at least 6 characters.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (editingAdmin) {
        const payload: any = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
        };
        if (formData.password) {
          payload.password = formData.password;
        }

        await apiClient.patch(`/admin/admins/${editingAdmin._id}`, payload);
        Alert.alert('Success', 'Administrator account updated successfully.');
      } else {
        await apiClient.post('/admin/admins', {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
        });
        Alert.alert('Success', 'New administrator account created successfully.');
      }

      setModalVisible(false);
      fetchAdmins();
    } catch (err: any) {
      Alert.alert('Action Failed', getCleanErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (admin: AdminAccount) => {
    Alert.alert(
      'Delete Administrator',
      `Are you sure you want to remove ${admin.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/admin/admins/${admin._id}`);
              Alert.alert('Success', 'Administrator account removed.');
              fetchAdmins();
            } catch (err: any) {
              Alert.alert('Deletion Failed', getCleanErrorMessage(err));
            }
          },
        },
      ]
    );
  };

  if (loadingProfile) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingScreenText}>Verifying administrator privileges...</Text>
      </View>
    );
  }

  // Access Denied if non-superadmin
  if (userRole !== 'superadmin' && authUser?.role !== 'superadmin') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Access Denied</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.deniedBox}>
          <Shield size={56} color="#EF4444" />
          <Text style={styles.deniedTitle}>Superadmin Clearance Required</Text>
          <Text style={styles.deniedDesc}>
            Only Root Super Administrators are authorized to view and manage administrator accounts for KEA.
          </Text>
          <TouchableOpacity style={styles.deniedBackBtn} onPress={() => router.back()}>
            <Text style={styles.deniedBackBtnText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
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
          <Text style={styles.headerTitle}>Manage Admins</Text>
          <Text style={styles.headerSubtitle}>{admins.length} active administrator accounts</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenCreate}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

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
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Shield size={18} color="#93C5FD" />
          <Text style={styles.infoCardText}>
            Superadmin privileges allow you to onboard new staff, update credentials, and revoke admin permissions.
          </Text>
        </View>

        {/* Admins List */}
        {loading && admins.length === 0 ? (
          <ActivityIndicator size="small" color="#3B82F6" style={{ marginTop: 30 }} />
        ) : admins.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Users size={40} color="#64748B" />
            <Text style={styles.emptyText}>No other admin accounts found.</Text>
          </View>
        ) : (
          admins.map((admin) => {
            const isSuperadmin = admin.role === 'superadmin';
            const isSelf = admin._id === currentAdminId;
            const initials = (admin.name || 'AD').slice(0, 2).toUpperCase();

            return (
              <View key={admin._id} style={styles.adminCard}>
                <View style={styles.adminCardHeader}>
                  <View style={styles.adminAvatar}>
                    <Text style={styles.adminAvatarText}>{initials}</Text>
                  </View>
                  <View style={styles.adminInfo}>
                    <Text style={styles.adminName}>{admin.name}</Text>
                    <View style={styles.adminRoleRow}>
                      <View
                        style={[
                          styles.roleBadge,
                          {
                            backgroundColor: isSuperadmin ? 'rgba(168,85,247,0.15)' : 'rgba(59,130,246,0.15)',
                            borderColor: isSuperadmin ? 'rgba(168,85,247,0.3)' : 'rgba(59,130,246,0.3)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.roleBadgeText,
                            { color: isSuperadmin ? '#C084FC' : '#93C5FD' },
                          ]}
                        >
                          {isSuperadmin ? 'SUPER ADMIN' : 'ADMIN'}
                        </Text>
                      </View>
                      {isSelf && (
                        <View style={styles.selfBadge}>
                          <Text style={styles.selfBadgeText}>YOU</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Actions for other admins */}
                  {!isSuperadmin && !isSelf && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.actionBtnEdit}
                        onPress={() => handleOpenEdit(admin)}
                      >
                        <Edit2 size={15} color="#3B82F6" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtnDelete}
                        onPress={() => handleDelete(admin)}
                      >
                        <Trash2 size={15} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Details */}
                <View style={styles.adminMeta}>
                  <View style={styles.adminMetaItem}>
                    <Mail size={13} color="#94A3B8" />
                    <Text style={styles.adminMetaText}>{admin.email}</Text>
                  </View>
                  <View style={styles.adminMetaItem}>
                    <Phone size={13} color="#94A3B8" />
                    <Text style={styles.adminMetaText}>
                      {admin.profile?.phone || admin.phone || 'No phone'}
                    </Text>
                  </View>
                  <View style={styles.adminMetaItem}>
                    <Calendar size={13} color="#94A3B8" />
                    <Text style={styles.adminMetaText}>
                      {admin.createdAt
                        ? new Date(admin.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Create / Edit Admin Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBox}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Shield size={20} color="#3B82F6" />
                <Text style={styles.modalTitle}>
                  {editingAdmin ? 'Edit Admin Account' : 'Create Admin Account'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <View style={styles.inputWrap}>
                  <User size={16} color="#94A3B8" />
                  <TextInput
                    style={styles.inputField}
                    placeholder="Enter full name"
                    placeholderTextColor="#64748B"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <View style={styles.inputWrap}>
                  <Mail size={16} color="#94A3B8" />
                  <TextInput
                    style={styles.inputField}
                    placeholder="admin@kokaniengineers.org"
                    placeholderTextColor="#64748B"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                  />
                </View>
              </View>

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
                <View style={styles.inputWrap}>
                  <Phone size={16} color="#94A3B8" />
                  <TextInput
                    style={styles.inputField}
                    placeholder="+91 9876543210"
                    placeholderTextColor="#64748B"
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {editingAdmin ? 'Password (Leave blank to keep current)' : 'Password *'}
                </Text>
                <View style={styles.inputWrap}>
                  <Lock size={16} color="#94A3B8" />
                  <TextInput
                    style={styles.inputField}
                    placeholder={editingAdmin ? '••••••••' : 'Enter secure password'}
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showPassword}
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} color="#94A3B8" /> : <Eye size={16} color="#94A3B8" />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputWrap}>
                  <Lock size={16} color="#94A3B8" />
                  <TextInput
                    style={styles.inputField}
                    placeholder={editingAdmin ? '••••••••' : 'Confirm password'}
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showPassword}
                    value={formData.confirmPassword}
                    onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Save size={16} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>
                      {editingAdmin ? 'Save Changes' : 'Create Admin Account'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
    paddingBottom: 16,
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
  addBtn: {
    backgroundColor: '#2563EB',
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
  deniedBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deniedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
  },
  deniedDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  deniedBackBtn: {
    marginTop: 24,
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  deniedBackBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13,40,71,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    gap: 10,
  },
  infoCardText: {
    flex: 1,
    fontSize: 12,
    color: '#BFDBFE',
    lineHeight: 17,
  },
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
  },
  adminCard: {
    backgroundColor: '#0D2847',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 12,
  },
  adminCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminAvatarText: {
    color: '#60A5FA',
    fontSize: 15,
    fontWeight: '900',
  },
  adminInfo: {
    flex: 1,
    marginLeft: 12,
  },
  adminName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  adminRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  selfBadge: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  selfBadgeText: {
    color: '#4ADE80',
    fontSize: 9,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnEdit: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnDelete: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminMeta: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 6,
  },
  adminMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminMetaText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#0F233B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalBody: {
    padding: 18,
    gap: 14,
  },
  inputGroup: {},
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#93C5FD',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  inputField: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13.5,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
