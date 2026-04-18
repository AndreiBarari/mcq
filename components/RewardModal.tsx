import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import useGameStore from '../store/useGameStore';
import LevelUpEffect from './LevelUpEffect';

const BOSS_LEVELS = [3, 6, 9];

const RewardModal = () => {
  const router = useRouter();
  const { levelComplete, currentLevel, levelUp, resetLevel } = useGameStore();

  const lootScale  = useSharedValue(1);
  const modalScale = useSharedValue(0);

  useEffect(() => {
    if (levelComplete) {
      modalScale.value = withSpring(1, { damping: 12, stiffness: 90 });
      lootScale.value  = withRepeat(
        withSequence(
          withTiming(1.25, { duration: 600 }),
          withTiming(1,    { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      modalScale.value = 0;
    }
  }, [levelComplete]);

  const animatedLootStyle  = useAnimatedStyle(() => ({ transform: [{ scale: lootScale.value }] }));
  const animatedModalStyle = useAnimatedStyle(() => ({ transform: [{ scale: modalScale.value }] }));

  const isBossLevel = BOSS_LEVELS.includes(currentLevel);

  if (!levelComplete) return null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  /** Advance to next level and start playing immediately */
  const handleNextLevel = () => {
    levelUp();
    router.replace({
      pathname: '/Travel',
      params: { to: '/GameLevel', msg: 'Onward to the next challenge...' },
    } as any);
    setTimeout(() => resetLevel(), 120);
  };

  /** Return to home without advancing; stays on current level */
  const handleHome = () => {
    router.replace({
      pathname: '/Travel',
      params: { to: '/', msg: 'Returning to the Citadel...' },
    } as any);
    setTimeout(() => resetLevel(), 120);
  };

  /** Open level selector without advancing; stays on current level */
  const handleLevelMap = () => {
    router.replace({
      pathname: '/Travel',
      params: { to: '/LevelMap', msg: 'Back to the World Map...' },
    } as any);
    setTimeout(() => resetLevel(), 120);
  };

  return (
    <View style={styles.fullScreenOverlay}>
      <View style={styles.overlay}>

        {/* Explosive level-up particle effect behind the modal */}
        <LevelUpEffect isTriggered={true} />

        <Animated.View style={[styles.modalBox, animatedModalStyle]}>
          <Text style={styles.victoryTitle}>VICTORY!</Text>
          <Text style={styles.subtitle}>Level {currentLevel} Conquered</Text>

          {/* Loot drop — boss levels only */}
          {isBossLevel ? (
            <>
              <View style={styles.lootContainer}>
                <View style={styles.glowCircle} />
                <Animated.View style={[styles.lootItem, animatedLootStyle]}>
                  <FontAwesome5 name="hat-wizard" size={60} color="#3B82F6" />
                </Animated.View>
              </View>
              <Text style={styles.lootText}>Loot Discovered:</Text>
              <Text style={styles.lootName}>Apprentice Hat</Text>
            </>
          ) : (
            <View style={{ height: 40 }} />
          )}

          {/* ── 3-button row: [Home] [Next Level] [Map] ── */}
          <View style={styles.buttonRow}>

            {/* Home icon button */}
            <TouchableOpacity style={styles.iconBtn} onPress={handleHome}>
              <FontAwesome5 name="home" size={22} color="#FFD700" />
            </TouchableOpacity>

            {/* Next Level — main wide button */}
            <TouchableOpacity style={styles.nextButton} onPress={handleNextLevel}>
              <FontAwesome5 name="play" size={18} color="#FFD700" style={{ marginRight: 10 }} />
              <Text style={styles.nextButtonText}>NEXT LEVEL</Text>
            </TouchableOpacity>

            {/* Level map icon button */}
            <TouchableOpacity style={[styles.iconBtn, { borderColor: '#8b5a2b', backgroundColor: '#5d3a1a' }]} onPress={handleLevelMap}>
              <FontAwesome5 name="map-marked-alt" size={20} color="#FFD700" />
            </TouchableOpacity>

          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '88%',
    backgroundColor: '#2b1b11',
    borderWidth: 4,
    borderColor: '#FFD700',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 0 25px rgba(255,215,0,0.6)' },
      default: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 25,
      },
    }),
    elevation: 20,
    zIndex: 100,
  },
  victoryTitle: {
    fontSize: 42,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFD700',
    ...Platform.select({
      web: { textShadow: '2px 2px 6px #B8860B' },
      default: {
        textShadowColor: '#B8860B',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 6,
      },
    }),
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#d4c5b9',
    marginBottom: 16,
    fontFamily: 'serif',
    fontWeight: 'bold',
  },
  lootContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 140,
    marginBottom: 16,
  },
  glowCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59,130,246,0.35)',
    transform: [{ scale: 1.5 }],
  },
  lootItem: {
    backgroundColor: '#1E1E1E',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#3B82F6',
    zIndex: 2,
  },
  lootText: {
    fontSize: 14,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lootName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 24,
  },

  // ── Button row ──
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  // Icon-only circle buttons (Home & Map)
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#3e2723',
    borderWidth: 3,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 3px 6px rgba(0,0,0,0.5)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 6 },
    }),
    elevation: 8,
  },
  // Main Next Level button
  nextButton: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: '#b71c1c',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 8px rgba(0,0,0,0.5)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8 },
    }),
    elevation: 8,
  },
  nextButtonText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '900',
  },
});

export default RewardModal;
