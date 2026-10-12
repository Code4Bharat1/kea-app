import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { authApi } from '../../src/api/auth.api';
import { Mail, ArrowLeft } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setSubmitted(true);
      Alert.alert('Reset Link Sent', res.message || 'Password reset instructions have been emailed to you.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to send reset link. Verify your email address.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <ArrowLeft size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          {"Enter your registered email address and we'll send you instructions to reset your password."}
        </Text>

        {submitted ? (
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>Check Your Inbox!</Text>
            <Text style={styles.successText}>
              Password reset link sent to <Text style={{ fontWeight: '700' }}>{email}</Text>. Please check your inbox and spam folder.
            </Text>
            <Button
              title="Return to Login"
              onPress={() => router.replace('/(auth)/login')}
              style={{ marginTop: 16 }}
            />
          </View>
        ) : (
          <>
            <Input
              label="Registered Email Address"
              placeholder="engineer@kokaniengineers.org"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Mail size={20} color={Colors.textMuted} />}
              error={error}
            />

            <Button
              title="Send Reset Instructions"
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitBtn}
            />
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.primaryDark,
    padding: 20,
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 24,
    lineHeight: 20,
  },
  submitBtn: {
    width: '100%',
    paddingVertical: 14,
    marginTop: 8,
  },
  successBox: {
    backgroundColor: Colors.successBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.success,
    marginBottom: 6,
  },
  successText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
