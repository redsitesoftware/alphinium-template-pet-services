import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { usePet } from '../store/petStore';
import { getMyBookings, rescheduleBooking, cancelBooking } from '../services/myBookingsApi';

const RESCHEDULE_SLOTS = ['9:00 AM', '10:30 AM', '2:00 PM', '3:30 PM'];

function formatSlotTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function StatusBadge({ status }) {
  const map = {
    confirmed: { bg: '#ECFDF5', text: '#065F46', label: 'Confirmed' },
    completed: { bg: '#F3F4F6', text: '#374151', label: 'Completed' },
    cancelled: { bg: '#FEF2F2', text: '#991B1B', label: 'Cancelled' },
    'no-show': { bg: '#FEF3C7', text: '#92400E', label: 'No show' },
  };
  const style = map[status] ?? { bg: '#E8FBF5', text: '#0F766E', label: status };
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.badgeText, { color: style.text }]}>{style.label}</Text>
    </View>
  );
}

function BookingCard({ booking, onReschedule, onCancel, actionInFlight }) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [pickedSlot, setPickedSlot] = useState(RESCHEDULE_SLOTS[0]);

  function handleRescheduleConfirm() {
    setRescheduleOpen(false);
    onReschedule(booking, pickedSlot);
  }

  return (
    <View style={styles.bookingCard}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardGroomer}>{booking.groomer_name}</Text>
          <Text style={styles.cardService}>{booking.service}</Text>
          <Text style={styles.cardTime}>{formatSlotTime(booking.slot_time)}</Text>
        </View>
        <View style={styles.cardRight}>
          <StatusBadge status={booking.status} />
          {booking.amount > 0 && (
            <Text style={styles.cardAmount}>${booking.amount}</Text>
          )}
        </View>
      </View>

      {(booking.can_reschedule || booking.can_cancel) && (
        <View style={styles.cardActions}>
          {booking.can_reschedule && (
            <Pressable
              style={[styles.actionButton, styles.rescheduleButton, actionInFlight && styles.buttonDisabled]}
              onPress={() => setRescheduleOpen((v) => !v)}
              disabled={actionInFlight}
            >
              {actionInFlight ? (
                <ActivityIndicator size="small" color="#0F766E" />
              ) : (
                <Text style={styles.rescheduleButtonText}>
                  {rescheduleOpen ? 'Cancel reschedule' : 'Reschedule'}
                </Text>
              )}
            </Pressable>
          )}

          {booking.can_cancel && (
            <Pressable
              style={[styles.actionButton, styles.cancelButton, actionInFlight && styles.buttonDisabled]}
              onPress={() => onCancel(booking)}
              disabled={actionInFlight}
            >
              {actionInFlight ? (
                <ActivityIndicator size="small" color="#991B1B" />
              ) : (
                <Text style={styles.cancelButtonText}>Cancel</Text>
              )}
            </Pressable>
          )}
        </View>
      )}

      {rescheduleOpen && (
        <View style={styles.slotPicker}>
          <Text style={styles.slotPickerLabel}>Choose a new time:</Text>
          <View style={styles.slotPillRow}>
            {RESCHEDULE_SLOTS.map((slot) => (
              <Pressable
                key={slot}
                style={[styles.slotPill, pickedSlot === slot && styles.slotPillActive]}
                onPress={() => setPickedSlot(slot)}
              >
                <Text style={[styles.slotPillText, pickedSlot === slot && styles.slotPillTextActive]}>
                  {slot}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.confirmSlotButton} onPress={handleRescheduleConfirm}>
            <Text style={styles.confirmSlotText}>Confirm new time</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function MyBookingsScreen() {
  const { state, dispatch } = usePet();
  const { upcoming, past } = state.myBookings;
  const [inflightIds, setInflightIds] = useState(new Set());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      dispatch({ type: 'MY_BOOKINGS_LOADING' });
      try {
        const result = await getMyBookings(state.authToken);
        if (!cancelled) {
          dispatch({ type: 'SET_MY_BOOKINGS', myBookings: result });
        }
      } catch (err) {
        if (!cancelled) {
          dispatch({ type: 'SET_MY_BOOKINGS', myBookings: { upcoming: [], past: [] } });
          Alert.alert('Could not load bookings', err.message ?? 'Please try again.');
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  async function handleReschedule(booking, newSlot) {
    setInflightIds((s) => new Set(s).add(booking.id));
    try {
      const updated = await rescheduleBooking(booking.id, newSlot, state.authToken);
      dispatch({ type: 'UPDATE_MY_BOOKING', booking: { ...booking, ...updated, slot_time: newSlot } });
      Alert.alert('Booking rescheduled', `New time: ${newSlot}`);
    } catch (err) {
      Alert.alert('Reschedule failed', err.message ?? 'Please try again.');
    } finally {
      setInflightIds((s) => { const next = new Set(s); next.delete(booking.id); return next; });
    }
  }

  async function handleCancel(booking) {
    Alert.alert(
      'Cancel booking?',
      `Cancel your ${booking.service} appointment with ${booking.groomer_name}? This cannot be undone.`,
      [
        { text: 'Keep booking', style: 'cancel' },
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: async () => {
            setInflightIds((s) => new Set(s).add(booking.id));
            try {
              await cancelBooking(booking.id, state.authToken);
              dispatch({ type: 'REMOVE_MY_BOOKING', bookingId: booking.id });
              Alert.alert('Booking cancelled', 'Your booking has been cancelled.');
            } catch (err) {
              Alert.alert('Cancellation failed', err.message ?? 'Please try again.');
            } finally {
              setInflightIds((s) => { const next = new Set(s); next.delete(booking.id); return next; });
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => dispatch({ type: 'SET_PHASE', phase: 'home' })}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>My Bookings</Text>
      </View>

      {state.myBookingsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingText}>Loading your bookings…</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Upcoming</Text>
          {upcoming.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No upcoming bookings.</Text>
              <Text style={styles.emptyStateHint}>Book a groomer to get started!</Text>
            </View>
          ) : (
            upcoming.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onReschedule={handleReschedule}
                onCancel={handleCancel}
                actionInFlight={inflightIds.has(booking.id)}
              />
            ))
          )}

          <Text style={[styles.sectionTitle, styles.pastSectionTitle]}>Past Bookings</Text>
          {past.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No past bookings yet.</Text>
            </View>
          ) : (
            past.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onReschedule={handleReschedule}
                onCancel={handleCancel}
                actionInFlight={inflightIds.has(booking.id)}
              />
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3FBF8',
  },
  screenContent: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#F3FBF8',
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#B7E4DA',
    marginBottom: 16,
  },
  backButtonText: {
    color: '#0F766E',
    fontSize: 14,
    fontWeight: '800',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  loadingText: {
    color: '#285E55',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#164E48',
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  pastSectionTitle: {
    marginTop: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: 15,
    fontStyle: 'italic',
  },
  emptyStateHint: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 4,
  },
  bookingCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#B7E4DA',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
    paddingRight: 12,
  },
  cardGroomer: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 3,
  },
  cardService: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 3,
  },
  cardTime: {
    fontSize: 13,
    color: '#5B6B67',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F766E',
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
  },
  rescheduleButton: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#14B8A6',
  },
  rescheduleButtonText: {
    color: '#0F766E',
    fontWeight: '700',
    fontSize: 13,
  },
  cancelButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  cancelButtonText: {
    color: '#991B1B',
    fontWeight: '700',
    fontSize: 13,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  slotPicker: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8FFFD',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D3F0E8',
  },
  slotPickerLabel: {
    color: '#164E48',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 10,
  },
  slotPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  slotPill: {
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#B7E4DA',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  slotPillActive: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  slotPillText: {
    color: '#0F766E',
    fontWeight: '700',
    fontSize: 13,
  },
  slotPillTextActive: {
    color: '#FFFFFF',
  },
  confirmSlotButton: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmSlotText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
