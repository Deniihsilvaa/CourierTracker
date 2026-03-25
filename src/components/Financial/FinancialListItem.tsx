import React from 'react';
import {
  Text,
  View,
  TouchableWithoutFeedback,
} from 'react-native';
import { crudStyles as styles } from '@/src/styles';

interface FinancialListItemProps {
  title: string;
  titleExtra?: React.ReactNode;
  subtitle: string;
  description?: string;
  amount?: number;
  date?: string;
  amountColor?: string;
  isEditing?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  renderEditForm?: React.ReactNode;
  rightElement?: React.ReactNode;
  theme: any;
  isDark: boolean;
}

export const FinancialListItem: React.FC<FinancialListItemProps> = ({
  title,
  titleExtra,
  subtitle,
  description,
  amount,
  date,
  amountColor,
  isEditing,
  onPress,
  onLongPress,
  renderEditForm,
  rightElement,
  theme,
  isDark,
}) => {
  const borderColor = isDark ? '#333' : '#e0e0e0';
  const subtleBg = isDark ? '#252525' : '#fafafa';

  return (
    <TouchableWithoutFeedback onPress={onPress} onLongPress={onLongPress} delayLongPress={600}>
      <View
        style={[
          styles.listItem,
          {
            backgroundColor: isEditing ? (isDark ? '#2a2a3a' : '#eef2ff') : subtleBg,
            borderColor: isEditing ? theme.tint : borderColor,
          },
        ]}
      >
        {isEditing ? (
          renderEditForm
        ) : (
          <>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>
                  {title}
                </Text>
                {titleExtra}
              </View>
              <Text style={[styles.itemCat, { color: amountColor || theme.tint, fontWeight: '700' }]}>
                {subtitle}
              </Text>
              {!!description && (
                <Text style={[styles.itemDesc, { color: theme.text + '60' }]} numberOfLines={1}>
                  {description}
                </Text>
              )}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {rightElement ? (
                rightElement
              ) : (
                <>
                  {amount !== undefined && (
                    <Text style={[styles.itemAmount, { color: amountColor || theme.text }]}>
                      R$ {amount.toFixed(2)}
                    </Text>
                  )}
                  {date && (
                    <Text style={[styles.itemDate, { color: theme.text + '40' }]}>
                      {new Date(date).toLocaleDateString()}
                    </Text>
                  )}
                </>
              )}
            </View>
          </>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};
