import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
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

import { Button } from '@/components/ui/button';
import { useAuth } from '@/src/hooks/useAuth';
import { stylesAuth } from '@/src/styles';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function LoginScreen() {
  const {
    email,
    password,
    setEmail,
    setPassword,
    handleSignIn,
    handleGoogleSignIn,
    handleForgotPassword,
    isLoading,
    error,
    handleRegister
  } = useAuth();

  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={stylesAuth.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={stylesAuth.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="navigate" size={40} color="#2563eb" />
            </View>
            <Text style={stylesAuth.title}>RotaPro</Text>
            <Text style={styles.subtitle}>Sua jornada profissional começa aqui</Text>
          </View>

          <View style={stylesAuth.inputContainer}>
            <Text style={stylesAuth.label}>E-mail</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={[stylesAuth.input, styles.inputReset]}
                placeholder="exemplo@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={stylesAuth.inputContainer}>
            <Text style={stylesAuth.label}>Senha</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={[stylesAuth.input, styles.inputReset]}
                placeholder="Sua senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
            <Text
              style={styles.forgotPasswordSmall}
              onPress={handleForgotPassword}
            >
              Esqueci minha senha
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.buttonActionGroup}>
            <Button
              title="Entrar"
              onPress={handleSignIn}
              loading={isLoading}
              size="lg"
            />

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.divider} />
            </View>

            <Button
              title="Entrar com Google"
              onPress={handleGoogleSignIn}
              variant="outline"
              size="lg"
              leftIcon={<Ionicons name="logo-google" size={20} color="#2563eb" />}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Não tem uma conta?{' '}
              <Text style={styles.link} onPress={handleRegister}>
                Cadastre-se
              </Text>
            </Text>
            <Text style={styles.credits}>Desenvolvido por Denilson Silva</Text>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
