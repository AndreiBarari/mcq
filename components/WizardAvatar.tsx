import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

/**
 * WizardAvatar — layered, tinted idle animation.
 *
 * Two PNG layers are stacked:
 *   • wizard_base.png  — body, staff, skin (never tinted)
 *   • wizard_tint.png  — robe and hat (dynamically colored via tintColor)
 *
 * Both layers share the same Reanimated scale transform so
 * they breathe perfectly in sync.
 */

interface WizardAvatarProps {
  /** Mage progression tier (1–6). Controls robe/hat color. */
  mageTier?: number;
  /** Overall size of the avatar (width & height). Default 200. */
  size?: number;
}

// Tier → robe/hat color
const TIER_COLORS: Record<number, string> = {
  1: '#94A3B8', // Gray   — Aspiring Mage
  2: '#8B6914', // Brown  — Apprentice
  3: '#22C55E', // Green  — Mage
  4: '#3B82F6', // Blue   — Great Mage
  5: '#EF4444', // Red    — Archmage
};

const ASSETS = {
  // Using pre-rendered sprites instead of base/tint
};

const WizardAvatar: React.FC<WizardAvatarProps> = ({
  mageTier = 1,
  size = 200,
}) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    // Gentle breathing loop: 1 → 1.02 → 1, repeating forever
    scale.value = withRepeat(
      withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1, // infinite
      true, // auto-reverse for perfect smoothness
    );
  }, []);

  const breathingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // We map the string color from TIER_COLORS to the filename
  let avatarSource;
  switch(mageTier) {
    case 1: avatarSource = require('../assets/game/wizard_idle_gray.png'); break;
    case 2: avatarSource = require('../assets/game/wizard_idle_brown.png'); break;
    case 3: avatarSource = require('../assets/game/wizard_idle_green.png'); break;
    case 4: avatarSource = require('../assets/game/wizard_idle_blue.png'); break;
    case 5: avatarSource = require('../assets/game/wizard_idle_red.png'); break;
    default: avatarSource = require('../assets/game/wizard_idle_gray.png'); break;
  }

  return (
    <Animated.View style={[styles.root, { width: size, height: size }, breathingStyle]}>
      <Image
        source={avatarSource}
        style={[styles.layer, { width: size, height: size }]}
        contentFit="contain"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default WizardAvatar;
