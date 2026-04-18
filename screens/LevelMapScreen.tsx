import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useRouter, Redirect } from 'expo-router';
import useGameStore from '../store/useGameStore';

const { width } = Dimensions.get('window');

const LEVELS_COUNT = 9;
const BOSS_LEVELS  = [3, 6, 9];
const ZIGZAG_MARGINS = [0, 60, 100, 60, 0, -60, -100, -60, 0];

const PulsingNode = ({ children, isBoss }: any) => {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(isBoss ? 1.15 : 1.1, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
};

const LevelMapScreen = () => {
  const router          = useRouter();
  const currentLevel    = useGameStore(state => state.currentLevel);
  const highestLevel    = useGameStore((state: any) => state.highestLevel);
  const isSessionActive = useGameStore((state: any) => state.isSessionActive);
  const setCurrentLevel = useGameStore((state: any) => state.setCurrentLevel);

  if (!isSessionActive) return <Redirect href="/" />;

  const levels = Array.from({ length: LEVELS_COUNT }, (_, i) => {
    const levelId = i + 1;
    const isBoss  = BOSS_LEVELS.includes(levelId);
    let status = 'locked';
    // highestLevel tracks the furthest progress; replaying lower levels never re-locks above
    if (levelId < highestLevel)  status = 'completed';
    else if (levelId === highestLevel) status = 'current';
    return { id: levelId, isBoss, status, margin: ZIGZAG_MARGINS[i] };
  });

  // Navigate to the chosen level; completed levels can be replayed
  const handleLevelPress = (levelId: number) => {
    setCurrentLevel(levelId);
    router.push({
      pathname: '/Travel',
      params: { to: '/GameLevel', msg: 'Staging the battlefield...' },
    } as any);
  };

  const handleHome = () => {
    router.replace({
      pathname: '/Travel',
      params: { to: '/', msg: 'Returning to the Citadel...' },
    } as any);
  };

  return (
    <View style={styles.container}>

      {/* ── Header ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.homeBtn} onPress={handleHome}>
          <FontAwesome5 name="home" size={18} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coding Magic Realm</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* ── Map scroll ─────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.mapScroll}
        showsVerticalScrollIndicator={false}
      >
        {levels.map((level, index) => {
          const isLast = index === levels.length - 1;

          // Visual state
          let nodeColor = '#4a3318';
          let iconColor = '#777';
          let iconName  = 'lock';
          let nodeSize  = level.isBoss ? 80 : 60;
          let iconSize  = level.isBoss ? 36 : 24;

          if (level.status === 'completed') {
            nodeColor = '#4CAF50';
            iconColor = '#FFF';
            iconName  = level.isBoss ? 'crown' : 'check';
            if (level.isBoss) nodeSize = 90;
          } else if (level.status === 'current') {
            nodeColor = '#FFC107';
            iconColor = '#8B4513';
            iconName  = level.isBoss ? 'dragon' : 'play';
            if (level.isBoss) { nodeSize = 100; iconSize = 46; }
          } else {
            // locked
            if (level.isBoss) { iconName = 'skull'; iconSize = 36; }
          }

          const isPlayable = level.status !== 'locked';

          const NodeButton = (
            <TouchableOpacity
              activeOpacity={isPlayable ? 0.75 : 1}
              disabled={!isPlayable}
              onPress={isPlayable ? () => handleLevelPress(level.id) : undefined}
              style={[
                styles.node,
                {
                  width: nodeSize,
                  height: nodeSize,
                  borderRadius: nodeSize / 2,
                  backgroundColor: nodeColor,
                  borderWidth: level.isBoss ? 4 : 2,
                  borderColor: level.status === 'current' ? '#FFF' : '#2b1b11',
                  opacity: isPlayable ? 1 : 0.5,
                },
              ]}
            >
              <FontAwesome5 name={iconName} size={iconSize} color={iconColor} />
              {/* Replay badge on completed levels */}
              {level.status === 'completed' && (
                <View style={styles.replayBadge}>
                  <FontAwesome5 name="redo-alt" size={8} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          );

          return (
            <View key={level.id} style={[styles.nodeContainer, { marginLeft: level.margin }]}>
              {level.status === 'current'
                ? <PulsingNode isBoss={level.isBoss}>{NodeButton}</PulsingNode>
                : NodeButton
              }

              {!isLast && (
                <View style={styles.pathContainer}>
                  <View style={styles.pathDot} />
                  <View style={styles.pathDot} />
                  <View style={styles.pathDot} />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ebd5b3',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#8b5a2b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 4,
    borderColor: '#4a3318',
  },
  // Home button — matches the GameLevelScreen homeButton style
  homeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3e2723',
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(0,0,0,0.5)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
      },
    }),
    elevation: 6,
  },
  headerTitle: {
    fontSize: 22,
    color: '#FFD700',
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  mapScroll: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  nodeContainer: {
    alignItems: 'center',
    width: width,
  },
  node: {
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 6px 6px rgba(0,0,0,0.4)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
    }),
    elevation: 8,
  },
  // Small replay indicator badge on completed nodes
  replayBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  pathContainer: {
    height: 80,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: 20,
  },
  pathDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8b5a2b',
    opacity: 0.6,
  },
});

export default LevelMapScreen;
