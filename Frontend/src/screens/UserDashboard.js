import React, { useState, useRef, useContext, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  ActivityIndicator,
  Dimensions,
  Platform,
  TouchableOpacity,
  ImageBackground,
  TouchableWithoutFeedback,
  Modal,
  ScrollView,
  Image,
  Animated,
  Alert,
} from 'react-native';
import { Button, Card, TextInput, useTheme, Avatar, Badge } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../../utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 80;
const CARD_HEIGHT = 280;

const ButtonText = ({ children, style }) => (
  <Text
    style={[
      {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
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

export default function UserDashboard() {
  const { colors } = useTheme();
  const { isDarkMode } = useContext(ThemeContext);
  const navigation = useNavigation();
  const [currentTab, setCurrentTab] = useState('profile');
  const [searchReward, setSearchReward] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalAction, setModalAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRewardHistory, setShowRewardHistory] = useState(true);
  const scrollRef = useRef(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [rewards, setRewards] = useState([]);

  // Fetch user data from AsyncStorage or API
  const fetchUser = useCallback(async (id) => {
    try {
      setLoading(true);
      const storedUser = await AsyncStorage.getItem('userInfo');
      let userData = storedUser ? JSON.parse(storedUser) : {};
      setUser({
        _id: userData._id || null,
        name: userData.name || null,
        mobile: userData.mobile || null,
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
        location: fetchedUser.location || null,
        points: fetchedUser.points || 0,
        createdAt: fetchedUser.createdAt || null,
        adminId: fetchedUser.adminId || null,
      };
      setUser(updatedUser);
      await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Fetch user error:', error.message);
      Alert.alert('Error', 'Failed to load user data. Using local data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch admin data
  const fetchAdmin = useCallback(async (adminId) => {
    try {
      setLoading(true);
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error('No user token found');
      if (!adminId) throw new Error('No admin ID provided');
      const response = await axios.get(`${API_BASE_URL}/Userfetch/admin/${adminId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const fetchedAdmin = response.data || {};
      console.log("data of fetch admin :---------->>>>>>>> "+response.data );
      
      setAdmin({
        name: fetchedAdmin.name || null,
        uniqueCode: fetchedAdmin.uniqueCode || null,
      });
    } catch (error) {
      console.error('Fetch admin error:', error.message);
      setAdmin({ name: null, uniqueCode: null });
      Alert.alert('Error', 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch rewards
  const fetchReward = useCallback(async (adminId) => {
    try {
      setLoading(true);
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error('No user token found');
      if (!adminId) throw new Error('No admin ID provided');
      const response = await axios.get(`${API_BASE_URL}/datafetch/rewards/${adminId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setRewards(response.data || []);
    } catch (error) {
      console.error('Fetch rewards error:', error.message);
      setRewards([]);
      Alert.alert('Error', 'Failed to load rewards.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async (userId) => {
    try {
      setLoading(true);
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error('No user token found');
      const response = await axios.get(`${API_BASE_URL}/Userfetch/notifications/${userId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Fetch notifications error:', error.message);
      Alert.alert('Error', 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch redemptions
  const fetchRedemptions = useCallback(async (userId) => {
    try {
      setLoading(true);
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error('No user token found');
      const response = await axios.get(`${API_BASE_URL}/Userfetch/redeem/${userId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setRedemptions(response.data || []);
    } catch (error) {
      console.error('Fetch redemptions error:', error.message);
      Alert.alert('Error', 'Failed to load redemptions.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save user
  const saveUser = useCallback(async (updatedUser) => {
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
      console.error('Save user error:', error.message);
      Alert.alert('Error', 'Failed to save user data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save notifications
  const saveNotifications = useCallback(async (newNotifications) => {
    try {
      setLoading(true);
      const userToken = await AsyncStorage.getItem('userToken');
      const userData = JSON.parse(await AsyncStorage.getItem('userInfo')) || {};
      if (!userToken) throw new Error('No user token found');
      await axios.post(
        `${API_BASE_URL}/Userfetch/notifications`,
        { userId: userData._id, notifications: newNotifications },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      setNotifications(newNotifications);
      await AsyncStorage.setItem('notifications', JSON.stringify(newNotifications));
    } catch (error) {
      console.error('Save notifications error:', error.message);
      Alert.alert('Error', 'Failed to save notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save redemptions
  const saveRedemptions = useCallback(async (rewardId) => {
    try {
      setLoading(true);
      const userToken = await AsyncStorage.getItem('userToken');
      const userData = JSON.parse(await AsyncStorage.getItem('userInfo')) || {};
      const reward = rewards.find((r) => r._id === rewardId);
      if (!reward) throw new Error('Reward not found');
      if (userData.points < reward.pointsRequired) throw new Error('Insufficient points');
      const newRedemption = {
        _id: `${Date.now()}`,
        rewardId: { _id: reward._id, name: reward.name, image: reward.image },
        redeemedAt: new Date().toISOString(),
        status: 'pending',
      };
      await axios.post(
        `${API_BASE_URL}/Userfetch/redeem`,
        { userId: userData._id, redemption: newRedemption },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      const updatedUser = { ...userData, points: userData.points - reward.pointsRequired };
      await Promise.all([
        saveUser(updatedUser),
        setRedemptions([...redemptions, newRedemption]),
        AsyncStorage.setItem('redemptions', JSON.stringify([...redemptions, newRedemption])),
      ]);
    } catch (error) {
      console.error('Save redemptions error:', error.message);
      Alert.alert('Error', error.message || 'Failed to save redemptions.');
    } finally {
      setLoading(false);
    }
  }, [user, rewards, redemptions, saveUser]);

  // Mark all notifications as read
  const handleMarkAllRead = useCallback(() => {
    const updatedNotifications = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updatedNotifications);
  }, [notifications, saveNotifications]);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = JSON.parse(await AsyncStorage.getItem('userInfo')) || {};
        console.log(userData);
        
        if (userData._id) {
          await Promise.all([
            fetchUser(userData._id),
            fetchAdmin(userData.adminId),
            fetchReward(userData.adminId),
            fetchNotifications(userData._id),
            fetchRedemptions(userData._id),
          ]);
        } else {
          Alert.alert('Error', 'No user data found. Please log in.');
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Initial data load error:', error.message);
        Alert.alert('Error', 'Failed to load initial data.');
      }
    };
    loadData();
  }, [fetchUser, fetchAdmin, fetchReward, fetchNotifications, fetchRedemptions, navigation]);

  // Animation for cards
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [currentTab]);

  // Animation for header on tab change
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentTab]);

  // Auto-scroll for rewards carousel
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused && rewards.length > 0) {
        const nextIndex = (carouselIndex + 1) % rewards.length;
        scrollRef.current?.scrollTo({
          x: nextIndex * CARD_WIDTH,
          animated: true,
        });
        setCarouselIndex(nextIndex);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [carouselIndex, isPaused, rewards.length]);

  const handleTouchStart = () => setIsPaused(true);
  const handleTouchEnd = () => setIsPaused(false);

  const handleTabPress = useCallback((tab) => {
    setCurrentTab(tab);
  }, []);

  const handleLogout = useCallback(() => {
    setModalMessage('Are you sure you want to log out?');
    setModalAction(() => async () => {
      try {
        await AsyncStorage.clear();
        navigation.replace('Login');
        Alert.alert('Success', 'Logged out successfully.');
      } catch (error) {
        Alert.alert('Error', 'Failed to log out.');
        console.error('Logout error:', error);
      }
    });
    setModalVisible(true);
  }, [navigation]);

  const handleToggleRewardHistory = useCallback(() => {
    setShowRewardHistory((prev) => !prev);
  }, []);

  const handleCardPress = useCallback(() => {}, []);

  const handleClearNotification = useCallback(
    (notificationId) => {
      const updatedNotifications = notifications.filter((n) => n._id !== notificationId);
      saveNotifications(updatedNotifications);
    },
    [notifications, saveNotifications]
  );

  const handleClearRedemption = useCallback(
    (redemptionId) => {
      const updatedRedemptions = redemptions.filter((r) => r._id !== redemptionId);
      const newNotification = {
        _id: `${Date.now()}`,
        message: 'Redemption cancelled successfully.',
        createdAt: new Date().toISOString(),
        read: false,
        type: 'redemption_cancelled',
        rewardId: null,
      };
      Promise.all([
        saveRedemptions(updatedRedemptions),
        saveNotifications([...notifications, newNotification]),
      ]).catch((error) => {
        Alert.alert('Error', 'Failed to cancel redemption.');
        console.error('Clear redemption error:', error);
      });
    },
    [redemptions, notifications, saveRedemptions, saveNotifications]
  );

  const handleRedeem = useCallback(
    (reward) => {
      setModalMessage(`Confirm redemption of ${reward.name}?`);
      setModalAction(() => async () => {
        try {
          await saveRedemptions(reward._id);
          setModalVisible(false);
          Alert.alert('Success', 'Redemption request submitted.');
        } catch (error) {
          setModalVisible(false);
          Alert.alert('Error', 'Failed to process redemption.');
          console.error('Redeem error:', error);
        }
      });
      setModalVisible(true);
    },
    [saveRedemptions]
  );

  const renderContent = () => {
    switch (currentTab) {
      case 'profile':
        return (
          <Animated.View style={[styles.tabContent, { opacity: fadeAnim ,position:'relative',bottom:28}]}>
             <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Coin Gain</Text>
        <View style={styles.headerButtons}>
          <ThemeToggle style={styles.toggle} />
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Button
              mode="contained"
              onPress={handleLogout}
              
              buttonColor={colors.error}
              textColor="#FFFFFF"
              contentStyle={{ paddingVertical: 6 }}
              onPressIn={() => {
                Animated.timing(scaleAnim, {
                  toValue: 0.95,
                  duration: 100,
                  useNativeDriver: true,
                }).start();
              }}
              onPressOut={() => {
                Animated.timing(scaleAnim, {
                  toValue: 1,
                  duration: 100,
                  useNativeDriver: true,
                }).start();
              }}
            >
              <ButtonText>Logout</ButtonText>
            </Button>
          </Animated.View>
        </View>
      </Animated.View>
            <View style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
              <Card.Title
                title="Your Profile"
                titleStyle={[styles.cardTitle, { color: colors.text }]}
                left={() => (
                  <Avatar.Text
                    size={48}
                    label={user?.name?.charAt(0) || 'U'}
                    style={{ backgroundColor: colors.primary, marginRight: 12 }}
                  />
                )}
              />
              <Card.Content>
                <Text style={[styles.cardText, { color: colors.text, fontWeight: 'bold' }]}>
                  {user?.name || 'Unknown'}
                </Text>
                <Text style={[styles.cardText, { color: colors.text }]}>
                  Mobile: {user?.mobile || 'Unknown'}
                </Text>
                <Text style={[styles.cardText, { color: colors.text }]}>
                  Location: {user?.location || 'Unknown'}
                </Text>
                <Text style={[styles.cardText, { color: colors.primary, fontWeight: 'bold' }]}>
                  Points: {user?.points ?? 0}
                </Text>
                <Text style={[styles.cardText, { color: colors.text }]}>
                  Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </Text>
              </Card.Content>
            </View>
            <View style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
              <Card.Title
                title="Your Stats"
                titleStyle={[styles.cardTitle, { color: colors.text }]}
                left={() => (
                  <Avatar.Icon
                    size={48}
                    icon="chart-bar"
                    style={{ backgroundColor: colors.primary, marginRight: 12 }}
                  />
                )}
              />
              <Card.Content>
                <View style={styles.statContainer}>
                  <View style={styles.statItem}>
                    <MaterialIcons name="star" size={28} color={colors.primary} style={styles.statIcon} />
                    <Text style={[styles.cardText, { color: colors.text }]}>
                      Points Earned: {user?.points ?? 0}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="gift" size={28} color={colors.primary} style={styles.statIcon} />
                    <Text style={[styles.cardText, { color: colors.text }]}>
                      Rewards Redeemed: {redemptions.filter((r) => r.status === 'approved').length}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </View>
            <View style={styles.sliderContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Rewards</Text>
              <TouchableWithoutFeedback onPressIn={handleTouchStart} onPressOut={handleTouchEnd}>
                <ScrollView
                  ref={scrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  style={styles.carousel}
                  scrollEventThrottle={16}
                  onMomentumScrollEnd={(e) => {
                    const newIndex = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
                    setCarouselIndex(newIndex);
                  }}
                >
                  {rewards.length > 0 ? (
                    rewards.map((item) => (
                      <ImageBackground
                        key={item._id}
                        source={{ uri: item.image }}
                        resizeMode="cover"
                        style={styles.carouselItem}
                        imageStyle={styles.carouselImage}
                        defaultSource={require('../../assets/placeholder.jpg')}
                        onError={() => console.log('Failed to load reward image')}
                      >
                        {item.tag && (
                          <Badge
                            style={[
                              styles.badge,
                              { backgroundColor: item.tag === 'Popular' ? '#FFD700' : '#FF4081' },
                            ]}
                          >
                            {item.tag}
                          </Badge>
                        )}
                        <View style={styles.textOverlay}>
                          <Text style={styles.carouselText}>{item.name}</Text>
                          <Text style={styles.carouselSubText}>
                            {item.pointsRequired} Points
                          </Text>
                        </View>
                      </ImageBackground>
                    ))
                  ) : (
                    <View style={styles.carouselItem}>
                      <Text style={[styles.emptyText, { color: colors.text }]}>
                        No rewards available
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </TouchableWithoutFeedback>
            </View>
            {admin && (
              <View style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
                <Card.Title
                  title="Assigned Admin"
                  titleStyle={[styles.cardTitle, { color: colors.text }]}
                  left={() => (
                    <Avatar.Icon
                      size={48}
                      icon="account-circle"
                      style={{ backgroundColor: colors.primary, marginRight: 12 }}
                    />
                  )}
                />
                <Card.Content>
                  <Text style={[styles.cardText, { color: colors.text }]}>
                    Admin: {admin.name || 'Unknown'}
                  </Text>
                  <Text style={[styles.cardText, { color: colors.text }]}>
                    Unique Code: {admin.uniqueCode || 'N/A'}
                  </Text>
                </Card.Content>
              </View>
            )}
          </Animated.View>
        );
      case 'rewards':
        return (
          <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
            <Text style={[styles.title, { color: colors.text }]}>Rewards</Text>
            <TextInput
              placeholder="Search Rewards by Name"
              value={searchReward}
              onChangeText={setSearchReward}
              style={[styles.searchBar, { backgroundColor: isDarkMode ? '#3A3A3A' : '#F5F5F5' }]}
              placeholderTextColor={colors.text}
              mode="outlined"
              theme={{ colors: { text: colors.text, primary: colors.primary } }}
            />
            <FlatList
              data={rewards.filter((reward) =>
                reward.name.toLowerCase().includes(searchReward.toLowerCase())
              )}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => {
                const pointsEarned = user?.points ?? 0;
                const pointsRequired = item.pointsRequired || 100;
                const percentage = Math.min((pointsEarned / pointsRequired) * 100, 100);
                const remainingPoints = Math.max(pointsRequired - pointsEarned, 0);
                const isAchieved = pointsEarned >= pointsRequired;

                return (
                  <TouchableOpacity
                    onPress={handleCardPress}
                    activeOpacity={0.8}
                    style={{ transform: [{ scale: 1 }] }}
                  >
                    <View style={[styles.rewardCard, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
                      <Card.Content>
                        {item.tag && (
                          <Badge
                            style={[
                              styles.badge,
                              { backgroundColor: item.tag === 'Popular' ? '#FFD700' : '#FF4081' },
                            ]}
                          >
                            {item.tag}
                          </Badge>
                        )}
                        {item.image && (
                          <Image
                            source={{ uri: item.image }}
                            style={styles.rewardImage}
                            resizeMode="cover"
                            onError={() => console.log('Failed to load reward image')}
                          />
                        )}
                        <Text style={[styles.rewardName, { color: colors.text }]}>
                          {item.name}
                        </Text>
                        <Text style={[styles.rewardDetails, { color: colors.text }]}>
                          Price: ₹{item.price} | Points Required: {pointsRequired}
                        </Text>
                        <View style={styles.progressContainer}>
                          <View style={styles.progressBar}>
                            <Animated.View
                            style={[
                              styles.progressFill,
                              {
                                width: `${percentage}%`,
                                backgroundColor: isAchieved ? '#2196F3' : '#4CAF50',
                              },
                            ]}
                            />
                          </View>
                          <Text style={[styles.progressText, { color: colors.text }]}>
                            {pointsEarned}/{pointsRequired} points ({percentage.toFixed(2)}% achieved)
                          </Text>
                          <Text style={[styles.progressText, { color: colors.text }]}>
                            {remainingPoints} points remaining
                          </Text>
                          {isAchieved ? (
                            <Text style={[styles.rewardAchieved, { color: '#2196F3' }]}>
                              🎉 Reward Achieved
                            </Text>
                          ) : (
                            <Text style={[styles.remainingPoints, { color: '#FF5722' }]}>
                              Need {remainingPoints} more points to unlock
                            </Text>
                          )}
                        </View>
                        {isAchieved && (
                          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                            <Button
                              mode="contained"
                              onPress={() => handleRedeem(item)}
                              style={styles.redeemButton}
                              buttonColor={colors.primary}
                              textColor="#FFFFFF"
                              contentStyle={{ paddingVertical: 6 }}
                              onPressIn={() => {
                                Animated.timing(scaleAnim, {
                                  toValue: 0.95,
                                  duration: 100,
                                  useNativeDriver: true,
                                }).start();
                              }}
                              onPressOut={() => {
                                Animated.timing(scaleAnim, {
                                  toValue: 1,
                                  duration: 100,
                                  useNativeDriver: true,
                                }).start();
                              }}
                            >
                              <ButtonText>Redeem Now</ButtonText>
                            </Button>
                          </Animated.View>
                        )}
                      </Card.Content>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={() => (
                <Text style={[styles.emptyText, { color: colors.text }]}>No rewards found.</Text>
              )}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews={true}
            />
          </Animated.View>
        );
      case 'history':
        return (
          <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
            <Text style={[styles.title, { color: colors.text }]}>Reward History</Text>
            <View style={styles.rewardHistoryHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Redemptions</Text>
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={handleToggleRewardHistory}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleButtonText, { color: colors.primary }]}>
                  {showRewardHistory ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
            {showRewardHistory && (
              <FlatList
                key={`reward-history-${showRewardHistory}`}
                data={redemptions}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={handleCardPress} activeOpacity={0.8}>
                    <View style={[styles.historyItem, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
                      <Card.Content>
                        {item.rewardId?.image && (
                          <Image
                            source={{ uri: item.rewardId.image }}
                            style={styles.historyImage}
                            resizeMode="cover"
                            onError={() => console.log('Failed to load history image')}
                          />
                        )}
                        <Text style={[styles.historyName, { color: colors.text }]}>
                          {item.rewardId?.name || 'Unknown'}
                        </Text>
                        <Text style={[styles.historyDetails, { color: colors.text }]}>
                          Redeemed: {new Date(item.redeemedAt).toLocaleString()} | Status: {item.status}
                        </Text>
                        {item.status === 'pending' && (
                          <Button
                            mode="outlined"
                            onPress={() => handleClearRedemption(item._id)}
                            textColor={colors.error}
                            style={styles.clearButton}
                          >
                            <ButtonText>Cancel</ButtonText>
                          </Button>
                        )}
                      </Card.Content>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <Text style={[styles.emptyText, { color: colors.text }]}>No reward history.</Text>
                )}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
              />
            )}
          </Animated.View>
        );
      case 'notifications':
        return (
          <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
            <View style={styles.rewardHistoryHeader}>
              <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Button
                  mode="outlined"
                  onPress={handleMarkAllRead}
                  style={styles.markAllReadButton}
                  textColor={colors.primary}
                  onPressIn={() => {
                    Animated.timing(scaleAnim, {
                      toValue: 0.95,
                      duration: 100,
                      useNativeDriver: true,
                    }).start();
                  }}
                  onPressOut={() => {
                    Animated.timing(scaleAnim, {
                      toValue: 1,
                      duration: 100,
                      useNativeDriver: true,
                    }).start();
                  }}
                >
                  <ButtonText>Mark All Read</ButtonText>
                </Button>
              </Animated.View>
            </View>
            <FlatList
              data={notifications}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.notificationItem,
                    {
                      backgroundColor: item.read
                        ? isDarkMode
                          ? '#3A3A3A'
                          : '#F5F5F5'
                        : isDarkMode
                        ? '#444444'
                        : '#FFFFFF',
                    },
                  ]}
                >
                  <Avatar.Icon
                    size={36}
                    icon={item.read ? 'bell-outline' : 'bell'}
                    style={{
                      backgroundColor: item.read ? colors.secondary : colors.primary,
                      marginRight: 10,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.notificationText, { color: colors.text }]}>
                      {item.message}
                    </Text>
                    <Text style={[styles.notificationDate, { color: colors.text }]}>
                      {new Date(item.createdAt).toLocaleString()}
                    </Text>
                  </View>
                  <Button
                    mode="text"
                    onPress={() => handleClearNotification(item._id)}
                    textColor={colors.error}
                    style={styles.clearButton}
                  >
                    <ButtonText>Dismiss</ButtonText>
                  </Button>
                </View>
              )}
              ListEmptyComponent={() => (
                <Text style={[styles.emptyText, { color: colors.text }]}>No notifications.</Text>
              )}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews={true}
            />
          </Animated.View>
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
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Button
                  mode="contained"
                  style={styles.actionButton}
                  buttonColor={colors.primary}
                  textColor="#FFFFFF"
                  onPress={modalAction}
                  onPressIn={() => {
                    Animated.timing(scaleAnim, {
                      toValue: 0.95,
                      duration: 100,
                      useNativeDriver: true,
                    }).start();
                  }}
                  onPressOut={() => {
                    Animated.timing(scaleAnim, {
                      toValue: 1,
                      duration: 100,
                      useNativeDriver: true,
                    }).start();
                  }}
                >
                  <ButtonText>Confirm</ButtonText>
                </Button>
              </Animated.View>
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Button
                  mode="outlined"
                  style={styles.actionButton}
                  textColor={colors.text}
                  onPress={() => setModalVisible(false)}
                  onPressIn={() => {
                    Animated.timing(scaleAnim, {
                      toValue: 0.95,
                      duration: 100,
                      useNativeDriver: true,
                    }).start();
                  }}
                  onPressOut={() => {
                    Animated.timing(scaleAnim, {
                      toValue: 1,
                      duration: 100,
                      useNativeDriver: true,
                    }).start();
                  }}
                >
                  <ButtonText>Cancel</ButtonText>
                </Button>
              </Animated.View>
            </View>
          </View>
        </View>
      </Modal>
     
      <ScrollView
        contentContainerStyle={[styles.scrollContent]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
            borderTopColor: isDarkMode ? '#444444' : '#E0E0E0',
          },
        ]}
      >
        {['profile', 'rewards', 'history', 'notifications'].map((tab) => (
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
                    : 'notifications'
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
              {tab === 'profile'
                ? 'Profile'
                : tab === 'rewards'
                ? 'Rewards'
                : tab === 'history'
                ? 'History'
                : 'Notifications'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    position:'relative',
    width:'100%'
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  logoutButton: {
    borderRadius: 12,
    paddingVertical: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  toggle: {
    marginRight: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    ...(Platform.OS === 'web' ? { transition: 'transform 0.2s ease' } : {}),
  },
  activeTab: {
    borderBottomWidth:2,
    borderBottomColor: 'white',
    ...(Platform.OS === 'web' ? { transform: [{ scale: 1.05 }] } : {}),
  },
  tabIconContainer: {
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#FF4081',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tabContent: {
    paddingBottom: 20,
  },
  card: {
    marginVertical: 12,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 18,
    marginVertical: 6,
    fontWeight: '500',
    lineHeight: 24,
  },
  sliderContainer: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginVertical: 15,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  carousel: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  carouselItem: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    justifyContent: 'flex-end',
    padding: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    marginRight: 10,
  },
  carouselImage: {
    borderRadius: 16,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  textOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderRadius: 12,
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  carouselText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  carouselSubText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 4,
  },
  searchBar: {
    marginBottom: 20,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    height: 50,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  rewardCard: {
    marginVertical: 12,
    borderRadius: 16,
    elevation: 8,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  rewardImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 12,
  },
  rewardName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  rewardDetails: {
    fontSize: 16,
    marginBottom: 12,
    opacity: 0.8,
  },
  progressContainer: {
    marginVertical: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  progressBar: {
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
  },
  progressText: {
    fontSize: 16,
    marginTop: 6,
    fontWeight: '500',
  },
  rewardAchieved: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  remainingPoints: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  redeemButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 8,
    elevation: 6,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  notificationText: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 24,
  },
  notificationDate: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 6,
  },
  clearButton: {
    marginLeft: 10,
  },
  rewardHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6200EE',
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  markAllReadButton: {
    borderRadius: 8,
    paddingVertical: 6,
    elevation: 2,
  },
  historyItem: {
    marginVertical: 10,
    borderRadius: 12,
    elevation: 6,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  historyImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginBottom: 10,
  },
  historyName: {
    fontSize: 18,
    fontWeight: '600',
  },
  historyDetails: {
    fontSize: 14,
    marginVertical: 6,
    opacity: 0.8,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 18,
    marginVertical: 15,
    fontWeight: '500',
    opacity: 0.7,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modal: {
    width: 340,
    padding: 20,
    borderRadius: 16,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
    gap: 12,
  },
  statContainer: {
    marginVertical: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  statIcon: {
    marginRight: 12,
  },
});