import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import { Loader } from '../../src/components/common/Loader';
import { userApi } from '../../src/api/user.api';
import { User } from '../../src/types';
import { UserCheck, Mail, Phone, MapPin, Briefcase, GraduationCap } from 'lucide-react-native';

export default function MemberProfileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [member, setMember] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMemberProfile = async () => {
    if (!id) return;
    try {
      const members = await userApi.getMembers();
      const found = members.find((m) => m._id === id);
      if (found) {
        setMember(found);
      } else {
        const me = await userApi.getMe();
        if (me._id === id) setMember(me);
      }
    } catch (err) {
      console.error('Failed fetching member profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!id) return;
      try {
        const members = await userApi.getMembers();
        const found = members.find((m) => m._id === id);
        if (isMounted) {
          if (found) {
            setMember(found);
          } else {
            const me = await userApi.getMe();
            if (me._id === id) setMember(me);
          }
        }
      } catch (err) {
        console.error('Failed fetching member profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMemberProfile();
    setRefreshing(false);
  };

  if (loading) {
    return <Loader message="Loading member profile..." fullScreen />;
  }

  if (!member) {
    return (
      <View style={styles.container}>
        <Header title="Member Profile" showBack />
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Member profile not found.</Text>
        </View>
      </View>
    );
  }

  const fullName = member.name || member.email;
  const isVerified = member.membershipStatus === 'approved';
  const profession = member.profile?.position || member.profile?.headline || member.profile?.company;
  const educationStr = Array.isArray(member.profile?.education)
    ? member.profile.education.map((e) => `${e.degree || ''} (${e.institution || ''})`).join(', ')
    : null;

  return (
    <View style={styles.container}>
      <Header title={fullName} showBack />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <Card style={styles.headerCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarLarge}>
              <UserCheck size={36} color={Colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.name}>{fullName}</Text>
              <Text style={styles.role}>{member.role?.toUpperCase() || 'MEMBER'}</Text>
              {isVerified && <Badge label="Verified KEA Engineer" variant="info" />}
            </View>
          </View>
        </Card>

        {/* Contact Info Card */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Contact & Location</Text>

          <View style={styles.infoRow}>
            <Mail size={18} color={Colors.primary} />
            <Text style={styles.infoText}>{member.email}</Text>
          </View>

          {member.profile?.phone && (
            <View style={styles.infoRow}>
              <Phone size={18} color={Colors.primary} />
              <Text style={styles.infoText}>{member.profile.phone}</Text>
            </View>
          )}

          {member.profile?.location && (
            <View style={styles.infoRow}>
              <MapPin size={18} color={Colors.primary} />
              <Text style={styles.infoText}>{member.profile.location}</Text>
            </View>
          )}
        </Card>

        {/* Engineering Profile Card */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Professional Engineering Background</Text>

          {profession && (
            <View style={styles.infoRow}>
              <Briefcase size={18} color={Colors.accent} />
              <Text style={styles.infoText}>Role: {profession}</Text>
            </View>
          )}

          {educationStr && (
            <View style={styles.infoRow}>
              <GraduationCap size={18} color={Colors.accent} />
              <Text style={styles.infoText}>Education: {educationStr}</Text>
            </View>
          )}

          {member.profile?.bio && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.subLabel}>Biography / Summary:</Text>
              <Text style={styles.bioText}>{member.profile.bio}</Text>
            </View>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 16 },
  headerCard: { marginBottom: 14, padding: 16 },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  role: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, marginTop: 2 },
  card: { marginBottom: 14, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoText: { fontSize: 14, color: Colors.textSecondary, marginLeft: 10, fontWeight: '500' },
  subLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  bioText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  errorBox: { padding: 32, alignItems: 'center' },
  errorText: { fontSize: 15, color: Colors.textMuted },
});
