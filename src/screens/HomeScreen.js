import React, { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { enrichGroomers, getFilteredGroomers, getGroomerImageUri, usePet } from '../store/petStore';
import { getGroomers } from '../services/groomerApi';

const PET_TYPE_OPTIONS = [
  { label: 'All', value: 'All' },
  { label: 'Dogs', value: 'Dog' },
  { label: 'Cats', value: 'Cat' },
  { label: 'Rabbits', value: 'Rabbit' },
];

const SORT_OPTIONS = [
  { label: 'Distance', value: 'Distance' },
  { label: 'Rating', value: 'Rating' },
  { label: 'Price', value: 'Price' },
];

const PRICE_OPTIONS = [
  { label: 'Any', value: 'Any' },
  { label: 'Under $70', value: '70' },
  { label: 'Under $90', value: '90' },
  { label: 'Under $120', value: '120' },
];

const AVAILABILITY_OPTIONS = [
  { label: 'Any', value: 'Any' },
  { label: 'Today only', value: 'Today' },
];

function locationLabel(groomer) {
  if (groomer.distance === 0 || groomer.suburb.includes('Comes to you')) {
    return 'Comes to you';
  }
  return `${groomer.suburb} · ${groomer.distance.toFixed(1)}km away`;
}

function petTypeLabel(types) {
  return types.join(' • ');
}

function availabilityTone(label) {
  return label.includes('Today') ? styles.availabilityToday : styles.availabilityLater;
}

function FilterGroup({ title, options, selected, onSelect }) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.filterPillRow}>
        {options.map((option) => {
          const active = selected === option.value;
          return (
            <Pressable
              key={option.label}
              onPress={() => onSelect(option.value)}
              style={[styles.filterPill, active && styles.filterPillActive]}
            >
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function GroomerCard({ groomer, onOpen }) {
  return (
    <Pressable style={styles.card} onPress={onOpen}>
      <View style={styles.cardTopRow}>
        <Image source={{ uri: getGroomerImageUri(groomer.image, 240) }} style={styles.avatar} />
        <View style={styles.cardCopy}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>{groomer.name}</Text>
            {groomer.badge ? (
              <View style={[styles.badge, { backgroundColor: groomer.badgeColor || '#14B8A6' }]}>
                <Text style={styles.badgeText}>{groomer.badge}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.cardLocation}>{locationLabel(groomer)}</Text>
          <Text style={styles.cardRating}>{groomer.rating.toFixed(1)} stars · {groomer.reviewCount} reviews</Text>
          <Text style={styles.cardPetTypes}>{petTypeLabel(groomer.petTypes)}</Text>
        </View>
      </View>

      <View style={styles.cardMetaRow}>
        <Text style={[styles.cardAvailability, availabilityTone(groomer.nextAvailable)]}>{groomer.nextAvailable}</Text>
        <Text style={styles.cardPrice}>From ${groomer.priceFrom}</Text>
      </View>

      <View style={styles.tagRow}>
        {groomer.tags.map((tag) => (
          <View key={tag} style={styles.tagPill}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardActionRow}>
        <Text style={styles.cardCta}>View profile</Text>
        <Text style={styles.cardArrow}>→</Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { state, dispatch } = usePet();

  useEffect(() => {
    let cancelled = false;

    async function loadGroomers() {
      dispatch({ type: 'GROOMERS_LOADING', loading: true });
      try {
        const apiGroomers = await getGroomers();
        if (!cancelled && apiGroomers && apiGroomers.length > 0) {
          dispatch({ type: 'SET_GROOMERS', groomers: enrichGroomers(apiGroomers) });
        } else {
          // API not configured or returned empty — keep static data
          dispatch({ type: 'GROOMERS_LOADING', loading: false });
        }
      } catch {
        // API unavailable — fall back to static data silently
        if (!cancelled) {
          dispatch({ type: 'GROOMERS_LOADING', loading: false });
        }
      }
    }

    loadGroomers();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const filteredGroomers = useMemo(
    () => getFilteredGroomers(state.groomers, state.filters, state.searchText),
    [state.groomers, state.filters, state.searchText]
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <View style={styles.headerBlock}>
        <Text style={styles.logo}>Pawfect</Text>
        <Text style={styles.tagline}>Book polished pet grooming in minutes.</Text>
      </View>

      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=300' }}
        style={styles.heroImage}
        imageStyle={styles.heroImageStyle}
      >
        <View style={styles.heroOverlay} />
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>Sydney's top-rated pet care</Text>
          <Text style={styles.heroTitle}>Find Your Perfect Pet Groomer</Text>
          <Text style={styles.heroSubtitle}>Browse trusted specialists for dogs, cats, and rabbits near you.</Text>
        </View>
      </ImageBackground>

      <View style={styles.searchCard}>
        <Pressable style={styles.locationRow}>
          <Text style={styles.locationText}>Surry Hills, NSW</Text>
          <Text style={styles.locationChange}>Serving nearby suburbs</Text>
        </Pressable>

        <TextInput
          value={state.searchText}
          onChangeText={(val) => dispatch({ type: 'SET_SEARCH', val })}
          placeholder="Search groomer, suburb, or service..."
          placeholderTextColor="#6B8A83"
          style={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersWrap}>
        <FilterGroup
          title="Pet Type"
          options={PET_TYPE_OPTIONS}
          selected={state.filters.petType}
          onSelect={(val) => dispatch({ type: 'SET_FILTER', key: 'petType', val })}
        />
        <FilterGroup
          title="Sort"
          options={SORT_OPTIONS}
          selected={state.filters.sortBy}
          onSelect={(val) => dispatch({ type: 'SET_FILTER', key: 'sortBy', val })}
        />
        <FilterGroup
          title="Price"
          options={PRICE_OPTIONS}
          selected={state.filters.priceMax}
          onSelect={(val) => dispatch({ type: 'SET_FILTER', key: 'priceMax', val })}
        />
        <FilterGroup
          title="Availability"
          options={AVAILABILITY_OPTIONS}
          selected={state.filters.available}
          onSelect={(val) => dispatch({ type: 'SET_FILTER', key: 'available', val })}
        />
      </ScrollView>

      <Text style={styles.resultsCount}>{filteredGroomers.length} groomers ready to pamper your pet</Text>

      {state.groomersLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingText}>Finding groomers near you…</Text>
        </View>
      ) : (
        filteredGroomers.map((groomer) => (
          <GroomerCard
            key={groomer.id}
            groomer={groomer}
            onOpen={() => dispatch({ type: 'SELECT_GROOMER', id: groomer.id })}
          />
        ))
      )}

      <View style={styles.footerCard}>
        <Text style={styles.footerTitle}>Why pet parents love Pawfect</Text>
        <Text style={styles.footerCopy}>Instant availability, transparent pricing, polished profiles, and a premium booking flow built for release day.</Text>
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
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 36,
  },
  headerBlock: {
    marginBottom: 18,
  },
  logo: {
    color: '#0F766E',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 6,
  },
  tagline: {
    color: '#285E55',
    fontSize: 16,
  },
  heroImage: {
    height: 200,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 18,
    justifyContent: 'flex-end',
  },
  heroImageStyle: {
    borderRadius: 28,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 118, 110, 0.38)',
  },
  heroCopy: {
    padding: 20,
  },
  heroEyebrow: {
    color: '#D1FAE5',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: '#ECFDF5',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: '90%',
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#B7E4DA',
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#164E48',
  },
  locationChange: {
    fontSize: 13,
    color: '#0F766E',
    fontWeight: '600',
  },
  searchInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CDEEE5',
    backgroundColor: '#F5FFFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  filtersWrap: {
    paddingBottom: 8,
    paddingRight: 20,
  },
  filterGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CDEEE5',
    padding: 14,
    marginRight: 12,
    minWidth: 220,
  },
  filterTitle: {
    fontSize: 13,
    color: '#0F766E',
    fontWeight: '700',
    marginBottom: 10,
  },
  filterPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3FBF8',
    marginRight: 8,
    marginBottom: 8,
  },
  filterPillActive: {
    backgroundColor: '#14B8A6',
  },
  filterPillText: {
    color: '#285E55',
    fontSize: 13,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  resultsCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#164E48',
    marginVertical: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#B7E4DA',
    marginBottom: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 14,
    backgroundColor: '#D1FAE5',
  },
  cardCopy: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 4,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  cardLocation: {
    fontSize: 14,
    color: '#5B6B67',
    marginBottom: 4,
  },
  cardRating: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  cardPetTypes: {
    fontSize: 13,
    color: '#0F766E',
    fontWeight: '700',
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardAvailability: {
    fontSize: 13,
    fontWeight: '700',
  },
  availabilityToday: {
    color: '#059669',
  },
  availabilityLater: {
    color: '#64748B',
  },
  cardPrice: {
    color: '#0F766E',
    fontSize: 14,
    fontWeight: '800',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  tagPill: {
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '600',
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5F6F1',
    paddingTop: 14,
  },
  cardCta: {
    color: '#0F766E',
    fontSize: 15,
    fontWeight: '800',
  },
  cardArrow: {
    color: '#0F766E',
    fontSize: 20,
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#285E55',
    fontSize: 14,
  },
  footerCard: {    backgroundColor: '#E8FBF5',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#B7E4DA',
    marginTop: 8,
  },
  footerTitle: {
    color: '#0F766E',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  footerCopy: {
    color: '#285E55',
    fontSize: 14,
    lineHeight: 21,
  },
});
