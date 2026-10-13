import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
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
  ArrowLeft,
  Activity,
  BarChart3,
  TrendingUp,
  MapPin,
  Briefcase,
  FileText,
  Calendar,
  MessageSquare,
  PieChart as PieChartIcon,
  RefreshCw,
  AlertCircle,
} from 'lucide-react-native';

import { apiClient, getCleanErrorMessage } from '../../src/api/client';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

interface AnalyticsData {
  locations?: { _id: string; count: number }[];
  categories?: {
    jobs?: { _id: string; count: number }[];
    blogs?: { _id: string; count: number }[];
  };
  feedback?: { _id: string; count: number }[];
  trends?: {
    members?: { _id: { month: number; year: number }; count: number }[];
    content?: {
      jobs: number;
      blogs: number;
      events: number;
    };
  };
}

export default function AdminAnalyticsScreen() {
  const { width } = useWindowDimensions();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchAnalytics = useCallback(async () => {
    try {
      setError('');
      const res = await apiClient.get<any>('/admin/analytics');
      const raw = res.data?.data || res.data;
      setData(raw);
    } catch (err: any) {
      console.error('Error fetching analytics in mobile app:', err);
      setError(getCleanErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  // 1. Growth Area Chart Helper
  const monthlyData = (data?.trends?.members || []).map((item) => ({
    name: item._id ? `${item._id.month}/${item._id.year}` : 'N/A',
    members: item.count || 0,
  }));

  const renderGrowthChart = () => {
    if (monthlyData.length === 0) {
      return (
        <View style={styles.chartEmpty}>
          <TrendingUp size={36} color="#94A3B8" />
          <Text style={styles.chartEmptyText}>No growth trend data available</Text>
        </View>
      );
    }

    const chartWidth = Math.min(width - 64, 480);
    const chartHeight = 190;
    const paddingLeft = 32;
    const paddingRight = 16;
    const paddingTop = 15;
    const paddingBottom = 30;

    const innerWidth = chartWidth - paddingLeft - paddingRight;
    const innerHeight = chartHeight - paddingTop - paddingBottom;

    const counts = monthlyData.map((d) => d.members);
    const maxVal = Math.max(...counts, 5);
    const minVal = 0;

    const points = monthlyData.map((d, index) => {
      const x = paddingLeft + (index / Math.max(monthlyData.length - 1, 1)) * innerWidth;
      const y = paddingTop + innerHeight - ((d.members - minVal) / (maxVal - minVal)) * innerHeight;
      return { x, y, count: d.members, name: d.name };
    });

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
            <SvgGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
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

          {/* Area & Stroke */}
          <Path d={areaPath} fill="url(#analyticsGradient)" />
          <Path d={linePath} stroke="#3B82F6" strokeWidth="3" fill="none" />

          {/* Points */}
          {points.map((p, idx) => (
            <Circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={4}
              fill="#3B82F6"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
          ))}

          {/* X Axis First & Last */}
          {monthlyData.length > 0 && (
            <>
              <SvgText x={paddingLeft} y={chartHeight - 8} fontSize="10" fill="#64748B" textAnchor="start">
                {monthlyData[0].name}
              </SvgText>
              <SvgText
                x={chartWidth - paddingRight}
                y={chartHeight - 8}
                fontSize="10"
                fill="#64748B"
                textAnchor="end"
              >
                {monthlyData[monthlyData.length - 1].name}
              </SvgText>
            </>
          )}
        </Svg>
      </View>
    );
  };

  const totalContent =
    (data?.trends?.content?.jobs || 0) +
    (data?.trends?.content?.blogs || 0) +
    (data?.trends?.content?.events || 0);

  const locations = data?.locations || [];
  const maxLocationCount = Math.max(...locations.map((l) => l.count || 0), 1);

  if (loading && !data) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingScreenText}>Loading Analytics Insights...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1929" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>System Analytics</Text>
          <Text style={styles.headerSubtitle}>Real-time platform insights</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <RefreshCw size={18} color="#93C5FD" />
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
        {/* Error Alert */}
        {error ? (
          <View style={styles.errorBox}>
            <AlertCircle size={16} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchAnalytics} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Hero Glass Banner */}
        <LinearGradient
          colors={['#0D2847', '#1E3A8A']}
          style={styles.heroBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroBadge}>
            <Activity size={12} color="#93C5FD" />
            <Text style={styles.heroBadgeText}>REAL-TIME INSIGHTS</Text>
          </View>
          <Text style={styles.heroHeading}>KEA Platform Growth</Text>
          <Text style={styles.heroDesc}>
            Monitor active engagement, content trends, and geographic member distribution in real-time.
          </Text>

          <View style={styles.heroMetricsRow}>
            <View style={styles.heroMetricCard}>
              <Text style={styles.heroMetricLabel}>GROWTH INDEX</Text>
              <Text style={styles.heroMetricValue}>+12.4%</Text>
            </View>
            <View style={styles.heroMetricCard}>
              <Text style={styles.heroMetricLabel}>SYSTEM STATUS</Text>
              <View style={styles.heroStatusRow}>
                <View style={styles.heroStatusDot} />
                <Text style={styles.heroStatusText}>Healthy</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* 1. Member Growth Trend Chart Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                <TrendingUp size={18} color="#16A34A" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Member Growth Trend</Text>
                <Text style={styles.cardSub}>New registrations past 6 months</Text>
              </View>
            </View>
          </View>
          {renderGrowthChart()}
        </View>

        {/* 2. Content Asset Inventory */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
                <PieChartIcon size={18} color="#9333EA" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Asset Inventory</Text>
                <Text style={styles.cardSub}>Total published items: {totalContent}</Text>
              </View>
            </View>
          </View>

          <View style={styles.inventoryGrid}>
            <View style={[styles.inventoryItem, { borderColor: '#DBEAFE' }]}>
              <View style={[styles.inventoryDot, { backgroundColor: '#3B82F6' }]} />
              <Briefcase size={16} color="#3B82F6" />
              <Text style={styles.inventoryVal}>{data?.trends?.content?.jobs || 0}</Text>
              <Text style={styles.inventoryLbl}>Jobs</Text>
              <Text style={styles.inventoryPct}>
                {totalContent ? Math.round(((data?.trends?.content?.jobs || 0) / totalContent) * 100) : 0}%
              </Text>
            </View>

            <View style={[styles.inventoryItem, { borderColor: '#F3E8FF' }]}>
              <View style={[styles.inventoryDot, { backgroundColor: '#9333EA' }]} />
              <FileText size={16} color="#9333EA" />
              <Text style={styles.inventoryVal}>{data?.trends?.content?.blogs || 0}</Text>
              <Text style={styles.inventoryLbl}>Blogs</Text>
              <Text style={styles.inventoryPct}>
                {totalContent ? Math.round(((data?.trends?.content?.blogs || 0) / totalContent) * 100) : 0}%
              </Text>
            </View>

            <View style={[styles.inventoryItem, { borderColor: '#FEE2E2' }]}>
              <View style={[styles.inventoryDot, { backgroundColor: '#EF4444' }]} />
              <Calendar size={16} color="#EF4444" />
              <Text style={styles.inventoryVal}>{data?.trends?.content?.events || 0}</Text>
              <Text style={styles.inventoryLbl}>Events</Text>
              <Text style={styles.inventoryPct}>
                {totalContent ? Math.round(((data?.trends?.content?.events || 0) / totalContent) * 100) : 0}%
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Top Locations Geographic Distribution */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                <MapPin size={18} color="#DC2626" />
              </View>
              <View>
                <Text style={styles.cardTitle}>User Geo-Distribution</Text>
                <Text style={styles.cardSub}>Top community locations</Text>
              </View>
            </View>
          </View>

          {locations.length === 0 ? (
            <Text style={styles.emptyNotice}>No location data recorded yet.</Text>
          ) : (
            <View style={styles.barList}>
              {locations.slice(0, 7).map((loc, idx) => {
                const count = loc.count || 0;
                const pct = Math.min(100, Math.round((count / maxLocationCount) * 100));
                const color = COLORS[idx % COLORS.length];
                return (
                  <View key={idx} style={styles.barItem}>
                    <View style={styles.barItemHeader}>
                      <Text style={styles.barItemTitle} numberOfLines={1}>
                        {loc._id || 'Unspecified'}
                      </Text>
                      <Text style={[styles.barItemCount, { color }]}>{count}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 4. Support Efficiency Feedback Breakdown */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                <MessageSquare size={18} color="#D97706" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Support Efficiency</Text>
                <Text style={styles.cardSub}>Feedback resolution distribution</Text>
              </View>
            </View>
          </View>

          {(!data?.feedback || data.feedback.length === 0) ? (
            <Text style={styles.emptyNotice}>No feedback items logged.</Text>
          ) : (
            <View style={styles.feedbackRow}>
              {data.feedback.map((f, i) => (
                <View key={i} style={styles.feedbackPill}>
                  <Text style={styles.feedbackPillStatus}>
                    {(f._id || 'general').toUpperCase()}
                  </Text>
                  <Text style={styles.feedbackPillCount}>{f.count || 0}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 5. Categories Intelligence: Jobs & Blogs */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
                <BarChart3 size={18} color="#4F46E5" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Categories Intelligence</Text>
                <Text style={styles.cardSub}>Granular content breakdown</Text>
              </View>
            </View>
          </View>

          {/* Job Categories */}
          <Text style={styles.categorySubhead}>JOB MARKET CATEGORIES</Text>
          {(data?.categories?.jobs || []).length === 0 ? (
            <Text style={styles.emptyNotice}>No job category distribution.</Text>
          ) : (
            <View style={styles.barList}>
              {data!.categories!.jobs!.map((cat, i) => {
                const total = data?.trends?.content?.jobs || 1;
                const pct = Math.min(100, Math.round(((cat.count || 0) / total) * 100));
                return (
                  <View key={i} style={styles.barItem}>
                    <View style={styles.barItemHeader}>
                      <Text style={styles.barItemTitle}>{cat._id || 'General'}</Text>
                      <Text style={[styles.barItemCount, { color: '#2563EB' }]}>{cat.count}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: '#3B82F6' }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Blog Categories */}
          <Text style={[styles.categorySubhead, { marginTop: 20 }]}>BLOG INSIGHTS CATEGORIES</Text>
          {(data?.categories?.blogs || []).length === 0 ? (
            <Text style={styles.emptyNotice}>No blog category distribution.</Text>
          ) : (
            <View style={styles.barList}>
              {data!.categories!.blogs!.map((cat, i) => {
                const total = data?.trends?.content?.blogs || 1;
                const pct = Math.min(100, Math.round(((cat.count || 0) / total) * 100));
                return (
                  <View key={i} style={styles.barItem}>
                    <View style={styles.barItemHeader}>
                      <Text style={styles.barItemTitle}>{cat._id || 'General'}</Text>
                      <Text style={[styles.barItemCount, { color: '#9333EA' }]}>{cat.count}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: '#8B5CF6' }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  refreshBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
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
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#991B1B',
    marginLeft: 8,
  },
  retryBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  heroBanner: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    gap: 6,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.8,
  },
  heroHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroDesc: {
    fontSize: 12.5,
    color: 'rgba(219,234,254,0.85)',
    marginTop: 4,
    lineHeight: 18,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  heroMetricCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroMetricLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#93C5FD',
    letterSpacing: 0.5,
  },
  heroMetricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 3,
  },
  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  heroStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  heroStatusText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4ADE80',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  chartWrapper: {
    alignItems: 'center',
    marginTop: 6,
  },
  chartEmpty: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartEmptyText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
  },
  inventoryGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  inventoryItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  inventoryDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  inventoryVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 6,
  },
  inventoryLbl: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  inventoryPct: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
  },
  barList: {
    gap: 12,
  },
  barItem: {},
  barItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  barItemTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
  },
  barItemCount: {
    fontSize: 12.5,
    fontWeight: '800',
    marginLeft: 8,
  },
  barTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyNotice: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginVertical: 8,
  },
  feedbackRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  feedbackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  feedbackPillStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  feedbackPillCount: {
    fontSize: 13,
    fontWeight: '900',
    color: '#D97706',
  },
  categorySubhead: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
});
