import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import { Loader } from '../../src/components/common/Loader';
import { blogsApi } from '../../src/api/blogs.api';
import { BlogItem } from '../../src/types';
import { User, Clock, Calendar } from 'lucide-react-native';

export default function BlogDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [blog, setBlog] = useState<BlogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBlogDetails = async () => {
    if (!id) return;
    try {
      const data = await blogsApi.getBlogById(id);
      setBlog(data);
    } catch (err) {
      console.error('Failed fetching blog post:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!id) return;
      try {
        const data = await blogsApi.getBlogById(id);
        if (isMounted) setBlog(data);
      } catch (err) {
        console.error('Failed fetching blog post:', err);
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
    await fetchBlogDetails();
    setRefreshing(false);
  };

  if (loading) {
    return <Loader message="Loading publication..." fullScreen />;
  }

  if (!blog) {
    return (
      <View style={styles.container}>
        <Header title="Technical Insight" showBack />
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Blog post not found.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={blog.title} showBack />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <Card style={styles.headerCard}>
          {blog.category && <Badge label={blog.category} variant="info" />}
          <Text style={styles.title}>{blog.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <User size={16} color={Colors.primary} />
              <Text style={styles.authorText}>
                {typeof blog.author === 'string' ? blog.author : blog.author?.name || 'KEA Technical Expert'}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Calendar size={16} color={Colors.textMuted} />
              <Text style={styles.metaText}>
                {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-IN') : 'Recent'}
              </Text>
            </View>

            {blog.readTime && (
              <View style={styles.metaItem}>
                <Clock size={16} color={Colors.textMuted} />
                <Text style={styles.metaText}>{blog.readTime}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Content Section */}
        <Card style={styles.contentCard}>
          <Text style={styles.bodyText}>{blog.content}</Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 16 },
  headerCard: { marginBottom: 14, padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  authorText: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginLeft: 6 },
  metaText: { fontSize: 13, color: Colors.textMuted, marginLeft: 6 },
  contentCard: { marginBottom: 14, padding: 16 },
  bodyText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 24 },
  errorBox: { padding: 32, alignItems: 'center' },
  errorText: { fontSize: 15, color: Colors.textMuted },
});
