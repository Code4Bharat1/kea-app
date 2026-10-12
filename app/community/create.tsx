import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { forumsApi } from '../../src/api/forums.api';
import { MessageSquarePlus, Send } from 'lucide-react-native';

export default function CreateThreadScreen() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = ['General', 'Technical', 'Career Advice', 'Project Help', 'Announcements'];

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Missing Fields', 'Please fill in both title and topic details.');
      return;
    }

    setSubmitting(true);
    try {
      await forumsApi.createThread(title.trim(), content.trim(), category);
      Alert.alert('Success', 'Your discussion topic has been published!', [
        {
          text: 'OK',
          onPress: () => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/community' as any);
            }
          },
        },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create discussion topic.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Header title="Start New Discussion" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <View style={styles.headerRow}>
            <MessageSquarePlus size={24} color={Colors.primary} />
            <Text style={styles.cardTitle}>Community Forum Topic</Text>
          </View>

          <Input
            label="Discussion Title"
            placeholder="e.g. Best practices for Structural Load Analysis in coastal areas"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Select Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {categories.map((cat) => (
              <Button
                key={cat}
                title={cat}
                onPress={() => setCategory(cat)}
                variant={category === cat ? 'primary' : 'outline'}
                size="small"
                style={{ marginRight: 8, marginVertical: 4 }}
              />
            ))}
          </ScrollView>

          <Input
            label="Topic Details & Discussion Points"
            placeholder="Describe your question, share engineering insights, or request guidance from fellow KEA professionals..."
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
          />
        </Card>

        <Button
          title="Publish Topic"
          onPress={handleSubmit}
          variant="primary"
          loading={submitting}
          icon={<Send size={18} color="#FFFFFF" />}
          style={styles.publishBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 16 },
  card: { marginBottom: 16, padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginLeft: 10 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  catScroll: { marginBottom: 14 },
  publishBtn: { paddingVertical: 14 },
});
