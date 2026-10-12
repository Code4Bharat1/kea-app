import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { userApi } from '../../src/api/user.api';
import { eventsApi } from '../../src/api/events.api';
import { DashboardStats, RecentActivityItem } from '../../src/types';
import {
  Briefcase,
  FileText,
  Calendar,
  Users,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Clock,
  ArrowRight,
  ChevronRight,
  MessageSquare,
  Lightbulb,
} from 'lucide-react-native';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { width } = useWindowDimensions();

  const [stats, setStats] = useState<any>({
    applications: 0,
    applicationsChange: 12,
    savedJobs: 0,
    savedJobsChange: 5,
    eventsRegistered: 0,
    eventsChange: 8,
    connections: 0,
    connectionsChange: 15,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const statCardWidth = useMemo(() => (width >= 768 ? '23.5%' : '48.5%'), [width]);

  const loadDashboardData = useCallback(async () => {
    try {
      const [statsData, activityData] = await Promise.allSettled([
        userApi.getDashboardStats(),
        userApi.getRecentActivity(),
      ]);

      if (statsData.status === 'fulfilled' && statsData.value) {
        const d = statsData.value as any;
        setStats({
          applications: d.applications ?? d.applicationsCount ?? 0,
          applicationsChange: d.applicationsChange ?? 12,
          savedJobs: d.savedJobs ?? d.savedJobsCount ?? 0,
          savedJobsChange: d.savedJobsChange ?? 5,
          eventsRegistered: d.eventsRegistered ?? d.eventsCount ?? 0,
          eventsChange: d.eventsChange ?? 8,
          connections: d.connections ?? d.connectionsCount ?? 0,
          connectionsChange: d.connectionsChange ?? 15,
        });
      }
      if (activityData.status === 'fulfilled' && activityData.value) {
        setRecentActivity(activityData.value);
      }
    } catch (err) {
      console.error('Failed loading dashboard data:', err);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), loadDashboardData()]);
    setRefreshing(false);
  }, [refreshUser, loadDashboardData]);

  const userName = user?.name || 'Member';
  const firstName = userName.split(' ')[0] || 'Member';

  const getTimeAgo = useCallback((dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  }, []);

  const getActivityIcon = useCallback((type: string) => {
    switch (type) {
      case 'job_application':
        return <Briefcase size={15} color="#FFFFFF" />;
      case 'event_registration':
        return <Calendar size={15} color="#FFFFFF" />;
      case 'document_download':
        return <FileText size={15} color="#FFFFFF" />;
      case 'connection':
        return <Users size={15} color="#FFFFFF" />;
      default:
        return <Briefcase size={15} color="#FFFFFF" />;
    }
  }, []);

  const getActivityBg = useCallback((type: string) => {
    switch (type) {
      case 'job_application':
        return '#2563EB';
      case 'event_registration':
        return '#059669';
      case 'document_download':
        return '#7C3AED';
      case 'connection':
        return '#EA580C';
      default:
        return '#2563EB';
    }
  }, []);

  return (
    <View style={styles.safeContainer}>
      {/* Fixed Top Navbar */}
      <Header />

      {/* Smooth High-Performance Scrollable Dashboard Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 28, 40) }]}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        scrollEventThrottle={16}
        removeClippedSubviews={Platform.OS === 'android'}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        decelerationRate="normal"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* 1. Welcome Message Hero Banner Card (Dark Navy) */}
        <View style={styles.welcomeBannerCard}>
          <View style={styles.welcomeLeftCol}>
            <View style={styles.sparkleRow}>
              <Sparkles size={18} color="#FBBF24" style={{ marginRight: 6 }} />
              <Text style={styles.welcomeTitle}>Welcome back, {firstName}!</Text>
            </View>
            <Text style={styles.welcomeSub}>
              Here's what's happening with your KEA Profile today.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.updateProfileBtn}
            onPress={() => router.push('/profile/edit')}
            activeOpacity={0.85}
          >
            <Text style={styles.updateBtnText}>Update Profile</Text>
            <ArrowRight size={15} color="#0D2847" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        {/* 2. Your Summary Section */}
        <View style={styles.summarySectionHeader}>
          <TrendingUp size={20} color="#0D9488" style={{ marginRight: 8 }} />
          <Text style={styles.summaryTitle}>Your Summary</Text>
        </View>

        {/* 4 Stat Cards Grid */}
        <View style={styles.summaryGrid}>
          {/* Card 1: Job Applications */}
          <View style={[styles.statCardItem, { width: statCardWidth }]}>
            <View style={styles.statCardHeader}>
              <Text style={styles.statCardLabel} numberOfLines={1}>Job Applications</Text>
              <View style={[styles.iconBadge, { backgroundColor: '#2563EB' }]}>
                <Briefcase size={18} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.statCardNumber}>{stats.applications}</Text>
            <View style={styles.growthRow}>
              <ArrowUpRight size={14} color="#10B981" />
              <Text style={styles.growthText}>+{stats.applicationsChange}%</Text>
              <Text style={styles.growthSub}> from last month</Text>
            </View>
          </View>

          {/* Card 2: Saved Jobs */}
          <View style={[styles.statCardItem, { width: statCardWidth }]}>
            <View style={styles.statCardHeader}>
              <Text style={styles.statCardLabel} numberOfLines={1}>Saved Jobs</Text>
              <View style={[styles.iconBadge, { backgroundColor: '#059669' }]}>
                <FileText size={18} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.statCardNumber}>{stats.savedJobs}</Text>
            <View style={styles.growthRow}>
              <ArrowUpRight size={14} color="#10B981" />
              <Text style={styles.growthText}>+{stats.savedJobsChange}%</Text>
              <Text style={styles.growthSub}> from last month</Text>
            </View>
          </View>

          {/* Card 3: Events Registered */}
          <View style={[styles.statCardItem, { width: statCardWidth }]}>
            <View style={styles.statCardHeader}>
              <Text style={styles.statCardLabel} numberOfLines={1}>Events Registered</Text>
              <View style={[styles.iconBadge, { backgroundColor: '#7C3AED' }]}>
                <Calendar size={18} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.statCardNumber}>{stats.eventsRegistered}</Text>
            <View style={styles.growthRow}>
              <ArrowUpRight size={14} color="#10B981" />
              <Text style={styles.growthText}>+{stats.eventsChange}%</Text>
              <Text style={styles.growthSub}> from last month</Text>
            </View>
          </View>

          {/* Card 4: Connections */}
          <View style={[styles.statCardItem, { width: statCardWidth }]}>
            <View style={styles.statCardHeader}>
              <Text style={styles.statCardLabel} numberOfLines={1}>Connections</Text>
              <View style={[styles.iconBadge, { backgroundColor: '#EA580C' }]}>
                <Users size={18} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.statCardNumber}>{stats.connections}</Text>
            <View style={styles.growthRow}>
              <ArrowUpRight size={14} color="#10B981" />
              <Text style={styles.growthText}>+{stats.connectionsChange}%</Text>
              <Text style={styles.growthSub}> from last month</Text>
            </View>
          </View>
        </View>

        {/* 3. Quick Actions Section */}
        <View style={styles.sectionContainerCard}>
          <Text style={styles.cardHeading}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            {/* Action 1: Upload Resume */}
            <TouchableOpacity
              style={[styles.quickActionCard, styles.actionBlue]}
              onPress={() => router.push('/profile/resumes')}
              activeOpacity={0.8}
            >
              <View style={styles.actionLeftContent}>
                <Text style={styles.actionTitle}>Upload Resume</Text>
                <Text style={styles.actionSub}>Add or update resume</Text>
              </View>
              <ChevronRight size={18} color="#2563EB" />
            </TouchableOpacity>

            {/* Action 2: Job Groups */}
            <TouchableOpacity
              style={[styles.quickActionCard, styles.actionGreen]}
              onPress={() => router.push('/community/groups')}
              activeOpacity={0.8}
            >
              <View style={styles.actionLeftContent}>
                <Text style={styles.actionTitle}>Job Groups</Text>
                <Text style={styles.actionSub}>Browse groups</Text>
              </View>
              <ChevronRight size={18} color="#059669" />
            </TouchableOpacity>
          </View>

          {/* Action 3: Explore KEA Knowledge Hub */}
          <TouchableOpacity
            style={[styles.quickActionCard, styles.actionPurple, { marginTop: 10 }]}
            onPress={() => router.push('/knowledge')}
            activeOpacity={0.8}
          >
            <View style={styles.actionLeftContent}>
              <Text style={styles.actionTitle}>Explore KEA Knowledge Hub</Text>
              <Text style={styles.actionSub}>Open knowledge hub</Text>
            </View>
            <ChevronRight size={18} color="#7C3AED" />
          </TouchableOpacity>
        </View>

        {/* 4. KEA Membership Feedback Section */}
        <View style={styles.sectionContainerCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeading}>KEA Membership Feedback</Text>
            <View style={[styles.iconBadgeMini, { backgroundColor: '#EFF6FF' }]}>
              <MessageSquare size={16} color="#2563EB" />
            </View>
          </View>
          <Text style={styles.cardSub}>Help us improve your experience</Text>

          <TouchableOpacity
            style={styles.feedbackOptionBox}
            onPress={() => router.push({ pathname: '/feedback', params: { category: 'General Feedback' } })}
            activeOpacity={0.7}
          >
            <View style={styles.feedbackOptionLeft}>
              <View style={[styles.feedbackMiniIcon, { backgroundColor: '#EFF6FF' }]}>
                <MessageSquare size={15} color="#2563EB" />
              </View>
              <Text style={styles.feedbackOptionText}>Feedback on membership experience</Text>
            </View>
            <ChevronRight size={17} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.feedbackOptionBox}
            onPress={() => router.push({ pathname: '/feedback', params: { category: 'Feature Request' } })}
            activeOpacity={0.7}
          >
            <View style={styles.feedbackOptionLeft}>
              <View style={[styles.feedbackMiniIcon, { backgroundColor: '#FEF3C7' }]}>
                <Lightbulb size={15} color="#D97706" />
              </View>
              <Text style={styles.feedbackOptionText}>Feature request</Text>
            </View>
            <ChevronRight size={17} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/feedback')}
            activeOpacity={0.7}
            style={styles.feedbackBottomLinkTouch}
          >
            <Text style={styles.tealLinkText}>Submit any other feedback →</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Profile Section */}
        <View style={styles.sectionContainerCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeading}>Profile</Text>
            <TouchableOpacity onPress={() => router.push('/profile')} activeOpacity={0.7}>
              <Text style={styles.tealLinkText}>Manage →</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.bioText}>
            {user?.profile?.bio
              ? user.profile.bio
              : 'Improve your profile and update basic information to showcase your skills and expertise among engineers.'}
          </Text>

          <TouchableOpacity
            style={styles.fullWidthPrimaryBtn}
            onPress={() => router.push('/profile/edit')}
            activeOpacity={0.85}
          >
            <Text style={styles.fullWidthBtnText}>Update Profile</Text>
          </TouchableOpacity>
        </View>

        {/* 6. Recent Activity Section */}
        <View style={[styles.sectionContainerCard, { marginBottom: 0 }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeading}>Recent Activity</Text>
            <Clock size={18} color="#94A3B8" />
          </View>

          {recentActivity.length > 0 ? (
            <View style={{ marginTop: 6 }}>
              {recentActivity.slice(0, 5).map((act, idx) => (
                <View key={act._id || idx} style={styles.activityItemRow}>
                  <View style={[styles.activityIconCircle, { backgroundColor: getActivityBg(act.type) }]}>
                    {getActivityIcon(act.type)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityTitle}>{act.title}</Text>
                    <Text style={styles.activityTime}>{getTimeAgo(act.createdAt)}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyActivityBox}>
              <View style={styles.emptyIconCircle}>
                <TrendingUp size={24} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No recent activity</Text>
              <Text style={styles.emptySub}>Start applying for jobs or registering for events!</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => router.push('/activity' as any)}
            activeOpacity={0.7}
            style={styles.centerLinkTouch}
          >
            <Text style={styles.tealLinkText}>View full activity →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    width: '100%',
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // 1. Hero Banner
  welcomeBannerCard: {
    backgroundColor: '#0D2847',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'column',
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeLeftCol: {
    marginBottom: 14,
  },
  sparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  welcomeSub: {
    fontSize: 12.5,
    color: '#CBD5E1',
    marginTop: 4,
  },
  updateProfileBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  updateBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D2847',
  },

  // 2. Summary Section
  summarySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 10,
  },
  statCardItem: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statCardLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  growthRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  growthText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
    marginLeft: 2,
  },
  growthSub: {
    fontSize: 11,
    color: '#64748B',
  },

  // Section Container Cards
  sectionContainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  // Quick Actions
  quickActionsRow: {
    flexDirection: 'column',
    gap: 10,
    marginTop: 12,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBlue: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  actionGreen: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  actionPurple: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  actionLeftContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },

  iconBadgeMini: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Feedback Section
  feedbackOptionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedbackOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  feedbackMiniIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  feedbackOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  feedbackBottomLinkTouch: {
    marginTop: 4,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  tealLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D9488',
  },

  // Profile Section
  bioText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginVertical: 10,
  },
  fullWidthPrimaryBtn: {
    backgroundColor: '#1D61FF',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#1D61FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  fullWidthBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Recent Activity Section
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  activityTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  emptyActivityBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  emptySub: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  centerLinkTouch: {
    alignItems: 'center',
    marginTop: 14,
  },
});
