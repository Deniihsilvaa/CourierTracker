import { StyleSheet } from "react-native";

export const stylesRegister = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 40,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        color: '#333',
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    errorText: {
        color: 'red',
        marginBottom: 16,
        textAlign: 'center',
    },
    buttonGroup: {
        gap: 15,
        marginTop: 10,
    },
    loginLink: {
        color: '#007AFF',
        textAlign: 'center',
        marginTop: 10,
        textDecorationLine: 'underline',
    }
});