import { appColors, radius, spacing } from "@/src/theme/colors";
import React, { memo, useEffect, useRef } from "react";
import { Animated, View } from "react-native";

interface SkeletonCardProps {
  height?: number;
}

export const SkeletonCard = memo(function SkeletonCard({ height = 120 }: SkeletonCardProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmer]);

  return (
    <View
      style={{
        backgroundColor: "rgba(148, 163, 184, 0.08)",
        borderRadius: radius.xl,
        height,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: appColors.border,
        marginBottom: spacing.sm,
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: "38%",
          backgroundColor: "rgba(255,255,255,0.08)",
          transform: [
            {
              translateX: shimmer.interpolate({
                inputRange: [0, 1],
                outputRange: [-160, 340],
              }),
            },
          ],
        }}
      />
    </View>
  );
});
