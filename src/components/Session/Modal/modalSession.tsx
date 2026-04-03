import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type ModalSessionProps = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ModalSession = ({ visible, onConfirm, onCancel }: ModalSessionProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Confirmar exclusão</Text>

          <Text style={styles.message}>
            Deseja realmente deletar esta rota?
          </Text>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={onConfirm}>
              <Text style={styles.deleteText}>Deletar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  message: {
    fontSize: 16,
    marginBottom: 20,
  },

  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },

  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#e5e5e5",
  },

  deleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#ef4444",
  },

  cancelText: {
    fontWeight: "600",
  },

  deleteText: {
    color: "#fff",
    fontWeight: "600",
  },
});