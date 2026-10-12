import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Modal,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Header } from '../../src/components/common/Header';
import { Input } from '../../src/components/common/Input';
import { jobsApi } from '../../src/api/jobs.api';
import { JobItem } from '../../src/types';
import {
  Briefcase,
  Building,
  MapPin,
  DollarSign,
  Send,
  FileText,
  Award,
  Globe,
  Mail,
  Calendar,
  Layers,
  ChevronDown,
  Check,
  Search,
  X,
} from 'lucide-react-native';

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const WORK_MODES = ['On-site', 'Hybrid', 'Remote'];
const EXP_LEVELS = ['Entry Level', 'Mid-Level (2-5 yrs)', 'Senior (5+ yrs)', 'Lead / Executive'];
const SALARY_PERIODS = ['Per Annum', 'Per Month'];

const JOB_CATEGORIES = [
  'Software Engineering',
  'Civil Engineering',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Electronics Engineering',
  'Electronics and Telecommunications',
  'Instrumentation Engineering',
  'Chemical Engineering',
  'Computer Engineering',
  'Automobile Engineering',
  'Aeronautical Engineering',
  'Aerospace Engineering',
  'Petrochemical Engineering',
  'Polymer Engineering',
  'Agricultural Engineering',
  'Biomedical Engineering',
  'Industrial Engineering',
  'Production Engineering',
  'Mining Engineering',
  'Metallurgical Engineering',
  'Environmental Engineering',
  'Marine Engineering',
  'Textile Engineering',
  'Architecture',
  'Data Science and Engineering',
  'Artificial Intelligence & Machine Learning',
  'Robotics & Automation',
  'Cybersecurity Engineering',
  'Cloud Engineering',
  'Mechatronics Engineering',
  'Nuclear Engineering',
  'Materials Science and Engineering',
  'Systems Engineering',
  'Biotechnology Engineering',
  'Food Technology Engineering',
  'Geotechnical Engineering',
  'Safety Engineering',
  'Other',
];

