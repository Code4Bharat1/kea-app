import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import {
  Search,
  FileText,
  Video,
  Link2,
  Image as ImageIcon,
  X,
  Plus,
  Upload,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Check,
} from 'lucide-react-native';

import { Colors } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { FileViewerModal } from '../../src/components/common/FileViewerModal';
import { resourcesApi } from '../../src/api/resources.api';
import { apiClient } from '../../src/api/client';
import { ResourceItem, ResourceCategory, ResourceCategoryStat } from '../../src/types';

// Complete List of Engineering Disciplines / Resource Categories (Matches Screenshot)
const DEFAULT_ENGINEERING_DISCIPLINES: ResourceCategory[] = [
  { _id: 'cat_1', name: 'AI/ML', subcategories: ['Deep Learning', 'NLP', 'Computer Vision', 'LLMs & Prompting'] },
  { _id: 'cat_2', name: 'Career guidance', subcategories: ['Resume Writing', 'Interview Prep', 'Higher Studies', 'Certifications'] },
  { _id: 'cat_3', name: 'Chemical', subcategories: ['Process Design', 'Plant Operations', 'Petrochemical', 'Thermodynamics'] },
  { _id: 'cat_4', name: 'Civil', subcategories: ['Structural', 'Geotechnical', 'Transportation', 'Water Resources'] },
  { _id: 'cat_5', name: 'Computer Science', subcategories: ['Algorithms', 'Data Structures', 'Operating Systems', 'Networking'] },
  { _id: 'cat_6', name: 'Data Science', subcategories: ['Data Analysis', 'Big Data', 'Data Visualization', 'Statistics'] },
  { _id: 'cat_7', name: 'Electrical', subcategories: ['Power Systems', 'Control Systems', 'Renewable Energy', 'High Voltage'] },
  { _id: 'cat_8', name: 'Electronics', subcategories: ['Embedded Systems', 'VLSI Design', 'IoT', 'Signal Processing'] },
  { _id: 'cat_9', name: 'HSE – Health, Safety & Environment', subcategories: ['Safety Guidelines', 'OSHA Compliance', 'Environmental Impact', 'Waste Management'] },
  { _id: 'cat_10', name: 'IT', subcategories: ['Software Architecture', 'Guide', 'DevOps', 'Security'] },
  { _id: 'cat_11', name: 'Mechanical', subcategories: ['HVAC Design', 'CAD & 3D Modeling', 'Thermal Engineering', 'Automotive'] },
  { _id: 'cat_12', name: 'Project reports', subcategories: ['Feasibility Study', 'DPR Reports', 'Case Studies', 'Audit Reports'] },
  { _id: 'cat_13', name: 'Technical papers', subcategories: ['Research Journals', 'Conference Papers', 'Patents', 'Standards'] },
  { _id: 'cat_14', name: 'Templates & checklists', subcategories: ['Civil', 'Checklists', 'Design', 'QA'] },
];

