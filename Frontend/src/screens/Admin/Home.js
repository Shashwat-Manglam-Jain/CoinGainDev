import React, { useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableWithoutFeedback,
  ImageBackground,
  Platform,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Button, Card, TextInput, Avatar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ThemeToggle from '../../components/ThemeToggle';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';
import { ThemeContext } from '../../ThemeContext';
import axios from 'axios';
import { API_BASE_URL } from '../../../utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const CARD_WIDTH = SCREEN_WIDTH - 100;
const CARD_HEIGHT = 250;

// Define ButtonText component
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

const Home = ({
  adminUser,
  users,
  rewards,
  invoice,
  amount,
  setAmount,
  rewardPercentage,
  setRewardPercentage,
  expiry,
  setExpiry,
  receiverCode,
  setReceiverCode,
  makepayment,
  handleTouchStart,
  handleTouchEnd,
  scrollRef,
  setIndex,
  navigation,
  setAdminUser,
}) => {
  const {
    isDarkMode,
    theme: { colors },
  } = useContext(ThemeContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editAdmin, setEditAdmin] = useState({
    name: adminUser?.name || '',
    mobile: adminUser?.mobile || '',
  });
  const [localRewardPercentage, setLocalRewardPercentage] = useState(rewardPercentage || 10);

  // Memoize rewardOptions
  const rewardOptions = useMemo(() => [10, 20, 30, 40, 50, 60, 70, 80, 90, 100], []);

  // Sync editAdmin with adminUser changes
  useEffect(() => {
    setEditAdmin({
      name: adminUser?.name || '',
      mobile: adminUser?.mobile || '',
    });
  }, [adminUser]);

  // Memoize handleRewardSelect
  const handleRewardSelect = useCallback(
    (value) => {
      console.log('Selected reward percentage:', value);
      setLocalRewardPercentage(value);
      setRewardPercentage(value);
    },
    [setRewardPercentage]
  );

  // Memoize handleGetReward
  const handleGetReward = useCallback(() => {
    const numericAmount = parseFloat(amount);
    const receiverCodeTrimmed = receiverCode?.trim();
    if (!amount || isNaN(numericAmount) || numericAmount <= 0 || !receiverCodeTrimmed) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid amount and receiver code',
      });
      return;
    }
    setModalAction(() => () => {
      setIsLoading(true);
      makepayment(
        invoice,
        numericAmount,
        localRewardPercentage,
        expiry,
        `${adminUser?.uniqueCode}${receiverCodeTrimmed}`
      ).finally(() => setIsLoading(false));
    });
    setModalVisible(true);
  }, [amount, receiverCode, invoice, localRewardPercentage, expiry, adminUser?.uniqueCode, makepayment]);

  // Memoize handleEditAdmin
  const handleEditAdmin = useCallback(() => {
    console.log('Opening edit modal with adminUser:', adminUser);
    setEditModalVisible(true);
  }, [adminUser]);

  // Memoize handleSaveAdmin
  const handleSaveAdmin = useCallback(async () => {
    if (!editAdmin.name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Name cannot be empty',
      });
      return;
    }
    if (!/^\d{10}$/.test(editAdmin.mobile)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Mobile number must be 10 digits',
      });
      return;
    }
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token is missing');
      }
      if (!adminUser?._id) {
        throw new Error('Admin user ID is missing');
      }
      console.log('Sending API request with payload:', {
        adminId: adminUser._id,
        name: editAdmin.name,
        phoneno: editAdmin.mobile,
      });

      const response = await axios.put(
        `${API_BASE_URL}/fetchdata/updateAdmin/${adminUser._id}`,
        {
          adminId: adminUser._id,
          name: editAdmin.name,
          phoneno: editAdmin.mobile,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.data.admin || !response.data.admin._id) {
        throw new Error('Invalid response from server: missing admin data');
      }

      const updatedUserInfo = {
        _id: response.data.admin._id,
        name: response.data.admin.name,
        mobile: response.data.admin.mobile,
        role: response.data.admin.role,
        uniqueCode: response.data.admin.uniqueCode,
      };
      await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      setAdminUser(updatedUserInfo);
      Toast.show({
        type: 'success',
        text1: 'Admin Updated',
        text2: 'Admin details saved successfully',
      });
    } catch (error) {
      console.error('Update admin error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.error || error.message || 'Failed to update admin',
      });
    } finally {
      setIsLoading(false);
      setEditModalVisible(false);
    }
  }, [editAdmin, adminUser, setAdminUser]);

  // Memoize points calculation for modal
  const calculatedPoints = useMemo(() => {
    const numericAmount = parseFloat(amount);
    return isNaN(numericAmount) ? 0 : Math.round((localRewardPercentage / 100) * numericAmount);
  }, [amount, localRewardPercentage]);

  // Memoize renderRewardItem
  const renderRewardItem = useCallback(
    ({ item }) => (
      <TouchableWithoutFeedback onPressIn={handleTouchStart} onPressOut={handleTouchEnd}>
        <ImageBackground
          key={item._id}
          source={{ uri: item.image }}
          resizeMode="contain"
          style={styles.carouselItem}
          imageStyle={styles.carouselImage}
          defaultSource={require('../../../assets/placeholder.webp')}
          onError={() =>
            Toast.show({
              type: 'error',
              text1: 'Image Error',
              text2: 'Failed to load reward image',
            })
          }
        >
          <View style={styles.textOverlay}>
            <Text style={styles.carouselText}>{item.name}</Text>
            <Text style={styles.carouselSubText}>{item.pointsRequired} points</Text>
          </View>
        </ImageBackground>
      </TouchableWithoutFeedback>
    ),
    [handleTouchStart, handleTouchEnd]
  );

  return (
    <View style={[styles.tabContent, { backgroundColor: isDarkMode ? '#121212' : '#f0f4f8' }]}>
      {/* Payment Confirmation Modal */}
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
            <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Payment</Text>
            <Text style={[styles.cardText, { color: colors.text }]}>Invoice: #{invoice}</Text>
            <Text style={[styles.cardText, { color: colors.text }]}>Paid Amount: ₹{parseFloat(amount || 0).toFixed(2)}</Text>
            <Text style={[styles.cardText, { color: colors.error }]}>Points: {calculatedPoints}</Text>
            <Text style={[styles.cardText, { color: colors.text }]}>Reward Percentage: {localRewardPercentage}%</Text>
            <Text style={[styles.cardText, { color: colors.text }]}>Expiry: {expiry}</Text>
            <Text style={[styles.cardText, { color: colors.text }]}>Receiver Code: {adminUser?.uniqueCode}{receiverCode}</Text>
            <View style={styles.buttonRow}>
              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  style={styles.actionButton}
                  buttonColor={colors.primary}
                  textColor="#fff"
                  onPress={() => {
                    modalAction();
                    setModalVisible(false);
                  }}
                  disabled={isLoading}
                  accessible
                  accessibilityLabel="Confirm payment"
                >
                  <ButtonText>{isLoading ? 'Processing...' : 'Confirm'}</ButtonText>
                </Button>
              </View>
              <View style={styles.buttonContainer}>
                <Button
                  mode="outlined"
                  style={styles.actionButton}
                  textColor={colors.text}
                  onPress={() => setModalVisible(false)}
                  disabled={isLoading}
                  accessible
                  accessibilityLabel="Cancel payment"
                >
                  <ButtonText>Cancel</ButtonText>
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      {/* Edit Admin Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modal,
              { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff', width: isWeb && SCREEN_WIDTH > 600 ? 400 : 320 },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>📝 Edit Admin Details</Text>
            <TextInput
              label="Name"
              value={editAdmin.name}
              onChangeText={(text) => setEditAdmin({ ...editAdmin, name: text })}
              style={styles.input}
              placeholderTextColor={colors.placeholder}
              underlineColorAndroid="transparent"
              theme={{ colors: { text: colors.text, primary: colors.primary } }}
            />
            <TextInput
              label="Mobile"
              value={editAdmin.mobile}
              onChangeText={(text) => setEditAdmin({ ...editAdmin, mobile: text })}
              keyboardType="phone-pad"
              style={styles.input}
              placeholderTextColor={colors.placeholder}
              underlineColorAndroid="transparent"
              theme={{ colors: { text: colors.text, primary: colors.primary } }}
            />
            <View style={styles.buttonRow}>
              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  style={styles.actionButton}
                  buttonColor={colors.primary}
                  textColor="#fff"
                  onPress={handleSaveAdmin}
                  disabled={isLoading}
                  accessible
                  accessibilityLabel="Save admin details"
                >
                  <ButtonText>{isLoading ? 'Saving...' : 'Save'}</ButtonText>
                </Button>
              </View>
              <View style={styles.buttonContainer}>
                <Button
                  mode="outlined"
                  style={styles.actionButton}
                  textColor={colors.text}
                  onPress={() => setEditModalVisible(false)}
                  disabled={isLoading}
                  accessible
                  accessibilityLabel="Cancel edit"
                >
                  <ButtonText>Cancel</ButtonText>
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      <View style={[styles.header, { position: 'relative', top: 10 }]}>
        <Text style={[styles.title, { color: colors.text, padding: 10 }]}>SHOP ADMIN</Text>
        <View style={styles.headerButtons}>
          <ThemeToggle style={styles.toggle} />
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              style={{ position: 'relative', right: 10 }}
              buttonColor={colors.error}
              textColor="#fff"
              onPress={async () => {
                try {
                  await AsyncStorage.multiRemove(['userInfo', 'userToken']);
                  navigation.navigate('Login');
                  Toast.show({
                    type: 'success',
                    text1: 'Logged Out',
                    text2: 'You have been logged out successfully',
                  });
                } catch (error) {
                  console.error('Logout error:', error);
                  Toast.show({
                    type: 'error',
                    text1: 'Logout Failed',
                    text2: 'Failed to log out: ' + error.message,
                  });
                }
              }}
            >
              <Text>Logout</Text>
            </Button>
          </View>
        </View>
      </View>
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
            position: 'relative',
            bottom: 10,
          },
        ]}
      >
        <Card.Title
          title="Admin Overview"
          titleStyle={[styles.cardTitle, { color: colors.text }]}
          left={() => (
            <Avatar.Icon
              size={40}
              icon="account-circle"
              style={{ backgroundColor: colors.primary }}
            />
          )}
          right={() => (
            <TouchableOpacity onPress={handleEditAdmin}>
              <MaterialIcons name="edit" size={30} color={colors.error} />
            </TouchableOpacity>
          )}
        />
        <Card.Content>
          <Text
            style={[styles.cardText, { color: colors.primary, fontWeight: 'bold' }]}
          >
            Admin: {adminUser?.name || 'Unknown'}
          </Text>
          <Text style={[styles.cardText, { color: colors.text }]}>
            Mobile: {adminUser?.mobile || 'N/A'}
          </Text>
          <Text style={[styles.cardText, { color: colors.text }]}>
            Role: {adminUser?.role || 'N/A'}
          </Text>
          <Text style={[styles.cardText, { color: colors.text }]}>
            Unique Code: {adminUser?.uniqueCode || 'N/A'}
          </Text>
          <Text style={[styles.cardText, { color: colors.text }]}>
            Total Users: {users.length}
          </Text>
          <Text style={[styles.cardText, { color: colors.text }]}>
            Total Coins Sent: {users.reduce((sum, u) => sum + (u.points || 0), 0)}
          </Text>
        </Card.Content>
      </View>
      <View
        style={{
          backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
          borderRadius: 16,
          padding: 20,
          margin: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 5,
        }}
      >
        <Card.Content>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
            Send Coins 💰
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 12, alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontSize: 16, flex: 0.7 }}>Invoice:</Text>
            <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 24 }}>
              #{invoice}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
            <Text style={{ color: colors.text, fontSize: 16, flex: 0.8 }}>Amount:</Text>
            <TextInput
              keyboardType="numeric"
              value={amount ? amount.toString() : ''}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9.]/g, '');
                setAmount(numericValue ? numericValue : '');
              }}
              placeholder="₹10000"
              placeholderTextColor={colors.placeholder}
              underlineColorAndroid="transparent"
              style={{
                flex: 1,
                backgroundColor: colors.input || (isDarkMode ? '#333' : '#f0f0f0'),
                borderRadius: 8,
                color: colors.text,
                fontSize: 22,
                padding: 10,
              }}
            />
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 12, alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontSize: 16, width: 105 }}>Send To:</Text>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.input || (isDarkMode ? '#333' : '#f0f0f0'),
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontSize: 16,
                  fontWeight: '600',
                  position: 'relative',
                  left: 15,
                }}
              >
                {adminUser?.uniqueCode || 'N/A'}
              </Text>
              <TextInput
                placeholder="01"
                keyboardType="numeric"
                value={receiverCode}
                onChangeText={(text) => setReceiverCode(text)}
                placeholderTextColor={colors.placeholder}
                underlineColorAndroid="transparent"
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: 16,
                  padding: 0,
                  margin: 0,
                }}
              />
            </View>
          </View>
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: colors.text, fontSize: 16, marginBottom: 8 }}>
              Reward Percentage:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {rewardOptions.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.rewardButton,
                    {
                      backgroundColor:
                        localRewardPercentage === value
                          ? colors.primary
                          : isDarkMode
                          ? '#333'
                          : '#f0f0f0',
                    },
                  ]}
                  onPress={() => handleRewardSelect(value)}
                >
                  <Text
                    style={{
                      color:
                        localRewardPercentage === value
                          ? '#fff'
                          : colors.text,
                      fontWeight: localRewardPercentage === value ? 'bold' : 'normal',
                      fontSize: 14,
                    }}
                  >
                    {value}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: colors.text, fontSize: 16, width: 80 }}>Expiry:</Text>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.input || (isDarkMode ? '#333' : '#f0f0f0'),
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <Picker
                selectedValue={expiry}
                onValueChange={(itemValue) => setExpiry(itemValue)}
                dropdownIconColor={colors.text}
                style={{
                  color: colors.text,
                  width: '100%',
                }}
              >
                <Picker.Item label="3 months" value="3 months" />
                <Picker.Item label="6 months" value="6 months" />
                <Picker.Item label="9 months" value="9 months" />
                <Picker.Item label="12 months" value="12 months" />
              </Picker>
            </View>
          </View>
          <Button
            mode="contained"
            buttonColor={colors.primary}
            textColor="#fff"
            contentStyle={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 8,
            }}
            labelStyle={{ fontSize: 16 }}
            onPress={handleGetReward}
            disabled={isLoading}
            style={{
              borderRadius: 10,
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 4,
              elevation: 3,
              marginTop: 10,
            }}
          >
            <Text style={{ color: '#fff', marginRight: 8 }}>Get Reward </Text>
            <MaterialCommunityIcons name="send" size={20} color="#fff" />
          </Button>
        </Card.Content>
      </View>
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
            position: 'relative',
            top: 10,
          },
        ]}
      >
        <Card.Title
          title="Rewards"
          titleStyle={[styles.cardTitle, { color: colors.text }]}
          left={() => (
            <Avatar.Icon
              size={40}
              icon="gift"
              style={{ backgroundColor: colors.primary }}
            />
          )}
        />
        <Card.Content>
          <FlatList
            ref={scrollRef}
            data={rewards}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH}
            decelerationRate="fast"
            snapToAlignment="center"
            renderItem={renderRewardItem}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={
              <View style={styles.carouselItem}>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  No rewards available
                </Text>
              </View>
            }
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
              setIndex(newIndex);
            }}
            getItemLayout={(data, index) => ({
              length: CARD_WIDTH,
              offset: CARD_WIDTH * index,
              index,
            })}
          />
        </Card.Content>
      </View>
    </View>
  );
};

export default React.memo(Home);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
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
  card: {
    marginVertical: 10,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    padding: 15,
  },
  editContainer: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  searchBar: {
    marginBottom: 20,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    height: 50,
  },
  input: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    marginVertical: 10,
    fontSize: 16,
    height: 50,
  },
  actionButton: {
    marginHorizontal: 8,
    marginVertical: 8,
    borderRadius: 12,
    minWidth: 100,
    paddingVertical: 6,
    minHeight: 40,
  },
  submitButton: {
    marginVertical: 15,
    borderRadius: 12,
    paddingVertical: 8,
    minHeight: 50,
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginVertical: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '600',
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
  emptyText: {
    textAlign: 'center',
    fontSize: 18,
    marginVertical: 15,
    fontWeight: '500',
  },
  carouselItem: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    justifyContent: 'flex-end',
    padding: 15,
    backgroundColor: '#f0f0f0',
  },
  carouselImage: {
    borderRadius: 16,
  },
  textOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 12,
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  carouselText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  carouselSubText: {
    color: '#fff',
    fontSize: 16,
  },
  rewardButton: {
    width: '18%',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 5,
  },
});