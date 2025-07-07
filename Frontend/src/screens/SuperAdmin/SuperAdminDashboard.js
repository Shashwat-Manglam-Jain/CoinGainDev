import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Platform,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Button, Card, TextInput, Avatar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import ThemeToggle from '../../components/ThemeToggle';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeContext } from '../../ThemeContext';
import { API_BASE_URL } from '../../../utils/api';
import { RefreshControl } from 'react-native-gesture-handler';
import moment from 'moment';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// ButtonText component
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


const dummySuperAdmin = {
  id: '01',
  name: 'Shashwat Manglam Jain',
  mobile: '9424422001',
  uniqueCode: 'SUPER001',
  role: 'SuperAdmin',
};

export default function SuperAdminDashboard({ navigation }) {
  const {
    isDarkMode,
    theme: { colors = {} },
  } = useContext(ThemeContext);
  const [admins, setAdmins] = useState([]);
  const [superAdmin, setSuperAdmin] = useState(dummySuperAdmin);
  const [searchAdmin, setSearchAdmin] = useState('');
  const [currentTab, setCurrentTab] = useState('home');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const debouncedSetSearchAdmin = (value) => setSearchAdmin((value))

  // Map API data to include status field
  const mapAdmins = (apiAdmins) =>
    apiAdmins.map((admin) => ({
      id: admin._id,
      name: admin.name,
      mobile: admin.mobile,
      uniqueCode: admin.uniqueCode,
      location: admin.location,
      status: admin.validate ? 'approved' : admin.status === 'disapproved' ? 'disapproved' : 'pending',
      createdAt: admin.createdAt,
    }));

  const filteredAdmins = admins.filter(
    (admin) =>
      (admin.status === 'approved' || admin.status === 'disapproved') &&
      ((admin.name || '').toLowerCase().includes(searchAdmin.toLowerCase()) ||
       (admin.mobile || '').toLowerCase().includes(searchAdmin.toLowerCase()) ||
       (admin.uniqueCode || '').toLowerCase().includes(searchAdmin.toLowerCase()))
  );

  const pendingAdmins = admins.filter((admin) => admin.status === 'pending');

  const fetchAllAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/fetchdata/admins`);
      setAdmins(mapAdmins(response.data.admins || []));
    } catch (error) {
      console.error('Fetch admins error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to fetch admins',
      });
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllAdmins();
  }, [fetchAllAdmins]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchAllAdmins();
      // Add a slight delay to ensure RefreshControl is visible during testing
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Refresh admins error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to refresh admins: ' + error.message,
      });
    } finally {
      setRefreshing(false);
    }
  }, [fetchAllAdmins]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'You have been logged out successfully',
      });
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to log out',
      });
    }
  };

  const handleEditAdmin = () => {
    setEditAdmin({
      name: superAdmin?.name || '',
      mobile: superAdmin?.mobile || '',
    });
    setEditModalVisible(true);
  };

  const handleSaveAdmin = () => {
    if (!editAdmin?.name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Name cannot be empty',
      });
      return;
    }
    if (!/^\d{10}$/.test(editAdmin?.mobile)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Mobile number must be 10 digits',
      });
      return;
    }
    setSuperAdmin({ ...superAdmin, name: editAdmin.name, mobile:editAdmin.mobile });
    setEditModalVisible(false);
    Toast.show({
      type: 'success',
      text1: 'Admin Updated',
      text2: 'Super admin details saved successfully',
    });
  };

  const handleToggleAdminStatus = async (adminId, newStatus) => {
    try {
      setLoading(true);
      await axios.put(`${API_BASE_URL}/superadmin/toggleAdmin/${adminId}/${newStatus}`);
      setAdmins((prevAdmins) =>
        prevAdmins.map((admin) =>
          admin.id === adminId ? { ...admin, status: newStatus } : admin
        )
      );
      Toast.show({
        type: 'success',
        text1: newStatus === 'approved' ? 'Admin Activated' : 'Admin Deactivated',
        text2: `Admin status changed to ${newStatus === 'approved' ? 'Active' : 'Deactivated'}`,
      });
    } catch (error) {
      console.error('Toggle admin status error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to update admin status',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAdmin = async (adminId) => {
    try {
      setLoading(true);
      await axios.put(`${API_BASE_URL}/superadmin/approveAdmin/${adminId}`);
      setAdmins((prevAdmins) =>
        prevAdmins.map((admin) =>
          admin.id === adminId ? { ...admin, status: 'approved' } : admin
        )
      );
      Toast.show({
        type: 'success',
        text1: 'Admin Approved',
        text2: 'Admin has been approved successfully',
      });
    } catch (error) {
      console.error('Approve admin error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to approve admin',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectAdmin = async (adminId) => {
    try {
      setLoading(true);
      setAdmins((prevAdmins) =>
        prevAdmins.map((admin) =>
          admin.id === adminId ? { ...admin, status: 'disapproved' } : admin
        )
      );
      Toast.show({
        type: 'success',
        text1: 'Admin Rejected',
        text2: 'Admin has been rejected',
      });
    } catch (error) {
      console.error('Reject admin error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to reject admin',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return (
          <View style={[styles.tabContent, { backgroundColor: isDarkMode ? '#121212' : '#f0f4f8' }]}>
            <View style={[styles.header, { position: 'relative', top: 10 }]}>
              <Text style={[styles.title, { color: colors.text || '#000', padding: 10 }]}>
                SUPER ADMIN
              </Text>
              <View style={styles.headerButtons}>
                <ThemeToggle style={styles.toggle} />
                <Button
                  mode="contained"
                  style={{ position: 'relative', right: 10 }}
                  buttonColor={colors.error || '#FF0000'}
                  textColor="#fff"
                  onPress={handleLogout}
                  accessible
                  accessibilityLabel="Logout"
                >
                  <ButtonText>Logout</ButtonText>
                </Button>
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
                title="Super Admin"
                titleStyle={[styles.cardTitle, { color: colors.text || '#000' }]}
                left={() => (
                  <Avatar.Icon
                    size={40}
                    icon="account-circle"
                    style={{ backgroundColor: colors.primary || '#6200EE' }}
                  />
                )}
                right={() => (
                  <TouchableOpacity onPress={handleEditAdmin} accessible accessibilityLabel="Edit super admin">
                    <MaterialIcons name="edit" size={30} color={colors.error || '#FF0000'} />
                  </TouchableOpacity>
                )}
              />
              <Card.Content>
                <Text
                  style={[styles.cardText, { color: colors.primary || '#6200EE', fontWeight: 'bold' }]}
                >
                  Sir, {superAdmin?.name || 'Unknown'}
                </Text>
                <Text style={[styles.cardText, { color: colors.text || '#000' }]}>
                  Mobile: {superAdmin?.mobile || 'N/A'}
                </Text>
                <Text style={[styles.cardText, { color: colors.text || '#000' }]}>
                  Role: {superAdmin?.role || 'N/A'}
                </Text>
                <Text style={[styles.cardText, { color: colors.text || '#000' }]}>
                  Unique Code: {superAdmin?.uniqueCode || 'N/A'}
                </Text>
                <Text style={[styles.cardText, { color: colors.text || '#000' }]}>
                  Total Admins: {admins.filter((admin) => admin.status === 'approved').length}
                </Text>
              </Card.Content>
            </View>
          </View>
        );
      case 'admins':
        return (
          <View style={[styles.tabContent, { backgroundColor: isDarkMode ? '#121212' : '#f0f4f8',padding:10 }]}>
            <Text style={[styles.title, { color: colors.text || '#000', padding: 10 }]}>
              ADMINS
            </Text>
            <TextInput
              label="Search Admins"
              value={searchAdmin}
              onChangeText={debouncedSetSearchAdmin}
              style={[styles.searchBar, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }]}
              placeholderTextColor={colors.placeholder || '#999'}
              underlineColorAndroid="transparent"
              theme={{ colors: { text: colors.text || '#000', primary: colors.primary || '#6200EE' } }}
              accessible
              accessibilityLabel="Search admins"
            />
            {loading ? (
              <Text style={[styles.emptyText, { color: colors.text || '#000' }]}>Loading...</Text>
            ) : (
              <FlatList
                data={filteredAdmins}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                bounces={true}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
                      },
                    ]}
                    key={item.id}
                  >
                    <Card.Title
                      title={item.name}
                      titleStyle={[styles.cardTitle, { color: colors.text || '#000' }]}
                      left={() => (
                        <Avatar.Icon
                          size={40}
                          icon="account-circle"
                          style={{ backgroundColor: colors.primary || '#6200EE' }}
                        />
                      )}
                    />
                    <Card.Content>
                      <Text style={[styles.cardText, { color: colors.text || '#000' }]}>
                        Mobile: {item.mobile}
                      </Text>
                      <Text style={[styles.cardText, { color: colors.text || '#000' }]}>
                        Unique Code: {item.uniqueCode}
                      </Text>
                      <Text
                        style={[
                          styles.cardText,
                          { color: item.status === 'approved' ? 'green' : colors.error || '#FF0000' },
                        ]}
                      >
                        Status: {item.status === 'approved' ? 'Active' : 'Deactivated'}
                      </Text>
                      <Text style={[styles.cardText, { color: colors.text || '#000' }]}>
                        Location: {item.location}
                      </Text>
                      <Text style={[styles.cardText, { color: colors.text || '#000' }]}>
                        Joined: {item.createdAt ? moment(item.createdAt).format('YYYY-MM-DD') : 'N/A'}
                      </Text>
                      <View style={styles.buttonRow}>
                        <Button
                          mode="outlined"
                          style={[
                            styles.actionButton,
                            {
                              borderColor: item.status === 'approved' ? colors.error || '#FF0000' : 'green',
                            },
                          ]}
                          textColor={item.status === 'approved' ? colors.error || '#FF0000' : 'green'}
                          onPress={() =>
                            handleToggleAdminStatus(
                              item.id,
                              item.status === 'approved' ? 'disapproved' : 'approved'
                            )
                          }
                          accessible
                          accessibilityLabel={item.status === 'approved' ? 'Deactivate admin' : 'Activate admin'}
                        >
                          <ButtonText
                            style={{ color: item.status === 'approved' ? colors.error || '#FF0000' : 'green' }}
                          >
                            {item.status === 'approved' ? 'Deactivate' : 'Activate'}
                          </ButtonText>
                        </Button>
                      </View>
                    </Card.Content>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={[styles.emptyText, { color: colors.text || '#000' }]}>
                    No admins found.
                  </Text>
                }
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#2196F3"
                    colors={['#2196F3']}
                  />
                }
                windowSize={5}
                getItemLayout={(data, index) => ({
                  length: 200,
                  offset: 200 * index,
                  index,
                })}
              />
            )}
          </View>
        );
      case 'approve':
        return (
          <View style={[styles.tabContent, { backgroundColor: isDarkMode ? '#121212' : '#f0f4f8' ,padding:10}]}>
            <Text style={[styles.title, { color: colors.text || '#000', padding: 10 }]}>
              APPROVE ADMINS
            </Text>
            {loading ? (
              <Text style={[styles.emptyText, { color: colors.text || '#000' }]}>Loading...</Text>
            ) : (
              <FlatList
                data={pendingAdmins}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                bounces={true}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
                      },
                    ]}
                    key={item.id}
                  >
                    <Card.Title
                      title={item.name}
                      titleStyle={[styles.cardTitle, { color: colors.text || '#000' }]}
                      left={() => (
                        <Avatar.Icon
                          size={40}
                          icon="account-circle"
                          style={{ backgroundColor: colors.primary || '#6200EE' }}
                        />
                      )}
                    />
                    <Card.Content>
                      <Text style={[styles.cardText, { color: colors.text || '#000' }]}>
                        Mobile: {item.mobile}
                      </Text>
                      <Text style={[styles.cardText, { color: colors.text || '#000' }]}>
                        Unique Code: {item.uniqueCode}
                      </Text>
                      <Text style={[styles.cardText, { color: colors.text || '#000' }]}>
                        Status: Pending
                      </Text>
                      <Text style={[styles.cardText, { color: colors.text || '#000' }]}>
                        Location: {item.location}
                      </Text>
                      <View style={styles.buttonRow}>
                        <Button
                          mode="contained"
                          style={styles.actionButton}
                          buttonColor={colors.primary || '#6200EE'}
                          textColor="#fff"
                          onPress={() => handleApproveAdmin(item.id)}
                          accessible
                          accessibilityLabel="Approve admin"
                        >
                          <ButtonText>Approve</ButtonText>
                        </Button>
                        <Button
                          mode="outlined"
                          style={styles.actionButton}
                          textColor={colors.error || '#FF0000'}
                          onPress={() => handleRejectAdmin(item.id)}
                          accessible
                          accessibilityLabel="Reject admin"
                        >
                          <ButtonText>Reject</ButtonText>
                        </Button>
                      </View>
                    </Card.Content>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={[styles.emptyText, { color: colors.text || '#000' }]}>
                    No admins pending approval.
                  </Text>
                }
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#2196F3"
                    colors={['#2196F3']}
                  />
                }
                windowSize={5}
                getItemLayout={(data, index) => ({
                  length: 200,
                  offset: 200 * index,
                  index,
                })}
              />
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#f0f4f8' }]}>
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
            <Text style={[styles.modalTitle, { color: colors.text || '#000' }]}>
              📝 Edit Super Admin Details
            </Text>
            <TextInput
              label="Name"
              value={editAdmin?.name || ''}
              onChangeText={(text) => setEditAdmin({ ...editAdmin, name: text })}
              style={styles.input}
              placeholderTextColor={colors.placeholder || '#999'}
              underlineColorAndroid="transparent"
              theme={{ colors: { text: colors.text || '#000', primary: colors.primary || '#6200EE' } }}
              accessible
              accessibilityLabel="Super admin name"
            />
            <TextInput
              label="Mobile"
              value={editAdmin?.mobile || ''}
              onChangeText={(text) => setEditAdmin({ ...editAdmin, mobile: text })}
              keyboardType="phone-pad"
              style={styles.input}
              placeholderTextColor={colors.placeholder || '#999'}
              underlineColorAndroid="transparent"
              theme={{ colors: { text: colors.text || '#000', primary: colors.primary || '#6200EE' } }}
              accessible
              accessibilityLabel="Super admin mobile"
            />
            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                style={styles.actionButton}
                buttonColor={colors.primary || '#6200EE'}
                textColor="#fff"
                onPress={handleSaveAdmin}
                accessible
                accessibilityLabel="Save super admin details"
              >
                <ButtonText>Save</ButtonText>
              </Button>
              <Button
                mode="outlined"
                style={styles.actionButton}
                textColor={colors.text || '#000'}
                onPress={() => setEditModalVisible(false)}
                accessible
                accessibilityLabel="Cancel edit"
              >
                <ButtonText>Cancel</ButtonText>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
      <View style={styles.scrollContent}>{renderContent()}</View>
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
            borderTopColor: isDarkMode ? '#333' : '#e0e0e0',
          },
        ]}
      >
        {['home', 'admins', 'approve'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, currentTab === tab && styles.activeTab]}
            onPress={() => setCurrentTab(tab)}
            accessible
            accessibilityLabel={`Navigate to ${tab} tab`}
            accessibilityRole="button"
          >
            <View style={styles.tabIconContainer}>
              <MaterialIcons
                name={tab === 'home' ? 'home' : tab === 'admins' ? 'people' : 'check-circle'}
                size={28}
                color={currentTab === tab ? colors.primary || '#6200EE' : colors.text || '#000'}
              />
            </View>
            <Text
              style={[
                styles.tabText,
                {
                  color: currentTab === tab ? colors.primary || '#6200EE' : colors.text || '#000',
                  fontSize: isWeb && SCREEN_WIDTH > 600 ? 12 : 10,
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    padding: 20,
    paddingBottom: 65,
  },
  tabContent: {
    flex: 1,
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
    height: 65,
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
  card: {
    marginVertical: 10,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    padding: 15,
    minHeight: 200, // Ensure cards are tall enough to trigger scrolling
  },
  searchBar: {
    marginBottom: 5,
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
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginVertical: 10,
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
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 18,
    marginVertical: 15,
    fontWeight: '500',
  },
});