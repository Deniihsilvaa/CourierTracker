import { FloatingActionButton } from "@/components/buttons/floating-action-button";
import { PrimaryButton } from "@/components/buttons/primary-button";
import { GlassCard } from "@/components/cards/glass-card";
import { StatCard } from "@/components/cards/stat-card";
import { AppScreen } from "@/components/layout/app-screen";
import { SectionHeader } from "@/components/layout/section-header";
import { SkeletonCard } from "@/components/skeleton/skeleton-card";
import useExpensesScreen from "@/src/hooks/useExpensesScreen";
import { Expense } from "@/src/services/expenses.service";
import { appColors, radius, spacing } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

export default function ExpensesScreen() {
  const {
    expenses,
    categories,
    loading,
    saving,
    formExpanded,
    amount,
    setAmount,
    description,
    setDescription,
    categoryTypeId,
    setCategoryTypeId,
    editingId,
    setEditingId,
    editAmount,
    setEditAmount,
    editDescription,
    setEditDescription,
    editCategoryTypeId,
    setEditCategoryTypeId,
    toggleForm,
    handleCreate,
    handleUpdate,
    startEdit,
  } = useExpensesScreen();

  const stats = useMemo(() => {
    const totalAmount = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const average = expenses.length > 0 ? totalAmount / expenses.length : 0;
    return { totalAmount, average, count: expenses.length };
  }, [expenses]);

  return (
    <AppScreen
      title="Despesas"
      subtitle="Controle os custos operacionais com cadastro rapido e edicao inline."
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
        data={expenses}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, gap: spacing.sm }}
        ListHeaderComponent={
          <View style={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {formExpanded ? (
              <GlassCard>
                <SectionHeader title="Nova despesa" subtitle="Registre valor, descricao e categoria do gasto." />
                <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                  {categories.length === 0 ? (
                    <Text style={{ color: appColors.danger, fontSize: 14, fontWeight: "700" }}>
                      Crie categorias de despesa primeiro.
                    </Text>
                  ) : (
                    <ExpenseForm
                      amount={amount}
                      description={description}
                      categoryId={categoryTypeId}
                      categories={categories}
                      onChangeAmount={setAmount}
                      onChangeDescription={setDescription}
                      onChangeCategory={setCategoryTypeId}
                      onSubmit={handleCreate}
                      saving={saving}
                    />
                  )}
                </View>
              </GlassCard>
            ) : null}

            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <StatCard
                label="Total"
                value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.totalAmount)}
                icon="trending-down-outline"
                tone="danger"
              />
              <StatCard label="Lancamentos" value={String(stats.count)} icon="albums-outline" tone="warning" />
            </View>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <StatCard
                label="Media"
                value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.average)}
                icon="analytics-outline"
                tone="primary"
              />
              <StatCard label="Categorias" value={String(categories.length)} icon="layers-outline" tone="success" />
            </View>

            <SectionHeader title="Historico" subtitle="Toque e segure um item para editar rapidamente." />
          </View>
        }
        renderItem={({ item }) =>
          editingId === item.id ? (
            <GlassCard>
              <SectionHeader title="Editar despesa" subtitle={item.category || "Registro em edicao"} />
              <View style={{ marginTop: spacing.sm }}>
                <ExpenseForm
                  amount={editAmount}
                  description={editDescription}
                  categoryId={editCategoryTypeId}
                  categories={categories}
                  onChangeAmount={setEditAmount}
                  onChangeDescription={setEditDescription}
                  onChangeCategory={setEditCategoryTypeId}
                  onSubmit={handleUpdate}
                  onCancel={() => setEditingId(null)}
                  saving={saving}
                />
              </View>
            </GlassCard>
          ) : (
            <ExpenseCard item={item} onLongPress={() => startEdit(item)} />
          )
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: spacing.sm }}>
              <SkeletonCard height={116} />
              <SkeletonCard height={116} />
              <SkeletonCard height={116} />
            </View>
          ) : (
            <GlassCard>
              <Text style={{ color: appColors.textPrimary, fontSize: 20, fontWeight: "800" }}>Nenhuma despesa registrada</Text>
              <Text style={{ color: appColors.textSecondary, fontSize: 15, lineHeight: 22 }}>
                Abra o formulario para adicionar o primeiro custo operacional.
              </Text>
            </GlassCard>
          )
        }
      />

      {!formExpanded ? <FloatingActionButton label="Nova despesa" icon="add" onPress={toggleForm} /> : null}
    </AppScreen>
  );
}

function ExpenseForm({
  amount,
  description,
  categoryId,
  categories,
  onChangeAmount,
  onChangeDescription,
  onChangeCategory,
  onSubmit,
  onCancel,
  saving = false,
}: {
  amount: string;
  description: string;
  categoryId: string;
  categories: Array<{ id: string; name: string }>;
  onChangeAmount: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeCategory: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  saving?: boolean;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <FormField label="Valor" style={{ flex: 1 }}>
          <TextInput
            value={amount}
            onChangeText={onChangeAmount}
            style={inputStyle}
            placeholder="0.00"
            keyboardType="numeric"
            placeholderTextColor={appColors.textMuted}
          />
        </FormField>
        <FormField label="Descricao" style={{ flex: 2 }}>
          <TextInput
            value={description}
            onChangeText={onChangeDescription}
            style={inputStyle}
            placeholder="Descricao da despesa"
            placeholderTextColor={appColors.textMuted}
          />
        </FormField>
      </View>

      <FormField label="Categoria">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              label={category.name}
              active={categoryId === category.id}
              onPress={() => onChangeCategory(category.id)}
              tone="danger"
            />
          ))}
        </View>
      </FormField>

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <PrimaryButton
          label="Salvar despesa"
          onPress={onSubmit}
          loading={saving}
          variant="danger"
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

function ExpenseCard({ item, onLongPress }: { item: Expense; onLongPress: () => void }) {
  return (
    <Pressable onLongPress={onLongPress} delayLongPress={500}>
      <GlassCard>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }}>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text style={{ color: appColors.textPrimary, fontSize: 18, fontWeight: "800" }}>
              {item.description || "Despesa"}
            </Text>
            <Text style={{ color: appColors.danger, fontSize: 15, fontWeight: "700" }}>{item.category}</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: spacing.xs }}>
            <Text style={{ color: appColors.textPrimary, fontSize: 18, fontWeight: "900" }}>
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.amount)}
            </Text>
            <Text style={{ color: appColors.textMuted, fontSize: 12, fontWeight: "700" }}>
              {new Date(item.created_at).toLocaleDateString("pt-BR")}
            </Text>
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

function CategoryChip({
  label,
  active,
  onPress,
  tone,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  tone: "danger" | "success";
}) {
  const color = tone === "danger" ? appColors.danger : appColors.success;
  return (
    <Pressable
      onPress={onPress}
      style={{
        minHeight: 40,
        borderRadius: radius.pill,
        paddingHorizontal: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? color : appColors.surface,
        borderWidth: 1,
        borderColor: active ? color : appColors.border,
      }}
    >
      <Text style={{ color: appColors.textPrimary, fontWeight: "700", fontSize: 12 }}>{label}</Text>
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
