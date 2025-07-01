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
} from 'react-native';
import { Button, Card, TextInput, useTheme, Avatar, Badge } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 80;
const CARD_HEIGHT = 280;

// Dummy data
const mockUser = {
  name: 'Alice Johnson',
  mobile: '+1-555-123-4567',
  location: 'San Francisco, CA',
  points: 325,
  level: 'Gold',
  joinDate: '2024-01-15',
};

const mockAdmin = {
  name: 'Emma Smith',
  uniqueCode: 'ADM789',
};

const mockRewards = [
  { _id: '1', name: 'Amazon Gift Card', price: 100, pointsRequired: 100, image: 'https://via.placeholder.com/300x200?text=Gift+Card', tag: 'Popular' },
  { _id: '2', name: 'Free Coffee Voucher', price: 50, pointsRequired: 50, image: 'https://via.placeholder.com/300x200?text=Coffee', tag: 'New' },
  { _id: '3', name: 'Movie Tickets', price: 200, pointsRequired: 150, image: 'https://via.placeholder.com/300x200?text=Movie', tag: '' },
  { _id: '4', name: 'Headphones', price: 500, pointsRequired: 400, image: 'https://via.placeholder.com/300x200?text=Headphones', tag: 'Popular' },
  { _id: '5', name: 'Spa Voucher', price: 300, pointsRequired: 250, image: 'https://via.placeholder.com/300x200?text=Spa', tag: '' },
  { _id: '6', name: 'Fitness Tracker', price: 1000, pointsRequired: 800, image: 'https://via.placeholder.com/300x200?text=Fitness', tag: 'New' },
];

const mockNotifications = [
  { _id: '1', message: 'You earned a Free Coffee Voucher!', createdAt: '2025-06-30T10:00:00Z', read: false, type: 'reward_achieved', rewardId: { name: 'Free Coffee Voucher' } },
  { _id: '2', message: 'Redemption for Amazon Gift Card approved', createdAt: '2025-06-29T15:30:00Z', read: true, type: 'redemption_approved', rewardId: { name: 'Amazon Gift Card' } },
  { _id: '3', message: 'New reward added: Spa Voucher', createdAt: '2025-06-28T09:00:00Z', read: false, type: 'system', rewardId: null },
  { _id: '4', message: 'Your redemption for Movie Tickets is pending', createdAt: '2025-06-27T12:00:00Z', read: false, type: 'redemption_pending', rewardId: { name: 'Movie Tickets' } },
  { _id: '5', message: 'Earned 20 points for Daily Login', createdAt: '2025-06-26T08:00:00Z', read: true, type: 'points_earned', rewardId: null },
  { _id: '6', message: 'Redemption for Headphones rejected', createdAt: '2025-06-25T14:00:00Z', read: true, type: 'redemption_rejected', rewardId: { name: 'Headphones' } },
  { _id: '7', message: 'Invite a friend to earn 50 points!', createdAt: '2025-06-24T11:00:00Z', read: false, type: 'system', rewardId: null },
  { _id: '8', message: 'Level up! You’re now Gold tier', createdAt: '2025-06-23T16:00:00Z', read: true, type: 'level_up', rewardId: null },
];

const mockRedemptions = [
  { _id: '1', rewardId: { name: 'Amazon Gift Card', image: 'https://via.placeholder.com/80?text=Gift+Card' }, redeemedAt: '2025-06-30T10:00:00Z', status: 'approved' },
  { _id: '2', rewardId: { name: 'Free Coffee Voucher', image: 'https://via.placeholder.com/80?text=Coffee' }, redeemedAt: '2025-06-29T15:30:00Z', status: 'pending' },
  { _id: '3', rewardId: { name: 'Movie Tickets', image: 'https://via.placeholder.com/80?text=Movie' }, redeemedAt: '2025-06-28T09:00:00Z', status: 'pending' },
  { _id: '4', rewardId: { name: 'Headphones', image: 'https://via.placeholder.com/80?text=Headphones' }, redeemedAt: '2025-06-27T12:00:00Z', status: 'rejected' },
  { _id: '5', rewardId: { name: 'Spa Voucher', image: 'https://via.placeholder.com/80?text=Spa' }, redeemedAt: '2025-06-26T08:00:00Z', status: 'approved' },
];

