import React, { useState, useContext, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, Modal, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, Button, Badge } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { ThemeContext } from '../../ThemeContext';
import Profile from './Profile';
import Rewards from './Rewards';
import History from './History';
import Notifications from './Notifications';
import Redemption from './Redemption';
import styles, { ButtonText } from './styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { listenToNotifications, registerUser } from '../../../utils/socket';
import { API_BASE_URL } from '../../../utils/api';
import axios from 'axios';

const UserDashboard = () => {
  const { colors } = useTheme();
  const { isDarkMode } = useContext(ThemeContext);
  const [currentTab, setCurrentTab] = useState('profile');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalAction, setModalAction] = useState(null);
 const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [notification, setNotification] = useState(null);
  const [showLottie, setShowLottie] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    if (!user?._id) return;

    registerUser(user._id);

    const unsubscribe = listenToNotifications((data) => {
      setNotification(data.message);
      setShowLottie(true);
      navigation.navigate('ReceiverSuccess', {
        points: data.points,
        amount: data.amount,
        senderName: data.senderName,
        receiverUniquecode: user.name,
      });
      setTimeout(() => {
        setShowLottie(false);
        setNotification(null);
      }, 4000);
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user, navigation]);

  const fetchUser = useCallback(async (id, retries = 2) => {
    try {
      setLoading(true);
      const storedUser = await AsyncStorage.getItem('userInfo');
      let userData = storedUser ? JSON.parse(storedUser) : {};
      setUser({
        _id: userData._id || null,
        name: userData.name || null,
        mobile: userData.mobile || null,
        userUniqueCode: userData.userUniqueCode || null,
        role:userData.role|| null,
        location: userData.location || null,
        points: userData.points || 0,
        createdAt: userData.createdAt || null,
        adminId: userData.adminId || null,
      });

      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error('No user token found');
      const response = await axios.get(`${API_BASE_URL}/Userfetch/user/${id}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const fetchedUser = response.data || {};
      const updatedUser = {
        _id: fetchedUser._id || null,
        name: fetchedUser.name || null,
        mobile: fetchedUser.mobile || null,
        role:fetchedUser.role|| null,
        userUniqueCode: fetchedUser.userUniqueCode || null,
        location: fetchedUser.location || null,
        points: fetchedUser.points || 0,
        createdAt: fetchedUser.createdAt || null,
        adminId: fetchedUser.adminId || null,
      };
      setUser(updatedUser);
      await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      if (retries > 0) {
        console.warn(`Retrying fetchUser (${retries} retries left)...`);
        return fetchUser(id, retries - 1);
      }
      console.error('Fetch user error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load user data. Using local data.',
      });
      return userData;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAdmin = useCallback(async (adminId, retries = 2) => {
    if (!adminId) {
      setAdmin({ name: null, uniqueCode: null, mobile: null });
      return;
    }
    try {
      setLoading(true);
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error('No user token found');
      const response = await axios.get(`${API_BASE_URL}/Userfetch/admin/${adminId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const fetchedAdmin = response.data || {};
      setAdmin({
        name: fetchedAdmin.name || null,
        uniqueCode: fetchedAdmin.uniqueCode || null,
        mobile: fetchedAdmin.mobile || null,
      });
    } catch (error) {
      if (retries > 0) {
        console.warn(`Retrying fetchAdmin (${retries} retries left)...`);
        return fetchAdmin(adminId, retries - 1);
      }
      console.error('Fetch admin error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load admin data.',
      });
      setAdmin({ name: null, uniqueCode: null, mobile: null });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReward = useCallback(async (adminId, retries = 2) => {
    if (!adminId) {
      setRewards([]);
      return;
    }
    try {
      setLoading(true);
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error('No user token found');
      const response = await axios.get(`${API_BASE_URL}/fetchdata/rewards/${adminId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setRewards(response.data || []);
      await AsyncStorage.setItem('rewards', JSON.stringify(response.data || []));
    } catch (error) {
      if (retries > 0) {
        console.warn(`Retrying fetchReward (${retries} retries left)...`);
        return fetchReward(adminId, retries - 1);
      }
      console.error('Fetch rewards error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load rewards.',
      });
      setRewards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNotifications = useCallback(async (userId, retries = 2) => {
    if (!userId) return;
    try {
      setLoading(true);
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error('No user token found');
      const response = await axios.get(`${API_BASE_URL}/Userfetch/notifications/${userId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const fetchedNotifications = response.data || [];
      setNotifications(fetchedNotifications);
      await AsyncStorage.setItem('notifications', JSON.stringify(fetchedNotifications));
    } catch (error) {
      if (retries > 0) {
        console.warn(`Retrying fetchNotifications (${retries} retries left)...`);
        return fetchNotifications(userId, retries - 1);
      }
      console.error('Fetch notifications error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load notifications.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRedemptions = useCallback(async (userId, retries = 2) => {
    if (!userId) return;
    try {
      setLoading(true);
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error('No user token found');
      const response = await axios.get(`${API_BASE_URL}/Userfetch/redeem/${userId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const fetchedRedemptions = response.data || [];
      setRedemptions(fetchedRedemptions);
      await AsyncStorage.setItem('redemptions', JSON.stringify(fetchedRedemptions));
    } catch (error) {
      if (retries > 0) {
        console.warn(`Retrying fetchRedemptions (${retries} retries left)...`);
        return fetchRedemptions(userId, retries - 1);
      }
      console.error('Fetch redemptions error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load redemptions.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const saveUser = useCallback(async (updatedUser, retries = 2) => {
    try {
      setLoading(true);
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error('No user token found');
      await axios.put(
        `${API_BASE_URL}/Userfetch/user/${updatedUser._id}`,
        updatedUser,
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      setUser(updatedUser);
      await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUser));
    } catch (error) {
      if (retries > 0) {
        console.warn(`Retrying saveUser (${retries} retries left)...`);
        return saveUser(updatedUser, retries - 1);
      }
      console.error('Save user error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save user data.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const saveNotification = useCallback(async (notification, retries = 2) => {
    try {
      setLoading(true);
      const userToken = await AsyncStorage.getItem('userToken');
      const userData = JSON.parse(await AsyncStorage.getItem('userInfo')) || {};
      if (!userToken) throw new Error('No user token found');
      if (!userData._id) throw new Error('No user ID found');
      const response = await axios.post(
        `${API_BASE_URL}/Userfetch/notifications`,
        { userid: userData._id, message: notification.message },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      const newNotification = response.data || notification;
      setNotifications((prev) => {
        const updatedNotifications = [...prev, newNotification];
        AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications)).catch((error) =>
          console.error('AsyncStorage save notifications error:', error)
        );
        return updatedNotifications;
      });
      return newNotification;
    } catch (error) {
      if (retries > 0) {
        console.warn(`Retrying saveNotification (${retries} retries left)...`);
        return saveNotification(notification, retries - 1);
      }
      console.error('Save notification error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save notification.',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId, retries = 2) => {
    try {
      setLoading(true);
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error('No user token found');
      await axios.delete(`${API_BASE_URL}/Userfetch/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setNotifications((prev) => {
        const updatedNotifications = prev.filter((n) => n._id !== notificationId);
        AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications)).catch((error) =>
          console.error('AsyncStorage save notifications error:', error)
        );
        return updatedNotifications;
      });
    } catch (error) {
      if (retries > 0) {
        console.warn(`Retrying deleteNotification (${retries} retries left)...`);
        return deleteNotification(notificationId, retries - 1);
      }
      console.error('Delete notification error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete notification.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

const saveRedemptions = useCallback(
  async (rewardId, retries = 2) => {
    try {
      setLoading(true);

      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error('No user token found');

      const userData = JSON.parse(await AsyncStorage.getItem('userInfo')) || {};
      if (!userData._id) throw new Error('No user ID found');

      const reward = rewards.find((r) => r._id === rewardId);
      if (!reward) throw new Error('Reward not found');

      if (userData.points < reward.pointsRequired) {
        throw new Error('Insufficient points');
      }

      // Build redemption object
      const newRedemption = {
        _id: `${Date.now()}`,
        rewardId: {
          _id: reward._id,
          name: reward.name,
          image: reward.image,
        },
        redeemedAt: new Date().toISOString(),
        status: 'pending',
        pointsRequired: reward.pointsRequired, // ✅ properly included
      };

      // Send to backend
      const response = await axios.post(
        `${API_BASE_URL}/Userfetch/redeem`,
        {
          userid: userData._id,
          redemption: newRedemption,
          adminId: userData.adminId,
        },
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );

      const savedRedemption = response.data.redemption || newRedemption;

      // Update user points locally
      const updatedUser = {
        ...userData,
        points: userData.points - reward.pointsRequired,
      };

      const newNotification = {
        _id: `${Date.now()}`,
        message: `Redemption request for ${reward.name} submitted.`,
        createdAt: new Date().toISOString(),
        read: false,
        type: 'redemption_submitted',
        rewardId: reward._id,
      };

      await Promise.all([
        saveUser(updatedUser),
        saveNotification(newNotification),
        (async () => {
          const newRedemptions = [...(await AsyncStorage.getItem('redemptions').then(JSON.parse).catch(() => [])), savedRedemption];
          await AsyncStorage.setItem('redemptions', JSON.stringify(newRedemptions));
          setRedemptions(newRedemptions);
        })(),
      ]);

      return savedRedemption;
    } catch (error) {
      if (retries > 0) {
        console.warn(`Retrying saveRedemptions (${retries} retries left)...`);
        return saveRedemptions(rewardId, retries - 1);
      }

      console.error('Save redemptions error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to save redemption.',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  },
  [rewards, saveUser, saveNotification]
);

  const deleteRedemption = useCallback(async (redemptionId, rewardName, retries = 2) => {
    try {
      setLoading(true);
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error('No user token found');
      await axios.delete(`${API_BASE_URL}/Userfetch/redeem/${redemptionId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setRedemptions((prev) => {
        const updatedRedemptions = prev.filter((r) => r._id !== redemptionId);
        AsyncStorage.setItem('redemptions', JSON.stringify(updatedRedemptions)).catch((error) =>
          console.error('AsyncStorage save redemptions error:', error)
        );
        return updatedRedemptions;
      });
      const newNotification = {
        _id: `${Date.now()}`,
        message: `Redemption for ${rewardName} cancelled successfully.`,
        createdAt: new Date().toISOString(),
        read: false,
        type: 'redemption_cancelled',
        rewardId: null,
      };
      await saveNotification(newNotification);
    } catch (error) {
      if (retries > 0) {
        console.warn(`Retrying deleteRedemption (${retries} retries left)...`);
        return deleteRedemption(redemptionId, rewardName, retries - 1);
      }
      console.error('Delete redemption error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to cancel redemption.',
      });
    } finally {
      setLoading(false);
    }
  }, [saveNotification]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      const updatedNotifications = notifications.map((n) => ({ ...n, read: true }));
      setNotifications(updatedNotifications);
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error('No user token found');
      await axios.put(
        `${API_BASE_URL}/Userfetch/notifications/mark-all-read`,
        { userId: user._id },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
    } catch (error) {
      console.error('Mark all read error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to mark notifications as read.',
      });
    }
  }, [notifications, user]);

  const handleLogout = useCallback(async () => {
    try {
      await AsyncStorage.clear();
      navigation.replace('Login');
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Logged out successfully.',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to log out.',
      });
      console.error('Logout error:', error);
    }
  }, [navigation]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = JSON.parse(await AsyncStorage.getItem('userInfo')) || {};
        if (!userData._id) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'No user data found. Please log in.',
          });
          navigation.replace('Login');
          return;
        }
        const fetchedUser = await fetchUser(userData._id);
        await Promise.all([
          fetchAdmin(fetchedUser.adminId),
          fetchReward(fetchedUser.adminId),
          fetchNotifications(userData._id),
          fetchRedemptions(userData._id),
        ]);
      } catch (error) {
        console.error('Initial data load error:', error.message);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load initial data.',
        });
      }
    };
    loadData();
  }, [fetchUser, fetchAdmin, fetchReward, fetchNotifications, fetchRedemptions, navigation]);

  const handleTabPress = (tab) => {
    setCurrentTab(tab);
  };

  const renderContent = (tab) => {
    switch (tab) {
      case 'profile':
        return (
          <Profile
            user={user}
            admin={admin}
            rewards={rewards}
            redemptions={redemptions}
            handleLogout={() => {
              setModalMessage('Are you sure you want to log out?');
              setModalAction(() => handleLogout);
              setModalVisible(true);
            }}
            setModalVisible={setModalVisible}
            setModalMessage={setModalMessage}
            setModalAction={setModalAction}
          />
        );
      case 'rewards':
        return (
          <Rewards
            user={user}
            rewards={rewards}
            handleRedeem={(reward) => {
              setModalMessage(`Confirm redemption of ${reward.name}?`);
              setModalAction(() => async () => {
                try {
                  setModalVisible(false);
                  await saveRedemptions(reward._id);
                  Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Redemption request submitted.',
                  });
                } catch (error) {
                  setModalVisible(false);
                  Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to process redemption.',
                  });
                  console.error('Redeem error:', error);
                }
              });
              setModalVisible(true);
            }}
          />
        );
      case 'history':
        return <History />;
      case 'notifications':
        return (
          <Notifications
            notifications={notifications}
            handleMarkAllRead={handleMarkAllRead}
            handleClearNotification={(notificationId) => {
              setModalMessage('Are you sure you want to dismiss this notification?');
              setModalAction(() => async () => {
                try {
                  await deleteNotification(notificationId);
                  setModalVisible(false);
                  Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Notification dismissed.',
                  });
                } catch (error) {
                  setModalVisible(false);
                  Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to dismiss notification.',
                  });
                  console.error('Clear notification error:', error);
                }
              });
              setModalVisible(true);
            }}
          />
        );
      case 'redemption':
        return (
          <Redemption
            redemptions={redemptions}
            handleClearRedemption={(redemptionId) => {
              const redemption = redemptions.find((r) => r._id === redemptionId);
              if (!redemption) return;
              setModalMessage(`Are you sure you want to cancel redemption of ${redemption.rewardId.name}?`);
              setModalAction(() => async () => {
                try {
                  await deleteRedemption(redemptionId, redemption.rewardId.name);
                  setModalVisible(false);
                  Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Redemption cancelled.',
                  });
                } catch (error) {
                  setModalVisible(false);
                  Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to cancel redemption.',
                  });
                  console.error('Clear redemption error:', error);
                }
              });
              setModalVisible(true);
            }}
          />
        );
      default:
        return null;
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0A0A0A' : '#F0F4F8' }]}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Action</Text>
            <Text style={[styles.cardText, { color: colors.text }]}>{modalMessage}</Text>
            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                style={styles.actionButton}
                buttonColor={colors.primary}
                textColor="#FFFFFF"
                onPress={modalAction}
              >
                <ButtonText>Confirm</ButtonText>
              </Button>
              <Button
                mode="outlined"
                style={styles.actionButton}
                textColor={colors.text}
                onPress={() => setModalVisible(false)}
              >
                <ButtonText>Cancel</ButtonText>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
      <FlatList
        data={[currentTab]}
        keyExtractor={(item) => item}
        renderItem={({ item }) => renderContent(item)}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
            borderTopColor: isDarkMode ? '#444444' : '#E0E0E0',
          },
        ]}
      >
        {['profile', 'rewards', 'history', 'notifications', 'redemption'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, currentTab === tab && styles.activeTab]}
            onPress={() => handleTabPress(tab)}
            activeOpacity={0.7}
          >
            <View style={styles.tabIconContainer}>
              <MaterialIcons
                name={
                  tab === 'profile'
                    ? 'person'
                    : tab === 'rewards'
                    ? 'card-giftcard'
                    : tab === 'history'
                    ? 'history'
                    : tab === 'notifications'
                    ? 'notifications'
                    : 'assistant'
                }
                size={26}
                color={currentTab === tab ? colors.primary : colors.text}
              />
              {tab === 'notifications' && unreadNotifications > 0 && (
                <Badge style={styles.tabBadge}>{unreadNotifications}</Badge>
              )}
            </View>
            <Text
              style={[
                styles.tabText,
                { color: currentTab === tab ? colors.primary : colors.text },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

export default UserDashboard;
