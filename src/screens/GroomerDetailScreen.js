import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getGroomerById, getGroomerImageUri, usePet } from '../store/petStore';
import { getAvailability } from '../services/availabilityApi';

function locationLabel(groomer) {
  if (groomer.distance === 0 || groomer.suburb.includes('Comes to you')) {
    return 'Comes to you';
  }
  return `${groomer.suburb} · ${groomer.distance.toFixed(1)}km away`;
}

function ratingStars(rating) {
  return `${rating.toFixed(1)} stars`;
}

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

// Build a simple list of the next N date options as { label, value } pairs.
function buildDateOptions(count = 7) {
  const options = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = d.toISOString().split('T')[0];
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
    options.push({ label, value });
  }
  return options;
}

const DATE_OPTIONS = buildDateOptions(7);

export default function GroomerDetailScreen() {
  const { state, dispatch } = usePet();
  const groomer = getGroomerById(state.selectedGroomer, state.groomers);

  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [slots, setSlots] = useState(groomer?.timeSlots ?? []);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (!groomer) return;
    let cancelled = false;

    async function loadSlots() {
      setSlotsLoading(true);
      try {
        const apiSlots = await getAvailability(groomer.id, selectedDate);
        if (!cancelled) {
          if (apiSlots && apiSlots.length > 0) {
            setSlots(apiSlots);
          } else {
            // API not configured or returned empty — fall back to static slots
            setSlots(groomer.timeSlots ?? []);
          }
        }
      } catch {
        // API unavailable — static fallback
        if (!cancelled) setSlots(groomer.timeSlots ?? []);
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    }

    loadSlots();
    return () => {
      cancelled = true;
    };
  }, [groomer?.id, selectedDate]);

  if (!groomer) {
    return null;
  }

  const selectedServiceName = state.selectedService?.groomerId === groomer.id ? state.selectedService.name : null;
  const selectedTime = state.bookingData.time;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <ImageBackground source={{ uri: getGroomerImageUri(groomer.image, 1000) }} style={styles.headerImage}>
        <View style={styles.headerOverlay} />
        <Pressable style={styles.backButton} onPress={() => dispatch({ type: 'SET_PHASE', phase: 'home' })}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
      </ImageBackground>

      <View style={styles.profileCard}>
        <View style={styles.profileTopRow}>
          <View style={styles.nameWrap}>
            <Text style={styles.name}>{groomer.name}</Text>
            <Text style={styles.rating}>{ratingStars(groomer.rating)} · {groomer.reviewCount} reviews</Text>
            <Text style={styles.location}>{locationLabel(groomer)}</Text>
          </View>
          <View style={styles.emojiBadge}>
            <Text style={styles.emoji}>{groomer.initial || groomer.name[0]}</Text>
          </View>
        </View>

        <View style={styles.petTypeRow}>
          {groomer.petTypes.map((type) => (
            <View key={type} style={styles.petTypePill}>
              <Text style={styles.petTypeText}>{type}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.about}>{groomer.about}</Text>

        <Text style={styles.sectionTitle}>Services</Text>
        {groomer.services.map((service) => {
          const selected = selectedServiceName === service.name;
          return (
            <Pressable
              key={service.name}
              style={[styles.serviceCard, selected && styles.serviceCardSelected]}
              onPress={() => dispatch({ type: 'SELECT_SERVICE', service: { ...service, groomerId: groomer.id } })}
            >
              <View>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceMeta}>{service.duration}</Text>
              </View>
              <Text style={styles.servicePrice}>${service.price}</Text>
            </Pressable>
          );
        })}

        <Text style={styles.sectionTitle}>Available time slots</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datePillRow}>
          {DATE_OPTIONS.map((opt) => {
            const active = selectedDate === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.datePill, active && styles.datePillActive]}
                onPress={() => setSelectedDate(opt.value)}
              >
                <Text style={[styles.datePillText, active && styles.datePillTextActive]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {slotsLoading ? (
          <View style={styles.slotsLoadingRow}>
            <ActivityIndicator size="small" color="#0F766E" />
            <Text style={styles.slotsLoadingText}>Checking availability…</Text>
          </View>
        ) : (
          <View style={styles.slotGrid}>
            {slots.length > 0 ? (
              slots.map((slot) => {
                const active = selectedTime === slot;
                return (
                  <Pressable
                    key={slot}
                    style={[styles.slotPill, active && styles.slotPillActive]}
                    onPress={() => dispatch({ type: 'SELECT_TIME_SLOT', time: slot })}
                  >
                    <Text style={[styles.slotText, active && styles.slotTextActive]}>{slot}</Text>
                  </Pressable>
                );
              })
            ) : (
              <Text style={styles.noSlotsText}>No availability on this date.</Text>
            )}
          </View>
        )}

        <View style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>What pet parents say</Text>
          <Text style={styles.reviewCopy}>“{groomer.reviews[0]?.text}”</Text>
          <Text style={styles.reviewAuthor}>— {groomer.reviews[0]?.name}</Text>
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={() => dispatch({ type: 'START_BOOKING', time: state.bookingData.time })}
        >
          <Text style={styles.primaryButtonText}>Book Now</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3FBF8',
  },
  screenContent: {
    paddingBottom: 32,
  },
  headerImage: {
    height: 300,
    justifyContent: 'flex-start',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 118, 110, 0.28)',
  },
  backButton: {
    marginTop: 56,
    marginLeft: 20,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  backButtonText: {
    color: '#0F766E',
    fontSize: 14,
    fontWeight: '800',
  },
  profileCard: {
    marginTop: -28,
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#B7E4DA',
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  nameWrap: {
    flex: 1,
    paddingRight: 12,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  rating: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  location: {
    color: '#5B6B67',
    fontSize: 14,
  },
  emojiBadge: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  petTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  petTypePill: {
    borderRadius: 999,
    backgroundColor: '#E8FBF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  petTypeText: {
    color: '#0F766E',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#164E48',
    marginBottom: 12,
  },
  about: {
    color: '#4B5563',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 20,
  },
  serviceCard: {
    backgroundColor: '#F8FFFD',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D3F0E8',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceCardSelected: {
    borderColor: '#14B8A6',
    backgroundColor: '#ECFDF5',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  serviceMeta: {
    color: '#5B6B67',
    fontSize: 14,
  },
  servicePrice: {
    color: '#0F766E',
    fontSize: 18,
    fontWeight: '800',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  datePillRow: {
    paddingBottom: 12,
  },
  datePill: {
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#B7E4DA',
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 10,
    marginBottom: 12,
  },
  datePillActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  datePillText: {
    color: '#0F766E',
    fontWeight: '700',
    fontSize: 13,
  },
  datePillTextActive: {
    color: '#FFFFFF',
  },
  slotsLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  slotsLoadingText: {
    color: '#285E55',
    fontSize: 13,
    marginLeft: 8,
  },
  noSlotsText: {
    color: '#6B7280',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  slotPill: {
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#B7E4DA',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  slotPillActive: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  slotText: {
    color: '#0F766E',
    fontWeight: '700',
    fontSize: 13,
  },
  slotTextActive: {
    color: '#FFFFFF',
  },
  reviewCard: {
    backgroundColor: '#E8FBF5',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  reviewTitle: {
    color: '#0F766E',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  reviewCopy: {
    color: '#285E55',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  reviewAuthor: {
    color: '#0F766E',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#14B8A6',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
