import { Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { stylesModal } from '@/src/styles/modal.style';

export default function ModalScreen() {
  return (
    <ThemedView style={stylesModal.container}>
      <ThemedText type="title">This is a modal</ThemedText>
      <Link href="/" asChild>
        <ThemedText type="link">Go to home screen</ThemedText>
      </Link>
    </ThemedView>
  );
}

