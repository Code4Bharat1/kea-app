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
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { Sidebar } from '../components/common/Sidebar';

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

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [openedFromSidebarRoutes, setOpenedFromSidebarRoutes] = useState<string[]>([]);

  // Ultra-smooth native driver slide & fade (180ms cubic out)
  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 190,
        easing: Easing.out(Easing.cubic),
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

  // Ultra-responsive close animation (160ms cubic in)
  const closeSidebar = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.cubic),
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
    const isDashboard =
      route === '/' || route === '/(tabs)' || route === '/(tabs)/index' || route === '/dashboard';
    if (isDashboard) {
      setOpenedFromSidebarRoutes([]);
      return;
    }
    const norm = normalizeRoute(route);
    if (!norm) return;
    setOpenedFromSidebarRoutes((prev) => {
      if (prev.includes(norm)) return prev;
      return [...prev, norm];
    });
  }, []);

  const clearAllOpenedFromSidebar = useCallback(() => {
    setOpenedFromSidebarRoutes([]);
  }, []);

  const removeRouteFromSidebar = useCallback((normRoute: string) => {
    setOpenedFromSidebarRoutes((prev) => prev.filter((r) => r !== normRoute));
  }, []);

  const goBack = useCallback(() => {
    const currentNorm = normalizeRoute(pathname);
    if (openedFromSidebarRoutes.includes(currentNorm)) {
      removeRouteFromSidebar(currentNorm);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
      openSidebar();
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [pathname, openedFromSidebarRoutes, openSidebar, removeRouteFromSidebar]);

  // Android hardware back button handler for open drawer
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

        {/* Ultra-Smooth Global Slide-Over Sidebar Drawer (Instant Native Overlay) */}
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

          {/* Smooth Sliding Drawer Content */}
          <Animated.View
            style={[
              styles.drawerContentContainer,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            <Sidebar onClose={closeSidebar} onNavigate={markOpenedFromSidebar} />
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
