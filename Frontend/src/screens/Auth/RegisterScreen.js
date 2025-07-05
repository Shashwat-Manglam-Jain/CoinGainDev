import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Dimensions,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import ThemeToggle from '../../components/ThemeToggle';
import { ThemeContext } from '../../ThemeContext';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
import { API_BASE_URL } from '../../../utils/api'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterScreen({ navigation }) {
  const { colors } = useTheme();
  const { isDarkMode } = useContext(ThemeContext);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [location, setLocation] = useState('');
  const [role, setRole] = useState('user');
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

useEffect(() => {
  const fetchAdmins = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/fetchdata/admins`);
      console.log('Fetched admins:', res.data.admins); 

      if (Array.isArray(res.data.admins)) {
        setAdmins(res.data.admins);
      } else {
        setAdmins([]); 
      }
    } catch (err) {
      console.error('Error fetching admins:', err.message);
      setAdmins([]);
    }
  };

  if (role === 'user') {
    fetchAdmins();
  } else {
    setAdmins([]);
  }
}, [role]);

 

const handleRegister = async () => {
  if (!name || !mobile || !password || !confirmPassword || !location) {
    return Toast.show({ type: 'error', text1: 'Please fill all fields.' });
  }

  if (password !== confirmPassword) {
    return Toast.show({ type: 'error', text1: 'Passwords do not match.' });
  }

  setLoading(true);

  try {
    const res = await axios.post(`${API_BASE_URL}/api/auth/register`, {
      name,
      mobile,
      password,
      location,
      role,
      ...(role === 'user' && { adminId: selectedAdmin }),
    });

    const { user, token, message } = res.data;

    // Defensive check
    if (!user || !token) {
      throw new Error('Invalid response from server: user or token missing');
    }

    // Save data consistently with login
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userInfo', JSON.stringify(user));

    Toast.show({ type: 'success', text1: message || 'Registered!' });

    // Optionally navigate to dashboard directly (skip login if token is valid)
    navigation.replace(user.role === 'admin' ? 'AdminDashboard' : 'UserDashboard');

  } catch (err) {
    console.error('Register error:', err.response?.data || err.message);

    Toast.show({
      type: 'error',
      text1: err.response?.data?.message || 'Registration failed.',
    });
  } finally {
    setLoading(false);
  }
};


  const handleLoginRedirect = () => navigation.navigate('Login');

  return ( 
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={[styles.container, { backgroundColor: colors.background }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <ThemeToggle style={styles.toggle} />
          </View>

          <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : colors.text }]}>
            Sign Up
          </Text>

          <TextInput
            label="Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
            theme={{ colors: { text: isDarkMode ? '#FFFFFF' : colors.text, primary: colors.primary } }}
            mode="outlined"
          />

          <TextInput
            label="Mobile Number"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            style={styles.input}
            theme={{ colors: { text: isDarkMode ? '#FFFFFF' : colors.text, primary: colors.primary } }}
            mode="outlined"
          />

       
         <TextInput
  label="Password"
  value={password}
  onChangeText={setPassword}
  secureTextEntry={!showPassword}
  style={styles.input}
  theme={{ colors: { text: isDarkMode ? '#FFFFFF' : colors.text, primary: colors.primary } }}
  mode="outlined"
  right={
    <TextInput.Icon
      icon={showPassword ? 'eye-off' : 'eye'}
      onPress={() => setShowPassword(!showPassword)}
      forceTextInputFocus={false}
    />
  }
/>

<TextInput
  label="Confirm Password"
  value={confirmPassword}
  onChangeText={setConfirmPassword}
  secureTextEntry={!showConfirmPassword}
  style={styles.input}
  theme={{ colors: { text: isDarkMode ? '#FFFFFF' : colors.text, primary: colors.primary } }}
  mode="outlined"
  right={
    <TextInput.Icon
      icon={showConfirmPassword ? 'eye-off' : 'eye'}
      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
      forceTextInputFocus={false}
    />
  }
/>

          <TextInput
            label="Location"
            value={location}
            onChangeText={setLocation}
            style={styles.input}
            theme={{ colors: { text: isDarkMode ? '#FFFFFF' : colors.text, primary: colors.primary } }}
            mode="outlined"
          />

          <View style={[styles.pickerContainer, { backgroundColor: isDarkMode ? '#444' : '#fff' }]}>
            <Picker
              selectedValue={role}
              onValueChange={(itemValue) => setRole(itemValue)}
              style={[styles.picker, { color: isDarkMode ? '#FFFFFF' : colors.text }]}
              dropdownIconColor={isDarkMode ? '#FFFFFF' : colors.text}
            >
              <Picker.Item label="User" value="user" />
              <Picker.Item label="Admin" value="admin" />
            </Picker>
          </View>

          {role === 'user' && (
            <View style={[styles.pickerContainer, { backgroundColor: isDarkMode ? '#444' : '#fff' }]}>
              <Picker
                selectedValue={selectedAdmin}
                onValueChange={(itemValue) => setSelectedAdmin(itemValue)}
                style={[styles.picker, { color: isDarkMode ? '#FFFFFF' : colors.text }]}
                dropdownIconColor={isDarkMode ? '#FFFFFF' : colors.text}
              >
                <Picker.Item label="Select Admin" value="" />
                {admins.map((admin) => (
                  <Picker.Item
                    key={admin._id}
                    label={`${admin.name} (${admin.uniqueCode || 'N/A'})`}
                    value={admin._id}
                  />
                ))}
              </Picker>
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleRegister}
            style={[styles.button]}
            buttonColor={colors.primary}
            textColor={isDarkMode ? '#FFFFFF' : '#FFFFFF'}
            loading={loading}
            disabled={loading}
            elevation={5}
          >
            Register
          </Button>

     <Button
  mode="outlined"
  onPress={handleLoginRedirect}
  style={[
    styles.button,
    {
      borderColor: colors.primary,
      borderWidth: 1.5,
      borderRadius: 16,
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    },
  ]}
  textColor={isDarkMode ? '#FFFFFF' : colors.primary}
  contentStyle={{ flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 8 }}
  labelStyle={{ fontSize: 16, fontWeight: '600', marginRight: 6 }}
  elevation={5}
  icon={({ size, color }) => (
    <Ionicons
      name="log-in-outline"
      size={size}
      color={isDarkMode ? '#FFFFFF' : colors.primary}
      style={{ marginLeft: 10 }}
    />
  )}
>
  Already have an account? Login
</Button>


        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// Your existing styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
  },
  toggle: {
    marginRight: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  input: {
    marginVertical: 10,
    borderRadius: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  eyeIcon: {
    padding: 10,
  },
  pickerContainer: {
    width: '100%',
    borderRadius: 12,
    elevation: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  button: {
    marginVertical: 10,
    borderRadius: 12,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    width: width > 600 ? '40%' : '100%',
    alignSelf: 'center',
  },
});
