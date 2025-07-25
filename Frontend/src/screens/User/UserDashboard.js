import React, { useState, useContext, useEffect, useCallback, memo } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, Modal, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, Button, Badge } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
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
import { listenToApprovedRequestsByAdmin, listenToNotifications, listenToRejectRequestsByAdmin, registerUser } from '../../../utils/socket';
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
  const [history, setHistory] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    if (!user?._id) return;

    registerUser(user._id);

    const unsubscribe = listenToApprovedRequestsByAdmin((data) => {
      Toast.show({
        type: 'success',
        text1: 'Redemption Approved',
        text2: 'Your redemption request has been approved.',
      });

      fetchRedemptions(user._id);
    });

    return () => unsubscribe();
  }, [user, fetchRedemptions]);

  useEffect(() => {
    if (!user?._id) return;

    registerUser(user._id);

    const unsubscribe = listenToRejectRequestsByAdmin((data) => {
      Toast.show({
        type: 'error',
        text1: 'Redemption Rejected',
        text2: 'Your redemption request was rejected.',
      });

      fetchRedemptions(user._id);
    });

    return () => unsubscribe();
  }, [user, fetchRedemptions]);

  useEffect(() => {
    if (!user?._id) return;

    registerUser(user._id);

    const unsubscribe = listenToNotifications((data) => {
      setNotification(data.message);
      setShowLottie(true);
      navigation.replace('ReceiverSuccess', {
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
        role: userData.role || null,
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
        role: fetchedUser.role || null,
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

      let fetchedNotifications = response.data || [];

      fetchedNotifications = fetchedNotifications.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );

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

      const sortedRedemptions = fetchedRedemptions.sort(
        (a, b) => new Date(b.redeemedAt) - new Date(a.redeemedAt)
      );

      setRedemptions(sortedRedemptions);

      await AsyncStorage.setItem('redemptions', JSON.stringify(sortedRedemptions));
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
      if (!userToken) throw new Error('No user token found');

      const newNotification = notification;
      if (!newNotification || typeof newNotification !== 'object') {
        throw new Error('Invalid notification object');
      }

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
      if (!notificationId) return;
      setLoading(true);

      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error('No user token found');

      await axios.delete(`${API_BASE_URL}/Userfetch/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      setNotifications((prev) => {
        const updatedNotifications = prev.filter((n) => n._id !== notificationId);

        AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications)).catch((err) =>
          console.error('AsyncStorage save notifications error:', err)
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

  const readNotification = useCallback(async (notificationId, retries = 2) => {
    try {
      if (!notificationId) return;
      setLoading(true);

      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error('No user token found');

      await axios.put(
        `${API_BASE_URL}/Userfetch/notifications/mark-read`,
        { notificationId },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      setNotifications((prev) => {
        const updatedNotifications = prev.map((n) =>
          n._id === notificationId ? { ...n, read: true } : n
        );

        AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications)).catch((error) =>
          console.error('AsyncStorage save notifications error:', error)
        );

        return updatedNotifications;
      });
    } catch (error) {
      if (retries > 0) {
        console.warn(`Retrying readNotification (${retries} retries left)...`);
        return readNotification(notificationId, retries - 1);
      }

      console.error('Read notification error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to mark notification as read.',
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

        const newRedemption = {
          _id: `${Date.now()}`,
          rewardId: {
            _id: reward._id,
            name: reward.name,
            image: reward.image,
          },
          redeemedAt: new Date().toISOString(),
          status: 'pending',
          pointsRequired: reward.pointsRequired,
        };

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

  const fetchExpiryOfToken = useCallback(async (adminId, userID) => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error('No user token found');

      const response = await axios.get(
        `${API_BASE_URL}/Userfetch/fetchexpiryofToken/${adminId}/${userID}`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      const sorted = (response.data || []).sort(
        (a, b) => new Date(a.expiryMonth) - new Date(b.expiryMonth)
      );

      setHistory(sorted);
    } catch (error) {
      console.error('Fetch expiry error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch token expiry data.',
      });
    }
  }, []);

  const checkAndHandleExpiredPayments = useCallback(async (adminId, userID, setUser, fetchUser) => {
    if (!adminId || !userID) {
      Toast.show({
        type: 'error',
        text1: 'Missing IDs',
        text2: 'Admin or User ID not found',
      });
      return;
    }

    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error('No user token found');

      const res = await axios.get(`${API_BASE_URL}/Userfetch/check-expiration/${adminId}/${userID}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      const { message, totalPointsDeducted, updatedPoints } = res.data;

      if (totalPointsDeducted > 0) {
        // Update user points in state to reflect deduction
        setUser((prevUser) => ({
          ...prevUser,
          points: updatedPoints || prevUser.points - totalPointsDeducted,
        }));

        // Update AsyncStorage with new user points
        const userData = JSON.parse(await AsyncStorage.getItem('userInfo')) || {};
        const updatedUser = { ...userData, points: updatedPoints || userData.points - totalPointsDeducted };
        await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUser));

        Toast.show({
          type: 'info',
          text1: 'Points Deducted',
          text2: `${totalPointsDeducted} points were deducted due to expired rewards.`,
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'All Good!',
          text2: 'No expired Coins found.',
        });
      }

      // Refresh user data to ensure consistency
      await fetchUser(userID);
    } catch (err) {
      console.error('Check expiration failed:', err.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to check reward expiration. Please try again later.',
      });
    }
  }, []);

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
        const adminId = fetchedUser?.adminId;

        if (!adminId) {
          throw new Error('Admin ID not found for user');
        }

        await Promise.all([
          checkAndHandleExpiredPayments(adminId, userData._id, setUser, fetchUser),
          fetchExpiryOfToken(adminId, userData._id),
          fetchAdmin(adminId),
          fetchReward(adminId),
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
  }, [
    fetchUser,
    fetchAdmin,
    fetchReward,
    fetchNotifications,
    fetchRedemptions,
    navigation,
    fetchExpiryOfToken,
  ]);

  const handleTabPress = useCallback((tab) => {
    setCurrentTab(tab);
  }, []);

  const renderContent = useCallback((tab) => {
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
            setUser={setUser}
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
        return (
          <History
            users={[user, admin].filter(Boolean)}
            rewards={rewards}
            redemptions={history}
            colors={colors}
            isDarkMode={isDarkMode}
            navigation={navigation}
            setCurrentTab={setCurrentTab}
          />
        );
      case 'notifications':
        return (
          <Notifications
            notifications={notifications}
            readNotification={readNotification}
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
  }, [user, admin, rewards, redemptions, notifications, colors, isDarkMode, navigation, setCurrentTab, handleLogout, saveRedemptions, readNotification, handleMarkAllRead, deleteRedemption, setModalVisible, setModalMessage, setModalAction, setUser]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);

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
        const adminId = fetchedUser?.adminId;

        if (!adminId) {
          throw new Error('Admin ID not found for user');
        }

        await Promise.all([
          checkAndHandleExpiredPayments(adminId, userData._id, setUser, fetchUser),
          fetchExpiryOfToken(adminId, userData._id),
          fetchAdmin(adminId),
          fetchNotifications(userData._id),
          fetchRedemptions(userData._id),
        ]);

        console.log('🔄 Data refreshed successfully!');
      } catch (error) {
        console.error('Initial data load error:', error.message);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load initial data.',
        });
      } finally {
        setRefreshing(false);
      }
    };

    loadData();
  }, [fetchUser, fetchAdmin, fetchNotifications, fetchRedemptions, fetchExpiryOfToken, navigation]);

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0A0A0A' : '#F0F4F8' }]}>
      {/* {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )} */}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2196F3"
            colors={['#2196F3']}
          />
        }
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

export default memo(UserDashboard);