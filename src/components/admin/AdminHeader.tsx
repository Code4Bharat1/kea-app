import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Bell,
  Menu,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Trash2,
  User,
  LogOut,
  Settings,
  ChevronDown,
} from 'lucide-react-native';

import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { storage } from '../../utils/storage';
import { openAdminModule } from './AdminModuleManagerModal';

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  relatedId?: string;
  createdAt: string;
}

interface AdminHeaderProps {
  onMenuClick?: () => void;
  title?: string;
  subtitle?: string;
}

export default function AdminHeader({
  onMenuClick,
  title = 'Dashboard',
  subtitle = 'Overview of members, jobs, and content across KEA.',
}: AdminHeaderProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user: authUser, logout } = useAuth();

  const [admin, setAdmin] = useState<{ name?: string; email?: string; role?: string } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 1. Get admin data from storage / auth context
  useEffect(() => {
    const loadAdminData = async () => {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const stored = localStorage.getItem('adminData');
          if (stored) {
            setAdmin(JSON.parse(stored));
            return;
          }
        }
        const userStored = await storage.getUserData();
        if (userStored) {
          setAdmin(userStored);
          return;
        }
        if (authUser) {
          setAdmin(authUser);
        }
      } catch (err) {
        console.error('Error loading admin data:', err);
      }
    };

    loadAdminData();
  }, [authUser]);

  // 2. Fetch notifications & unread count
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch notifications list
      const res = await apiClient.get('/notifications');
      if (Array.isArray(res.data)) {
        setNotifications(res.data);
      } else if (res.data?.notifications && Array.isArray(res.data.notifications)) {
        setNotifications(res.data.notifications);
      }

      // Fetch unread count
      const unreadRes = await apiClient.get('/notifications/unread-count');
      if (typeof unreadRes.data?.count === 'number') {
        setUnreadCount(unreadRes.data.count);
      } else {
        // Fallback: calculate from array
        const unread = (res.data || []).filter((n: NotificationItem) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  // Get initials from name
  const getInitials = (name?: string) => {
    if (!name) return 'AD';
    return name
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    const confirmLogout = async () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
      }
      await logout();
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to logout?')) {
        confirmLogout();
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: confirmLogout },
      ]);
    }
  };

  const handleProfileClick = () => {
    setShowProfileMenu(false);
    router.push('/(admin)/profile');
  };

  const handleSettingsClick = () => {
    setShowProfileMenu(false);
    router.push('/(admin)/profile');
  };

  const markAsRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((notif) => (notif._id === id ? { ...notif, read: true } : notif))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.patch('/notifications/mark-all-read', {});
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiClient.delete(`/notifications/${id}`);
      const deletedNotif = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((notif) => notif._id !== id));
      if (deletedNotif && !deletedNotif.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const clearAll = async () => {
    try {
      await apiClient.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
      setShowNotifications(false);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Navigate to related admin module
    setShowNotifications(false);
    if (notification.type === 'member') {
      openAdminModule('members');
    } else if (notification.type === 'job') {
      openAdminModule('jobs');
    } else if (notification.type === 'blog') {
      openAdminModule('blogs');
    } else if (notification.type === 'event') {
      openAdminModule('events');
    } else {
      openAdminModule('approvals');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'member':
        return (
          <View style={[styles.notifIconBadge, { backgroundColor: '#DBEAFE' }]}>
            <CheckCircle size={18} color="#2563EB" />
          </View>
        );
      case 'job':
        return (
          <View style={[styles.notifIconBadge, { backgroundColor: '#DCFCE7' }]}>
            <Info size={18} color="#16A34A" />
          </View>
        );
      case 'blog':
        return (
          <View style={[styles.notifIconBadge, { backgroundColor: '#F3E8FF' }]}>
            <AlertCircle size={18} color="#9333EA" />
          </View>
        );
      case 'event':
        return (
          <View style={[styles.notifIconBadge, { backgroundColor: '#FFEDD5' }]}>
            <Info size={18} color="#EA580C" />
          </View>
        );
      default:
        return (
          <View style={[styles.notifIconBadge, { backgroundColor: '#F3F4F6' }]}>
            <Info size={18} color="#4B5563" />
          </View>
        );
    }
  };

  const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'Just now';
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';

    return 'Just now';
  };

  const adminName = admin?.name || authUser?.name || 'Admin';
  const adminRole = admin?.role === 'admin' ? 'Admin' : 'Super Admin';
  const adminEmail = admin?.email || authUser?.email || 'admin@kokaniengineers.org';
  const initials = getInitials(adminName);

  return (
    <>
      <LinearGradient
        colors={['#0D2847', '#1a3a5c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.headerContainer,
          { paddingTop: Math.max(insets.top, 12) + 8 },
        ]}
      >
        <View style={styles.headerInner}>
          {/* Left Section - Mobile Menu + Title */}
          <View style={styles.leftSection}>
            <TouchableOpacity
              onPress={onMenuClick}
              style={styles.menuButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Menu size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
          </View>

          {/* Right Section - Date, Notifications, Profile */}
          <View style={styles.rightSection}>
            {width > 420 && (
              <Text style={styles.todayText}>Today - {today}</Text>
            )}

            {/* Notifications Button */}
            <TouchableOpacity
              onPress={() => setShowNotifications(true)}
              style={styles.iconButton}
              activeOpacity={0.7}
            >
              <Bell size={20} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Profile Button */}
            <TouchableOpacity
              onPress={() => setShowProfileMenu(true)}
              style={styles.profileButton}
              activeOpacity={0.7}
            >
              {width > 560 && (
                <View style={styles.profileTextWrapper}>
                  <Text style={styles.adminNameText} numberOfLines={1}>
                    {adminName}
                  </Text>
                  <Text style={styles.adminRoleText} numberOfLines={1}>
                    {adminRole}
                  </Text>
                </View>
              )}
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <ChevronDown
                size={14}
                color="#FFFFFF"
                style={{ marginLeft: 2 }}
              />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* ============================================================== */}
      {/* NOTIFICATIONS MODAL / DROPDOWN                                 */}
      {/* ============================================================== */}
      <Modal
        visible={showNotifications}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNotifications(false)}
        >
          <View
            style={[
              styles.dropdownCard,
              { width: Math.min(width - 32, 400), maxHeight: '82%' },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View style={styles.dropdownHeader}>
              <View style={styles.dropdownHeaderTop}>
                <Text style={styles.dropdownTitle}>Notifications</Text>
                <TouchableOpacity
                  onPress={() => setShowNotifications(false)}
                  style={styles.closeBtn}
                >
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {unreadCount > 0 && (
                <View style={styles.unreadRow}>
                  <Text style={styles.unreadCountText}>
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </Text>
                  <TouchableOpacity onPress={markAllAsRead}>
                    <Text style={styles.markAllReadText}>Mark all as read</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* List */}
            <ScrollView style={styles.notifScroll} showsVerticalScrollIndicator={false}>
              {loading ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator size="small" color="#2563EB" />
                  <Text style={styles.centerBoxText}>Loading notifications...</Text>
                </View>
              ) : notifications.length === 0 ? (
                <View style={styles.centerBox}>
                  <Bell size={42} color="#CBD5E1" />
                  <Text style={[styles.centerBoxText, { marginTop: 8 }]}>
                    No notifications
                  </Text>
                </View>
              ) : (
                notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification._id}
                    style={[
                      styles.notifItem,
                      !notification.read && styles.notifItemUnread,
                    ]}
                    onPress={() => handleNotificationClick(notification)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.notifRow}>
                      {getNotificationIcon(notification.type)}
                      <View style={styles.notifContent}>
                        <View style={styles.notifTopLine}>
                          <Text style={styles.notifTitle} numberOfLines={1}>
                            {notification.title}
                          </Text>
                          {!notification.read && <View style={styles.unreadDot} />}
                        </View>
                        <Text style={styles.notifMessage} numberOfLines={2}>
                          {notification.message}
                        </Text>
                        <View style={styles.notifFooterRow}>
                          <Text style={styles.notifTime}>
                            {getTimeAgo(notification.createdAt)}
                          </Text>
                          <View style={styles.notifActionRow}>
                            {!notification.read && (
                              <TouchableOpacity
                                onPress={() => markAsRead(notification._id)}
                                style={styles.inlineMarkReadBtn}
                              >
                                <Text style={styles.inlineMarkReadText}>
                                  Mark as read
                                </Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              onPress={() => deleteNotification(notification._id)}
                              style={styles.deleteBtn}
                            >
                              <Trash2 size={14} color="#94A3B8" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* Footer */}
            {notifications.length > 0 && (
              <View style={styles.dropdownFooter}>
                <TouchableOpacity
                  onPress={clearAll}
                  style={styles.clearAllBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearAllText}>Clear all notifications</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ============================================================== */}
      {/* PROFILE DROPDOWN / MENU MODAL                                  */}
      {/* ============================================================== */}
      <Modal
        visible={showProfileMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowProfileMenu(false)}
        >
          <View
            style={[styles.profileMenuCard, { width: Math.min(width - 40, 260) }]}
            onStartShouldSetResponder={() => true}
          >
            {/* User Info Header */}
            <View style={styles.profileHeaderBox}>
              <Text style={styles.profileCardName} numberOfLines={1}>
                {adminName}
              </Text>
              <Text style={styles.profileCardEmail} numberOfLines={1}>
                {adminEmail}
              </Text>
            </View>

            {/* Menu Items */}
            <View style={styles.profileMenuItems}>
              <TouchableOpacity
                onPress={handleProfileClick}
                style={styles.profileMenuItem}
                activeOpacity={0.7}
              >
                <User size={18} color="#64748B" />
                <Text style={styles.profileMenuText}>My Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSettingsClick}
                style={styles.profileMenuItem}
                activeOpacity={0.7}
              >
                <Settings size={18} color="#64748B" />
                <Text style={styles.profileMenuText}>Settings</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                onPress={handleLogout}
                style={styles.profileMenuItem}
                activeOpacity={0.7}
              >
                <LogOut size={18} color="#EF4444" />
                <Text style={[styles.profileMenuText, { color: '#EF4444', fontWeight: '600' }]}>
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#BFDBFE',
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayText: {
    fontSize: 12,
    color: '#BFDBFE',
    marginRight: 4,
  },
  iconButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileTextWrapper: {
    marginRight: 8,
    alignItems: 'flex-end',
  },
  adminNameText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  adminRoleText: {
    color: '#BFDBFE',
    fontSize: 11,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Modal Overlays
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 70 : 60,
    paddingRight: 16,
  },
  dropdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownHeader: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  dropdownHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dropdownTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
    borderRadius: 6,
  },
  unreadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadCountText: {
    fontSize: 13,
    color: '#64748B',
  },
  markAllReadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  notifScroll: {
    maxHeight: 380,
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBoxText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
  },
  notifItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  notifItemUnread: {
    backgroundColor: '#EFF6FF',
  },
  notifRow: {
    flexDirection: 'row',
    gap: 12,
  },
  notifIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  notifContent: {
    flex: 1,
  },
  notifTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    marginLeft: 6,
  },
  notifMessage: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  notifFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  notifTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  notifActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inlineMarkReadBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  inlineMarkReadText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 4,
    borderRadius: 4,
  },
  dropdownFooter: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  clearAllBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  clearAllText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },

  // Profile Card Modal
  profileMenuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileHeaderBox: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  profileCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  profileCardEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  profileMenuItems: {
    paddingVertical: 6,
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 12,
  },
  profileMenuText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
});
