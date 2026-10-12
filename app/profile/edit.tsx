import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';

export default function EditProfileScreen() {
  const { user, updateProfile } = useAuth();
  const profile = user?.profile;

  const [headline, setHeadline] = useState(profile?.headline || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [countryCode, setCountryCode] = useState(profile?.countryCode || '+91');
  const [nativeAddition, setNativeAddition] = useState(profile?.nativeAddition || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [category, setCategory] = useState(profile?.category || 'Civil Engineering');
  const [otherCategory, setOtherCategory] = useState(profile?.otherCategory || '');
  const [company, setCompany] = useState(profile?.company || '');
  const [position, setPosition] = useState(profile?.position || '');
  const [yearsOfExperience, setYearsOfExperience] = useState(profile?.yearsOfExperience || '');
  const [branch, setBranch] = useState(profile?.branch || 'Bangalore');
  const [skills, setSkills] = useState((profile?.skills || []).join(', '));
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!nativeAddition.trim()) {
      Alert.alert('Validation Error', 'Native Address from Kokan is required.');
      return;
    }

    setLoading(true);
    try {
      const skillsArray = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      let finalCategory = category;
      let finalOtherCategory = otherCategory;

      if (category === 'Other' || category === 'Other Profession') {
        if (otherCategory.trim()) {
          finalCategory = otherCategory.trim();
          finalOtherCategory = otherCategory.trim();
        }
      }

      await updateProfile({
        headline,
        bio,
        phone,
        countryCode,
        nativeAddition: nativeAddition.trim(),
        location,
        category: finalCategory,
        otherCategory: finalOtherCategory,
        company,
        position,
        yearsOfExperience,
        branch,
        skills: skillsArray,
      });

      Alert.alert('Profile Updated', 'Your profile details have been updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Update Failed', err?.response?.data?.message || 'Could not update profile details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Edit Profile" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Personal & Professional Info</Text>

          <Input
            label="Native Address from Kokan *"
            placeholder="Enter your Native Address from Kokan"
            value={nativeAddition}
            onChangeText={setNativeAddition}
          />

          <Input
            label="Native Place in Konkan"
            placeholder="e.g. Ratnagiri / Chiplun / Khed / Mangaon"
            value={location}
            onChangeText={setLocation}
          />

          <Input
            label="Professional Headline"
            placeholder="e.g. Senior Civil Structural Engineer"
            value={headline}
            onChangeText={setHeadline}
          />

          <Input
            label="Engineering Stream / Category"
            placeholder="e.g. Civil Engineering / Software Engineering"
            value={category}
            onChangeText={setCategory}
          />

          {(category === 'Other' || category === 'Other Profession') && (
            <Input
              label="Specify Custom Profession / Field"
              placeholder="e.g. Builder / Data Scientist"
              value={otherCategory}
              onChangeText={setOtherCategory}
            />
          )}

          <View style={styles.phoneRow}>
            <View style={styles.codeCol}>
              <Input
                label="Dial Code"
                placeholder="+91"
                value={countryCode}
                onChangeText={setCountryCode}
              />
            </View>
            <View style={styles.phoneCol}>
              <Input
                label="Phone Number"
                placeholder="9876543210"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <Input
            label="Current Company / Organisation"
            placeholder="e.g. ABC Constructions"
            value={company}
            onChangeText={setCompany}
          />

          <Input
            label="Job Designation / Position"
            placeholder="e.g. Site Engineer / Project Manager"
            value={position}
            onChangeText={setPosition}
          />

          <Input
            label="Years of Experience"
            placeholder="e.g. 5 Years"
            value={yearsOfExperience}
            onChangeText={setYearsOfExperience}
          />

          <Input
            label="KEA Branch"
            placeholder="Bangalore"
            value={branch}
            onChangeText={setBranch}
          />

          <Input
            label="Short Professional Bio"
            placeholder="Tell us about yourself and your expertise..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
          />

          <Input
            label="Skills (Comma separated)"
            placeholder="AutoCAD, Structural Design, React, Python, Project Management"
            value={skills}
            onChangeText={setSkills}
          />

          <Button
            title="Save Profile Changes"
            onPress={handleSave}
            loading={loading}
            style={styles.saveBtn}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: { padding: 20, borderRadius: 16 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  phoneRow: { flexDirection: 'row', gap: 10 },
  codeCol: { width: 90 },
  phoneCol: { flex: 1 },
  saveBtn: { marginTop: 14, paddingVertical: 14 },
});

