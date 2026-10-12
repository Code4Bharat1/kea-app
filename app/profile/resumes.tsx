import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { Loader } from '../../src/components/common/Loader';
import { EmptyState } from '../../src/components/common/EmptyState';
import { userApi } from '../../src/api/user.api';
import { ResumeItem } from '../../src/types';
import {
  FileText,
  Upload,
  Trash2,
  Calendar,
  Eye,
  Plus,
  X,
  Lightbulb,
  FileCheck,
} from 'lucide-react-native';

export default function ResumeManagerScreen() {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Upload Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  // View state
  const [openingId, setOpeningId] = useState<string | null>(null);

  const fetchResumes = async () => {
    try {
      const data = await userApi.getMyResumes();
      setResumes(data);
    } catch (err) {
      console.error('Error fetching resumes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await userApi.getMyResumes();
        if (isMounted) setResumes(data);
      } catch (err) {
        console.error('Error fetching resumes:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchResumes();
    setRefreshing(false);
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      if (asset.size && asset.size > 5 * 1024 * 1024) {
        Alert.alert('File size too large', 'File size must be less than 5 MB');
        return;
      }

      setSelectedFile(asset);
      if (!uploadTitle) {
        const cleanName = asset.name.replace(/\.[^/.]+$/, '');
        setUploadTitle(cleanName);
      }
    } catch (err) {
      console.error('Pick document error:', err);
      Alert.alert('Error', 'Failed to pick document.');
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      Alert.alert('Validation', 'Please select a resume file first.');
      return;
    }
    if (!uploadTitle.trim()) {
      Alert.alert('Validation', 'Please enter a title for your resume.');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'application/pdf',
      } as any);
      formData.append('title', uploadTitle.trim());

      await userApi.uploadResume(formData);
      Alert.alert('Success 🎉', 'Resume uploaded successfully!');
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadTitle('');
      await fetchResumes();
    } catch (err: any) {
      console.error('Upload error:', err);
      Alert.alert('Upload Error', err?.response?.data?.message || 'Failed to upload resume.');
    } finally {
      setUploading(false);
    }
  };

  const handleViewResume = async (resume: ResumeItem) => {
    try {
      setOpeningId(resume._id);
      const res = await userApi.getViewResumeUrl(resume._id);
      if (res && res.url) {
        const canOpen = await Linking.canOpenURL(res.url);
        if (canOpen) {
          await Linking.openURL(res.url);
        } else {
          Alert.alert('View Error', 'Cannot open URL on this device.');
        }
      } else {
        Alert.alert('View Error', 'Unable to retrieve resume file URL.');
      }
    } catch (err) {
      console.error('View resume error:', err);
      Alert.alert('Error', 'Failed to open resume.');
    } finally {
      setOpeningId(null);
    }
  };

  const handleDeleteResume = (id: string, name: string) => {
    Alert.alert('Delete Resume', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await userApi.deleteResume(id);
            setResumes(resumes.filter((r) => r._id !== id));
            Alert.alert('Deleted', 'Resume deleted successfully.');
          } catch (err) {
            console.error('Delete error:', err);
            Alert.alert('Error', 'Failed to delete resume.');
          }
        },
      },
    ]);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const renderResumeCard = ({ item }: { item: ResumeItem }) => {
    const title = item.title || item.originalName || item.fileName || 'Resume Document';
    const subName = item.originalName || item.fileName || '';
    const dateStr = item.createdAt || item.uploadedAt;
    const formattedDate = dateStr
      ? new Date(dateStr).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'Recently';
    const isOpening = openingId === item._id;

    return (
      <Card style={styles.card}>
        <View style={styles.resumeHeader}>
          <View style={styles.fileIconBox}>
            <FileText size={24} color={Colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.titleText} numberOfLines={1}>
              {title}
            </Text>
            {subName ? (
              <Text style={styles.subText} numberOfLines={1}>
                {subName}
              </Text>
            ) : null}
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{formatFileSize(item.size || item.fileSize)}</Text>
              <Text style={styles.dotSeparator}>•</Text>
              <Calendar size={11} color={Colors.textMuted} style={{ marginRight: 2 }} />
              <Text style={styles.metaText}>{formattedDate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => handleViewResume(item)}
            disabled={isOpening}
          >
            {isOpening ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <Eye size={16} color={Colors.primary} />
                <Text style={styles.viewBtnText}>View</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteResume(item._id, title)}
          >
            <Trash2 size={16} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderListHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.topTitleRow}>
        <View>
          <Text style={styles.screenTitle}>My Documents</Text>
          <Text style={styles.screenSub}>Manage your resumes and documents</Text>
        </View>
        <TouchableOpacity
          style={styles.headerUploadBtn}
          onPress={() => setShowUploadModal(true)}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.headerUploadBtnText}>Upload</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderListFooter = () => (
    <View style={styles.footerSection}>
      <View style={styles.tipsCard}>
        <View style={styles.tipsHeader}>
          <Lightbulb size={18} color="#1E40AF" />
          <Text style={styles.tipsTitle}>Tips for uploading resumes</Text>
        </View>
        <Text style={styles.tipItem}>• Upload your resume in PDF or Word format</Text>
        <Text style={styles.tipItem}>• Keep your resume updated with latest experience</Text>
        <Text style={styles.tipItem}>• You can upload multiple versions for different job types</Text>
        <Text style={styles.tipItem}>• Maximum file size: 5 MB</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="My Documents" showBack />

      {loading ? (
        <Loader message="Loading documents..." fullScreen />
      ) : (
        <FlatList
          data={resumes}
          keyExtractor={(item) => item._id}
          renderItem={renderResumeCard}
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={resumes.length > 0 ? renderListFooter : null}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View>
              <EmptyState
                title="No resumes uploaded"
                description="Upload your resume to easily apply for jobs"
                actionTitle="Upload Resume"
                onAction={() => setShowUploadModal(true)}
              />
              {renderListFooter()}
            </View>
          }
        />
      )}

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Upload Resume</Text>
                <Text style={styles.modalSub}>Upload your resume in PDF or Word format</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setUploadTitle('');
                }}
                style={styles.closeBtn}
              >
                <X size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Resume Title *</Text>
              <TextInput
                style={styles.input}
                value={uploadTitle}
                onChangeText={setUploadTitle}
                placeholder="e.g., Software Engineer Resume"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.label}>Upload File *</Text>
              <TouchableOpacity
                style={[
                  styles.pickerArea,
                  selectedFile && styles.pickerAreaSelected,
                ]}
                onPress={handlePickDocument}
              >
                <Upload size={32} color={selectedFile ? Colors.primary : Colors.textMuted} />
                <Text style={styles.pickerTitle}>
                  {selectedFile ? selectedFile.name : 'Tap to select document'}
                </Text>
                <Text style={styles.pickerSub}>PDF, DOC, DOCX (max. 5MB)</Text>
              </TouchableOpacity>

              {selectedFile ? (
                <View style={styles.fileSelectedBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <FileCheck size={20} color="#166534" />
                    <View style={{ marginLeft: 8, flex: 1 }}>
                      <Text style={styles.fileSelectedName} numberOfLines={1}>
                        {selectedFile.name}
                      </Text>
                      <Text style={styles.fileSelectedSize}>
                        {formatFileSize(selectedFile.size)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedFile(null)}>
                    <X size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              ) : null}

              <View style={styles.modalActions}>
                <Button
                  title={uploading ? 'Uploading...' : 'Upload Resume'}
                  onPress={handleUploadSubmit}
                  loading={uploading}
                  disabled={uploading || !selectedFile}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setUploadTitle('');
                  }}
                  disabled={uploading}
                  style={{ flex: 1, marginLeft: 10 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { padding: 16 },
  headerSection: { marginBottom: 16 },
  topTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  screenSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  headerUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  headerUploadBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 6,
  },
  card: { marginBottom: 12, padding: 16 },
  resumeHeader: { flexDirection: 'row', alignItems: 'center' },
  fileIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  subText: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { fontSize: 11, color: Colors.textMuted },
  dotSeparator: { fontSize: 11, color: Colors.textMuted, marginHorizontal: 4 },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  viewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  viewBtnText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSection: { marginTop: 16, marginBottom: 24 },
  tipsCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 16,
  },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  tipsTitle: { fontSize: 14, fontWeight: '700', color: '#1E40AF', marginLeft: 8 },
  tipItem: { fontSize: 12, color: '#1E3A8A', marginTop: 4, lineHeight: 18 },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  modalSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  closeBtn: { padding: 6 },
  modalBody: { paddingTop: 16 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  pickerArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
  },
  pickerAreaSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  pickerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  fileSelectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  fileSelectedName: { fontSize: 13, fontWeight: '600', color: '#166534' },
  fileSelectedSize: { fontSize: 11, color: '#15803D', marginTop: 1 },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
});
