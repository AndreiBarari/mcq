import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import useGameStore from '../store/useGameStore';

interface GridAssetProps {
  type: 'player' | 'mountain' | 'crystal' | 'key' | 'door' | 'tree' | 'bush' | 'forest';
  size: number;
  isOpen?: boolean; // For door
}

const ASSETS = {
  player: require('../assets/game/wizard_hat_gray.png'),
  mountain: require('../assets/game/mountain.png'),
  tree: require('../assets/game/tree.png'),
  bush: require('../assets/game/bush.png'),
  forest: require('../assets/game/forest.png'),
  crystal: require('../assets/game/magic_crystal.png'),
  key: require('../assets/game/magic_key.png'),
  doorClosed: require('../assets/game/door_closed.png'),
  doorOpen: require('../assets/game/door_open.png'),
};

const GridAsset: React.FC<GridAssetProps> = ({ type, size, isOpen }) => {
  const translateY = useSharedValue(0);
  const activeMageTier = useGameStore((state: any) => state.activeMageTier);
  const highestLevel = useGameStore((state: any) => state.highestLevel);
  const lessonsCompleted = Math.min(15, Math.max(0, highestLevel - 1));
  const derivedTier = Math.min(5, Math.max(1, Math.ceil((lessonsCompleted / 15) * 5) || 1));
  const mageTier = activeMageTier !== null ? activeMageTier : derivedTier;

  useEffect(() => {
    if (type === 'crystal' || type === 'key') {
      translateY.value = withRepeat(
        withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
    }
  }, [type]);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const renderIcon = () => {
    const commonStyle = { width: size * 0.8, height: size * 0.8 };
    const forestStyle = { width: size * 1.056, height: size * 1.056 };
    const doorStyle = { width: size, height: size };
    
    switch (type) {
      case 'player': {
        let hatSource;
        switch(mageTier) {
          case 2: hatSource = require('../assets/game/wizard_hat_brown.png'); break;
          case 4: hatSource = require('../assets/game/wizard_hat_blue.png'); break;
          case 1: 
          case 3: // Green (Soon)
          case 5: // Red (Soon)
          default: hatSource = require('../assets/game/wizard_hat_gray.png'); break;
        }
        return <Image source={hatSource} style={commonStyle} contentFit="contain" />;
      }
      case 'mountain':
        return <Image source={ASSETS.mountain} style={forestStyle} contentFit="contain" />;
      case 'tree':
        return <Image source={ASSETS.tree} style={forestStyle} contentFit="contain" />;
      case 'bush':
        return <Image source={ASSETS.bush} style={forestStyle} contentFit="contain" />;
      case 'forest':
        return <Image source={ASSETS.forest} style={forestStyle} contentFit="contain" />;
      case 'crystal':
        return (
          <Animated.View style={floatingStyle}>
            <Image source={ASSETS.crystal} style={commonStyle} contentFit="contain" />
          </Animated.View>
        );
      case 'key':
        return (
          <Animated.View style={floatingStyle}>
            <Image source={ASSETS.key} style={commonStyle} contentFit="contain" />
          </Animated.View>
        );
      case 'door':
        return (
          <Image 
            source={isOpen ? ASSETS.doorOpen : ASSETS.doorClosed} 
            style={doorStyle} 
            contentFit="cover" 
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GridAsset;
