import React, { memo, useState } from 'react';
import { View, Text, FlatList, Platform, Dimensions, StyleSheet, Modal } from 'react-native';
import { Card, TextInput, Button } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

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

const Users = ({
  users,
  searchUser,
  setSearchUser,
  editUser,
  setEditUser,
  handleEditUser,
  handleSaveUser,
  handleDeleteUser,
  handleSendTokens,
  sendTokenUserId,
  setSendTokenUserId,
  tokenAmount,
  setTokenAmount,
  colors,
  isDarkMode,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [sendTokenModalVisible, setSendTokenModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
      user.mobile?.includes(searchUser) ||
      user.uniqueCode?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const openSendTokenModal = (user) => {
    setSelectedUser(user);
    setSendTokenUserId(user._id);
    setTokenAmount('');
    setSendTokenModalVisible(true);
  };

  const handleSendTokensWrapper = async () => {
    if (!tokenAmount || isNaN(parseFloat(tokenAmount)) || parseFloat(tokenAmount) <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid token amount',
      });
      return;
    }
    setIsLoading(true);
    setSendTokenModalVisible(false); // Close modal immediately
    setSendTokenUserId(null); // Reset user ID
    try {
      await handleSendTokens(selectedUser._id, parseFloat(tokenAmount));
      // Toast.show({
      //   type: 'success',
      //   text1: 'Tokens Sent',
      //   text2: `Successfully sent ${tokenAmount} tokens to ${selectedUser.name || 'user'}`,
      // });
    } catch (error) {
      console.error('Send tokens error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.error || error.message || 'Failed to send tokens',
      });
    } finally {
      setIsLoading(false);
      setSelectedUser(null);
      setTokenAmount('');
    }
  };

  const renderUser = ({ item }) => (
    <Card style={[styles.card, { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }]}>
      <Card.Content>
        {editUser && editUser._id === item._id ? (
          <View style={styles.editContainer}>
            <TextInput
              label="Name"
              value={editUser.name || ''}
              onChangeText={(text) => setEditUser({ ...editUser, name: text })}
              style={[styles.input, { width: isWeb && SCREEN_WIDTH > 600 ? '50%' : '100%' }]}
              theme={{ colors: { text: colors.text, primary: colors.primary } }}
              mode="outlined"
              accessible
              accessibilityLabel="Edit user name"
            />
            <TextInput
              label="Mobile Number"
              value={editUser.mobile || ''}
              onChangeText={(text) => setEditUser({ ...editUser, mobile: text })}
              style={[styles.input, { width: isWeb && SCREEN_WIDTH > 600 ? '50%' : '100%' }]}
              theme={{ colors: { text: colors.text, primary: colors.primary } }}
              mode="outlined"
              keyboardType="phone-pad"
              accessible
              accessibilityLabel="Edit mobile number"
            />
            <TextInput
              label="Location"
              value={editUser.location || ''}
              onChangeText={(text) => setEditUser({ ...editUser, location: text })}
              style={[styles.input, { width: isWeb && SCREEN_WIDTH > 600 ? '50%' : '100%' }]}
              theme={{ colors: { text: colors.text, primary: colors.primary } }}
              mode="outlined"
              accessible
              accessibilityLabel="Edit location"
            />
            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                style={styles.actionButton}
                buttonColor={colors.primary}
                textColor="#fff"
                onPress={handleSaveUser}
                disabled={isLoading}
                accessible
                accessibilityLabel="Save user changes"
              >
                <ButtonText>Save</ButtonText>
              </Button>
              <Button
                mode="outlined"
                style={styles.actionButton}
                textColor={colors.text}
                onPress={() => setEditUser(null)}
                disabled={isLoading}
                accessible
                accessibilityLabel="Cancel edit"
              >
                <ButtonText>Cancel</ButtonText>
              </Button>
            </View>
          </View>
        ) : (
          <View>
            <Text
              style={[styles.cardText, { color: colors.primary, fontWeight: 'bold' }]}
              accessible
              accessibilityLabel={`User: ${item.name || 'Unknown'}`}
            >
              {item.name || 'Unknown'}
            </Text>
            <Text
              style={[styles.cardText, { color: colors.text }]}
              accessible
              accessibilityLabel={`Mobile: ${item.mobile || 'Not available'}`}
            >
              Mobile: {item.mobile || 'N/A'}
            </Text>
            <Text
              style={[styles.cardText, { color: colors.text }]}
              accessible
              accessibilityLabel={`Points: ${item.points || 0}`}
            >
              Points: {item.points || 0}
            </Text>
            <Text
              style={[styles.cardText, { color: colors.text }]}
              accessible
              accessibilityLabel={`Location: ${item.location || 'Not available'}`}
            >
              Location: {item.location || 'N/A'}
            </Text>
            <Text
              style={[styles.cardText, { color: colors.text }]}
              accessible
              accessibilityLabel={`Unique Code: ${item.uniqueCode || 'Not available'}`}
            >
              Unique Code: {item.userUniqueCode || item.uniqueCode || 'N/A'}
            </Text>
            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                style={styles.actionButton}
                textColor={colors.primary}
                onPress={() => handleEditUser(item)}
                disabled={isLoading}
                accessible
                accessibilityLabel={`Edit user ${item.name || 'Unknown'}`}
              >
                <ButtonText>Edit</ButtonText>
              </Button>
              <Button
                mode="outlined"
                style={styles.actionButton}
                textColor={colors.error}
                onPress={() => handleDeleteUser(item._id)}
                disabled={isLoading}
                accessible
                accessibilityLabel={`Delete user ${item.name || 'Unknown'}`}
              >
                <ButtonText>Delete</ButtonText>
              </Button>
              <Button
                mode="contained"
                style={styles.actionButton}
                buttonColor={colors.primary}
                textColor="#fff"
                onPress={() => openSendTokenModal(item)}
                disabled={isLoading}
                accessible
                accessibilityLabel={`Send tokens to ${item.name || 'Unknown'}`}
              >
                <ButtonText>Permanent Coins   <MaterialCommunityIcons name="send" size={20} color="#fff" /></ButtonText>
              </Button>
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.tabContent, { backgroundColor: isDarkMode ? '#121212' : '#f0f4f8' }]}>
      <Text style={[styles.title, { color: colors.text }]} accessible accessibilityLabel="Users">
        Users
      </Text>
      <TextInput
        placeholder="Search Users by Name, Mobile, or UniqueCode"
        value={searchUser}
        onChangeText={setSearchUser}
        style={[styles.searchBar, { backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5' }]}
        placeholderTextColor={colors.placeholder || (isDarkMode ? '#888' : '#666')}
        mode="outlined"
        theme={{ colors: { text: colors.text, primary: colors.primary } }}
        accessible
        accessibilityLabel="Search users"
      />
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={
          <Text
            style={[styles.emptyText, { color: colors.text }]}
            accessible
            accessibilityLabel="No users found"
          >
            No users found.
          </Text>
        }
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      {/* Send Tokens Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={sendTokenModalVisible}
        onRequestClose={() => {
          setSendTokenModalVisible(false);
          setSendTokenUserId(null);
          setSelectedUser(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modal,
              { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff', width: isWeb && SCREEN_WIDTH > 600 ? 400 : 320 },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>Send Coins 💰</Text>
            <Text style={[styles.cardText, { color: colors.text }]}>
              User: {selectedUser?.name || 'N/A'}
            </Text>
            <Text style={[styles.cardText, { color: colors.text }]}>
              Mobile: {selectedUser?.mobile || 'N/A'}
            </Text>
            <TextInput
              label="Total Coins"
              value={tokenAmount}
              onChangeText={setTokenAmount}
              style={[styles.input, { width: '100%' }]}
              theme={{ colors: { text: colors.text, primary: colors.primary } }}
              mode="outlined"
              keyboardType="numeric"
              placeholder="Enter token amount"
              placeholderTextColor={colors.placeholder || (isDarkMode ? '#888' : '#666')}
              accessible
              accessibilityLabel="Enter token amount"
            />
             <Text style={[styles.cardText, { color: colors.text ,fontSize:15,color:'red'}]}>
Note: These coins will never expire
            </Text>
            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                style={styles.actionButton}
                buttonColor={colors.primary}
                textColor="#fff"
                onPress={handleSendTokensWrapper}
                disabled={isLoading}
                accessible
                accessibilityLabel="Confirm send tokens"
              >
                <ButtonText>{isLoading ? 'Sending...' : 'Send'}</ButtonText>
              </Button>
              <Button
                mode="outlined"
                style={styles.actionButton}
                textColor={colors.text}
                onPress={() => {
                  setSendTokenModalVisible(false);
                  setSendTokenUserId(null);
                  setSelectedUser(null);
                  setTokenAmount('');
                }}
                disabled={isLoading}
                accessible
                accessibilityLabel="Cancel send tokens"
              >
                <ButtonText>Cancel</ButtonText>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default memo(Users);

const styles = StyleSheet.create({
  tabContent: {
    paddingBottom: 20,
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
    marginVertical: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  cardText: {
    fontSize: 18,
    marginVertical: 8,
    fontWeight: '500',
    lineHeight: 24,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 18,
    marginVertical: 15,
    fontWeight: '500',
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
});