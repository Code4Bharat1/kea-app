import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { Loader } from '../../src/components/common/Loader';
import { userApi } from '../../src/api/user.api';
import { JobItem } from '../../src/types';
import { MapPin, Building, Bookmark, Briefcase } from 'lucide-react-native';

export default function SavedJobsScreen() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSavedJobs = async () => {
    try {
      const data = await userApi.getSavedJobs();
      setJobs(data);
    } catch (err) {
      console.error('Failed fetching saved jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const data = await userApi.getSavedJobs();
        if (isMounted) setJobs(data);
      } catch (err) {
        console.error('Failed fetching saved jobs:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSavedJobs();
    setRefreshing(false);
  };

  const handleRemoveSaved = async (jobId: string) => {
    try {
      await userApi.deleteSavedJob(jobId);
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
    } catch (err) {
      console.error('Error removing saved job:', err);
    }
  };

  const renderJobCard = ({ item }: { item: JobItem }) => (
    <Card
      style={styles.card}
      onPress={() => router.push(`/jobs/${item._id}` as any)}
    >
      <View style={styles.cardRow}>
        <View style={styles.iconBox}>
          <Building size={22} color="#0D9488" />
        </View>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.company}>{item.company}</Text>

          <View style={styles.metaRow}>
            <MapPin size={13} color="#64748B" />
            <Text style={styles.metaText}>{item.location}</Text>

            {item.type ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.type}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Remove Bookmark Action */}
        <TouchableOpacity
          style={styles.removeBookmarkBtn}
          onPress={() => handleRemoveSaved(item._id)}
          activeOpacity={0.7}
        >
          <Bookmark size={20} color="#0D9488" fill="#0D9488" />
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header title="Saved Jobs" showBack />

      {loading ? (
        <Loader message="Loading saved listings..." fullScreen />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item._id}
          renderItem={renderJobCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D9488" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Briefcase size={36} color="#94A3B8" />
              </View>
              <Text style={styles.emptyHeading}>No saved jobs</Text>
              <Text style={styles.emptyDescription}>
                Bookmarked job listings will appear here so you can review and apply at your convenience.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  listContent: { padding: 16 },
  card: { marginBottom: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  company: { fontSize: 13, color: '#475569', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  metaText: { fontSize: 12, color: '#64748B' },
  badge: { backgroundColor: '#EFF6FF', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#1D61FF' },
  removeBookmarkBtn: { padding: 8, borderRadius: 8, backgroundColor: '#F0FDFA' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyHeading: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  emptyDescription: { fontSize: 14, color: '#64748B', textAlign: 'center' },
});
