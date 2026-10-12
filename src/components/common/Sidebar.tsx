import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/theme';
import { KeaLogoBanner } from './KeaLogoBanner';
import {
  LayoutGrid,
  User,
  Briefcase,
  Library,
  Wrench,
  Users,
  FileText,
  MessageSquare,
  Calendar,
  Image as ImageIcon,
  Settings,
  LogOut,
  ChevronRight,
  Sparkles,
  HelpCircle,
  MessageSquareText,
  X,
} from 'lucide-react-native';

interface SidebarProps {
  onClose?: () => void;
  hideHeader?: boolean;
  style?: any;
  onNavigate?: (route: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onClose,
  hideHeader = false,
  style,
  onNavigate,
}) => {
  const insets = useSafeAreaInsets();
  const pathname = usePathname() || '/';
  const { user, logout } = useAuth();

  const handleNavigate = (route: string) => {
    if (onClose) onClose();

    const isDashboardTarget =
      route === '/' || route === '/(tabs)' || route === '/(tabs)/index' || route === '/dashboard';
    const isCurrentlyDashboard =
      pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index';

    // Prevent duplicate screen in history if already on this screen
    if (isDashboardTarget && isCurrentlyDashboard) {
      return;
    }
    if (!isDashboardTarget && (pathname === route || pathname === `${route}/`)) {
      return;
    }

    if (onNavigate) {
      onNavigate(route);
    }

    // Dashboard navigation: navigate cleanly to /(tabs) without triggering index.tsx splash
    if (isDashboardTarget) {
      router.navigate('/(tabs)' as any);
      return;
    }

    // Mark route as opened from sidebar so that going back returns directly to sidebar
    requestAnimationFrame(() => {
      router.push({
        pathname: route as any,
        params: { fromSidebar: '1' },
      } as any);
    });
  };

  const handleLogout = () => {
    const doLogout = async () => {
      if (onClose) onClose();
      await logout();
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to sign out?')) {
        doLogout();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out of your account?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  const isRouteActive = (route: string) => {
    if (route === '/' || route === '/(tabs)' || route === '/dashboard') {
      return pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index';
    }
    return pathname === route || pathname.startsWith(`${route}/`);
  };



  const renderSectionHeader = (title: string, badge?: string) => (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionHeading}>{title}</Text>
      {badge ? (
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderMenuItem = (
    label: string,
    route: string,
    IconComponent: any,
    iconTint: string,
    exactMatchCheck?: boolean
  ) => {
    const active = exactMatchCheck
      ? pathname === route
      : isRouteActive(route);

    return (
      <TouchableOpacity
        style={[styles.menuItem, active && styles.menuItemActive]}
        onPress={() => handleNavigate(route)}
        activeOpacity={0.72}
      >
        <View style={styles.menuLeftRow}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: active ? '#DBEAFE' : iconTint },
            ]}
          >
            <IconComponent
              size={18}
              color={active ? Colors.primary : '#475569'}
              strokeWidth={active ? 2.3 : 1.8}
            />
          </View>
          <Text style={[styles.menuText, active && styles.menuTextActive]}>
            {label}
          </Text>
        </View>

        {active ? (
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>Active</Text>
          </View>
        ) : (
          <ChevronRight size={16} color="#CBD5E1" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.sidebarContainer, style]}>
      {/* Premium Dark Royal Header Banner */}
      {!hideHeader && (
        <View
          style={[
            styles.headerSection,
            { paddingTop: Math.max(16, insets.top + 8) },
          ]}
        >
          {onClose ? (
            <TouchableOpacity
              style={[styles.closeBtn, { top: Math.max(14, insets.top + 6) }]}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}

          {/* Centered KEA Logo Banner */}
          <View style={styles.logoCenterWrapper}>
            <KeaLogoBanner size="medium" />
          </View>

          {/* Gold Accent Divider */}
          <View style={styles.headerGoldLine} />
        </View>
      )}

      {/* Main Spacious Menu Scroll Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={Platform.OS === 'android'}
      >
        {/* SECTION 1: MAIN NAVIGATION */}
        {renderSectionHeader('MAIN PLATFORM')}
        {renderMenuItem('Dashboard', '/(tabs)', LayoutGrid, '#EFF6FF')}
        {renderMenuItem('Member Directory', '/members', Users, '#F0FDF4')}
        {renderMenuItem('My Profile', '/profile', User, '#FAF5FF')}

        {/* SECTION 2: CAREER & TOOLS */}
        {renderSectionHeader('CAREER & TOOLS')}
        {renderMenuItem('Find & Post Jobs', '/jobs', Briefcase, '#FFFBEB')}
        {renderMenuItem('Engineering Tools', '/tools', Wrench, '#F0F9FF')}

        {/* SECTION 3: KNOWLEDGE & LEARNING */}
        {renderSectionHeader('KNOWLEDGE & INSIGHTS')}
        {renderMenuItem('Knowledge Hub', '/knowledge', Library, '#EEF2FF')}
        {renderMenuItem('Seminars & Events', '/events', Calendar, '#FDF2F8')}
        {renderMenuItem('Insights & Blogs', '/blogs', FileText, '#F0FDFA')}

        {/* SECTION 4: COMMUNITY NETWORK */}
        {renderSectionHeader('COMMUNITY NETWORK')}
        {renderMenuItem('Discussion Forums', '/community', MessageSquare, '#F5F3FF', true)}
        {renderMenuItem('Regional Groups', '/community/groups', Users, '#EFF6FF')}
        {renderMenuItem('Mentorship Network', '/community/mentorship', Sparkles, '#FFFBEB')}
        {renderMenuItem('Good Wishes & Gallery', '/gallery', ImageIcon, '#ECFDF5')}

        {/* SECTION 5: SUPPORT & PREFERENCES */}
        <View style={styles.sectionDivider} />
        {renderSectionHeader('SUPPORT & SETTINGS')}
        {renderMenuItem('Settings', '/settings', Settings, '#F1F5F9')}
        {renderMenuItem('Help & FAQ', '/help', HelpCircle, '#F0F9FF')}
        {renderMenuItem('Send Feedback', '/feedback', MessageSquareText, '#FAF5FF')}

        {/* SIGN OUT BUTTON */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.78}
        >
          <View style={styles.logoutLeftRow}>
            <View style={styles.logoutIconBox}>
              <LogOut size={17} color="#DC2626" />
            </View>
            <View>
              <Text style={styles.logoutTitle}>Sign Out</Text>
              <Text style={styles.logoutSub}>Leave current session</Text>
            </View>
          </View>
          <ChevronRight size={16} color="#FCA5A5" />
        </TouchableOpacity>
      </ScrollView>

      {/* Footer Section */}
      <View
        style={[
          styles.footerSection,
          { paddingBottom: Math.max(16, insets.bottom + 12) },
        ]}
      >
        <View style={styles.footerCard}>
          <View style={styles.footerTopRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.footerTitle}>KEA App v1.0.0</Text>
            <View style={styles.activeTag}>
              <Text style={styles.activeTagText}>Active</Text>
            </View>
          </View>
          <Text style={styles.footerSub}>
            Kokani Engineers & Professional Association
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebarContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    width: '100%',
  },

  // Header Section
  headerSection: {
    backgroundColor: '#0A1330',
    paddingBottom: 14,
    paddingHorizontal: 16,
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCenterWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  closeBtn: {
    position: 'absolute',
    right: 14,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  headerGoldLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#F59E0B',
  },

  // Scroll Content
  scrollContent: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    paddingBottom: 28,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  sectionBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sectionBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
    marginHorizontal: 6,
  },

  // Menu Items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  menuItemActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  menuLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  menuText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
  },
  menuTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  activePill: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  activePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Sign Out
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  logoutLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  logoutIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  logoutSub: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 1,
  },

  // Footer
  footerSection: {
    paddingHorizontal: 14,
    paddingTop: 10,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  footerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
    marginRight: 7,
  },
  footerTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  activeTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  activeTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#15803D',
  },
  footerSub: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 14,
  },
});
