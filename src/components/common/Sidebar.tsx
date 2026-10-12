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
  X,
} from 'lucide-react-native';

interface SidebarProps {
  onClose?: () => void;
  hideHeader?: boolean;
  style?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose, hideHeader = false, style }) => {
  const insets = useSafeAreaInsets();
  const pathname = usePathname() || '/';
  const { logout } = useAuth();

  const handleNavigate = (route: string) => {
    if (onClose) onClose();
    router.push(route as any);
  };

  const handleLogout = () => {
    const doLogout = async () => {
      if (onClose) onClose();
      await logout();
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to logout?')) {
        doLogout();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  const isRouteActive = (route: string) => {
    if (route === '/' || route === '/(tabs)' || route === '/dashboard') {
      return pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index';
    }
    return pathname.startsWith(route);
  };

  const renderMenuItem = (
    label: string,
    route: string,
    IconComponent: any,
    exactMatchCheck?: boolean
  ) => {
    const active = exactMatchCheck
      ? pathname === route
      : isRouteActive(route);

    return (
      <TouchableOpacity
        style={[styles.menuItem, active && styles.menuItemActive]}
        onPress={() => handleNavigate(route)}
        activeOpacity={0.7}
      >
        <View style={styles.menuLeftRow}>
          <IconComponent
            size={19}
            color={active ? '#0D9488' : '#64748B'}
            style={styles.menuIcon}
          />
          <Text style={[styles.menuText, active && styles.menuTextActive]}>{label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.sidebarContainer, style]}>
      {/* Compact Dark Navy Header Banner with Large Centered Logo */}
      {!hideHeader && (
        <View style={[styles.headerSection, { paddingTop: Math.max(8, insets.top + 4) }]}>
          <View style={styles.logoCenterWrapper}>
            <Image
              source={require('../../../assets/logo1.png')}
              style={styles.sidebarLogoImage}
              resizeMode="contain"
            />
          </View>
          {onClose && (
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* SECTION 1: MAIN */}
        <Text style={styles.sectionHeading}>MAIN</Text>
        {renderMenuItem('Dashboard', '/', LayoutGrid)}
        {renderMenuItem('My Profile', '/profile', User)}

        {/* SECTION 2: CAREER */}
        <Text style={styles.sectionHeading}>CAREER</Text>
        {renderMenuItem('Find & Post Jobs', '/jobs', Briefcase)}

        {/* SECTION 3: KNOWLEDGE */}
        <Text style={styles.sectionHeading}>KNOWLEDGE</Text>
        {renderMenuItem('Knowledge Hub', '/knowledge', Library)}
        {renderMenuItem('Tools Library', '/tools', Wrench)}
        {renderMenuItem('Seminars / Webinars', '/events', Users)}
        {renderMenuItem('Technical Insights & Blogs', '/blogs', FileText)}

        {/* SECTION 4: COMMUNITY */}
        <Text style={styles.sectionHeading}>COMMUNITY</Text>
        {renderMenuItem('Forums', '/community', MessageSquare, true)}
        {renderMenuItem('Groups', '/community/groups', Users)}
        {renderMenuItem('Mentorship', '/community/mentorship', Users)}
        {renderMenuItem('Events', '/events', Calendar)}
        {renderMenuItem('Good Wishes & Testimonials', '/gallery', ImageIcon)}

        {/* SECTION 5: ACCOUNT */}
        <View style={styles.divider} />
        <Text style={styles.sectionHeading}>ACCOUNT</Text>
        {renderMenuItem('Settings', '/settings', Settings)}

        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout} activeOpacity={0.7}>
          <View style={styles.menuLeftRow}>
            <LogOut size={19} color="#EF4444" style={styles.menuIcon} />
            <Text style={styles.logoutText}>Logout</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footerSection}>
        <Text style={styles.footerTitle}>KEA Community Resources</Text>
        <Text style={styles.footerSub}>Managed by KEA Board</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebarContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    width: '100%',
  },
  headerSection: {
    backgroundColor: '#0D2847',
    paddingBottom: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 3,
    borderBottomColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 85,
    width: '100%',
  },
  logoCenterWrapper: {
    width: '100%',
    height: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarLogoImage: {
    width: '100%',
    height: '100%',
    maxWidth: 290,
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 10,
  },
  scrollContent: {
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.1,
    marginTop: 16,
    marginBottom: 6,
    marginLeft: 10,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 3,
  },
  menuLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemActive: {
    backgroundColor: '#E6FFFA',
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  menuTextActive: {
    color: '#0D9488',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
    marginHorizontal: 8,
  },
  logoutItem: {
    marginTop: 2,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  footerSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  footerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});
