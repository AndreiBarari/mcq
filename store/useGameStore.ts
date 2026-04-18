import { create } from 'zustand';

// --- Level Configurations (1-9) ---
const LEVEL_CONFIGS: any = {
  1: { start: { x: 0, y: 0 }, target: { x: 0, y: 2 }, obstacles: [] },
  2: { start: { x: 0, y: 0 }, target: { x: 2, y: 2 }, obstacles: [] },
  3: { start: { x: 0, y: 0 }, target: { x: 0, y: 4 }, obstacles: [{ x: 0, y: 2 }, { x: 1, y: 2 }] },
  4: { start: { x: 0, y: 0 }, target: { x: 4, y: 4 }, obstacles: [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }] },
  5: { start: { x: 4, y: 0 }, target: { x: 0, y: 4 }, obstacles: [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }] },
  6: { 
    start: { x: 0, y: 0 }, 
    target: { x: 0, y: 4 }, 
    obstacles: [{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }],
    key: { x: 4, y: 0 },
    door: { x: 0, y: 2 }
  },
  7: { 
    start: { x: 0, y: 0 }, 
    target: { x: 4, y: 4 }, 
    obstacles: [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 3 }, { x: 2, y: 4 }],
    key: { x: 0, y: 4 },
    door: { x: 2, y: 2 }
  },
  8: {
    start: { x: 0, y: 0 },
    target: { x: 2, y: 4 },
    obstacles: [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }],
    key: { x: 3, y: 0 },
    door: { x: 2, y: 2 }
  },
  9: {
    start: { x: 0, y: 0 },
    target: { x: 4, y: 4 },
    obstacles: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 4, y: 1 }, { x: 2, y: 3 }, { x: 4, y: 3 }, { x: 1, y: 4 }, { x: 2, y: 4 }],
    key: { x: 0, y: 2 },
    door: { x: 2, y: 2 }
  },
};

const useGameStore = create((set, get: any) => ({
  isSessionActive: false,
  ageGroup: '5-9',
  characterClass: 'Mage',

  // currentLevel  = the level currently being PLAYED (can be any unlocked level for replay)
  // highestLevel  = the furthest level the player has ever REACHED — never decreases.
  //                 Used by LevelMapScreen to show locked/unlocked status.
  currentLevel:  1,
  highestLevel:  1,

  experiencePoints: 0,
  hasPremiumAccess: false,
  
  // Gameplay State
  heroPosition:  { x: 0, y: 0 },
  targetPosition: { x: 0, y: 2 },
  obstacles: [],
  keyPosition:  null,
  doorPosition: null,
  hasKey:       false,
  userSequence:    [],
  levelComplete:   false,
  isExecuting:     false,
  
  // ── Actions ───────────────────────────────────────────────────────────────
  startSession:       () => set({ isSessionActive: true }),
  setAgeGroup:        (ageGroup: any)       => set({ ageGroup }),
  setCharacterClass:  (characterClass: any) => set({ characterClass }),
  setExperiencePoints:(experiencePoints: any) => set({ experiencePoints }),
  setHasPremiumAccess:(hasPremiumAccess: any) => set({ hasPremiumAccess }),

  /**
   * Load a level for play.
   * Does NOT touch highestLevel — so replaying an old level never resets progress.
   */
  setCurrentLevel: (level: number) => {
    const config = LEVEL_CONFIGS[level] || LEVEL_CONFIGS[1];
    set({
      currentLevel:  level,
      heroPosition:  { ...config.start },
      targetPosition:{ ...config.target },
      obstacles:     config.obstacles || [],
      keyPosition:   config.key  || null,
      doorPosition:  config.door || null,
      hasKey:        false,
      userSequence:  [],
      levelComplete: false,
      isExecuting:   false,
    });
    // highestLevel deliberately left unchanged
  },

  addExperience: (amount: number) => set((state: any) => ({
    experiencePoints: state.experiencePoints + amount,
  })),

  /**
   * Called from the RewardModal "Next Level" button.
   * highestLevel is already updated by executeSequence when the star is reached.
   * Here we just advance currentLevel and load the next board.
   */
  levelUp: () => {
    const next = Math.min(9, get().currentLevel + 1);
    get().setCurrentLevel(next);
  },

  // Level Gameplay Actions
  addUserSequenceStep: (step: any) =>
    set((state: any) => ({ userSequence: [...state.userSequence, step] })),
  removeUserSequenceStep: (index: number) =>
    set((state: any) => ({ userSequence: state.userSequence.filter((_: any, i: number) => i !== index) })),
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
      heroPosition:  { ...config.start },
      hasKey:        false,
      levelComplete: false,
      isExecuting:   false,
    });
  },

  // ── Sequence Execution Engine ──────────────────────────────────────────────
  executeSequence: async () => {
    const { userSequence, targetPosition, obstacles, keyPosition, doorPosition } = get();
    set({ isExecuting: true });

    for (const step of userSequence) {
      await new Promise(resolve => setTimeout(resolve, 500));

      let nextPos = { ...get().heroPosition };
      if (step === 'Up')    nextPos.y = Math.max(0, nextPos.y - 1);
      if (step === 'Down')  nextPos.y = Math.min(4, nextPos.y + 1);
      if (step === 'Left')  nextPos.x = Math.max(0, nextPos.x - 1);
      if (step === 'Right') nextPos.x = Math.min(4, nextPos.x + 1);

      // 1. Obstacle check
      const hitObstacle = obstacles.some((obs: any) => obs.x === nextPos.x && obs.y === nextPos.y);
      if (hitObstacle) continue;

      // 2. Door check
      if (doorPosition && nextPos.x === doorPosition.x && nextPos.y === doorPosition.y) {
        if (!get().hasKey) continue;
      }

      // Move successful
      set({ heroPosition: nextPos });

      // 3. Key pick-up
      if (keyPosition && nextPos.x === keyPosition.x && nextPos.y === keyPosition.y) {
        set({ hasKey: true });
      }

      // 4. Win — update highestLevel HERE (when the star is physically reached)
      if (nextPos.x === targetPosition.x && nextPos.y === targetPosition.y) {
        const { currentLevel, highestLevel } = get();
        // Advance highestLevel only if we're playing at the frontier
        const newHighest = Math.min(10, Math.max(highestLevel, currentLevel + 1));
        set({ levelComplete: true, highestLevel: newHighest });
        break;
      }
    }

    set({ isExecuting: false });
  },
}));

export default useGameStore;
