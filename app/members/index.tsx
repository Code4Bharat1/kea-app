import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { Input } from '../../src/components/common/Input';
import { Badge } from '../../src/components/common/Badge';
import { Loader } from '../../src/components/common/Loader';
import { EmptyState } from '../../src/components/common/EmptyState';
import { userApi } from '../../src/api/user.api';
import { User } from '../../src/types';
import { MapPin, Briefcase, UserCheck } from 'lucide-react-native';

export default function MembersDirectoryScreen() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMembers = async () => {
    try {
      const data = await userApi.getMembers(searchQuery);
      setMembers(data);
    } catch (err) {
      console.error('Failed fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const data = await userApi.getMembers(searchQuery);
        if (isMounted) setMembers(data);
      } catch (err) {
        console.error('Failed fetching members:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMembers();
    setRefreshing(false);
  };

  const renderMemberCard = ({ item }: { item: User }) => {
    const fullName = item.name || item.email;
    const profession = item.profile?.position || item.profile?.headline || item.profile?.company;
    const location = item.profile?.location;
    const isVerified = item.membershipStatus === 'approved';

    return (
      <Card
        style={styles.card}
        onPress={() => router.push(`/members/${item._id}` as any)}
      >
        <View style={styles.cardRow}>
          <View style={styles.avatarBox}>
            <UserCheck size={24} color={Colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.titleRow}>
              <Text style={styles.name}>{fullName}</Text>
              {isVerified && <Badge label="Verified KEA" variant="info" />}
            </View>

            {profession && (
              <View style={styles.metaRow}>
                <Briefcase size={14} color={Colors.textMuted} />
                <Text style={styles.metaText}>{profession}</Text>
              </View>
            )}

            {location && (
              <View style={styles.metaRow}>
                <MapPin size={14} color={Colors.textMuted} />
                <Text style={styles.metaText}>{location}</Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="KEA Members Directory" showBack />

      <View style={styles.searchBox}>
        <Input
          placeholder="Search members by name, discipline, or city..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <Loader message="Loading directory of professionals..." fullScreen />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item._id}
          renderItem={renderMemberCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              title="No Members Found"
              description="No KEA members match your search criteria."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchBox: { paddingHorizontal: 16, paddingTop: 12 },
  listContent: { padding: 16 },
  card: { marginBottom: 12, padding: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  metaText: { fontSize: 13, color: Colors.textSecondary, marginLeft: 6 },
});
