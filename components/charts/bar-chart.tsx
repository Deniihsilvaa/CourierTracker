import { appColors, radius, spacing } from "@/src/theme/colors";
import React, { memo, useEffect, useMemo, useRef } from "react";
import { Animated, Text, View } from "react-native";

export interface BarChartDatum {
  label: string;
  value: number;
  tone?: string;
}

interface BarChartProps {
  data: BarChartDatum[];
  maxHeight?: number;
}

export const BarChart = memo(function BarChart({ data, maxHeight = 120 }: BarChartProps) {
  const animations = useRef(data.map(() => new Animated.Value(0))).current;

  const maxValue = useMemo(() => Math.max(...data.map((item) => item.value), 1), [data]);

  useEffect(() => {
    Animated.stagger(
      45,
      animations.map((value) =>
        Animated.spring(value, {
          toValue: 1,
          useNativeDriver: false,
          friction: 7,
          tension: 65,
        })
      )
    ).start();
  }, [animations, data]);

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.xs }}>
      {data.map((item, index) => {
        const chartHeight = Math.max(10, (item.value / maxValue) * maxHeight);
        const tone = item.tone ?? appColors.primary;

        return (
          <View key={`${item.label}-${index}`} style={{ flex: 1, alignItems: "center", gap: spacing.xs }}>
            <View
              style={{
                width: "100%",
                backgroundColor: "rgba(148, 163, 184, 0.08)",
                borderRadius: radius.lg,
                justifyContent: "flex-end",
                height: maxHeight,
                overflow: "hidden",
              }}
            >
              <Animated.View
                style={{
                  height: animations[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, chartHeight],
                  }),
                  borderRadius: radius.lg,
                  backgroundColor: tone,
                }}
              />
            </View>
            <Text style={{ color: appColors.textMuted, fontSize: 11, fontWeight: "700" }}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
});
