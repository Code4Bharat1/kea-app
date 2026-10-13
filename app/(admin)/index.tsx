import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
  StatusBar,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Circle,
  Line,
  Text as SvgText,
} from 'react-native-svg';
import {
  TrendingUp,
  Users,
  Briefcase,
  FileText,
  Calendar,
  Image as LucideImage,
  MessageSquare,
  UserPlus,
  Wrench,
  GraduationCap,
  MessageCircle,
  Clock,
  ArrowRight,
  Shield,
  LogOut,
  RefreshCw,
  AlertCircle,
  Eye,
} from 'lucide-react-native';

import { useAuth } from '../../src/context/AuthContext';
import { useSidebar } from '../../src/context/SidebarContext';
import { apiClient, getCleanErrorMessage } from '../../src/api/client';
import AdminHeader from '../../src/components/admin/AdminHeader';
import {
  AdminModuleManagerModal,
  AdminModuleType,
  adminModuleListeners,
} from '../../src/components/admin';

interface ModuleStatsItem {
  total: number;
  approved: number;
  pending: number;
}

interface FeedbackStatsItem {
  total: number;
  resolved: number;
  pending: number;
}

interface DashboardStatsData {
  members?: ModuleStatsItem;
  jobs?: ModuleStatsItem;
  blogs?: ModuleStatsItem;
  events?: ModuleStatsItem;
  gallery?: ModuleStatsItem;
  feedback?: FeedbackStatsItem;
  groups?: ModuleStatsItem;
  forums?: ModuleStatsItem;
  seminars?: ModuleStatsItem;
  tools?: ModuleStatsItem;
}

interface ActivityItem {
  title: string;
  description: string;
  time: string;
  type: 'user' | 'job' | 'blog' | 'thread' | 'feedback';
}

interface ChartItem {
  date: string;
  count: number;
}

