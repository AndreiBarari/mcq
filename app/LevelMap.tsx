import React from 'react';
import LevelMapScreen from '../screens/LevelMapScreen';
import { useRouter } from 'expo-router';

export default function LevelMap() {
  const router = useRouter();
  
  // Custom navigation adapter
  const navAdapter = {
    navigate: (target: string) => {
      router.push(`/${target}` as any);
    }
  };

  return <LevelMapScreen navigation={navAdapter} />;
}
