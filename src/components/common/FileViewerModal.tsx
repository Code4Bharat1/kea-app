import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  AlertTriangle,
} from 'lucide-react-native';
import { Colors } from '../../constants/theme';

export interface FileViewerModalProps {
  visible: boolean;
  fileUrl: string | null;
  fileName?: string;
  format?: string;
  onClose: () => void;
}

export function FileViewerModal({
  visible,
  fileUrl,
  fileName = 'Document',
  format = 'File',
  onClose,
}: FileViewerModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (visible && fileUrl) {
      setLoading(true);
      setError(false);
    }
  }, [visible, fileUrl]);

  if (!visible || !fileUrl) {
    return null;
  }

  const isPDF = format === 'PDF';
  const isImage = format === 'Images' || format === 'Image';
  const isDocument = format === 'DOCX' || format === 'DOC';

  // Determine viewer URL based on format
  const getViewerUrl = (): string => {
    if (!fileUrl) return '';
    if (isPDF) {
      return fileUrl;
    } else if (isDocument) {
      return `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    }
    return fileUrl;
  };

  const handleDownload = async () => {
    try {
      if (fileUrl) {
        await Linking.openURL(fileUrl);
      }
    } catch (err) {
      Alert.alert('Download Error', 'Unable to download file directly.');
    }
  };

  const handleOpenInNewTab = async () => {
    try {
      const viewerUrl = getViewerUrl();
      if (viewerUrl) {
        await Linking.openURL(viewerUrl);
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to open file in browser');
    }
  };

  const getFormatIcon = () => {
    if (isImage) return ImageIcon;
    if (format === 'Video') return VideoIcon;
    return FileText;
  };

  const FormatIcon = getFormatIcon();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#111827" />

        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.fileNameText} numberOfLines={1}>
              {fileName}
            </Text>
            <View style={styles.formatBadge}>
              <Text style={styles.formatBadgeText}>{format}</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleOpenInNewTab}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ExternalLink size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleDownload}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Download size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Viewer Content Area */}
        <View style={styles.contentBody}>
          {/* Loading Indicator */}
          {loading && isImage && (
            <View style={styles.centerOverlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading {format}...</Text>
            </View>
          )}

          {/* Error State */}
          {error && (
            <View style={styles.centerOverlay}>
              <View style={styles.errorIconCircle}>
                <AlertTriangle size={32} color="#EF4444" />
              </View>
              <Text style={styles.errorTitle}>Failed to load file</Text>
              <Text style={styles.errorSubtitle}>
                The file viewer couldn't load this document. Try opening it in an external viewer or downloading it.
              </Text>
              <View style={styles.errorBtnRow}>
                <TouchableOpacity style={styles.errorPrimaryBtn} onPress={handleOpenInNewTab}>
                  <ExternalLink size={16} color="#FFFFFF" />
                  <Text style={styles.errorBtnText}>Open External</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.errorSecondaryBtn} onPress={handleDownload}>
                  <Download size={16} color="#FFFFFF" />
                  <Text style={styles.errorBtnText}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Image Viewer */}
          {isImage ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: fileUrl }}
                style={styles.imageViewer}
                resizeMode="contain"
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError(true);
                }}
              />
            </View>
          ) : (
            /* Document / PDF / External File Card Preview */
            <View style={styles.docPreviewContainer}>
              <View style={styles.docCard}>
                <View style={styles.docIconCircle}>
                  <FormatIcon size={44} color={Colors.primary} />
                </View>

                <Text style={styles.docTitle} numberOfLines={2}>
                  {fileName}
                </Text>
                <Text style={styles.docMeta}>Format: {format}</Text>

                <Text style={styles.docDescription}>
                  {isPDF
                    ? 'This PDF document can be viewed using your system viewer or browser.'
                    : isDocument
                    ? 'Word document (.docx) preview via Google Docs viewer or native document reader.'
                    : 'Tap below to open or download this resource.'}
                </Text>

                <View style={styles.docActionRow}>
                  <TouchableOpacity style={styles.docPrimaryBtn} onPress={handleOpenInNewTab}>
                    <ExternalLink size={18} color="#FFFFFF" />
                    <Text style={styles.docPrimaryBtnText}>Open Document</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.docSecondaryBtn} onPress={handleDownload}>
                    <Download size={18} color="#FFFFFF" />
                    <Text style={styles.docSecondaryBtnText}>Download</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    height: 56,
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  fileNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
  },
  formatBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  formatBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  contentBody: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    padding: 24,
  },
  loadingText: {
    color: '#F8FAFC',
    fontSize: 14,
    marginTop: 12,
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  errorBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  errorPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  errorSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  errorBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewer: {
    width: '100%',
    height: '100%',
  },
  docPreviewContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  docCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  docIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  docTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 4,
  },
  docMeta: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  docDescription: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  docActionRow: {
    width: '100%',
    gap: 10,
  },
  docPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  docPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  docSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  docSecondaryBtnText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
});
