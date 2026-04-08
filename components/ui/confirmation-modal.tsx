import { PrimaryButton } from "@/components/buttons/primary-button";
import { GlassCard } from "@/components/cards/glass-card";
import { appColors, radius, spacing } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: "danger" | "primary" | "warning";
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  isLoading = false,
  variant = "primary",
}) => {
  const confirmColor = variant === "danger" ? appColors.danger :
    variant === "warning" ? appColors.warning :
      appColors.primary;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <GlassCard style={styles.card}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: `${confirmColor}15` }]}>
              <Ionicons
                name={variant === "danger" ? "trash-outline" : "alert-circle-outline"}
                size={24}
                color={confirmColor}
              />
            </View>
            <Text style={styles.title}>{title}</Text>
          </View>

          <Text style={styles.description}>{description}</Text>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onCancel}
              style={styles.cancelButton}
              disabled={isLoading}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>

            <PrimaryButton
              label={confirmLabel}
              onPress={onConfirm}
              loading={isLoading}
              variant={variant === "danger" ? "danger" : "primary"}
            />
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    padding: spacing.md,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: appColors.textPrimary,
    fontSize: 20,
    fontWeight: "900",
  },
  description: {
    color: appColors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: spacing.md,
  },
  cancelButton: {
    paddingHorizontal: spacing.sm,
  },
  cancelText: {
    color: appColors.textMuted,
    fontSize: 15,
    fontWeight: "700",
  },
  confirmButton: {
    minWidth: 120,
  },
});
