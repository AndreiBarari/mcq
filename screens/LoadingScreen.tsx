import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';

const LoadingScreen = () => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Standard Animated is much more stable for web startups
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: false, // Must be false for rotation on web sometimes
      })
    ).start();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <FontAwesome5 name="compass" size={80} color="#FFD700" />
      </Animated.View>
      <Text style={styles.loadingText}>Entering the Realm...</Text>
      <Text style={styles.subText}>Preparing your spells and potions</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2b1b11',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 30,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    fontFamily: 'serif',
    letterSpacing: 2,
  },
  subText: {
    marginTop: 10,
    fontSize: 14,
    color: '#d4c5b9',
    fontStyle: 'italic',
  }
});

export default LoadingScreen;
