import { useRef, useState, useCallback } from 'react';
import { Animated, LayoutAnimation } from 'react-native';

export function useBaseCrud() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formExpanded, setFormExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggleForm = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const toExpanded = !formExpanded;
    setFormExpanded(toExpanded);
    Animated.timing(rotateAnim, {
      toValue: toExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [formExpanded, rotateAnim]);

  const startEditBase = useCallback((id: string) => {
    setEditingId(id);
    // If form is expanded, collapse it to focus on editing
    if (formExpanded) {
      toggleForm();
    }
  }, [formExpanded, toggleForm]);

  const cancelEditBase = useCallback(() => {
    setEditingId(null);
  }, []);

  return {
    loading,
    setLoading,
    saving,
    setSaving,
    formExpanded,
    setFormExpanded,
    toggleForm,
    rotateAnim,
    editingId,
    setEditingId,
    startEditBase,
    cancelEditBase
  };
}
