import { Button } from '@/components/ui/button';
import { useAuth } from '@/src/hooks/useAuth';
import { stylesAuth } from '@/src/styles';
import { stylesLogin as styles } from '@/src/styles/auth/login/login.style';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View
} from 'react-native';
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
    handleRegister,
    user,
    showPassword,
    setShowPassword
  } = useAuth();

  // Se estiver carregando inicialmente ou se já houver um usuário (aguardando redirecionamento do RootLayout)
  if (isLoading && !email && !password) {
    return (
      <View style={[stylesAuth.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={[stylesAuth.label, { marginTop: 16 }]}>Verificando acesso...</Text>
      </View>
    );
  }

  if (user) {
    return (
      <View style={[stylesAuth.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="checkmark-circle" size={60} color="#10b981" />
        <Text style={[stylesAuth.title, { marginTop: 16 }]}>Bem-vindo de volta!</Text>
        <Text style={stylesAuth.label}>Redirecionando...</Text>
      </View>
    );
  }


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

