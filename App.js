import React from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { PetProvider } from './src/store/petStore';

export default function App() {
  return (
    <PetProvider>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF7ED" />
        <AppNavigator />
      </View>
    </PetProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7ED',
  },
});
