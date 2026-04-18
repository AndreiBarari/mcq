import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useGameStore from '../store/useGameStore';

const AdaptiveLayout = ({ children }) => {
  // Read ageGroup from the Zustand store
  const ageGroup = useGameStore((state) => state.ageGroup);

  // Layout for 5-9: Highly visual, large icons, minimal text
  const renderYoungUI = () => (
    <View style={[styles.container, styles.youngContainer]}>
      <View style={styles.youngHeader}>
        <Text style={styles.youngIconText}>🌟 🛡️ ⚔️</Text>
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );

  // Layout for 9-14: Balanced mix of text and game UI
  const renderMidUI = () => (
    <View style={[styles.container, styles.midContainer]}>
      <View style={styles.midHeader}>
        <Text style={styles.midHeaderText}>Hero's Journey</Text>
        <Text style={styles.midSubText}>Current Quest</Text>
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );

  // Layout for 14+: Text-heavy, detailed RPG-style UI
  const renderTeenUI = () => (
    <View style={[styles.container, styles.teenContainer]}>
      <View style={styles.teenHeader}>
        <Text style={styles.teenHeaderText}>[ SYSTEM LOG ]</Text>
        <Text style={styles.teenDetailText}>Class: {useGameStore.getState().characterClass} | Lvl: {useGameStore.getState().currentLevel}</Text>
        <Text style={styles.teenDetailText}>EXP: {useGameStore.getState().experiencePoints}</Text>
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );

  // Adapt based on state
  switch (ageGroup) {
    case '5-9':
      return renderYoungUI();
    case '9-14':
      return renderMidUI();
    case '14+':
      return renderTeenUI();
    default:
      return renderMidUI();
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  // Young UI Styles
  youngContainer: {
    backgroundColor: '#FFEBEE', 
  },
  youngHeader: {
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: '#FFCDD2',
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#EF5350',
  },
  youngIconText: {
    fontSize: 50, // Large icons
  },

  // Mid UI Styles
  midContainer: {
    backgroundColor: '#E8F5E9',
  },
  midHeader: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#C8E6C9',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#43A047',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  midHeaderText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  midSubText: {
    fontSize: 16,
    color: '#388E3C',
    fontStyle: 'italic',
  },

  // Teen UI Styles
  teenContainer: {
    backgroundColor: '#121212', // Dark mode for older/RPG vibe
  },
  teenHeader: {
    padding: 12,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    borderLeftWidth: 4,
    borderLeftColor: '#BB86FC',
  },
  teenHeaderText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#BB86FC',
    marginBottom: 4,
  },
  teenDetailText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#E0E0E0',
  },
});

export default AdaptiveLayout;
