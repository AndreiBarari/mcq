import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import useGameStore, { RANK_TITLES } from '../store/useGameStore';
import WizardAvatar from '../components/WizardAvatar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const TIERS = [1, 2, 3, 4, 5];

export default function WardrobeScreen() {
  const router = useRouter();
  const activeMageTier = useGameStore((state: any) => state.activeMageTier);
  const setActiveMageTier = useGameStore((state: any) => state.setActiveMageTier);
  const insets = useSafeAreaInsets();
  
  // Need to compute default if null
  const highestLevel = useGameStore((state: any) => state.highestLevel);
  const lessonsCompleted = Math.min(15, Math.max(0, highestLevel - 1));
  const derivedTier = Math.min(5, Math.max(1, Math.ceil((lessonsCompleted / 15) * 5) || 1));
  const currentTier = activeMageTier !== null ? activeMageTier : derivedTier;

  const handleSelect = (tier: number) => {
    setActiveMageTier(tier);
  };

  return (
    <ImageBackground
      source={require("../assets/game/background_wardrobe.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <FontAwesome5 name="arrow-left" size={20} color="#FFD700" />
          </TouchableOpacity>
          <Text style={styles.title}>Wardrobe</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.previewContainer}>
          <WizardAvatar mageTier={currentTier} size={220} />
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{RANK_TITLES[currentTier]}</Text>
          </View>
        </View>

        <View style={styles.selectionArea}>
          <Text style={styles.subtitle}>Select your Robes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {TIERS.map((tier) => {
              const isSelected = tier === currentTier;
              return (
                <TouchableOpacity 
                  key={tier} 
                  style={[styles.tierCard, isSelected && styles.tierCardSelected]}
                  onPress={() => handleSelect(tier)}
                  activeOpacity={0.7}
                >
                  <WizardAvatar mageTier={tier} size={80} />
                  <Text style={styles.tierName}>{RANK_TITLES[tier]}</Text>
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <FontAwesome5 name="check" size={12} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  container: { flex: 1, justifyContent: 'space-between' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20,
    backgroundColor: '#2b1b11',
    paddingVertical: 15,
    borderBottomWidth: 3,
    borderColor: '#4a3318',
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFD700' },
  title: { fontSize: 28, fontWeight: '900', color: '#FFD700', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4, fontFamily: 'serif' },
  previewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  rankBadge: { marginTop: 20, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#FFD700' },
  rankText: { color: '#FFD700', fontSize: 18, fontWeight: 'bold' },
  selectionArea: { backgroundColor: 'rgba(28, 28, 30, 0.85)', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingVertical: 20, borderWidth: 2, borderColor: '#3e2723' },
  subtitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 20, marginBottom: 15 },
  scrollContent: { paddingHorizontal: 15, gap: 15 },
  tierCard: { width: 110, height: 140, backgroundColor: '#2b1b11', borderRadius: 15, borderWidth: 2, borderColor: '#4e342e', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  tierCardSelected: { borderColor: '#FFD700', backgroundColor: '#3e2723' },
  tierName: { color: '#d4c5b9', fontSize: 12, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  checkBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#4CAF50', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' }
});
