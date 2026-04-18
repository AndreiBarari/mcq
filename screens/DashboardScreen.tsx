import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { FontAwesome5, Foundation, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';

const DashboardScreen = () => {
  const router = useRouter();
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Dashboard Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Realm of Knowledge</Text>
        <Text style={styles.subtitle}>Choose your path, young hero.</Text>
      </View>

      {/* Primary Unlocked Course */}
      <Link 
        href={{
          pathname: "/Travel",
          params: { to: "/LevelMap", msg: "Heading to the training grounds..." }
        }} 
        asChild
      >
        <TouchableOpacity 
          style={StyleSheet.flatten([styles.card, styles.unlockedCard])}
          activeOpacity={0.8}
        >
          <View style={styles.cardIconBox}>
            <FontAwesome5 name="hat-wizard" size={40} color="#FFD700" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Coding Magic</Text>
            <Text style={styles.cardDesc}>Master the spells of logic and loops to command the realm.</Text>
          </View>
          <View style={styles.cardArrow}>
            <FontAwesome5 name="chevron-right" size={24} color="#FFF" />
          </View>
        </TouchableOpacity>
      </Link>

      {/* Locked Course 1 */}
      <View style={[styles.card, styles.lockedCard]}>
        <View style={styles.cardIconBoxLocked}>
          <MaterialCommunityIcons name="robot" size={40} color="#888" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitleLocked}>Robotics Academy</Text>
          <Text style={styles.cardDescLocked}>Build and command iron golems. Coming soon to the realm.</Text>
        </View>
        <View style={styles.padlockIcon}>
          <Foundation name="lock" size={32} color="#444" />
        </View>
      </View>

      {/* Locked Course 2 */}
      <View style={[styles.card, styles.lockedCard]}>
        <View style={styles.cardIconBoxLocked}>
          <MaterialCommunityIcons name="head-lightbulb-outline" size={40} color="#888" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitleLocked}>AI Wizardry</Text>
          <Text style={styles.cardDescLocked}>Teach artifacts to think for themselves. Coming soon.</Text>
        </View>
        <View style={styles.padlockIcon}>
          <Foundation name="lock" size={32} color="#444" />
        </View>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2b1b11', // Dark wood / tavern background
  },
  content: {
    padding: 20,
    paddingTop: 60, // Assuming no header
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFD700',
    ...Platform.select({
      web: { textShadow: '2px 2px 4px #000' },
      default: {
        textShadowColor: '#000',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
      }
    }),
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 16,
    color: '#d4c5b9',
    marginTop: 8,
    fontStyle: 'italic',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 3,
    ...Platform.select({
      web: { boxShadow: '0 4px 5px rgba(0, 0, 0, 0.5)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
      }
    }),
    elevation: 8,
  },
  unlockedCard: {
    backgroundColor: '#3e2723',
    borderColor: '#8d6e63',
  },
  lockedCard: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333333',
    opacity: 0.85,
  },
  cardIconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#5d4037',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  cardIconBoxLocked: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#555',
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: '#d4c5b9',
    lineHeight: 20,
  },
  cardTitleLocked: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 4,
  },
  cardDescLocked: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  cardArrow: {
    paddingLeft: 10,
  },
  padlockIcon: {
    paddingLeft: 10,
    paddingRight: 10,
  }
});

export default DashboardScreen;
