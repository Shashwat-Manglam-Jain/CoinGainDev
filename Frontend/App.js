import "react-native-gesture-handler";
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Provider as PaperProvider } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, View } from "react-native";

import { ThemeContext, LightTheme, DarkModeTheme } from "./src/ThemeContext";
import LoginScreen from "./src/screens/Auth/LoginScreen";
import RegisterScreen from "./src/screens/Auth/RegisterScreen";
import UserDashboard from "./src/screens/User/UserDashboard";
import AdminDashboard from "./src/screens/Admin/AdminDashboard";
import Toast from "react-native-toast-message";
import SuccessScreen from "./src/screens/animation/SuccessScreen";
import ReceiverSuccess from "./src/screens/animation/RecieverSuccess";
import SuperAdminDashboard from "./src/screens/SuperAdmin/SuperAdminDashboard";

const Stack = createStackNavigator();

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = isDarkMode ? DarkModeTheme : LightTheme;

  const [initialRoute, setInitialRoute] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const userInfo = await AsyncStorage.getItem("userInfo");
        const parsedUser = JSON.parse(userInfo);

        if (token && parsedUser?.role === "admin") {
          setInitialRoute("AdminDashboard");
        } else if (token && parsedUser?.role === "user") {
          setInitialRoute("UserDashboard");
        } else if (
          token &&
          (parsedUser?.role === "SuperAdmin" ||
            parsedUser?.role === "superadmin")
        ) {
          setInitialRoute("SuperAdminDashboard");
        } else {
          setInitialRoute("Login");
        }
      } catch (e) {
        console.error("Error checking login status:", e);
        setInitialRoute("Login");
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <ThemeContext.Provider
        value={{
          isDarkMode,
          toggleTheme: () => setIsDarkMode((prev) => !prev),
          theme,
        }}
      >
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{
              headerShown: false,
              animationEnabled: true,
              animationTypeForReplace: "push",
              cardStyleInterpolator: ({ current }) => ({
                cardStyle: {
                  transform: [
                    {
                      translateY: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [300, 0],
                      }),
                    },
                  ],
                },
              }),
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="UserDashboard" component={UserDashboard} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
            <Stack.Screen
              name="SuperAdminDashboard"
              component={SuperAdminDashboard}
            />
            <Stack.Screen
              name="SuccessScreen"
              component={SuccessScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ReceiverSuccess"
              component={ReceiverSuccess}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <Toast />
      </ThemeContext.Provider>
    </PaperProvider>
  );
}