export default function AdminDashboardScreen() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { openSidebar } = useSidebar();
  const { width } = useWindowDimensions();

  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [activeAdminModule, setActiveAdminModule] = useState<AdminModuleType | null>(null);

  // Listen to openAdminModule requests from Header or Sidebar
  useEffect(() => {
    const handleOpen = (mod: AdminModuleType) => {
      setActiveAdminModule(mod);
    };
    adminModuleListeners.add(handleOpen);
    return () => {
      adminModuleListeners.delete(handleOpen);
    };
  }, []);

  // 1. Authorization Guard
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user) {
        router.replace('/(auth)/login');
      } else if (user.role !== 'admin' && user.role !== 'superadmin') {
        Alert.alert('Unauthorized Access', 'Administrator privileges are required.');
        router.replace('/(tabs)');
      }
    }
  }, [authLoading, isAuthenticated, user]);

  // 2. Fetch Dashboard Data
  const fetchDashboard = useCallback(async () => {
    try {
      setError('');
      console.log('🔄 Fetching admin dashboard data from backend...');
      const res = await apiClient.get<any>('/admin/dashboard');
      console.log('✅ Received admin dashboard response status:', res.status);
      const raw = res.data?.data || res.data;
      if (raw) {
        const statsObj = raw.stats || (raw.members ? raw : null);
        setStats(statsObj);
        setActivities(raw.activities || []);
        setChartData(raw.chartData || []);
      }
    } catch (err: any) {
      console.warn('Dashboard fetch error:', err);
      // Fallback: try fetching /admin/stats if /admin/dashboard returned error
      try {
        console.log('🔄 Attempting fallback fetch to /admin/stats...');
        const statsRes = await apiClient.get<any>('/admin/stats');
        const s = statsRes.data?.data || statsRes.data;
        if (s && s.members) {
          setStats(s);
          return;
        }
      } catch (fallbackErr) {
        console.warn('Fallback /admin/stats failed:', fallbackErr);
      }
      setError(getCleanErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      fetchDashboard();
    }
  }, [user, fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to sign out of the Administrator Console?',
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

  // Module cards definition matching Next.js KEA_Admin moduleCards
  const moduleCards: {
    title: string;
    Icon: any;
    color: string;
    bgLight: string;
    total: number;
    approved: number;
    pending: number;
    moduleKey: AdminModuleType;
  }[] = [
    {
      title: 'Members',
      Icon: Users,
      color: '#3B82F6',
      bgLight: '#EFF6FF',
      total: stats?.members?.total || 0,
      approved: stats?.members?.approved || 0,
      pending: stats?.members?.pending || 0,
      moduleKey: 'members',
    },
    {
      title: 'Jobs',
      Icon: Briefcase,
      color: '#10B981',
      bgLight: '#ECFDF5',
      total: stats?.jobs?.total || 0,
      approved: stats?.jobs?.approved || 0,
      pending: stats?.jobs?.pending || 0,
      moduleKey: 'jobs',
    },
    {
      title: 'Blogs',
      Icon: FileText,
      color: '#8B5CF6',
      bgLight: '#F5F3FF',
      total: stats?.blogs?.total || 0,
      approved: stats?.blogs?.approved || 0,
      pending: stats?.blogs?.pending || 0,
      moduleKey: 'blogs',
    },
    {
      title: 'Events',
      Icon: Calendar,
      color: '#EF4444',
      bgLight: '#FEF2F2',
      total: stats?.events?.total || 0,
      approved: stats?.events?.approved || 0,
      pending: stats?.events?.pending || 0,
      moduleKey: 'events',
    },
    {
      title: 'Gallery',
      Icon: LucideImage,
      color: '#EC4899',
      bgLight: '#FDF2F8',
      total: stats?.gallery?.total || 0,
      approved: stats?.gallery?.approved || 0,
      pending: stats?.gallery?.pending || 0,
      moduleKey: 'gallery',
    },
    {
      title: 'Feedbacks',
      Icon: MessageCircle,
      color: '#F59E0B',
      bgLight: '#FFFBEB',
      total: stats?.feedback?.total || 0,
      approved: stats?.feedback?.resolved || 0,
      pending: stats?.feedback?.pending || 0,
      moduleKey: 'feedback',
    },
    {
      title: 'Groups',
      Icon: UserPlus,
      color: '#6366F1',
      bgLight: '#EEF2FF',
      total: stats?.groups?.total || 0,
      approved: stats?.groups?.approved || 0,
      pending: stats?.groups?.pending || 0,
      moduleKey: 'forums',
    },
    {
      title: 'Forums',
      Icon: MessageSquare,
      color: '#14B8A6',
      bgLight: '#F0FDFA',
      total: stats?.forums?.total || 0,
      approved: stats?.forums?.approved || 0,
      pending: stats?.forums?.pending || 0,
      moduleKey: 'forums',
    },
    {
      title: 'Seminars',
      Icon: GraduationCap,
      color: '#F97316',
      bgLight: '#FFF7ED',
      total: stats?.seminars?.total || 0,
      approved: stats?.seminars?.approved || 0,
      pending: stats?.seminars?.pending || 0,
      moduleKey: 'events',
    },
    {
      title: 'Tools',
      Icon: Wrench,
      color: '#06B6D4',
      bgLight: '#ECFEFF',
      total: stats?.tools?.total || 0,
      approved: stats?.tools?.approved || 0,
      pending: stats?.tools?.pending || 0,
      moduleKey: 'tools',
    },
  ];

  const totalPriorityPending =
    (stats?.members?.pending || 0) +
    (stats?.jobs?.pending || 0) +
    (stats?.blogs?.pending || 0) +
    (stats?.events?.pending || 0);

  // SVG Chart Helper
  const renderChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <View style={styles.chartEmpty}>
          <TrendingUp size={36} color="#CBD5E1" />
          <Text style={styles.chartEmptyText}>No growth data available</Text>
        </View>
      );
    }

    const chartWidth = Math.min(width - 48, 520);
    const chartHeight = 180;
    const paddingLeft = 32;
    const paddingRight = 16;
    const paddingTop = 20;
    const paddingBottom = 30;

    const innerWidth = chartWidth - paddingLeft - paddingRight;
    const innerHeight = chartHeight - paddingTop - paddingBottom;

    const counts = chartData.map((d) => d.count);
    const maxVal = Math.max(...counts, 5);
    const minVal = 0;

    const points = chartData.map((d, index) => {
      const x = paddingLeft + (index / Math.max(chartData.length - 1, 1)) * innerWidth;
      const y = paddingTop + innerHeight - ((d.count - minVal) / (maxVal - minVal)) * innerHeight;
      return { x, y, count: d.count, date: d.date };
    });

    // Generate Path
    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx = (prev.x + curr.x) / 2;
      linePath += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const areaPath = `${linePath} L ${points[points.length - 1].x} ${
      paddingTop + innerHeight
    } L ${points[0].x} ${paddingTop + innerHeight} Z`;

    return (
      <View style={styles.chartWrapper}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <SvgGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
              <Stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </SvgGradient>
          </Defs>

          {/* Grid lines */}
          <Line
            x1={paddingLeft}
            y1={paddingTop}
            x2={chartWidth - paddingRight}
            y2={paddingTop}
            stroke="#E2E8F0"
            strokeDasharray="4 4"
          />
          <Line
            x1={paddingLeft}
            y1={paddingTop + innerHeight / 2}
            x2={chartWidth - paddingRight}
            y2={paddingTop + innerHeight / 2}
            stroke="#E2E8F0"
            strokeDasharray="4 4"
          />
          <Line
            x1={paddingLeft}
            y1={paddingTop + innerHeight}
            x2={chartWidth - paddingRight}
            y2={paddingTop + innerHeight}
            stroke="#CBD5E1"
          />

          {/* Y Axis Labels */}
          <SvgText x={paddingLeft - 8} y={paddingTop + 4} fontSize="10" fill="#94A3B8" textAnchor="end">
            {maxVal}
          </SvgText>
          <SvgText
            x={paddingLeft - 8}
            y={paddingTop + innerHeight / 2 + 4}
            fontSize="10"
            fill="#94A3B8"
            textAnchor="end"
          >
            {Math.round(maxVal / 2)}
          </SvgText>
          <SvgText
            x={paddingLeft - 8}
            y={paddingTop + innerHeight + 4}
            fontSize="10"
            fill="#94A3B8"
            textAnchor="end"
          >
            0
          </SvgText>

          {/* Area fill */}
          <Path d={areaPath} fill="url(#chartGradient)" />

          {/* Stroke Line */}
          <Path d={linePath} stroke="#3B82F6" strokeWidth="2.5" fill="none" />

          {/* Data Points */}
          {points.map((p, idx) => (
            <Circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={points.length > 15 ? 2.5 : 3.5}
              fill="#3B82F6"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
          ))}

          {/* X Axis First and Last Date Label */}
          {chartData.length > 0 && (
            <>
              <SvgText
                x={paddingLeft}
                y={chartHeight - 8}
                fontSize="9.5"
                fill="#94A3B8"
                textAnchor="start"
              >
                {chartData[0].date.slice(5)}
              </SvgText>
              <SvgText
                x={chartWidth - paddingRight}
                y={chartHeight - 8}
                fontSize="9.5"
                fill="#94A3B8"
                textAnchor="end"
              >
                {chartData[chartData.length - 1].date.slice(5)}
              </SvgText>
            </>
          )}
        </Svg>
      </View>
    );
  };

  if (authLoading || (loading && !stats)) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingScreenText}>Loading Administrator Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#07122A" />

      {/* Top Header Bar */}
      <AdminHeader onMenuClick={openSidebar} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
            colors={['#2563EB']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Error Banner */}
        {error ? (
          <View style={styles.errorBox}>
            <AlertCircle size={16} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchDashboard} style={styles.retryBtn}>
              <RefreshCw size={12} color="#FFFFFF" />
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ===== HEADER WITH PENDING ALERT BANNER ===== */}
        {totalPriorityPending > 0 && (
          <View style={styles.priorityAlertBanner}>
            <View style={styles.alertHeaderRow}>
              <View style={styles.alertIconWrap}>
                <Clock size={20} color="#F59E0B" />
                <View style={styles.alertPingDot} />
              </View>
              <View style={styles.alertTextWrap}>
                <Text style={styles.alertTitle}>Priority Moderation Required</Text>
                <Text style={styles.alertSubtitle}>
                  There are <Text style={styles.alertHighlight}>{totalPriorityPending} items</Text> waiting for your approval.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.alertActionBtn}
              onPress={() => setActiveAdminModule('approvals')}
              activeOpacity={0.85}
            >
              <Text style={styles.alertActionBtnText}>Start Review</Text>
              <ArrowRight size={15} color="#0D2847" />
            </TouchableOpacity>
          </View>
        )}

        {/* ===== ALL 10 MODULE STATS CARDS ===== */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>System Modules</Text>
          <TouchableOpacity onPress={fetchDashboard} style={styles.refreshIconBtn}>
            <RefreshCw size={14} color="#64748B" />
          </TouchableOpacity>
        </View>

        <View style={styles.moduleGrid}>
          {moduleCards.map((card, index) => {
            const IconComponent = card.Icon;
            return (
              <TouchableOpacity
                key={index}
                style={styles.moduleCard}
                onPress={() => {
                  if (card.moduleKey === 'blogs') {
                    router.push('/(admin)/blogs' as any);
                  } else {
                    setActiveAdminModule(card.moduleKey);
                  }
                }}
                activeOpacity={0.8}
              >
                {/* Header with Title and Icon */}
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <View style={[styles.cardIconWrap, { backgroundColor: card.color }]}>
                    <IconComponent size={16} color="#FFFFFF" />
                  </View>
                </View>

                {/* Total Count */}
                <View style={styles.cardTotalRow}>
                  <Text style={styles.cardTotal}>{card.total}</Text>
                  <ArrowRight size={14} color="#94A3B8" />
                </View>
                <Text style={styles.cardTotalSub}>Total {card.title}</Text>

                {/* Approved & Pending Footer */}
                <View style={styles.cardFooter}>
                  <View style={styles.cardStatRow}>
                    <Text style={styles.cardStatLabel}>Approved:</Text>
                    <Text style={styles.cardStatApproved}>{card.approved}</Text>
                  </View>

                  <View style={styles.cardStatRow}>
                    <Text style={styles.cardStatLabel}>Pending:</Text>
                    {card.pending > 0 ? (
                      <View style={styles.pendingBadge}>
                        <View style={styles.pendingDot} />
                        <Text style={styles.pendingText}>{card.pending}</Text>
                      </View>
                    ) : (
                      <Text style={styles.pendingZero}>0</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ===== GROWTH GRAPH & SHORTCUTS ===== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <TrendingUp size={18} color="#2563EB" />
            <Text style={styles.sectionCardTitle}>Members Growth (Last 30 Days)</Text>
          </View>

          {renderChart()}

          {/* Quick Shortcuts Widget */}
          <View style={styles.shortcutsSection}>
            <View style={styles.shortcutsHeader}>
              <Wrench size={13} color="#94A3B8" />
              <Text style={styles.shortcutsTitle}>QUICK SHORTCUTS</Text>
            </View>

            <View style={styles.shortcutsGrid}>
              <TouchableOpacity
                style={[styles.shortcutBtn, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}
                onPress={() => router.push('/(admin)/analytics' as any)}
                activeOpacity={0.7}
              >
                <TrendingUp size={15} color="#2563EB" />
                <Text style={[styles.shortcutText, { color: '#1D4ED8' }]}>Analytics</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shortcutBtn, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}
                onPress={() => router.push('/(admin)/admins' as any)}
                activeOpacity={0.7}
              >
                <Shield size={15} color="#7C3AED" />
                <Text style={[styles.shortcutText, { color: '#6D28D9' }]}>Manage Admins</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shortcutBtn, { backgroundColor: '#F0FDFA', borderColor: '#CCFBF1' }]}
                onPress={() => setActiveAdminModule('approvals')}
                activeOpacity={0.7}
              >
                <Clock size={15} color="#0D9488" />
                <Text style={[styles.shortcutText, { color: '#0F766E' }]}>Moderation</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shortcutBtn, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}
                onPress={() => setActiveAdminModule('members')}
                activeOpacity={0.7}
              >
                <Users size={15} color="#2563EB" />
                <Text style={[styles.shortcutText, { color: '#1D4ED8' }]}>Members</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shortcutBtn, { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' }]}
                onPress={() => setActiveAdminModule('jobs')}
                activeOpacity={0.7}
              >
                <Briefcase size={15} color="#059669" />
                <Text style={[styles.shortcutText, { color: '#047857' }]}>Job Review</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shortcutBtn, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}
                onPress={() => router.push('/(admin)/blogs' as any)}
                activeOpacity={0.7}
              >
                <FileText size={15} color="#7C3AED" />
                <Text style={[styles.shortcutText, { color: '#6D28D9' }]}>Blog Review</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shortcutBtn, { backgroundColor: '#FDF2F8', borderColor: '#FCE7F3' }]}
                onPress={() => setActiveAdminModule('gallery')}
                activeOpacity={0.7}
              >
                <LucideImage size={15} color="#DB2777" />
                <Text style={[styles.shortcutText, { color: '#BE185D' }]}>Gallery Hub</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shortcutBtn, { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' }]}
                onPress={() => setActiveAdminModule('feedback')}
                activeOpacity={0.7}
              >
                <MessageSquare size={15} color="#D97706" />
                <Text style={[styles.shortcutText, { color: '#B45309' }]}>Feedbacks</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shortcutBtn, { backgroundColor: '#F0FDFA', borderColor: '#CCFBF1' }]}
                onPress={() => router.push('/(admin)/profile')}
                activeOpacity={0.7}
              >
                <Users size={15} color="#0D9488" />
                <Text style={[styles.shortcutText, { color: '#0F766E' }]}>Admin Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shortcutBtn, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}
                onPress={() => router.push('/(admin)/profile')}
                activeOpacity={0.7}
              >
                <Wrench size={15} color="#475569" />
                <Text style={[styles.shortcutText, { color: '#334155' }]}>Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ===== LIVE ACTIVITY FEED ===== */}
        <View style={styles.sectionCard}>
          <View style={styles.activityHeaderRow}>
            <View style={styles.activityHeaderTitle}>
              <TrendingUp size={18} color="#8B5CF6" />
              <Text style={styles.sectionCardTitle}>Live Activity Feed</Text>
            </View>
            <View style={styles.livePulseBadge}>
              <View style={styles.livePulseDot} />
              <Text style={styles.livePulseText}>Live</Text>
            </View>
          </View>

          {activities.length === 0 ? (
            <View style={styles.activityEmpty}>
              <MessageCircle size={32} color="#CBD5E1" />
              <Text style={styles.activityEmptyText}>No recent activities found</Text>
            </View>
          ) : (
            <View style={styles.activityList}>
              {activities.map((activity, index) => {
                const typeStyles: Record<string, { bg: string; color: string }> = {
                  user: { bg: '#EFF6FF', color: '#2563EB' },
                  job: { bg: '#ECFDF5', color: '#059669' },
                  blog: { bg: '#F5F3FF', color: '#7C3AED' },
                  thread: { bg: '#F0FDFA', color: '#0D9488' },
                  feedback: { bg: '#FFFBEB', color: '#D97706' },
                };

                const IconComponent =
                  activity.type === 'user'
                    ? Users
                    : activity.type === 'job'
                    ? Briefcase
                    : activity.type === 'blog'
                    ? FileText
                    : activity.type === 'thread'
                    ? MessageSquare
                    : MessageCircle;

                const styling = typeStyles[activity.type] || { bg: '#F1F5F9', color: '#475569' };

                return (
                  <View key={index} style={styles.activityItem}>
                    <View style={[styles.activityIconWrap, { backgroundColor: styling.bg }]}>
                      <IconComponent size={16} color={styling.color} />
                    </View>
                    <View style={styles.activityContent}>
                      <View style={styles.activityTopRow}>
                        <Text style={styles.activityTitle}>{activity.title}</Text>
                        <Text style={styles.activityTime}>
                          {new Date(activity.time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      <Text style={styles.activityDate}>
                        {new Date(activity.time).toLocaleDateString()}
                      </Text>
                      <Text style={styles.activityDesc} numberOfLines={2}>
                        "{activity.description}"
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Security Footer */}
        <View style={styles.securityFooter}>
          <Shield size={13} color="#94A3B8" />
          <Text style={styles.securityFooterText}>
            KEA Administrative Core · All actions are logged and authenticated
          </Text>
        </View>
      </ScrollView>

      {/* Strict Admin Moderation and Management Modal */}
      <AdminModuleManagerModal
        visible={!!activeAdminModule}
        module={activeAdminModule}
        onClose={() => setActiveAdminModule(null)}
        onActionComplete={fetchDashboard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#07122A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingScreenText: {
    marginTop: 14,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },

  // Top Bar
  topBar: {
    backgroundColor: '#07122A',
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  topBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogo: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  adminConsoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  adminConsoleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#60A5FA',
    letterSpacing: 0.5,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  profileBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#60A5FA',
  },
  switchViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  switchViewText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#38BDF8',
  },
  logoutBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Error Banner
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    fontSize: 12.5,
    color: '#B91C1C',
    flex: 1,
    lineHeight: 17,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  retryBtnText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Priority Moderation Alert Banner
  priorityAlertBanner: {
    backgroundColor: '#0D2847',
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  alertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  alertPingDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  alertHighlight: {
    color: '#FBBF24',
    fontWeight: '700',
  },
  alertActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  alertActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D2847',
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  refreshIconBtn: {
    padding: 4,
  },

  // Module Grid
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  moduleCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTotal: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardTotalSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 10,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    gap: 4,
  },
  cardStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardStatLabel: {
    fontSize: 11.5,
    color: '#64748B',
  },
  cardStatApproved: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  pendingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D97706',
  },
  pendingText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#B45309',
  },
  pendingZero: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#94A3B8',
  },

  // Section Cards (Graph & Activities)
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 18,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },

  // Chart
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartEmpty: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 10,
    gap: 8,
  },
  chartEmptyText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Shortcuts
  shortcutsSection: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  shortcutsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  shortcutsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  shortcutText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Activity Feed
  activityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  activityHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  livePulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  livePulseText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#15803D',
  },
  activityEmpty: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 10,
    gap: 6,
  },
  activityEmptyText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  activityList: {
    gap: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  activityIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  activityTime: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  activityDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 4,
  },
  activityDesc: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
  },

  // Security Footer
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
  },
  securityFooterText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
