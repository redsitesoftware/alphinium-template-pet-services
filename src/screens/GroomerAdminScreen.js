import React, { useEffect } from 'react';
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
import { getGroomerBookings, updateBookingStatus } from '../services/adminApi';

const STATUS_ACTIONS = [
  { label: 'Confirm', value: 'confirmed' },
  { label: 'Complete', value: 'completed' },
  { label: 'No-show', value: 'no-show' },
];

const STATUS_BADGE = {
  confirmed: { bg: '#ECFDF5', text: '#065F46' },
  pending:   { bg: '#FEF3C7', text: '#92400E' },
  completed: { bg: '#D1FAE5', text: '#064E3B' },
  'no-show': { bg: '#FEE2E2', text: '#991B1B' },
};

function formatAdminDate(isoDate) {
  try {
    const d = new Date(isoDate + 'T00:00:00');
    return d.toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

function formatSlotTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return isoString;
  }
}

function stepDate(isoDate, delta) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function StatusBadge({ status }) {
  const style = STATUS_BADGE[status] ?? { bg: '#E8FBF5', text: '#0F766E' };
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace('-', '‑');
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.badgeText, { color: style.text }]}>{label}</Text>
    </View>
  );
}

function AppointmentCard({ appointment, onStatusChange }) {
  return (
    <View style={styles.apptCard}>
      <View style={styles.apptTopRow}>
        <View style={styles.apptInfo}>
          <Text style={styles.apptTime}>{formatSlotTime(appointment.slot_time)}</Text>
          <Text style={styles.apptCustomer}>{appointment.customer_name}</Text>
          <Text style={styles.apptPet}>
            {appointment.pet_name} · {appointment.service}
          </Text>
          {appointment.notes ? (
            <Text style={styles.apptNotes}>{appointment.notes}</Text>
          ) : null}
        </View>
        <View style={styles.apptRight}>
          <StatusBadge status={appointment.status} />
          {appointment.amount > 0 && (
            <Text style={styles.apptAmount}>${appointment.amount}</Text>
          )}
        </View>
      </View>

      <View style={styles.apptActions}>
        {STATUS_ACTIONS.map(({ label, value }) => (
          <Pressable
            key={value}
            style={[
              styles.actionBtn,
              appointment.status === value && styles.actionBtnActive,
            ]}
            onPress={() => appointment.status !== value && onStatusChange(appointment.id, value)}
            disabled={appointment.status === value}
          >
            <Text
              style={[
                styles.actionBtnText,
                appointment.status === value && styles.actionBtnTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function GroomerAdminScreen() {
  const { state, dispatch } = usePet();
  const { adminDate, adminAppointments, adminLoading } = state;

  async function loadAppointments(date) {
    dispatch({ type: 'ADMIN_LOADING' });
    try {
      const appts = await getGroomerBookings(date, state.authToken);
      dispatch({ type: 'SET_ADMIN_APPOINTMENTS', appointments: appts });
    } catch (err) {
      dispatch({ type: 'SET_ADMIN_APPOINTMENTS', appointments: [] });
      Alert.alert('Could not load appointments', err.message ?? 'Please try again.');
    }
  }

  useEffect(() => {
    loadAppointments(adminDate);
  }, [adminDate]);

  async function handleStatusChange(bookingId, newStatus) {
    // Optimistic update
    dispatch({ type: 'UPDATE_APPOINTMENT_STATUS', id: bookingId, status: newStatus });
    try {
      await updateBookingStatus(bookingId, newStatus, state.authToken);
    } catch (err) {
      Alert.alert('Update failed', err.message ?? 'Please try again.');
      // We don't revert since demo mode always succeeds; in production you'd reload
    }
  }

  function handlePrevDay() {
    dispatch({ type: 'SET_ADMIN_DATE', date: stepDate(adminDate, -1) });
  }

  function handleNextDay() {
    dispatch({ type: 'SET_ADMIN_DATE', date: stepDate(adminDate, 1) });
  }

  // Summary stats
  const revenue = adminAppointments
    .filter((a) => a.status === 'completed' || a.status === 'confirmed')
    .reduce((sum, a) => sum + (a.amount || 0), 0);
  const apptCount = adminAppointments.length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => dispatch({ type: 'SET_PHASE', phase: 'home' })}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Groomer Portal</Text>
      </View>

      {/* Date picker */}
      <View style={styles.datePicker}>
        <Pressable style={styles.dateNavBtn} onPress={handlePrevDay}>
          <Text style={styles.dateNavText}>‹</Text>
        </Pressable>
        <Text style={styles.dateLabel}>{formatAdminDate(adminDate)}</Text>
        <Pressable style={styles.dateNavBtn} onPress={handleNextDay}>
          <Text style={styles.dateNavText}>›</Text>
        </Pressable>
      </View>

      {/* Summary stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${revenue}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{apptCount}</Text>
          <Text style={styles.statLabel}>Appointments</Text>
        </View>
      </View>

      {/* Appointments list */}
      <Text style={styles.sectionTitle}>Today's Schedule</Text>

      {adminLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingText}>Loading appointments…</Text>
        </View>
      ) : adminAppointments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No appointments for this date.</Text>
        </View>
      ) : (
        adminAppointments.map((appt) => (
          <AppointmentCard
            key={appt.id}
            appointment={appt}
            onStatusChange={handleStatusChange}
          />
        ))
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
    paddingBottom: 12,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#B7E4DA',
    marginBottom: 14,
  },
  backButtonText: {
    color: '#0F766E',
    fontSize: 14,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#B7E4DA',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  dateNavBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  dateNavText: {
    fontSize: 24,
    color: '#0F766E',
    fontWeight: '700',
  },
  dateLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#164E48',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0F766E',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#A7F3D0',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#164E48',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  loadingText: {
    color: '#285E55',
    fontSize: 15,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: 15,
    fontStyle: 'italic',
  },
  apptCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#B7E4DA',
  },
  apptTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  apptInfo: {
    flex: 1,
    paddingRight: 12,
  },
  apptTime: {
    fontSize: 13,
    color: '#0F766E',
    fontWeight: '700',
    marginBottom: 2,
  },
  apptCustomer: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  apptPet: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  apptNotes: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  apptRight: {
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
  apptAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F766E',
  },
  apptActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F8FFFD',
    borderWidth: 1,
    borderColor: '#D3F0E8',
  },
  actionBtnActive: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  actionBtnTextActive: {
    color: '#FFFFFF',
  },
});
