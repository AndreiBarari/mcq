import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';

interface TutorialPointerProps {
  visible: boolean;
  style?: any;
}

const TutorialPointer: React.FC<TutorialPointerProps> = ({ visible, style: customStyle }) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // Tap animation: Rotate and Scale down slightly
      rotation.value = withRepeat(
        withSequence(
          withTiming(-15, { duration: 400, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 400, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );

      scale.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1,
        true
      );
    } else {
      rotation.value = 0;
      scale.value = 1;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value }
    ],
    opacity: visible ? 1 : 0,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle, customStyle]}>
      <Image 
        source={require('../assets/game/magical_glove.png')} 
        style={styles.glove} 
        contentFit="contain" 
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 60,
    height: 60,
    zIndex: 9999,
    pointerEvents: 'none',
  },
  glove: {
    width: '100%',
    height: '100%',
  },
});

export default TutorialPointer;
