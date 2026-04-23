import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  Easing,
  withDelay,
  withSequence,
  runOnJS
} from 'react-native-reanimated';
import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const Travel = () => {
  const router = useRouter();
  const { to, msg } = useLocalSearchParams();
  
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  const performNavigation = () => {
    // We use replace to ensure the Travel screen itself is not in the history stack
    router.replace(to as string || '/');
  };

  useEffect(() => {
    // 1. Entrance Animation
    opacity.value = withTiming(1, { duration: 400 });
    scale.value = withTiming(1, { duration: 450 });

    // 2. Continuous Compass Spin
    rotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );

    // 3. Forced Buffer Duration (1s) before navigation
    const timer = setTimeout(() => {
        performNavigation();
    }, 1100);

    return () => clearTimeout(timer);
  }, []);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const animatedSpin = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <SafeAreaView style={styles.background}>
      <Animated.View style={[styles.container, animatedContainerStyle]}>
        <Animated.View style={[styles.iconBox, animatedSpin]}>
          <FontAwesome5 name="compass" size={64} color="#FFD700" />
        </Animated.View>
        
        <Text style={styles.messageText}>{msg || "Traveling through the realm..."}</Text>
        
        <View style={styles.progressBarContainer}>
          <Animated.View 
            style={[
              styles.progressBar, 
              { 
                width: withTiming('100%', { duration: 1000, easing: Easing.linear }) 
              }
            ]} 
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#1a110a', // Even darker for transition focus
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconBox: {
    marginBottom: 40,
    // Use boxShadow for web to avoid deprecation warnings, shadow props for native
    ...Platform.select({
      web: { boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)' },
      default: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      }
    }),
  },
  messageText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    fontFamily: 'serif',
    fontStyle: 'italic',
    letterSpacing: 1.2,
    marginBottom: 30,
  },
  progressBarContainer: {
    width: width * 0.6,
    height: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFD700',
  }
});

export default Travel;
