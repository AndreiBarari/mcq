import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

let bgSound: Audio.Sound | null = null;

const playSound = async (
  type: "success" | "victory" | "error" | "Up" | "Down" | "Left" | "Right",
) => {
  try {
    const source =
      type === "success"
        ? require("../assets/sounds/success.mp3")
        : type === "victory"
          ? require("../assets/sounds/victory.mp3")
          : type === "error"
            ? require("../assets/sounds/error.mp3")
            : type === "Up"
              ? require("../assets/sounds/up.mp3")
              : type === "Down"
                ? require("../assets/sounds/down.mp3")
                : type === "Left"
                  ? require("../assets/sounds/left.mp3")
                  : require("../assets/sounds/right.mp3");
    // Ensure audio mode allows maximum volume and plays over silent mode
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    const { sound } = await Audio.Sound.createAsync(source, {
      shouldPlay: true,
      volume: 1.0,
    });

    await sound.setVolumeAsync(1.0);
    await sound.playAsync();

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.log("Sound error:", error);
  }
};

// --- Level Configurations (1-15) ---
const BOSS_LEVELS = [5, 10, 15];
const LEVEL_CONFIGS: any = {
  1: {
    rows: 5,
    cols: 5,
    start: { x: 0, y: 0 },
    target: { x: 0, y: 2 },
    obstacles: [],
  },
  2: {
    rows: 5,
    cols: 5,
    start: { x: 0, y: 0 },
    target: { x: 2, y: 2 },
    obstacles: [],
  },
  // Levels 3-5: 1 obstacle
  3: {
    rows: 5,
    cols: 5,
    start: { x: 0, y: 0 },
    target: { x: 4, y: 0 },
    obstacles: [{ x: 2, y: 0, type: "tree" }],
  },
  4: {
    rows: 5,
    cols: 5,
    start: { x: 0, y: 0 },
    target: { x: 4, y: 4 },
    obstacles: [{ x: 2, y: 2, type: "bush" }],
  },
  5: {
    rows: 5,
    cols: 5,
    start: { x: 4, y: 0 },
    target: { x: 0, y: 4 },
    obstacles: [{ x: 2, y: 2, type: "forest" }],
  },
  // Levels 6-7: Linked obstacles (max 4), crystal behind
  6: {
    rows: 5,
    cols: 5,
    start: { x: 0, y: 0 },
    target: { x: 0, y: 4 },
    obstacles: [
      { x: 0, y: 3, type: "mountain" },
      { x: 1, y: 3, type: "mountain" },
      { x: 2, y: 3, type: "mountain" },
      { x: 3, y: 3, type: "mountain" },
    ],
  },
  7: {
    rows: 5,
    cols: 5,
    start: { x: 0, y: 0 },
    target: { x: 4, y: 4 },
    obstacles: [
      { x: 3, y: 4, type: "forest" },
      { x: 3, y: 3, type: "forest" },
      { x: 2, y: 3, type: "forest" },
    ],
  },
  // Levels 8-10: Maze (2 paths, 1 blocked, 1 open)
  8: {
    rows: 5,
    cols: 5,
    start: { x: 2, y: 0 },
    target: { x: 2, y: 4 },
    obstacles: [
      { x: 2, y: 1, type: "mountain" },
      { x: 2, y: 2, type: "mountain" },
      { x: 2, y: 3, type: "mountain" },
      { x: 1, y: 3, type: "tree" },
      { x: 0, y: 3, type: "tree" }, // Left path blocked
    ],
  },
  9: {
    rows: 5,
    cols: 5,
    start: { x: 0, y: 4 },
    target: { x: 4, y: 0 },
    obstacles: [
      { x: 1, y: 3, type: "bush" },
      { x: 1, y: 2, type: "bush" },
      { x: 1, y: 1, type: "bush" },
      { x: 2, y: 1, type: "bush" },
      { x: 3, y: 1, type: "bush" },
    ],
  },
  10: {
    rows: 5,
    cols: 5,
    start: { x: 0, y: 0 },
    target: { x: 4, y: 4 },
    obstacles: [
      { x: 2, y: 1, type: "forest" },
      { x: 1, y: 2, type: "forest" },
      { x: 2, y: 2, type: "forest" },
      { x: 3, y: 2, type: "forest" },
      { x: 2, y: 3, type: "forest" },
    ],
  },
  // Levels 11-12: 4 blocks, door, key
  11: {
    rows: 5,
    cols: 5,
    start: { x: 0, y: 0 },
    target: { x: 4, y: 4 },
    obstacles: [
      { x: 3, y: 4, type: "mountain" },
      { x: 3, y: 3, type: "mountain" },
    ],
    key: { x: 0, y: 4 },
    door: { x: 4, y: 3 },
  },
  12: {
    rows: 5,
    cols: 5,
    start: { x: 2, y: 2 },
    target: { x: 0, y: 0 },
    obstacles: [
      { x: 1, y: 1, type: "tree" },
      { x: 0, y: 1, type: "tree" },
    ],
    key: { x: 4, y: 4 },
    door: { x: 1, y: 0 },
  },
  // Levels 13-15: Maze + Door + Key
  13: {
    rows: 5,
    cols: 5,
    start: { x: 0, y: 0 },
    target: { x: 4, y: 4 },
    obstacles: [
      { x: 1, y: 0, type: "bush" },
      { x: 1, y: 1, type: "bush" },
      { x: 1, y: 2, type: "bush" },
      { x: 3, y: 4, type: "bush" },
      { x: 3, y: 3, type: "bush" },
      { x: 3, y: 2, type: "bush" },
    ],
    key: { x: 0, y: 4 },
    door: { x: 4, y: 3 },
  },
  14: {
    rows: 5,
    cols: 5,
    start: { x: 4, y: 0 },
    target: { x: 0, y: 4 },
    obstacles: [
      { x: 3, y: 0, type: "forest" },
      { x: 3, y: 1, type: "forest" },
      { x: 3, y: 2, type: "forest" },
      { x: 1, y: 4, type: "forest" },
      { x: 1, y: 3, type: "forest" },
      { x: 1, y: 2, type: "forest" },
    ],
    key: { x: 0, y: 0 },
    door: { x: 0, y: 3 },
  },
  15: {
    rows: 5,
    cols: 5,
    start: { x: 2, y: 2 },
    target: { x: 2, y: 0 },
    obstacles: [
      { x: 1, y: 2, type: "mountain" },
      { x: 1, y: 1, type: "mountain" },
      { x: 1, y: 0, type: "mountain" },
      { x: 3, y: 2, type: "mountain" },
      { x: 3, y: 1, type: "mountain" },
      { x: 3, y: 0, type: "mountain" },
    ],
    key: { x: 4, y: 0 },
    door: { x: 2, y: 1 },
  },
};

