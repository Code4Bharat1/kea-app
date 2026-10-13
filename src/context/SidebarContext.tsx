import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  BackHandler,
  Platform,
  Easing,
  PanResponder,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { Sidebar } from '../components/common/Sidebar';
import AdminSidebar from '../components/admin/AdminSidebar';
import { useAuth } from './AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.84, 330);

export const normalizeRoute = (path?: string | null): string => {
  if (!path) return '';
  let cleaned = path.toLowerCase().trim();
  cleaned = cleaned.split('?')[0].split('#')[0];
  cleaned = cleaned.replace(/^\/+/, '').replace(/\/+$/, '');
  if (cleaned.endsWith('/index')) {
    cleaned = cleaned.slice(0, -6);
  } else if (cleaned === 'index') {
    cleaned = '';
  }
  return cleaned;
};

interface SidebarContextType {
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  markOpenedFromSidebar: (route: string) => void;
  clearAllOpenedFromSidebar: () => void;
  goBack: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  let pathname = '/';
  try {
    pathname = usePathname() || '/';
  } catch (e) {
    pathname = '/';
  }

  const { user } = useAuth();
  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'superadmin'));

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Ultra-fluid physics-based spring animation to open
  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 26,
        mass: 0.85,
        stiffness: 280,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 190,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, backdropOpacity]);

  // Snappy, fast slide animation to close
  const closeSidebar = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 170,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 170,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsSidebarOpen(false);
    });
  }, [slideAnim, backdropOpacity]);

  const toggleSidebar = useCallback(() => {
    if (isSidebarOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }, [isSidebarOpen, openSidebar, closeSidebar]);

  const markOpenedFromSidebar = useCallback((route: string) => {
    // Kept for backward compatibility
  }, []);

  const clearAllOpenedFromSidebar = useCallback(() => {
    // Kept for backward compatibility
  }, []);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, []);

  // Gesture PanResponder: Drag/Swipe to close when drawer is open
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          const newX = Math.max(-DRAWER_WIDTH, gestureState.dx);
          slideAnim.setValue(newX);
          const progress = 1 - Math.abs(newX) / DRAWER_WIDTH;
          backdropOpacity.setValue(Math.max(0, Math.min(1, progress)));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -DRAWER_WIDTH * 0.22 || gestureState.vx < -0.35) {
          closeSidebar();
        } else {
          openSidebar();
        }
      },
      onPanResponderTerminate: () => {
        openSidebar();
      },
    })
  ).current;

  // Edge Swipe PanResponder: Drag from left edge to open when closed
  const edgePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dx > 12 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          const newX = Math.min(0, -DRAWER_WIDTH + gestureState.dx);
          slideAnim.setValue(newX);
          const progress = (DRAWER_WIDTH + newX) / DRAWER_WIDTH;
          backdropOpacity.setValue(Math.max(0, Math.min(1, progress)));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > DRAWER_WIDTH * 0.22 || gestureState.vx > 0.35) {
          openSidebar();
        } else {
          closeSidebar();
        }
      },
      onPanResponderTerminate: () => {
        closeSidebar();
      },
    })
  ).current;

  // Android hardware back button handler
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onHardwareBackPress = () => {
      if (isSidebarOpen) {
        closeSidebar();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
    return () => sub.remove();
  }, [isSidebarOpen, closeSidebar]);

  const value: SidebarContextType = {
    isSidebarOpen,
    openSidebar,
    closeSidebar,
    toggleSidebar,
    markOpenedFromSidebar,
    clearAllOpenedFromSidebar,
    goBack,
  };

  return (
    <SidebarContext.Provider value={value}>
      <View style={styles.rootContainer}>
        {children}

        {/* Free Edge Swipe Area (allows swiping from left edge of screen to slide open the sidebar) */}
        {!isSidebarOpen ? (
          <View
            style={styles.edgeSwipeZone}
            {...edgePanResponder.panHandlers}
          />
        ) : null}

        {/* Global Slide-Over Sidebar Drawer */}
        <View
          pointerEvents={isSidebarOpen ? 'auto' : 'none'}
          style={[StyleSheet.absoluteFill, { zIndex: 99999 }]}
        >
          {/* Fading Dark Backdrop */}
          <Animated.View
            style={[
              styles.drawerBackdrop,
              { opacity: backdropOpacity },
            ]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={closeSidebar}
            />
          </Animated.View>

          {/* Smooth Sliding Drawer Content with drag-to-close gesture */}
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.drawerContentContainer,
              isAdmin && { backgroundColor: '#0D2847' },
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            {isAdmin ? (
              <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
            ) : (
              <Sidebar onClose={closeSidebar} />
            )}
          </Animated.View>
        </View>
      </View>
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    return {
      isSidebarOpen: false,
      openSidebar: () => {},
      closeSidebar: () => {},
      toggleSidebar: () => {},
      markOpenedFromSidebar: () => {},
      clearAllOpenedFromSidebar: () => {},
      goBack: () => {
        if (router.canGoBack()) router.back();
      },
    };
  }
  return context;
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  edgeSwipeZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 24,
    zIndex: 999,
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  drawerContentContainer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#0B1437',
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
  },
});
