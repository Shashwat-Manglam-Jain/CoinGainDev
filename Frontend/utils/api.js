import { Platform } from 'react-native';
//https://coingaindev.onrender.com/fetchdata/admins
//http://192.168.57.1:3000
//http://localhost:3000
//http://192.168.0.103:3000'



const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    // Use your local IP when testing on Android device/emulator
    return 'http://192.168.57.1:3000';
  } else {
    // Web (or iOS Simulator)
    return 'http://localhost:3000';
  }
};

export const API_BASE_URL = getBaseUrl();
