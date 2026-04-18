import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import Character from './Character';
import useGameStore from '../store/useGameStore';

const { width, height } = Dimensions.get('window');

// Define our Physics/Movement system
// This system runs every frame and processes input events
const MovementSystem = (entities, { events }) => {
  const character = entities.character;

  if (events && events.length) {
    events.forEach(e => {
      if (e.type === 'move_left') {
        character.position.x -= 15;
      }
      if (e.type === 'move_right') {
        character.position.x += 15;
      }
    });

    // Simple bounds checking
    if (character.position.x < 50) character.position.x = 50;
    if (character.position.x > width - 50) character.position.x = width - 50;
  }

  return entities;
};

export default function GameArena() {
  const engineRef = useRef(null);
  const characterClass = useGameStore((state) => state.characterClass);

  const moveLeft = () => engineRef.current?.dispatch({ type: 'move_left' });
  const moveRight = () => engineRef.current?.dispatch({ type: 'move_right' });

  return (
    <View style={styles.container}>
      <GameEngine
        ref={engineRef}
        style={styles.gameContainer}
        systems={[MovementSystem]}
        entities={{
          character: {
            position: { x: width / 2, y: height - 200 },
            charClass: characterClass,
            renderer: <Character />
          }
        }}
      />
      
      {/* On-screen controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={moveLeft}>
          <Text style={styles.buttonText}>⬅️ LEFT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={moveRight}>
          <Text style={styles.buttonText}>RIGHT ➡️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB', // Simple sky background
  },
  gameContainer: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
