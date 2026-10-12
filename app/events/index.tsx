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
  Sparkles,
  Filter,
} from 'lucide-react-native';

import { Colors } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { eventsApi } from '../../src/api/events.api';
import { EventItem } from '../../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FORMAT_OPTIONS = ['All formats', 'Meetup', 'Conference', 'Workshop', 'Seminar', 'Networking'];
const LOCATION_OPTIONS = ['All locations', 'Mumbai', 'Delhi', 'Bangalore', 'Dubai', 'Online'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function EventsIndexScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // View & Filter states
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('All formats');
  const [selectedLocation, setSelectedLocation] = useState<string>('All locations');

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

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const typeFilter = selectedFormat !== 'All formats' ? selectedFormat : undefined;
      const locFilter = selectedLocation !== 'All locations' ? selectedLocation : undefined;

      const response = await eventsApi.getEvents({
        search: searchQuery,
        eventType: typeFilter,
        location: locFilter,
        month: viewMode === 'calendar' ? selectedMonth : undefined,
        year: viewMode === 'calendar' ? selectedYear : undefined,
        page: viewMode === 'list' ? currentPage : undefined,
        limit: 20,
      });

      setEvents(response.events || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcoming = async () => {
    try {
      const response = await eventsApi.getEvents({ limit: 5 });
      setUpcomingEvents(response.events?.slice(0, 5) || []);
    } catch (error) {
      setUpcomingEvents([]);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [searchQuery, selectedFormat, selectedLocation, selectedMonth, selectedYear, currentPage, viewMode]);

  useEffect(() => {
    fetchUpcoming();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchEvents(), fetchUpcoming()]);
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
    return events.filter((item) => {
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

  const getCategoryBadgeStyle = (category?: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('conference')) return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
    if (cat.includes('workshop')) return { bg: '#F3E8FF', text: '#6B21A8', border: '#E9D5FF' };
    if (cat.includes('meetup')) return { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' };
    if (cat.includes('seminar')) return { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' };
    return { bg: '#F1F5F9', text: '#334155', border: '#CBD5E1' };
  };

  return (
    <View style={styles.container}>
      <Header title="Events & Meetups" showBack showNotif />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Hero Banner Card */}
        <View style={styles.heroBannerCard}>
          <View style={styles.heroContentLeft}>
            <View style={styles.badgeSparkleRow}>
              <Sparkles size={16} color="#FBBF24" style={{ marginRight: 6 }} />
              <Text style={styles.heroBadgeText}>KEA COMMUNITY EVENTS</Text>
            </View>
            <Text style={styles.heroTitle}>Events & Meetups</Text>
            <Text style={styles.heroSub}>
              Browse KEA community meetups, technical workshops, and global engineering conferences
            </Text>
          </View>
        </View>

        {/* View Mode Toggle & Filters Bar */}
        <View style={styles.controlsContainer}>
          <View style={styles.togglePillContainer}>
            <TouchableOpacity
              style={[styles.togglePillBtn, viewMode === 'calendar' && styles.togglePillActive]}
              onPress={() => setViewMode('calendar')}
              activeOpacity={0.85}
            >
              <CalendarIcon size={16} color={viewMode === 'calendar' ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.togglePillText, viewMode === 'calendar' && styles.togglePillTextActive]}>
                Calendar View
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.togglePillBtn, viewMode === 'list' && styles.togglePillActive]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.85}
            >
              <ListIcon size={16} color={viewMode === 'list' ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.togglePillText, viewMode === 'list' && styles.togglePillTextActive]}>
                List View
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar & Formats Dropdown */}
          <View style={styles.filterRow}>
            <View style={styles.searchBoxWrapper}>
              <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search events..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.dropdownPickerBtn}
              onPress={() =>
                openPicker('Select Format', FORMAT_OPTIONS, selectedFormat, (val) => setSelectedFormat(val))
              }
              activeOpacity={0.8}
            >
              <Filter size={15} color="#0D9488" style={{ marginRight: 6 }} />
              <Text style={styles.dropdownBtnText} numberOfLines={1}>
                {selectedFormat}
              </Text>
              <ChevronDown size={16} color="#475569" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <View style={styles.calendarContainer}>
            <View style={styles.calendarCard}>
              <View style={styles.monthHeader}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
                  <ChevronLeft size={20} color="#0F172A" />
                </TouchableOpacity>

                <View style={styles.monthTitleWrapper}>
                  <CalendarIcon size={18} color="#2563EB" style={{ marginRight: 8 }} />
                  <Text style={styles.monthTitle}>
                    {MONTH_NAMES[selectedMonth]} {selectedYear}
                  </Text>
                </View>

                <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
                  <ChevronRight size={20} color="#0F172A" />
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
                          <View style={[styles.dayNumberBadge, isToday && styles.todayNumberBadge]}>
                            <Text style={[styles.dayNumberText, isToday && styles.todayNumberText]}>
                              {day}
                            </Text>
                          </View>

                          <View style={styles.eventChipContainer}>
                            {dayEvents.slice(0, 1).map((evt) => (
                              <TouchableOpacity
                                key={evt._id}
                                style={styles.eventChip}
                                onPress={() => router.push(`/events/${evt._id}` as any)}
                                activeOpacity={0.8}
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

            {/* Sidebar Section */}
            <View style={styles.sidebarContainer}>
              <View style={styles.sidebarCard}>
                <View style={styles.sidebarHeaderRow}>
                  <Sparkles size={18} color="#0D9488" style={{ marginRight: 6 }} />
                  <Text style={styles.sidebarTitle}>Upcoming Events & Meetups</Text>
                </View>

                {upcomingEvents.length === 0 ? (
                  <Text style={styles.noUpcomingText}>No upcoming events available right now.</Text>
                ) : (
                  <View style={styles.upcomingList}>
                    {upcomingEvents.map((event) => (
                      <TouchableOpacity
                        key={event._id}
                        style={styles.upcomingItemCard}
                        onPress={() => router.push(`/events/${event._id}` as any)}
                        activeOpacity={0.75}
                      >
                        <View style={styles.upcomingIconCol}>
                          <CalendarIcon size={16} color="#2563EB" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.upcomingItemTitle} numberOfLines={1}>
                            {event.title}
                          </Text>
                          <View style={styles.upcomingMetaRow}>
                            <Clock size={12} color="#64748B" />
                            <Text style={styles.upcomingMetaText}>{formatDate(event.startDate || event.date)}</Text>
                          </View>
                          <View style={styles.upcomingMetaRow}>
                            <MapPin size={12} color="#64748B" />
                            <Text style={styles.upcomingMetaText} numberOfLines={1}>
                              {event.venue || event.location || 'Online'}
                            </Text>
                          </View>
                        </View>
                        <ChevronRight size={18} color="#94A3B8" />
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
              <Text style={styles.listHeaderTitle}>Events List</Text>
              <View style={styles.countPill}>
                <Text style={styles.listHeaderCount}>
                  Showing {events.length} event{events.length === 1 ? '' : 's'}
                </Text>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Fetching events...</Text>
              </View>
            ) : events.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <CalendarIcon size={28} color="#94A3B8" />
                </View>
                <Text style={styles.emptyTitle}>No events found</Text>
                <Text style={styles.emptySub}>
                  Try clearing your search query or format filters to see all available events.
                </Text>
              </View>
            ) : (
              <View style={styles.eventCardsList}>
                {events.map((item) => {
                  const badgeStyle = getCategoryBadgeStyle(item.eventType || item.category);

                  return (
                    <View key={item._id} style={styles.eventCard}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <View style={[styles.eventTypeBadge, { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border }]}>
                          <Text style={[styles.eventTypeText, { color: badgeStyle.text }]}>
                            {item.eventType || item.category || 'Event'}
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

                        {item.registeredCount !== undefined && item.registeredCount > 0 ? (
                          <View style={styles.metaBadge}>
                            <Users size={14} color="#059669" />
                            <Text style={styles.metaBadgeText}>{item.registeredCount} registered</Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.cardFooterRow}>
                        <TouchableOpacity
                          style={styles.viewEventBtn}
                          onPress={() => router.push(`/events/${item._id}` as any)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.viewEventBtnText}>View Event</Text>
                          <ArrowRight size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {totalPages > 1 && (
              <View style={styles.paginationRow}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.pageBtn, currentPage === i + 1 && styles.pageBtnActive]}
                    onPress={() => setCurrentPage(i + 1)}
                    activeOpacity={0.8}
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
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedDayEventsModal(null)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Events for {MONTH_NAMES[selectedMonth]} {selectedDayEventsModal.day}, {selectedYear}
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedDayEventsModal(null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {selectedDayEventsModal.events.map((evt) => (
                  <TouchableOpacity
                    key={evt._id}
                    style={styles.modalEventItem}
                    onPress={() => {
                      setSelectedDayEventsModal(null);
                      router.push(`/events/${evt._id}` as any);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.modalEventTitle}>{evt.title}</Text>
                    <Text style={styles.modalEventVenue}>{evt.venue || evt.location || 'Online'}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
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
                <TouchableOpacity
                  onPress={() => setPickerModal((prev) => ({ ...prev, visible: false }))}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
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

  // Hero Banner Card
  heroBannerCard: {
    backgroundColor: '#0D2847',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  heroContentLeft: {
    flexDirection: 'column',
  },
  badgeSparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 12.5,
    color: '#CBD5E1',
    lineHeight: 18,
  },

  // Controls Section
  controlsContainer: {
    marginBottom: 20,
    gap: 12,
  },
  togglePillContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  togglePillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
    gap: 6,
  },
  togglePillActive: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  togglePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  togglePillTextActive: {
    color: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  searchBoxWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
  },
  dropdownPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    minWidth: 125,
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  dropdownBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },

  // Calendar Section
  calendarContainer: {
    gap: 18,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  monthTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  monthNavBtn: {
    padding: 8,
    borderRadius: 10,
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
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: (SCREEN_WIDTH - 64) / 7,
    height: 66,
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
  dayNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayNumberBadge: {
    backgroundColor: '#2563EB',
  },
  dayNumberText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  todayNumberText: {
    color: '#FFFFFF',
    fontWeight: '900',
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
    fontSize: 9.5,
    color: '#1D4ED8',
    fontWeight: '700',
  },
  moreEventsBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  moreEventsText: {
    fontSize: 8.5,
    color: '#475569',
    fontWeight: '800',
  },

  // Sidebar / Upcoming Events Card
  sidebarContainer: {
    gap: 16,
  },
  sidebarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sidebarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  noUpcomingText: {
    fontSize: 13,
    color: '#64748B',
  },
  upcomingList: {
    gap: 10,
  },
  upcomingItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  upcomingIconCol: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingItemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  upcomingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  upcomingMetaText: {
    fontSize: 11.5,
    color: '#64748B',
  },

  // List View Styles
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
    fontWeight: '800',
    color: '#0F172A',
  },
  countPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  listHeaderCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  loadingBox: {
    padding: 36,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  eventCardsList: {
    gap: 14,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
    lineHeight: 22,
  },
  eventTypeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  eventTypeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardDescription: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 14,
    lineHeight: 19,
  },
  metaRowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  cardFooterRow: {
    alignItems: 'flex-end',
  },
  viewEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  viewEventBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
  },
  pageBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
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
    fontWeight: '700',
    color: '#334155',
  },
  pageBtnTextActive: {
    color: '#FFFFFF',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  modalEventItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalEventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalEventVenue: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: 340,
    marginTop: 'auto',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 8,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  pickerItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  pickerItemActive: {
    backgroundColor: '#EFF6FF',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  pickerItemTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
});
