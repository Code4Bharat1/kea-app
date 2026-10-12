import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Colors } from '../src/constants/theme';
import { Header } from '../src/components/common/Header';
import { Card } from '../src/components/common/Card';
import { Loader } from '../src/components/common/Loader';
import { EmptyState } from '../src/components/common/EmptyState';
import { notificationsApi } from '../src/api/notifications.api';
import { NotificationItem } from '../src/types';
import { CheckCheck, Calendar, Briefcase, Info } from 'lucide-react-native';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifs = async () => {
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await notificationsApi.getNotifications();
        if (isMounted) setNotifications(data);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(
        notifications.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed mark all read:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifs();
    setRefreshing(false);
  };

  const getNotifIcon = (type?: string) => {
    switch (type) {
      case 'event': return <Calendar size={20} color={Colors.primary} />;
      case 'job': return <Briefcase size={20} color={Colors.warning} />;
      default: return <Info size={20} color={Colors.accent} />;
    }
  };

  const renderNotifCard = ({ item }: { item: NotificationItem }) => (
    <Card
      style={[styles.card, !item.read ? styles.unreadCard : undefined]}
      onPress={() => !item.read && handleMarkAsRead(item._id)}
    >
      <View style={styles.notifRow}>
        <View style={styles.iconBox}>{getNotifIcon(item.type)}</View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.notifTitle, !item.read ? { fontWeight: '800' } : undefined]}>
              {item.title}
            </Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notifMsg}>{item.message}</Text>
          <Text style={styles.timeText}>
            {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recently'}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Notifications"
        showBack
        showNotif={false}
        rightAction={
          notifications.some((n) => !n.read) ? (
            <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
              <CheckCheck size={18} color={Colors.primary} />
              <Text style={styles.markAllText}>Read All</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {loading ? (
        <Loader message="Loading notifications..." fullScreen />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderNotifCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              title="No Notifications"
              description="You're all caught up! Updates regarding events, jobs, and platform alerts will appear here."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', padding: 6 },
  markAllText: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginLeft: 4 },
  listContent: { padding: 16 },
  card: { marginBottom: 10, padding: 14 },
  unreadCard: { backgroundColor: '#F0F9FF', borderColor: Colors.accent },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  notifTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginLeft: 6 },
  notifMsg: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 6 },
  timeText: { fontSize: 11, color: Colors.textMuted },
});
