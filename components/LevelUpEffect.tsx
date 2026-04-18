import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing, 
  useDerivedValue,
  interpolate,
  Extrapolation,
  runOnJS
} from 'react-native-reanimated';
import { Canvas, Rect, Circle, Group, LinearGradient, vec, BlurMask } from '@shopify/react-native-skia';

const { width, height } = Dimensions.get('window');
const CENTER_X = width / 2;
const CENTER_Y = height / 2;

/**
 * A perfectly independent particle system element managed via Reanimated derived state.
 * Runs 100% on the UI thread without crossing the JS bridge after mount.
 */
const Particle = ({ progress, angle, maxDist, size, color }) => {
  const cx = useDerivedValue(() => {
    const dist = interpolate(progress.value, [0, 1], [0, maxDist], Extrapolation.CLAMP);
    return CENTER_X + Math.cos(angle) * dist;
  });

  const cy = useDerivedValue(() => {
    const dist = interpolate(progress.value, [0, 1], [0, maxDist], Extrapolation.CLAMP);
    // Gravity effect pulls it down over time
    const gravity = interpolate(progress.value, [0.4, 1], [0, 250], Extrapolation.CLAMP);
    return CENTER_Y + Math.sin(angle) * dist + gravity;
  });

  const opacity = useDerivedValue(() => {
    return interpolate(progress.value, [0.6, 1], [1, 0], Extrapolation.CLAMP);
  });

  return (
    <Circle cx={cx} cy={cy} r={size} color={color} opacity={opacity}>
      <BlurMask blur={3} style="normal" />
    </Circle>
  );
};

export default function LevelUpEffect({ isTriggered, onComplete }) {
  const progress = useSharedValue(0);

  // Pre-generate static layout for particles so they only calculate transforms natively
  const [particles] = useState(() => 
    Array.from({ length: 45 }).map(() => ({
      angle: Math.random() * Math.PI * 2,
      maxDist: 150 + Math.random() * Dimensions.get('window').width * 1.2,
      size: 2 + Math.random() * 8,
      color: Math.random() > 0.5 ? '#FFD700' : '#FFF3E0', // Radiant gold and bright white
    }))
  );

  useEffect(() => {
    if (isTriggered) {
      progress.value = 0;
      progress.value = withTiming(1, { 
        duration: 3000, 
        easing: Easing.out(Easing.cubic) 
      }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      });
    }
  }, [isTriggered]);

  // === UI Thread Derivations for the Golden Light Pillar ===
  const columnOpacity = useDerivedValue(() => {
    if (progress.value < 0.15) {
      return interpolate(progress.value, [0, 0.15], [0, 1], Extrapolation.CLAMP);
    }
    return interpolate(progress.value, [0.7, 1], [1, 0], Extrapolation.CLAMP);
  });

  const columnHeight = useDerivedValue(() => {
    // Shoots upward and downward simultaneously out of the center
    return interpolate(progress.value, [0, 0.4], [0, height * 2], Extrapolation.CLAMP);
  });

  const columnY = useDerivedValue(() => {
    return CENTER_Y - columnHeight.value / 2;
  });

  // === UI Thread Animations for the Text Overlay ===
  const textScale = useDerivedValue(() => {
    return interpolate(
      progress.value, 
      [0, 0.15, 0.6, 1], 
      [0.2, 1.5, 1.5, 2.5], 
      Extrapolation.CLAMP
    );
  });

  const textOpacity = useDerivedValue(() => {
    if (progress.value < 0.1) return interpolate(progress.value, [0, 0.1], [0, 1]);
    return interpolate(progress.value, [0.7, 1], [1, 0]);
  });

  const textStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
      transform: [{ scale: textScale.value }],
    };
  });

  if (!isTriggered) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Central Core Glowing Light Column */}
        <Group opacity={columnOpacity}>
          <Rect 
            x={CENTER_X - 100} 
            y={columnY}
            width={200} 
            height={columnHeight} 
          >
            <LinearGradient
              start={vec(CENTER_X - 100, 0)}
              end={vec(CENTER_X + 100, 0)}
              colors={['transparent', 'rgba(255, 215, 0, 0.5)', '#FFFFFF', 'rgba(255, 215, 0, 0.5)', 'transparent']}
            />
            <BlurMask blur={40} style="normal" />
          </Rect>
        </Group>

        {/* Explosive Emitted Sparks */}
        {particles.map((p, i) => (
           <Particle key={i} progress={progress} {...p} />
        ))}
      </Canvas>
      
      {/* Floating Animated RPG Text */}
      <View style={styles.textContainer}>
        <Animated.Text style={[styles.title, textStyle]}>
          LEVEL UP!
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  textContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, // Renders on top of the Skia Canvas
  },
  title: {
    fontSize: 56,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: 4,
    ...Platform.select({
      web: { textShadow: '0 0 25px #FFD700' },
      default: {
        textShadowColor: '#FFD700',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 25,
      }
    }),
  },
});
