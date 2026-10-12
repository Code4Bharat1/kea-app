import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Platform } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { Input } from '../../src/components/common/Input';
import { Badge } from '../../src/components/common/Badge';
import { Loader } from '../../src/components/common/Loader';
import { EmptyState } from '../../src/components/common/EmptyState';
import { blogsApi } from '../../src/api/blogs.api';
import { BlogItem } from '../../src/types';
import { Clock, User } from 'lucide-react-native';

export default function BlogsListScreen() {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBlogs = async () => {
    try {
      const data = await blogsApi.getBlogs(searchQuery);
      setBlogs(data);
    } catch (err) {
      console.error('Failed fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const data = await blogsApi.getBlogs(searchQuery);
        if (isMounted) setBlogs(data);
      } catch (err) {
        console.error('Failed fetching blogs:', err);
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
    await fetchBlogs();
    setRefreshing(false);
  };

  const renderBlogCard = ({ item }: { item: BlogItem }) => {
    const authorName = typeof item.author === 'string' ? item.author : item.author?.name || 'KEA Expert';
    return (
      <Card
        style={styles.card}
        onPress={() => router.push(`/blogs/${item._id}` as any)}
      >
        <View style={styles.badgeRow}>
          {item.category && <Badge label={item.category} variant="info" />}
          <Text style={styles.dateText}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : 'Recent'}
          </Text>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.excerpt} numberOfLines={2}>
          {item.summary || item.content}
        </Text>

        <View style={styles.footerRow}>
          <View style={styles.authorRow}>
            <User size={14} color={Colors.primary} />
            <Text style={styles.authorText}>{authorName}</Text>
          </View>

        {item.readTime && (
          <View style={styles.readTimeRow}>
            <Clock size={14} color={Colors.textMuted} />
            <Text style={styles.readTimeText}>{item.readTime}</Text>
          </View>
        )}
      </View>
    </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Technical Insights & Blogs" showBack />

      <View style={styles.searchBox}>
        <Input
          placeholder="Search engineering blogs, research & articles..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <Loader message="Loading technical insights..." fullScreen />
      ) : (
        <FlatList
          data={blogs}
          keyExtractor={(item) => item._id}
          renderItem={renderBlogCard}
          contentContainerStyle={styles.listContent}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              title="No Articles Found"
              description="Check back soon for technical publications, engineering whitepapers, and industry insights."
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
  card: { marginBottom: 14, padding: 16 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dateText: { fontSize: 11, color: Colors.textMuted },
  title: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  excerpt: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10 },
  authorRow: { flexDirection: 'row', alignItems: 'center' },
  authorText: { fontSize: 12, fontWeight: '600', color: Colors.primary, marginLeft: 6 },
  readTimeRow: { flexDirection: 'row', alignItems: 'center' },
  readTimeText: { fontSize: 12, color: Colors.textMuted, marginLeft: 4 },
});
