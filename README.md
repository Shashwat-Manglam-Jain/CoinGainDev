# CoinGain-App

## Overview

**CoinGain-App** is a cross-platform React Native application designed to manage a coin-based reward system, allowing users to earn, spend, and manage coins through a user-friendly interface. Built with React Native and Expo, it supports iOS, Android, and web platforms. Key features include user management, coin transactions, reward creation and redemption, notifications, and analytics, all integrated with a backend API. The app supports a dark/light theme toggle and is optimized for both mobile and web experiences.

---

## Features

- 🔐 **Authentication**: Secure login using JWT, stored via AsyncStorage.
- 👤 **User Management**: Search, view, edit, and delete user profiles (name, mobile, location, unique code).
- 💰 **Coin Transactions**: Earn, send, or spend coins using user ID, name, mobile, or unique code.
- 🎁 **Reward Management**: Create, edit, or delete rewards with name, price, points, and image (max 5MB).
- 🔄 **Redemption Requests**: Admin approval or rejection for user reward redemption.
- 🔔 **Notifications**: View and clear user/system notifications.
- 📊 **Analytics Dashboard**: View total users, coins sent, pending redemptions, etc.
- 🌓 **Theme Support**: Toggle between dark and light modes.
- 🎠 **Reward Carousel**: Auto-scrolling reward gallery, pausable on touch.
- 📱💻 **Cross-Platform**: Optimized UI for mobile (iOS/Android) and web.

---

## Tech Stack

| Layer       | Technology |
|-------------|-------------|
| Frontend    | React Native, Expo, React Native Paper |
| Backend     | Node.js, Express.js, MongoDB |
| Storage     | AsyncStorage (client), MongoDB (server) |
| API Calls   | Axios |
| UI/UX       | React Native StyleSheet with dynamic theming |
| Icons       | `@expo/vector-icons` (MaterialIcons, MaterialCommunityIcons) |

### Key Dependencies

- `react-native`
- `react-native-paper`
- `@react-native-async-storage/async-storage`
- `expo`
- `expo-document-picker`
- `axios`
- `mongoose`
- `jsonwebtoken`
- `bcryptjs`
- `multer` (for image uploads)

---

## Prerequisites

- ✅ Node.js (v16 or higher)
- ✅ npm or Yarn
- ✅ Expo CLI: `npm install -g expo-cli`
- ✅ MongoDB database
- ✅ Android Studio or Xcode for mobile testing
- ✅ Modern browser for web

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/opticosolution/CoinGainDev
cd CoinGain-App
