import { FontAwesome5 } from "@expo/vector-icons";
import React from "react";
import { Dimensions, ImageBackground, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import useGameStore from "../store/useGameStore";
import GridAsset from "./GridAsset";
import TutorialPointer from "./TutorialPointer";

const { width } = Dimensions.get("window");
const GRID_MAX_WIDTH = width * 0.9;

const GridMap: React.FC = () => {
  const {
    rows,
    cols,
    heroPosition,
    targetPosition,
    obstacles,
    keyPosition,
    doorPosition,
    hasKey,
    currentLevel,
    collisionPos,
    boundaryHit,
  } = useGameStore();

  // Calculate cell size to fit within the max width while maintaining square aspect ratio
  const cellSize = Math.floor(GRID_MAX_WIDTH / Math.max(rows, cols));

  const playerX = useSharedValue(heroPosition.x * cellSize);
  const playerY = useSharedValue(heroPosition.y * cellSize);

  React.useEffect(() => {
    playerX.value = withSpring(heroPosition.x * cellSize, { damping: 20, stiffness: 90 });
    playerY.value = withSpring(heroPosition.y * cellSize, { damping: 20, stiffness: 90 });
  }, [heroPosition.x, heroPosition.y, cellSize]);

  const playerAnimationStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: playerX.value },
      { translateY: playerY.value }
    ]
  }));

  // Pulse animation for boundary hits
  const pulseOpacity = useSharedValue(0);
  React.useEffect(() => {
    if (boundaryHit) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 250 }),
          withTiming(0.1, { duration: 250 }),
        ),
        2, // 2 cycles = 1000ms total
        true,
      );
    } else {
      pulseOpacity.value = 0;
    }
  }, [boundaryHit]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const renderGrid = () => {
    let gridRows = [];
    for (let r = 0; r < rows; r++) {
      let cells = [];
      for (let c = 0; c < cols; c++) {
        // Collect ALL assets for this cell (multiple can overlap)
        const layers: React.ReactNode[] = [];

        // Layer 1 (bottom): Door — always render underneath everything
        if (doorPosition && c === doorPosition.x && r === doorPosition.y) {
          layers.push(
            <View key="door" style={{ position: "absolute", zIndex: 1 }}>
              <GridAsset type="door" size={cellSize} isOpen={hasKey} />
            </View>,
          );
        }

        // Layer 2: Static terrain — obstacles
        const cellObstacle = obstacles.find(
          (obs: any) => obs.x === c && obs.y === r,
        );
        if (cellObstacle) {
          layers.push(
            <View key="obstacle" style={{ position: "absolute", zIndex: 2 }}>
              <GridAsset
                type={cellObstacle.type || "mountain"}
                size={cellSize}
              />
            </View>,
          );
        }

        // Layer 3: Collectibles — key and crystal
        if (
          keyPosition &&
          c === keyPosition.x &&
          r === keyPosition.y &&
          !hasKey
        ) {
          layers.push(
            <View key="key" style={{ position: "absolute", zIndex: 3 }}>
              <GridAsset type="key" size={cellSize} />
            </View>,
          );
        }
        if (
          c === targetPosition.x &&
          r === targetPosition.y &&
          (heroPosition.x !== c || heroPosition.y !== r)
        ) {
          layers.push(
            <View key="crystal" style={{ position: "absolute", zIndex: 3 }}>
              <GridAsset type="crystal" size={cellSize} />
            </View>,
          );
        }



        // Layer 5 (Error): Collision Red X
        if (collisionPos && c === collisionPos.x && r === collisionPos.y) {
          layers.push(
            <View
              key="collision"
              style={[
                styles.collisionOverlay,
                { width: cellSize, height: cellSize },
              ]}
            >
              <FontAwesome5
                name="times-circle"
                size={cellSize * 0.7}
                color="#EF4444"
              />
            </View>,
          );
        }

        // Layer 6 (Tutorial): Magical Glove Pointer
        if (currentLevel === 11) {
          const isPointingAtKey =
            !hasKey &&
            keyPosition &&
            c === keyPosition.x &&
            r === keyPosition.y;
          const isPointingAtCrystal =
            hasKey && c === targetPosition.x && r === targetPosition.y;
          if (isPointingAtKey || isPointingAtCrystal) {
            layers.push(
              <TutorialPointer
                key="tutorial-pointer"
                visible={true}
                style={{ top: cellSize * 0.3, left: cellSize * 0.05 }}
              />,
            );
          }
        }

        cells.push(
          <View
            key={`cell-${r}-${c}`}
            style={[styles.gridCell, { width: cellSize, height: cellSize }]}
          >
            {layers}
          </View>,
        );
      }
      gridRows.push(
        <View key={`row-${r}`} style={styles.gridRow}>
          {cells}
        </View>,
      );
    }
    return gridRows;
  };

  const gridWidth = cellSize * cols;
  const gridHeight = cellSize * rows;

  return (
    <ImageBackground
      source={require("../assets/game/background_map_grasstile.png")}
      resizeMode="repeat"
      style={[styles.gridContainer, { width: gridWidth, height: gridHeight }]}
    >
      {renderGrid()}

      <Animated.View 
        style={[
          {
            position: 'absolute',
            width: cellSize,
            height: cellSize,
            zIndex: 10,
            justifyContent: 'center',
            alignItems: 'center',
          },
          playerAnimationStyle
        ]}
      >
        <GridAsset type="player" size={cellSize} />
      </Animated.View>

      {/* Boundary Indicators */}
      {boundaryHit === "top" && (
        <Animated.View
          style={[
            styles.boundaryIndicator,
            styles.boundaryTop,
            { width: gridWidth },
            pulseStyle,
          ]}
        />
      )}
      {boundaryHit === "bottom" && (
        <Animated.View
          style={[
            styles.boundaryIndicator,
            styles.boundaryBottom,
            { width: gridWidth },
            pulseStyle,
          ]}
        />
      )}
      {boundaryHit === "left" && (
        <Animated.View
          style={[
            styles.boundaryIndicator,
            styles.boundaryLeft,
            { height: gridHeight },
            pulseStyle,
          ]}
        />
      )}
      {boundaryHit === "right" && (
        <Animated.View
          style={[
            styles.boundaryIndicator,
            styles.boundaryRight,
            { height: gridHeight },
            pulseStyle,
          ]}
        />
      )}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    borderWidth: 2,
    borderColor: "#558b2f",
    borderRadius: 8,
    overflow: "hidden",
    alignSelf: "center",
    marginVertical: 8,
  },
  gridRow: {
    flexDirection: "row",
  },
  gridCell: {
    borderWidth: 1,
    borderColor: "rgba(85, 139, 47, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible",
  },
  collisionOverlay: {
    position: "absolute",
    zIndex: 100,
    backgroundColor: "rgba(239, 68, 68, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  boundaryIndicator: {
    position: "absolute",
    backgroundColor: "#EF4444",
    zIndex: 50,
  },
  boundaryTop: { top: 0, height: 8 },
  boundaryBottom: { bottom: 0, height: 8 },
  boundaryLeft: { left: 0, width: 8 },
  boundaryRight: { right: 0, width: 8 },
});

export default GridMap;
