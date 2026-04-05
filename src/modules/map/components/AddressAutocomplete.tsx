import { GlassCard } from "@/components/cards/glass-card";
import { appColors, radius, spacing } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import React, { memo, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { mapboxService } from "../services/mapboxService";
import { AddressSelection, AddressSuggestion } from "../types";

interface AddressAutocompleteProps {
  label: string;
  placeholder: string;
  selectedAddress: AddressSelection | null;
  onSelectAddress: (address: AddressSelection) => void;
  onClearAddress?: () => void;
  editable?: boolean;
}

export const AddressAutocomplete = memo(function AddressAutocomplete({
  label,
  placeholder,
  selectedAddress,
  onSelectAddress,
  onClearAddress,
  editable = true,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(selectedAddress?.full_address ?? "");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setQuery(selectedAddress?.full_address ?? "");
  }, [selectedAddress?.full_address]);

  useEffect(() => {
    if (!editable) {
      return;
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 3) {
      controllerRef.current?.abort();
      setSuggestions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const timeout = setTimeout(() => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setIsLoading(true);
      setError(null);

      void mapboxService
        .searchAddress(trimmedQuery, controller.signal)
        .then((results) => {
          setSuggestions(results);
        })
        .catch((searchError: any) => {
          if (searchError?.name === "AbortError") {
            return;
          }

          setSuggestions([]);
          setError(searchError instanceof Error ? searchError.message : "Nao foi possivel buscar o endereco.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 300);

    return () => {
      clearTimeout(timeout);
    };
  }, [editable, query]);

  const hasSuggestions = suggestions.length > 0;

  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ color: appColors.textSecondary, fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>
        {label}
      </Text>

      <View
        style={{
          minHeight: 56,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: appColors.border,
          backgroundColor: appColors.surface,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.sm,
          gap: spacing.xs,
        }}
      >
        <Ionicons name="search-outline" size={18} color={appColors.textMuted} />
        <TextInput
          value={query}
          onChangeText={(value) => {
            setQuery(value);
            if (!value.trim()) {
              setSuggestions([]);
              onClearAddress?.();
            }
          }}
          editable={editable}
          style={{ flex: 1, color: appColors.textPrimary, fontSize: 16, fontWeight: "600" }}
          placeholder={placeholder}
          placeholderTextColor={appColors.textMuted}
        />
        {isLoading ? <ActivityIndicator size="small" color={appColors.primary} /> : null}
        {selectedAddress && query.trim() ? (
          <Pressable
            onPress={() => {
              setQuery("");
              setSuggestions([]);
              onClearAddress?.();
            }}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={18} color={appColors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={{ color: appColors.danger, fontSize: 13, fontWeight: "700" }}>{error}</Text> : null}

      {hasSuggestions ? (
        <GlassCard style={{ padding: 0, overflow: "hidden" }}>
          {suggestions.map((suggestion, index) => (
            <Pressable
              key={suggestion.id}
              onPress={() => {
                setQuery(suggestion.full_address);
                setSuggestions([]);
                onSelectAddress(suggestion);
              }}
              style={({ pressed }) => ({
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.sm,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: appColors.border,
                backgroundColor: pressed ? "rgba(96, 165, 250, 0.08)" : "transparent",
                gap: 4,
              })}
            >
              <Text style={{ color: appColors.textPrimary, fontSize: 15, fontWeight: "700" }}>
                {suggestion.full_address}
              </Text>
              <Text style={{ color: appColors.textSecondary, fontSize: 13 }}>
                {[suggestion.city, suggestion.state, suggestion.country].filter(Boolean).join(" • ")}
              </Text>
            </Pressable>
          ))}
        </GlassCard>
      ) : null}
    </View>
  );
});
