import { useAuthStore } from '@/src/modules/auth/store';
import { requestNotificationPermissions } from '@/src/utils/notification-permissions';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

export function useAuth() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { signIn, signInWithGoogle, resetPassword, isLoading, error, user, checkSession } = useAuthStore();
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);

    const handleSignIn = async () => {
        try {
            await signIn(email, password);
            void requestNotificationPermissions();
        } catch (e: any) {
            console.error(e);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            void requestNotificationPermissions();
        } catch (e: any) {
            Alert.alert('Error', e.message);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address first.');
            return;
        }
        try {
            await resetPassword(email);
            Alert.alert('Success', 'Password reset email sent!');
        } catch (e: any) {
            Alert.alert('Error', e.message);
        }
    };

    const handleRegister = () => {
        router.push('/register' as any);
    };

    return {
        email,
        password,
        handleSignIn,
        handleGoogleSignIn,
        handleForgotPassword,
        handleRegister,
        isLoading,
        error,
        user,
        checkSession,
        setEmail,
        setPassword,
        showPassword,
        setShowPassword
    }
}
