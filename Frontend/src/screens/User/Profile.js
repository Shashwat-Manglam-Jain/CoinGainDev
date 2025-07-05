import React, { useContext, useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, ImageBackground, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { useTheme, Card, Avatar, Button, Badge } from 'react-native-paper';
import { ThemeContext } from '../../ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import styles, { ButtonText } from './styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 50;
const CARD_HEIGHT = 280;

const Profile = ({ user, admin, rewards, redemptions, handleLogout }) => {
  const { colors } = useTheme();
  const { isDarkMode } = useContext(ThemeContext);
  const scrollRef = useRef(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

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

  return (
    <View style={[styles.tabContent, { position: 'relative', bottom: 28 }]}>
      <View style={styles.tabContent}>
        <View style={[styles.header]}>
          <Text style={[styles.title, { color: colors.text, paddingRight: 10 }]}>
            Coin Gain
          </Text>
          <View style={styles.headerButtons}>
            <ThemeToggle style ={styles.toggle} />
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                style={{ position: 'relative', right: 10 }}
                buttonColor={colors.error}
                textColor="#fff"
                onPress={handleLogout}
              >
                <ButtonText>Logout</ButtonText>
              </Button>
            </View>
          </View>
        </View>
      </View>
      <View style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF', position: 'relative', top: 50 }]}>
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
          <Text style={[styles.cardText, { color: colors.primary, fontWeight: 'bold' }]}>
            {user?.name || 'Unknown'}
          </Text>
          <Text style={[styles.cardText, { color: colors.error, fontWeight: 'bold' }]}>
            Points: {user?.points ?? 0}
          </Text>
          <Text style={[styles.cardText, { color: colors.text }]}>
            Unique Code: {user?.userUniqueCode || 'Unknown'}
          </Text>
          <Text style={[styles.cardText, { color: colors.text }]}>
            Mobile: {user?.mobile || 'Unknown'}
          </Text>
          <Text style={[styles.cardText, { color: colors.text }]}>
            Location: {user?.location || 'Unknown'}
          </Text>
          <Text style={[styles.cardText, { color: colors.text }]}>
            Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
          </Text>
        </Card.Content>
      </View>
      <View style={[styles.sliderContainer, { position: 'relative', top: 50 }]}>
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
                  defaultSource={require('../../../assets/placeholder.webp')}
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
      <View style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF', position: 'relative', top: 50 }]}>
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
      {admin && (
        <View style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF', position: 'relative', top: 50 }]}>
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
            <Text style={[styles.cardText, { color: colors.text }]}>
              Mobile: {admin.mobile || 'N/A'}
            </Text>
          </Card.Content>
        </View>
      )}
    </View>
  );
};

export default Profile;
