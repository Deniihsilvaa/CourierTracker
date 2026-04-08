import { StyleSheet } from "react-native";

export const stylesLogin = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 30,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 10,
    },
    inputReset: {
        flex: 1,
        borderWidth: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
        height: 48,
    },
    forgotPasswordSmall: {
        alignSelf: 'flex-end',
        marginTop: 8,
        color: '#2563eb',
        fontSize: 13,
        fontWeight: '600',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        gap: 8,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
    },
    buttonActionGroup: {
        gap: 16,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#e5e7eb',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: '700',
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
        gap: 12,
        paddingBottom: 20,
    },
    footerText: {
        fontSize: 14,
        color: '#4b5563',
    },
    link: {
        color: '#2563eb',
        fontWeight: 'bold',
    },
    credits: {
        fontSize: 11,
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    eyeIcon: {
        paddingHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
