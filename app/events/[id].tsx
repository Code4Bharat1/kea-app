import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Share,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { Loader } from '../../src/components/common/Loader';
import { Toast } from '../../src/components/common/Toast';
import { eventsApi } from '../../src/api/events.api';
import { seminarsApi } from '../../src/api/seminars.api';
import { userApi } from '../../src/api/user.api';
import { EventItem, User } from '../../src/types';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Share2,
  Bookmark,
  Mail,
  Phone,
  ExternalLink,
} from 'lucide-react-native';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Registration & Approval states
  const [isRegistered, setIsRegistered] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Tabs for organizers
  const [activeTab, setActiveTab] = useState<'info' | 'requests'>('info');

  // Saved state
  const [isSaved, setIsSaved] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(msg);
    setToastType(type);
  };

  const fetchUserData = async () => {
    try {
      const me = await userApi.getMe();
      setUser(me);
      return me;
    } catch (err) {
      return null;
    }
  };

  const fetchEventDetails = async (currentUser?: User | null) => {
    if (!id) return;
    try {
      let data: EventItem | null = null;
      try {
        data = await eventsApi.getEventById(id);
      } catch (err) {
        data = await seminarsApi.getSeminarById(id);
      }
      if (!data) {
        data = await seminarsApi.getSeminarById(id);
      }
      setEvent(data);

      const activeUser = currentUser || user;
      const userId = activeUser?._id;
      if (userId && data) {
        const regUsers = data.registeredUsers || [];
        const pendUsers = data.pendingAttendees || [];
        setIsRegistered(regUsers.some((u: any) => (u._id || u) === userId));
        setIsPending(pendUsers.some((u: any) => (u._id || u) === userId));
      }
    } catch (err) {
      showToast('Unable to load details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (!id) return;
      const me = await fetchUserData();
      if (isMounted) {
        await fetchEventDetails(me);
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEventDetails();
    if (activeTab === 'requests') {
      await fetchRequests();
    }
    setRefreshing(false);
  };

  const fetchRequests = async () => {
    if (!id) return;
    setRequestsLoading(true);
    try {
      const reqs = await eventsApi.getPendingRequests(id);
      setPendingRequests(reqs);
    } catch (err) {
      setPendingRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!event) return;
    setActionLoading(true);
    try {
      let res: any = null;
      try {
        res = await eventsApi.registerForEvent(event._id);
      } catch (err) {
        await seminarsApi.registerForSeminar(event._id);
        res = { status: 'registered' };
      }
      if (res && res.status === 'pending') {
        setIsPending(true);
        Alert.alert('Registration Request Sent ⏳', 'Waiting for organizer approval.');
      } else {
        setIsRegistered(true);
        Alert.alert('Success 🎉', 'Successfully registered!');
        await fetchEventDetails();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to register.';
      Alert.alert('Registration Error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnregister = () => {
    if (!event) return;
    Alert.alert(
      'Cancel Registration',
      'Are you sure you want to unregister?',
      [
        { text: 'Keep Registration', style: 'cancel' },
        {
          text: 'Unregister',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              try {
                await eventsApi.unregisterFromEvent(event._id);
              } catch (err) {
                await seminarsApi.unregisterFromSeminar(event._id);
              }
              setIsRegistered(false);
              setIsPending(false);
              showToast('Successfully unregistered', 'info');
              await fetchEventDetails();
            } catch (err: any) {
              const msg = err?.response?.data?.message || 'Failed to unregister.';
              showToast(msg, 'error');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRequestAction = async (userId: string, action: 'approve' | 'reject') => {
    if (!id) return;
    try {
      await eventsApi.handleRequestAction(id, userId, action);
      showToast(`Registration request ${action}d successfully`, 'success');
      await fetchRequests();
      await fetchEventDetails();
    } catch (err) {
      showToast(`Failed to ${action} request.`, 'error');
    }
  };

  const handleShare = async () => {
    if (!event) return;
    try {
      await Share.share({
        title: event.title,
        message: `Join me at ${event.title}! Venue: ${event.venue || event.location}`,
      });
    } catch (err) {
      // Ignore share error
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'TBA';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return <Loader message="Loading specifications..." fullScreen />;
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <Header title="Details" showBack />
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Resource not found or expired.</Text>
        </View>
      </View>
    );
  }

  const isOrganizerOrAdmin =
    (event.organizer?._id && event.organizer._id === user?._id) ||
    user?.role === 'admin' ||
    user?.role === 'superadmin';

  const regCount = event.registeredUsers?.length || 0;
  const maxCap = event.maxAttendees || event.capacity;
  const isFull = maxCap ? regCount >= maxCap : false;
  const spotsLeft = maxCap ? Math.max(0, maxCap - regCount) : null;
  const dateToUse = event.startDate || event.date;
  const timeText = event.startTime
    ? `${event.startTime}${event.endTime ? ' - ' + event.endTime : ''}`
    : event.time;

  return (
    <View style={styles.container}>
      <Header
        title={event.title}
        showBack
        rightAction={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={handleShare} style={styles.headerIconBtn}>
              <Share2 size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsSaved(!isSaved)}
              style={styles.headerIconBtn}
            >
              <Bookmark
                size={22}
                color={isSaved ? Colors.primary : Colors.textPrimary}
                fill={isSaved ? Colors.primary : 'none'}
              />
            </TouchableOpacity>
          </View>
        }
      />

      <Toast
        visible={!!toastMessage}
        message={toastMessage || ''}
        type={toastType}
        onDismiss={() => setToastMessage(null)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Main Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.badgeRow}>
            {event.eventType || event.category ? (
              <View style={styles.typeBadgeChip}>
                <Text style={styles.typeBadgeText}>{event.eventType || event.category}</Text>
              </View>
            ) : null}

            {isRegistered ? (
              <View style={[styles.statusBadgeChip, { backgroundColor: '#F0FDF4' }]}>
                <CheckCircle size={13} color="#166534" style={{ marginRight: 4 }} />
                <Text style={[styles.statusBadgeText, { color: '#166534' }]}>Registered</Text>
              </View>
            ) : isPending ? (
              <View style={[styles.statusBadgeChip, { backgroundColor: '#FEF3C7' }]}>
                <Clock size={13} color="#D97706" style={{ marginRight: 4 }} />
                <Text style={[styles.statusBadgeText, { color: '#D97706' }]}>Pending Approval</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.title}>{event.title}</Text>

          {/* Tabs for Organizer / Admin */}
          {isOrganizerOrAdmin ? (
            <View style={styles.tabsHeaderRow}>
              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'info' && styles.tabItemActive]}
                onPress={() => setActiveTab('info')}
              >
                <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
                  Info
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'requests' && styles.tabItemActive]}
                onPress={() => {
                  setActiveTab('requests');
                  fetchRequests();
                }}
              >
                <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
                  Requests
                </Text>
                {event.pendingAttendees && event.pendingAttendees.length > 0 ? (
                  <View style={styles.badgeCountCircle}>
                    <Text style={styles.badgeCountText}>{event.pendingAttendees.length}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>
          ) : null}

          {activeTab === 'info' ? (
            <View style={styles.metaList}>
              <View style={styles.metaRowItem}>
                <Calendar size={18} color={Colors.primary} />
                <Text style={styles.metaRowText}>{formatDate(dateToUse)}</Text>
              </View>

              {timeText ? (
                <View style={styles.metaRowItem}>
                  <Clock size={18} color={Colors.primary} />
                  <Text style={styles.metaRowText}>{timeText}</Text>
                </View>
              ) : null}

              <View style={styles.metaRowItem}>
                <MapPin size={18} color={Colors.primary} />
                <Text style={styles.metaRowText}>{event.venue || event.location}</Text>
              </View>

              {regCount > 0 ? (
                <View style={styles.metaRowItem}>
                  <Users size={18} color={Colors.primary} />
                  <Text style={styles.metaRowText}>{regCount} Registered</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </Card>

        {activeTab === 'info' ? (
          <>
            {/* Date, Time & Venue Card */}
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Date, Time & Location</Text>

              <View style={styles.specGrid}>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Date</Text>
                  <Text style={styles.specValue}>{formatDate(dateToUse)}</Text>
                </View>

                {timeText ? (
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>Time</Text>
                    <Text style={styles.specValue}>{timeText}</Text>
                  </View>
                ) : null}

                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Format</Text>
                  <Text style={styles.specValue}>
                    {event.isOnline ? 'Online Event' : 'In-person'}
                  </Text>
                </View>

                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Venue</Text>
                  <Text style={styles.specValue}>{event.venue || event.location}</Text>
                </View>

                {spotsLeft !== null ? (
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>Spots left</Text>
                    <Text
                      style={[
                        styles.specValue,
                        spotsLeft <= 10 && { color: Colors.danger, fontWeight: '700' },
                      ]}
                    >
                      {spotsLeft} of {maxCap}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Card>

            {/* Description Section */}
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.bodyText}>{event.description}</Text>

              {event.tags && event.tags.length > 0 ? (
                <View style={{ marginTop: 14 }}>
                  <Text style={styles.subHeading}>Topics covered:</Text>
                  <View style={styles.tagsRow}>
                    {event.tags.map((t, idx) => (
                      <View key={idx} style={styles.tagChip}>
                        <Text style={styles.tagChipText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </Card>

            {/* Notes Section */}
            {event.notes ? (
              <Card style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Important Notes</Text>
                <Text style={styles.bodyText}>{event.notes}</Text>
              </Card>
            ) : null}

            {/* Organizer Details */}
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Organizer Details</Text>
              <View style={styles.specGrid}>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Organizer</Text>
                  <Text style={styles.specValue}>
                    {event.organizerName || event.organizer?.name || 'KEA Admin'}
                  </Text>
                </View>

                {event.organizerEmail ? (
                  <TouchableOpacity
                    style={styles.specRow}
                    onPress={() => Linking.openURL(`mailto:${event.organizerEmail}`)}
                  >
                    <Text style={styles.specLabel}>Email</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Mail size={14} color={Colors.primary} style={{ marginRight: 4 }} />
                      <Text style={[styles.specValue, { color: Colors.primary }]}>
                        {event.organizerEmail}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : null}

                {event.organizerPhone ? (
                  <TouchableOpacity
                    style={styles.specRow}
                    onPress={() => Linking.openURL(`tel:${event.organizerPhone}`)}
                  >
                    <Text style={styles.specLabel}>Phone</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Phone size={14} color={Colors.primary} style={{ marginRight: 4 }} />
                      <Text style={[styles.specValue, { color: Colors.primary }]}>
                        {event.organizerPhone}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : null}
              </View>
            </Card>

            {/* Meeting / External Links */}
            {event.meetingLink ? (
              <Card style={[styles.sectionCard, { backgroundColor: '#EFF6FF' }]}>
                <Text style={[styles.sectionTitle, { color: '#1E40AF' }]}>Meeting Link</Text>
                <Text style={{ fontSize: 13, color: '#1E3A8A', marginBottom: 12 }}>
                  This is an online event/webinar. Join using the link below:
                </Text>
                <Button
                  title="Join Meeting"
                  onPress={() => Linking.openURL(event.meetingLink!)}
                  icon={<ExternalLink size={16} color="#FFFFFF" />}
                  style={{ backgroundColor: '#2563EB' }}
                />
              </Card>
            ) : null}

            {event.registrationLink ? (
              <Button
                title="External Registration"
                variant="outline"
                onPress={() => Linking.openURL(event.registrationLink!)}
                icon={<ExternalLink size={16} color={Colors.primary} />}
                style={{ marginBottom: 16 }}
              />
            ) : null}
          </>
        ) : (
          /* Requests View for Organizer */
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              Pending Registration Requests ({pendingRequests.length})
            </Text>

            {requestsLoading ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={{ marginTop: 8, color: Colors.textMuted, fontSize: 13 }}>
                  Loading requests...
                </Text>
              </View>
            ) : pendingRequests.length > 0 ? (
              <View style={{ gap: 12, marginTop: 8 }}>
                {pendingRequests.map((req: any) => (
                  <View key={req._id} style={styles.requestUserRow}>
                    <View style={styles.requestUserAvatar}>
                      <Text style={styles.requestUserAvatarText}>
                        {(req.name?.[0] || 'U').toUpperCase()}
                      </Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.requestUserName}>{req.name || 'KEA Member'}</Text>
                      <Text style={styles.requestUserEmail}>{req.email || ''}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleRequestAction(req._id, 'approve')}
                      >
                        <CheckCircle size={20} color="#166534" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => handleRequestAction(req._id, 'reject')}
                      >
                        <XCircle size={20} color="#991B1B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyRequestsBox}>
                <Users size={36} color={Colors.textMuted} />
                <Text style={styles.emptyRequestsText}>No pending registration requests</Text>
              </View>
            )}
          </Card>
        )}
      </ScrollView>

      {/* Bottom Registration CTA Bar */}
      <View style={styles.bottomCtaBar}>
        {isRegistered ? (
          <Button
            title="Cancel Registration"
            onPress={handleUnregister}
            variant="danger"
            loading={actionLoading}
            style={styles.ctaBtn}
          />
        ) : isPending ? (
          <Button
            title="Pending Approval"
            onPress={() => {}}
            disabled
            variant="outline"
            icon={<Clock size={16} color={Colors.textMuted} />}
            style={styles.ctaBtn}
          />
        ) : (
          <Button
            title={isFull ? 'Event Full' : 'Register Now'}
            onPress={handleRegister}
            disabled={isFull || actionLoading}
            variant="primary"
            loading={actionLoading}
            style={styles.ctaBtn}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 16, paddingBottom: 110 },
  headerIconBtn: { padding: 6 },
  headerCard: { marginBottom: 14, padding: 16 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  typeBadgeChip: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  typeBadgeText: { fontSize: 12, fontWeight: '700', color: '#92400E' },
  statusBadgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  tabsHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 12,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary, fontWeight: '800' },
  badgeCountCircle: {
    backgroundColor: Colors.danger,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  badgeCountText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  metaList: { gap: 10, marginTop: 4 },
  metaRowItem: { flexDirection: 'row', alignItems: 'center' },
  metaRowText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginLeft: 10 },
  sectionCard: { marginBottom: 14, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  subHeading: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  bodyText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagChip: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  tagChipText: { fontSize: 12, color: '#1D4ED8', fontWeight: '600' },
  specGrid: { gap: 10 },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  specLabel: { fontSize: 13, color: Colors.textMuted },
  specValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  requestUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  requestUserAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestUserAvatarText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  requestUserName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  requestUserEmail: { fontSize: 12, color: Colors.textMuted },
  approveBtn: { padding: 8, backgroundColor: '#F0FDF4', borderRadius: 8 },
  rejectBtn: { padding: 8, backgroundColor: '#FEF2F2', borderRadius: 8 },
  emptyRequestsBox: { padding: 24, alignItems: 'center' },
  emptyRequestsText: { marginTop: 8, fontSize: 13, color: Colors.textMuted },
  bottomCtaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 8,
  },
  ctaBtn: { width: '100%', paddingVertical: 13 },
  errorBox: { padding: 32, alignItems: 'center' },
  errorText: { fontSize: 15, color: Colors.textMuted },
});
