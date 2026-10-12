import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { Badge } from '../../src/components/common/Badge';
import { Loader } from '../../src/components/common/Loader';
import { resourcesApi } from '../../src/api/resources.api';
import { ResourceItem } from '../../src/types';
import { FileText, Download, HardDrive } from 'lucide-react-native';

export default function KnowledgeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [resource, setResource] = useState<ResourceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchResourceDetails = async () => {
    if (!id) return;
    try {
      const data = await resourcesApi.getResourceById(id);
      setResource(data);
    } catch (err) {
      console.error('Failed fetching resource details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!id) return;
      try {
        const data = await resourcesApi.getResourceById(id);
        if (isMounted) setResource(data);
      } catch (err) {
        console.error('Failed fetching resource details:', err);
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
    await fetchResourceDetails();
    setRefreshing(false);
  };

  const handleDownload = () => {
    if (!resource) return;
    Alert.alert(
      'Download Resource',
      `Downloading "${resource.title}" (${resource.fileType || 'PDF'})...`,
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return <Loader message="Loading resource specs..." fullScreen />;
  }

  if (!resource) {
    return (
      <View style={styles.container}>
        <Header title="Resource Specs" showBack />
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Document not found.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={resource.title} showBack />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <Card style={styles.headerCard}>
          <View style={styles.row}>
            <View style={styles.iconBox}>
              <FileText size={28} color={Colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              {resource.category && <Badge label={resource.category} variant="info" />}
              <Text style={styles.title}>{resource.title}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <HardDrive size={16} color={Colors.textMuted} />
              <Text style={styles.metaText}>{resource.fileSize || 'PDF Document'}</Text>
            </View>

            <View style={styles.metaItem}>
              <Download size={16} color={Colors.textMuted} />
              <Text style={styles.metaText}>{resource.downloadCount || 0} Downloads</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.contentCard}>
          <Text style={styles.sectionTitle}>Document Summary</Text>
          <Text style={styles.bodyText}>{resource.description}</Text>
        </Card>

        <Button
          title="Download File"
          onPress={handleDownload}
          variant="primary"
          icon={<Download size={18} color="#FFFFFF" />}
          style={styles.downloadBtn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 16 },
  headerCard: { marginBottom: 14, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 14 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-around' },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 13, color: Colors.textMuted, marginLeft: 6, fontWeight: '500' },
  contentCard: { marginBottom: 14, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  bodyText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  downloadBtn: { paddingVertical: 14 },
  errorBox: { padding: 32, alignItems: 'center' },
  errorText: { fontSize: 15, color: Colors.textMuted },
});
