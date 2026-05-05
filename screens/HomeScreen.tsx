import { FontAwesome5 } from "@expo/vector-icons";
import { Link } from "expo-router";
import React from "react";
import {
  Dimensions,
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WizardAvatar from "../components/WizardAvatar";
import useGameStore, { RANK_TITLES, RANK_COLORS } from "../store/useGameStore";

const { width, height } = Dimensions.get("window");

// ── Solid-arc XP ring ─────────────────────────────────────────────────────
const RING_SIZE = 72;
const SEG_COUNT = 36;
const SEG_W = 6;
const SEG_H = 7;
const SEG_RADIUS = 28;
const TOTAL_LEVELS = 15;



function XpRing({
  progress,
  charClass,
  mageTier,
}: {
  progress: number;
  charClass: string;
  mageTier: number;
}) {
  const p = Math.min(1, Math.max(0, progress));
  const filled = Math.round(p * SEG_COUNT);
  const isMage = charClass === "Mage";
  const center = RING_SIZE / 2;

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE }}>
      {Array.from({ length: SEG_COUNT }, (_, i) => {
        const angle = (i / SEG_COUNT) * 2 * Math.PI - Math.PI / 2;
        const angleDeg = (i / SEG_COUNT) * 360 - 90;
        const cx = center + SEG_RADIUS * Math.cos(angle) - SEG_W / 2;
        const cy = center + SEG_RADIUS * Math.sin(angle) - SEG_H / 2;
        const isFilled = i < filled;

        return (
          <View
            key={i}
            style={{
              position: "absolute",
              width: SEG_W,
              height: SEG_H,
              left: cx,
              top: cy,
              borderRadius: SEG_W / 2,
              backgroundColor: isFilled ? "#FFD700" : "rgba(255,255,255,0.13)",
              transform: [{ rotate: `${angleDeg + 60}deg` }],
            }}
          />
        );
      })}

      <View style={styles.avatarInner}>
        <FontAwesome5
          name={isMage ? "hat-wizard" : "user-shield"}
          size={22}
          color={isMage ? (RANK_COLORS[mageTier] ?? "#94A3B8") : "#EF4444"}
        />
      </View>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────
const HomeScreen = () => {
  const startSession = useGameStore((state) => state.startSession);
  const highestLevel = useGameStore((state: any) => state.highestLevel);
  const characterClass = useGameStore((state) => state.characterClass);
  const startBgMusic = useGameStore((state: any) => state.startBgMusic);
  const loadPersistedData = useGameStore((state: any) => state.loadPersistedData);

  React.useEffect(() => {
    loadPersistedData();
    startSession();
    startBgMusic();
  }, []);

  const activeMageTier = useGameStore((state: any) => state.activeMageTier);

  const lessonsCompleted = Math.min(
    TOTAL_LEVELS,
    Math.max(0, highestLevel - 1),
  );
  const xpProgress = lessonsCompleted / TOTAL_LEVELS;
  
  // Derive mage tier: use Wardrobe selection if available, else derive from progress
  const derivedTier = Math.min(
    5,
    Math.max(1, Math.ceil((lessonsCompleted / TOTAL_LEVELS) * 5) || 1),
  );
  const mageTier = activeMageTier !== null ? activeMageTier : derivedTier;
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground
      source={require("../assets/game/background_home_forest.png")}
      style={styles.backgroundImage}
      imageStyle={{ transform: [{ scaleX: 1 }, { scaleY: 0.81 }] }}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* ── TOP BAR — flush to screen top ────────────────────────────── */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <XpRing progress={xpProgress} charClass={characterClass} mageTier={mageTier} />

          <View style={styles.rankContainer}>
            <Text style={styles.rankTitle}>{RANK_TITLES[mageTier]}</Text>
            <Text style={styles.rankSub}>
              {lessonsCompleted} / {TOTAL_LEVELS} lessons
            </Text>
          </View>

          <Link href="/Wardrobe" asChild>
            <TouchableOpacity style={styles.wardrobeBtn}>
              <FontAwesome5 name="tshirt" size={20} color="#FFD700" />
            </TouchableOpacity>
          </Link>
        </View>

        {/* ── WIZARD AVATAR ────────────────────────────────────────────── */}
        <View style={styles.centerArea}>
          <View style={{ transform: [{ translateY: height * 0.07 }] }}>
            <WizardAvatar mageTier={mageTier} size={180} />
          </View>
        </View>

        {/* ── BOTTOM BAR ──────────────────────────────────────────────────── */}
        <View style={styles.bottomBar}>
          <Link
            href={{
              pathname: "/Travel",
              params: {
                to: "/LevelMap",
                msg: "Carriage ride to the World Map...",
              },
            }}
            asChild
          >
            <TouchableOpacity style={styles.navBtn}>
              <FontAwesome5 name="map-marked-alt" size={26} color="#1C1C1E" />
            </TouchableOpacity>
          </Link>

          <Link
            href={{
              pathname: "/Travel",
              params: {
                to: "/GameLevel",
                msg: "Walking to the current Challenge...",
              },
            }}
            asChild
          >
            <TouchableOpacity style={styles.navBtn}>
              <FontAwesome5 name="play" size={26} color="#1C1C1E" />
            </TouchableOpacity>
          </Link>

          <Link
            href={{
              pathname: "/Travel",
              params: { to: "/", msg: "Returning to the Title Screen..." },
            }}
            replace
            asChild
          >
            <TouchableOpacity style={styles.navBtn}>
              <FontAwesome5 name="door-open" size={26} color="#b71c1c" />
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
  },

  // ── Top bar ──
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#2b1b11",
    borderBottomWidth: 3,
    borderColor: "#4a3318",
    gap: 16,
  },
  wardrobeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  avatarInner: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: (RING_SIZE - 20) / 2,
    backgroundColor: "#3e2723",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4a3318",
  },
  rankContainer: {
    flex: 1,
    justifyContent: "center",
  },
  rankTitle: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: 17,
    fontFamily: "serif",
  },
  rankSub: {
    color: "#d4c5b9",
    fontSize: 12,
    marginTop: 2,
  },

  // ── Center ──
  centerArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Bottom bar ──
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#2b1b11",
    paddingVertical: 24,
    paddingHorizontal: 16,
    paddingBottom: 56,
    borderTopWidth: 3,
    borderColor: "#4a3318",
  },

  navBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFD700",
    borderWidth: 3,
    borderColor: "#B8860B",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      web: { boxShadow: "0 4px 10px rgba(255,215,0,0.45)" },
      default: {
        shadowColor: "#FFD700",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
      },
    }),
    elevation: 7,
  },
});

export default HomeScreen;
