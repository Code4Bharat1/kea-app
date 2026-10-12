import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Image,
  Modal,
  Alert,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import {
  Bell,
  User as UserIcon,
  Settings,
  LogOut,
  Menu,
  ShieldCheck,
  HelpCircle,
  Sparkles,
} from 'lucide-react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { KeaLogoBanner } from './KeaLogoBanner';

interface HeaderProps {
  title?: string;
  showLogo?: boolean;
  showBack?: boolean;
  showMenu?: boolean;
  showNotif?: boolean;
  unreadNotifsCount?: number;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showLogo = false,
  showBack = false,
  showMenu = true,
  showNotif = true,
  unreadNotifsCount = 0,
  rightAction,
}) => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const { openSidebar, closeSidebar, isSidebarOpen } = useSidebar();
  const params = useLocalSearchParams();
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;

      const onHardwareBackPress = () => {
        // If sidebar drawer is currently open, close it
        if (isSidebarOpen) {
          closeSidebar();
          return true;
        }
        return false;
      };

      const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
      return () => sub.remove();
    }, [isSidebarOpen, closeSidebar])
  );

  const getInitials = (name?: string) => {
    if (!name) return 'DK';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to logout?')) {
        logout();
        router.replace('/(auth)/login');
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]);
    }
  };

  const userName = user?.name || 'Danish Khan';
  const userEmail = user?.email || 'member@kea.org';
  const initials = getInitials(userName);

  const paddingTop = (Platform.OS === 'ios' ? insets.top : (StatusBar.currentHeight || insets.top || 0)) + 6;

  return (
    <View style={[styles.headerWrapper, { paddingTop }]}>
      <View style={styles.container}>
        {/* Left Section - Hamburger Menu */}
        <View style={styles.leftSection}>
          {showMenu && (
            <TouchableOpacity
              style={styles.iconBtnContainer}
              onPress={openSidebar}
              activeOpacity={0.7}
            >
              <Menu size={21} color="#0F172A" />
            </TouchableOpacity>
          )}
        </View>

        {/* Center Section - True Middle Standardized Brand Header */}
        <View style={styles.centerSection} pointerEvents="box-none">
          {showLogo ? (
            <View style={styles.logoContainer}>
              <KeaLogoBanner size="small" />
            </View>
          ) : (
            <View style={styles.titleContainer}>
              {(!title || title.includes('Kokani Engineers')) ? (
                <View style={styles.centerTextWrapper}>
                  <View style={styles.brandBadgeRow}>
                    <Sparkles size={15} color="#F59E0B" style={{ marginRight: 5 }} />
                    <Text style={styles.titleLine1} numberOfLines={1}>Kokani Engineers &</Text>
                  </View>
                  <View style={styles.subBrandRow}>
                    <View style={styles.activeDot} />
                    <Text style={styles.titleLine2} numberOfLines={1}>Professional Association</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.centerTextWrapper}>
                  <Text style={styles.titleMain} numberOfLines={1}>{title}</Text>
                  <Text style={styles.titleSub} numberOfLines={1}>
                    KEA • Professional Network
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Right Section - Notification Bell & Professional User Avatar Badge */}
        <View style={styles.rightSection}>
          {rightAction}

          {showNotif && (
            <TouchableOpacity
              style={styles.iconBtnContainer}
              onPress={() => router.push('/notifications')}
              activeOpacity={0.7}
            >
              <Bell size={20} color="#334155" />
              <View style={styles.notifBadge}>
                <View style={styles.notifBadgeInner} />
              </View>
            </TouchableOpacity>
          )}

          {/* Executive Profile Avatar Badge */}
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => setShowProfileMenu(true)}
            activeOpacity={0.8}
          >
            <View style={styles.avatarBorderRing}>
              {user?.profile?.avatar ? (
                <Image source={{ uri: user.profile.avatar }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarBadge}>
                  <Text style={styles.avatarBadgeText}>{initials}</Text>
                </View>
              )}
              {/* Online indicator dot */}
              <View style={styles.onlineStatusDot} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Dropdown Menu Modal */}
      {showProfileMenu && (
        <Modal
          transparent
          visible
          animationType="fade"
          onRequestClose={() => setShowProfileMenu(false)}
          statusBarTranslucent
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowProfileMenu(false)}
          >
            <View style={styles.menuContainer}>
              {/* User Header Info Card */}
              <View style={styles.menuUserInfo}>
                <View style={styles.menuAvatarRow}>
                  <View style={styles.menuAvatarMini}>
                    <Text style={styles.menuAvatarText}>{initials}</Text>
                  </View>
                  <View style={styles.menuUserTextCol}>
                    <Text style={styles.menuUserName} numberOfLines={1}>
                      {userName}
                    </Text>
                    <Text style={styles.menuUserEmail} numberOfLines={1}>
                      {userEmail}
                    </Text>
                  </View>
                </View>

                {/* Member Verification Chip */}
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={13} color="#0D9488" style={{ marginRight: 4 }} />
                  <Text style={styles.verifiedText}>Verified KEA Member</Text>
                </View>
              </View>

              {/* Menu Options */}
              <View style={styles.menuOptionsList}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowProfileMenu(false);
                    router.push('/profile');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
                    <UserIcon size={16} color="#2563EB" />
                  </View>
                  <Text style={styles.menuItemText}>My Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowProfileMenu(false);
                    router.push('/notifications');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: '#F0FDF4' }]}>
                    <Bell size={16} color="#10B981" />
                  </View>
                  <Text style={styles.menuItemText}>Notifications</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowProfileMenu(false);
                    router.push('/settings');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: '#F5F3FF' }]}>
                    <Settings size={16} color="#7C3AED" />
                  </View>
                  <Text style={styles.menuItemText}>Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowProfileMenu(false);
                    router.push('/help');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: '#FFFBEB' }]}>
                    <HelpCircle size={16} color="#D97706" />
                  </View>
                  <Text style={styles.menuItemText}>Help & Support</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.menuDivider} />

              {/* Logout Option */}
              <TouchableOpacity
                style={[styles.menuItem, styles.logoutMenuItem]}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#FEF2F2' }]}>
                  <LogOut size={16} color="#EF4444" />
                </View>
                <Text style={[styles.menuItemText, { color: '#EF4444', fontWeight: '700' }]}>
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 100,
  },
  container: {
    minHeight: 68,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minWidth: 42,
  },
  iconBtnContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  logoContainer: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerTextWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  brandBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleLine1: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 21,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  subBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#0D9488',
    marginRight: 6,
  },
  titleLine2: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0D9488',
    lineHeight: 18,
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  titleMain: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  titleSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 42,
    gap: 10,
  },
  notifBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeInner: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
  },
  profileBtn: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBorderRing: {
    position: 'relative',
    width: 42,
    height: 42,
    borderRadius: 21,
    padding: 2,
    backgroundColor: '#CCFBF1',
    borderWidth: 1.5,
    borderColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadge: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
  },
  onlineStatusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Executive Profile Modal Dropdown
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 52 : 60,
    paddingRight: 14,
  },
  menuContainer: {
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 10,
  },
  menuUserInfo: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  menuAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuAvatarMini: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  menuAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  menuUserTextCol: {
    flex: 1,
  },
  menuUserName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  menuUserEmail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 10,
  },
  verifiedText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F766E',
  },
  menuOptionsList: {
    paddingVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  menuIconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  menuItemText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
  },
  logoutMenuItem: {
    marginVertical: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },

});

