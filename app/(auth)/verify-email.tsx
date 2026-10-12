import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { Button } from '../../src/components/common/Button';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react-native';

export default function VerifyEmailScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <ArrowLeft size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.iconBox}>
          <Mail size={36} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Email Verification Sent</Text>
        <Text style={styles.subtitle}>
          {"We have sent a verification confirmation link to your registered email address. Please check your inbox to activate your full KEA member privileges."}
        </Text>

        <View style={styles.infoBox}>
          <CheckCircle size={18} color={Colors.success} style={{ marginRight: 8 }} />
          <Text style={styles.infoText}>
            {"Once verified, you will have access to post jobs, register for webinars, and engage in community forums."}
          </Text>
        </View>

        <Button
          title="Proceed to Login"
          onPress={() => router.replace('/(auth)/login')}
          style={styles.actionBtn}
        />
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
    alignItems: 'center',
  },
  iconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 20,
    lineHeight: 20,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  actionBtn: {
    width: '100%',
    paddingVertical: 14,
  },
});
