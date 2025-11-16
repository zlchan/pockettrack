import { StyleSheet, Platform, StatusBar } from "react-native";
import { theme } from "../constants/theme";

export default StyleSheet.create({
  AndroidSafeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
});
