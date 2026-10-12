import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Colors } from '../src/constants/theme';
import { Header } from '../src/components/common/Header';
import { Card } from '../src/components/common/Card';
import { HelpCircle, Mail, Phone, MapPin, Globe, ExternalLink } from 'lucide-react-native';

export default function HelpScreen() {
  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@kea.org.in?subject=KEA%20Mobile%20App%20Support');
  };

  const handlePhoneSupport = () => {
    Linking.openURL('tel:+912227780000');
  };

  const handleWebsite = () => {
    Linking.openURL('https://kea.org.in');
  };

  const faqs = [
    {
      question: 'How do I update my KEA membership details?',
      answer: 'Go to More > My Profile and tap on "Edit Profile" to update your contact and professional information.',
    },
    {
      question: 'How can I post or view job opportunities?',
      answer: 'Navigate to the Jobs tab from the bottom navigation bar to search active postings or save listings for later.',
    },
    {
      question: 'How do I register for upcoming KEA events?',
      answer: 'Tap the Events tab on the bottom navigation to view upcoming webinars, seminars, and annual meetings.',
    },
    {
      question: 'Where can I access technical papers and knowledge base?',
      answer: 'Go to More > Knowledge to download technical documents, presentations, and engineering resources.',
    },
  ];

  return (
    <View style={styles.container}>
      <Header title="Help & Support" showBack showNotif={false} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Support Banner Card */}
        <Card style={styles.bannerCard}>
          <View style={styles.bannerRow}>
            <View style={styles.bannerIconBox}>
              <HelpCircle size={28} color={Colors.teal} />
            </View>
            <View style={styles.bannerTextContent}>
              <Text style={styles.bannerTitle}>How can we help you?</Text>
              <Text style={styles.bannerSub}>
                Kokan Institute of Engineers support team is here to assist you with any app or membership queries.
              </Text>
            </View>
          </View>
        </Card>

        {/* Direct Contact Options */}
        <Text style={styles.sectionTitle}>CONTACT US</Text>

        <TouchableOpacity style={styles.contactCard} onPress={handleEmailSupport} activeOpacity={0.7}>
          <View style={styles.iconCircle}>
            <Mail size={20} color={Colors.primary} />
          </View>
          <View style={styles.contactTextContent}>
            <Text style={styles.contactLabel}>Email Support</Text>
            <Text style={styles.contactValue}>support@kea.org.in</Text>
          </View>
          <ExternalLink size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactCard} onPress={handlePhoneSupport} activeOpacity={0.7}>
          <View style={styles.iconCircle}>
            <Phone size={20} color={Colors.teal} />
          </View>
          <View style={styles.contactTextContent}>
            <Text style={styles.contactLabel}>Call Helpline</Text>
            <Text style={styles.contactValue}>+91 22 2778 0000</Text>
          </View>
          <ExternalLink size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactCard} onPress={handleWebsite} activeOpacity={0.7}>
          <View style={styles.iconCircle}>
            <Globe size={20} color={Colors.accent} />
          </View>
          <View style={styles.contactTextContent}>
            <Text style={styles.contactLabel}>Official KEA Website</Text>
            <Text style={styles.contactValue}>www.kea.org.in</Text>
          </View>
          <ExternalLink size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Office Location */}
        <Card style={styles.officeCard}>
          <View style={styles.bannerRow}>
            <MapPin size={22} color={Colors.primary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.officeTitle}>KEA Headquarters</Text>
              <Text style={styles.officeText}>
                Kokan Engineers Association, Central Secretariat, Mumbai / Navi Mumbai, Maharashtra, India.
              </Text>
            </View>
          </View>
        </Card>

        {/* Frequently Asked Questions */}
        <Text style={styles.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>

        {faqs.map((item, index) => (
          <Card key={index} style={styles.faqCard}>
            <Text style={styles.faqQuestion}>{item.question}</Text>
            <Text style={styles.faqAnswer}>{item.answer}</Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 16, paddingBottom: 32 },
  bannerCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.teal,
  },
  bannerRow: { flexDirection: 'row', alignItems: 'center' },
  bannerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6F7F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bannerTextContent: { flex: 1 },
  bannerTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  bannerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 4, lineHeight: 18 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 8,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactTextContent: { flex: 1 },
  contactLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  contactValue: { fontSize: 13, color: Colors.primary, marginTop: 2, fontWeight: '600' },
  officeCard: {
    padding: 14,
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 16,
  },
  officeTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  officeText: { fontSize: 13, color: Colors.textMuted, marginTop: 4, lineHeight: 18 },
  faqCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  faqQuestion: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  faqAnswer: { fontSize: 13, color: Colors.textMuted, lineHeight: 19 },
});