const useGameStore = create((set, get: any) => ({
  isSessionActive: false,
  ageGroup: "5-9",
  characterClass: "Mage",
  activeMageTier: null, // Null means follow level progression

  // currentLevel  = the level currently being PLAYED (can be any unlocked level for replay)
  // highestLevel  = the furthest level the player has ever REACHED — never decreases.
  //                 Used by LevelMapScreen to show locked/unlocked status.
  currentLevel: 1,
  highestLevel: 1,

  experiencePoints: 0,
  hasPremiumAccess: false,

  // Gameplay State
  rows: 5,
  cols: 5,
  heroPosition: { x: 0, y: 0 },
  targetPosition: { x: 0, y: 2 },
  obstacles: [],
  keyPosition: null,
  doorPosition: null,
  hasKey: false,
  userSequence: [],
  levelComplete: false,
  isExecuting: false,
  tutorialStep: 1,
  collisionPos: null,
  boundaryHit: null,

  // ── Actions ───────────────────────────────────────────────────────────────
  startSession: () => set({ isSessionActive: true }),
  setAgeGroup: (ageGroup: any) => set({ ageGroup }),
  setCharacterClass: (characterClass: any) => set({ characterClass }),
  setActiveMageTier: async (tier: number) => {
    set({ activeMageTier: tier });
    try {
      await AsyncStorage.setItem("activeMageTier", tier.toString());
    } catch (e) {
      console.error("Failed to save mage tier", e);
    }
  },
  loadPersistedData: async () => {
    try {
      const tierStr = await AsyncStorage.getItem("activeMageTier");
      if (tierStr) set({ activeMageTier: parseInt(tierStr, 10) });
    } catch (e) {
      console.error("Failed to load persisted data", e);
    }
  },
  setExperiencePoints: (experiencePoints: any) => set({ experiencePoints }),
  setHasPremiumAccess: (hasPremiumAccess: any) => set({ hasPremiumAccess }),
  setTutorialStep: (step: number) => set({ tutorialStep: step }),
  playSound: (type: any) => playSound(type),

  startBgMusic: async () => {
    try {
      if (bgSound) {
        const status = await bgSound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) return;
        if (status.isLoaded) {
          await bgSound.playAsync();
          return;
        }
      }
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/sounds/home_bg.mp3"),
        { shouldPlay: true, isLooping: true, volume: 0.15 },
      );
      await sound.setVolumeAsync(0.15);
      bgSound = sound;
    } catch (error) {
      console.log("BG Music error:", error);
    }
  },

  stopBgMusic: async () => {
    try {
      if (bgSound) {
        await bgSound.stopAsync();
        await bgSound.unloadAsync();
        bgSound = null;
      }
    } catch (error) {
      console.log("Stop BG Music error:", error);
    }
  },

  /**
   * Load a level for play.
   * Does NOT touch highestLevel — so replaying an old level never resets progress.
   */
  setCurrentLevel: (level: number) => {
    const config = LEVEL_CONFIGS[level] || LEVEL_CONFIGS[1];
    set({
      currentLevel: level,
      rows: config.rows || 5,
      cols: config.cols || 5,
      heroPosition: { ...config.start },
      targetPosition: { ...config.target },
      obstacles: config.obstacles || [],
      keyPosition: config.key || null,
      doorPosition: config.door || null,
      hasKey: false,
      userSequence: [],
      levelComplete: false,
      isExecuting: false,
      tutorialStep: 1,
    });
    // highestLevel deliberately left unchanged
  },

  addExperience: (amount: number) =>
    set((state: any) => ({
      experiencePoints: state.experiencePoints + amount,
    })),

  /**
   * Called from the RewardModal "Next Level" button.
   * highestLevel is already updated by executeSequence when the star is reached.
   * Here we just advance currentLevel and load the next board.
   */
  levelUp: () => {
    const next = Math.min(15, get().currentLevel + 1);
    get().setCurrentLevel(next);
  },

  // Level Gameplay Actions
  addUserSequenceStep: (step: any) =>
    set((state: any) => ({ userSequence: [...state.userSequence, step] })),
  removeUserSequenceStep: (index: number) =>
    set((state: any) => ({
      userSequence: state.userSequence.filter(
        (_: any, i: number) => i !== index,
      ),
    })),
  reorderSequenceStep: (fromIndex: number, toIndex: number) =>
    set((state: any) => {
      const seq = [...state.userSequence];
      const [moved] = seq.splice(fromIndex, 1);
      seq.splice(toIndex, 0, moved);
      return { userSequence: seq };
    }),
  clearUserSequence: () => set({ userSequence: [] }),

  resetLevel: () => {
    get().setCurrentLevel(get().currentLevel);
  },

  resetPosition: () => {
    const config = LEVEL_CONFIGS[get().currentLevel] || LEVEL_CONFIGS[1];
    set({
      heroPosition: { ...config.start },
      hasKey: false,
      levelComplete: false,
      isExecuting: false,
      tutorialStep: 1,
      collisionPos: null,
      boundaryHit: null,
    });
  },

  // ── Sequence Execution Engine ──────────────────────────────────────────────
  executeSequence: async () => {
    const {
      userSequence,
      targetPosition,
      obstacles,
      keyPosition,
      doorPosition,
      rows,
      cols,
    } = get();
    set({ isExecuting: true });

    try {
      for (const step of userSequence) {
        await new Promise((resolve) => setTimeout(resolve, 500));

        let heroPos = get().heroPosition;
        let nextPos = { ...heroPos };
        let hitMargin: "top" | "bottom" | "left" | "right" | null = null;

        if (step === "Up") {
          if (heroPos.y > 0) nextPos.y--;
          else hitMargin = "top";
        } else if (step === "Down") {
          if (heroPos.y < rows - 1) nextPos.y++;
          else hitMargin = "bottom";
        } else if (step === "Left") {
          if (heroPos.x > 0) nextPos.x--;
          else hitMargin = "left";
        } else if (step === "Right") {
          if (heroPos.x < cols - 1) nextPos.x++;
          else hitMargin = "right";
        }

        if (hitMargin) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          playSound("error");
          set({ boundaryHit: hitMargin });
          await new Promise((resolve) => setTimeout(resolve, 1000));
          set({ boundaryHit: null });
          break; // Abort remaining sequence
        }

        // 1. Obstacle check
        const hitObstacle = obstacles.some(
          (obs: any) => obs.x === nextPos.x && obs.y === nextPos.y,
        );
        if (hitObstacle) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          playSound("error");
          set({ collisionPos: nextPos });
          await new Promise((resolve) => setTimeout(resolve, 1000));
          set({ collisionPos: null });
          break; // Abort remaining sequence
        }

        // 2. Door check
        if (
          doorPosition &&
          nextPos.x === doorPosition.x &&
          nextPos.y === doorPosition.y
        ) {
          if (!get().hasKey) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            playSound("error");
            set({ collisionPos: nextPos });
            await new Promise((resolve) => setTimeout(resolve, 1000));
            set({ collisionPos: null });
            break; // Abort remaining sequence
          }
        }

        // Move successful
        set({ heroPosition: nextPos });

        // 3. Key pick-up
        if (
          keyPosition &&
          nextPos.x === keyPosition.x &&
          nextPos.y === keyPosition.y &&
          !get().hasKey
        ) {
          set({ hasKey: true });
          playSound("success");
        }

        // 4. Win — update highestLevel HERE (when the star is physically reached)
        if (nextPos.x === targetPosition.x && nextPos.y === targetPosition.y) {
          playSound("victory");
          const { currentLevel, highestLevel } = get();
          // Advance highestLevel only if we're playing at the frontier
          const newHighest = Math.min(
            15,
            Math.max(highestLevel, currentLevel + 1),
          );
          set({ levelComplete: true, highestLevel: newHighest });
          break;
        }
      }
    } finally {
      // Reset execution state and clear the spell after all commands are done
      set({ isExecuting: false, userSequence: [] });
    }
  },
}));

export const RANK_TITLES: Record<number, string> = {
  1: "Aspiring Mage",
  2: "Apprentice",
  3: "Mage",
  4: "Great Mage",
  5: "Archmage"
};

export const RANK_COLORS: Record<number, string> = {
  1: '#94A3B8', // Gray
  2: '#8B6914', // Brown
  3: '#22C55E', // Green
  4: '#3B82F6', // Blue
  5: '#EF4444', // Red
};

export default useGameStore;
