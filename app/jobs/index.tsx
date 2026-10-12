import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ScrollView,
  useWindowDimensions,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../src/components/common/Header';
import { jobsApi } from '../../src/api/jobs.api';
import { userApi } from '../../src/api/user.api';
import { JobItem } from '../../src/types';
import {
  Search,
  Briefcase,
  MapPin,
  Bookmark,
  BookmarkCheck,
  Plus,
  Building2,
  DollarSign,
  ChevronDown,
  Check,
  Eye,
  Award,
  AlertCircle,
  RefreshCw,
  Clock,
  X,
  Layers,
} from 'lucide-react-native';

import { JOB_CATEGORIES, JOB_TYPES } from '../../src/constants/jobCategories';

export default function JobsListScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Data & State
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobItem[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [savingJobId, setSavingJobId] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');

  // Modal pickers state
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  const getTimeAgo = (date?: string) => {
    if (!date) return 'Recently';
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    const days = Math.floor(seconds / 86400);

    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  // Filter Logic
  const applyAllFilters = useCallback(
    (
      data: JobItem[],
      query: string,
      loc: string,
      type: string,
      cat: string
    ) => {
      let result = data;

      // 1. Text Search Query
      if (query.trim()) {
        const q = query.toLowerCase();
        result = result.filter(
          (j) =>
            j.title.toLowerCase().includes(q) ||
            j.company.toLowerCase().includes(q) ||
            (j.discipline && j.discipline.toLowerCase().includes(q)) ||
            (j.category && j.category.toLowerCase().includes(q)) ||
            (j.description && j.description.toLowerCase().includes(q)) ||
            (j.tags && j.tags.some((t) => t.toLowerCase().includes(q))) ||
            (j.requirements && j.requirements.some((r) => r.toLowerCase().includes(q)))
        );
      }

      // 2. Location
      if (loc.trim()) {
        const l = loc.toLowerCase();
        result = result.filter((j) => j.location.toLowerCase().includes(l));
      }

      // 3. Job Type
      if (type !== 'All Types') {
        result = result.filter((j) => j.type === type);
      }

      // 4. Category / Discipline
      if (cat !== 'All Categories') {
        const targetCat = cat.trim().toLowerCase();
        result = result.filter((j) => {
          const itemCat = (j.category || '').trim().toLowerCase();
          const itemDisc = (j.discipline || '').trim().toLowerCase();
          return (
            itemCat === targetCat ||
            itemDisc === targetCat ||
            itemCat.includes(targetCat) ||
            targetCat.includes(itemCat) ||
            itemDisc.includes(targetCat)
          );
        });
      }

      setFilteredJobs(result);
    },
    []
  );

  const loadJobsData = async (
    query = searchQuery,
    cat = categoryFilter,
    typ = typeFilter,
    loc = locationFilter
  ) => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedJobs, savedJobs] = await Promise.all([
        jobsApi.getJobs(query, cat, typ, loc),
        userApi.getSavedJobs().catch(() => []),
      ]);
      setJobs(fetchedJobs);
      const savedIds = savedJobs.map((j) => j._id);
      setSavedJobIds(savedIds);
      applyAllFilters(fetchedJobs, query, loc, typ, cat);
    } catch (err: any) {
      console.error('Error loading jobs:', err);
      setError('Unable to load job positions. Please verify network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const initData = async () => {
      try {
        const [fetchedJobs, savedJobs] = await Promise.all([
          jobsApi.getJobs(searchQuery, categoryFilter, typeFilter, locationFilter),
          userApi.getSavedJobs().catch(() => []),
        ]);
        if (isMounted) {
          setJobs(fetchedJobs);
          const savedIds = savedJobs.map((j) => j._id);
          setSavedJobIds(savedIds);
          applyAllFilters(fetchedJobs, searchQuery, locationFilter, typeFilter, categoryFilter);
        }
      } catch (err: any) {
        console.error('Error loading jobs:', err);
        if (isMounted) setError('Unable to load job positions. Please verify network connection.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    initData();
    return () => {
      isMounted = false;
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobsData();
    setRefreshing(false);
  };

  const handleCategorySelect = (cat: string) => {
    setCategoryFilter(cat);
    applyAllFilters(jobs, searchQuery, locationFilter, typeFilter, cat);
  };

  const handleSaveJob = async (jobId: string) => {
    const isSaved = savedJobIds.includes(jobId);
    setSavingJobId(jobId);
    try {
      if (isSaved) {
        await userApi.deleteSavedJob(jobId);
        setSavedJobIds((prev) => prev.filter((id) => id !== jobId));
      } else {
        await userApi.saveJob(jobId);
        setSavedJobIds((prev) => [...prev, jobId]);
      }
    } catch (err) {
      console.error('Failed toggling save job:', err);
    } finally {
      setSavingJobId(null);
    }
  };

  // Skeleton Loading Component
  const renderSkeletonList = () => (
    <View style={{ width: '100%' }}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonIcon} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.skeletonLineLong} />
              <View style={styles.skeletonLineShort} />
            </View>
          </View>
          <View style={styles.skeletonMetaRow}>
            <View style={styles.skeletonBadge} />
            <View style={styles.skeletonBadge} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderJobCard = ({ item }: { item: JobItem }) => {
    const isSaved = savedJobIds.includes(item._id);
    const isSavingThis = savingJobId === item._id;
    const catName = item.category || item.discipline || 'Engineering';
    const expText = item.experience || item.experienceLevel;

    return (
      <View style={styles.jobCard}>
        {/* Header Row */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.companyIconBox}>
            <Building2 size={22} color="#0D9488" />
          </View>

          <TouchableOpacity
            style={{ flex: 1, marginLeft: 12 }}
            onPress={() => router.push(`/jobs/${item._id}` as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.jobTitle}>{item.title}</Text>
            <Text style={styles.companyName}>{item.company}</Text>
          </TouchableOpacity>
        </View>

        {/* Details Row */}
        <View style={styles.metaRow}>
          <View style={styles.metaBadge}>
            <MapPin size={13} color="#64748B" />
            <Text style={styles.metaBadgeText}>{item.location}</Text>
          </View>

          <View style={[styles.metaBadge, styles.typeBadge]}>
            <Briefcase size={12} color="#1D61FF" style={{ marginRight: 3 }} />
            <Text style={styles.typeBadgeText}>{item.type || 'Full-time'}</Text>
          </View>

          {item.salary ? (
            <View style={styles.metaBadge}>
              <DollarSign size={13} color="#166534" />
              <Text style={[styles.metaBadgeText, { color: '#166534', fontWeight: '600' }]}>
                {item.salary}
              </Text>
            </View>
          ) : null}

          <View style={[styles.metaBadge, { backgroundColor: '#EFF6FF' }]}>
            <Layers size={12} color="#1D4ED8" style={{ marginRight: 3 }} />
            <Text style={{ fontSize: 11, color: '#1D4ED8', fontWeight: '700' }}>
              {catName.toUpperCase()}
            </Text>
          </View>

          {expText ? (
            <View style={styles.metaBadge}>
              <Award size={13} color="#64748B" />
              <Text style={styles.metaBadgeText}>Exp: {expText}</Text>
            </View>
          ) : null}
        </View>

        {/* Description snippet */}
        {item.description ? (
          <Text style={styles.descriptionText} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {/* Tags */}
        {item.tags && item.tags.length > 0 ? (
          <View style={styles.skillsTagRow}>
            {item.tags.slice(0, 5).map((tag, idx) => (
              <View key={idx} style={styles.skillTagChip}>
                <Text style={styles.skillTagText}>{tag}</Text>
              </View>
            ))}
            {item.tags.length > 5 ? (
              <View style={styles.skillTagChip}>
                <Text style={styles.skillTagText}>+{item.tags.length - 5} more</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.timeAgoBox}>
            <Clock size={13} color="#94A3B8" style={{ marginRight: 4 }} />
            <Text style={styles.postedDateText}>{getTimeAgo(item.createdAt)}</Text>
          </View>

          <View style={styles.actionGroup}>
            <TouchableOpacity
              style={styles.viewDetailsBtn}
              onPress={() => router.push(`/jobs/${item._id}` as any)}
              activeOpacity={0.8}
            >
              <Eye size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.viewDetailsBtnText}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveJobBtn,
                isSaved && styles.saveJobBtnSaved,
                isSavingThis && { opacity: 0.7 },
              ]}
              onPress={() => handleSaveJob(item._id)}
              disabled={isSavingThis}
              activeOpacity={0.8}
            >
              {isSavingThis ? (
                <ActivityIndicator size="small" color={isSaved ? '#0D9488' : '#334155'} />
              ) : isSaved ? (
                <>
                  <BookmarkCheck size={15} color="#0D9488" style={{ marginRight: 4 }} />
                  <Text style={styles.saveJobBtnSavedText}>Saved</Text>
                </>
              ) : (
                <>
                  <Bookmark size={15} color="#475569" style={{ marginRight: 4 }} />
                  <Text style={styles.saveJobBtnText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const filteredCategoriesList = (JOB_CATEGORIES || []).filter((cat) => {
    if (!categorySearch || !categorySearch.trim()) return true;
    return cat.toLowerCase().includes(categorySearch.toLowerCase().trim());
  });

  return (
    <View style={styles.container}>
      <Header title="Find & Post Jobs" showBack />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: 16 },
        ]}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        scrollEventThrottle={16}
        removeClippedSubviews={true}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D9488" />
        }
      >
        <View style={styles.maxWidthWrapper}>
          {/* Header Section */}
          <View style={[styles.headerContainer, isMobile && styles.headerMobile]}>
            <View style={{ flex: 1, marginBottom: isMobile ? 12 : 0 }}>
              <Text style={styles.pageTitle}>Find & Post Jobs</Text>
              <Text style={styles.pageSubtitle}>
                Discover Engineering Job Opportunities Across the Globe
                {filteredJobs.length > 0 ? (
                  <Text style={styles.jobsFoundCount}> ({filteredJobs.length} jobs found)</Text>
                ) : null}
              </Text>
            </View>

            {/* Quick Action Buttons */}
            <View style={styles.headerActionsRow}>
              <TouchableOpacity
                style={styles.savedJobsBtn}
                onPress={() => router.push('/jobs/saved' as any)}
                activeOpacity={0.7}
              >
                <Bookmark size={18} color="#0D9488" fill="#0D9488" style={{ marginRight: 6 }} />
                <Text style={styles.savedJobsBtnText}>Saved Jobs ({savedJobIds.length})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.postJobBtn}
                onPress={() => router.push('/jobs/post' as any)}
                activeOpacity={0.8}
              >
                <Plus size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.postJobBtnText}>Post a Job</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar & Filter Card */}
          <View style={styles.searchFilterCard}>
            {/* Search Query Input */}
            <View style={styles.inputBox}>
              <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInput}
                placeholder="Search by title, company, or keyword"
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={(txt) => {
                  setSearchQuery(txt);
                  applyAllFilters(jobs, txt, locationFilter, typeFilter, categoryFilter);
                }}
              />
              {searchQuery ? (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    applyAllFilters(jobs, '', locationFilter, typeFilter, categoryFilter);
                  }}
                >
                  <X size={18} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Location Input */}
            <View style={[styles.inputBox, { marginTop: 10 }]}>
              <MapPin size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInput}
                placeholder="Location (e.g. Mumbai, Remote)"
                placeholderTextColor="#94A3B8"
                value={locationFilter}
                onChangeText={(txt) => {
                  setLocationFilter(txt);
                  applyAllFilters(jobs, searchQuery, txt, typeFilter, categoryFilter);
                }}
              />
              {locationFilter ? (
                <TouchableOpacity
                  onPress={() => {
                    setLocationFilter('');
                    applyAllFilters(jobs, searchQuery, '', typeFilter, categoryFilter);
                  }}
                >
                  <X size={18} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Filter Dropdowns */}
            <View style={styles.dropdownsRow}>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setShowTypeModal(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownBtnText} numberOfLines={1}>
                  {typeFilter}
                </Text>
                <ChevronDown size={18} color="#64748B" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => {
                  setCategorySearch('');
                  setShowCategoryModal(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownBtnText} numberOfLines={1}>
                  {categoryFilter}
                </Text>
                <ChevronDown size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Job Listings Main Container */}
          <View style={styles.jobsListContainer}>
            {loading ? (
              renderSkeletonList()
            ) : error ? (
              <View style={styles.errorStateContainer}>
                <AlertCircle size={44} color="#EF4444" />
                <Text style={styles.errorHeading}>Connection Error</Text>
                <Text style={styles.errorDescription}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => loadJobsData()}>
                  <RefreshCw size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.retryBtnText}>Retry Fetching</Text>
                </TouchableOpacity>
              </View>
            ) : filteredJobs.length > 0 ? (
              <FlatList
                data={filteredJobs}
                keyExtractor={(item) => item._id}
                renderItem={renderJobCard}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.exactEmptyStateContainer}>
                <View style={styles.emptyIconCircle}>
                  <Briefcase size={36} color="#94A3B8" />
                </View>
                <Text style={styles.emptyHeading}>No jobs found</Text>
                <Text style={styles.emptyDescription}>
                  No jobs available for "{categoryFilter !== 'All Categories' ? categoryFilter : 'this search'}". Try selecting "All Categories".
                </Text>
                {categoryFilter !== 'All Categories' ? (
                  <TouchableOpacity
                    style={styles.resetCategoryBtn}
                    onPress={() => handleCategorySelect('All Categories')}
                  >
                    <Text style={styles.resetCategoryBtnText}>Show All Categories</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal for Job Type Picker */}
      <Modal
        visible={showTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={styles.modalPickerOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowTypeModal(false)}
          />
          <View style={styles.modalPickerCard}>
            <View style={styles.modalCategoryHeader}>
              <Text style={styles.modalPickerTitle}>Select Job Type</Text>
              <TouchableOpacity
                onPress={() => setShowTypeModal(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            {JOB_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.modalPickerOptionItem,
                  typeFilter === t && { backgroundColor: '#F0FDFA' },
                ]}
                onPress={() => {
                  setTypeFilter(t);
                  setShowTypeModal(false);
                  applyAllFilters(jobs, searchQuery, locationFilter, t, categoryFilter);
                }}
              >
                <Text
                  style={[
                    styles.modalPickerOptionText,
                    typeFilter === t && styles.modalPickerOptionActiveText,
                  ]}
                >
                  {t}
                </Text>
                {typeFilter === t ? <Check size={18} color="#0D9488" /> : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Modal for All Engineering Categories Picker */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalPickerOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowCategoryModal(false)}
          />

          <View style={[styles.modalPickerCard, { height: '82%', maxHeight: 600 }]}>
            <View style={styles.modalCategoryHeader}>
              <Text style={styles.modalPickerTitle}>Select Job Category</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Category Search Input */}
            <View style={[styles.inputBox, { marginBottom: 12, height: 42 }]}>
              <Search size={16} color="#94A3B8" style={{ marginRight: 6 }} />
              <TextInput
                style={[styles.textInput, { fontSize: 13 }]}
                placeholder="Search engineering category..."
                placeholderTextColor="#94A3B8"
                value={categorySearch}
                onChangeText={setCategorySearch}
              />
              {categorySearch ? (
                <TouchableOpacity onPress={() => setCategorySearch('')}>
                  <X size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            <FlatList
              data={filteredCategoriesList}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              style={{ flex: 1, width: '100%' }}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item: cat }) => {
                const isSelected = categoryFilter === cat;
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalPickerOptionItem,
                      isSelected && { backgroundColor: '#F0FDFA' },
                    ]}
                    onPress={() => {
                      handleCategorySelect(cat);
                      setShowCategoryModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalPickerOptionText,
                        isSelected && styles.modalPickerOptionActiveText,
                      ]}
                    >
                      {cat}
                    </Text>
                    {isSelected ? <Check size={18} color="#0D9488" /> : null}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContainer: { paddingBottom: 32, paddingHorizontal: 16, alignItems: 'center' },
  maxWidthWrapper: { width: '100%', maxWidth: 1040 },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerMobile: { flexDirection: 'column', alignItems: 'flex-start' },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  pageSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4 },
  jobsFoundCount: { color: '#0D9488', fontWeight: '700' },
  headerActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginTop: 8 },
  savedJobsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0D9488',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  savedJobsBtnText: { fontSize: 13, fontWeight: '700', color: '#0D9488' },
  postJobBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  postJobBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  searchFilterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
  },
  dropdownsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  dropdownBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  dropdownBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
    flex: 1,
  },
  quickCategoryContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  quickCategoryHeaderLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 },
  categoryScroll: { flexDirection: 'row' },
  quickCategoryPill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickCategoryPillSelected: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  quickCategoryPillText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  quickCategoryPillSelectedText: { color: '#FFFFFF', fontWeight: '800' },
  jobsListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    minHeight: 280,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  companyIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  companyName: { fontSize: 13, fontWeight: '600', color: '#475569', marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  metaBadgeText: { fontSize: 12, color: '#475569', marginLeft: 4, fontWeight: '500' },
  typeBadge: { backgroundColor: '#EFF6FF' },
  typeBadgeText: { fontSize: 12, color: '#1D61FF', fontWeight: '600' },
  descriptionText: { fontSize: 13, color: '#475569', marginTop: 10, lineHeight: 18 },
  skillsTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  skillTagChip: {
    backgroundColor: '#CCFBF1',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  skillTagText: { fontSize: 11, color: '#0F766E', fontWeight: '600' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 12,
    paddingTop: 10,
  },
  timeAgoBox: { flexDirection: 'row', alignItems: 'center' },
  postedDateText: { fontSize: 12, color: '#94A3B8' },
  actionGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  viewDetailsBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  saveJobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  saveJobBtnText: { fontSize: 12, fontWeight: '600', color: '#334155' },
  saveJobBtnSaved: {
    backgroundColor: '#CCFBF1',
    borderColor: '#99F6E4',
  },
  saveJobBtnSavedText: { fontSize: 12, fontWeight: '700', color: '#0D9488' },

  // Skeleton Loading
  skeletonCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 12 },
  skeletonRow: { flexDirection: 'row', alignItems: 'center' },
  skeletonIcon: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#E2E8F0' },
  skeletonLineLong: { width: '70%', height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 8 },
  skeletonLineShort: { width: '40%', height: 10, backgroundColor: '#F1F5F9', borderRadius: 4 },
  skeletonMetaRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  skeletonBadge: { width: 60, height: 20, borderRadius: 6, backgroundColor: '#F1F5F9' },

  // Empty State
  exactEmptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyHeading: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  emptyDescription: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 16, paddingHorizontal: 20 },
  resetCategoryBtn: { backgroundColor: '#0D9488', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  resetCategoryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  // Error State
  errorStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  errorHeading: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 12, marginBottom: 6 },
  errorDescription: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 16 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D9488', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

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
    marginBottom: 8,
  },
  modalPickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    paddingBottom: 4,
  },
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
