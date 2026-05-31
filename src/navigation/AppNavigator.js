import React from 'react';
import HomeScreen from '../screens/HomeScreen';
import GroomerDetailScreen from '../screens/GroomerDetailScreen';
import BookingScreen from '../screens/BookingScreen';
import ConfirmationScreen from '../screens/ConfirmationScreen';
import { usePet } from '../store/petStore';

export default function AppNavigator() {
  const { state } = usePet();

  if ((state.phase === 'groomer' || state.phase === 'booking') && !state.selectedGroomer) {
    return <HomeScreen />;
  }

  if (state.phase === 'confirm' && !state.confirmedBooking) {
    return <HomeScreen />;
  }

  if (state.phase === 'groomer') {
    return <GroomerDetailScreen />;
  }

  if (state.phase === 'booking') {
    return <BookingScreen />;
  }

  if (state.phase === 'confirm') {
    return <ConfirmationScreen />;
  }

  return <HomeScreen />;
}
