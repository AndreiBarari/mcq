import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/**
 * Character rendered with pure React Native Views — no Skia / CanvasKit WASM needed.
 * This works identically on web, Android, and iOS without any special initialization.
 */
export default function Character({ position, charClass }) {
  const scaleY = useSharedValue(1);

  useEffect(() => {
    scaleY.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1,    { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
  }));

  const isMage = charClass === 'Mage';
  const bodyColor  = isMage ? '#3B82F6' : '#EF4444';
  const accentColor = isMage ? '#8B5CF6' : '#9CA3AF';

  return (
    <Animated.View
      style={[
        styles.root,
        { left: position.x - 50, top: position.y - 100 },
        animatedStyle,
      ]}
    >
      {/* ── Hat / Helmet ── */}
      {isMage ? (
        // Pointy wizard hat: CSS border triangle trick
        <View style={styles.mageHat} />
      ) : (
        // Flat warrior helmet
        <View style={[styles.helmet, { backgroundColor: accentColor }]} />
      )}

      {/* ── Head ── */}
      <View style={styles.head} />

      {/* ── Body ── */}
      <View style={[styles.body, { backgroundColor: bodyColor }]} />

      {/* ── Weapon ── */}
      {isMage ? (
        // Staff: tall thin rectangle
        <View style={styles.staff} />
      ) : (
        // Sword: wide thin rectangle
        <View style={styles.sword} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    width: 100,
    height: 100,
    alignItems: 'center',
  },

  // ── Mage hat: CSS triangle via zero-width box with borders ──
  mageHat: {
    width: 0,
    height: 0,
    borderLeftWidth: 22,
    borderRightWidth: 22,
    borderBottomWidth: 36,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#8B5CF6',
    marginBottom: -4,
    zIndex: 1,
  },

  // ── Warrior helmet ──
  helmet: {
    width: 40,
    height: 14,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    marginBottom: -4,
    zIndex: 1,
  },

  // ── Head ──
  head: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFD1DC',
    zIndex: 2,
  },

  // ── Body ──
  body: {
    width: 40,
    height: 44,
    borderRadius: 4,
    marginTop: 2,
    zIndex: 2,
  },

  // ── Mage staff ──
  staff: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 5,
    height: 72,
    backgroundColor: '#8B4513',
    borderRadius: 2,
    zIndex: 0,
  },

  // ── Warrior sword ──
  sword: {
    position: 'absolute',
    right: 2,
    top: 42,
    width: 38,
    height: 7,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    zIndex: 0,
  },
});
