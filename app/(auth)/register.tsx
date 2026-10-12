import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { User as UserIcon, Mail, Lock, Briefcase, Phone, Building } from 'lucide-react-native';

import { getCleanErrorMessage } from '../../src/api/client';

export default function RegisterScreen() {
  const { register } = useAuth();
  const { width } = useWindowDimensions();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [headline, setHeadline] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isSmallScreen = width < 360;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Full name is required';
    if (!email.trim()) newErrors.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Valid email address required';
    if (!password || password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        profile: {
          phone: phone.trim(),
          headline: headline.trim(),
          company: company.trim(),
        },
      });
      Alert.alert(
        'Registration Successful 🎉',
        'Your KEA account has been created successfully.',
        [{ text: 'Proceed to Dashboard', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (err: any) {
      const msg = getCleanErrorMessage(err);
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.alert(`Registration Error ⚠️\n\n${msg}`);
      } else {
        Alert.alert('Registration Failed ⚠️', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.header, isSmallScreen && { marginTop: 10 }]}>
          <Text style={[styles.brandTitle, isSmallScreen && { fontSize: 18 }]}>KEA Member Registration</Text>
          <Text style={styles.brandSubtitle}>Join the Kokan Institute of Engineers network</Text>
        </View>

        <View style={[styles.card, isSmallScreen && { padding: 16, borderRadius: 12 }]}>
          <Text style={styles.title}>Create Account</Text>

          <Input
            label="Full Name *"
            placeholder="Er. Rahul Khan"
            value={name}
            onChangeText={setName}
            icon={<UserIcon size={20} color={Colors.textMuted} />}
            error={errors.name}
          />

          <Input
            label="Email Address *"
            placeholder="engineer@kokaniengineers.org"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<Mail size={20} color={Colors.textMuted} />}
            error={errors.email}
          />

          <Input
            label="Password *"
            placeholder="At least 6 characters"
            value={password}
            onChangeText={setPassword}
            isPassword
            icon={<Lock size={20} color={Colors.textMuted} />}
            error={errors.password}
          />

          <Input
            label="Phone Number"
            placeholder="+91 9876543210"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            icon={<Phone size={20} color={Colors.textMuted} />}
          />

          <Input
            label="Professional Headline"
            placeholder="Senior Civil Engineer / Software Engineer"
            value={headline}
            onChangeText={setHeadline}
            icon={<Briefcase size={20} color={Colors.textMuted} />}
          />

          <Input
            label="Current Company / Institution"
            placeholder="L&T Construction / Self-employed"
            value={company}
            onChangeText={setCompany}
            icon={<Building size={20} color={Colors.textMuted} />}
          />

          <Button
            title="Register Account"
            onPress={handleRegister}
            loading={loading}
            style={styles.regBtn}
          />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: Colors.primaryDark,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
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
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  regBtn: {
    width: '100%',
    paddingVertical: 14,
    marginTop: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});
