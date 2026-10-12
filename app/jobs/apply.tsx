import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { userApi } from '../../src/api/user.api';
import { ResumeItem } from '../../src/types';
import { FileText, Send, CheckCircle2 } from 'lucide-react-native';

export default function JobApplyScreen() {
  const { jobId, title, company } = useLocalSearchParams<{ jobId: string; title: string; company: string }>();
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const data = await userApi.getMyResumes();
        setResumes(data);
        if (data.length > 0) {
          setSelectedResumeId(data[0]._id);
        }
      } catch (err) {
        console.error('Failed fetching resumes for application:', err);
      }
    };
    fetchResumes();
  }, []);

  const handleSubmitApplication = async () => {
    if (!jobId) return;
    setSubmitting(true);
    try {
      await userApi.applyForJob(jobId, selectedResumeId || undefined, coverLetter);
      setSubmitted(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to submit application.';
      Alert.alert('Application Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <Header title="Application Submitted" showBack />
        <View style={styles.successContainer}>
          <CheckCircle2 size={64} color={Colors.teal} />
          <Text style={styles.successTitle}>Application Sent!</Text>
          <Text style={styles.successSub}>
            Your profile and application have been submitted to <Text style={{ fontWeight: '700' }}>{company}</Text> for the position of{' '}
            <Text style={{ fontWeight: '700' }}>{title}</Text>.
          </Text>

          <Button
            title="Return to Jobs"
            onPress={() => router.replace('/(tabs)/jobs')}
            variant="primary"
            style={{ width: '100%', marginTop: 24 }}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Header title="Job Application" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Card style={styles.summaryCard}>
          <Text style={styles.appTitle}>Applying for {title}</Text>
          <Text style={styles.appCompany}>{company}</Text>
        </Card>

        {/* Resume Selection */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Select Resume / CV</Text>
          {resumes.length === 0 ? (
            <View style={styles.emptyResume}>
              <Text style={styles.emptyResumeText}>
                No saved resumes found in your profile. You can upload a resume in Profile {'>'} My Resumes.
              </Text>
              <Button
                title="Upload Resume in Profile"
                onPress={() => router.push('/(tabs)/profile/resumes')}
                variant="outline"
                size="small"
                style={{ marginTop: 10 }}
              />
            </View>
          ) : (
            resumes.map((res) => {
              const isSelected = selectedResumeId === res._id;
              return (
                <Card
                  key={res._id}
                  style={[styles.resumeCard, isSelected ? styles.resumeSelected : undefined]}
                  onPress={() => setSelectedResumeId(res._id)}
                >
                  <View style={styles.resumeRow}>
                    <FileText size={20} color={isSelected ? Colors.primary : Colors.textMuted} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.resumeName, isSelected ? { color: Colors.primary, fontWeight: '700' } : undefined]}>
                        {res.fileName || 'My Professional Resume'}
                      </Text>
                      <Text style={styles.resumeDate}>
                        Uploaded: {new Date(res.uploadedAt || '2026-01-01').toLocaleDateString('en-IN')}
                      </Text>
                    </View>
                    {isSelected && <CheckCircle2 size={20} color={Colors.primary} />}
                  </View>
                </Card>
              );
            })
          )}
        </Card>

        {/* Cover Letter Input */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Cover Letter / Statement (Optional)</Text>
          <Input
            placeholder="Introduce yourself, highlight relevant KEA engineering experience, and explain why you're a great fit for this role..."
            value={coverLetter}
            onChangeText={setCoverLetter}
            multiline
            numberOfLines={5}
          />
        </Card>

        <Button
          title="Submit Application"
          onPress={handleSubmitApplication}
          variant="primary"
          loading={submitting}
          icon={<Send size={18} color="#FFFFFF" />}
          style={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 16 },
  summaryCard: { marginBottom: 14, padding: 16, backgroundColor: '#F0F9FF' },
  appTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  appCompany: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginTop: 2 },
  card: { marginBottom: 14, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  emptyResume: { padding: 12, backgroundColor: Colors.inputBg, borderRadius: 8 },
  emptyResumeText: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
  resumeCard: { marginBottom: 8, padding: 12, borderWidth: 1, borderColor: Colors.border },
  resumeSelected: { borderColor: Colors.primary, backgroundColor: '#F0F9FF' },
  resumeRow: { flexDirection: 'row', alignItems: 'center' },
  resumeName: { fontSize: 14, color: Colors.textPrimary },
  resumeDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  submitBtn: { marginTop: 8, paddingVertical: 14 },
  successContainer: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginTop: 16, marginBottom: 8 },
  successSub: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