export default function PostJobScreen() {
  // Section 1: Job Information
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [category, setCategory] = useState('Software Engineering');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<JobItem['type']>('Full-time');
  const [workMode, setWorkMode] = useState('On-site');
  const [expRequired, setExpRequired] = useState('Mid-Level (2-5 yrs)');

  // Category modal picker
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  // Section 2: Location & Compensation
  const [location, setLocation] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [salaryPeriod, setSalaryPeriod] = useState('Per Annum');

  // Section 3: Requirements
  const [skills, setSkills] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [deadline, setDeadline] = useState('');

  // Section 4: Application Details
  const [appContact, setAppContact] = useState('');
  const [instructions, setInstructions] = useState('');

  // Form State
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; company?: string; location?: string; description?: string }>({});

  const validateForm = () => {
    const errs: { title?: string; company?: string; location?: string; description?: string } = {};
    if (!title.trim()) errs.title = 'Job title is required';
    if (!company.trim()) errs.company = 'Company name is required';
    if (!location.trim()) errs.location = 'Job location is required';
    if (!description.trim() || description.trim().length < 20) {
      errs.description = 'Please enter a description (at least 20 characters)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      const msg = 'Please fix the highlighted required fields before submitting.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Validation Error', msg);
      return;
    }

    setLoading(true);
    try {
      let salaryText = 'Negotiable';
      if (minSalary.trim() && maxSalary.trim()) {
        salaryText = `₹${minSalary.trim()} - ₹${maxSalary.trim()} ${salaryPeriod === 'Per Annum' ? 'P.A.' : 'P.M.'}`;
      } else if (minSalary.trim()) {
        salaryText = `₹${minSalary.trim()} ${salaryPeriod === 'Per Annum' ? 'P.A.' : 'P.M.'}`;
      }

      await jobsApi.createJob({
        title: title.trim(),
        company: company.trim(),
        location: workMode === 'Remote' ? `${location.trim()} (Remote)` : location.trim(),
        type,
        category: category || 'Other',
        discipline: category || qualifications.trim() || 'Engineering',
        experienceLevel: expRequired,
        salary: salaryText,
        description: description.trim(),
        requirements: skills.trim() ? skills.split(',').map((s) => s.trim()) : [],
        deadline: deadline.trim() || undefined,
        applyUrl: appContact.trim() || undefined,
      });

      const successMsg = 'Your engineering job opening has been published successfully!';
      if (Platform.OS === 'web') {
        window.alert(successMsg);
        router.push('/(tabs)/jobs');
      } else {
        Alert.alert('Success 🎉', successMsg, [
          { text: 'OK', onPress: () => router.push('/(tabs)/jobs') },
        ]);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to publish job. Please try again.';
      if (Platform.OS === 'web') window.alert(errorMsg);
      else Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = JOB_CATEGORIES.filter((cat) =>
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="Post a Job" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.maxWidthWrapper}>
          {/* Header Subtitle Card */}
          <View style={styles.headerInfoCard}>
            <Text style={styles.headerTitle}>Post a Job</Text>
            <Text style={styles.headerSubtitle}>Share an opportunity with the KEA community.</Text>
          </View>

          {/* SECTION 1: Job Information */}
          <View style={styles.formSectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Briefcase size={18} color="#0D9488" style={{ marginRight: 8 }} />
              <Text style={styles.sectionHeaderTitle}>1. Job Information</Text>
            </View>

            <Input
              label="Job Title *"
              placeholder="e.g. Senior Structural Engineer"
              value={title}
              onChangeText={(txt) => {
                setTitle(txt);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              icon={<Briefcase size={16} color="#94A3B8" />}
              error={errors.title}
            />

            <Input
              label="Company Name *"
              placeholder="e.g. Kokan Infra Tech Pvt Ltd"
              value={company}
              onChangeText={(txt) => {
                setCompany(txt);
                if (errors.company) setErrors((prev) => ({ ...prev, company: undefined }));
              }}
              icon={<Building size={16} color="#94A3B8" />}
              error={errors.company}
            />

            {/* Category Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Job Category *</Text>
              <TouchableOpacity
                style={styles.categoryDropdownBtn}
                onPress={() => {
                  setCategorySearch('');
                  setShowCategoryModal(true);
                }}
              >
                <Text style={styles.categoryDropdownBtnText}>{category}</Text>
                <ChevronDown size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Employment Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Employment Type</Text>
              <View style={styles.chipRow}>
                {EMPLOYMENT_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chipItem, type === t && styles.chipItemActive]}
                    onPress={() => setType(t as any)}
                  >
                    <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Work Mode */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Work Mode</Text>
              <View style={styles.chipRow}>
                {WORK_MODES.map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.chipItem, workMode === mode && styles.chipItemActive]}
                    onPress={() => setWorkMode(mode)}
                  >
                    <Text style={[styles.chipText, workMode === mode && styles.chipTextActive]}>
                      {mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Experience Level */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Experience Required</Text>
              <View style={styles.chipRow}>
                {EXP_LEVELS.map((exp) => (
                  <TouchableOpacity
                    key={exp}
                    style={[styles.chipItem, expRequired === exp && styles.chipItemActive]}
                    onPress={() => setExpRequired(exp)}
                  >
                    <Text style={[styles.chipText, expRequired === exp && styles.chipTextActive]}>
                      {exp}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Input
              label="Job Description *"
              placeholder="Describe core duties, project scope, and key deliverables for this position..."
              value={description}
              onChangeText={(txt) => {
                setDescription(txt);
                if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              multiline
              numberOfLines={4}
              style={{ height: 90, textAlignVertical: 'top' }}
              error={errors.description}
            />
          </View>

          {/* SECTION 2: Location & Compensation */}
          <View style={styles.formSectionCard}>
            <View style={styles.sectionHeaderRow}>
              <MapPin size={18} color="#0D9488" style={{ marginRight: 8 }} />
              <Text style={styles.sectionHeaderTitle}>2. Location & Compensation</Text>
            </View>

            <Input
              label="Job Location *"
              placeholder="e.g. Ratnagiri, Mumbai, or Remote"
              value={location}
              onChangeText={(txt) => {
                setLocation(txt);
                if (errors.location) setErrors((prev) => ({ ...prev, location: undefined }));
              }}
              icon={<MapPin size={16} color="#94A3B8" />}
              error={errors.location}
            />

            <View style={styles.dualInputRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Minimum Salary (₹)"
                  placeholder="e.g. 6,00,000"
                  value={minSalary}
                  onChangeText={setMinSalary}
                  keyboardType="numeric"
                  icon={<DollarSign size={16} color="#94A3B8" />}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Maximum Salary (₹)"
                  placeholder="e.g. 10,00,000"
                  value={maxSalary}
                  onChangeText={setMaxSalary}
                  keyboardType="numeric"
                  icon={<DollarSign size={16} color="#94A3B8" />}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Salary Period</Text>
              <View style={styles.chipRow}>
                {SALARY_PERIODS.map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[styles.chipItem, salaryPeriod === period && styles.chipItemActive]}
                    onPress={() => setSalaryPeriod(period)}
                  >
                    <Text style={[styles.chipText, salaryPeriod === period && styles.chipTextActive]}>
                      {period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* SECTION 3: Requirements & Qualifications */}
          <View style={styles.formSectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Award size={18} color="#0D9488" style={{ marginRight: 8 }} />
              <Text style={styles.sectionHeaderTitle}>3. Requirements & Qualifications</Text>
            </View>

            <Input
              label="Required Skills (Comma Separated)"
              placeholder="e.g. AutoCAD, STAAD Pro, Project Management"
              value={skills}
              onChangeText={setSkills}
              icon={<Layers size={16} color="#94A3B8" />}
            />

            <Input
              label="Qualifications / Degree"
              placeholder="e.g. B.E. Civil / B.Tech Computer Engineering"
              value={qualifications}
              onChangeText={setQualifications}
              icon={<FileText size={16} color="#94A3B8" />}
            />

            <Input
              label="Application Deadline (Optional)"
              placeholder="e.g. 30th October 2026"
              value={deadline}
              onChangeText={setDeadline}
              icon={<Calendar size={16} color="#94A3B8" />}
            />
          </View>

          {/* SECTION 4: Application Details */}
          <View style={styles.formSectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Globe size={18} color="#0D9488" style={{ marginRight: 8 }} />
              <Text style={styles.sectionHeaderTitle}>4. Application Details</Text>
            </View>

            <Input
              label="Application Email / Apply URL"
              placeholder="hr@company.org or https://company.com/careers"
              value={appContact}
              onChangeText={setAppContact}
              icon={<Mail size={16} color="#94A3B8" />}
            />

            <Input
              label="Additional Instructions"
              placeholder="e.g. Mention 'KEA Referral' in subject line..."
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitJobBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Send size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.submitJobBtnText}>
              {loading ? 'Publishing Opportunity...' : 'Submit & Publish Job'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View style={styles.modalPickerOverlay}>
          <View style={[styles.modalPickerCard, { maxHeight: '80%' }]}>
            <View style={styles.modalCategoryHeader}>
              <Text style={styles.modalPickerTitle}>Select Job Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchInputBox}>
              <Search size={16} color="#94A3B8" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.searchInputText}
                placeholder="Search categories..."
                placeholderTextColor="#94A3B8"
                value={categorySearch}
                onChangeText={setCategorySearch}
              />
            </View>

            <ScrollView style={{ flex: 1 }}>
              {filteredCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={styles.modalPickerOptionItem}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalPickerOptionText,
                      category === cat && styles.modalPickerOptionActiveText,
                    ]}
                  >
                    {cat}
                  </Text>
                  {category === cat ? <Check size={18} color="#0D9488" /> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center' },
  maxWidthWrapper: { width: '100%', maxWidth: 700 },
  headerInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4 },
  formSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  inputGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 8 },
  categoryDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  categoryDropdownBtnText: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipItemActive: { backgroundColor: '#CCFBF1', borderColor: '#0D9488' },
  chipText: { fontSize: 12, fontWeight: '500', color: '#475569' },
  chipTextActive: { color: '#0D9488', fontWeight: '700' },
  dualInputRow: { flexDirection: 'row', gap: 12 },
  submitJobBtn: {
    backgroundColor: '#0D9488',
    borderRadius: 10,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitJobBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  // Modal
  modalPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalPickerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: '100%',
    maxWidth: 400,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  modalCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalPickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 10,
  },
  searchInputText: { flex: 1, fontSize: 13, color: '#0F172A' },
  modalPickerOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  modalPickerOptionText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  modalPickerOptionActiveText: {
    color: '#0D9488',
    fontWeight: '700',
  },
});
