import { FloatingActionButton } from "@/components/buttons/floating-action-button";
import { PrimaryButton } from "@/components/buttons/primary-button";
import { GlassCard } from "@/components/cards/glass-card";
import { StatCard } from "@/components/cards/stat-card";
import { AppScreen } from "@/components/layout/app-screen";
import { SectionHeader } from "@/components/layout/section-header";
import { SkeletonCard } from "@/components/skeleton/skeleton-card";
import useCategoriesScreen from "@/src/hooks/useCategoriesScreen";
import { CategoryType, CategoryTypeType } from "@/src/services/categoryTypes.service";
import { appColors, radius, spacing } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

const TYPE_OPTIONS: { label: string; value: CategoryTypeType }[] = [
  { label: "Despesa", value: "expenses" },
  { label: "Receita", value: "incomes" },
];

export default function CategoriesScreen() {
  const {
    categories,
    loading,
    saving,
    formExpanded,
    name,
    setName,
    description,
    setDescription,
    type,
    setType,
    editingId,
    setEditingId,
    editName,
    setEditName,
    editDescription,
    setEditDescription,
    editType,
    setEditType,
    toggleForm,
    handleCreate,
    handleUpdate,
    startEdit,
    cancelEdit,
  } = useCategoriesScreen();

  const grouped = useMemo(() => {
    const expenses = categories.filter((item) => item.type === "expenses");
    const incomes = categories.filter((item) => item.type === "incomes");
    return { expenses, incomes };
  }, [categories]);

  const orderedCategories = useMemo(
    () => [...grouped.incomes, ...grouped.expenses],
    [grouped]
  );

  return (
    <AppScreen
      title="Categorias"
      subtitle="Organize receitas e despesas com grupos claros para evitar erro de classificacao."
      scrollable={false}
      rightSlot={
        <PrimaryButton
          label={formExpanded ? "Fechar" : "Nova"}
          onPress={toggleForm}
          variant={formExpanded ? "ghost" : "secondary"}
          icon={<Ionicons name={formExpanded ? "close-outline" : "add-outline"} size={18} color={appColors.textPrimary} />}
        />
      }
    >
      <FlatList
        data={orderedCategories}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, gap: spacing.sm }}
        ListHeaderComponent={
          <View style={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {formExpanded ? (
              <GlassCard>
                <SectionHeader title="Nova categoria" subtitle="Defina nome, descricao e o grupo correto: receita ou despesa." />
                <View style={{ marginTop: spacing.sm }}>
                  <CategoryForm
                    name={name}
                    description={description}
                    type={type}
                    onChangeName={setName}
                    onChangeDescription={setDescription}
                    onChangeType={setType}
                    onSubmit={handleCreate}
                    saving={saving}
                  />
                </View>
              </GlassCard>
            ) : null}

            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <StatCard label="Total" value={String(categories.length)} icon="layers-outline" tone="primary" />
              <StatCard label="Receitas" value={String(grouped.incomes.length)} icon="wallet-outline" tone="success" />
            </View>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <StatCard label="Despesas" value={String(grouped.expenses.length)} icon="receipt-outline" tone="danger" />
              <StatCard label="Separacao" value="2 grupos" icon="git-branch-outline" tone="warning" />
            </View>

            <SectionHeader title="Categorias de receita" subtitle="Usadas para identificar entradas financeiras." />
          </View>
        }
        renderItem={({ item, index }) => {
          const cards: React.ReactNode[] = [];

          if (item.type === "incomes") {
            cards.push(
              editingId === item.id ? (
                <GlassCard key={`edit-${item.id}`}>
                  <SectionHeader title="Editar categoria de receita" subtitle={item.name} />
                  <View style={{ marginTop: spacing.sm }}>
                    <CategoryForm
                      name={editName}
                      description={editDescription}
                      type={editType}
                      onChangeName={setEditName}
                      onChangeDescription={setEditDescription}
                      onChangeType={setEditType}
                      onSubmit={handleUpdate}
                      onCancel={cancelEdit}
                      saving={saving}
                    />
                  </View>
                </GlassCard>
              ) : (
                <CategoryCard key={item.id} item={item} onLongPress={() => startEdit(item)} />
              )
            );
          }

          const isLastIncome = item.type === "incomes" && index === grouped.incomes.length - 1;
          if (isLastIncome) {
            cards.push(
              <View key="expenses-header" style={{ marginTop: spacing.xs }}>
                <SectionHeader
                  title="Categorias de despesa"
                  subtitle="Usadas para classificar custos e saidas operacionais."
                />
              </View>
            );
          }

          if (item.type === "expenses") {
            cards.push(
              editingId === item.id ? (
                <GlassCard key={`edit-${item.id}`}>
                  <SectionHeader title="Editar categoria de despesa" subtitle={item.name} />
                  <View style={{ marginTop: spacing.sm }}>
                    <CategoryForm
                      name={editName}
                      description={editDescription}
                      type={editType}
                      onChangeName={setEditName}
                      onChangeDescription={setEditDescription}
                      onChangeType={setEditType}
                      onSubmit={handleUpdate}
                      onCancel={cancelEdit}
                      saving={saving}
                    />
                  </View>
                </GlassCard>
              ) : (
                <CategoryCard key={item.id} item={item} onLongPress={() => startEdit(item)} />
              )
            );
          }

          return <View style={{ gap: spacing.sm }}>{cards}</View>;
        }}
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: spacing.sm }}>
              <SkeletonCard height={112} />
              <SkeletonCard height={112} />
              <SkeletonCard height={112} />
            </View>
          ) : (
            <GlassCard>
              <Text style={{ color: appColors.textPrimary, fontSize: 20, fontWeight: "800" }}>Nenhuma categoria criada</Text>
              <Text style={{ color: appColors.textSecondary, fontSize: 15, lineHeight: 22 }}>
                Abra o formulario para criar grupos separados de receitas e despesas.
              </Text>
            </GlassCard>
          )
        }
      />

      {!formExpanded ? <FloatingActionButton label="Nova categoria" icon="add" onPress={toggleForm} /> : null}
    </AppScreen>
  );
}

