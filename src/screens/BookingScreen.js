import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  PET_SIZE_OPTIONS,
  PET_TYPE_OPTIONS,
  getGroomerById,
  usePet,
} from '../store/petStore';
import { getMyPets, savePet } from '../services/petApi';
import { createBooking } from '../services/bookingApi';

function SelectorGroup({ label, options, value, onSelect, disabledValues = [] }) {
  return (
    <View style={styles.selectorBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.selectorRow}>
        {options.map((option) => {
          const disabled = disabledValues.includes(option);
          const selected = value === option;
          return (
            <Pressable
              key={option}
              disabled={disabled}
              style={[
                styles.selectorPill,
                selected && styles.selectorPillActive,
                disabled && styles.selectorPillDisabled,
              ]}
              onPress={() => onSelect(option)}
            >
              <Text
                style={[
                  styles.selectorText,
                  selected && styles.selectorTextActive,
                  disabled && styles.selectorTextDisabled,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function BookingScreen() {
  const { state, dispatch } = usePet();
  const groomer = getGroomerById(state.selectedGroomer, state.groomers);

  const [savedPets, setSavedPets] = useState([]);
  const [selectedSavedPetId, setSelectedSavedPetId] = useState(null);
  const [savePetForNextTime, setSavePetForNextTime] = useState(false);
  const [petsLoading, setPetsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSavedPets() {
      setPetsLoading(true);
      try {
        const pets = await getMyPets();
        if (!cancelled) {
          setSavedPets(pets);
        }
      } catch {
        // API unavailable — silently skip; manual entry remains available
      } finally {
        if (!cancelled) {
          setPetsLoading(false);
        }
      }
    }

    loadSavedPets();
    return () => {
      cancelled = true;
    };
  }, []);

  function selectSavedPet(pet) {
    setSelectedSavedPetId(pet.id);
    dispatch({ type: 'SET_BOOKING_DATA', key: 'petName', val: pet.name ?? '' });
    dispatch({ type: 'SET_BOOKING_DATA', key: 'petType', val: pet.species ?? state.bookingData.petType });
    dispatch({ type: 'SET_BOOKING_DATA', key: 'petSize', val: pet.breed ?? state.bookingData.petSize });
    dispatch({ type: 'SET_BOOKING_DATA', key: 'notes', val: pet.notes ?? '' });
  }

  async function handleConfirm() {
    if (savePetForNextTime) {
      try {
        await savePet({
          name: state.bookingData.petName,
          species: state.bookingData.petType,
          breed: state.bookingData.petSize,
          notes: state.bookingData.notes,
          weight: null,
          vaccination_status: null,
          vet_name: null,
          allergies: null,
        });
      } catch {
        // Save failed silently — don't block the booking
      }
    }

    setBookingLoading(true);
    try {
      const result = await createBooking({
        groomer_id: groomer.id,
        service_id: state.selectedService?.id ?? state.selectedService?.name,
        slot_time: state.bookingData.time,
        pet_name: state.bookingData.petName,
        pet_breed: state.bookingData.petSize,
        pet_size: state.bookingData.petSize,
        notes: state.bookingData.notes,
      });
      dispatch({ type: 'COMPLETE_BOOKING' });
      dispatch({
        type: 'SET_BOOKING_RESULT',
        booking_id: result.booking_id,
        confirmation_code: result.confirmation_code,
      });
    } catch {
      Alert.alert('Booking failed', 'Something went wrong. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  }

  if (!groomer) {
    return null;
  }

  const selectedServiceName = state.selectedService?.groomerId === groomer.id ? state.selectedService.name : groomer.services[0].name;
  const disabledPetTypes = PET_TYPE_OPTIONS.filter((type) => !groomer.petTypes.includes(type));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <Pressable style={styles.backButton} onPress={() => dispatch({ type: 'SET_PHASE', phase: 'groomer' })}>
        <Text style={styles.backButtonText}>← {groomer.name}</Text>
      </Pressable>

      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=400&q=80' }}
        style={styles.headerImage}
      />

      <View style={styles.summaryCard}>
        <Text style={styles.summaryEyebrow}>Booking details</Text>
        <Text style={styles.summaryTitle}>{groomer.name}</Text>
        <Text style={styles.summaryMeta}>Selected time: {state.bookingData.time || groomer.timeSlots[0]}</Text>
      </View>

      {petsLoading && (
        <View style={styles.petsLoadingRow}>
          <ActivityIndicator size="small" color="#0F766E" />
          <Text style={styles.petsLoadingText}>Loading saved pets…</Text>
        </View>
      )}

      {!petsLoading && savedPets.length > 0 && (
        <View style={styles.savedPetsBlock}>
          <Text style={styles.fieldLabel}>Saved pets</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedPetsRow}>
            {savedPets.map((pet) => {
              const active = selectedSavedPetId === pet.id;
              return (
                <Pressable
                  key={pet.id}
                  style={[styles.savedPetPill, active && styles.savedPetPillActive]}
                  onPress={() => selectSavedPet(pet)}
                >
                  <Text style={[styles.savedPetPillText, active && styles.savedPetPillTextActive]}>
                    {pet.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <TextInput
        value={state.bookingData.petName}
        onChangeText={(val) => {
          setSelectedSavedPetId(null);
          dispatch({ type: 'SET_BOOKING_DATA', key: 'petName', val });
        }}
        placeholder="Pet name"
        placeholderTextColor="#6B8A83"
        style={styles.input}
      />

      <SelectorGroup
        label="Pet type"
        options={PET_TYPE_OPTIONS}
        value={state.bookingData.petType}
        onSelect={(val) => dispatch({ type: 'SET_BOOKING_DATA', key: 'petType', val })}
        disabledValues={disabledPetTypes}
      />

      <SelectorGroup
        label="Pet size"
        options={PET_SIZE_OPTIONS}
        value={state.bookingData.petSize}
        onSelect={(val) => dispatch({ type: 'SET_BOOKING_DATA', key: 'petSize', val })}
      />

      <View style={styles.selectorBlock}>
        <Text style={styles.fieldLabel}>Service</Text>
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
      </View>

      <Text style={styles.fieldLabel}>Special notes</Text>
      <TextInput
        value={state.bookingData.notes}
        onChangeText={(val) => dispatch({ type: 'SET_BOOKING_DATA', key: 'notes', val })}
        placeholder="Any grooming notes, coat concerns, or temperament details..."
        placeholderTextColor="#6B8A83"
        multiline
        style={[styles.input, styles.notesInput]}
      />

      <View style={styles.savePetRow}>
        <View style={styles.savePetLabelBlock}>
          <Text style={styles.savePetLabel}>Save pet for next time</Text>
          <Text style={styles.savePetSub}>Your pet details will be stored for faster booking.</Text>
        </View>
        <Switch
          value={savePetForNextTime}
          onValueChange={setSavePetForNextTime}
          trackColor={{ false: '#CBD5E1', true: '#14B8A6' }}
          thumbColor="#FFFFFF"
        />
      </View>

      <Pressable
        style={[styles.primaryButton, bookingLoading && styles.primaryButtonDisabled]}
        onPress={handleConfirm}
        disabled={bookingLoading}
      >
        {bookingLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Confirm Booking</Text>
        )}
      </Pressable>
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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backButtonText: {
    color: '#0F766E',
    fontSize: 15,
    fontWeight: '800',
  },
  headerImage: {
    width: '100%',
    height: 190,
    borderRadius: 24,
    marginBottom: 18,
    backgroundColor: '#D1FAE5',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#B7E4DA',
    marginBottom: 16,
  },
  summaryEyebrow: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  summaryTitle: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  summaryMeta: {
    color: '#285E55',
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#B7E4DA',
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#111827',
    fontSize: 15,
    marginBottom: 16,
  },
  notesInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  selectorBlock: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: '#164E48',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectorPill: {
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#B7E4DA',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  selectorPillActive: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  selectorPillDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  selectorText: {
    color: '#0F766E',
    fontWeight: '700',
    fontSize: 13,
  },
  selectorTextActive: {
    color: '#FFFFFF',
  },
  selectorTextDisabled: {
    color: '#94A3B8',
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D3F0E8',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceCardSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#14B8A6',
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
    fontSize: 17,
    fontWeight: '800',
  },
  petsLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  petsLoadingText: {
    color: '#285E55',
    fontSize: 13,
    marginLeft: 8,
  },
  savedPetsBlock: {
    marginBottom: 16,
  },
  savedPetsRow: {
    paddingBottom: 4,
  },
  savedPetPill: {
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#B7E4DA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
  },
  savedPetPillActive: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  savedPetPillText: {
    color: '#0F766E',
    fontWeight: '700',
    fontSize: 14,
  },
  savedPetPillTextActive: {
    color: '#FFFFFF',
  },
  savePetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#B7E4DA',
    padding: 14,
    marginBottom: 16,
  },
  savePetLabelBlock: {
    flex: 1,
    marginRight: 12,
  },
  savePetLabel: {
    color: '#164E48',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  savePetSub: {
    color: '#5B6B67',
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: '#14B8A6',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryButtonDisabled: {
    backgroundColor: '#7DD3CC',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
