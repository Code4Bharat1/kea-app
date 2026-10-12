import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { KeaLogo } from './KeaLogo';
import { securityService } from '../../utils/security';
import { Lock, RefreshCw, X, ShieldAlert, CheckCircle2 } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SIZE = Math.min(SCREEN_WIDTH * 0.75, 280);
const DOT_SIZE = 22;

interface PatternLockModalProps {
  visible: boolean;
  mode: 'verify' | 'setup' | 'change';
  onSuccess: () => void;
  onCancel?: () => void;
  onForgotPattern?: () => void;
}

export const PatternLockModal: React.FC<PatternLockModalProps> = ({
  visible,
  mode,
  onSuccess,
  onCancel,
  onForgotPattern,
}) => {
  const [selectedDots, setSelectedDots] = useState<number[]>([]);
  const [firstPattern, setFirstPattern] = useState<number[] | null>(null);
  const [step, setStep] = useState<'enter' | 'confirm'>(mode === 'setup' ? 'enter' : 'enter');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [attempts, setAttempts] = useState<number>(0);

  const dots = Array.from({ length: 9 }, (_, i) => i);

  useEffect(() => {
    if (visible) {
      resetState();
    }
  }, [visible, mode]);

  const resetState = () => {
    setSelectedDots([]);
    setFirstPattern(null);
    setStep('enter');
    setErrorMsg('');
    setSuccessMsg('');
    setAttempts(0);
  };

  const handleDotPress = (dotIndex: number) => {
    if (selectedDots.includes(dotIndex)) return;
    setErrorMsg('');
    const newSelected = [...selectedDots, dotIndex];
    setSelectedDots(newSelected);
  };

  const handleClearPattern = () => {
    setSelectedDots([]);
    setErrorMsg('');
  };

  const handleCompletePattern = async () => {
    if (selectedDots.length < 4) {
      setErrorMsg('Connect at least 4 dots.');
      return;
    }

    if (mode === 'verify') {
      const isValid = await securityService.verifyPattern(selectedDots);
      if (isValid) {
        setSuccessMsg('Pattern Verified!');
        setTimeout(() => {
          onSuccess();
        }, 300);
      } else {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        setErrorMsg(`Incorrect pattern. (${nextAttempts} failed attempt${nextAttempts > 1 ? 's' : ''})`);
        setSelectedDots([]);
        if (nextAttempts >= 5) {
          Alert.alert('Security Lockout', 'Too many failed pattern attempts. Please use your credentials or biometrics.');
        }
      }
      return;
    }

    if (mode === 'setup' || mode === 'change') {
      if (step === 'enter') {
        setFirstPattern(selectedDots);
        setStep('confirm');
        setSelectedDots([]);
        setErrorMsg('');
        setSuccessMsg('Pattern recorded. Connect dots again to confirm.');
      } else if (step === 'confirm' && firstPattern) {
        if (selectedDots.join('-') === firstPattern.join('-')) {
          await securityService.savePattern(selectedDots);
          setSuccessMsg('Security pattern saved successfully!');
          setTimeout(() => {
            onSuccess();
          }, 400);
        } else {
          setErrorMsg('Patterns do not match. Try setup again.');
          setSelectedDots([]);
          setFirstPattern(null);
          setStep('enter');
        }
      }
    }
  };

  const getInstructionText = () => {
    if (errorMsg) return errorMsg;
    if (successMsg) return successMsg;

    if (mode === 'verify') return 'Draw your pattern to unlock KEA App';
    if (mode === 'setup') {
      return step === 'enter'
        ? 'Draw a pattern (at least 4 dots)'
        : 'Confirm your pattern by drawing it again';
    }
    if (mode === 'change') {
      return step === 'enter'
        ? 'Draw new pattern (at least 4 dots)'
        : 'Confirm new pattern';
    }
    return 'Draw pattern to continue';
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.containerCard}>
          {/* Top Close Button */}
          {onCancel && (
            <TouchableOpacity style={styles.closeBtn} onPress={onCancel}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          )}

          {/* Header Brand */}
          <KeaLogo size="small" style={{ marginBottom: 12 }} />

          <View style={styles.headerTitleRow}>
            <Lock size={18} color="#0D9488" style={{ marginRight: 6 }} />
            <Text style={styles.titleText}>
              {mode === 'verify' ? 'App Security Lock' : 'Configure Security Pattern'}
            </Text>
          </View>

          <Text
            style={[
              styles.subtitleText,
              errorMsg ? styles.errorText : null,
              successMsg ? styles.successText : null,
            ]}
          >
            {getInstructionText()}
          </Text>

          {/* 3x3 Pattern Dot Grid */}
          <View style={styles.gridContainer}>
            {dots.map((index) => {
              const isSelected = selectedDots.includes(index);
              const orderIndex = selectedDots.indexOf(index);

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.dotTouchable}
                  onPress={() => handleDotPress(index)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.dotOuter,
                      isSelected && styles.dotOuterSelected,
                      errorMsg ? styles.dotOuterError : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.dotInner,
                        isSelected && styles.dotInnerSelected,
                      ]}
                    >
                      {isSelected && (
                        <Text style={styles.orderNumberText}>{orderIndex + 1}</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Actions Control Row */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.clearBtn} onPress={handleClearPattern}>
              <RefreshCw size={15} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                selectedDots.length < 4 && styles.submitBtnDisabled,
              ]}
              onPress={handleCompletePattern}
              disabled={selectedDots.length < 4}
            >
              <Text style={styles.submitBtnText}>
                {step === 'confirm' ? 'Confirm Pattern' : 'Submit Pattern'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Forgot Pattern Option */}
          {mode === 'verify' && onForgotPattern && (
            <TouchableOpacity style={styles.forgotBtn} onPress={onForgotPattern}>
              <Text style={styles.forgotBtnText}>Forgot Security Pattern?</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  containerCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    minHeight: 34,
  },
  errorText: {
    color: '#EF4444',
    fontWeight: '700',
  },
  successText: {
    color: '#10B981',
    fontWeight: '700',
  },
  gridContainer: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    padding: 10,
  },
  dotTouchable: {
    width: (GRID_SIZE - 20) / 3,
    height: (GRID_SIZE - 20) / 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotOuter: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotOuterSelected: {
    borderColor: '#0D9488',
    backgroundColor: 'rgba(13, 148, 136, 0.08)',
  },
  dotOuterError: {
    borderColor: '#FCA5A5',
  },
  dotInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInnerSelected: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0D9488',
  },
  orderNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    gap: 12,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  forgotBtn: {
    marginTop: 16,
    paddingVertical: 6,
  },
  forgotBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
});
