import { useRegister } from '@/src/hooks/useRegister';
import { stylesRegister } from '@/src/styles';
import {
  ActivityIndicator,
  Button,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View
} from 'react-native';

export default function RegisterScreen() {
  const { fullName, setFullName, email, setEmail, password, setPassword, handleSignUp, isLoading, error, router } = useRegister();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={stylesRegister.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={stylesRegister.scrollContent}>
          <Text style={stylesRegister.title}>Create Account</Text>

          <View style={stylesRegister.inputContainer}>
            <Text style={stylesRegister.label}>Full Name</Text>
            <TextInput
              style={stylesRegister.input}
              placeholder="John Doe"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={stylesRegister.inputContainer}>
            <Text style={stylesRegister.label}>Email Address</Text>
            <TextInput
              style={stylesRegister.input}
              placeholder="email@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={stylesRegister.inputContainer}>
            <Text style={stylesRegister.label}>Password</Text>
            <TextInput
              style={stylesRegister.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error ? <Text style={stylesRegister.errorText}>{error}</Text> : null}

          {isLoading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <View style={stylesRegister.buttonGroup}>
              <Button title="Register" onPress={handleSignUp} />

              <Text
                style={stylesRegister.loginLink}
                onPress={() => router.back()}
              >
                Already have an account? Login
              </Text>
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}


