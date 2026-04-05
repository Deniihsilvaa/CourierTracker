import { FloatingActionButton } from "@/components/buttons/floating-action-button";
import { PrimaryButton } from "@/components/buttons/primary-button";
import { GlassCard } from "@/components/cards/glass-card";
import { StatCard } from "@/components/cards/stat-card";
import { AppScreen } from "@/components/layout/app-screen";
import { SectionHeader } from "@/components/layout/section-header";
import { SkeletonCard } from "@/components/skeleton/skeleton-card";
import useIncomesScreen from "@/src/hooks/useIncomesScreen";
import { Income } from "@/src/services/incomes.service";
import { appColors, radius, spacing } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

export default function IncomesScreen() {
  const {
    incomes,
    categories,
    loading,
    saving,
    formExpanded,
    nameFilter,
    setNameFilter,
    dateFilter,
    setDateFilter,
    amount,
    setAmount,
    source,
    setSource,
    description,
    setDescription,
    categoryId,
    setCategoryId,
    dateCompetition,
    setDateCompetition,
    editingId,
    setEditingId,
    editAmount,
    setEditAmount,
    editSource,
    setEditSource,
    editDescription,
    setEditDescription,
    editCategoryId,
    setEditCategoryId,
    editDateCompetition,
    setEditDateCompetition,
    toggleForm,
    handleCreate,
    handleUpdate,
    startEdit,
  } = useIncomesScreen();

  const stats = useMemo(() => {
    const totalAmount = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const average = incomes.length > 0 ? totalAmount / incomes.length : 0;
    return { totalAmount, average, count: incomes.length };
  }, [incomes]);

  return (
    <AppScreen
      title="Receitas"
      subtitle="Registre ganhos com filtros rapidos e edicao inline."
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
        data={incomes}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, gap: spacing.sm }}
        ListHeaderComponent={
          <View style={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {formExpanded ? (
              <GlassCard>
                <SectionHeader title="Nova receita" subtitle="Registre valor, fonte, data e categoria." />
                <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                  {categories.length === 0 ? (
                    <Text style={{ color: appColors.danger, fontSize: 14, fontWeight: "700" }}>
                      Crie categorias de receita primeiro.
                    </Text>
                  ) : (
                    <IncomeForm
                      amount={amount}
                      source={source}
                      description={description}
                      categoryId={categoryId}
                      dateCompetition={dateCompetition}
                      categories={categories}
                      onChangeAmount={setAmount}
                      onChangeSource={setSource}
                      onChangeDescription={setDescription}
                      onChangeCategory={setCategoryId}
                      onChangeDate={setDateCompetition}
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
                icon="wallet-outline"
                tone="success"
              />
              <StatCard label="Lancamentos" value={String(stats.count)} icon="albums-outline" tone="primary" />
            </View>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <StatCard
                label="Media"
                value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.average)}
                icon="analytics-outline"
                tone="warning"
              />
              <StatCard label="Categorias" value={String(categories.length)} icon="layers-outline" tone="danger" />
            </View>

            <GlassCard>
              <SectionHeader title="Filtros" subtitle="Refine por fonte e data para localizar um ganho rapidamente." />
              <View
                style={{
                  marginTop: spacing.sm,
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
                  value={nameFilter}
                  onChangeText={setNameFilter}
                  style={{ flex: 1, color: appColors.textPrimary, fontSize: 16, fontWeight: "600" }}
                  placeholder="Filtrar por fonte ou descricao"
                  placeholderTextColor={appColors.textMuted}
                />
              </View>
              <View
                style={{
                  marginTop: spacing.sm,
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
                <Ionicons name="calendar-outline" size={18} color={appColors.textMuted} />
                <TextInput
                  value={dateFilter}
                  onChangeText={setDateFilter}
                  style={{ flex: 1, color: appColors.textPrimary, fontSize: 16, fontWeight: "600" }}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={appColors.textMuted}
                />
              </View>
            </GlassCard>

            <SectionHeader title="Historico" subtitle="Toque e segure um item para editar rapidamente." />
          </View>
        }
        renderItem={({ item }) =>
          editingId === item.id ? (
            <GlassCard>
              <SectionHeader title="Editar receita" subtitle={item.source || "Registro em edicao"} />
              <View style={{ marginTop: spacing.sm }}>
                <IncomeForm
                  amount={editAmount}
                  source={editSource}
                  description={editDescription}
                  categoryId={editCategoryId}
                  dateCompetition={editDateCompetition}
                  categories={categories}
                  onChangeAmount={setEditAmount}
                  onChangeSource={setEditSource}
                  onChangeDescription={setEditDescription}
                  onChangeCategory={setEditCategoryId}
                  onChangeDate={setEditDateCompetition}
                  onSubmit={handleUpdate}
                  onCancel={() => setEditingId(null)}
                  saving={saving}
                />
              </View>
            </GlassCard>
          ) : (
            <IncomeCard item={item} categories={categories} onLongPress={() => startEdit(item)} />
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
              <Text style={{ color: appColors.textPrimary, fontSize: 20, fontWeight: "800" }}>Nenhuma receita registrada</Text>
              <Text style={{ color: appColors.textSecondary, fontSize: 15, lineHeight: 22 }}>
                Abra o formulario para adicionar a primeira receita do periodo.
              </Text>
            </GlassCard>
          )
        }
      />

      {!formExpanded ? <FloatingActionButton label="Nova receita" icon="add" onPress={toggleForm} /> : null}
    </AppScreen>
  );
}

function IncomeForm({
  amount,
  source,
  description,
  categoryId,
  dateCompetition,
  categories,
  onChangeAmount,
  onChangeSource,
  onChangeDescription,
  onChangeCategory,
  onChangeDate,
  onSubmit,
  onCancel,
  saving = false,
}: {
  amount: string;
  source: string;
  description: string;
  categoryId: string;
  dateCompetition: string;
  categories: Array<{ id: string; name: string }>;
  onChangeAmount: (value: string) => void;
  onChangeSource: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeCategory: (value: string) => void;
  onChangeDate: (value: string) => void;
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
        <FormField label="Fonte" style={{ flex: 2 }}>
          <TextInput
            value={source}
            onChangeText={onChangeSource}
            style={inputStyle}
            placeholder="Ex: iFood, Uber"
            placeholderTextColor={appColors.textMuted}
          />
        </FormField>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <FormField label="Data" style={{ flex: 1 }}>
          <TextInput
            value={dateCompetition}
            onChangeText={onChangeDate}
            style={inputStyle}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={appColors.textMuted}
          />
        </FormField>
        <FormField label="Descricao" style={{ flex: 2 }}>
          <TextInput
            value={description}
            onChangeText={onChangeDescription}
            style={inputStyle}
            placeholder="Descricao opcional"
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
              tone="success"
            />
          ))}
        </View>
      </FormField>

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <PrimaryButton
          label="Salvar receita"
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

function IncomeCard({
  item,
  categories,
  onLongPress,
}: {
  item: Income;
  categories: Array<{ id: string; name: string }>;
  onLongPress: () => void;
}) {
  const categoryName = categories.find((category) => category.id === item.category_id)?.name || "Receita";

  return (
    <Pressable onLongPress={onLongPress} delayLongPress={500}>
      <GlassCard>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }}>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text style={{ color: appColors.textPrimary, fontSize: 18, fontWeight: "800" }}>
              {item.source}
            </Text>
            <Text style={{ color: appColors.success, fontSize: 15, fontWeight: "700" }}>{categoryName}</Text>
            {item.description ? (
              <Text style={{ color: appColors.textSecondary, fontSize: 14 }} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </View>
          <View style={{ alignItems: "flex-end", gap: spacing.xs }}>
            <Text style={{ color: appColors.textPrimary, fontSize: 18, fontWeight: "900" }}>
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.amount)}
            </Text>
            <Text style={{ color: appColors.textMuted, fontSize: 12, fontWeight: "700" }}>
              {new Date(item.date_competition).toLocaleDateString("pt-BR")}
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
