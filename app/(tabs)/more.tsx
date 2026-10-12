import React from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  Image, 
  TouchableOpacity, 
  Platform, 
  StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Sidebar } from '../../src/components/common/Sidebar';
import { Colors } from '../../src/constants/theme';
import { Bell, ShieldCheck, Award } from 'lucide-react-native';

export default function MoreScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Prominent Header Banner with Large KEA Logo & Association Title */}
        <View style={styles.prominentHeaderBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.topTitleBox}>
              <Award size={16} color="#FBBF24" style={{ marginRight: 6 }} />
              <Text style={styles.topTitleText}>KEA GLOBAL PLATFORM</Text>
            </View>
            <TouchableOpacity 
              style={styles.notifBtn} 
              onPress={() => router.push('/notifications')}
              activeOpacity={0.8}
            >
              <Bell size={22} color="#FFFFFF" />
              <View style={styles.redDot} />
            </TouchableOpacity>
          </View>

          {/* Extra Large Logo Image */}
          <Image
            source={require('../../assets/kea-logo.png')}
            style={styles.extraLargeLogoImage}
            resizeMode="contain"
          />

          {/* Prominent Kokani Engineers & Professionals Association Title Badge */}
          <View style={styles.associationTitleCard}>
            <ShieldCheck size={18} color="#FBBF24" style={{ marginRight: 6 }} />
            <Text style={styles.associationTitleText}>
              Kokani Engineers & Professionals Association
            </Text>
          </View>
        </View>

        {/* Sidebar Navigation Menu */}
        <Sidebar hideHeader={true} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 35,
  },
  prominentHeaderBanner: {
    backgroundColor: '#0D2847',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 8 : 16,
    paddingBottom: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#F59E0B',
    shadowColor: '#0D2847',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  topTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topTitleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  notifBtn: {
    padding: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    position: 'relative',
  },
  redDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  extraLargeLogoImage: {
    width: 320,
    height: 95,
    marginVertical: 4,
  },
  associationTitleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  associationTitleText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FBBF24',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