function CategoryForm({
  name,
  description,
  type,
  onChangeName,
  onChangeDescription,
  onChangeType,
  onSubmit,
  onCancel,
  saving = false,
}: {
  name: string;
  description: string;
  type: CategoryTypeType;
  onChangeName: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeType: (value: CategoryTypeType) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  saving?: boolean;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <FormField label="Nome" style={{ flex: 1 }}>
          <TextInput
            value={name}
            onChangeText={onChangeName}
            style={inputStyle}
            placeholder="Nome da categoria"
            placeholderTextColor={appColors.textMuted}
          />
        </FormField>
        <FormField label="Descricao" style={{ flex: 1 }}>
          <TextInput
            value={description}
            onChangeText={onChangeDescription}
            style={inputStyle}
            placeholder="Descricao opcional"
            placeholderTextColor={appColors.textMuted}
          />
        </FormField>
      </View>

      <FormField label="Grupo">
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {TYPE_OPTIONS.map((option) => (
            <TypeChip
              key={option.value}
              label={option.label}
              active={type === option.value}
              value={option.value}
              onPress={() => onChangeType(option.value)}
            />
          ))}
        </View>
      </FormField>

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <PrimaryButton
          label="Salvar categoria"
          onPress={onSubmit}
          loading={saving}
          icon={<Ionicons name="checkmark-outline" size={18} color={appColors.white} />}
        />
        {onCancel ? (
          <PrimaryButton
            label="Cancelar"
            onPress={onCancel}
            variant="ghost"
            icon={<Ionicons name="close-outline" size={18} color={appColors.textPrimary} />}
          />
        ) : null}
      </View>
    </View>
  );
}

function CategoryCard({
  item,
  onLongPress,
}: {
  item: CategoryType;
  onLongPress: () => void;
}) {
  const tone = item.type === "expenses" ? appColors.danger : appColors.success;
  const label = item.type === "expenses" ? "Despesa" : "Receita";

  return (
    <Pressable onLongPress={onLongPress} delayLongPress={500}>
      <GlassCard>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }}>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text style={{ color: appColors.textPrimary, fontSize: 18, fontWeight: "800" }}>{item.name}</Text>
            <Text style={{ color: appColors.textSecondary, fontSize: 14 }}>
              {item.description || "Sem descricao"}
            </Text>
          </View>
          <View
            style={{
              alignSelf: "flex-start",
              borderRadius: radius.pill,
              paddingHorizontal: 10,
              paddingVertical: 6,
              backgroundColor: `${tone}22`,
              borderWidth: 1,
              borderColor: tone,
            }}
          >
            <Text style={{ color: tone, fontSize: 12, fontWeight: "800" }}>{label}</Text>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

function FormField({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View style={[{ gap: spacing.xs }, style]}>
      <Text style={{ color: appColors.textSecondary, fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>{label}</Text>
      {children}
    </View>
  );
}

function TypeChip({
  label,
  active,
  value,
  onPress,
}: {
  label: string;
  active: boolean;
  value: CategoryTypeType;
  onPress: () => void;
}) {
  const color = value === "expenses" ? appColors.danger : appColors.success;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 52,
        borderRadius: radius.lg,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? color : appColors.surface,
        borderWidth: 1,
        borderColor: active ? color : appColors.border,
      }}
    >
      <Text style={{ color: appColors.textPrimary, fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
}

const inputStyle = {
  backgroundColor: appColors.surface,
  borderColor: appColors.border,
  borderWidth: 1,
  borderRadius: radius.lg,
  color: appColors.textPrimary,
  fontSize: 16,
  minHeight: 56,
  paddingHorizontal: spacing.sm,
  paddingVertical: 14,
} as const;
