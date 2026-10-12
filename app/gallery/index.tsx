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
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import {
  Search,
  Upload,
  Heart,
  MessageCircle,
  Share2,
  X,
  Image as ImageIcon,
  Calendar,
  MapPin,
  Star,
  ChevronDown,
  Send,
  Plus,
} from 'lucide-react-native';

import { Colors } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { galleryApi } from '../../src/api/gallery.api';
import { GalleryItem, GalleryCategoryStat } from '../../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const YEARS_OPTIONS = ['All years', '2026', '2025', '2024', '2023', '2022', '2021'];

const CATEGORY_OPTIONS = [
  'All photos',
  'Event Category',
  'Project Showcase',
  'Member Activities',
  'Good Wishes',
  'Testimonials',
];

export default function GalleryScreen() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [categories, setCategories] = useState<GalleryCategoryStat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All photos');
  const [selectedYear, setSelectedYear] = useState<string>('All years');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Upload Form state
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category: 'Good Wishes',
    imageUrl: '',
    tags: '',
    eventDate: '',
    location: '',
  });

  // Dropdown Picker Modal state
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

  const fetchGalleryData = async () => {
    setLoading(true);
    try {
      const res = await galleryApi.getGallery({
        category: selectedCategory,
        search: searchQuery,
        year: selectedYear,
        page: currentPage,
        limit: 12,
      });
      setItems(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Error fetching gallery:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryStats = async () => {
    try {
      const res = await galleryApi.getCategoryStats();
      setCategories(res.categories || []);
    } catch (err) {
      console.error('Error fetching category stats:', err);
    }
  };

  useEffect(() => {
    fetchGalleryData();
    fetchCategoryStats();
  }, [selectedCategory, searchQuery, selectedYear, currentPage]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchGalleryData(), fetchCategoryStats()]);
    setRefreshing(false);
  };

  const handleUploadSubmit = async () => {
    if (!newItem.title.trim()) {
      Alert.alert('Required Field', 'Please enter a title for the photo/testimonial.');
      return;
    }
    if (!newItem.category) {
      Alert.alert('Required Field', 'Please select a category.');
      return;
    }

    setSubmitting(true);
    try {
      await galleryApi.uploadGalleryItem({
        ...newItem,
        tags: newItem.tags ? newItem.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      });
      setShowUploadModal(false);
      resetForm();
      fetchGalleryData();
      Alert.alert('Success', 'Your post has been submitted successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to upload image/testimonial');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewItem({
      title: '',
      description: '',
      category: 'Good Wishes',
      imageUrl: '',
      tags: '',
      eventDate: '',
      location: '',
    });
  };

  const handleLike = async (itemId: string) => {
    try {
      await galleryApi.likeGalleryItem(itemId);
      if (selectedItem && selectedItem._id === itemId) {
        const updated = await galleryApi.getGalleryItem(itemId);
        setSelectedItem(updated);
      }
      fetchGalleryData();
    } catch (err) {
      console.error('Failed to like item:', err);
    }
  };

  const handleAddComment = async (itemId: string) => {
    if (!commentText.trim()) return;
    try {
      const updated = await galleryApi.commentGalleryItem(itemId, commentText);
      setCommentText('');
      if (updated) {
        setSelectedItem(updated);
      }
      fetchGalleryData();
    } catch (err) {
      Alert.alert('Error', 'Failed to post comment.');
    }
  };

  const openDetail = async (item: GalleryItem) => {
    try {
      const details = await galleryApi.getGalleryItem(item._id);
      setSelectedItem(details || item);
      setShowDetailModal(true);
    } catch (err) {
      setSelectedItem(item);
      setShowDetailModal(true);
    }
  };

  const getTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
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
      <Header title="Good Wishes & Testimonials" showBack showNotif />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Title & Action Header Bar */}
        <View style={styles.topHeaderCard}>
          <View style={styles.topHeaderLeft}>
            <Text style={styles.pageTitle}>Good Wishes & Testimonials</Text>
            <Text style={styles.pageSubtitle}>Browse photos from our events and celebrations</Text>
          </View>

          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => setShowUploadModal(true)}
            activeOpacity={0.8}
          >
            <Upload size={16} color="#0F172A" style={{ marginRight: 6 }} />
            <Text style={styles.uploadBtnText}>Share & Upload</Text>
          </TouchableOpacity>
        </View>

        {/* Filters Card */}
        <View style={styles.filterCard}>
          {/* Search Box */}
          <View style={styles.searchBox}>
            <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search photos by event type, year, etc"
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

          {/* Filter Dropdowns Row */}
          <View style={styles.dropdownsRow}>
            {/* Year Dropdown */}
            <TouchableOpacity
              style={styles.filterDropdownBtn}
              onPress={() =>
                openPicker('Select Year', YEARS_OPTIONS, selectedYear, (val) => setSelectedYear(val))
              }
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownBtnText} numberOfLines={1}>
                {selectedYear}
              </Text>
              <ChevronDown size={16} color="#475569" />
            </TouchableOpacity>

            {/* Category Dropdown */}
            <TouchableOpacity
              style={styles.filterDropdownBtn}
              onPress={() =>
                openPicker(
                  'Select Category',
                  categories.length > 0 ? categories.map((c) => `${c.name} (${c.count})`) : CATEGORY_OPTIONS,
                  selectedCategory,
                  (val) => {
                    const cleanVal = val.split(' (')[0];
                    setSelectedCategory(cleanVal);
                  }
                )
              }
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownBtnText} numberOfLines={1}>
                {selectedCategory}
              </Text>
              <ChevronDown size={16} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Filter Summary Label */}
          <Text style={styles.filterSummaryText}>
            Showing {items.length} photo{items.length === 1 ? '' : 's'} | Filtered by: {selectedCategory} - All categories - {selectedYear}
          </Text>
        </View>

        {/* Gallery Content List/Grid */}
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading photos & testimonials...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyCard}>
            <ImageIcon size={48} color="#94A3B8" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No photos found</Text>
            <Text style={styles.emptySub}>
              Be the first to share a photo or testimonial with the KEA community!
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => setShowUploadModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyActionBtnText}>Upload First Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.galleryContentContainer}>
            {selectedCategory === 'Testimonials' ? (
              /* Testimonials Card View */
              <View style={styles.testimonialsList}>
                {items.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.testimonialCard}
                    onPress={() => openDetail(item)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.quoteMarkBg}>
                      <Text style={styles.quoteMarkText}>“</Text>
                    </View>

                    {/* Author Row */}
                    <View style={styles.authorRow}>
                      <View style={styles.authorAvatarCircle}>
                        <Text style={styles.authorAvatarText}>
                          {item.uploadedBy?.name?.charAt(0).toUpperCase() || 'A'}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.authorName}>{item.uploadedBy?.name || 'Anonymous'}</Text>
                        <Text style={styles.authorSub}>KEA Member</Text>
                      </View>
                    </View>

                    {/* 5 Stars */}
                    <View style={styles.starsRow}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 2 }} />
                      ))}
                    </View>

                    {/* Testimonial Quote */}
                    <Text style={styles.testimonialQuoteText} numberOfLines={4}>
                      {item.description || item.title}
                    </Text>

                    {/* Card Footer */}
                    <View style={styles.testimonialFooter}>
                      <Text style={styles.timeAgoText}>Uploaded {getTimeAgo(item.createdAt)}</Text>

                      <View style={styles.statsRow}>
                        <View style={styles.statChip}>
                          <Heart size={13} color="#64748B" />
                          <Text style={styles.statChipText}>{item.likes?.length || 0}</Text>
                        </View>
                        <View style={styles.statChip}>
                          <MessageCircle size={13} color="#64748B" />
                          <Text style={styles.statChipText}>{item.comments?.length || 0}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.tealBottomAccent} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              /* General Photo Grid Cards View */
              <View style={styles.photoGrid}>
                {items.map((item) => {
                  if (item.category === 'Testimonials') {
                    return (
                      <TouchableOpacity
                        key={item._id}
                        style={styles.testimonialCardMini}
                        onPress={() => openDetail(item)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.authorRowMini}>
                          <View style={styles.authorAvatarMini}>
                            <Text style={styles.authorAvatarTextMini}>
                              {item.uploadedBy?.name?.charAt(0).toUpperCase() || 'A'}
                            </Text>
                          </View>
                          <Text style={styles.authorNameMini} numberOfLines={1}>
                            {item.uploadedBy?.name || 'Anonymous'}
                          </Text>
                        </View>
                        <View style={styles.starsRowMini}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={12} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 1 }} />
                          ))}
                        </View>
                        <Text style={styles.testimonialQuoteMini} numberOfLines={3}>
                          {item.description || item.title}
                        </Text>
                        <View style={styles.tealBottomAccent} />
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={item._id}
                      style={styles.photoCard}
                      onPress={() => openDetail(item)}
                      activeOpacity={0.85}
                    >
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.photoImage} resizeMode="cover" />
                      ) : (
                        <View style={styles.photoPlaceholder}>
                          <ImageIcon size={32} color="#94A3B8" />
                          <Text style={styles.placeholderTitle} numberOfLines={2}>{item.title}</Text>
                        </View>
                      )}

                      <View style={styles.photoOverlay}>
                        <Text style={styles.photoTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <View style={styles.photoStatsRow}>
                          <View style={styles.photoStatItem}>
                            <Heart size={12} color="#FFFFFF" />
                            <Text style={styles.photoStatText}>{item.likes?.length || 0}</Text>
                          </View>
                          <View style={styles.photoStatItem}>
                            <MessageCircle size={12} color="#FFFFFF" />
                            <Text style={styles.photoStatText}>{item.comments?.length || 0}</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Pagination */}
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

      {/* Upload Photo / Testimonial Modal */}
      {showUploadModal && (
        <Modal transparent visible animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Upload Photo / Testimonial</Text>
                <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalFormContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Annual Conference 2025"
                  placeholderTextColor="#94A3B8"
                  value={newItem.title}
                  onChangeText={(txt) => setNewItem({ ...newItem, title: txt })}
                />

                <Text style={styles.label}>Category *</Text>
                <TouchableOpacity
                  style={styles.inputDropdown}
                  onPress={() =>
                    openPicker(
                      'Select Category',
                      ['Event Category', 'Project Showcase', 'Member Activities', 'Good Wishes', 'Testimonials'],
                      newItem.category,
                      (val) => setNewItem({ ...newItem, category: val })
                    )
                  }
                >
                  <Text style={styles.inputDropdownText}>{newItem.category}</Text>
                  <ChevronDown size={18} color="#64748B" />
                </TouchableOpacity>

                {newItem.category !== 'Testimonials' && (
                  <>
                    <Text style={styles.label}>Image URL</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="https://example.com/image.jpg"
                      placeholderTextColor="#94A3B8"
                      value={newItem.imageUrl}
                      onChangeText={(txt) => setNewItem({ ...newItem, imageUrl: txt })}
                    />
                  </>
                )}

                <Text style={styles.label}>Description / Testimonial Message</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe this photo or share your good wishes..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={newItem.description}
                  onChangeText={(txt) => setNewItem({ ...newItem, description: txt })}
                />

                <Text style={styles.label}>Event Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                  value={newItem.eventDate}
                  onChangeText={(txt) => setNewItem({ ...newItem, eventDate: txt })}
                />

                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Mumbai, India"
                  placeholderTextColor="#94A3B8"
                  value={newItem.location}
                  onChangeText={(txt) => setNewItem({ ...newItem, location: txt })}
                />

                <Text style={styles.label}>Tags (comma separated)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="conference, workshop, networking"
                  placeholderTextColor="#94A3B8"
                  value={newItem.tags}
                  onChangeText={(txt) => setNewItem({ ...newItem, tags: txt })}
                />

                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                    onPress={handleUploadSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.submitBtnText}>Submit Post</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowUploadModal(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Detail View Modal */}
      {showDetailModal && selectedItem && (
        <Modal transparent visible animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, styles.detailModalContainer]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedItem.title}
                </Text>
                <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {/* Visual / Banner Header */}
                {selectedItem.category === 'Testimonials' ? (
                  <View style={styles.testimonialDetailBox}>
                    <Text style={styles.quoteMarkLarge}>“</Text>
                    <Text style={styles.testimonialDetailText}>
                      {selectedItem.description || selectedItem.title}
                    </Text>
                    <Text style={styles.quoteMarkLarge}>”</Text>
                  </View>
                ) : selectedItem.imageUrl ? (
                  <Image source={{ uri: selectedItem.imageUrl }} style={styles.detailImage} resizeMode="cover" />
                ) : null}

                <View style={styles.detailBody}>
                  {/* Category Pill */}
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryPillText}>{selectedItem.category}</Text>
                  </View>

                  {/* Uploader Card */}
                  <View style={styles.uploaderCard}>
                    <View style={styles.authorAvatarCircle}>
                      <Text style={styles.authorAvatarText}>
                        {selectedItem.uploadedBy?.name?.charAt(0).toUpperCase() || 'A'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.uploaderName}>{selectedItem.uploadedBy?.name || 'Anonymous'}</Text>
                      <Text style={styles.uploaderSub}>Uploaded {getTimeAgo(selectedItem.createdAt)}</Text>
                    </View>
                  </View>

                  {/* Description & Tags */}
                  {selectedItem.description && selectedItem.category !== 'Testimonials' ? (
                    <Text style={styles.detailDesc}>{selectedItem.description}</Text>
                  ) : null}

                  {selectedItem.location ? (
                    <View style={styles.metaRow}>
                      <MapPin size={14} color="#EF4444" />
                      <Text style={styles.metaText}>{selectedItem.location}</Text>
                    </View>
                  ) : null}

                  {selectedItem.eventDate ? (
                    <View style={styles.metaRow}>
                      <Calendar size={14} color="#2563EB" />
                      <Text style={styles.metaText}>{selectedItem.eventDate}</Text>
                    </View>
                  ) : null}

                  {/* Actions Row */}
                  <View style={styles.detailActionsRow}>
                    <TouchableOpacity
                      style={styles.likeBtn}
                      onPress={() => handleLike(selectedItem._id)}
                    >
                      <Heart size={16} color="#EF4444" fill={selectedItem.likes?.includes('me') ? '#EF4444' : 'transparent'} />
                      <Text style={styles.likeBtnText}>{selectedItem.likes?.length || 0} Likes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.shareBtn}>
                      <Share2 size={16} color="#2563EB" />
                      <Text style={styles.shareBtnText}>Share</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Comments List */}
                  <View style={styles.commentsSection}>
                    <Text style={styles.commentsTitle}>
                      Comments ({selectedItem.comments?.length || 0})
                    </Text>

                    {selectedItem.comments?.length === 0 ? (
                      <Text style={styles.noCommentsText}>No comments yet. Be the first to leave one!</Text>
                    ) : (
                      selectedItem.comments?.map((c, idx) => (
                        <View key={idx} style={styles.commentItem}>
                          <View style={styles.commentAvatar}>
                            <Text style={styles.commentAvatarText}>
                              {c.user?.name?.charAt(0).toUpperCase() || 'A'}
                            </Text>
                          </View>
                          <View style={styles.commentContentBox}>
                            <Text style={styles.commentUserName}>{c.user?.name || 'Anonymous'}</Text>
                            <Text style={styles.commentBody}>{c.content}</Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>

                  {/* Add Comment Bar */}
                  <View style={styles.addCommentRow}>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Add a comment..."
                      placeholderTextColor="#94A3B8"
                      value={commentText}
                      onChangeText={setCommentText}
                    />
                    <TouchableOpacity
                      style={styles.sendCommentBtn}
                      onPress={() => handleAddComment(selectedItem._id)}
                    >
                      <Send size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Custom Picker Modal */}
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
                  const isSelected = item.startsWith(pickerModal.selected);
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

  // Top Header Card
  topHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  topHeaderLeft: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Filters Box
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
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
  dropdownsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterDropdownBtn: {
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
    color: '#334155',
    fontWeight: '500',
  },
  filterSummaryText: {
    fontSize: 12,
    color: '#64748B',
  },

  // Content States
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 10,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyActionBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },

  // Gallery List / Cards
  galleryContentContainer: {
    gap: 16,
  },
  testimonialsList: {
    gap: 14,
  },
  testimonialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  quoteMarkBg: {
    position: 'absolute',
    top: 6,
    right: 14,
    opacity: 0.15,
  },
  quoteMarkText: {
    fontSize: 72,
    fontWeight: '900',
    color: '#0D9488',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  authorAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  authorSub: {
    fontSize: 11,
    color: '#64748B',
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  testimonialQuoteText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#334155',
    lineHeight: 22,
    marginBottom: 14,
  },
  testimonialFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  timeAgoText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statChipText: {
    fontSize: 12,
    color: '#64748B',
  },
  tealBottomAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#0D9488',
  },

  // Photo Grid Layout
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoCard: {
    width: (SCREEN_WIDTH - 42) / 2,
    height: (SCREEN_WIDTH - 42) / 2,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F1F5F9',
  },
  placeholderTitle: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    marginTop: 6,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  photoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  photoStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  photoStatText: {
    fontSize: 11,
    color: '#FFFFFF',
  },

  testimonialCardMini: {
    width: (SCREEN_WIDTH - 42) / 2,
    minHeight: (SCREEN_WIDTH - 42) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    padding: 10,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  authorRowMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorAvatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarTextMini: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  authorNameMini: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  starsRowMini: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  testimonialQuoteMini: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#475569',
    lineHeight: 15,
  },

  // Pagination
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBtnActive: {
    backgroundColor: '#2563EB',
  },
  pageBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  pageBtnTextActive: {
    color: '#FFFFFF',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  modalFormContent: {
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    paddingTop: 8,
  },
  inputDropdown: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputDropdownText: {
    fontSize: 14,
    color: '#0F172A',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    marginBottom: 10,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '600',
  },

  // Detail Modal
  detailModalContainer: {
    height: '80%',
    padding: 14,
  },
  testimonialDetailBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginVertical: 10,
  },
  quoteMarkLarge: {
    fontSize: 32,
    color: '#2DD4BF',
    fontWeight: '900',
  },
  testimonialDetailText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
    marginVertical: 6,
  },
  detailImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 12,
  },
  detailBody: {
    gap: 12,
  },
  categoryPill: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
  },
  uploaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
  },
  uploaderName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  uploaderSub: {
    fontSize: 11,
    color: '#64748B',
  },
  detailDesc: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#64748B',
  },
  detailActionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  likeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    borderRadius: 8,
  },
  likeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    borderRadius: 8,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  commentsSection: {
    gap: 8,
  },
  commentsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  noCommentsText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  commentItem: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
  },
  commentContentBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  commentUserName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  commentBody: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
  },
  addCommentRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 13,
    color: '#0F172A',
  },
  sendCommentBtn: {
    backgroundColor: '#0D9488',
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Custom Picker
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 'auto',
    padding: 20,
    maxHeight: '60%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  pickerItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerItemActive: {
    backgroundColor: '#EFF6FF',
  },
  pickerItemText: {
    fontSize: 15,
    color: '#334155',
  },
  pickerItemTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
});
