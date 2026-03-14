import { useAuthStore } from "@/src/modules/auth/store";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

export function useRegister() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { signUp, isLoading, error } = useAuthStore();
    const router = useRouter();

    const handleSignUp = async () => {
        if (!fullName || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        try {
            await signUp(email, password, fullName);
            // Success is handled by RootLayout redirect (user is set)
        } catch (e: any) {
            console.error(e);
        }
    };

    return {
        fullName,
        setFullName,
        email,
        setEmail,
        password,
        setPassword,
        handleSignUp,
        isLoading,
        error,
        router,
    };
}