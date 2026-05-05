import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter, Redirect } from 'expo-router';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import useGameStore from '../store/useGameStore';
import RewardModal from '../components/RewardModal';

import GridMap from '../components/GridMap';
import TutorialPointer from '../components/TutorialPointer';

// Tap-to-add block component
const CommandBlock = ({ title, icon, onTap, disabled, showPointer }: any) => {
  return (
    <View style={{ position: 'relative' }}>
      <TouchableOpacity 
        style={[styles.toolboxBlock, disabled && { opacity: 0.4 }]} 
        onPress={() => onTap(title)}
        disabled={disabled}
        activeOpacity={0.6}
      >
        <FontAwesome5 name={icon} size={16} color="#FFF" style={styles.blockIcon} />
        <Text style={styles.blockText}>{title}</Text>
      </TouchableOpacity>
      <TutorialPointer visible={showPointer} style={{ bottom: -35, left: '20%', transform: [{ scale: 0.8 }] }} />
    </View>
  );
};

// ── Draggable chip — small pill, drag horizontally to swap position ────────
const CHIP_SWAP_THRESHOLD = 44; // px of drag before swapping with neighbour

function DraggableChip({ label, index, total, onRemove, onReorder, disabled }) {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const isDragging = useSharedValue(false);

  const trySwap = (from: number, dx: number) => {
    if (dx < -CHIP_SWAP_THRESHOLD && from > 0) {
      onReorder(from, from - 1);
    } else if (dx > CHIP_SWAP_THRESHOLD && from < total - 1) {
      onReorder(from, from + 1);
    }
  };

  const pan = Gesture.Pan()
    .enabled(!disabled)
    // Only activate on horizontal movement so vertical scroll still works
    .activeOffsetX([-8, 8])
    .failOffsetY([-6, 6])
    .onStart(() => {
      isDragging.value = true;
      scale.value = withSpring(1.15);
    })
    .onUpdate((e) => { translateX.value = e.translationX; })
    .onEnd((e) => {
      runOnJS(trySwap)(index, e.translationX);
      translateX.value = withSpring(0);
      scale.value = withSpring(1);
      isDragging.value = false;
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
    zIndex: isDragging.value ? 99 : 1,
    opacity: isDragging.value ? 0.88 : 1,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.sequenceStep, animStyle]}>
        <Text style={styles.sequenceStepText}>{index + 1}. {label}</Text>
        <TouchableOpacity onPress={() => !disabled && onRemove(index)} hitSlop={6}>
          <FontAwesome5 name="times" size={10} color="#FF9090" style={{ marginLeft: 5 }} />
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────
export default function GameLevelScreen() {
  const {
    currentLevel,
    userSequence,
    isExecuting,
    addUserSequenceStep,
    removeUserSequenceStep,
    reorderSequenceStep,
    clearUserSequence,
    executeSequence,
    resetPosition,
    playSound,
    tutorialStep,
    setTutorialStep,
    stopBgMusic,
  } = useGameStore();

  const isSessionActive = useGameStore((state: any) => state.isSessionActive);
  const router = useRouter();
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);

  React.useEffect(() => {
    stopBgMusic();
  }, []);

  if (!isSessionActive) {
    return <Redirect href="/" />;
  }

  const handleGoHome = () => {
    if (!isExecuting) setShowHomeConfirm(true);
  };

  const handleAddCommand = (blockAction) => {
    if (!isExecuting) {
      addUserSequenceStep(blockAction);
      playSound(blockAction);
      
      // Level 1 Tutorial progression
      if (currentLevel === 1 && tutorialStep === 1 && blockAction === 'Down') {
        setTutorialStep(2);
      }
    }
  };

  const clearSequence = () => {
    if (!isExecuting) clearUserSequence();
  };

  const handleRunSpell = () => {
    if (userSequence.length > 0 && !isExecuting) {
      if (currentLevel === 1 && tutorialStep === 2) {
        setTutorialStep(3); // Hide the tutorial pointer permanently for this level run
      }
      executeSequence();
    }
  };

  return (
    // GestureHandlerRootView is required for Reanimated Gesture logic to capture touches securely
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
      {/* TOP HALF: Game Stage */}
      <View style={styles.topHalf}>
        {/* Mini top bar: home | level label | reset */}
        <View style={styles.levelTopBar}>
          <TouchableOpacity style={styles.topBarBtn} onPress={handleGoHome} disabled={isExecuting}>
            <FontAwesome5 name="home" size={16} color="#FFD700" />
          </TouchableOpacity>
          <Text style={styles.levelLabel}>Level {currentLevel}</Text>
          <TouchableOpacity 
            style={styles.topBarBtn} 
            onPress={() => router.replace({ pathname: '/Travel', params: { to: '/LevelMap', msg: 'Back to the World Map...' } } as any)} 
            disabled={isExecuting}
          >
            <FontAwesome5 name="map-marked-alt" size={16} color="#FFD700" />
          </TouchableOpacity>
        </View>
        <GridMap />
      </View>

      {/* BOTTOM HALF: Coding Workspace */}
      <View style={styles.bottomHalf}>
        
        {/* Toolbox / Library of permitted actions — tap to add */}
        <View style={styles.toolbox}>
          <CommandBlock 
            title="Up" icon="arrow-up" onTap={handleAddCommand} disabled={isExecuting} 
          />
          <CommandBlock 
            title="Down" icon="arrow-down" onTap={handleAddCommand} disabled={isExecuting} 
            showPointer={currentLevel === 1 && tutorialStep === 1}
          />
          <CommandBlock title="Left" icon="arrow-left" onTap={handleAddCommand} disabled={isExecuting} />
          <CommandBlock title="Right" icon="arrow-right" onTap={handleAddCommand} disabled={isExecuting} />
        </View>

        {/* Spell Sequencer — drag chips left/right to reorder, tap ✕ to remove */}
        <View style={styles.sequenceZone}>
          <Text style={styles.zoneTitle}>Spell Sequencer</Text>
          <ScrollView
            style={styles.sequenceScroll}
            scrollEnabled={!isExecuting}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            <View style={styles.sequenceList}>
              {userSequence.length === 0 ? (
                <Text style={styles.emptyText}>Drag commands here to build a spell...</Text>
              ) : (
                userSequence.map((step: any, index: number) => (
                  <DraggableChip
                    key={`${step}-${index}`}
                    label={step}
                    index={index}
                    total={userSequence.length}
                    disabled={isExecuting}
                    onRemove={removeUserSequenceStep}
                    onReorder={reorderSequenceStep}
                  />
                ))
              )}
            </View>
          </ScrollView>
        </View>

        {/* Action row: [Clear] ── [Run Spell] ── [Map] */}
        <View style={styles.actionRow}>

          {/* Clear all */}
          <TouchableOpacity
            style={[styles.sideActionBtn, { opacity: userSequence.length === 0 || isExecuting ? 0.35 : 1 }]}
            onPress={clearSequence}
            disabled={userSequence.length === 0 || isExecuting}
          >
            <FontAwesome5 name="trash-alt" size={20} color="#FF6060" />
          </TouchableOpacity>

          {/* Run Spell */}
          <View style={{ position: 'relative', flex: 1 }}>
            <TouchableOpacity style={styles.runButton} onPress={handleRunSpell} disabled={isExecuting}>
              <FontAwesome5 name={isExecuting ? 'hourglass-half' : 'play'} size={20} color="#FFD700" style={{ marginRight: 10 }} />
              <Text style={styles.runButtonText}>{isExecuting ? 'CASTING...' : 'CAST'}</Text>
            </TouchableOpacity>
            <TutorialPointer 
              visible={currentLevel === 1 && tutorialStep === 2} 
              style={{ top: '50%', left: '50%', marginTop: -15, marginLeft: -5, transform: [{ scale: 0.9 }] }} 
            />
          </View>

          {/* Reset Hero */}
          <TouchableOpacity
            style={[styles.sideActionBtn, { borderColor: '#8d6e63' }]}
            onPress={resetPosition}
            disabled={isExecuting}
          >
            <FontAwesome5 name="undo" size={20} color="#FFF" />
          </TouchableOpacity>

        </View>

      </View>
      
      {/* Reward modal */}
      <RewardModal />

      {/* ── Custom Home Confirmation Modal ──────────────────────────────── */}
      {showHomeConfirm && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <FontAwesome5 name="home" size={32} color="#FFD700" />
            <Text style={styles.confirmTitle}>Return to Castle?</Text>
            <Text style={styles.confirmMsg}>Your current spell code will be lost.</Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.stayBtn} onPress={() => setShowHomeConfirm(false)}>
                <Text style={styles.stayBtnText}>STAY</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.leaveBtn} onPress={() => { setShowHomeConfirm(false); router.replace('/'); }}>
                <FontAwesome5 name="door-open" size={16} color="#FFD700" style={{ marginRight: 8 }} />
                <Text style={styles.leaveBtnText}>LEAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#000',
  },
  // --- Game Stage ---
  topHalf: {
    backgroundColor: '#7cb342',
    borderBottomWidth: 4,
    borderColor: '#3e2723',
  },
  // Mini top bar inside the game stage
  levelTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(30,20,10,0.75)',
  },
  topBarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3e2723',
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelLabel: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'serif',
  },

  // --- Workspace ---
  bottomHalf: {
    flex: 1,
    backgroundColor: '#2b1b11', // Wood table look
    padding: 10,
    zIndex: 1, // So draggable blocks flow naturally inside workspace boundary
  },
  toolbox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: '#3e2723',
    borderRadius: 12,
    marginBottom: 15,
    zIndex: 10, // keep high so it stays above sequencer
  },
  toolboxBlock: {
    flexDirection: 'row',
    backgroundColor: '#5d4037',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#a1887f',
    alignItems: 'center',
  },
  blockIcon: {
    marginRight: 8,
  },
  blockText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sequenceZone: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#8d6e63',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    marginBottom: 15,
    zIndex: 1,
  },
  zoneTitle: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'serif',
    marginBottom: 10,
    textAlign: 'center',
  },
  sequenceScroll: {
    flex: 1,
  },
  sequenceList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    paddingBottom: 4,
  },
  emptyText: {
    color: '#888',
    fontStyle: 'italic',
    width: '100%',
    textAlign: 'center',
    marginTop: 20,
  },
  sequenceStep: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  sequenceStepText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  clearBtn: {
    alignSelf: 'center',
    marginTop: 10,
  },
  clearBtnText: {
    color: '#FF5252',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    gap: 16,
  },
  // Shared style for both side icon buttons (Clear & Map)
  sideActionBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#3e2723',
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 3px 5px rgba(0,0,0,0.5)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 5 },
    }),
    elevation: 6,
  },

  // ── Custom confirm modal ──
  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  confirmBox: {
    width: '82%',
    backgroundColor: '#2b1b11',
    borderWidth: 4,
    borderColor: '#FFD700',
    borderRadius: 20,
    padding: 26,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 0 20px rgba(255,215,0,0.35)' },
      default: { shadowColor: '#FFD700', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 20 },
    }),
    elevation: 20,
  },
  confirmTitle: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'serif',
    marginTop: 12,
    marginBottom: 6,
  },
  confirmMsg: {
    color: '#d4c5b9',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 22,
  },
  confirmBtns: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  stayBtn: {
    flex: 1,
    backgroundColor: '#4e342e',
    borderWidth: 2,
    borderColor: '#8d6e63',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },
  stayBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  leaveBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#b71c1c',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 30,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveBtnText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 15,
  },
  runButton: {
    flexDirection: 'row',
    backgroundColor: '#b71c1c',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 5px rgba(0, 0, 0, 0.5)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
      }
    }),
    elevation: 8,
  },
  runButtonText: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: '900',
  },
});
