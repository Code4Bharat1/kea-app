import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Clock,
  Search,
  List as ListIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowRight,
} from 'lucide-react-native';

import { Colors } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { seminarsApi } from '../../src/api/seminars.api';
import { EventItem } from '../../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FORMAT_OPTIONS = ['All formats', 'Webinar', 'Workshop', 'Conference', 'Seminar', 'Training'];
const LOCATION_OPTIONS = ['All locations', 'Mumbai', 'Delhi', 'Bangalore', 'Dubai', 'Online'];
const DISCIPLINE_OPTIONS = ['Any discipline', 'Civil', 'Mechanical', 'Electrical', 'Computer/IT'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function SeminarsListScreen() {
  const [seminars, setSeminars] = useState<EventItem[]>([]);
  const [upcomingSeminars, setUpcomingSeminars] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // View & Filter states
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('All formats');
  const [selectedLocation, setSelectedLocation] = useState<string>('All locations');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('Any discipline');

  // Calendar states
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedDayEventsModal, setSelectedDayEventsModal] = useState<{ day: number; events: EventItem[] } | null>(null);

  // Pagination for list view
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Dropdown Picker Modal
  const [pickerModal, setPickerModal] = useState<{
    visible: boolean;
    title: string;
    options: string[];
    selected: string;
    onSelect: (val: string) => void;
  }>({
    visible: false,
    title: '',
    options: [],
    selected: '',
    onSelect: () => {},
  });

  const fetchSeminars = async () => {
    setLoading(true);
    try {
      const categoryFilter = selectedFormat !== 'All formats' ? selectedFormat : undefined;

      const response = await seminarsApi.getSeminars({
        search: searchQuery,
        category: categoryFilter,
        page: currentPage,
        limit: 20,
      });

      setSeminars(response.seminars || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      setSeminars([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcoming = async () => {
    try {
      const response = await seminarsApi.getSeminars({ limit: 5 });
      setUpcomingSeminars(response.seminars?.slice(0, 5) || []);
    } catch (error) {
      setUpcomingSeminars([]);
    }
  };

  useEffect(() => {
    fetchSeminars();
  }, [searchQuery, selectedFormat, selectedLocation, selectedDiscipline, selectedMonth, selectedYear, currentPage, viewMode]);

  useEffect(() => {
    fetchUpcoming();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSeminars(), fetchUpcoming()]);
    setRefreshing(false);
  };

  const getCalendarDays = () => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const getEventsForDay = (day: number | null): EventItem[] => {
    if (!day) return [];
    return seminars.filter((item) => {
      const d = new Date(item.startDate || item.date);
      return (
        d.getDate() === day &&
        d.getMonth() === selectedMonth &&
        d.getFullYear() === selectedYear
      );
    });
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'TBA';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'TBA';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const openPicker = (title: string, options: string[], selected: string, onSelect: (val: string) => void) => {
    setPickerModal({
      visible: true,
      title,
      options,
      selected,
      onSelect: (val) => {
        onSelect(val);
        setPickerModal((prev) => ({ ...prev, visible: false }));
      },
    });
  };

  return (
    <View style={styles.container}>
      <Header title="Seminars & Webinars" showBack showNotif />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Header */}
        <View style={styles.headerSection}>
          <Text style={styles.pageTitle}>Seminars & Webinars</Text>
          <Text style={styles.pageSubtitle}>
            Discover upcoming technical webinars, seminars, and KEA workshops
          </Text>
        </View>

        {/* View Mode Toggle & Filters Bar */}
        <View style={styles.controlsContainer}>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'calendar' && styles.toggleBtnActive]}
              onPress={() => setViewMode('calendar')}
              activeOpacity={0.8}
            >
              <CalendarIcon size={16} color={viewMode === 'calendar' ? '#FFFFFF' : '#475569'} />
              <Text style={[styles.toggleBtnText, viewMode === 'calendar' && styles.toggleBtnTextActive]}>
                Calendar view
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.8}
            >
              <ListIcon size={16} color={viewMode === 'list' ? '#FFFFFF' : '#475569'} />
              <Text style={[styles.toggleBtnText, viewMode === 'list' && styles.toggleBtnTextActive]}>
                List
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar & Formats Dropdown */}
          <View style={styles.filterRow}>
            <View style={styles.searchBox}>
              <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search seminars..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() =>
                openPicker('Select Format', FORMAT_OPTIONS, selectedFormat, (val) => setSelectedFormat(val))
              }
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownBtnText} numberOfLines={1}>
                {selectedFormat}
              </Text>
              <ChevronDown size={18} color="#475569" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <View style={styles.calendarContainer}>
            <View style={styles.calendarCard}>
              <View style={styles.monthHeader}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
                  <ChevronLeft size={20} color="#334155" />
                </TouchableOpacity>

                <Text style={styles.monthTitle}>
                  {MONTH_NAMES[selectedMonth]} {selectedYear}
                </Text>

                <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
                  <ChevronRight size={20} color="#334155" />
                </TouchableOpacity>
              </View>

              <View style={styles.daysHeaderRow}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <Text key={d} style={styles.dayHeaderCell}>
                    {d}
                  </Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {getCalendarDays().map((day, idx) => {
                  const dayEvents = getEventsForDay(day);
                  const isToday =
                    day === new Date().getDate() &&
                    selectedMonth === new Date().getMonth() &&
                    selectedYear === new Date().getFullYear();

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.calendarCell,
                        !day && styles.emptyCell,
                        isToday && styles.todayCell,
                      ]}
                      disabled={!day}
                      onPress={() => {
                        if (day && dayEvents.length > 0) {
                          setSelectedDayEventsModal({ day, events: dayEvents });
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      {day ? (
                        <>
                          <Text style={[styles.dayNumberText, isToday && styles.todayNumberText]}>
                            {day}
                          </Text>

                          <View style={styles.eventChipContainer}>
                            {dayEvents.slice(0, 1).map((evt) => (
                              <TouchableOpacity
                                key={evt._id}
                                style={styles.eventChip}
                                onPress={() => router.push(`/events/${evt._id}` as any)}
                              >
                                <Text style={styles.eventChipText} numberOfLines={1}>
                                  {evt.title}
                                </Text>
                              </TouchableOpacity>
                            ))}

                            {dayEvents.length > 1 && (
                              <View style={styles.moreEventsBadge}>
                                <Text style={styles.moreEventsText}>+{dayEvents.length - 1} more</Text>
                              </View>
                            )}
                          </View>
                        </>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Sidebar Sections (Upcoming seminars) */}
            <View style={styles.sidebarContainer}>
              <View style={styles.sidebarCard}>
                <Text style={styles.sidebarTitle}>Upcoming Seminars & Webinars</Text>

                {upcomingSeminars.length === 0 ? (
                  <Text style={styles.noUpcomingText}>No upcoming seminars available right now.</Text>
                ) : (
                  <View style={styles.upcomingList}>
                    {upcomingSeminars.map((event) => (
                      <TouchableOpacity
                        key={event._id}
                        style={styles.upcomingItem}
                        onPress={() => router.push(`/events/${event._id}` as any)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.upcomingItemTitle} numberOfLines={1}>
                          {event.title}
                        </Text>
                        <View style={styles.upcomingMetaRow}>
                          <CalendarIcon size={13} color="#64748B" />
                          <Text style={styles.upcomingMetaText}>{formatDate(event.startDate || event.date)}</Text>
                        </View>
                        <View style={styles.upcomingMetaRow}>
                          <MapPin size={13} color="#64748B" />
                          <Text style={styles.upcomingMetaText} numberOfLines={1}>
                            {event.venue || event.location || 'Online'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <View style={styles.listContainer}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.listHeaderTitle}>Seminars List</Text>
              <Text style={styles.listHeaderCount}>
                Showing {seminars.length} seminar{seminars.length === 1 ? '' : 's'}
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Fetching seminars...</Text>
              </View>
            ) : seminars.length === 0 ? (
              <View style={styles.emptyCard}>
                <CalendarIcon size={44} color="#94A3B8" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>No seminars found</Text>
                <Text style={styles.emptySub}>
                  Try clearing your search query to see all available webinars and seminars.
                </Text>
              </View>
            ) : (
              <View style={styles.eventCardsList}>
                {seminars.map((item) => (
                  <View key={item._id} style={styles.eventCard}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <View style={styles.eventTypeBadge}>
                        <Text style={styles.eventTypeText}>
                          {item.category || item.eventType || 'Seminar'}
                        </Text>
                      </View>
                    </View>

                    {item.description ? (
                      <Text style={styles.cardDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}

                    <View style={styles.metaRowGrid}>
                      <View style={styles.metaBadge}>
                        <CalendarIcon size={14} color="#2563EB" />
                        <Text style={styles.metaBadgeText}>{formatDate(item.startDate || item.date)}</Text>
                      </View>

                      {item.startTime || item.time ? (
                        <View style={styles.metaBadge}>
                          <Clock size={14} color="#D97706" />
                          <Text style={styles.metaBadgeText}>{item.startTime || item.time}</Text>
                        </View>
                      ) : null}

                      <View style={styles.metaBadge}>
                        <MapPin size={14} color="#64748B" />
                        <Text style={styles.metaBadgeText} numberOfLines={1}>
                          {item.venue || item.location || 'Online'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardFooterRow}>
                      <TouchableOpacity
                        style={styles.viewEventBtn}
                        onPress={() => router.push(`/events/${item._id}` as any)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.viewEventBtnText}>View Seminar</Text>
                        <ArrowRight size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {totalPages > 1 && (
              <View style={styles.paginationRow}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.pageBtn, currentPage === i + 1 && styles.pageBtnActive]}
                    onPress={() => setCurrentPage(i + 1)}
                  >
                    <Text style={[styles.pageBtnText, currentPage === i + 1 && styles.pageBtnTextActive]}>
                      {i + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Day Events Modal */}
      {selectedDayEventsModal && (
        <Modal transparent visible animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Seminars for {MONTH_NAMES[selectedMonth]} {selectedDayEventsModal.day}, {selectedYear}
                </Text>
                <TouchableOpacity onPress={() => setSelectedDayEventsModal(null)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 300 }}>
                {selectedDayEventsModal.events.map((evt) => (
                  <TouchableOpacity
                    key={evt._id}
                    style={styles.modalEventItem}
                    onPress={() => {
                      setSelectedDayEventsModal(null);
                      router.push(`/events/${evt._id}` as any);
                    }}
                  >
                    <Text style={styles.modalEventTitle}>{evt.title}</Text>
                    <Text style={styles.modalEventVenue}>{evt.venue || evt.location || 'Online'}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Custom Dropdown Picker Modal */}
      {pickerModal.visible && (
        <Modal transparent visible animationType="slide">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setPickerModal((prev) => ({ ...prev, visible: false }))}
          >
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>{pickerModal.title}</Text>
                <TouchableOpacity onPress={() => setPickerModal((prev) => ({ ...prev, visible: false }))}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={pickerModal.options}
                keyExtractor={(item) => item}
                renderItem={({ item }) => {
                  const isSelected = item === pickerModal.selected;
                  return (
                    <TouchableOpacity
                      style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                      onPress={() => pickerModal.onSelect(item)}
                    >
                      <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  controlsContainer: {
    marginBottom: 20,
    gap: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    gap: 6,
    minWidth: 120,
    justifyContent: 'space-between',
  },
  dropdownBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  calendarContainer: {
    gap: 20,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  monthNavBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayHeaderCell: {
    width: (SCREEN_WIDTH - 64) / 7,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: (SCREEN_WIDTH - 64) / 7,
    height: 64,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 3,
  },
  emptyCell: {
    backgroundColor: '#F8FAFC',
  },
  todayCell: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  dayNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  todayNumberText: {
    color: '#2563EB',
    fontWeight: '800',
  },
  eventChipContainer: {
    marginTop: 2,
    gap: 2,
  },
  eventChip: {
    backgroundColor: '#DBEAFE',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  eventChipText: {
    fontSize: 10,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  moreEventsBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  moreEventsText: {
    fontSize: 9,
    color: '#4B5563',
    fontWeight: '700',
  },
  sidebarContainer: {
    gap: 16,
  },
  sidebarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  noUpcomingText: {
    fontSize: 13,
    color: '#64748B',
  },
  upcomingList: {
    gap: 10,
  },
  upcomingItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  upcomingItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  upcomingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  upcomingMetaText: {
    fontSize: 12,
    color: '#64748B',
  },
  listContainer: {
    gap: 16,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  listHeaderCount: {
    fontSize: 13,
    color: '#64748B',
  },
  loadingBox: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  eventCardsList: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  eventTypeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  eventTypeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  cardDescription: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 12,
    lineHeight: 18,
  },
  metaRowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaBadgeText: {
    fontSize: 12,
    color: '#334155',
  },
  cardFooterRow: {
    alignItems: 'flex-end',
  },
  viewEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  viewEventBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  pageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  pageBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  pageBtnTextActive: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  modalEventItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalEventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalEventVenue: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    width: '100%',
    maxHeight: 320,
    marginTop: 'auto',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 8,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  pickerItemActive: {
    backgroundColor: '#EFF6FF',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#334155',
  },
  pickerItemTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
});