export default function KnowledgeHubScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All resources');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [categoriesStats, setCategoriesStats] = useState<ResourceCategoryStat[]>([]);
  const [resourceCategories, setResourceCategories] = useState<ResourceCategory[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [uploadType, setUploadType] = useState<'link' | 'file'>('link');

  // Dropdown Picker Modals for Create Resource Form
  const [showCategoryPickerModal, setShowCategoryPickerModal] = useState<boolean>(false);
  const [showSubcategoryPickerModal, setShowSubcategoryPickerModal] = useState<boolean>(false);
  const [showFormatPickerModal, setShowFormatPickerModal] = useState<boolean>(false);

  const [showViewer, setShowViewer] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<{
    url: string;
    name: string;
    format: string;
  } | null>(null);

  const [newResource, setNewResource] = useState({
    title: '',
    category: '',
    subcategory: '',
    format: '',
    tags: '',
    link: '',
    description: '',
    author: '',
  });

  const [pickedFile, setPickedFile] = useState<{
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
  } | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchResourcesData();
  }, [selectedCategory, selectedSubcategory, searchQuery, currentPage]);

  const fetchInitialData = async () => {
    try {
      const [statsRes, categoriesRes] = await Promise.all([
        resourcesApi.getCategoryStats(),
        resourcesApi.getResourceCategories(),
      ]);
      setCategoriesStats(statsRes);
      if (categoriesRes && categoriesRes.length > 0) {
        setResourceCategories(categoriesRes);
      } else {
        setResourceCategories(DEFAULT_ENGINEERING_DISCIPLINES);
      }
    } catch (error) {
      console.error('Error fetching initial category data:', error);
      setResourceCategories(DEFAULT_ENGINEERING_DISCIPLINES);
    }
  };

  const activeCategoriesList =
    resourceCategories.length > 0 ? resourceCategories : DEFAULT_ENGINEERING_DISCIPLINES;

  const fetchResourcesData = async () => {
    setLoading(true);
    try {
      const res = await resourcesApi.getResources({
        category: selectedCategory,
        subcategory: selectedSubcategory,
        search: searchQuery,
        page: currentPage,
        limit: 9,
      });
      setResources(res.resources);
      setTotalPages(res.totalPages || 1);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchInitialData(), fetchResourcesData()]);
    setRefreshing(false);
  };

  const handleResourceClick = async (resource: ResourceItem) => {
    // 🔗 External links / Video
    if (resource.format === 'Link' || resource.format === 'Video') {
      if (resource.externalLink) {
        try {
          const canOpen = await Linking.canOpenURL(resource.externalLink);
          if (canOpen) {
            await Linking.openURL(resource.externalLink);
          } else {
            setCurrentFile({
              url: resource.externalLink,
              name: resource.title,
              format: resource.format,
            });
            setShowViewer(true);
          }
        } catch {
          setCurrentFile({
            url: resource.externalLink,
            name: resource.title,
            format: resource.format,
          });
          setShowViewer(true);
        }
      } else {
        Alert.alert('Notice', 'No external link attached');
      }
      return;
    }

    // ❌ No Wasabi Key or file
    if (!resource.wasabiKey && !resource.fileUrl) {
      Alert.alert('File Error', 'File not available');
      return;
    }

    // 🔥 PDF → DIRECT OPEN / VIEWER
    if (resource.format === 'PDF') {
      const viewUrl = resource.fileUrl || `${apiClient.defaults.baseURL}/resources/${resource._id}/view`;
      setCurrentFile({
        url: viewUrl,
        name: resource.title,
        format: 'PDF',
      });
      setShowViewer(true);
      return;
    }

    // 🖼️ Images / DOCX / File → signed URL
    try {
      if (resource.fileUrl) {
        setCurrentFile({
          url: resource.fileUrl,
          name: resource.title,
          format: resource.format || 'File',
        });
        setShowViewer(true);
        return;
      }
      const url = await resourcesApi.getViewResourceUrl(resource._id);
      if (url) {
        setCurrentFile({
          url,
          name: resource.title,
          format: resource.format || 'File',
        });
        setShowViewer(true);
      } else {
        Alert.alert('Error', 'Unable to generate view URL');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to view file');
    }
  };

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'video/*',
          'image/*',
        ],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const fileAsset = res.assets[0];
        setPickedFile({
          uri: fileAsset.uri,
          name: fileAsset.name,
          size: fileAsset.size,
          mimeType: fileAsset.mimeType,
        });
      }
    } catch (err) {
      console.error('File pick error:', err);
    }
  };

  const resetForm = () => {
    setNewResource({
      title: '',
      category: '',
      subcategory: '',
      format: '',
      tags: '',
      link: '',
      description: '',
      author: '',
    });
    setPickedFile(null);
    setUploadType('link');
  };

  const handleCreateResource = async () => {
    if (!newResource.title.trim()) {
      Alert.alert('Validation Error', 'Please enter a resource title.');
      return;
    }
    if (!newResource.category) {
      Alert.alert('Validation Error', 'Please select an engineering discipline / category.');
      return;
    }
    if (uploadType === 'link' && !newResource.format) {
      Alert.alert('Validation Error', 'Please select a format (Link or Video).');
      return;
    }
    if (uploadType === 'link' && newResource.format === 'Link' && !newResource.link.trim()) {
      Alert.alert('Validation Error', 'Please enter a resource link/URL.');
      return;
    }

    setActionLoading(true);
    try {
      if (uploadType === 'link') {
        const tagsArray = newResource.tags
          ? newResource.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [];

        await resourcesApi.createResource({
          title: newResource.title,
          category: newResource.category,
          subcategory: newResource.subcategory || undefined,
          format: newResource.format,
          externalLink: newResource.link || undefined,
          tags: tagsArray,
          description: newResource.description,
          author: newResource.author || 'Anonymous',
        });
      } else {
        if (!pickedFile) {
          Alert.alert('Validation Error', 'Please select a file to upload.');
          setActionLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', {
          uri: pickedFile.uri,
          name: pickedFile.name,
          type: pickedFile.mimeType || 'application/octet-stream',
        } as any);

        formData.append('title', newResource.title);
        formData.append('category', newResource.category);
        if (newResource.subcategory) {
          formData.append('subcategory', newResource.subcategory);
        }
        formData.append('tags', newResource.tags);
        formData.append('description', newResource.description);
        formData.append('author', newResource.author || 'Anonymous');

        await resourcesApi.uploadResourceFile(formData);
      }

      setShowCreateModal(false);
      resetForm();
      fetchResourcesData();
      fetchInitialData();
      Alert.alert('Success', 'Resource submitted successfully! It will be visible after admin approval.');
    } catch (error: any) {
      console.error('Create resource error:', error);
      Alert.alert(
        'Submission Failed',
        error?.response?.data?.error || error?.response?.data?.message || 'Failed to submit resource'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const getIconComponent = (format?: string) => {
    switch (format) {
      case 'PDF':
      case 'DOCX':
      case 'File':
        return FileText;
      case 'Video':
        return Video;
      case 'Link':
        return Link2;
      case 'Images':
        return ImageIcon;
      default:
        return Link2;
    }
  };

  const totalResourceCount =
    categoriesStats.find((c) => c.name === 'All resources')?.count ||
    categoriesStats.reduce((sum, c) => (c.name !== 'All resources' ? sum + c.count : sum), 0) ||
    resources.length;

  const selectedDisciplineSubcategories =
    activeCategoriesList.find((c) => c.name === newResource.category)?.subcategories || [];

  const currentCategorySubcategories =
    activeCategoriesList.find((c) => c.name === selectedCategory)?.subcategories || [];

  const renderResourceCard = ({ item }: { item: ResourceItem }) => {
    const Icon = getIconComponent(item.format);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => handleResourceClick(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Icon size={20} color="#2563EB" />
          </View>
          <View style={styles.cardHeaderMain}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.cardSubText}>
              {item.format || 'Link'}
              {item.subcategory ? ` • ${item.subcategory}` : ''}
            </Text>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {item.tags && item.tags.length > 0 ? (
          <View style={styles.tagRow}>
            {item.tags.slice(0, 3).map((tag, idx) => (
              <View key={idx} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>+{item.tags.length - 3}</Text>
              </View>
            )}
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.authorText} numberOfLines={1}>
            {item.author || 'Anonymous'}
          </Text>
          <Text style={styles.dateText}>
            {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
              : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Knowledge Hub" showBack />

      {/* File Viewer Modal */}
      {showViewer && currentFile && (
        <FileViewerModal
          visible={showViewer}
          fileUrl={currentFile.url}
          fileName={currentFile.name}
          format={currentFile.format}
          onClose={() => {
            setShowViewer(false);
            setCurrentFile(null);
          }}
        />
      )}

      <FlatList
        data={resources}
        keyExtractor={(item) => item._id}
        renderItem={renderResourceCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
          />
        }
        ListHeaderComponent={
          <View>
            {/* Top Page Header - Matching Web Title & Actions */}
            <View style={styles.pageHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mainTitle}>Knowledge Hub</Text>
                <Text style={styles.mainSubtitle}>
                  Search and browse curated engineering resources
                </Text>
              </View>
              <View style={styles.headerRightBox}>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => setShowCreateModal(true)}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.createButtonText}>Create Resource</Text>
                </TouchableOpacity>
                <Text style={styles.totalResourceBadge}>
                  {totalResourceCount} resources
                </Text>
              </View>
            </View>

            {/* Search Bar & Filter Toggle */}
            <View style={styles.searchRow}>
              <View style={styles.searchBar}>
                <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search resources..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    setCurrentPage(1);
                  }}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.filterIconButton}
                onPress={() => setShowCategoryModal(true)}
              >
                <Filter size={18} color="#3B82F6" />
                <ChevronDown size={14} color="#3B82F6" style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </View>

            {/* Horizontal Categories Scroll Strip */}
            <View style={styles.categorySection}>
              <Text style={styles.sectionHeaderTitle}>Categories</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesScrollContainer}
              >
                <TouchableOpacity
                  style={[
                    styles.catPill,
                    selectedCategory === 'All resources' && styles.catPillActive,
                  ]}
                  onPress={() => {
                    setSelectedCategory('All resources');
                    setSelectedSubcategory('');
                    setCurrentPage(1);
                  }}
                >
                  <Text
                    style={[
                      styles.catPillText,
                      selectedCategory === 'All resources' && styles.catPillTextActive,
                    ]}
                  >
                    All resources
                  </Text>
                  <View
                    style={[
                      styles.countBadge,
                      selectedCategory === 'All resources' && styles.countBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.countBadgeText,
                        selectedCategory === 'All resources' && styles.countBadgeTextActive,
                      ]}
                    >
                      {totalResourceCount}
                    </Text>
                  </View>
                </TouchableOpacity>

                {categoriesStats
                  .filter((c) => c.name !== 'All resources')
                  .map((cat) => {
                    const isSelected = selectedCategory === cat.name;
                    return (
                      <TouchableOpacity
                        key={cat.name}
                        style={[styles.catPill, isSelected && styles.catPillActive]}
                        onPress={() => {
                          setSelectedCategory(cat.name);
                          setSelectedSubcategory('');
                          setCurrentPage(1);
                        }}
                      >
                        <Text style={[styles.catPillText, isSelected && styles.catPillTextActive]}>
                          {cat.name}
                        </Text>
                        <View style={[styles.countBadge, isSelected && styles.countBadgeActive]}>
                          <Text style={[styles.countBadgeText, isSelected && styles.countBadgeTextActive]}>
                            {cat.count}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>

            {/* Subcategories Horizontal Bar (If category has subcategories) */}
            {selectedCategory !== 'All resources' && currentCategorySubcategories.length > 0 ? (
              <View style={styles.subcategorySection}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                >
                  <TouchableOpacity
                    style={[
                      styles.subCatChip,
                      selectedSubcategory === '' && styles.subCatChipActive,
                    ]}
                    onPress={() => {
                      setSelectedSubcategory('');
                      setCurrentPage(1);
                    }}
                  >
                    <Text
                      style={[
                        styles.subCatChipText,
                        selectedSubcategory === '' && styles.subCatChipTextActive,
                      ]}
                    >
                      All {selectedCategory}
                    </Text>
                  </TouchableOpacity>

                  {currentCategorySubcategories.map((sub) => {
                    const isSelected = selectedSubcategory === sub;
                    return (
                      <TouchableOpacity
                        key={sub}
                        style={[styles.subCatChip, isSelected && styles.subCatChipActive]}
                        onPress={() => {
                          setSelectedSubcategory(sub);
                          setCurrentPage(1);
                        }}
                      >
                        <Text
                          style={[
                            styles.subCatChipText,
                            isSelected && styles.subCatChipTextActive,
                          ]}
                        >
                          {sub}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {/* Resources Section Header */}
            <View style={styles.resourcesSectionHeader}>
              <Text style={styles.resourcesTitle}>Resources</Text>
              <Text style={styles.resourcesCountSubtext}>
                {loading ? 'Loading resources...' : `Showing ${resources.length} results`}
              </Text>
            </View>

            {loading && !refreshing ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Fetching resources...</Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyBox}>
              <FileText size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No resources found</Text>
              <Text style={styles.emptySub}>Try adjusting your search or category filters</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          !loading && resources.length > 0 && totalPages > 1 ? (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                disabled={currentPage === 1}
                onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={18} color={currentPage === 1 ? '#9CA3AF' : '#2563EB'} />
                <Text style={[styles.pageBtnText, currentPage === 1 && styles.pageBtnTextDisabled]}>
                  Previous
                </Text>
              </TouchableOpacity>

              <Text style={styles.pageText}>
                Page {currentPage} of {totalPages}
              </Text>

              <TouchableOpacity
                style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
                disabled={currentPage === totalPages}
                onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <Text style={[styles.pageBtnText, currentPage === totalPages && styles.pageBtnTextDisabled]}>
                  Next
                </Text>
                <ChevronRight size={18} color={currentPage === totalPages ? '#9CA3AF' : '#2563EB'} />
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* Main Category Filter Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <TouchableOpacity
            style={styles.categoryModalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Filter by Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <X size={20} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              <TouchableOpacity
                style={[
                  styles.catModalItem,
                  selectedCategory === 'All resources' && styles.catModalItemActive,
                ]}
                onPress={() => {
                  setSelectedCategory('All resources');
                  setSelectedSubcategory('');
                  setCurrentPage(1);
                  setShowCategoryModal(false);
                }}
              >
                <Text
                  style={[
                    styles.catModalItemText,
                    selectedCategory === 'All resources' && styles.catModalItemTextActive,
                  ]}
                >
                  All resources
                </Text>
                <Text style={styles.catModalCount}>{totalResourceCount}</Text>
              </TouchableOpacity>

              {categoriesStats
                .filter((c) => c.name !== 'All resources')
                .map((cat) => {
                  const isSelected = selectedCategory === cat.name;
                  const rc = activeCategoriesList.find((r) => r.name === cat.name);

                  return (
                    <View key={cat.name}>
                      <TouchableOpacity
                        style={[styles.catModalItem, isSelected && styles.catModalItemActive]}
                        onPress={() => {
                          setSelectedCategory(cat.name);
                          setSelectedSubcategory('');
                          setCurrentPage(1);
                        }}
                      >
                        <Text style={[styles.catModalItemText, isSelected && styles.catModalItemTextActive]}>
                          {cat.name}
                        </Text>
                        <Text style={styles.catModalCount}>{cat.count}</Text>
                      </TouchableOpacity>

                      {isSelected && rc?.subcategories?.length ? (
                        <View style={styles.subCatIndentBox}>
                          <TouchableOpacity
                            style={[
                              styles.subCatModalItem,
                              selectedSubcategory === '' && styles.subCatModalItemActive,
                            ]}
                            onPress={() => {
                              setSelectedSubcategory('');
                              setCurrentPage(1);
                              setShowCategoryModal(false);
                            }}
                          >
                            <Text style={styles.subCatModalItemText}>All {cat.name}</Text>
                          </TouchableOpacity>
                          {rc.subcategories.map((sub) => (
                            <TouchableOpacity
                              key={sub}
                              style={[
                                styles.subCatModalItem,
                                selectedSubcategory === sub && styles.subCatModalItemActive,
                              ]}
                              onPress={() => {
                                setSelectedSubcategory(sub);
                                setCurrentPage(1);
                                setShowCategoryModal(false);
                              }}
                            >
                              <Text
                                style={[
                                  styles.subCatModalItemText,
                                  selectedSubcategory === sub && styles.subCatModalItemTextActive,
                                ]}
                              >
                                {sub}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* CREATE NEW RESOURCE MODAL (Matching User UI Screenshot 1:1) */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowCreateModal(false);
            resetForm();
          }}
        >
          <TouchableOpacity
            style={styles.createModalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header: Title + X close button */}
            <View style={styles.createModalHeader}>
              <Text style={styles.createModalTitle}>Create New Resource</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.createFormScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Add Link vs Upload File Tabs */}
              <View style={styles.typeSwitcherRow}>
                <TouchableOpacity
                  style={[
                    styles.typeSwitchBtn,
                    uploadType === 'link' && styles.typeSwitchBtnActive,
                  ]}
                  onPress={() => {
                    setUploadType('link');
                    setNewResource({ ...newResource, format: '' });
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.typeSwitchText,
                      uploadType === 'link' && styles.typeSwitchTextActive,
                    ]}
                  >
                    Add Link
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeSwitchBtn,
                    uploadType === 'file' && styles.typeSwitchBtnActive,
                  ]}
                  onPress={() => {
                    setUploadType('file');
                    setNewResource({ ...newResource, format: '' });
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.typeSwitchText,
                      uploadType === 'file' && styles.typeSwitchTextActive,
                    ]}
                  >
                    Upload File
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Resource Title * */}
              <Text style={styles.fieldLabel}>
                Resource Title <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g., Bridge Design Checklist"
                placeholderTextColor="#9CA3AF"
                value={newResource.title}
                onChangeText={(text) => setNewResource({ ...newResource, title: text })}
              />

              {/* 2-Column Row for Engineering Discipline * & Format * */}
              <View style={styles.dropdownRowGrid}>
                {/* Engineering Discipline Dropdown */}
                <View style={styles.dropdownCol}>
                  <Text style={styles.fieldLabel}>
                    Engineering Discipline <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.selectDropdownBtn}
                    onPress={() => setShowCategoryPickerModal(true)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.selectDropdownText,
                        !newResource.category && styles.selectDropdownPlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {newResource.category || 'Select discipline/category'}
                    </Text>
                    <ChevronDown size={18} color="#374151" />
                  </TouchableOpacity>
                </View>

                {/* Format Dropdown (Only when uploadType === 'link') */}
                {uploadType === 'link' ? (
                  <View style={styles.dropdownCol}>
                    <Text style={styles.fieldLabel}>
                      Format <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.selectDropdownBtn}
                      onPress={() => setShowFormatPickerModal(true)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.selectDropdownText,
                          !newResource.format && styles.selectDropdownPlaceholder,
                        ]}
                        numberOfLines={1}
                      >
                        {newResource.format || 'Select format'}
                      </Text>
                      <ChevronDown size={18} color="#374151" />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              {/* Subcategory Dropdown (if discipline selected & has subcategories) */}
              {newResource.category && selectedDisciplineSubcategories.length > 0 ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.fieldLabel}>Subcategory</Text>
                  <TouchableOpacity
                    style={styles.selectDropdownBtn}
                    onPress={() => setShowSubcategoryPickerModal(true)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.selectDropdownText,
                        !newResource.subcategory && styles.selectDropdownPlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {newResource.subcategory || 'Select subcategory (Optional)'}
                    </Text>
                    <ChevronDown size={18} color="#374151" />
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Author */}
              <Text style={styles.fieldLabel}>Author</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Your name or organization"
                placeholderTextColor="#9CA3AF"
                value={newResource.author}
                onChangeText={(text) => setNewResource({ ...newResource, author: text })}
              />

              {/* Tags (comma separated) */}
              <Text style={styles.fieldLabel}>Tags (comma separated)</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g., Template, Civil, Guide"
                placeholderTextColor="#9CA3AF"
                value={newResource.tags}
                onChangeText={(text) => setNewResource({ ...newResource, tags: text })}
              />

              {/* Resource Link/URL OR File Upload */}
              {uploadType === 'link' ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.fieldLabel}>
                    Resource Link/URL{' '}
                    {newResource.format === 'Link' ? <Text style={styles.requiredStar}>*</Text> : null}
                  </Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="https://example.com/resource"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="url"
                    autoCapitalize="none"
                    value={newResource.link}
                    onChangeText={(text) => setNewResource({ ...newResource, link: text })}
                  />
                  <Text style={styles.fieldSubtext}>Optional for video resources</Text>
                </View>
              ) : (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.fieldLabel}>
                    Upload File <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.filePickerContainer}
                    onPress={handlePickDocument}
                    activeOpacity={0.7}
                  >
                    <Upload size={22} color="#2563EB" />
                    <Text style={styles.filePickerText} numberOfLines={1}>
                      {pickedFile ? pickedFile.name : 'Choose file (PDF, DOCX, Video, Image)...'}
                    </Text>
                  </TouchableOpacity>
                  {pickedFile && pickedFile.size ? (
                    <Text style={styles.fileSizeBadge}>
                      Selected: {pickedFile.name} ({(pickedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </Text>
                  ) : null}
                </View>
              )}

              {/* Description */}
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.fieldInput, styles.textAreaInput]}
                placeholder="Brief description of the resource..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={newResource.description}
                onChangeText={(text) => setNewResource({ ...newResource, description: text })}
              />

              {/* Admin Approval Notice Banner */}
              <View style={styles.adminNoticeContainer}>
                <View style={styles.adminNoticeIconCircle}>
                  <Info size={18} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.adminNoticeHeading}>Admin Approval Required</Text>
                  <Text style={styles.adminNoticeBody}>
                    Your submitted resource will be reviewed by an administrator before it becomes visible to all users.
                  </Text>
                </View>
              </View>

              {/* Submit & Cancel Action Buttons */}
              <View style={styles.formButtonRow}>
                <TouchableOpacity
                  style={[styles.submitActionBtn, actionLoading && styles.submitActionBtnDisabled]}
                  disabled={actionLoading}
                  onPress={handleCreateResource}
                  activeOpacity={0.8}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitActionBtnText}>
                      {uploadType === 'link' ? 'Submit Resource' : 'Submit File'}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelActionBtn}
                  disabled={actionLoading}
                  onPress={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelActionBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* DISCIPLINE / CATEGORY PICKER POPUP (Matching Screenshot List 1:1) */}
      <Modal
        visible={showCategoryPickerModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowCategoryPickerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlayCenter}
          activeOpacity={1}
          onPress={() => setShowCategoryPickerModal(false)}
        >
          <TouchableOpacity
            style={styles.pickerModalBox}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select discipline/category</Text>
              <TouchableOpacity onPress={() => setShowCategoryPickerModal(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={true}>
              {/* Default Placeholder Option */}
              <TouchableOpacity
                style={[
                  styles.pickerItemRow,
                  !newResource.category && styles.pickerItemRowSelectedHeader,
                ]}
                onPress={() => {
                  setNewResource({ ...newResource, category: '', subcategory: '' });
                  setShowCategoryPickerModal(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    !newResource.category && styles.pickerItemTextSelectedHeader,
                  ]}
                >
                  Select discipline/category
                </Text>
                {!newResource.category ? <Check size={18} color="#FFFFFF" /> : null}
              </TouchableOpacity>

              {activeCategoriesList.map((cat) => {
                const isSelected = newResource.category === cat.name;
                return (
                  <TouchableOpacity
                    key={cat._id || cat.name}
                    style={[styles.pickerItemRow, isSelected && styles.pickerItemRowSelected]}
                    onPress={() => {
                      setNewResource({
                        ...newResource,
                        category: cat.name,
                        subcategory: '',
                      });
                      setShowCategoryPickerModal(false);
                    }}
                  >
                    <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                      {cat.name}
                    </Text>
                    {isSelected ? <Check size={18} color="#2563EB" /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* FORMAT PICKER POPUP */}
      <Modal
        visible={showFormatPickerModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowFormatPickerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlayCenter}
          activeOpacity={1}
          onPress={() => setShowFormatPickerModal(false)}
        >
          <TouchableOpacity
            style={styles.pickerModalBox}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Format</Text>
              <TouchableOpacity onPress={() => setShowFormatPickerModal(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {['Link', 'Video'].map((fmt) => {
              const isSelected = newResource.format === fmt;
              return (
                <TouchableOpacity
                  key={fmt}
                  style={[styles.pickerItemRow, isSelected && styles.pickerItemRowSelected]}
                  onPress={() => {
                    setNewResource({ ...newResource, format: fmt });
                    setShowFormatPickerModal(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                    {fmt}
                  </Text>
                  {isSelected ? <Check size={18} color="#2563EB" /> : null}
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* SUBCATEGORY PICKER POPUP */}
      <Modal
        visible={showSubcategoryPickerModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowSubcategoryPickerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlayCenter}
          activeOpacity={1}
          onPress={() => setShowSubcategoryPickerModal(false)}
        >
          <TouchableOpacity
            style={styles.pickerModalBox}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Subcategory</Text>
              <TouchableOpacity onPress={() => setShowSubcategoryPickerModal(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity
                style={[
                  styles.pickerItemRow,
                  !newResource.subcategory && styles.pickerItemRowSelected,
                ]}
                onPress={() => {
                  setNewResource({ ...newResource, subcategory: '' });
                  setShowSubcategoryPickerModal(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    !newResource.subcategory && styles.pickerItemTextSelected,
                  ]}
                >
                  None (Clear Subcategory)
                </Text>
                {!newResource.subcategory ? <Check size={18} color="#2563EB" /> : null}
              </TouchableOpacity>

              {selectedDisciplineSubcategories.map((sub) => {
                const isSelected = newResource.subcategory === sub;
                return (
                  <TouchableOpacity
                    key={sub}
                    style={[styles.pickerItemRow, isSelected && styles.pickerItemRowSelected]}
                    onPress={() => {
                      setNewResource({ ...newResource, subcategory: sub });
                      setShowSubcategoryPickerModal(false);
                    }}
                  >
                    <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                      {sub}
                    </Text>
                    {isSelected ? <Check size={18} color="#2563EB" /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 14,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
  },
  headerRightBox: {
    alignItems: 'flex-end',
    gap: 6,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  totalResourceBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  filterIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
  },
  categorySection: {
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  categoriesScrollContainer: {
    gap: 8,
    paddingRight: 16,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  catPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  catPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  catPillTextActive: {
    fontWeight: '700',
    color: '#2563EB',
  },
  countBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countBadgeActive: {
    backgroundColor: '#DBEAFE',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  countBadgeTextActive: {
    color: '#2563EB',
  },
  subcategorySection: {
    marginBottom: 14,
  },
  subCatChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  subCatChipActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
  },
  subCatChipText: {
    fontSize: 12,
    color: '#4B5563',
  },
  subCatChipTextActive: {
    fontWeight: '700',
    color: '#1D4ED8',
  },
  resourcesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 12,
  },
  resourcesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  resourcesCountSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderMain: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563EB',
    lineHeight: 20,
  },
  cardSubText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tagPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  authorText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
    marginRight: 8,
  },
  dateText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageBtnText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  pageBtnTextDisabled: {
    color: '#9CA3AF',
  },
  pageText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },

  // Overlay Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  categoryModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 14,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  catModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  catModalItemActive: {
    backgroundColor: '#EFF6FF',
  },
  catModalItemText: {
    fontSize: 14,
    color: '#374151',
  },
  catModalItemTextActive: {
    fontWeight: '700',
    color: '#2563EB',
  },
  catModalCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  subCatIndentBox: {
    paddingLeft: 18,
    borderLeftWidth: 2,
    borderLeftColor: '#DBEAFE',
    marginLeft: 12,
    marginVertical: 4,
  },
  subCatModalItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  subCatModalItemActive: {
    backgroundColor: '#DBEAFE',
  },
  subCatModalItemText: {
    fontSize: 13,
    color: '#4B5563',
  },
  subCatModalItemTextActive: {
    fontWeight: '700',
    color: '#2563EB',
  },

  // CREATE NEW RESOURCE MODAL STYLES (Exact 1:1 with Screenshot UI)
  createModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    maxHeight: '92%',
  },
  createModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 16,
  },
  createModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  createFormScroll: {
    paddingBottom: 10,
  },
  typeSwitcherRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  typeSwitchBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeSwitchBtnActive: {
    backgroundColor: '#2563EB',
  },
  typeSwitchText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  typeSwitchTextActive: {
    color: '#FFFFFF',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    marginTop: 10,
  },
  requiredStar: {
    color: '#EF4444',
  },
  fieldInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    color: '#111827',
  },
  fieldSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  textAreaInput: {
    height: 90,
    paddingVertical: 10,
  },

  // 2 Column Dropdown Grid
  dropdownRowGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  dropdownCol: {
    flex: 1,
  },
  selectDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
  },
  selectDropdownText: {
    fontSize: 13,
    color: '#111827',
    flex: 1,
  },
  selectDropdownPlaceholder: {
    color: '#6B7280',
  },

  // File Upload Box
  filePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 16,
    gap: 10,
  },
  filePickerText: {
    flex: 1,
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '500',
  },
  fileSizeBadge: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 4,
  },

  // Admin Notice Box
  adminNoticeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 14,
    marginTop: 18,
    marginBottom: 14,
  },
  adminNoticeIconCircle: {
    marginRight: 10,
    marginTop: 2,
  },
  adminNoticeHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  adminNoticeBody: {
    fontSize: 12,
    color: '#2563EB',
    marginTop: 2,
    lineHeight: 17,
  },

  // Action Buttons
  formButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  submitActionBtn: {
    flex: 1.2,
    backgroundColor: '#2563EB',
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitActionBtnDisabled: {
    opacity: 0.6,
  },
  submitActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelActionBtn: {
    flex: 0.8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelActionBtnText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },

  // Dropdown Picker Modal (Center popup)
  pickerModalBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 8,
  },
  pickerModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  pickerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  pickerItemRowSelectedHeader: {
    backgroundColor: '#2563EB',
  },
  pickerItemTextSelectedHeader: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pickerItemRowSelected: {
    backgroundColor: '#EFF6FF',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#374151',
  },
  pickerItemTextSelected: {
    fontWeight: '700',
    color: '#2563EB',
  },
});
