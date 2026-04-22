import { appColors, radius, softShadow } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import { Pressable, StyleProp, Text, View, ViewStyle } from "react-native";

interface FloatingActionButtonProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export const FloatingActionButton = memo(function FloatingActionButton({
  label,
  icon,
  onPress,
  style,
}: FloatingActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          position: "absolute",
          right: 20,
          bottom: 28,
          minHeight: 60,
          borderRadius: radius.pill,
          backgroundColor: "rgba(37, 99, 235, 0.92)",
          borderWidth: 1,
          borderColor: "rgba(147, 197, 253, 0.26)",
          paddingHorizontal: 18,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        style,
        softShadow,
      ]}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: radius.pill,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(255,255,255,0.16)",
        }}
      >
        <Ionicons name={icon} size={18} color={appColors.white} />
      </View>
      <Text style={{ color: appColors.textPrimary, fontSize: 15, fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
});
