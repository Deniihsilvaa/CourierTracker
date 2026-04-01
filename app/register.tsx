import { useRegister } from '@/src/hooks/useRegister';
import { useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const { 
    step, setStep,
    fullName, setFullName, 
    email, setEmail, 
    password, setPassword,
    vehicleType, setVehicleType,
    city, setCity,
    nextStep,
    handleSignUp, 
    isLoading, 
    error,
    router 
  } = useRegister();

  const vehicleOptions = ['Bicycle', 'Motorcycle', 'Car', 'Truck'];

  // Loading Screen Component
  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-8">
        <StatusBar barStyle="dark-content" />
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: 'timing',
            duration: 500,
          }}
          className="items-center"
        >
          <View className="w-24 h-24 bg-blue-50 rounded-full items-center justify-center mb-6">
            <MotiView
              from={{ rotate: '0deg' }}
              animate={{ rotate: '360deg' }}
              transition={{
                loop: true,
                duration: 2000,
                type: 'timing',
              }}
            >
              <Ionicons name="sync" size={48} color="#007AFF" />
            </MotiView>
          </View>
          
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 300 }}
          >
            <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
              Quase lá!
            </Text>
            <Text className="text-gray-500 text-center text-lg">
              Estamos criando seu perfil, aguarde...
            </Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1000, loop: true, type: 'timing', duration: 1500 }}
            className="mt-8 flex-row"
          >
            {[0, 1, 2].map((i) => (
              <MotiView
                key={i}
                from={{ opacity: 0.3, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1.2 }}
                transition={{
                  type: 'timing',
                  duration: 600,
                  delay: i * 200,
                  loop: true,
                }}
                className="w-2 h-2 rounded-full bg-blue-500 mx-1"
              />
            ))}
          </MotiView>
        </MotiView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="p-8 mt-10">
          {/* Header */}
          <MotiView
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
          >
            <TouchableOpacity 
              onPress={() => router.back()}
              className="mb-6 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              {step === 1 ? 'Criar Conta' : 'Sobre Você'}
            </Text>
            <Text className="text-gray-500 text-lg mb-8">
              {step === 1 
                ? 'Comece sua jornada como entregador' 
                : 'Complete seu perfil para começar'}
            </Text>
          </MotiView>

          {/* Progress Indicator */}
          <View className="flex-row mb-8">
            <View className={`h-1.5 flex-1 rounded-full mr-2 ${step >= 1 ? 'bg-blue-500' : 'bg-gray-200'}`} />
            <View className={`h-1.5 flex-1 rounded-full ${step === 2 ? 'bg-blue-500' : 'bg-gray-200'}`} />
          </View>

          <AnimatePresence exitBeforeEnter>
            {step === 1 ? (
              <MotiView
                key="step1"
                from={{ opacity: 0, translateX: 50 }}
                animate={{ opacity: 1, translateX: 0 }}
                exit={{ opacity: 0, translateX: -50 }}
                transition={{ type: 'timing', duration: 300 }}
              >
                <View className="space-y-4">
                  <View>
                    <Text className="text-gray-600 font-medium mb-2 ml-1">E-mail</Text>
                    <TextInput
                      className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-gray-800"
                      placeholder="seu@email.com"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>

                  <View className="mt-4">
                    <Text className="text-gray-600 font-medium mb-2 ml-1">Senha</Text>
                    <TextInput
                      className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-gray-800"
                      placeholder="••••••••"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>

                  {error ? (
                    <Text className="text-red-500 text-sm text-center mt-4 bg-red-50 p-3 rounded-xl">
                      {error}
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    onPress={nextStep}
                    className="bg-blue-500 p-4 rounded-2xl shadow-blue-200 shadow-lg mt-8 flex-row items-center justify-center"
                  >
                    <Text className="text-white font-bold text-lg mr-2">Próximo</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </MotiView>
            ) : (
              <MotiView
                key="step2"
                from={{ opacity: 0, translateX: 50 }}
                animate={{ opacity: 1, translateX: 0 }}
                exit={{ opacity: 0, translateX: -50 }}
                transition={{ type: 'timing', duration: 300 }}
              >
                <View className="space-y-4">
                  <View>
                    <Text className="text-gray-600 font-medium mb-2 ml-1">Nome Completo</Text>
                    <TextInput
                      className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-gray-800"
                      placeholder="João Silva"
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>

                  <View className="mt-4">
                    <Text className="text-gray-600 font-medium mb-2 ml-1">Cidade</Text>
                    <TextInput
                      className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-gray-800"
                      placeholder="Ex: São Paulo"
                      value={city}
                      onChangeText={setCity}
                    />
                  </View>

                  <View className="mt-4">
                    <Text className="text-gray-600 font-medium mb-2 ml-1">Tipo de Veículo</Text>
                    <View className="flex-row flex-wrap gap-2">
                       {vehicleOptions.map((option) => (
                         <TouchableOpacity
                           key={option}
                           onPress={() => setVehicleType(option)}
                           className={`px-4 py-2 rounded-full border ${vehicleType === option ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-200'}`}
                         >
                           <Text className={`${vehicleType === option ? 'text-white font-bold' : 'text-gray-600'}`}>
                             {option}
                           </Text>
                         </TouchableOpacity>
                       ))}
                    </View>
                  </View>

                  {error ? (
                    <Text className="text-red-500 text-sm text-center mt-4 bg-red-50 p-3 rounded-xl">
                      {error}
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    onPress={handleSignUp}
                    className="bg-blue-600 p-4 rounded-2xl shadow-blue-200 shadow-lg mt-8 items-center"
                  >
                    <Text className="text-white font-bold text-lg">Criar Minha Conta</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setStep(1)}
                    className="p-4 items-center"
                  >
                    <Text className="text-gray-500">Voltar para e-mail</Text>
                  </TouchableOpacity>
                </View>
              </MotiView>
            )}
          </AnimatePresence>

          <View className="mt-10 items-center justify-center flex-row">
            <Text className="text-gray-500">Já tem uma conta?</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-blue-500 font-bold ml-1"> Entre aqui</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}



