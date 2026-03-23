import { StyleSheet } from "react-native";
export const stylesAuth = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
  },
  subTitle: {
    fontSize: 11,
    fontWeight: "100",
    textAlign: "center",
    marginBottom: 5,
    marginTop: 20,
    padding: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: "#333",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  errorText: {
    color: "red",
    marginBottom: 16,
    textAlign: "center",
  },
  buttonGroup: {
    gap: 10,
    marginTop: 10,
  },
  spacer: {
    height: 10,
  },
  registerLink: {
    color: "#007AFF",
    textAlign: "center",
    marginTop: 10,
    textDecorationLine: "underline",
  },
  forgotPassword: {
    color: "#666",
    textAlign: "center",
    marginTop: 15,
    textDecorationLine: "underline",
    fontSize: 12,
  },
});
