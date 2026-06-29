import React, { useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { usePet } from '../store/petStore';

export default function ConfirmationScreen() {
  const { state, dispatch } = usePet();
  const pulse = useRef(new Animated.Value(1)).current;
  const booking = state.confirmedBooking;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  if (!booking) {
    return null;
  }

  const shareBooking = () => Alert.alert('Booking shared', 'Your Pawfect booking summary is ready to share.');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <Text style={styles.confettiRow}>* Booking Confirmed *</Text>
      <Animated.Text style={[styles.successEmoji, { transform: [{ scale: pulse }] }]}>OK</Animated.Text>
      <Text style={styles.title}>Booking confirmed!</Text>
      <Text style={styles.subtitle}>Your groomer is locked in and your pet is one step closer to a fresh new look.</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Booking summary</Text>
        <Text style={styles.summaryLine}>Groomer: {booking.groomer?.name}</Text>
        <Text style={styles.summaryLine}>Service: {booking.service?.name}</Text>
        <Text style={styles.summaryLine}>Time: {booking.bookingData?.time}</Text>
        <Text style={styles.summaryLine}>Pet name: {booking.bookingData?.petName || 'Your pet'}</Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={() => dispatch({ type: 'SET_PHASE', phase: 'mybookings' })}>
        <Text style={styles.primaryButtonText}>View My Bookings</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => dispatch({ type: 'RESET_BOOKING' })}>
        <Text style={styles.secondaryButtonText}>Book Again</Text>
      </Pressable>

      <Text style={styles.confettiFooter}>See you at grooming time!</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3FBF8',
  },
  screenContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 36,
    alignItems: 'center',
  },
  confettiRow: {
    fontSize: 28,
    marginBottom: 12,
  },
  successEmoji: {
    fontSize: 88,
    marginBottom: 14,
  },
  title: {
    color: '#0F766E',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#285E55',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 320,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#B7E4DA',
    marginBottom: 18,
  },
  summaryTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  summaryLine: {
    color: '#374151',
    fontSize: 15,
    marginBottom: 8,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#14B8A6',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B7E4DA',
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: '#0F766E',
    fontSize: 16,
    fontWeight: '800',
  },
  confettiFooter: {
    color: '#0F766E',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
