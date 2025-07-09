import React, { useState, useRef, useContext, useEffect, useCallback, memo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  ActivityIndicator,
  Dimensions,
  Platform,
  TouchableOpacity,
  Modal,
  Alert,
  BackHandler,
  RefreshControl,
} from 'react-native';
import { Button, TextInput, useTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../../ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { API_BASE_URL } from '../../../utils/api';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import Toast from 'react-native-toast-message';
import Home from './Home';
import Users from './Users';
import Rewards from './Rewards';
import Notification from './Notification';
import History from './History';
import { listenToApprovedRequests, registerUser } from '../../../utils/socket';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const CARD_HEIGHT = 250;
const CARD_WIDTH = SCREEN_WIDTH - 100;

const defaultAdminUser = {
  _id: '686263569a144823f5094869',
  name: 'Shashwat',
  mobile: '94244xxxxx',
  role: 'admin',
  uniqueCode: 'VJGAJW',
  validate: true,
};

const ButtonText = ({ children, style }) => (
  <Text
    style={[
      {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '500',
        lineHeight: Platform.OS === 'android' ? 28 : 20,
        flexWrap: 'wrap',
        flexShrink: 1,
        width: '100%',
      },
      style,
    ]}
  >
    {children}
  </Text>
);

const AdminDashboard = ({ route, navigation }) => {
  const { tabdata } = route.params || {};
  const { colors } = useTheme();
  const { isDarkMode } = useContext(ThemeContext);
  const [users, setUsers] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('home');
  const [adminUser, setAdminUser] = useState(null);
  const [sendTokenUserId, setSendTokenUserId] = useState(null);
  const [tokenAmount, setTokenAmount] = useState('');
  const [rewards, setRewards] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingRewardId, setDeletingRewardId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [newReward, setNewReward] = useState({
    name: '',
    price: '',
    pointsRequired: '',
    image: null,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalAction, setModalAction] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingRewardId, setEditingRewardId] = useState(null);
  const [invoice, setInvoice] = useState(1);
  const [amount, setAmount] = useState('');
  const [rewardPercentage, setRewardPercentage] = useState(10);
  const [expiry, setExpiry] = useState('6 months');
  const [receiverCode, setReceiverCode] = useState('');
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load notifications from AsyncStorage
  const loadNotificationsFromStorage = useCallback(async () => {
    try {
      const storedNotifications = await AsyncStorage.getItem('adminNotifications');
      console.log('Loaded notifications from AsyncStorage:', storedNotifications);
      return storedNotifications ? JSON.parse(storedNotifications) : [];
    } catch (error) {
      console.error('Failed to load notifications from AsyncStorage:', error.message);
      return [];
    }
  }, []);

  
  // Save notifications to AsyncStorage
  const saveNotificationsToStorage = useCallback(async (updatedNotifications) => {
    try {
      await AsyncStorage.setItem('adminNotifications', JSON.stringify(updatedNotifications));
      console.log('Notifications saved to AsyncStorage:', updatedNotifications);
    } catch (error) {
      console.error('Failed to save notifications to AsyncStorage:', error.message);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(['userInfo', 'userToken']);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'You have been logged out.',
      });
    } catch (error) {
      console.error('Logout error:', error);
      Toast.show({
        type: 'error',
        text1: 'Logout Failed',
        text2: 'Failed to log out: ' + error.message,
      });
    }
  }, [navigation]);

  // Load admin user
  const loadAdminUser = useCallback(
    async (retries = 3) => {
      try {
        setLoading(true);
        const userInfo = await AsyncStorage.getItem('userInfo');
        const parsedUser = userInfo ? JSON.parse(userInfo) : defaultAdminUser;
        setAdminUser(parsedUser);

        const userToken = await AsyncStorage.getItem('userToken');
        if (!userToken) throw new Error('No user token found');

        // Fetch admin data
        const response = await axios.get(`${API_BASE_URL}/fetchdata/getadmin/${parsedUser._id}`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });

        const fetchedUser = response.data?.data || {};
        const updatedUser = {
          _id: fetchedUser._id || parsedUser._id,
          name: fetchedUser.name || parsedUser.name,
          mobile: fetchedUser.mobile || parsedUser.mobile,
          uniqueCode: fetchedUser.uniqueCode || parsedUser.uniqueCode,
          role: fetchedUser.role || parsedUser.role,
          validate: fetchedUser.validate ?? parsedUser.validate,
          location: fetchedUser.location || parsedUser.location,
          points: fetchedUser.points || parsedUser.points || 0,
          createdAt: fetchedUser.createdAt || parsedUser.createdAt,
          adminId: fetchedUser.adminId || parsedUser.adminId,
        };

        if (updatedUser.role !== 'admin' || updatedUser.validate === false) {
          await logout();
          return;
        }

        setAdminUser(updatedUser);
        await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUser));

        const storedNotifications = await loadNotificationsFromStorage();
        setNotifications(storedNotifications);

        await Promise.all([
          fetchUsers(updatedUser._id),
          fetchRewards(updatedUser._id),
          fetchRedemptions(updatedUser._id),
          fetchInvoice(updatedUser._id),
        ]);
      } catch (error) {
        if (retries > 0) {
          console.warn(`Retrying loadAdminUser (${retries} retries left)...`);
          return loadAdminUser(retries - 1);
        }
        console.error('Load admin user error:', error.message);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.response?.data?.message || 'Failed to load user info',
        });
        await logout();
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchUsers, fetchRewards, fetchRedemptions, fetchInvoice, loadNotificationsFromStorage, logout]
  );

  // Fetch users
  const fetchUsers = useCallback(async (adminId) => {
    try {
      if (!adminId) throw new Error('Invalid Admin. Please relogin');
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_BASE_URL}/fetchdata/admin/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Fetch users error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.error || 'Failed to fetch users',
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch rewards
  const fetchRewards = useCallback(async (adminId) => {
    try {
      if (!adminId) throw new Error('Invalid Admin. Please relogin');
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_BASE_URL}/fetchdata/rewards/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRewards(response.data || []);
    } catch (error) {
      console.error('Fetch rewards error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.error || 'Failed to fetch rewards',
      });
      setRewards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch redemptions
  const fetchRedemptions = useCallback(async (adminId) => {
    try {
      if (!adminId) throw new Error('Invalid Admin. Please relogin');
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_BASE_URL}/fetchdata/redemptions/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRedemptions(response.data || []);
      console.log('Redemptions fetched:', response.data);
    } catch (error) {
      console.error('Fetch redemptions error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.error || 'Failed to fetch redemptions',
      });
      setRedemptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch invoice
  const fetchInvoice = useCallback(async (adminId) => {
    try {
      if (!adminId) throw new Error('Invalid Admin. Please relogin');
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.post(
        `${API_BASE_URL}/fetchdata/fetchInvoice`,
        { adminId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const invoiceCount = response.data?.invoiceCount ?? 1;
      setInvoice(invoiceCount + 1);
    } catch (error) {
      console.error('Fetch invoice error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.error || 'Failed to fetch invoice',
      });
      setInvoice(1);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadAdminUser();
  }, [loadAdminUser]);

  // Tab change
  useEffect(() => {
    if (tabdata) {
      console.log('Tab data:', tabdata);
      setCurrentTab(tabdata);
    }
  }, [tabdata]);

  // Socket for redemption requests
  useEffect(() => {
    if (!adminUser?._id) return;

    registerUser(adminUser._id);

    const unsubscribe = listenToApprovedRequests((data) => {
      Toast.show({
        type: 'success',
        text1: 'New Redemption Request',
        text2: 'You have a new redemption request',
      });
      fetchRedemptions(adminUser._id);
    });

    return () => unsubscribe();
  }, [adminUser?._id, fetchRedemptions]);

  // Periodic validation check
  useEffect(() => {
    if (!adminUser?._id) return;

    const interval = setInterval(() => {
      loadAdminUser();
    }, 60000); // Every 60 seconds

    return () => clearInterval(interval);
  }, [adminUser?._id, loadAdminUser]);

  // Carousel auto-scroll
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused && rewards.length > 0) {
        const nextIndex = (index + 1) % rewards.length;
        scrollRef.current?.scrollToIndex({
          index: nextIndex,
          animated: !isWeb,
          viewPosition: 0.5,
        });
        setIndex(nextIndex);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [index, isPaused, rewards]);

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAdminUser();
  }, [loadAdminUser]);

  const handleTouchStart = () => setIsPaused(true);
  const handleTouchEnd = () => setIsPaused(false);

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        Alert.alert('Exit App', 'Do you really want to exit?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'OK', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      });
      return () => backHandler.remove();
    }, [])
  );

  const makepayment = async (invoice, amount, rewardPercentage, expiry, receiverCode) => {
    try {
      const userInfoString = await AsyncStorage.getItem('userInfo');
      if (!userInfoString) {
        await logout();
        return;
      }
      const userInfo = JSON.parse(userInfoString);
      const token = await AsyncStorage.getItem('userToken');
      const receiverUniquecode = `${receiverCode}`;
      const res = await axios.post(
        `${API_BASE_URL}/fetchdata/makepayment`,
        {
          invoice,
          amount,
          rewardPercentage,
          expiryMonth: expiry,
          senderId: userInfo._id,
          receiverUniquecode,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const points = Math.round((rewardPercentage / 100) * amount);
      Toast.show({
        type: 'success',
        text1: 'Payment Successful',
        text2: `${points} Coins transferred successfully`,
      });

      const newNotification = {
        _id: `${Date.now()}-${invoice}`,
        message: `Sent ${points} coins for payment #${invoice} to ${receiverUniquecode}`,
        createdAt: new Date().toISOString(),
        read: false,
      };
      const updatedNotifications = [...notifications, newNotification];
      setNotifications(updatedNotifications);
      await saveNotificationsToStorage(updatedNotifications);

      setAmount('');
      setRewardPercentage(10);
      setExpiry('6 months');
      setReceiverCode('');
      await fetchInvoice(userInfo._id);

      navigation.replace('SuccessScreen', {
        points,
        receiverUniquecode,
        amount,
        senderName: userInfo.name || userInfo.uniqueCode || 'You',
        data: currentTab,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Payment Failed',
        text2: error.response?.data?.error || 'Something went wrong while sending payment',
      });
    }
  };

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    setEditUser(null);
    setImagePreview(null);
    setEditingRewardId(null);
  };

  const handleButtonPress = (callback) => {
    callback();
  };

  const handleImageUpload = async () => {
    try {
      if (isWeb) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            if (file.size > 5 * 1024 * 1024) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Image size must be less than 5MB',
              });
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              setNewReward({ ...newReward, image: reader.result });
              setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'image/*',
          copyToCacheDirectory: true,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const { uri, size } = result.assets[0];
          if (size > 5 * 1024 * 1024) {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'Image size must be less than 5MB',
            });
            return;
          }
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const base64WithPrefix = `data:image/jpeg;base64,${base64}`;
          setNewReward({ ...newReward, image: base64WithPrefix });
          setImagePreview(base64WithPrefix);
        }
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to upload image: ' + error.message,
      });
    }
  };

  const handleEditUser = (user) => {
    setEditUser({ ...user });
  };

  const handleSaveUser = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(
        `${API_BASE_URL}/fetchdata/user/${editUser._id}`,
        editUser,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers((prev) => prev.map((u) => (u._id === editUser._id ? { ...editUser } : u)));
      setEditUser(null);
      Toast.show({
        type: 'success',
        text1: 'User Updated',
        text2: 'User details saved successfully',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.error || 'Failed to save user',
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    setModalMessage('Are you sure you want to delete this user?');
    setModalAction(() => async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        await axios.delete(`${API_BASE_URL}/fetchdata/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers((prev) => prev.filter((u) => u._id !== userId));
        setModalVisible(false);
        Toast.show({
          type: 'success',
          text1: 'User Deleted',
          text2: 'User has been removed successfully',
        });
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.response?.data?.error || 'Failed to delete user',
        });
      }
    });
    setModalVisible(true);
  };

  const handleSendTokens = async (userId) => {
    if (!tokenAmount || isNaN(tokenAmount) || parseInt(tokenAmount) <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid token amount',
      });
      return;
    }
    const user = users.find((u) => u._id === userId);
    setModalMessage(`Send ${tokenAmount} tokens to ${user.name}?`);
    setModalAction(() => async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        await axios.post(
          `${API_BASE_URL}/fetchdata/user/${userId}/addcoin`,
          { amount: parseInt(tokenAmount) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUsers((prev) =>
          prev.map((u) =>
            u._id === userId ? { ...u, points: (u.points || 0) + parseInt(tokenAmount) } : u
          )
        );
        const newNotification = {
          _id: `${Date.now()}`,
          message: `Sent ${tokenAmount} tokens to ${user.name}`,
          createdAt: new Date().toISOString(),
          read: false,
        };
        const updatedNotifications = [...notifications, newNotification];
        setNotifications(updatedNotifications);
        await saveNotificationsToStorage(updatedNotifications);
        setTokenAmount('');
        setSendTokenUserId(null);
        setModalVisible(false);
        navigation.navigate('SuccessScreen', {
          points: tokenAmount,
          receiverUniquecode: user.name,
          amount: null,
          senderName: adminUser.name || adminUser.uniqueCode || 'You',
          data: currentTab,
        });
        Toast.show({
          type: 'success',
          text1: 'Tokens Sent',
          text2: `${tokenAmount} tokens sent to ${user.name}`,
        });
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.response?.data?.error || 'Failed to send tokens',
        });
      }
    });
    setModalVisible(true);
  };

  const handleAddReward = async () => {
    if (!newReward.name || !newReward.price || !newReward.pointsRequired || !newReward.image) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all reward fields and upload an image',
      });
      return;
    }
    setIsUploading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (editingRewardId) {
        const response = await axios.put(
          `${API_BASE_URL}/fetchdata/admin/reward/${editingRewardId}`,
          {
            name: newReward.name,
            price: newReward.price,
            pointsRequired: newReward.pointsRequired,
            image: newReward.image,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRewards((prev) =>
          prev.map((reward) =>
            reward._id === editingRewardId ? { ...newReward, _id: editingRewardId } : reward
          )
        );
        Toast.show({
          type: 'success',
          text1: 'Reward Updated',
          text2: 'Reward details updated successfully',
        });
      } else {
        const response = await axios.post(
          `${API_BASE_URL}/fetchdata/admin/reward/${adminUser._id}`,
          {
            name: newReward.name,
            price: newReward.price,
            pointsRequired: newReward.pointsRequired,
            image: newReward.image,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRewards((prev) => [...prev, { ...newReward, _id: response.data._id }]);
        Toast.show({
          type: 'success',
          text1: 'Reward Added',
          text2: 'New reward added successfully',
        });
      }
      setNewReward({ name: '', price: '', pointsRequired: '', image: null });
      setImagePreview(null);
      setEditingRewardId(null);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.error || `Failed to ${editingRewardId ? 'update' : 'add'} reward`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelEdit = () => {
    setNewReward({ name: '', price: '', pointsRequired: '', image: null });
    setImagePreview(null);
    setEditingRewardId(null);
  };

  const handleDeleteReward = async (rewardId) => {
    setModalMessage('Are you sure you want to delete this reward?');
    setModalAction(() => async () => {
      try {
        setDeletingRewardId(rewardId);
        const token = await AsyncStorage.getItem('userToken');
        await axios.delete(`${API_BASE_URL}/fetchdata/admin/reward/${rewardId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRewards((prev) => prev.filter((r) => r._id !== rewardId));
        setModalVisible(false);
        Toast.show({
          type: 'success',
          text1: 'Reward Deleted',
          text2: 'Reward removed successfully',
        });
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.response?.data?.error || 'Failed to delete reward',
        });
      } finally {
        setDeletingRewardId(null);
      }
    });
    setModalVisible(true);
  };

  const handleClearNotification = async (notificationId) => {
    try {
      const updatedNotifications = notifications.filter((n) => n._id !== notificationId);
      setNotifications(updatedNotifications);
      await saveNotificationsToStorage(updatedNotifications);
      Toast.show({
        type: 'success',
        text1: 'Notification Cleared',
        text2: 'Notification dismissed successfully',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to clear notification: ' + error.message,
      });
    }
  };

  const handleReadNotification = async (notificationId) => {
    try {
      const updatedNotifications = notifications.map((n) =>
        n._id === notificationId ? { ...n, read: true } : n
      );
      setNotifications(updatedNotifications);
      await saveNotificationsToStorage(updatedNotifications);
      Toast.show({
        type: 'success',
        text1: 'Notification Read',
        text2: 'Notification marked as read successfully',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to mark notification as read: ' + error.message,
      });
    }
  };

  const handleDismissAllNotifications = async () => {
    setModalMessage('Clear all notifications?');
    setModalAction(() => async () => {
      try {
        setModalVisible(false);
        setNotifications([]);
        await saveNotificationsToStorage([]);
        Toast.show({
          type: 'success',
          text1: 'Notifications Cleared',
          text2: 'All notifications dismissed successfully',
        });
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to clear notifications: ' + error.message,
        });
      }
    });
    setModalVisible(true);
  };

  const handleApproveRedemption = async (redemptionId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(
        `${API_BASE_URL}/fetchdata/redemption/${redemptionId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRedemptions((prev) =>
        prev.map((r) => (r._id === redemptionId ? { ...r, status: 'approved' } : r))
      );
      Toast.show({
        type: 'success',
        text1: 'Redemption Approved',
        text2: 'Redemption request approved successfully',
      });
      const redemption = redemptions.find((r) => r._id === redemptionId);
      if (!redemption) return;
      const { userId, rewardId } = redemption;
      const newNotification = {
        _id: `${Date.now()}-${redemptionId}`,
        message: `${userId?.name || 'User'} (code: ${userId?.userUniqueCode || 'N/A'}) redemption for '${
          rewardId?.name || 'Reward'
        }' (${rewardId?.pointsRequired || 0} points) was ✅ Approved successfully.`,
        createdAt: new Date().toISOString(),
        read: false,
      };
      const updatedNotifications = [...notifications, newNotification];
      setNotifications(updatedNotifications);
      await saveNotificationsToStorage(updatedNotifications);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.error || 'Failed to approve redemption',
      });
    }
  };

  const handleRejectRedemption = async (redemptionId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const redemption = redemptions.find((r) => r._id === redemptionId);
      if (!redemption) {
        throw new Error('Redemption not found.');
      }
      const { userId, rewardId } = redemption;
      await axios.put(
        `${API_BASE_URL}/fetchdata/redemption/${redemptionId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRedemptions((prev) =>
        prev.map((r) => (r._id === redemptionId ? { ...r, status: 'rejected' } : r))
      );
      const newNotification = {
        _id: `${Date.now()}-${redemptionId}`,
        message: `${userId?.name || 'User'} (code: ${userId?.userUniqueCode || 'N/A'}) redemption for '${
          rewardId?.name || 'Reward'
        }' (${rewardId?.pointsRequired || 0} points) was ❌ Rejected successfully.`,
        createdAt: new Date().toISOString(),
        read: false,
      };
      const updatedNotifications = [...notifications, newNotification];
      setNotifications(updatedNotifications);
      await saveNotificationsToStorage(updatedNotifications);
      Toast.show({
        type: 'success',
        text1: 'Redemption Rejected',
        text2: 'Redemption request rejected successfully',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.error || 'Failed to reject redemption',
      });
    }
  };

  // Calculate unread notifications for badge
  const unreadNotificationsCount = [
    ...notifications.filter((n) => !n.read),
    ...redemptions.filter((r) => r.status === 'pending'),
  ].length;

  const renderTabContent = () => {
    switch (currentTab) {
      case 'home':
        return (
          <Home
            setAdminUser={setAdminUser}
            adminUser={adminUser}
            users={users}
            rewards={rewards}
            invoice={invoice}
            amount={amount}
            setAmount={setAmount}
            rewardPercentage={rewardPercentage}
            setRewardPercentage={setRewardPercentage}
            expiry={expiry}
            setExpiry={setExpiry}
            receiverCode={receiverCode}
            setReceiverCode={setReceiverCode}
            makepayment={makepayment}
            handleTouchStart={handleTouchStart}
            handleTouchEnd={handleTouchEnd}
            scrollRef={scrollRef}
            setIndex={setIndex}
            navigation={navigation}
            colors={colors}
            isDarkMode={isDarkMode}
          />
        );
      case 'users':
        return (
          <Users
            users={users}
            searchUser={searchUser}
            setSearchUser={setSearchUser}
            editUser={editUser}
            setEditUser={setEditUser}
            handleEditUser={handleEditUser}
            handleSaveUser={handleSaveUser}
            handleDeleteUser={handleDeleteUser}
            handleSendTokens={handleSendTokens}
            sendTokenUserId={sendTokenUserId}
            setSendTokenUserId={setSendTokenUserId}
            tokenAmount={tokenAmount}
            setTokenAmount={setTokenAmount}
            colors={colors}
            isDarkMode={isDarkMode}
          />
        );
      case 'rewards':
        return (
          <Rewards
            rewards={rewards}
            newReward={newReward}
            setNewReward={setNewReward}
            imagePreview={imagePreview}
            setImagePreview={setImagePreview}
            editingRewardId={editingRewardId}
            setEditingRewardId={setEditingRewardId}
            isUploading={isUploading}
            handleImageUpload={handleImageUpload}
            handleAddReward={handleAddReward}
            handleCancelEdit={handleCancelEdit}
            handleDeleteReward={handleDeleteReward}
            deletingRewardId={deletingRewardId}
            colors={colors}
            isDarkMode={isDarkMode}
          />
        );
      case 'notification':
        return (
          <Notification
            notifications={notifications}
            setNotifications={setNotifications}
            saveNotificationsToStorage={saveNotificationsToStorage}
            redemptions={redemptions}
            handleClearNotification={handleClearNotification}
            handleReadNotification={handleReadNotification}
            handleDismissAllNotifications={handleDismissAllNotifications}
            handleApproveRedemption={handleApproveRedemption}
            handleRejectRedemption={handleRejectRedemption}
            colors={colors}
            isDarkMode={isDarkMode}
          />
        );
      case 'history':
        return (
          <History
            users={users}
            rewards={rewards}
            redemptions={redemptions}
            colors={colors}
            isDarkMode={isDarkMode}
          />
        );
      default:
        return null;
    }
  };

  const tabData = [{ key: 'tab-content', content: renderTabContent() }];

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#f0f4f8' }]}>
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
          <View
            style={[
              styles.modal,
              { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff', width: isWeb && SCREEN_WIDTH > 600 ? 400 : 320 },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Action</Text>
            <Text style={[styles.cardText, { color: colors.text }]}>{modalMessage}</Text>
            <View style={styles.buttonRow}>
              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  style={styles.actionButton}
                  buttonColor={colors.primary}
                  textColor="#fff"
                  onPress={() => handleButtonPress(modalAction)}
                  accessible
                  accessibilityLabel="Confirm action"
                >
                  <ButtonText>Confirm</ButtonText>
                </Button>
              </View>
              <View style={styles.buttonContainer}>
                <Button
                  mode="outlined"
                  style={styles.actionButton}
                  textColor={colors.text}
                  onPress={() => handleButtonPress(() => setModalVisible(false))}
                  accessible
                  accessibilityLabel="Cancel action"
                >
                  <ButtonText>Cancel</ButtonText>
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      <FlatList
        data={tabData}
        renderItem={({ item }) => <View style={styles.scrollContentContainer}>{item.content}</View>}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        bounces={true}
        style={styles.scrollContent}
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
            backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
            borderTopColor: isDarkMode ? '#333' : '#e0e0e0',
          },
        ]}
      >
        {['home', 'users', 'rewards', 'notification', 'history'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, currentTab === tab && styles.activeTab]}
            onPress={() => handleTabChange(tab)}
            accessible
            accessibilityLabel={`Navigate to ${tab} tab`}
            accessibilityRole="button"
          >
            <View style={styles.tabIconContainer}>
              <MaterialIcons
                name={
                  tab === 'home'
                    ? 'home'
                    : tab === 'users'
                    ? 'people'
                    : tab === 'rewards'
                    ? 'card-giftcard'
                    : tab === 'notification'
                    ? 'notifications'
                    : 'history'
                }
                size={30}
                color={currentTab === tab ? colors.primary : colors.text}
              />
              {tab === 'notification' && unreadNotificationsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadNotificationsCount}</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.tabText,
                {
                  color: currentTab === tab ? colors.primary : colors.text,
                  fontSize: isWeb && SCREEN_WIDTH > 600 ? 14 : 12,
                },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default memo(AdminDashboard);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 120,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modal: {
    width: 320,
    padding: 20,
    borderRadius: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    borderTopWidth: 1,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    ...(isWeb ? { transition: 'transform 0.2s ease' } : {}),
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFFFFF',
    ...(isWeb ? { transform: [{ scale: 1.05 }] } : {}),
  },
  tabIconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF0000',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    marginHorizontal: 8,
    marginVertical: 8,
    borderRadius: 12,
    minWidth: 100,
    paddingVertical: 6,
    minHeight: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
    gap: 10,
  },
  buttonContainer: {
    ...(isWeb ? { transition: 'transform 0.2s ease' } : {}),
  },
  cardText: {
    fontSize: 18,
    marginVertical: 8,
    fontWeight: '500',
    lineHeight: 24,
  },
  tabText: {
    fontSize: 14,
    marginTop: 6,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});