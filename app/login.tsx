import { useAuthStore } from '@/src/modules/auth/store';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, signInWithGoogle, resetPassword, isLoading, error } = useAuthStore();
  const router = useRouter();

  const handleSignIn = async () => {
    try {
      await signIn(email, password);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Courier Tracker</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="email@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {isLoading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <View style={styles.buttonGroup}>
              <Button title="Login" onPress={handleSignIn} />

              <View style={styles.spacer} />

              <Button
                title="Login with Google"
                onPress={handleGoogleSignIn}
                color="#DB4437"
              />

              <View style={styles.spacer} />

              <Text
                style={styles.registerLink}
                onPress={() => router.push('/register' as any)}
              >
                Não tem uma conta? Cadastre-se
              </Text>

              <Text
                style={styles.forgotPassword}
                onPress={handleForgotPassword}
              >
                Esqueceu a senha?
              </Text>
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
    gap: 10,
    marginTop: 10,
  },
  spacer: {
    height: 10,
  },
  registerLink: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 10,
    textDecorationLine: 'underline',
  },
  forgotPassword: {
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
    textDecorationLine: 'underline',
    fontSize: 12,
  }
});
