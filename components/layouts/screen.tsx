import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export interface ScreenProps {
  children: React.ReactNode;
  title?: string;
  scrollable?: boolean;
  safe?: boolean;
  style?: any;
  contentContainerStyle?: any;
  header?: React.ReactNode;
}

export const Screen = ({
  children,
  title,
  scrollable = true,
  safe = true,
  style,
  contentContainerStyle,
  header,
}: ScreenProps) => {
  const Container = safe ? SafeAreaView : View;
  const ContentWrapper = scrollable ? ScrollView : View;

  return (
    <View style={[styles.base, style]}>
      <StatusBar style="auto" />
      <Container style={styles.container}>
        {header}
        <ContentWrapper
          style={styles.contentWrapper}
          contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
        >
          {children}
        </ContentWrapper>
      </Container>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
});
