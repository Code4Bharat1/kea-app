import React, { useState, useRef } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import {
  ChevronLeft,
  Bell,
  User as UserIcon,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 320);

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
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  const openSidebar = () => {
    setIsSidebarOpen(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: -DRAWER_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsSidebarOpen(false);
    });
  };

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
  const userEmail = user?.email || '';
  const initials = getInitials(userName);

  const paddingTop = (Platform.OS === 'ios' ? insets.top : (StatusBar.currentHeight || insets.top || 0)) + 10;

  return (
    <View style={[styles.headerWrapper, { paddingTop }]}>
      <View style={styles.container}>
        {/* Left Section - Hamburger Menu / Back Button / 3-Line Title */}
        <View style={styles.leftSection}>
          {showBack ? (
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={26} color="#0F172A" />
            </TouchableOpacity>
          ) : (
            showMenu && (
              <TouchableOpacity
                style={styles.menuButton}
                onPress={openSidebar}
                activeOpacity={0.7}
              >
                <Menu size={26} color="#0F172A" />
              </TouchableOpacity>
            )
          )}

          {showLogo ? (
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/kea-logo-banner.png')}
                style={styles.headerLogoImage}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View style={styles.titleContainer}>
              {(!title || title.includes('Kokani Engineers')) ? (
                <View>
                  <Text style={styles.titleLine1}>Kokani Engineers &</Text>
                  <Text style={styles.titleLine1}>Professionals</Text>
                  <Text style={styles.titleLine1}>Association</Text>
                </View>
              ) : (
                <View>
                  <Text style={styles.titleMain} numberOfLines={1}>{title}</Text>
                  <Text style={styles.titleSub} numberOfLines={1}>
                    Kokani Engineers & Professionals Association
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Right Section - Notification Bell & Circular DK Avatar Badge */}
        <View style={styles.rightSection}>
          {rightAction}

          {showNotif && (
            <TouchableOpacity
              style={styles.notifButton}
              onPress={() => router.push('/notifications')}
              activeOpacity={0.7}
            >
              <Bell size={25} color="#334155" />
              <View style={styles.redDot} />
            </TouchableOpacity>
          )}

          {/* User Profile Badge Button (Exact DK Circle from screenshot) */}
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => setShowProfileMenu(true)}
            activeOpacity={0.8}
          >
            {user?.profile?.avatar ? (
              <Image source={{ uri: user.profile.avatar }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeText}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Dropdown Menu Modal */}
      {showProfileMenu && (
        <Modal transparent visible animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowProfileMenu(false)}
          >
            <View style={styles.menuContainer}>
              {/* User Header Info */}
              <View style={styles.menuUserInfo}>
                <Text style={styles.menuUserName} numberOfLines={1}>
                  {userName}
                </Text>
                <Text style={styles.menuUserEmail} numberOfLines={1}>
                  {userEmail}
                </Text>
              </View>

              {/* Menu Actions */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowProfileMenu(false);
                  router.push('/settings');
                }}
              >
                <Settings size={18} color="#64748B" style={{ marginRight: 10 }} />
                <Text style={styles.menuItemText}>Settings</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <LogOut size={18} color="#EF4444" style={{ marginRight: 10 }} />
                <Text style={[styles.menuItemText, { color: '#EF4444', fontWeight: '700' }]}>
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Slide-Over Sidebar Drawer Modal */}
      {isSidebarOpen && (
        <Modal transparent visible animationType="none" onRequestClose={closeSidebar}>
          <View style={styles.drawerOverlayFull}>
            <TouchableOpacity
              style={styles.drawerBackdrop}
              activeOpacity={1}
              onPress={closeSidebar}
            />
            <Animated.View
              style={[
                styles.drawerContentContainer,
                { transform: [{ translateX: slideAnim }] },
              ]}
            >
              <Sidebar onClose={closeSidebar} />
            </Animated.View>
          </View>
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 100,
  },
  container: {
    minHeight: 74,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 14,
  },
  menuButton: {
    paddingRight: 14,
    justifyContent: 'center',
  },
  backButton: {
    paddingRight: 12,
    justifyContent: 'center',
  },
  logoContainer: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerLogoImage: {
    height: 40,
    width: 170,
    maxWidth: '100%',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleLine1: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  titleMain: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  titleSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
    marginTop: 2,
    letterSpacing: 0.1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  notifButton: {
    position: 'relative',
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  redDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 9.5,
    height: 9.5,
    borderRadius: 4.75,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  profileBtn: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#00BBA6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },

  // Profile Menu Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 48 : 56,
    paddingRight: 14,
  },
  menuContainer: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  menuUserInfo: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  menuUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuUserEmail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },

  // Slide-Over Drawer Styles
  drawerOverlayFull: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  drawerContentContainer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 16,
    zIndex: 10,
  },
});
