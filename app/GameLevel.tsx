import React from 'react';
import GameLevelScreen from '../screens/GameLevelScreen';

// Native-only route (Android & iOS). The web version lives in GameLevel.web.tsx.
export default function GameLevel() {
  return <GameLevelScreen />;
}
