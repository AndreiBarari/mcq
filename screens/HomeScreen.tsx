import { FontAwesome5 } from "@expo/vector-icons";
import { Link } from "expo-router";
import React from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Character from "../components/Character";
import useGameStore from "../store/useGameStore";

const { width, height } = Dimensions.get("window");

// ── Solid-arc XP ring ─────────────────────────────────────────────────────
//
// Built from 36 small tangential rectangles evenly spaced around the ring.
// Adjacent segments slightly overlap so the arc looks like a continuous solid line.
//
const RING_SIZE = 72; // total outer diameter
const SEG_COUNT = 36; // number of segments → ~10° each
const SEG_W = 6; // tangential width of each segment (slight overlap makes it solid)
const SEG_H = 7; // radial thickness (= stroke width)
const SEG_RADIUS = 28; // distance from container centre to segment centre
const TOTAL_LEVELS = 9;

function XpRing({
  progress,
  charClass,
}: {
  progress: number;
  charClass: string;
}) {
  const p = Math.min(1, Math.max(0, progress));
  const filled = Math.round(p * SEG_COUNT);
  const isMage = charClass === "Mage";
  const center = RING_SIZE / 2;

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE }}>
      {/* Tangential arc segments */}
      {Array.from({ length: SEG_COUNT }, (_, i) => {
        // angular position (clockwise from 12-o'clock)
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
              transform: [{ rotate: `${angleDeg + 90}deg` }], // tangential orientation
            }}
          />
        );
      })}

      {/* Inner avatar circle */}
      <View style={styles.avatarInner}>
        <FontAwesome5
          name={isMage ? "hat-wizard" : "user-shield"}
          size={22}
          color={isMage ? "#3B82F6" : "#EF4444"}
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

  React.useEffect(() => {
    startSession();
  }, []);

  const lessonsCompleted = Math.min(
    TOTAL_LEVELS,
    Math.max(0, highestLevel - 1),
  );
  const xpProgress = lessonsCompleted / TOTAL_LEVELS; // 0.0 – 1.0

  return (
    <SafeAreaView style={styles.container}>
      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        {/* Avatar + XP ring — LEFT */}
        <XpRing progress={xpProgress} charClass={characterClass} />

        {/* Rank title — RIGHT of avatar */}
        <View style={styles.rankContainer}>
          <Text style={styles.rankTitle}>Apprentice Mage</Text>
          <Text style={styles.rankSub}>
            {lessonsCompleted} / {TOTAL_LEVELS} lessons
          </Text>
        </View>
      </View>

      {/* ── CHARACTER ───────────────────────────────────────────────────── */}
      <View style={styles.centerArea}>
        <Character
          position={{ x: width / 2, y: height * 0.4 }}
          charClass={characterClass}
        />
        <View style={styles.pedestal} />
      </View>

      {/* ── BOTTOM BAR ──────────────────────────────────────────────────── */}
      <View style={styles.bottomBar}>
        {/* All Lessons */}
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

        {/* Next Lesson — icon only, same gold circle style */}
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

        {/* Quit */}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#87CEEB",
  },

  // ── Top bar ──
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "rgba(43, 27, 17, 0.9)",
    borderBottomWidth: 3,
    borderColor: "#4a3318",
    gap: 16,
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
  pedestal: {
    position: "absolute",
    top: height * 0.45,
    width: 140,
    height: 30,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 70,
    transform: [{ scaleY: 0.5 }],
  },

  // ── Bottom bar ──
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(43, 27, 17, 0.95)",
    paddingVertical: 24,
    paddingHorizontal: 16,
    paddingBottom: 36,
    borderTopWidth: 3,
    borderColor: "#4a3318",
  },

  // All three bottom nav buttons share the same gold circle style
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
