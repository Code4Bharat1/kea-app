import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '../../../src/constants/theme';
import { Header } from '../../../src/components/common/Header';
import { Card } from '../../../src/components/common/Card';
import { Badge } from '../../../src/components/common/Badge';
import { Loader } from '../../../src/components/common/Loader';
import { Toast } from '../../../src/components/common/Toast';
import { mentorsApi } from '../../../src/api/mentors.api';
import { MentorItem } from '../../../src/types';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Star,
  Clock,
  Mail,
  Award,
  BookOpen,
  Languages,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Video,
  Globe,
} from 'lucide-react-native';

export default function MentorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [mentor, setMentor] = useState<MentorItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [booking, setBooking] = useState<boolean>(false);

  const [toastConfig, setToastConfig] = useState<{
    visible: boolean;
    message: string;
    type?: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastConfig({ visible: true, message, type });
  };

  const fetchMentorDetail = useCallback(async () => {
    if (!id) return;
    try {
      const data = await mentorsApi.getMentorById(id);
      setMentor(data);
    } catch (error) {
      console.error('Error fetching mentor detail:', error);
      showToast('Failed to load mentor details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMentorDetail();
  }, [fetchMentorDetail]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMentorDetail();
    setRefreshing(false);
  };

  const getCalendarDays = () => {
    const year = selectedYear;
    const month = selectedMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const isDayAvailable = (day: number | null) => {
    if (!day) return false;
    if (!mentor?.availability || mentor.availability.length === 0) {
      // Mock fallback available on days 5, 12, 18, 24
      return [5, 12, 18, 24].includes(day);
    }

    return mentor.availability.some((slot) => {
      const slotDate = new Date(slot.date);
      return (
        slotDate.getDate() === day &&
        slotDate.getMonth() === selectedMonth &&
        slotDate.getFullYear() === selectedYear &&
        !slot.isBooked
      );
    });
  };

  const handleBookSession = async () => {
    if (!selectedDay) {
      Alert.alert('Select Date', 'Please select an available date slot on the calendar.');
      return;
    }

    Alert.alert(
      'Confirm Booking',
      `Do you want to book a mentorship session on ${months[selectedMonth]} ${selectedDay}, ${selectedYear}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Book',
          onPress: async () => {
            setBooking(true);
            try {
              if (mentor) {
                await mentorsApi.bookSession(mentor._id);
                showToast('Session booked successfully!', 'success');
                fetchMentorDetail();
              }
            } catch (error: any) {
              const msg = error?.response?.data?.message || 'Failed to book session';
              Alert.alert('Booking Error', msg);
            } finally {
              setBooking(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <Loader message="Loading mentor profile..." fullScreen />;
  }

  if (!mentor) {
    return (
      <View style={styles.container}>
        <Header title="Mentor Profile" showBack />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Mentor not found or profile removed.</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.replace('/community/mentorship' as any)}
          >
            <Text style={styles.backBtnText}>Back to Mentors</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const yearsExp = mentor.experience?.years || 0;
  const rating = mentor.stats?.rating || 0;
  const reviews = mentor.stats?.reviews || 0;

  return (
    <View style={styles.container}>
      <Header title="Mentor Profile" showBack showNotif />

      <Toast
        visible={toastConfig.visible}
        message={toastConfig.message}
        type={toastConfig.type}
        onDismiss={() => setToastConfig({ ...toastConfig, visible: false })}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Back Nav Link */}
        <TouchableOpacity style={styles.backNavRow} onPress={() => router.back()}>
          <ArrowLeft size={18} color="#4B5563" />
          <Text style={styles.backNavText}>Back to Mentors</Text>
        </TouchableOpacity>

        {/* Main Mentor Profile Header Card */}
        <Card style={styles.profileHeaderCard}>
          <View style={styles.profileTopRow}>
            <View style={styles.awardAvatarBox}>
              <Award size={28} color="#2563EB" />
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.nameBadgeRow}>
                <Text style={styles.mentorName}>{mentor.name}</Text>
                <View style={styles.mentorRoleBadge}>
                  <Text style={styles.mentorRoleBadgeText}>Mentor</Text>
                </View>
              </View>

              <Text style={styles.mentorTitle}>{mentor.title}</Text>
              {mentor.organization ? (
                <Text style={styles.mentorOrg}>{mentor.organization}</Text>
              ) : null}

              <View style={styles.metaRow}>
                {yearsExp ? (
                  <View style={styles.metaItem}>
                    <Briefcase size={13} color="#6B7280" />
                    <Text style={styles.metaItemText}>{yearsExp}+ yrs experience</Text>
                  </View>
                ) : null}

                {mentor.location ? (
                  <View style={styles.metaItem}>
                    <MapPin size={13} color="#6B7280" />
                    <Text style={styles.metaItemText}>{mentor.location}</Text>
                  </View>
                ) : null}

                {rating > 0 && (
                  <View style={styles.metaItem}>
                    <Star size={13} color="#EAB308" fill="#EAB308" />
                    <Text style={styles.metaItemText}>
                      {rating.toFixed(1)} ({reviews} reviews)
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.headerActionsRow}>
            <TouchableOpacity
              style={styles.publicProfileBtn}
              onPress={() => {
                if (mentor.contact?.linkedin) {
                  Linking.openURL(mentor.contact.linkedin);
                } else {
                  showToast('Public profile link unavailable', 'info');
                }
              }}
            >
              <Award size={16} color="#2563EB" />
              <Text style={styles.publicProfileBtnText}>View public profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.requestMainBtn} onPress={handleBookSession}>
              <Text style={styles.requestMainBtnText}>Request mentorship</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Bio Card */}
        {mentor.bio ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Bio</Text>
            <Text style={styles.bodyText}>{mentor.bio}</Text>
          </Card>
        ) : null}

        {/* Skills & Focus Areas Card */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Skills & Focus areas</Text>

          {mentor.expertise && mentor.expertise.length > 0 && (
            <View style={styles.chipGroupSection}>
              <Text style={styles.chipGroupLabel}>Expertise</Text>
              <View style={styles.chipsRow}>
                {mentor.expertise.map((exp, idx) => (
                  <View key={idx} style={styles.blueChip}>
                    <Text style={styles.blueChipText}>{exp}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {mentor.skills && mentor.skills.length > 0 && (
            <View style={styles.chipGroupSection}>
              <Text style={styles.chipGroupLabel}>Skills</Text>
              <View style={styles.chipsRow}>
                {mentor.skills.map((skill, idx) => (
                  <View key={idx} style={styles.grayChip}>
                    <Text style={styles.grayChipText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {mentor.focusAreas && mentor.focusAreas.length > 0 && (
            <View style={styles.chipGroupSection}>
              <Text style={styles.chipGroupLabel}>Focus Areas</Text>
              <View style={styles.chipsRow}>
                {mentor.focusAreas.map((area, idx) => (
                  <View key={idx} style={styles.greenChip}>
                    <Text style={styles.greenChipText}>{area}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Card>

        {/* Ideal Mentee Card */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Ideal mentee</Text>
          <Text style={styles.bodyText}>
            I am looking for structural & civil engineers in the first 3-5 years of their career who are
            working on infrastructure, site execution, or transitioning from design to field operations.
          </Text>
        </Card>

        {/* Experience Card */}
        {mentor.experience?.description && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Experience</Text>
            <View style={styles.iconItemRow}>
              <View style={styles.iconBoxBlue}>
                <Briefcase size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{mentor.title}</Text>
                {mentor.organization && (
                  <Text style={styles.itemSub}>{mentor.organization}</Text>
                )}
                <Text style={styles.itemDesc}>{mentor.experience.description}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Education Card */}
        {mentor.education && mentor.education.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Education</Text>
            {mentor.education.map((edu, idx) => (
              <View key={idx} style={styles.iconItemRow}>
                <View style={styles.iconBoxPurple}>
                  <BookOpen size={20} color="#9333EA" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{edu.degree}</Text>
                  <Text style={styles.itemSub}>{edu.institution}</Text>
                  {edu.year && <Text style={styles.itemYear}>{edu.year}</Text>}
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Achievements Card */}
        {mentor.achievements && mentor.achievements.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.achievementsList}>
              {mentor.achievements.map((ach, idx) => (
                <View key={idx} style={styles.achievementItem}>
                  <CheckCircle size={18} color="#16A34A" style={{ marginTop: 2 }} />
                  <Text style={styles.achievementText}>{ach}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Languages Card */}
        {mentor.languages && mentor.languages.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.chipsRow}>
              {mentor.languages.map((lang, idx) => (
                <View key={idx} style={styles.langChip}>
                  <Languages size={14} color="#374151" />
                  <Text style={styles.langChipText}>{lang}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Availability Calendar Card */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <Text style={styles.subtitleText}>
            Pick an available date slot for your interactive request
          </Text>

          {/* Month / Year Header */}
          <View style={styles.calendarNavHeader}>
            <TouchableOpacity
              style={styles.calNavBtn}
              onPress={() => {
                if (selectedMonth === 0) {
                  setSelectedMonth(11);
                  setSelectedYear(selectedYear - 1);
                } else {
                  setSelectedMonth(selectedMonth - 1);
                }
              }}
            >
              <ChevronLeft size={18} color="#374151" />
            </TouchableOpacity>

            <Text style={styles.calMonthText}>
              {months[selectedMonth]} {selectedYear}
            </Text>

            <TouchableOpacity
              style={styles.calNavBtn}
              onPress={() => {
                if (selectedMonth === 11) {
                  setSelectedMonth(0);
                  setSelectedYear(selectedYear + 1);
                } else {
                  setSelectedMonth(selectedMonth + 1);
                }
              }}
            >
              <ChevronRight size={18} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Days Grid */}
          <View style={styles.calendarGrid}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <Text key={d} style={styles.dayHeaderCell}>
                {d}
              </Text>
            ))}

            {getCalendarDays().map((day, idx) => {
              if (!day) {
                return <View key={idx} style={styles.dayCellEmpty} />;
              }
              const available = isDayAvailable(day);
              const isSelected = selectedDay === day;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayCell,
                    available && styles.dayCellAvailable,
                    isSelected && styles.dayCellSelected,
                  ]}
                  disabled={!available}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text
                    style={[
                      styles.dayCellText,
                      available && styles.dayCellTextAvailable,
                      isSelected && styles.dayCellTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.bookSlotBtn, booking && styles.btnDisabled]}
            disabled={booking}
            onPress={handleBookSession}
          >
            <Text style={styles.bookSlotBtnText}>
              {booking ? 'Booking Session...' : 'Select timeslot & Book'}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Mentorship Details Card */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Mentorship details</Text>
          <View style={styles.detailItemRow}>
            <Video size={18} color="#2563EB" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailItemLabel}>Session via</Text>
              <Text style={styles.detailItemValue}>
                Video via email invite (Zoom / Google Meet)
              </Text>
            </View>
          </View>
          <View style={styles.detailItemRow}>
            <Languages size={18} color="#2563EB" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailItemLabel}>Language level</Text>
              <Text style={styles.detailItemValue}>Proficient English & Hindi</Text>
            </View>
          </View>
          <View style={styles.detailItemRow}>
            <Clock size={18} color="#2563EB" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailItemLabel}>Max sessions per month</Text>
              <Text style={styles.detailItemValue}>4 1-on-1 sessions</Text>
            </View>
          </View>
        </Card>

        {/* Contact Card */}
        {mentor.contact && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <View style={styles.contactGroup}>
              {mentor.contact.email ? (
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => Linking.openURL(`mailto:${mentor.contact?.email}`)}
                >
                  <Mail size={16} color="#2563EB" />
                  <Text style={styles.contactLinkText}>{mentor.contact.email}</Text>
                </TouchableOpacity>
              ) : null}

              {mentor.contact.linkedin ? (
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => Linking.openURL(mentor.contact?.linkedin || '')}
                >
                  <Globe size={16} color="#2563EB" />
                  <Text style={styles.contactLinkText}>LinkedIn Profile</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  backNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  backNavText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },
  notFoundContainer: {
    padding: 32,
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  profileHeaderCard: {
    padding: 16,
    marginBottom: 12,
  },
  profileTopRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  awardAvatarBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  mentorName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  mentorRoleBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  mentorRoleBadgeText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '700',
  },
  mentorTitle: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  mentorOrg: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaItemText: {
    fontSize: 12,
    color: '#6B7280',
  },
  headerActionsRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 14,
  },
  publicProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  publicProfileBtnText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '700',
  },
  requestMainBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestMainBtnText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionCard: {
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 21,
  },
  chipGroupSection: {
    marginBottom: 10,
  },
  chipGroupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  blueChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  blueChipText: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  grayChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  grayChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  greenChip: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  greenChipText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '600',
  },
  iconItemRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  iconBoxBlue: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxPurple: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  itemSub: {
    fontSize: 12,
    color: '#4B5563',
  },
  itemYear: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  itemDesc: {
    fontSize: 13,
    color: '#374151',
    marginTop: 4,
    lineHeight: 18,
  },
  achievementsList: {
    gap: 8,
  },
  achievementItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  achievementText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  langChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  calendarNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  calNavBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  calMonthText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  dayHeaderCell: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    paddingVertical: 6,
  },
  dayCellEmpty: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginVertical: 2,
  },
  dayCellAvailable: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  dayCellSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  dayCellText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  dayCellTextAvailable: {
    color: '#2563EB',
    fontWeight: '700',
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  bookSlotBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookSlotBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  detailItemRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 8,
  },
  detailItemLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  detailItemValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  contactGroup: {
    gap: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactLinkText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
});
