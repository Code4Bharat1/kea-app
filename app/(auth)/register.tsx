import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  TextInput,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient, getCleanErrorMessage } from '../../src/api/client';
import {
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  Briefcase,
  Building,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertCircle,
} from 'lucide-react-native';

interface Discipline {
  _id?: string;
  name: string;
}

const DEFAULT_DISCIPLINES: string[] = [
  'Accounting',
  'Architecture',
  'Business Management',
  'Chemical Engineering',
  'Civil Engineering',
  'Computer Engineering',
  'Education',
  'Electrical Engineering',
  'Electronics Engineering',
  'Finance',
  'Healthcare',
  'HSE – Health, Safety & Environment',
  'Human Resources',
  'Industrial Engineering',
  'Information Technology',
  'Legal',
  'Marine Engineering',
  'Mechanical Engineering',
  'Project Management',
  'Software Engineering',
];

export default function RegisterScreen() {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 360;

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Focus states
  const [focusedField, setFocusedField] = useState<string>('');

  // Disciplines list (initialized with full default list from image)
  const [disciplines, setDisciplines] = useState<Discipline[]>(
    DEFAULT_DISCIPLINES.map((name, idx) => ({ _id: `def_${idx}`, name }))
  );
  const [showDisciplinePicker, setShowDisciplinePicker] = useState<boolean>(false);

  // Calendar states for experience
  const [showFromCalendar, setShowFromCalendar] = useState<boolean>(false);
  const [showToCalendar, setShowToCalendar] = useState<boolean>(false);
  const [fromCalendarDate, setFromCalendarDate] = useState<Date>(new Date());
  const [toCalendarDate, setToCalendarDate] = useState<Date>(new Date());

  const [formData, setFormData] = useState({
    // Personal Details (Step 1)
    name: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    confirmPassword: '',
    category: '',
    otherCategory: '',

    // Professional Details (Step 2)
    headline: '',
    bio: '',
    company: '',
    position: '',
    from: '',
    to: '',
    description: '',

    // References (Step 3)
    reference1Name: '',
    reference1Contact: '',
    reference2Name: '',
    reference2Contact: '',
  });

  useEffect(() => {
    fetchDisciplines();
  }, []);

  const fetchDisciplines = async () => {
    try {
      const res = await apiClient.get('/disciplines');
      const apiList: Discipline[] = res.data?.success && Array.isArray(res.data?.disciplines)
        ? res.data.disciplines
        : Array.isArray(res.data)
        ? res.data
        : [];

      if (apiList.length > 0) {
        // Merge API disciplines with default list without duplicates
        const map = new Map<string, Discipline>();
        DEFAULT_DISCIPLINES.forEach((name, idx) => {
          map.set(name.toLowerCase(), { _id: `def_${idx}`, name });
        });
        apiList.forEach((d) => {
          if (d && d.name) {
            map.set(d.name.toLowerCase(), d);
          }
        });
        const merged = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
        setDisciplines(merged);
      }
    } catch (err) {
      console.log('Error fetching disciplines in mobile app, using comprehensive default list:', err);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getYears = () => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = 1970; year <= currentYear + 5; year++) {
      years.push(year);
    }
    return years;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Date picker modal
  const renderCalendarModal = (
    isOpen: boolean,
    date: Date,
    onSelectDate: (formatted: string) => void,
    onClose: () => void,
    type: 'from' | 'to'
  ) => {
    if (!isOpen) return null;

    const [currentCalDate, setCurrentCalDate] = [date, (d: Date) => {
      if (type === 'from') setFromCalendarDate(d);
      else setToCalendarDate(d);
    }];
    const [view, setView] = useState<'month' | 'year'>('month');

    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    return (
      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity activeOpacity={1} style={styles.calendarModalContent}>
            {/* Calendar Header */}
            <View style={styles.calHeader}>
              <TouchableOpacity
                onPress={() => setCurrentCalDate(new Date(year, month - 1, 1))}
                style={styles.calNavBtn}
              >
                <ChevronLeft size={20} color="#334155" />
              </TouchableOpacity>
              <View style={styles.calTitleContainer}>
                <TouchableOpacity onPress={() => setView('month')}>
                  <Text style={[styles.calHeaderTitle, view === 'month' && styles.calHeaderActive]}>
                    {months[month]}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setView('year')}>
                  <Text style={[styles.calHeaderTitle, view === 'year' && styles.calHeaderActive]}>
                    {year}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => setCurrentCalDate(new Date(year, month + 1, 1))}
                style={styles.calNavBtn}
              >
                <ChevronRight size={20} color="#334155" />
              </TouchableOpacity>
            </View>

            {view === 'month' ? (
              <View>
                <View style={styles.daysHeaderRow}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <Text key={d} style={styles.dayHeaderText}>{d}</Text>
                  ))}
                </View>
                <View style={styles.daysGrid}>
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <View key={`empty-${i}`} style={styles.dayCell} />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const isSelected =
                      day === new Date().getDate() &&
                      month === new Date().getMonth() &&
                      year === new Date().getFullYear();
                    return (
                      <TouchableOpacity
                        key={day}
                        style={[styles.dayCell, styles.dayCellBtn, isSelected && styles.dayCellSelected]}
                        onPress={() => {
                          const formatted = `${year}/${String(month + 1).padStart(2, '0')}`;
                          onSelectDate(formatted);
                          onClose();
                        }}
                      >
                        <Text style={[styles.dayCellText, isSelected && styles.dayCellTextSelected]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 220 }}>
                <View style={styles.yearsGrid}>
                  {getYears().map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[styles.yearBtn, y === year && styles.yearBtnSelected]}
                      onPress={() => {
                        setCurrentCalDate(new Date(y, month, 1));
                        setView('month');
                      }}
                    >
                      <Text style={[styles.yearBtnText, y === year && styles.yearBtnTextSelected]}>
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}

            {type === 'to' && (
              <TouchableOpacity
                style={styles.presentBtn}
                onPress={() => {
                  onSelectDate('Present');
                  onClose();
                }}
              >
                <Text style={styles.presentBtnText}>Set as Present</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.calCloseBtn} onPress={onClose}>
              <Text style={styles.calCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Please enter your phone number');
      return false;
    }
    if (!formData.category) {
      setError('Please select an engineering or professional discipline');
      return false;
    }
    if (formData.category === 'Other' && !formData.otherCategory.trim()) {
      setError('Please enter your custom engineering or professional discipline');
      return false;
    }
    if (!formData.password || !formData.confirmPassword) {
      setError('Please enter and confirm your password');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (!formData.location.trim()) {
      setError('Please enter your native place in Konkan');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
        setError('');
      }
    } else if (step === 2) {
      setStep(3);
      setError('');
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
    setError('');
  };

  const handleRegister = async () => {
    setLoading(true);
    setError('');

    try {
      // Experience array
      const experienceArray: Array<{
        company: string;
        position: string;
        from: string;
        to: string;
        description: string;
      }> = [];

      if (formData.company && formData.position && formData.from) {
        experienceArray.push({
          company: formData.company.trim(),
          position: formData.position.trim(),
          from: formData.from.trim(),
          to: formData.to.trim() || 'Present',
          description: formData.description.trim() || '',
        });
      }

      // References array
      const referencesArray: Array<{ name: string; contact: string }> = [];
      if (formData.reference1Name || formData.reference1Contact) {
        referencesArray.push({
          name: formData.reference1Name.trim(),
          contact: formData.reference1Contact.trim(),
        });
      }
      if (formData.reference2Name || formData.reference2Contact) {
        referencesArray.push({
          name: formData.reference2Name.trim(),
          contact: formData.reference2Contact.trim(),
        });
      }

      let finalCategory = formData.category;
      let finalOtherCategory = '';

      if (formData.category === 'Other' || formData.category === 'Other Profession') {
        if (formData.otherCategory && formData.otherCategory.trim()) {
          finalCategory = formData.otherCategory.trim();
          finalOtherCategory = formData.otherCategory.trim();
        }
      }

      const profileData = {
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        headline: formData.headline.trim(),
        bio: formData.bio.trim(),
        company: formData.company.trim(),
        position: formData.position.trim(),
        category: finalCategory || 'Other',
        otherCategory: finalOtherCategory,
        skills: [],
        experience: experienceArray,
        references: referencesArray,
      };

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: 'user',
        profile: profileData,
        membershipStatus: 'pending',
      };

      const res = await apiClient.post('/auth/register', payload);

      const msg = res.data?.message || 'Registration successful! Your account is pending approval.';

      if (Platform.OS === 'web') {
        window.alert(msg);
        router.push('/(auth)/login');
      } else {
        Alert.alert('Registration Successful 🎉', msg, [
          {
            text: 'OK',
            onPress: () => router.push('/(auth)/login'),
          },
        ]);
      }
    } catch (err: any) {
      console.error('Registration error in mobile app:', err);
      const cleanErr = getCleanErrorMessage(err);
      setError(cleanErr);
      if (Platform.OS !== 'web') {
        Alert.alert('Registration Error', cleanErr);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Rich deep navy background matching Login page */}
      <View style={styles.bgFull} />

      {/* Decorative glow orbs matching Login page */}
      <View style={styles.glowOrb1} />
      <View style={styles.glowOrb2} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardContainer}>
          <View style={[styles.card, isSmallScreen && { padding: 16 }]}>
            {/* Standardized KEA Official Brand Logo Card matching Login page */}
            <LinearGradient
              colors={['#081A3C', '#0E306E', '#184A96']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoBadgeCard}
            >
              <View style={styles.logoHighlightAura} />
              <Image
                source={require('../../assets/kea-logo.png')}
                style={styles.logoBadgeImage}
                resizeMode="contain"
              />
            </LinearGradient>

            {/* Header matching Login page typography */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Become a KEA Member</Text>
              <Text style={styles.cardSubtitle}>
                Fill out this form to get verified for full search access
              </Text>
            </View>

            {/* Stepper Progress Bar */}
            <View style={styles.stepIndicatorContainer}>
              {/* Step 1 */}
              <TouchableOpacity
                onPress={() => step > 1 && setStep(1)}
                activeOpacity={step > 1 ? 0.7 : 1}
                style={styles.stepItem}
              >
                <View style={[styles.stepCircle, step >= 1 ? styles.stepCircleActive : styles.stepCircleInactive]}>
                  <Text style={[styles.stepNumber, step >= 1 ? styles.stepTextActive : styles.stepTextInactive]}>1</Text>
                </View>
                <Text style={[styles.stepLabel, step === 1 && styles.stepLabelCurrent]}>Personal</Text>
              </TouchableOpacity>

              <View style={[styles.stepLine, step >= 2 ? styles.stepLineActive : styles.stepLineInactive]} />

              {/* Step 2 */}
              <TouchableOpacity
                onPress={() => step > 2 && setStep(2)}
                activeOpacity={step > 2 ? 0.7 : 1}
                style={styles.stepItem}
              >
                <View style={[styles.stepCircle, step >= 2 ? styles.stepCircleActive : styles.stepCircleInactive]}>
                  <Text style={[styles.stepNumber, step >= 2 ? styles.stepTextActive : styles.stepTextInactive]}>2</Text>
                </View>
                <Text style={[styles.stepLabel, step === 2 && styles.stepLabelCurrent]}>Professional</Text>
              </TouchableOpacity>

              <View style={[styles.stepLine, step >= 3 ? styles.stepLineActive : styles.stepLineInactive]} />

              {/* Step 3 */}
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, step >= 3 ? styles.stepCircleActive : styles.stepCircleInactive]}>
                  <Text style={[styles.stepNumber, step >= 3 ? styles.stepTextActive : styles.stepTextInactive]}>3</Text>
                </View>
                <Text style={[styles.stepLabel, step === 3 && styles.stepLabelCurrent]}>References</Text>
              </View>
            </View>

            {/* Error Banner matching Login page */}
            {error ? (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* ================= STEP 1: PERSONAL DETAILS ================= */}
            {step === 1 && (
              <View style={styles.stepSection}>
                <Text style={styles.sectionTitle}>Personal details</Text>

                {/* Full Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    Full Name <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View style={[styles.inputWrapper, focusedField === 'name' && styles.inputFocused]}>
                    <UserIcon size={17} color={focusedField === 'name' ? '#1E3A8A' : '#A0ABBB'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your full name"
                      placeholderTextColor="#A0ABBB"
                      value={formData.name}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField('')}
                      onChangeText={(val) => handleInputChange('name', val)}
                    />
                  </View>
                </View>

                {/* Email */}
                <View style={[styles.fieldGroup, { marginTop: 14 }]}>
                  <Text style={styles.label}>
                    Email Address <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputFocused]}>
                    <Mail size={17} color={focusedField === 'email' ? '#1E3A8A' : '#A0ABBB'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#A0ABBB"
                      value={formData.email}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField('')}
                      onChangeText={(val) => handleInputChange('email', val)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Phone */}
                <View style={[styles.fieldGroup, { marginTop: 14 }]}>
                  <Text style={styles.label}>
                    Phone Number <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View style={[styles.inputWrapper, focusedField === 'phone' && styles.inputFocused]}>
                    <Phone size={17} color={focusedField === 'phone' ? '#1E3A8A' : '#A0ABBB'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your phone number"
                      placeholderTextColor="#A0ABBB"
                      value={formData.phone}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField('')}
                      onChangeText={(val) => handleInputChange('phone', val)}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                {/* Discipline Dropdown */}
                <View style={[styles.fieldGroup, { marginTop: 14 }]}>
                  <Text style={styles.label}>
                    Engineering & Professional Discipline <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={[styles.dropdownBtn, showDisciplinePicker && styles.inputFocused]}
                    onPress={() => setShowDisciplinePicker(!showDisciplinePicker)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dropdownBtnText, !formData.category && { color: '#A0ABBB' }]}>
                      {formData.category || 'Select Engineering or Professional Discipline'}
                    </Text>
                    <ChevronDown size={18} color="#64748B" />
                  </TouchableOpacity>

                  {showDisciplinePicker && (
                    <View style={styles.dropdownMenu}>
                      <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                        {disciplines.map((disc) => (
                          <TouchableOpacity
                            key={disc._id}
                            style={[
                              styles.dropdownItem,
                              formData.category === disc.name && styles.dropdownItemActive,
                            ]}
                            onPress={() => {
                              handleInputChange('category', disc.name);
                              setShowDisciplinePicker(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                formData.category === disc.name && styles.dropdownItemTextActive,
                              ]}
                            >
                              {disc.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                          style={[
                            styles.dropdownItem,
                            formData.category === 'Other' && styles.dropdownItemActive,
                          ]}
                          onPress={() => {
                            handleInputChange('category', 'Other');
                            setShowDisciplinePicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              formData.category === 'Other' && styles.dropdownItemTextActive,
                            ]}
                          >
                            Other
                          </Text>
                        </TouchableOpacity>
                      </ScrollView>
                    </View>
                  )}

                  {formData.category === 'Other' && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={styles.label}>
                        Enter Custom Discipline <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <View style={[styles.inputWrapper, focusedField === 'otherCategory' && styles.inputFocused]}>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter your custom engineering discipline"
                          placeholderTextColor="#A0ABBB"
                          value={formData.otherCategory}
                          onFocus={() => setFocusedField('otherCategory')}
                          onBlur={() => setFocusedField('')}
                          onChangeText={(val) => handleInputChange('otherCategory', val)}
                        />
                      </View>
                    </View>
                  )}
                </View>

                {/* Password */}
                <View style={[styles.fieldGroup, { marginTop: 14 }]}>
                  <Text style={styles.label}>
                    Password <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputFocused]}>
                    <Lock size={17} color={focusedField === 'password' ? '#1E3A8A' : '#A0ABBB'} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { paddingRight: 40 }]}
                      placeholder="Create a password (min. 6 characters)"
                      placeholderTextColor="#A0ABBB"
                      secureTextEntry={!showPassword}
                      value={formData.password}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField('')}
                      onChangeText={(val) => handleInputChange('password', val)}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                    >
                      {showPassword ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={[styles.fieldGroup, { marginTop: 14 }]}>
                  <Text style={styles.label}>
                    Confirm Password <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View style={[styles.inputWrapper, focusedField === 'confirmPassword' && styles.inputFocused]}>
                    <Lock size={17} color={focusedField === 'confirmPassword' ? '#1E3A8A' : '#A0ABBB'} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { paddingRight: 40 }]}
                      placeholder="Confirm your password"
                      placeholderTextColor="#A0ABBB"
                      secureTextEntry={!showConfirmPassword}
                      value={formData.confirmPassword}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField('')}
                      onChangeText={(val) => handleInputChange('confirmPassword', val)}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeBtn}
                    >
                      {showConfirmPassword ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Native Place */}
                <View style={[styles.fieldGroup, { marginTop: 14 }]}>
                  <Text style={styles.label}>
                    Native Place in Konkan <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View style={[styles.inputWrapper, focusedField === 'location' && styles.inputFocused]}>
                    <MapPin size={17} color={focusedField === 'location' ? '#1E3A8A' : '#A0ABBB'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Ratnagiri, Chiplun, Dapoli"
                      placeholderTextColor="#A0ABBB"
                      value={formData.location}
                      onFocus={() => setFocusedField('location')}
                      onBlur={() => setFocusedField('')}
                      onChangeText={(val) => handleInputChange('location', val)}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* ================= STEP 2: PROFESSIONAL DETAILS ================= */}
            {step === 2 && (
              <View style={styles.stepSection}>
                <Text style={styles.sectionTitle}>Professional information</Text>

                {/* Headline */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Professional Headline</Text>
                  <View style={[styles.inputWrapper, focusedField === 'headline' && styles.inputFocused]}>
                    <Briefcase size={17} color={focusedField === 'headline' ? '#1E3A8A' : '#A0ABBB'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Senior Civil Engineer / Software Lead"
                      placeholderTextColor="#A0ABBB"
                      value={formData.headline}
                      onFocus={() => setFocusedField('headline')}
                      onBlur={() => setFocusedField('')}
                      onChangeText={(val) => handleInputChange('headline', val)}
                    />
                  </View>
                </View>

                {/* Short Bio */}
                <View style={[styles.fieldGroup, { marginTop: 14 }]}>
                  <Text style={styles.label}>Short Bio</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, focusedField === 'bio' && styles.inputFocused]}
                    placeholder="Tell us about yourself and your career journey..."
                    placeholderTextColor="#A0ABBB"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={formData.bio}
                    onFocus={() => setFocusedField('bio')}
                    onBlur={() => setFocusedField('')}
                    onChangeText={(val) => handleInputChange('bio', val)}
                  />
                </View>

                {/* Company */}
                <View style={[styles.fieldGroup, { marginTop: 14 }]}>
                  <Text style={styles.label}>Current Company / Organization</Text>
                  <View style={[styles.inputWrapper, focusedField === 'company' && styles.inputFocused]}>
                    <Building size={17} color={focusedField === 'company' ? '#1E3A8A' : '#A0ABBB'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Company or organization name"
                      placeholderTextColor="#A0ABBB"
                      value={formData.company}
                      onFocus={() => setFocusedField('company')}
                      onBlur={() => setFocusedField('')}
                      onChangeText={(val) => handleInputChange('company', val)}
                    />
                  </View>
                </View>

                {/* Position */}
                <View style={[styles.fieldGroup, { marginTop: 14 }]}>
                  <Text style={styles.label}>Current Position / Role</Text>
                  <View style={[styles.inputWrapper, focusedField === 'position' && styles.inputFocused]}>
                    <Briefcase size={17} color={focusedField === 'position' ? '#1E3A8A' : '#A0ABBB'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Your position"
                      placeholderTextColor="#A0ABBB"
                      value={formData.position}
                      onFocus={() => setFocusedField('position')}
                      onBlur={() => setFocusedField('')}
                      onChangeText={(val) => handleInputChange('position', val)}
                    />
                  </View>
                </View>

                {/* Start Date */}
                <View style={[styles.fieldGroup, { marginTop: 14 }]}>
                  <Text style={styles.label}>Start Date</Text>
                  <View style={styles.datePickerRow}>
                    <TextInput
                      style={[styles.input, styles.dateInput, focusedField === 'from' && styles.inputFocused]}
                      placeholder="YYYY/MM"
                      placeholderTextColor="#A0ABBB"
                      value={formData.from}
                      onFocus={() => setFocusedField('from')}
                      onBlur={() => {
                        setFocusedField('');
                        const clean = formData.from.replace(/\D/g, '');
                        if (clean.length >= 6) {
                          handleInputChange('from', `${clean.substring(0, 4)}/${clean.substring(4, 6)}`);
                        }
                      }}
                      onChangeText={(val) => {
                        if (/^\d*\/?\d*$/.test(val) && val.length <= 7) {
                          handleInputChange('from', val);
                        }
                      }}
                    />
                    <TouchableOpacity
                      style={styles.calPickerBtn}
                      onPress={() => setShowFromCalendar(true)}
                    >
                      <Calendar size={18} color="#1E3A8A" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* End Date */}
                <View style={[styles.fieldGroup, { marginTop: 14 }]}>
                  <Text style={styles.label}>End Date</Text>
                  <View style={styles.datePickerRow}>
                    <TextInput
                      style={[styles.input, styles.dateInput, focusedField === 'to' && styles.inputFocused]}
                      placeholder="YYYY/MM or Present"
                      placeholderTextColor="#A0ABBB"
                      value={formData.to}
                      onFocus={() => setFocusedField('to')}
                      onBlur={() => {
                        setFocusedField('');
                        if (formData.to.trim().toLowerCase() === 'present') {
                          handleInputChange('to', 'Present');
                        } else {
                          const clean = formData.to.replace(/\D/g, '');
                          if (clean.length >= 6) {
                            handleInputChange('to', `${clean.substring(0, 4)}/${clean.substring(4, 6)}`);
                          }
                        }
                      }}
                      onChangeText={(val) => handleInputChange('to', val)}
                    />
                    <TouchableOpacity
                      style={styles.calPickerBtn}
                      onPress={() => setShowToCalendar(true)}
                    >
                      <Calendar size={18} color="#1E3A8A" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Job Description */}
                <View style={[styles.fieldGroup, { marginTop: 14 }]}>
                  <Text style={styles.label}>Job Description (Optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { minHeight: 72 }, focusedField === 'description' && styles.inputFocused]}
                    placeholder="Brief description of your role and responsibilities..."
                    placeholderTextColor="#A0ABBB"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    value={formData.description}
                    onFocus={() => setFocusedField('description')}
                    onBlur={() => setFocusedField('')}
                    onChangeText={(val) => handleInputChange('description', val)}
                  />
                </View>
              </View>
            )}

            {/* ================= STEP 3: REFERENCES ================= */}
            {step === 3 && (
              <View style={styles.stepSection}>
                <Text style={styles.sectionTitle}>References</Text>
                <Text style={styles.cardSubtitle}>
                  Provide two KEA member references (optional but recommended)
                </Text>

                {/* Reference 1 Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Reference Member #1 Name</Text>
                  <View style={[styles.inputWrapper, focusedField === 'reference1Name' && styles.inputFocused]}>
                    <UserIcon size={17} color={focusedField === 'reference1Name' ? '#1E3A8A' : '#A0ABBB'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Full name"
                      placeholderTextColor="#A0ABBB"
                      value={formData.reference1Name}
                      onFocus={() => setFocusedField('reference1Name')}
                      onBlur={() => setFocusedField('')}
                      onChangeText={(val) => handleInputChange('reference1Name', val)}
                    />
                  </View>
                </View>

                {/* Reference 1 Contact */}
                <View style={[styles.fieldGroup, { marginTop: 14 }]}>
                  <Text style={styles.label}>Member #1 ID or Contact</Text>
                  <View style={[styles.inputWrapper, focusedField === 'reference1Contact' && styles.inputFocused]}>
                    <Phone size={17} color={focusedField === 'reference1Contact' ? '#1E3A8A' : '#A0ABBB'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="KEA member ID or email"
                      placeholderTextColor="#A0ABBB"
                      value={formData.reference1Contact}
                      onFocus={() => setFocusedField('reference1Contact')}
                      onBlur={() => setFocusedField('')}
                      onChangeText={(val) => handleInputChange('reference1Contact', val)}
                    />
                  </View>
                </View>

                {/* Reference 2 Name */}
                <View style={[styles.fieldGroup, { marginTop: 14 }]}>
                  <Text style={styles.label}>Reference Member #2 Name</Text>
                  <View style={[styles.inputWrapper, focusedField === 'reference2Name' && styles.inputFocused]}>
                    <UserIcon size={17} color={focusedField === 'reference2Name' ? '#1E3A8A' : '#A0ABBB'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Full name"
                      placeholderTextColor="#A0ABBB"
                      value={formData.reference2Name}
                      onFocus={() => setFocusedField('reference2Name')}
                      onBlur={() => setFocusedField('')}
                      onChangeText={(val) => handleInputChange('reference2Name', val)}
                    />
                  </View>
                </View>

                {/* Reference 2 Contact */}
                <View style={[styles.fieldGroup, { marginTop: 14 }]}>
                  <Text style={styles.label}>Member #2 ID or Contact</Text>
                  <View style={[styles.inputWrapper, focusedField === 'reference2Contact' && styles.inputFocused]}>
                    <Phone size={17} color={focusedField === 'reference2Contact' ? '#1E3A8A' : '#A0ABBB'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="KEA member ID or email"
                      placeholderTextColor="#A0ABBB"
                      value={formData.reference2Contact}
                      onFocus={() => setFocusedField('reference2Contact')}
                      onBlur={() => setFocusedField('')}
                      onChangeText={(val) => handleInputChange('reference2Contact', val)}
                    />
                  </View>
                </View>

                {/* Info Note */}
                <View style={styles.infoBox}>
                  <Text style={styles.infoBoxText}>
                    💡 Your application will be reviewed by KEA administrators. You will receive an email notification once your membership is approved.
                  </Text>
                </View>
              </View>
            )}

            {/* Action Buttons Row */}
            <View style={styles.actionButtonsRow}>
              {step > 1 && (
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={handlePrevStep}
                  activeOpacity={0.8}
                >
                  <Text style={styles.backBtnText}>← Back</Text>
                </TouchableOpacity>
              )}

              {step < 3 ? (
                <TouchableOpacity
                  style={[styles.primaryBtn, step === 1 && { flex: 1 }]}
                  onPress={handleNextStep}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>Next Step →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Submit Application</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>Already have an account?</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign In Button matching login style */}
            <TouchableOpacity
              style={styles.signInOutlineBtn}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.85}
            >
              <Text style={styles.signInOutlineBtnText}>Sign In to Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Picker Modals */}
        {renderCalendarModal(
          showFromCalendar,
          fromCalendarDate,
          (d) => handleInputChange('from', d),
          () => setShowFromCalendar(false),
          'from'
        )}
        {renderCalendarModal(
          showToCalendar,
          toCalendarDate,
          (d) => handleInputChange('to', d),
          () => setShowToCalendar(false),
          'to'
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1437',
  },
  bgFull: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#060E2B',
  },
  glowOrb1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(26, 75, 255, 0.12)',
    top: -80,
    right: -80,
  },
  glowOrb2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(59, 110, 255, 0.07)',
    bottom: 60,
    left: -60,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 14,
  },
  cardContainer: {
    alignItems: 'center',
    width: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#DCE6F5',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },

  // Standardized KEA Official Brand Logo Card
  logoBadgeCard: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#071630',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
  logoHighlightAura: {
    position: 'absolute',
    width: '90%',
    height: 75,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.28)',
  },
  logoBadgeImage: {
    width: '92%',
    height: 90,
    zIndex: 1,
  },

  // Card Header
  cardHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A1628',
    letterSpacing: -0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '400',
    lineHeight: 18,
    textAlign: 'center',
  },

  // Stepper Header
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  stepCircleActive: {
    backgroundColor: '#1E3A8A',
  },
  stepCircleInactive: {
    backgroundColor: '#E2E8F0',
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepTextActive: {
    color: '#FFFFFF',
  },
  stepTextInactive: {
    color: '#64748B',
  },
  stepLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  stepLabelCurrent: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
    marginBottom: 14,
  },
  stepLineActive: {
    backgroundColor: '#1E3A8A',
  },
  stepLineInactive: {
    backgroundColor: '#E2E8F0',
  },

  // Error Banner
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12.5,
    color: '#BE123C',
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },

  // Form Fields
  stepSection: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  fieldGroup: {
    width: '100%',
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  requiredStar: {
    color: '#EF4444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 12,
  },
  inputFocused: {
    borderColor: '#1E3A8A',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: 9,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
    paddingVertical: 0,
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },

  // Dropdown
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  dropdownBtnText: {
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '500',
    flex: 1,
  },
  dropdownMenu: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemActive: {
    backgroundColor: '#EFF6FF',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#334155',
  },
  dropdownItemTextActive: {
    color: '#1E3A8A',
    fontWeight: '700',
  },

  // Date picker
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  calPickerBtn: {
    height: 46,
    paddingHorizontal: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: '#E2E8F0',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Info Box
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  infoBoxText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },

  // Buttons
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  backBtnText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13.5,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#1E3A8A', // Deep Royal Blue matching Login page
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },

  // Divider matching login page
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerLabel: {
    marginHorizontal: 12,
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // Sign In Outline Button
  signInOutlineBtn: {
    borderWidth: 1.5,
    borderColor: '#1E3A8A',
    borderRadius: 10,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  signInOutlineBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E3A8A',
  },

  // Calendar Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 14, 43, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCE6F5',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calNavBtn: {
    padding: 6,
  },
  calTitleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  calHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  calHeaderActive: {
    color: '#1E3A8A',
  },
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayHeaderText: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellBtn: {
    borderRadius: 8,
  },
  dayCellSelected: {
    backgroundColor: '#EFF6FF',
  },
  dayCellText: {
    fontSize: 13,
    color: '#1E293B',
  },
  dayCellTextSelected: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 10,
  },
  yearBtn: {
    width: '22%',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  yearBtnSelected: {
    backgroundColor: '#EFF6FF',
  },
  yearBtnText: {
    fontSize: 12,
    color: '#334155',
  },
  yearBtnTextSelected: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
  presentBtn: {
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
  },
  presentBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  calCloseBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 6,
  },
  calCloseBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
});
