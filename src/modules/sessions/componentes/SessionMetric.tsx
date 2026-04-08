import { appColors, radius, spacing } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export function SessionMetric({
    label,
    value,
    icon,
    compact = false,
}: {
    label: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
    compact?: boolean;
}) {
    return (
        <View
            style={{
                flex: 1,
                minHeight: compact ? 72 : 92,
                borderRadius: radius.lg,
                padding: spacing.sm,
                backgroundColor: "rgba(255,255,255,0.04)",
                borderWidth: 1,
                borderColor: appColors.border,
                gap: spacing.xs,
            }}
        >
            <Ionicons name={icon} size={18} color={appColors.primary} />
            <Text style={{ color: appColors.textMuted, fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>{label}</Text>
            <Text style={{ color: appColors.textPrimary, fontSize: compact ? 16 : 18, fontWeight: "900" }}>{value}</Text>
        </View>
    );
}
