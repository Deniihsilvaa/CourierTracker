import { useAuthStore } from "@/src/modules/auth/store";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

export function useRegister() {
    const [step, setStep] = useState(1);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [vehicleType, setVehicleType] = useState('Bicycle');
    const [city, setCity] = useState('');
    
    const { signUp, isLoading, error } = useAuthStore();
    const router = useRouter();

    const nextStep = () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in email and password.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters.');
            return;
        }
        setStep(2);
    };

    const handleSignUp = async () => {
        if (!fullName || !city || !vehicleType) {
            Alert.alert('Error', 'Please fill in all profile fields.');
            return;
        }

        const startTime = Date.now();
        try {
            await signUp(email, password, fullName, vehicleType, city);
            
            // Ensure minimum 3 seconds for animation as requested
            const endTime = Date.now();
            const elapsed = endTime - startTime;
            if (elapsed < 3000) {
                await new Promise(resolve => setTimeout(resolve, 3000 - elapsed));
            }
        } catch (e: any) {
            console.error(e);
        }
    };

    return {
        step,
        setStep,
        fullName,
        setFullName,
        email,
        setEmail,
        password,
        setPassword,
        vehicleType,
        setVehicleType,
        city,
        setCity,
        nextStep,
        handleSignUp,
        isLoading,
        error,
        router,
    };
}