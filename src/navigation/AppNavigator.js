import React, { useCallback } from 'react';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import GroomerDetailScreen from '../screens/GroomerDetailScreen';
import BookingScreen from '../screens/BookingScreen';
import ConfirmationScreen from '../screens/ConfirmationScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import { usePet } from '../store/petStore';

export default function AppNavigator() {
  const { state, dispatch } = usePet();

  const handleLogin = useCallback(({ guest, token, user }) => {
    dispatch({ type: 'COMPLETE_LOGIN', guest, token, user });
  }, [dispatch]);

  if (state.phase === 'login') {
    return <LoginScreen onLogin={handleLogin} />;
  }

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

  if (state.phase === 'mybookings') {
    return <MyBookingsScreen />;
  }

  return <HomeScreen />;
}
