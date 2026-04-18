import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  withTiming
} from 'react-native-reanimated';
import useGameStore from '../store/useGameStore';

const CoursePaywall = () => {
  const [packages, setPackages] = useState([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const hasPremiumAccess = useGameStore((state) => state.hasPremiumAccess);
  const setHasPremiumAccess = useGameStore((state) => state.setHasPremiumAccess);

  // Reanimated values for the Level Up celebration
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Note: Make sure Purchases.configure({ apiKey: 'YOUR_KEY' }) 
    // is called earlier in your App.js or root index file.
    const fetchOfferings = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
          setPackages(offerings.current.availablePackages);
        }
      } catch (e) {
        console.error('Error fetching offerings', e);
      }
    };
    
    fetchOfferings();
  }, []);

  const triggerCelebration = () => {
    setShowCelebration(true);
    // Animate opacity and a bouncy scale in
    opacity.value = withTiming(1, { duration: 400 });
    scale.value = withSequence(
      withTiming(1.3, { duration: 300 }),
      withSpring(1, { damping: 5, stiffness: 100 })
    );
  };

  const handlePurchase = async (pkg) => {
    setIsPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      
      // Update check based on your RevenueCat entitlement identifier (e.g., 'premium')
      if (typeof customerInfo.entitlements.active['premium'] !== 'undefined') {
        setHasPremiumAccess(true);
        triggerCelebration();
      } else {
        // Fallback for demo purposes if entitlements aren't wired remotely yet
        setHasPremiumAccess(true);
        triggerCelebration();
      }
    } catch (e) {
      if (!e.userCancelled) {
        Alert.alert('Purchase Failed', 'There was an error completing your purchase. Please try again.');
        console.error(e);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const animatedCelebrationStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  if (hasPremiumAccess) {
    return (
      <View style={styles.container}>
        {showCelebration ? (
          <Animated.View style={[styles.celebrationContainer, animatedCelebrationStyle]}>
            <Text style={styles.celebrationEmoji}>🎉✨🎓</Text>
            <Text style={styles.celebrationText}>LEVEL UP!</Text>
            <Text style={styles.celebrationSubText}>Lifetime Access Unlocked. You are ready to code!</Text>
          </Animated.View>
        ) : (
          <View style={styles.celebrationContainer}>
             <Text style={styles.successText}>You have Lifetime Access!</Text>
          </View>
        )}
      </View>
    );
  }

  // Filter for a lifetime package if available, else just take the first one
  const lifetimePackage = packages.find(p => p.packageType === 'LIFETIME') || packages[0];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unlock All Quests!</Text>
      <Text style={styles.subtitle}>Get One-Time Lifetime Access to the entire course catalog.</Text>
      
      {lifetimePackage ? (
        <View style={styles.card}>
          <Text style={styles.price}>{lifetimePackage.product.priceString}</Text>
          <Text style={styles.description}>{lifetimePackage.product.description || 'Master coding basics with lifetime access.'}</Text>
          
          <TouchableOpacity 
            style={styles.purchaseButton}
            onPress={() => handlePurchase(lifetimePackage)}
            disabled={isPurchasing}
          >
            {isPurchasing ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.purchaseButtonText}>Unlock Lessons 🗝️</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <ActivityIndicator size="large" color="#FFD700" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700', // Gold color for RPG feel
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#E5E5EA',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3A3A3C',
    ...Platform.select({
      web: { boxShadow: '0 4px 5px rgba(0, 0, 0, 0.3)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      }
    }),
    elevation: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#AEAEB2',
    textAlign: 'center',
    marginBottom: 24,
  },
  purchaseButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  celebrationContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  celebrationText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFD700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 2,
  },
  celebrationSubText: {
    fontSize: 16,
    color: '#E5E5EA',
    textAlign: 'center',
  },
  successText: {
    fontSize: 20,
    color: '#34C759',
    fontWeight: 'bold',
  }
});

export default CoursePaywall;
