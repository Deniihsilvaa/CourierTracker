import { appColors, radius, spacing } from "@/src/theme/colors";
import { StyleSheet } from "react-native";


export const stylesEditSessionModal = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.95)",
        justifyContent: "center",
        padding: spacing.sm
    },
    card: {
        padding: spacing.xl,
        gap: spacing.md,
        borderRadius: radius.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,

    },
    stepIndicatorContainer: {
        flexDirection: 'row',
        gap: 6
    },
    stepIndicator: {
        width: 32,
        height: 6,
        borderRadius: 3,
    },
    closeButton: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 4,
        borderRadius: 20,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs,
    },
    stepTitle: {
        color: appColors.textPrimary,
        fontSize: 22,
        fontWeight: "800",
        textAlign: 'center',
    },
    stepSubtitle: {
        color: appColors.textSecondary,
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.7,

    },
    metricRow: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: radius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    label: {
        color: appColors.textSecondary,
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 4,
        marginBottom: spacing.xs,
    },
    dateTimeRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    pickerTrigger: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'nowrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: "rgba(255,255,255,0.05)",
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    pickerText: {
        color: appColors.textPrimary,
        fontSize: 10,
        textAlign: 'left',
        fontWeight: '600',

    },
    input: {
        backgroundColor: "rgba(255,255,255,0.05)",
        padding: spacing.md,
        borderRadius: radius.lg,
        color: appColors.textPrimary,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        fontSize: 16,
        fontWeight: "600",
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        padding: spacing.sm,
        borderRadius: radius.md,
        marginTop: spacing.xs,
    },
    errorText: {
        color: appColors.danger,
        fontSize: 12,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    backButton: {
        height: 56,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.02)',
    }
});