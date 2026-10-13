import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import {
  LayoutDashboard,
  Users,
  CheckCircle,
  Briefcase,
  FileText,
  Calendar,
  Image as ImageIcon,
  MessageSquare,
  UserPlus,
  GraduationCap,
  Shield,
  Mail,
  Library,
  TrendingUp,
  Wrench,
  X,
} from 'lucide-react-native';

import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { storage } from '../../utils/storage';
import { openAdminModule, AdminModuleType } from './AdminModuleManagerModal';

interface PendingCounts {
  members: number;
  jobs: number;
  blogs: number;
  events: number;
  feedbacks: number;
  mentors: number;
  total: number;
}

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  style?: any;
}

export default function AdminSidebar({ isOpen, onClose, style }: AdminSidebarProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname() || '/';
  const { user: authUser } = useAuth();

  const [adminRole, setAdminRole] = useState<string>('');
  const [pendingCounts, setPendingCounts] = useState<PendingCounts>({
    members: 0,
    jobs: 0,
    blogs: 0,
    events: 0,
    feedbacks: 0,
    mentors: 0,
    total: 0,
  });

  // 1. Fetch live pending counts matching KEA_Admin sidebar
  const fetchPendingCounts = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        apiClient.get('/admin/members/pending'),
        apiClient.get('/admin/jobs/pending'),
        apiClient.get('/admin/blogs/pending'),
        apiClient.get('/admin/events/pending'),
        apiClient.get('/admin/feedback/pending'),
        apiClient.get('/mentors/admin/all?status=pending&limit=1'),
      ]);

      const getData = (res: PromiseSettledResult<any>) =>
        res.status === 'fulfilled' ? res.value.data : null;

      const membersData = getData(results[0]) || [];
      const jobsData = getData(results[1]) || [];
      const blogsData = getData(results[2]) || [];
      const eventsData = getData(results[3]) || [];
      const feedbacksData = getData(results[4]) || [];
      const mentorsData = getData(results[5]) || {};

      const counts: PendingCounts = {
        members: Array.isArray(membersData) ? membersData.length : 0,
        jobs: Array.isArray(jobsData) ? jobsData.length : 0,
        blogs: Array.isArray(blogsData) ? blogsData.length : 0,
        events: Array.isArray(eventsData) ? eventsData.length : 0,
        feedbacks: Array.isArray(feedbacksData)
          ? feedbacksData.length
          : feedbacksData?.feedbacks?.length || 0,
        mentors: mentorsData?.pagination?.total || 0,
        total: 0,
      };

      counts.total = counts.members + counts.jobs + counts.blogs + counts.events;
      setPendingCounts(counts);
    } catch (error) {
      console.error('Error fetching pending counts:', error);
    }
  }, []);

  // 2. Fetch admin role
  useEffect(() => {
    const fetchAdminRole = async () => {
      try {
        if (authUser?.role) {
          setAdminRole(authUser.role);
          return;
        }
        const stored = await storage.getUserData();
        if (stored?.role) {
          setAdminRole(stored.role);
          return;
        }
        const res = await apiClient.get('/admin/profile');
        if (res.data?.role) {
          setAdminRole(res.data.role);
        }
      } catch (error) {
        console.error('Error fetching admin role:', error);
      }
    };

    fetchAdminRole();
  }, [authUser]);

  useEffect(() => {
    if (isOpen === false) return;
    fetchPendingCounts();
    const interval = setInterval(fetchPendingCounts, 30000);
    return () => clearInterval(interval);
  }, [isOpen, fetchPendingCounts]);

  interface SidebarMenuItem {
    icon: any;
    label: string;
    badge: number | null;
    href: string;
    adminModule?: AdminModuleType;
  }

  const menuItems: SidebarMenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', badge: null, href: '/(admin)' },
    { icon: CheckCircle, label: 'Approvals', badge: pendingCounts.total, href: '/(admin)', adminModule: 'approvals' },
    { icon: TrendingUp, label: 'Analytics', badge: null, href: '/(admin)/analytics' },
    ...(adminRole === 'superadmin'
      ? [{ icon: Shield, label: 'Manage Admins', badge: null, href: '/(admin)/admins' }]
      : []),
    { icon: Users, label: 'Members', badge: pendingCounts.members, href: '/(admin)', adminModule: 'members' },
    { icon: GraduationCap, label: 'Mentors', badge: pendingCounts.mentors, href: '/(admin)', adminModule: 'mentors' },
    { icon: Briefcase, label: 'Jobs', badge: pendingCounts.jobs, href: '/(admin)', adminModule: 'jobs' },
    { icon: FileText, label: 'Blogs', badge: pendingCounts.blogs, href: '/(admin)/blogs' },
    { icon: Calendar, label: 'Events', badge: pendingCounts.events, href: '/(admin)', adminModule: 'events' },
    { icon: Library, label: 'Knowledge Hub', badge: null, href: '/(admin)', adminModule: 'tools' },
    { icon: Briefcase, label: 'Disciplines', badge: null, href: '/(admin)', adminModule: 'tools' },
    { icon: ImageIcon, label: 'Good Wishes & Testimonials', badge: null, href: '/(admin)', adminModule: 'gallery' },
    { icon: MessageSquare, label: 'Feedbacks', badge: pendingCounts.feedbacks, href: '/(admin)', adminModule: 'feedback' },
    { icon: UserPlus, label: 'Groups', badge: null, href: '/(admin)', adminModule: 'forums' },
    { icon: MessageSquare, label: 'Forums', badge: null, href: '/(admin)', adminModule: 'forums' },
    { icon: GraduationCap, label: 'Seminars', badge: null, href: '/(admin)', adminModule: 'events' },
    { icon: Wrench, label: 'Tools', badge: null, href: '/(admin)', adminModule: 'tools' },
    { icon: Mail, label: 'Email & Communications', badge: null, href: '/(admin)', adminModule: 'members' },
  ];

  const isActive = (href: string) => {
    if (href === '/(admin)' || href === '/admin') {
      return pathname === '/(admin)' || pathname === '/admin';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleItemPress = (item: any) => {
    if (onClose) onClose();
    if (item.href === '/(admin)/analytics' || item.href === '/(admin)/admins' || item.href === '/(admin)/blogs') {
      requestAnimationFrame(() => {
        router.navigate(item.href as any);
      });
      return;
    }
    if (item.adminModule) {
      if (!pathname.startsWith('/(admin)')) {
        router.navigate('/(admin)');
      }
      requestAnimationFrame(() => {
        openAdminModule(item.adminModule);
      });
    } else {
      requestAnimationFrame(() => {
        router.navigate('/(admin)');
      });
    }
  };

  return (
    <LinearGradient
      colors={['#0D2847', '#1a3a5c']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top, 10) },
        style,
      ]}
    >
      {/* Top Header with Close Button and Logo */}
      <View style={styles.header}>
        {onClose && (
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Close Sidebar"
          >
            <X size={20} color="rgba(255, 255, 255, 0.8)" />
          </TouchableOpacity>
        )}

        {/* LOGO */}
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../../assets/kea-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* NAV LIST */}
      <ScrollView
        style={styles.scrollNav}
        contentContainerStyle={styles.navContent}
        showsVerticalScrollIndicator={false}
      >
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const hasBadge = typeof item.badge === 'number' && item.badge > 0;

          return (
            <TouchableOpacity
              key={i}
              onPress={() => handleItemPress(item)}
              style={[
                styles.navItem,
                active ? styles.navItemActive : styles.navItemInactive,
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.navItemLeft}>
                <Icon
                  size={19}
                  color={active ? '#FFFFFF' : '#BFDBFE'}
                  style={styles.navIcon}
                />
                <Text
                  style={[
                    styles.navLabel,
                    active ? styles.navLabelActive : styles.navLabelInactive,
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </View>

              {hasBadge && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0D2847',
  },
  header: {
    position: 'relative',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 12,
    zIndex: 10,
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  logoImage: {
    width: 140,
    height: 72,
  },
  scrollNav: {
    flex: 1,
  },
  navContent: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
    paddingBottom: 24,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  navItemInactive: {
    backgroundColor: 'transparent',
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  navIcon: {
    marginRight: 12,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  navLabelInactive: {
    color: '#DBEAFE',
  },
  badgeContainer: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
