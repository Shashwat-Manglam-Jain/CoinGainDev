import React, { useContext, useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, ImageBackground, TouchableWithoutFeedback, Dimensions, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Card, Avatar, Button, Badge, TextInput } from 'react-native-paper';
import { ThemeContext } from '../../ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles, { ButtonText } from './styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 60;
import { API_BASE_URL } from '../../../utils/api';
import axios from 'axios';

const Profile = ({ user, admin, rewards, redemptions, handleLogout, updateUser ,setUser}) => {
  const { colors } = useTheme();
  const { isDarkMode } = useContext(ThemeContext);
  const scrollRef = useRef(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    mobile: user?.mobile || '',
    location: user?.location || '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    // Sync formData with user prop changes
    setFormData({
      name: user?.name || '',
      mobile: user?.mobile || '',
      location: user?.location || '',
    });
  }, [user]);

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
    }, 3000); // 3000ms for better UX
    return () => clearInterval(interval);
  }, [carouselIndex, isPaused, rewards.length]);

  const handleTouchStart = () => setIsPaused(true);
  const handleTouchEnd = () => setIsPaused(false);

  const handleEditUser = () => {
    setFormErrors({});
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.mobile.trim()) {
      errors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      errors.mobile = 'Mobile number must be 10 digits';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

const handleSave = async () => {
  if (!validateForm()) return;

  try {
    const token = await AsyncStorage.getItem('userToken');
    console.log('Token:', token);

    const updatedFields = {
      name: formData.name.trim(),
      mobile: formData.mobile.trim(),
      location: formData.location.trim(),
    };

    const response = await axios.put(
      `${API_BASE_URL}/Userfetch/edituser/${user._id}`,
      updatedFields,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const updatedUser = response.data?.user || response.data;

    // Update local state
    setUser({ ...user, ...updatedFields });

    // Update AsyncStorage
    const userInfoString = await AsyncStorage.getItem('userInfo');
    const userInfo = userInfoString ? JSON.parse(userInfoString) : {};
    const newUserInfo = { ...userInfo, ...updatedFields };
    await AsyncStorage.setItem('userInfo', JSON.stringify(newUserInfo));

    // Optional: Update parent state
    updateUser?.(updatedUser);

    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Profile updated successfully!',
    });

    closeModal();
  } catch (error) {
    console.error('Error updating user:', error);

    const errorMessage =
      error.response?.data?.message || 'Failed to update profile. Please try again.';

    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: errorMessage,
    });
  }
};



  return (
    <View style={[styles.tabContent, { position: 'relative', bottom: 25 }]}>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={modalStyles.modalOverlay}>
          <View style={[modalStyles.modalContent, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
            <Text style={[modalStyles.modalTitle, { color: colors.text }]}>Edit User</Text>
            <TextInput
              label="Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              mode="outlined"
              error={!!formErrors.name}
              style={modalStyles.input}
              theme={{ colors: { text: colors.text, primary: colors.primary, background: isDarkMode ? '#2A2A2A' : '#FFFFFF' } }}
            />
            {formErrors.name && (
              <Text style={modalStyles.errorText}>{formErrors.name}</Text>
            )}
            <TextInput
              label="Mobile No"
              value={formData.mobile}
              onChangeText={(text) => setFormData({ ...formData, mobile: text })}
              keyboardType="phone-pad"
              mode="outlined"
              error={!!formErrors.mobile}
              style={modalStyles.input}
              theme={{ colors: { text: colors.text, primary: colors.primary, background: isDarkMode ? '#2A2A2A' : '#FFFFFF' } }}
            />
            {formErrors.mobile && (
              <Text style={modalStyles.errorText}>{formErrors.mobile}</Text>
            )}
            <TextInput
              label="Location"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              mode="outlined"
              style={modalStyles.input}
              theme={{ colors: { text: colors.text, primary: colors.primary, background: isDarkMode ? '#2A2A2A' : '#FFFFFF' } }}
            />
            <View style={modalStyles.modalActions}>
              <TouchableOpacity
                onPress={closeModal}
                style={[modalStyles.actionButton, { backgroundColor: colors.backdrop }]}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={[modalStyles.actionButton, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: '#fff' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={styles.tabContent}>
        <View style={[styles.header]}>
          <Text style={[styles.title, { color: colors.text, paddingRight: 10 }]}>
            Coin Gain
          </Text>
          <View style={styles.headerButtons}>
            <ThemeToggle style={styles.toggle} />
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
          titleStyle={[styles.cardTitle, { color: colors.text, top: 10 }]}
          left={() => (
            <Avatar.Text
              size={48}
              label={user?.name?.charAt(0) || 'U'}
              style={{ backgroundColor: colors.primary, marginRight: 12 , top: 5}}
            />
          )}
          right={() => (
            <TouchableOpacity onPress={handleEditUser} style={{ marginRight: 30 , top: 5}}>
              <MaterialCommunityIcons name="book-edit" size={30} color={colors.error} />
            </TouchableOpacity>
          )}
        />
        <Card.Content style={{ marginLeft: 10 }}>
          <Text style={[styles.cardText, { color: colors.primary, fontWeight: 'bold' }]}>
            {user?.name || 'Unknown'}
          </Text>
          <Text style={[styles.cardText, { color: 'green', fontWeight: 'bold' }]}>
            Points: {user?.points ?? 0}
          </Text>
          <Text style={[styles.cardText, { color: colors.error }]}>
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
      <View style={[styles.sliderContainer, { position: 'relative', top: 25 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Rewards</Text>
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
              <TouchableWithoutFeedback
                key={item._id.toString()}
                onPressIn={handleTouchStart}
                onPressOut={handleTouchEnd}
              >
                <ImageBackground
                  source={{ uri: item.image }}
                  resizeMode="cover"
                  style={styles.carouselItem}
                  imageStyle={styles.carouselImage}
                  defaultSource={require('../../../assets/placeholder.webp')}
                  onError={() => console.log(`Failed to load reward image: ${item.image}`)}
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
              </TouchableWithoutFeedback>
            ))
          ) : (
            <View style={styles.carouselItem}>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No rewards available
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
      <View style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF', position: 'relative', top: 25 }]}>
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
        <View style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF', position: 'relative', top: 25}]}>
          <Card.Title
            title="Assigned Admin"
            titleStyle={[styles.cardTitle, { color: colors.text,top:5 }]}
            left={() => (
              <Avatar.Icon
                size={48}
                icon="account-circle"
                style={{ backgroundColor: colors.primary, marginRight: 12 }}
              />
            )}
          />
          <Card.Content style={{ marginLeft: 10 }}>
            <Text style={[styles.cardText, { color: colors.primary }]}>
              Admin: {admin.name || 'Unknown'}
            </Text>
            <Text style={[styles.cardText, { color: colors.error }]}>
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

const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 14,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    padding: 10,
    borderRadius: 6,
    width: '48%',
    alignItems: 'center',
  },
});

export default Profile;