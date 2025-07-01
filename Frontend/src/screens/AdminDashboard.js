import React, {
  useState,
  useRef,
  useContext,
  useEffect,
  useCallback,
} from "react";
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
  Alert,
  ScrollView,
  Image,
  BackHandler,
} from "react-native";
import { Button, Card, TextInput, useTheme, Avatar } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ThemeToggle from "../components/ThemeToggle";
import { ThemeContext } from "../ThemeContext";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import axios from "axios";
import { API_BASE_URL } from "../../utils/api";
import { useFocusEffect } from "@react-navigation/native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const CARD_HEIGHT = 250;
const CARD_WIDTH = SCREEN_WIDTH - 100;

const defaultAdminUser = {
  _id: "686263569a144823f5094869",
  name: "Shashwat",
  mobile: "94244xxxxx",
  role: "admin",
  uniqueCode: "VJGAJW",
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

export default function AdminDashboard({ navigation }) {
  const { colors } = useTheme();
  const { isDarkMode } = useContext(ThemeContext);
  const [users, setUsers] = useState([]);
  const [searchUser, setSearchUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [currentTab, setCurrentTab] = useState("home");
  const [adminUser, setAdminUser] = useState(null);
  const [coinSettings, setCoinSettings] = useState({ userId: "", amount: "" });
  const [sendTokenUserId, setSendTokenUserId] = useState(null);
  const [tokenAmount, setTokenAmount] = useState("");
  const [rewards, setRewards] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingRewardId, setDeletingRewardId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [newReward, setNewReward] = useState({
    name: "",
    price: "",
    pointsRequired: "",
    image: null,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalAction, setModalAction] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingRewardId, setEditingRewardId] = useState(null);

  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
        Alert.alert("Exit App", "Do you really want to exit?", [
          { text: "Cancel", style: "cancel" },
          { text: "OK", onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      });

      return () => backHandler.remove();
    }, [])
  );


  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused && rewards.length > 0) {
        const nextIndex = (index + 1) % rewards.length;
        scrollRef.current?.scrollTo({
          x: nextIndex * CARD_WIDTH,
          animated: !isWeb,
        });
        setIndex(nextIndex);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [index, isPaused, rewards]);

  const handleTouchStart = () => setIsPaused(true);
  const handleTouchEnd = () => setIsPaused(false);

  useEffect(() => {
    const loadAdminUser = async () => {
      try {
        setLoading(true);
        const userInfo = await AsyncStorage.getItem("userInfo");
        const parsedUser = userInfo ? JSON.parse(userInfo) : defaultAdminUser;
        setAdminUser(parsedUser);
        await Promise.all([
          fetchUsers(parsedUser._id),
          fetchRewards(parsedUser._id),
          fetchNotifications(parsedUser._id),
          fetchRedemptions(parsedUser._id),
        ]);
      } catch (error) {
        Alert.alert("Error", "Failed to load user info: " + error.message);
        setAdminUser(defaultAdminUser);
      } finally {
        setLoading(false);
      }
    };
    loadAdminUser();
  }, []);

  const fetchUsers = useCallback(async (adminId) => {
    try {
      if (!adminId) {
        throw new Error("Invalid Admin. Please relogin");
      }
      const token = await AsyncStorage.getItem("userToken");
      const response = await axios.get(
        `${API_BASE_URL}/fetchdata/admin/${adminId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUsers(response.data || []);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to fetch users");
      setUsers([]);
    }
  }, []);

  const fetchRewards = useCallback(async (adminId) => {
    try {
      if (!adminId) {
        throw new Error("Invalid Admin. Please relogin");
      }
      const token = await AsyncStorage.getItem("userToken");
      const response = await axios.get(
        `${API_BASE_URL}/datafetch/rewards/${adminId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRewards(response.data || []);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch rewards: " + error.message);
      setRewards([]);
    }
  }, []);

  const fetchNotifications = useCallback(async (adminId) => {
    try {
      if (!adminId) {
        throw new Error("Invalid Admin. Please relogin");
      }
      const token = await AsyncStorage.getItem("userToken");
      const response = await axios.get(
        `${API_BASE_URL}/datafetch/notifications/${adminId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications(response.data || []);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch notifications: " + error.message);
      setNotifications([]);
    }
  }, []);

  const fetchRedemptions = useCallback(async (adminId) => {
    try {
      if (!adminId) {
        throw new Error("Invalid Admin. Please relogin");
      }
      const token = await AsyncStorage.getItem("userToken");
      const response = await axios.get(
        `${API_BASE_URL}/datafetch/redemptions/${adminId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRedemptions(response.data || []);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch redemptions: " + error.message);
      setRedemptions([]);
    }
  }, []);

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
  };

  const handleButtonPress = (callback) => {
    callback();
  };

  const handleImageUpload = async () => {
    try {
      if (isWeb) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            if (file.size > 5 * 1024 * 1024) {
              Alert.alert("Error", "Image size must be less than 5MB");
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
          type: "image/*",
          copyToCacheDirectory: true,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const { uri, size } = result.assets[0];
          if (size > 5 * 1024 * 1024) {
            Alert.alert("Error", "Image size must be less than 5MB");
            return;
          }
          setNewReward({ ...newReward, image: uri });
          setImagePreview(uri);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to upload image: " + error.message);
    }
  };

  const handleEditUser = (user) => {
    setEditUser({ ...user });
  };

  const handleSaveUser = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      await axios.put(
        `${API_BASE_URL}/fetchdata/user/${editUser._id}`,
        editUser,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUsers((prev) =>
        prev.map((u) => (u._id === editUser._id ? { ...editUser } : u))
      );
      setEditUser(null);
    } catch (error) {
      Alert.alert("Error", "Failed to save user: " + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    setModalMessage("Are you sure you want to delete this user?");
    setModalAction(() => async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        await axios.delete(`${API_BASE_URL}/fetchdata/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers((prev) => prev.filter((u) => u._id !== userId));
        setModalVisible(false);
      } catch (error) {
        Alert.alert("Error", "Failed to delete user: " + error.message);
      }
    });
    setModalVisible(true);
  };

  const handleSendTokens = async (userId) => {
    if (!tokenAmount || isNaN(tokenAmount) || parseInt(tokenAmount) <= 0) {
      Alert.alert("Error", "Please enter a valid token amount");
      return;
    }
    const user = users.find((u) => u._id === userId);
    setModalMessage(`Send ${tokenAmount} tokens to ${user.name}?`);
    setModalAction(() => async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const response = await axios.post(
          `${API_BASE_URL}/fetchdata/user/${userId}/addcoin`,
          { amount: parseInt(tokenAmount) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUsers((prev) =>
          prev.map((u) =>
            u._id === userId
              ? { ...u, points: u.points + parseInt(tokenAmount) }
              : u
          )
        );
        setNotifications((prev) => [
          ...prev,
          {
            _id: `${Date.now()}`,
            message: `Sent ${tokenAmount} tokens to ${user.name}`,
            createdAt: new Date().toISOString(),
            read: false,
          },
        ]);
        setTokenAmount("");
        setSendTokenUserId(null);
        setModalVisible(false);
      } catch (error) {
        Alert.alert(
          "Error",
          error.response?.data?.error || "Failed to send tokens"
        );
      }
    });
    setModalVisible(true);
  };

  const handleSendCoins = async () => {
    const { userId, amount } = coinSettings;
    if (!userId || !amount || isNaN(amount) || parseInt(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid user ID and coin amount");
      return;
    }
    const user = users.find(
      (u) =>
        u.name === userId ||
        u._id === userId ||
        u.mobile === userId ||
        u.uniqueCode === userId
    );
    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }
    setModalMessage(
      `Are you sure you want to send ${amount} coins to ${user.name}?`
    );
    setModalAction(() => async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const response = await axios.post(
          `${API_BASE_URL}/fetchdata/user/${user._id}/addcoin`,
          { amount: parseInt(amount) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUsers((prev) =>
          prev.map((u) =>
            u._id === user._id
              ? { ...u, points: u.points + parseInt(amount) }
              : u
          )
        );
        setNotifications((prev) => [
          ...prev,
          {
            _id: `${Date.now()}`,
            message: `Sent ${amount} coins to ${user.name}`,
            createdAt: new Date().toISOString(),
            read: false,
          },
        ]);
        setCoinSettings({ userId: "", amount: "" });
        setModalVisible(false);
      } catch (error) {
        Alert.alert(
          "Error",
          error.response?.data?.error || "Failed to send coins"
        );
      }
    });
    setModalVisible(true);
  };

  const handleAddReward = async () => {
    if (
      !newReward.name ||
      !newReward.price ||
      !newReward.pointsRequired ||
      !newReward.image
    ) {
      Alert.alert("Error", "Please fill all reward fields and upload an image");
      return;
    }
    setIsUploading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (editingRewardId) {
        // Update existing reward
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
            reward._id === editingRewardId
              ? { ...newReward, _id: editingRewardId }
              : reward
          )
        );
      } else {
        // Add new reward
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
        setRewards((prev) => [
          ...prev,
          { ...newReward, _id: response.data._id },
        ]);
      }
      setNewReward({ name: "", price: "", pointsRequired: "", image: null });
      setImagePreview(null);
      setEditingRewardId(null);
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.error ||
          `Failed to ${editingRewardId ? "update" : "add"} reward`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelEdit = () => {
    setNewReward({ name: "", price: "", pointsRequired: "", image: null });
    setImagePreview(null);
    setEditingRewardId(null);
  };

  const handleDeleteReward = async (rewardId) => {
    setModalMessage("Are you sure you want to delete this reward?");
    setModalAction(() => async () => {
      try {
        setDeletingRewardId(rewardId);
        const token = await AsyncStorage.getItem("userToken");
        await axios.delete(
          `${API_BASE_URL}/fetchdata/admin/reward/${rewardId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setRewards((prev) => prev.filter((r) => r._id !== rewardId));
        setModalVisible(false);
      } catch (error) {
        Alert.alert(
          "Error",
          error.response?.data?.error || "Failed to delete reward"
        );
      } finally {
        setDeletingRewardId(null);
      }
    });
    setModalVisible(true);
  };

  const handleClearNotification = async (notificationId) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      await axios.delete(
        `${API_BASE_URL}/fetchdata/notification/${notificationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (error) {
      Alert.alert("Error", "Failed to clear notification: " + error.message);
    }
  };

  const handleDismissAllNotifications = async () => {
    setModalMessage("Clear all notifications?");
    setModalAction(() => async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        await axios.delete(`${API_BASE_URL}/fetchdata/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications([]);
        setModalVisible(false);
      } catch (error) {
        Alert.alert("Error", "Failed to clear notifications: " + error.message);
      }
    });
    setModalVisible(true);
  };

  const handleApproveRedemption = async (redemptionId) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      await axios.put(
        `${API_BASE_URL}/fetchdata/redemption/${redemptionId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRedemptions((prev) =>
        prev.map((r) =>
          r._id === redemptionId ? { ...r, status: "approved" } : r
        )
      );
    } catch (error) {
      Alert.alert("Error", "Failed to approve redemption: " + error.message);
    }
  };

  const handleRejectRedemption = async (redemptionId) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      await axios.put(
        `${API_BASE_URL}/fetchdata/redemption/${redemptionId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRedemptions((prev) =>
        prev.map((r) =>
          r._id === redemptionId ? { ...r, status: "rejected" } : r
        )
      );
    } catch (error) {
      Alert.alert("Error", "Failed to reject redemption: " + error.message);
    }
  };

  // Data for FlatList to render tab content
  const tabData = [{ key: currentTab }];

  const renderTabContent = ({ item }) => {
    switch (item.key) {
      case "home":
        return (
          <View style={styles.tabContent}>
            <View style={[styles.header]}>
              <Text style={[styles.title, { color: colors.text ,paddingRight:10}]}>
                Admin Dashboard
              </Text>
              <View style={styles.headerButtons}>
                <ThemeToggle style={styles.toggle} />
                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                  style={{position:'relative',right:10}}
                    buttonColor={colors.error}
                    textColor="#fff"
                    onPress={() =>
                      handleButtonPress(async () => {
                        await AsyncStorage.multiRemove([
                          "userInfo",
                          "userToken",
                        ]);
                        navigation.navigate("Login");
                      })
                    }
                  >
                    <Text>Logout</Text>
                  </Button>
                </View>
              </View>
            </View>
            <View
              style={[
                styles.card,
                { backgroundColor: isDarkMode ? "#1e1e1e" : "#fff" },
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
              />
              <Card.Content>
                <Text
                  style={[
                    styles.cardText,
                    { color: colors.primary, fontWeight: "bold" },
                  ]}
                >
                  Admin: {adminUser?.name || "Unknown"}
                </Text>
                <Text style={[styles.cardText, { color: colors.text }]}>
                  Mobile: {adminUser?.mobile || "N/A"}
                </Text>
                <Text style={[styles.cardText, { color: colors.text }]}>
                  Role: {adminUser?.role || "N/A"}
                </Text>
                <Text style={[styles.cardText, { color: colors.text }]}>
                  Unique Code: {adminUser?.uniqueCode || "N/A"}
                </Text>
                <Text style={[styles.cardText, { color: colors.text }]}>
                  Total Users: {users.length}
                </Text>
                <Text style={[styles.cardText, { color: colors.text }]}>
                  Total Coins Sent:{" "}
                  {users.reduce((sum, u) => sum + (u.points || 0), 0)}
                </Text>
              </Card.Content>
            </View>
            <View
              style={[
                styles.card,
                { backgroundColor: isDarkMode ? "#1e1e1e" : "#fff" },
              ]}
            >
              <Card.Content>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Send Coins 💰
                </Text>
                <TextInput
                  label="User Name/ID/Number/UniqueCode"
                  value={coinSettings.userId}
                  onChangeText={(text) =>
                    setCoinSettings({ ...coinSettings, userId: text })
                  }
                  style={styles.input}
                  theme={{
                    colors: { text: colors.text, primary: colors.primary },
                  }}
                  mode="outlined"
                />
                <TextInput
                  label="Coin Amount"
                  value={coinSettings.amount}
                  onChangeText={(text) =>
                    setCoinSettings({ ...coinSettings, amount: text })
                  }
                  style={styles.input}
                  theme={{
                    colors: { text: colors.text, primary: colors.primary },
                  }}
                  mode="outlined"
                  keyboardType="numeric"
                />
                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    style={styles.button}
                    buttonColor={colors.primary}
                    textColor="#fff"
                    contentStyle={{
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                    onPress={() => handleButtonPress(handleSendCoins)}
                  >
                    <Text
                      style={{ color: "#fff", marginRight: 8, fontSize: 16 }}
                    >
                      Send Coins
                    </Text>
                    <MaterialCommunityIcons
                      name="send"
                      size={20}
                      color="#fff"
                    />
                  </Button>
                </View>
              </Card.Content>
            </View>
            <View
              style={[
                styles.card,
                { backgroundColor: isDarkMode ? "#1e1e1e" : "#fff" },
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
                <TouchableWithoutFeedback
                  onPressIn={handleTouchStart}
                  onPressOut={handleTouchEnd}
                >
                  <ScrollView
                    ref={scrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    style={styles.carousel}
                    scrollEventThrottle={16}
                    onMomentumScrollEnd={(e) => {
                      const newIndex = Math.round(
                        e.nativeEvent.contentOffset.x / CARD_WIDTH
                      );
                      setIndex(newIndex);
                    }}
                  >
                    {rewards.length > 0 ? (
                      rewards.map((item) => (
                        <ImageBackground
                          key={item._id}
                          source={{ uri: item.image }}
                          resizeMode="contain"
                          style={styles.carouselItem}
                          imageStyle={styles.carouselImage}
                          defaultSource={require("../../assets/placeholder.avif")}
                          onError={() =>
                            Alert.alert("Error", "Failed to load reward image")
                          }
                        >
                          <View style={styles.textOverlay}>
                            <Text style={styles.carouselText}>{item.name}</Text>
                            <Text style={styles.carouselSubText}>
                              {item.pointsRequired} points
                            </Text>
                          </View>
                        </ImageBackground>
                      ))
                    ) : (
                      <View style={styles.carouselItem}>
                        <Text
                          style={[styles.emptyText, { color: colors.text }]}
                        >
                          No rewards available
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </TouchableWithoutFeedback>
              </Card.Content>
            </View>
          </View>
        );
      case "users":
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.title, { color: colors.text }]}>Users</Text>
            <TextInput
              placeholder="Search Users by Name, Mobile, or UniqueCode"
              value={searchUser}
              onChangeText={setSearchUser}
              style={[
                styles.searchBar,
                { backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5" },
              ]}
              placeholderTextColor={colors.text}
              mode="outlined"
              theme={{ colors: { text: colors.text, primary: colors.primary } }}
            />
            <FlatList
              data={users.filter(
                (user) =>
                  user.name.toLowerCase().includes(searchUser.toLowerCase()) ||
                  user.mobile.includes(searchUser) ||
                  user.uniqueCode
                    .toLowerCase()
                    .includes(searchUser.toLowerCase())
              )}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.card,
                    { backgroundColor: isDarkMode ? "#1e1e1e" : "#fff" },
                  ]}
                >
                  <Card.Content>
                    {editUser && editUser._id === item._id ? (
                      <View style={styles.editContainer}>
                        <TextInput
                          label="Name"
                          value={editUser.name}
                          onChangeText={(text) =>
                            setEditUser({ ...editUser, name: text })
                          }
                          style={styles.input}
                          theme={{
                            colors: {
                              text: colors.text,
                              primary: colors.primary,
                            },
                          }}
                          mode="outlined"
                        />
                        <TextInput
                          label="Mobile Number"
                          value={editUser.mobile}
                          onChangeText={(text) =>
                            setEditUser({ ...editUser, mobile: text })
                          }
                          style={styles.input}
                          theme={{
                            colors: {
                              text: colors.text,
                              primary: colors.primary,
                            },
                          }}
                          mode="outlined"
                          keyboardType="phone-pad"
                        />
                        <TextInput
                          label="Location"
                          value={editUser.location}
                          onChangeText={(text) =>
                            setEditUser({ ...editUser, location: text })
                          }
                          style={styles.input}
                          theme={{
                            colors: {
                              text: colors.text,
                              primary: colors.primary,
                            },
                          }}
                          mode="outlined"
                        />
                        <View style={styles.buttonRow}>
                          <View style={styles.buttonContainer}>
                            <Button
                              mode="contained"
                              style={styles.actionButton}
                              buttonColor={colors.primary}
                              textColor="#fff"
                              onPress={() => handleButtonPress(handleSaveUser)}
                            >
                              <ButtonText>Save</ButtonText>
                            </Button>
                          </View>
                          <View style={styles.buttonContainer}>
                            <Button
                              mode="outlined"
                              style={styles.actionButton}
                              textColor={colors.text}
                              onPress={() =>
                                handleButtonPress(() => setEditUser(null))
                              }
                            >
                              <ButtonText>Cancel</ButtonText>
                            </Button>
                          </View>
                        </View>
                      </View>
                    ) : sendTokenUserId === item._id ? (
                      <View style={styles.editContainer}>
                        <TextInput
                          label="Token Amount"
                          value={tokenAmount}
                          onChangeText={setTokenAmount}
                          style={styles.input}
                          theme={{
                            colors: {
                              text: colors.text,
                              primary: colors.primary,
                            },
                          }}
                          mode="outlined"
                          keyboardType="numeric"
                        />
                        <View style={styles.buttonRow}>
                          <View style={styles.buttonContainer}>
                            <Button
                              mode="contained"
                              style={styles.actionButton}
                              buttonColor={colors.primary}
                              textColor="#fff"
                              onPress={() =>
                                handleButtonPress(() =>
                                  handleSendTokens(item._id)
                                )
                              }
                            >
                              <ButtonText>Send</ButtonText>
                            </Button>
                          </View>
                          <View style={styles.buttonContainer}>
                            <Button
                              mode="outlined"
                              style={styles.actionButton}
                              textColor={colors.text}
                              onPress={() =>
                                handleButtonPress(() =>
                                  setSendTokenUserId(null)
                                )
                              }
                            >
                              <ButtonText>Cancel</ButtonText>
                            </Button>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <View>
                        <Text
                          style={[
                            styles.cardText,
                            { color: colors.primary, fontWeight: "bold" },
                          ]}
                        >
                          {item.name}
                        </Text>
                        <Text style={[styles.cardText, { color: colors.text }]}>
                          Mobile: {item.mobile}
                        </Text>
                        <Text style={[styles.cardText, { color: colors.text }]}>
                          Points: {item.points}
                        </Text>
                        <Text style={[styles.cardText, { color: colors.text }]}>
                          Location: {item.location || "N/A"}
                        </Text>
                        <Text style={[styles.cardText, { color: colors.text }]}>
                          Unique Code: {item.uniqueCode || "N/A"}
                        </Text>
                        <View style={styles.buttonRow}>
                          <View style={styles.buttonContainer}>
                            <Button
                              mode="outlined"
                              style={styles.actionButton}
                              textColor={colors.primary}
                              onPress={() =>
                                handleButtonPress(() => handleEditUser(item))
                              }
                            >
                              <ButtonText>Edit</ButtonText>
                            </Button>
                          </View>
                          <View style={styles.buttonContainer}>
                            <Button
                              mode="outlined"
                              style={styles.actionButton}
                              textColor={colors.error}
                              onPress={() =>
                                handleButtonPress(() =>
                                  handleDeleteUser(item._id)
                                )
                              }
                            >
                              <ButtonText>Delete</ButtonText>
                            </Button>
                          </View>
                          <View style={styles.buttonContainer}>
                            <Button
                              mode="contained"
                              style={styles.actionButton}
                              buttonColor={colors.primary}
                              textColor="#fff"
                              onPress={() =>
                                handleButtonPress(() =>
                                  setSendTokenUserId(item._id)
                                )
                              }
                            >
                              <ButtonText>Send Tokens</ButtonText>
                            </Button>
                          </View>
                        </View>
                      </View>
                    )}
                  </Card.Content>
                </View>
              )}
              ListEmptyComponent={() => (
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  No users found.
                </Text>
              )}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews={true}
            />
          </View>
        );
      case "rewards":
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.title, { color: colors.text }]}>Rewards</Text>
            <View
              style={[
                styles.card,
                { backgroundColor: isDarkMode ? "#1e1e1e" : "#fff" },
              ]}
            >
              <Card.Title
                title={editingRewardId ? "Edit Reward" : "Manage Rewards"}
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
                <TextInput
                  label="Reward Name"
                  value={newReward.name}
                  onChangeText={(text) =>
                    setNewReward({ ...newReward, name: text })
                  }
                  style={styles.input}
                  theme={{
                    colors: { text: colors.text, primary: colors.primary },
                  }}
                  mode="outlined"
                />
                <TextInput
                  label="Price (₹)"
                  value={newReward.price}
                  onChangeText={(text) =>
                    setNewReward({ ...newReward, price: text })
                  }
                  keyboardType="numeric"
                  style={styles.input}
                  theme={{
                    colors: { text: colors.text, primary: colors.primary },
                  }}
                  mode="outlined"
                />
                <TextInput
                  label="Points Required"
                  value={newReward.pointsRequired}
                  onChangeText={(text) =>
                    setNewReward({ ...newReward, pointsRequired: text })
                  }
                  keyboardType="numeric"
                  style={styles.input}
                  theme={{
                    colors: { text: colors.text, primary: colors.primary },
                  }}
                  mode="outlined"
                />
                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    style={styles.actionButton}
                    buttonColor={colors.primary}
                    textColor="#fff"
                    onPress={() => handleButtonPress(handleImageUpload)}
                  >
                    <ButtonText>Upload Image</ButtonText>
                  </Button>
                </View>
                {imagePreview && (
                  <Image
                    source={{ uri: imagePreview }}
                    style={[styles.rewardImage, { marginVertical: 12 }]}
                    onError={() =>
                      Alert.alert("Error", "Failed to load image preview")
                    }
                  />
                )}
                <View style={styles.buttonRow}>
                  <View style={styles.buttonContainer}>
                    <Button
                      mode="contained"
                      style={styles.submitButton}
                      loading={isUploading}
                      disabled={isUploading}
                      buttonColor={colors.primary}
                      textColor="#fff"
                      onPress={() => handleButtonPress(handleAddReward)}
                    >
                      <ButtonText>
                        {isUploading
                          ? editingRewardId
                            ? "Updating..."
                            : "Adding..."
                          : editingRewardId
                          ? "Update Reward"
                          : "Add Reward"}
                      </ButtonText>
                    </Button>
                  </View>
                  {editingRewardId && (
                    <View style={styles.buttonContainer}>
                      <Button
                        mode="outlined"
                        style={styles.actionButton}
                        textColor={colors.text}
                        onPress={() => handleButtonPress(handleCancelEdit)}
                      >
                        <ButtonText>Cancel</ButtonText>
                      </Button>
                    </View>
                  )}
                </View>
                <FlatList
                  data={rewards}
                  keyExtractor={(item) => item._id}
                  numColumns={1}
                  renderItem={({ item }) => (
                    <View style={[styles.rewardCard, { width: CARD_WIDTH }]}>
                      <ImageBackground
                        source={{ uri: item.image }}
                        resizeMode="contain"
                        style={styles.rewardCardImage}
                        imageStyle={styles.rewardCardImageStyle}
                        defaultSource={require("../../assets/placeholder.avif")}
                        onError={() =>
                          Alert.alert("Error", "Failed to load reward image")
                        }
                      >
                        <View style={styles.textOverlay}>
                          <Text style={styles.rewardCardText}>{item.name}</Text>
                          <Text style={styles.rewardCardSubText}>
                            ₹{item.price} | {item.pointsRequired} points
                          </Text>
                        </View>
                      </ImageBackground>
                      <View style={styles.buttonRow}>
                        <View style={styles.buttonContainer}>
                          <Button
                            mode="outlined"
                            style={styles.actionButton}
                            textColor={colors.primary}
                            onPress={() =>
                              handleButtonPress(() => {
                                setNewReward({ ...item });
                                setImagePreview(item.image);
                                setEditingRewardId(item._id);
                              })
                            }
                          >
                            <ButtonText>Edit</ButtonText>
                          </Button>
                        </View>
                        <View style={styles.buttonContainer}>
                          <Button
                            mode="outlined"
                            style={styles.actionButton}
                            loading={deletingRewardId === item._id}
                            disabled={deletingRewardId === item._id}
                            textColor={colors.error}
                            onPress={() =>
                              handleButtonPress(() =>
                                handleDeleteReward(item._id)
                              )
                            }
                          >
                            <ButtonText>
                              {deletingRewardId === item._id
                                ? "Deleting..."
                                : "Delete"}
                            </ButtonText>
                          </Button>
                        </View>
                      </View>
                    </View>
                  )}
                  ListEmptyComponent={() => (
                    <Text style={[styles.emptyText, { color: colors.text }]}>
                      No rewards available.
                    </Text>
                  )}
                  initialNumToRender={10}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  removeClippedSubviews={true}
                />
              </Card.Content>
            </View>
          </View>
        );
      case "notification":
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.title, { color: colors.text }]}>
              Notifications
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: isDarkMode ? "#1e1e1e" : "#fff" },
              ]}
            >
              <Card.Title
                title="Redemption Requests"
                titleStyle={[styles.cardTitle, { color: colors.text }]}
                left={() => (
                  <Avatar.Icon
                    size={40}
                    icon="ticket"
                    style={{ backgroundColor: colors.primary }}
                  />
                )}
              />
              <Card.Content>
                <FlatList
                  data={redemptions.filter((r) => r.status === "pending")}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <View style={styles.redemptionItem}>
                      <Avatar.Icon
                        size={36}
                        icon="account"
                        style={{
                          backgroundColor: colors.primary,
                          marginRight: 10,
                        }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.cardText,
                            { color: colors.text, fontWeight: "bold" },
                          ]}
                        >
                          {item.userId?.name || "Unknown"}
                        </Text>
                        <Text style={[styles.cardText, { color: colors.text }]}>
                          Reward: {item.rewardId?.name || "Unknown"}
                        </Text>
                      </View>
                      <View style={styles.buttonRow}>
                        <View style={styles.buttonContainer}>
                          <Button
                            mode="contained"
                            style={styles.actionButton}
                            buttonColor={colors.primary}
                            textColor="#fff"
                            onPress={() =>
                              handleButtonPress(() =>
                                handleApproveRedemption(item._id)
                              )
                            }
                          >
                            <ButtonText>Approve</ButtonText>
                          </Button>
                        </View>
                        <View style={styles.buttonContainer}>
                          <Button
                            mode="contained"
                            style={styles.actionButton}
                            buttonColor={colors.error}
                            textColor="#fff"
                            onPress={() =>
                              handleButtonPress(() =>
                                handleRejectRedemption(item._id)
                              )
                            }
                          >
                            <ButtonText>Reject</ButtonText>
                          </Button>
                        </View>
                      </View>
                    </View>
                  )}
                  ListEmptyComponent={() => (
                    <Text style={[styles.emptyText, { color: colors.text }]}>
                      No pending redemptions.
                    </Text>
                  )}
                  initialNumToRender={10}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  removeClippedSubviews={true}
                />
              </Card.Content>
            </View>
            <View
              style={[
                styles.card,
                { backgroundColor: isDarkMode ? "#1e1e1e" : "#fff" },
              ]}
            >
              <Card.Title
                title="System Notifications"
                titleStyle={[styles.cardTitle, { color: colors.text }]}
                left={() => (
                  <Avatar.Icon
                    size={40}
                    icon="bell"
                    style={{ backgroundColor: colors.primary }}
                  />
                )}
                right={() => (
                  <View style={styles.buttonContainer}>
                    <Button
                      mode="text"
                      textColor={colors.error}
                      onPress={() =>
                        handleButtonPress(handleDismissAllNotifications)
                      }
                    >
                      <ButtonText>Dismiss All</ButtonText>
                    </Button>
                  </View>
                )}
              />
              <Card.Content>
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
                              ? "#2a2a2a"
                              : "#f5f5f5"
                            : isDarkMode
                            ? "#333"
                            : "#fff",
                        },
                      ]}
                    >
                      <Avatar.Icon
                        size={36}
                        icon={item.read ? "bell-outline" : "bell"}
                        style={{
                          backgroundColor: item.read
                            ? colors.secondary
                            : colors.primary,
                          marginRight: 10,
                        }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.notificationText,
                            { color: colors.text },
                          ]}
                        >
                          {item.message}
                        </Text>
                        <Text
                          style={[
                            styles.notificationDate,
                            { color: colors.text },
                          ]}
                        >
                          {new Date(item.createdAt).toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.buttonContainer}>
                        <Button
                          mode="text"
                          textColor={colors.error}
                          onPress={() =>
                            handleButtonPress(() =>
                              handleClearNotification(item._id)
                            )
                          }
                        >
                          <ButtonText>Dismiss</ButtonText>
                        </Button>
                      </View>
                    </View>
                  )}
                  ListEmptyComponent={() => (
                    <Text style={[styles.emptyText, { color: colors.text }]}>
                      No notifications available.
                    </Text>
                  )}
                  initialNumToRender={10}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  removeClippedSubviews={true}
                />
              </Card.Content>
            </View>
          </View>
        );
      case "analytics":
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.title, { color: colors.text }]}>
              Analytics
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: isDarkMode ? "#1e1e1e" : "#fff" },
              ]}
            >
              <Card.Title
                title="System Statistics"
                titleStyle={[styles.cardTitle, { color: colors.text }]}
                left={() => (
                  <Avatar.Icon
                    size={40}
                    icon="chart-bar"
                    style={{ backgroundColor: colors.primary }}
                  />
                )}
              />
              <Card.Content>
                <View style={styles.statContainer}>
                  <View style={styles.statItem}>
                    <MaterialIcons
                      name="people"
                      size={28}
                      color={colors.primary}
                      style={styles.statIcon}
                    />
                    <Text style={[styles.cardText, { color: colors.text }]}>
                      Total Users: {users.length}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons
                      name="bank-check"
                      size={28}
                      color={colors.primary}
                      style={styles.statIcon}
                    />
                    <Text style={[styles.cardText, { color: colors.text }]}>
                      Total Coins Sent:{" "}
                      {users.reduce((sum, u) => sum + (u.points || 0), 0)}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <MaterialIcons
                      name="notifications"
                      size={28}
                      color={colors.primary}
                      style={styles.statIcon}
                    />
                    <Text style={[styles.cardText, { color: colors.text }]}>
                      Pending Redemptions:{" "}
                      {redemptions.filter((r) => r.status === "pending").length}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons
                      name="wallet-giftcard"
                      size={28}
                      color={colors.primary}
                      style={styles.statIcon}
                    />
                    <Text style={[styles.cardText, { color: colors.text }]}>
                      Available Rewards: {rewards.length}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  User Progress
                </Text>
                <FlatList
                  data={users}
                  keyExtractor={(user) => user._id}
                  renderItem={({ item: user }) => {
                    const maxPoints = Math.max(
                      ...rewards.map((r) => parseInt(r.pointsRequired) || 100),
                      100
                    );
                    const progress = Math.min(
                      (user.points / maxPoints) * 100,
                      100
                    );
                    return (
                      <View style={styles.progressContainer}>
                        <Text style={[styles.userText, { color: colors.text }]}>
                          {user.name}
                        </Text>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${progress}%`,
                                backgroundColor: colors.primary,
                              },
                            ]}
                          />
                        </View>
                        <Text
                          style={[styles.progressText, { color: colors.text }]}
                        >
                          {user.points}/{maxPoints} points (
                          {progress.toFixed(1)}%)
                        </Text>
                      </View>
                    );
                  }}
                  ListEmptyComponent={() => (
                    <Text style={[styles.emptyText, { color: colors.text }]}>
                      No users available.
                    </Text>
                  )}
                  initialNumToRender={10}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  removeClippedSubviews={true}
                />
              </Card.Content>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#121212" : "#f0f4f8" },
      ]}
    >
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
              { backgroundColor: isDarkMode ? "#1e1e1e" : "#fff" },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Confirm Action
            </Text>
            <Text style={[styles.cardText, { color: colors.text }]}>
              {modalMessage}
            </Text>
            <View style={styles.buttonRow}>
              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  style={styles.actionButton}
                  buttonColor={colors.primary}
                  textColor="#fff"
                  onPress={() => handleButtonPress(modalAction)}
                >
                  <ButtonText>Confirm</ButtonText>
                </Button>
              </View>
              <View style={styles.buttonContainer}>
                <Button
                  mode="outlined"
                  style={styles.actionButton}
                  textColor={colors.text}
                  onPress={() =>
                    handleButtonPress(() => setModalVisible(false))
                  }
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
        renderItem={renderTabContent}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
            borderTopColor: isDarkMode ? "#333" : "#e0e0e0",
          },
        ]}
      >
        {["home", "users", "rewards", "notification", "analytics"].map(
          (tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, currentTab === tab && styles.activeTab]}
              onPress={() => handleTabChange(tab)}
            >
              <MaterialIcons
                name={
                  tab === "home"
                    ? "home"
                    : tab === "users"
                    ? "people"
                    : tab === "rewards"
                    ? "card-giftcard"
                    : tab === "notification"
                    ? "notifications"
                    : "analytics"
                }
                size={30}
                color={currentTab === tab ? colors.primary : colors.text}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: currentTab === tab ? colors.primary : colors.text,
                    fontSize: 14,
                  },
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  modal: {
    width: 320,
    padding: 20,
    borderRadius: 16,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    borderTopWidth: 1,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 15,
    ...(isWeb ? { transition: "transform 0.2s ease" } : {}),
  },
  activeTab: {
    borderBottomWidth: 4,
    borderBottomColor: "#FFD700",
    ...(isWeb ? { transform: [{ scale: 1.05 }] } : {}),
  },
  card: {
    marginVertical: 10,
    borderRadius: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    padding: 15,
  },
  editContainer: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  searchBar: {
    marginBottom: 20,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    height: 50,
  },
  input: {
    backgroundColor: "transparent",
    borderRadius: 12,
    marginVertical: 10,
    fontSize: 16,
    height: 50,
  },
  button: {
    marginVertical: 10,
    borderRadius: 12,
    paddingVertical: 8,
    minHeight: 50,
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
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 10,
    gap: 10,
  },
  buttonContainer: {
    ...(isWeb ? { transition: "transform 0.2s ease" } : {}),
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginVertical: 20,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "600",
  },
  cardText: {
    fontSize: 18,
    marginVertical: 8,
    fontWeight: "500",
    lineHeight: 24,
  },
  tabText: {
    fontSize: 14,
    marginTop: 6,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 18,
    marginVertical: 15,
    fontWeight: "500",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  carousel: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  carouselItem: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    justifyContent: "flex-end",
    padding: 15,
    backgroundColor: "#f0f0f0",
  },
  carouselImage: {
    borderRadius: 16,
  },
  textOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 10,
    borderRadius: 12,
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
  },
  carouselText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  carouselSubText: {
    color: "#fff",
    fontSize: 16,
  },
  rewardCard: {
    margin: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  rewardCardImage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    justifyContent: "flex-end",
    padding: 10,
    backgroundColor: "#f0f0f0",
    overflow: "hidden",
  },
  rewardCardImageStyle: {
    borderRadius: 12,
  },
  rewardCardText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  rewardCardSubText: {
    color: "#fff",
    fontSize: 14,
  },
  rewardImage: {
    width: 140,
    height: 140,
    borderRadius: 12,
    marginBottom: 10,
    resizeMode: "contain",
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  notificationText: {
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 24,
  },
  notificationDate: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 6,
  },
  redemptionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    backgroundColor: "rgba(0, 0, 0, 0.03)",
  },
  progressContainer: {
    marginVertical: 10,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
  },
  progressBar: {
    height: 15,
    backgroundColor: "#e0e0e0",
    borderRadius: 7,
    overflow: "hidden",
    marginVertical: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 7,
  },
  userText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    marginTop: 6,
  },
  statContainer: {
    marginVertical: 15,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
  },
  statIcon: {
    marginRight: 15,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginVertical: 15,
  },
  tabContent: {
    paddingBottom: 20,
  },
});