const mockCoinGainActivities = [
  { id: '1', name: 'Daily Login', description: 'Log in daily to earn bonus points', points: 15, maxPoints: 20, category: 'Daily' },
  { id: '2', name: 'Refer a Friend', description: 'Invite a friend to join and earn points', points: 75, maxPoints: 100, category: 'Social' },
  { id: '3', name: 'Complete Profile', description: 'Fill out your profile details', points: 40, maxPoints: 50, category: 'Profile' },
  { id: '4', name: 'Share on Social Media', description: 'Share your achievements on social media', points: 20, maxPoints: 30, category: 'Social' },
  { id: '5', name: 'Weekly Challenge', description: 'Complete the weekly challenge tasks', points: 60, maxPoints: 100, category: 'Challenge' },
  { id: '6', name: 'Survey Participation', description: 'Participate in user surveys', points: 25, maxPoints: 50, category: 'Engagement' },
];

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
      if (!isPaused && mockRewards.length > 0) {
        const nextIndex = (carouselIndex + 1) % mockRewards.length;
        scrollRef.current?.scrollTo({
          x: nextIndex * CARD_WIDTH,
          animated: true,
        });
        setCarouselIndex(nextIndex);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [carouselIndex, isPaused]);

  const handleTouchStart = () => setIsPaused(true);
  const handleTouchEnd = () => setIsPaused(false);

  const handleTabPress = useCallback((tab) => {
    setCurrentTab(tab);
  }, []);

  const handleLogout = useCallback(() => {
    setModalMessage('Are you sure you want to log out?');
    setModalAction(() => () => {
      setModalVisible(false);
      // Add logout logic here
    });
    setModalVisible(true);
  }, []);

  const handleToggleRewardHistory = useCallback(() => {
    setShowRewardHistory((prev) => !prev);
  }, []);

  const handleCardPress = useCallback(() => {}, []);
  const handleClearNotification = useCallback(() => {}, []);
  const handleClearRedemption = useCallback(() => {}, []);
  const handleRedeem = useCallback((rewardName) => {
    setModalMessage(`Confirm redemption of ${rewardName}?`);
    setModalAction(() => () => {
      setModalVisible(false);
      // Add redemption logic here
    });
    setModalVisible(true);
  }, []);

  const renderContent = () => {
    switch (currentTab) {
      case 'profile':
        return (
          <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
            <View style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
              <View style={[styles.cardGradient, { backgroundColor: isDarkMode ? '#3A3A3A' : '#F5F5F5' }]} />
              <Card.Title
                title="Your Profile"
                titleStyle={[styles.cardTitle, { color: colors.text }]}
                left={() => (
                  <Avatar.Text
                    size={48}
                    label={mockUser.name?.charAt(0) || 'U'}
                    style={{ backgroundColor: colors.primary, marginRight: 12 }}
                  />
                )}
              />
              <Card.Content>
                <Text style={[styles.cardText, { color: colors.text, fontWeight: 'bold' }]}>
                  {mockUser.name || 'Unknown'}
                </Text>
                <Text style={[styles.cardText, { color: colors.text }]}>
                  Mobile: {mockUser.mobile || 'Unknown'}
                </Text>
                <Text style={[styles.cardText, { color: colors.text }]}>
                  Location: {mockUser.location || 'Unknown'}
                </Text>
                <Text style={[styles.cardText, { color: colors.primary, fontWeight: 'bold' }]}>
                  Points: {mockUser.points ?? 0}
                </Text>
                <Text style={[styles.cardText, { color: colors.text }]}>
                  Level: {mockUser.level || 'N/A'}
                </Text>
                <Text style={[styles.cardText, { color: colors.text }]}>
                  Joined: {new Date(mockUser.joinDate).toLocaleDateString()}
                </Text>
              </Card.Content>
            </View>
            <View style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
              <View style={[styles.cardGradient, { backgroundColor: isDarkMode ? '#3A3A3A' : '#F5F5F5' }]} />
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
                      Points Earned: {mockUser.points}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="gift" size={28} color={colors.primary} style={styles.statIcon} />
                    <Text style={[styles.cardText, { color: colors.text }]}>
                      Rewards Redeemed: {mockRedemptions.filter((r) => r.status === 'approved').length}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <MaterialIcons name="check-circle" size={28} color={colors.primary} style={styles.statIcon} />
                    <Text style={[styles.cardText, { color: colors.text }]}>
                      Activities Completed: {mockCoinGainActivities.filter((a) => a.points >= a.maxPoints).length}
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
                  {mockRewards.length > 0 ? (
                    mockRewards.map((item) => (
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
            {mockAdmin && (
              <View style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
                <View style={[styles.cardGradient, { backgroundColor: isDarkMode ? '#3A3A3A' : '#F5F5F5' }]} />
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
                    Admin: {mockAdmin.name || 'Unknown'}
                  </Text>
                  <Text style={[styles.cardText, { color: colors.text }]}>
                    Unique Code: {mockAdmin.uniqueCode || 'N/A'}
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
              data={mockRewards.filter((reward) =>
                reward.name.toLowerCase().includes(searchReward.toLowerCase())
              )}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => {
                const pointsEarned = mockUser.points; // Use user points for progress
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
                      <View style={[styles.cardGradient, { backgroundColor: isDarkMode ? '#3A3A3A' : '#F5F5F5' }]} />
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
                              onPress={() => handleRedeem(item.name)}
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
            <View style={styles.rewardHistoryHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Reward History</Text>
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
                data={mockRedemptions}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={handleCardPress} activeOpacity={0.8}>
                    <View style={[styles.historyItem, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
                      <View style={[styles.cardGradient, { backgroundColor: isDarkMode ? '#3A3A3A' : '#F5F5F5' }]} />
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
                          {item.rewardId?.name}
                        </Text>
                        <Text style={[styles.historyDetails, { color: colors.text }]}>
                          Redeemed: {new Date(item.redeemedAt).toLocaleString()} | Status: {item.status}
                        </Text>
                        {item.status === 'pending' && (
                          <Button
                            mode="outlined"
                            onPress={handleClearRedemption}
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
            <FlatList
              data={mockNotifications}
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
                    size='36'
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
                    onPress={handleClearNotification}
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
      case 'coin-gain':
        return (
          <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Earn More Coins</Text>
            <FlatList
              data={mockCoinGainActivities}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const progress = Math.min((item.points / item.maxPoints) * 100, 100);
                return (
                  <TouchableOpacity onPress={handleCardPress} activeOpacity={0.8}>
                    <View style={[styles.activityCard, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
                      <View style={[styles.cardGradient, { backgroundColor: isDarkMode ? '#3A3A3A' : '#F5F5F5' }]} />
                      <Card.Content>
                        <Avatar.Icon
                          size={48}
                          icon={item.category === 'Daily' ? 'calendar' : item.category === 'Social' ? 'share' : 'star'}
                          style={{ backgroundColor: colors.primary, marginBottom: 12 }}
                        />
                        <Text style={[styles.activityName, { color: colors.text }]}>
                          {item.name}
                        </Text>
                        <Text style={[styles.activityDetails, { color: colors.text }]}>
                          {item.description}
                        </Text>
                        <Text style={[styles.activityPoints, { color: colors.primary }]}>
                          +{item.points} Points
                        </Text>
                        <View style={styles.progressContainer}>
                          <View style={styles.progressBar}>
                            <Animated.View
                              style={[
                                styles.progressFill,
                                {
                                  width: `${progress}%`,
                                  backgroundColor: colors.primary,
                                },
                              ]}
                            />
                          </View>
                          <Text style={[styles.progressText, { color: colors.text }]}>
                            {item.points}/{item.maxPoints} points ({progress.toFixed(1)}%)
                          </Text>
                        </View>
                        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                          <Button
                            mode="contained"
                            onPress={() => {}}
                            style={styles.actionButton}
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
                            <ButtonText>Take Action</ButtonText>
                          </Button>
                        </Animated.View>
                      </Card.Content>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={() => (
                <Text style={[styles.emptyText, { color: colors.text }]}>No activities available.</Text>
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

  const unreadNotifications = mockNotifications.filter((n) => !n.read).length;

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
              style={styles.logoutButton}
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
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: 80 }]}
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
        {['profile', 'rewards', 'coin-gain'].map((tab) => (
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
                    : 'star'
                }
                size={30}
                color={currentTab === tab ? colors.primary : colors.text}
              />
              {tab === 'rewards' && unreadNotifications > 0 && (
                <Badge style={styles.tabBadge}>{unreadNotifications}</Badge>
              )}
            </View>
            <Text
              style={[
                styles.tabText,
                { color: currentTab === tab ? colors.primary : colors.text },
              ]}
            >
              {tab === 'profile' ? 'Profile' : tab === 'rewards' ? 'Rewards' : 'Coin Gain'}
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
    fontSize: 30,
    fontWeight: '800',
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
    paddingVertical: 15,
    ...(Platform.OS === 'web' ? { transition: 'transform 0.2s ease' } : {}),
  },
  activeTab: {
    borderBottomWidth: 4,
    borderBottomColor: '#FFD700',
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
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabText: {
    fontSize: 14,
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
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '20%',
    opacity: 0.3,
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
  activityCard: {
    marginVertical: 12,
    borderRadius: 16,
    elevation: 8,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  activityName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  activityDetails: {
    fontSize: 16,
    marginBottom: 8,
    opacity: 0.8,
  },
  activityPoints: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionButton: {
    marginHorizontal: 8,
    marginVertical: 8,
    borderRadius: 12,
    paddingVertical: 6,
    minHeight: 44,
    elevation: 4,
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