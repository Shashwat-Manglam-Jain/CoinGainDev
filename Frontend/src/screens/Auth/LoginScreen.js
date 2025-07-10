import React, { useState, useContext } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  useTheme,
  IconButton,
} from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import ThemeToggle from "../../components/ThemeToggle";
import { ThemeContext } from "../../ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import { API_BASE_URL } from '../../../utils/api'; 



export default function LoginScreen({ navigation }) {
  const { colors } = useTheme();
  const { isDarkMode } = useContext(ThemeContext);

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle Back Button
  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
        Alert.alert("Exit App", "Do you really want to exit?", [
          { text: "Cancel", style: "cancel" },
          { text: "OK", onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      });

      return () => backHandler.remove();
    }, [])
  );

const handleLogin = async () => {
  setError("");
  setLoading(true);

  try {
   
    const res = await axios.get(`${API_BASE_URL}/superadmin/getSuperAdmin`);

    if (res.data?.superadmin) {
      const data = res.data.superadmin;
console.log(data);

    if (
  data.role === "superadmin" &&
  data.mobile === mobile &&
  data.plainPassword === password
)
 {
        const token = `${mobile}${password}${Date.now()}`;
        const user = {
          id: data._id,
          name: data.name,
          mobile: data.mobile,
          location: data.location,
          role: data.role,
          Joined: data.createdAt
            ? new Date(data.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "Unknown",
        };

        await AsyncStorage.setItem("userToken", token);
        await AsyncStorage.setItem("userInfo", JSON.stringify(user));

        Toast.show({ type: "success", text1: "SuperAdmin login successful!" });
        navigation.replace("SuperAdminDashboard");
        return;
      }
    }

    // Normal Login fallback
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      mobile,
      password,
      role,
    });

    const { token, user } = response.data;

    await AsyncStorage.setItem("userToken", token);
    await AsyncStorage.setItem("userInfo", JSON.stringify(user));

    Toast.show({ type: "success", text1: "Login successful!" }); 

    navigation.replace(
      user.role === "admin" ? "AdminDashboard" : "UserDashboard"
    );
  } catch (err) {
    const message =
      err.response?.data?.message || "Login failed. Please try again.";
    setError(message);
    Toast.show({ type: "error", text1: "Login Failed", text2: message });
  } finally {
    setLoading(false);
  }
};


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ThemeToggle style={styles.toggle} />

      <Text style={[styles.title, { color: isDarkMode ? "#FFFFFF" : colors.text }]}>
        Sign In
      </Text>

      <TextInput
        label="Mobile Number"
        value={mobile}
        onChangeText={setMobile}
        style={styles.input}
        theme={{
          colors: {
            text: isDarkMode ? "#FFFFFF" : colors.text,
            primary: colors.primary,
          },
        }}
        mode="outlined"
        keyboardType="phone-pad"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          style={[styles.input, styles.passwordInput]}
          theme={{
            colors: {
              text: isDarkMode ? "#FFFFFF" : colors.text,
              primary: colors.primary,
            },
          }}
          mode="outlined"
        />
        <IconButton
          icon={showPassword ? "eye-off" : "eye"}
          color={isDarkMode ? "#FFFFFF" : colors.text}
          size={24}
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
        />
      </View>

      <View style={[styles.pickerContainer, { backgroundColor: isDarkMode ? "#444" : "#fff" }]}>
        <Picker
          selectedValue={role}
          onValueChange={setRole}
          style={[styles.picker, { color: isDarkMode ? "#FFFFFF" : colors.text }]}
          dropdownIconColor={isDarkMode ? "#FFFFFF" : colors.text}
        >
          <Picker.Item label="User" value="user" />
          <Picker.Item label="Admin" value="admin" />
        </Picker>
      </View>

      {!!error && (
        <Text style={[styles.error, { color: isDarkMode ? "#FF5555" : colors.error }]}>
          {error}
        </Text>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loading} />
      ) : (
        <>
          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            buttonColor={colors.primary}
            textColor={isDarkMode ? "#FFFFFF" : "white"}
            elevation={5}
          >
            Login
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate("Register")}
            style={[styles.button, styles.registerButton]}
            textColor={colors.primary}
            labelStyle={{ fontWeight: "bold", fontSize: 16 }}
            icon="account-plus"
          >
            New Here? Create Account
          </Button>
        </>
      )}
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  toggle: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  title: {
    fontSize: 45,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  input: {
    marginVertical: 15,
    backgroundColor: "transparent",
    borderRadius: 8,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  passwordInput: {
    flex: 1,
  },
  eyeIcon: {
    position: "absolute",
    right: 10,
  },
  pickerContainer: {
    width: "100%",
    borderRadius: 12,
    elevation: 4,
    marginVertical: 15,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  button: {
    marginVertical: 15,
    borderRadius: 12,
    paddingVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  error: {
    textAlign: "center",
    marginVertical: 10,
    fontSize: 16,
    fontWeight: "500",
  },
  loading: {
    marginVertical: 20,
  },
});