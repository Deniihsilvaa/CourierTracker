
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

import { useAuth } from '@/src/hooks/useAuth';
import { stylesAuth } from '@/src/styles';

export default function LoginScreen() {
  const { email, password, setEmail, setPassword, handleSignIn, handleGoogleSignIn, handleForgotPassword, isLoading, error, handleRegister } = useAuth();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={stylesAuth.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={stylesAuth.scrollContent}>
          <Text style={stylesAuth.title}>RotaPro</Text>

          <View style={stylesAuth.inputContainer}>
            <Text style={stylesAuth.label}>Email Address</Text>
            <TextInput
              style={stylesAuth.input}
              placeholder="email@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={stylesAuth.inputContainer}>
            <Text style={stylesAuth.label}>Password</Text>
            <TextInput
              style={stylesAuth.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error ? <Text style={stylesAuth.errorText}>{error}</Text> : null}

          {isLoading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <View style={stylesAuth.buttonGroup}>
              <Button title="Acessar" onPress={handleSignIn} />

              <View style={stylesAuth.spacer} />

              <Button
                title="Acessar com Google"
                onPress={handleGoogleSignIn}
                color="#DB4437"
              />

              <View style={stylesAuth.spacer} />

              <Text
                style={stylesAuth.registerLink}
                onPress={handleRegister}
              >
                Não tem uma conta? Cadastre-se
              </Text>

              <Text
                style={stylesAuth.forgotPassword}
                onPress={handleForgotPassword}
              >
                Esqueceu a senha?
              </Text>
              <Text style={stylesAuth.subTitle}> desenvolvido por Denilson Silva</Text>
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}


