export const appColors = {
  background: "#07111F",
  backgroundElevated: "#0D1B2A",
  surface: "rgba(15, 23, 42, 0.78)",
  surfaceStrong: "#111E31",
  card: "rgba(18, 28, 45, 0.86)",
  cardMuted: "#162338",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  border: "rgba(148, 163, 184, 0.14)",
  borderStrong: "rgba(148, 163, 184, 0.24)",
  primary: "#4F8CFF",
  primaryStrong: "#2563EB",
  primaryGradientStart: "#60A5FA",
  primaryGradientEnd: "#1D4ED8",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#38BDF8",
  white: "#FFFFFF",
  overlay: "rgba(3, 7, 18, 0.68)",
  shadow: "rgba(2, 6, 23, 0.42)",
  accentLilac: "#8B5CF6",
  accentCyan: "#22D3EE",
  accentEmerald: "#34D399",
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800" as const,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700" as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500" as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600" as const,
  },
} as const;

export const softShadow = {
  shadowColor: appColors.shadow,
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.24,
  shadowRadius: 24,
  elevation: 10,
} as const;
