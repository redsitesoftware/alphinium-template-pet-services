import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getGroomerById, getGroomerImageUri, usePet } from '../store/petStore';
import { getAvailability } from '../services/availabilityApi';
import { getGroomerServices } from '../services/catalogApi';
import { getGroomerReviews, submitReview } from '../services/reviewsApi';

function locationLabel(groomer) {
  if (groomer.distance === 0 || groomer.suburb.includes('Comes to you')) {
    return 'Comes to you';
  }
  return `${groomer.suburb} · ${groomer.distance.toFixed(1)}km away`;
}

function ratingStars(rating) {
  return `${rating.toFixed(1)} stars`;
}

function renderStarString(rating, max = 5) {
  const filled = Math.round(rating);
  return '★'.repeat(filled) + '☆'.repeat(Math.max(0, max - filled));
}

function formatDate(isoDate) {
  try {
    return new Date(isoDate).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
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

  const [services, setServices] = useState(groomer?.services ?? []);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Reviews state
  const reviewsData = groomer ? (state.groomerReviews[groomer.id] ?? null) : null;
  const [reviewsPage, setReviewsPage] = useState(1);
  const [loadMoreInFlight, setLoadMoreInFlight] = useState(false);

  // Submit form state
  const [formOpen, setFormOpen] = useState(false);
  const [starPick, setStarPick] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const isAuthenticated = Boolean(state.authToken) && !state.isGuest;

  // Fetch live services from the catalog API; fall back to static data if unavailable.
  useEffect(() => {
    if (!groomer) return;
    let cancelled = false;

    async function loadServices() {
      setServicesLoading(true);
      try {
        const apiServices = await getGroomerServices(groomer.id);
        if (!cancelled) {
          if (apiServices && apiServices.length > 0) {
            setServices(apiServices);
          } else {
            setServices(groomer.services ?? []);
          }
        }
      } catch {
        if (!cancelled) setServices(groomer.services ?? []);
      } finally {
        if (!cancelled) setServicesLoading(false);
      }
    }

    loadServices();
    return () => {
      cancelled = true;
    };
  }, [groomer?.id]);

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

  // Load first page of reviews on mount
  useEffect(() => {
    if (!groomer) return;
    let cancelled = false;

    async function loadReviews() {
      dispatch({ type: 'REVIEWS_LOADING', groomerId: groomer.id });
      try {
        const result = await getGroomerReviews(groomer.id, 1, groomer);
        if (!cancelled) {
          dispatch({
            type: 'SET_REVIEWS',
            groomerId: groomer.id,
            reviews: result.reviews,
            total: result.total,
            hasMore: result.hasMore,
            append: false,
          });
          setReviewsPage(1);
        }
      } catch (err) {
        if (!cancelled) {
          dispatch({
            type: 'SET_REVIEWS',
            groomerId: groomer.id,
            reviews: [],
            total: 0,
            hasMore: false,
            append: false,
          });
        }
      }
    }

    loadReviews();
    return () => { cancelled = true; };
  }, [groomer?.id]);

  if (!groomer) {
    return null;
  }

  async function handleLoadMore() {
    if (loadMoreInFlight || !reviewsData?.hasMore) return;
    setLoadMoreInFlight(true);
    try {
      const nextPage = reviewsPage + 1;
      const result = await getGroomerReviews(groomer.id, nextPage, groomer);
      dispatch({
        type: 'SET_REVIEWS',
        groomerId: groomer.id,
        reviews: result.reviews,
        total: result.total,
        hasMore: result.hasMore,
        append: true,
      });
      setReviewsPage(nextPage);
    } catch (err) {
      Alert.alert('Error', 'Could not load more reviews. Please try again.');
    } finally {
      setLoadMoreInFlight(false);
    }
  }

  async function handleSubmitReview() {
    if (reviewText.trim().length < 10) {
      Alert.alert('Review too short', 'Please write at least 10 characters.');
      return;
    }
    setSubmitLoading(true);
    try {
      const created = await submitReview(
        groomer.id,
        { rating: starPick, text: reviewText.trim(), photos: [] },
        state.authToken
      );
      dispatch({ type: 'ADD_REVIEW', groomerId: groomer.id, review: created });
      setFormOpen(false);
      setReviewText('');
      setStarPick(5);
      Alert.alert('Thanks for your review!', 'Your review has been submitted.');
    } catch (err) {
      Alert.alert('Submission failed', err.message ?? 'Please try again.');
    } finally {
      setSubmitLoading(false);
    }
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
        {servicesLoading ? (
          <View style={styles.slotsLoadingRow}>
            <ActivityIndicator size="small" color="#0F766E" />
            <Text style={styles.slotsLoadingText}>Loading services…</Text>
          </View>
        ) : (
          services.map((service) => {
            const selected = selectedServiceName === service.name;
            const hasSizePricing =
              service.pricing &&
              (service.pricing.small != null ||
                service.pricing.medium != null ||
                service.pricing.large != null);
            return (
              <Pressable
                key={service.id ?? service.name}
                style={[styles.serviceCard, selected && styles.serviceCardSelected]}
                onPress={() => dispatch({ type: 'SELECT_SERVICE', service: { ...service, groomerId: groomer.id } })}
              >
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceMeta}>{service.duration}</Text>
                  {hasSizePricing && (
                    <View style={styles.sizePricingRow}>
                      {service.pricing.small != null && (
                        <Text style={styles.sizePricingText}>S ${service.pricing.small}</Text>
                      )}
                      {service.pricing.medium != null && (
                        <Text style={styles.sizePricingText}>M ${service.pricing.medium}</Text>
                      )}
                      {service.pricing.large != null && (
                        <Text style={styles.sizePricingText}>L ${service.pricing.large}</Text>
                      )}
                    </View>
                  )}
                </View>
                {!hasSizePricing && service.price != null && (
                  <Text style={styles.servicePrice}>${service.price}</Text>
                )}
              </Pressable>
            );
          })
        )}

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

        {/* ── Reviews section ── */}
        <Text style={styles.sectionTitle}>
          Reviews{reviewsData && reviewsData.total > 0 ? ` (${reviewsData.total})` : ''}
        </Text>

        {reviewsData?.loading && !(reviewsData?.reviews?.length) ? (
          <View style={styles.slotsLoadingRow}>
            <ActivityIndicator size="small" color="#0F766E" />
            <Text style={styles.slotsLoadingText}>Loading reviews…</Text>
          </View>
        ) : (reviewsData?.reviews ?? []).length === 0 ? (
          <Text style={styles.noReviewsText}>No reviews yet — be the first!</Text>
        ) : (
          <>
            {(reviewsData.reviews).map((review) => (
              <View key={review.id} style={styles.reviewItemCard}>
                <View style={styles.reviewItemHeader}>
                  <Text style={styles.reviewStars}>{renderStarString(review.rating)}</Text>
                  <Text style={styles.reviewAuthorName}>{review.author}</Text>
                  <Text style={styles.reviewDate}>{formatDate(review.date)}</Text>
                </View>
                <Text style={styles.reviewItemText}>{review.text}</Text>
              </View>
            ))}

            {reviewsData.hasMore && (
              <Pressable style={styles.loadMoreButton} onPress={handleLoadMore} disabled={loadMoreInFlight}>
                {loadMoreInFlight ? (
                  <ActivityIndicator size="small" color="#0F766E" />
                ) : (
                  <Text style={styles.loadMoreText}>Load more</Text>
                )}
              </Pressable>
            )}
          </>
        )}

        {/* ── Submit review section ── */}
        {isAuthenticated ? (
          <View style={styles.submitSection}>
            <Pressable
              style={styles.writeReviewToggle}
              onPress={() => setFormOpen((v) => !v)}
            >
              <Text style={styles.writeReviewToggleText}>
                {formOpen ? '✕ Cancel' : '✏️ Write a review'}
              </Text>
            </Pressable>

            {formOpen && (
              <View style={styles.reviewForm}>
                <Text style={styles.formLabel}>Your rating</Text>
                <View style={styles.starPicker}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable key={n} onPress={() => setStarPick(n)} style={styles.starButton}>
                      <Text style={[styles.starPickText, n <= starPick && styles.starPickActive]}>
                        ★
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.formLabel}>Your review</Text>
                <TextInput
                  style={styles.reviewInput}
                  multiline
                  placeholder="Share your experience (min. 10 characters)…"
                  placeholderTextColor="#9CA3AF"
                  value={reviewText}
                  onChangeText={setReviewText}
                />

                <Pressable
                  style={[styles.submitButton, submitLoading && styles.submitButtonDisabled]}
                  onPress={handleSubmitReview}
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit review</Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.signInPrompt}>Sign in to leave a review</Text>
        )}

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
  serviceInfo: {
    flex: 1,
    paddingRight: 8,
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
  sizePricingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 8,
  },
  sizePricingText: {
    color: '#0F766E',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 8,
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
  // Reviews list
  noReviewsText: {
    color: '#6B7280',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  reviewItemCard: {
    backgroundColor: '#F8FFFD',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D3F0E8',
    marginBottom: 10,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 6,
    gap: 8,
  },
  reviewStars: {
    color: '#F59E0B',
    fontSize: 14,
    letterSpacing: 1,
  },
  reviewAuthorName: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 13,
    flex: 1,
  },
  reviewDate: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  reviewItemText: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
  },
  loadMoreButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B7E4DA',
    backgroundColor: '#ECFDF5',
  },
  loadMoreText: {
    color: '#0F766E',
    fontWeight: '700',
    fontSize: 14,
  },
  // Submit review
  submitSection: {
    marginBottom: 20,
  },
  writeReviewToggle: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#14B8A6',
    marginBottom: 10,
  },
  writeReviewToggleText: {
    color: '#0F766E',
    fontWeight: '700',
    fontSize: 14,
  },
  reviewForm: {
    backgroundColor: '#F8FFFD',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D3F0E8',
  },
  formLabel: {
    color: '#164E48',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 8,
  },
  starPicker: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  starButton: {
    paddingHorizontal: 4,
  },
  starPickText: {
    fontSize: 28,
    color: '#D1D5DB',
  },
  starPickActive: {
    color: '#F59E0B',
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#B7E4DA',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#14B8A6',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  signInPrompt: {
    color: '#9CA3AF',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 20,
  },
});
