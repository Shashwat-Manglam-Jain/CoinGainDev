import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, Platform, Dimensions, StyleSheet, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import { Card, Avatar, TextInput, Button } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../../ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import Clipboard from '@react-native-community/clipboard';
import { API_BASE_URL } from '../../../utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const History = ({ users, rewards, redemptions, colors, isDarkMode }) => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDescending, setSortDescending] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isClipboardAvailable, setIsClipboardAvailable] = useState(false);

  // Check and log Clipboard availability
  useEffect(() => {
    const checkClipboard = () => {
      const clipboardAvailable = isWeb ? !!navigator?.clipboard?.writeText : !!Clipboard && typeof Clipboard.setString === 'function';
      console.log('Platform:', Platform.OS);
      console.log('Clipboard module:', Clipboard);
      console.log('Clipboard.setString exists:', Clipboard ? typeof Clipboard.setString : 'undefined');
      console.log('isWeb:', isWeb, 'navigator.clipboard:', !!navigator?.clipboard?.writeText);
      console.log('isClipboardAvailable:', clipboardAvailable);
      setIsClipboardAvailable(clipboardAvailable);
      if (!clipboardAvailable && !isWeb) {
        console.warn('Clipboard module is not available. Ensure @react-native-community/clipboard is installed and linked correctly.');
      }
    };
    checkClipboard();
  }, []);

  // Calculate statistics
  const totalCoins = users.reduce((sum, u) => sum + (u.points || 0), 0);
  const pendingRedemptions = redemptions.filter((r) => r.status === 'pending').length;

  // Format date using native JavaScript
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // Fetch payment history
  useEffect(() => {
    const fetchPayments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userInfo = await AsyncStorage.getItem('userInfo');
        const token = await AsyncStorage.getItem('userToken');
        if (!userInfo || !token) {
          throw new Error('Authentication data is missing');
        }
        const { _id: adminId } = JSON.parse(userInfo);
        if (!adminId) {
          throw new Error('Admin ID is missing');
        }
        const response = await axios.get(
          `${API_BASE_URL}/fetchdata/getAdminRelatedPayments/${adminId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Payment history response:', response.data);
        setPayments(response.data.payments || []);
      } catch (err) {
        console.error('Fetch payments error:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        setError(err.response?.data?.error || err.message || 'Failed to fetch payment history');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: err.response?.data?.error || err.message || 'Failed to fetch payment history',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayments();
  }, []);

  // Filter and sort payments
  const filteredPayments = payments
    .filter((item) =>
      searchQuery
        ? item.invoice.toString().includes(searchQuery) ||
          item.senderId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.receiverId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.amount.toString().includes(searchQuery)
        : true
    )
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortDescending ? dateB - dateA : dateA - dateB;
    });

  // Copy payment details to clipboard
  const handleCopyToClipboard = (payment) => {
    console.log('Attempting to copy payment details:', payment._id);
    try {
      const text = `Invoice: #${payment.invoice}\n` +
                   `Amount: ₹${payment.amount.toFixed(2)}\n` +
                   `Reward Percentage: ${payment.rewardPercentage}%\n` +
                   `Points: ${(payment.amount * payment.rewardPercentage / 100).toFixed(1)}\n` +
                   `Expiry: ${formatDate(payment.expiryMonth)}\n` +
                   `Sender: ${payment.senderId?.name || 'Unknown'}\n` +
                   `Receiver: ${payment.receiverId?.name || 'Unknown'}\n` +
                   `Date: ${formatDate(payment.createdAt)}`;
      if (isWeb && navigator?.clipboard?.writeText) {
        console.log('Using navigator.clipboard for web');
        navigator.clipboard.writeText(text).then(() => {
          Toast.show({
            type: 'success',
            text1: 'Copied',
            text2: 'Payment details copied to clipboard',
          });
        });
      } else if (Clipboard && typeof Clipboard.setString === 'function') {
        console.log('Using Clipboard.setString for mobile');
        Clipboard.setString(text);
        Toast.show({
          type: 'success',
          text1: 'Copied',
          text2: 'Payment details copied to clipboard',
        });
      } else {
        throw new Error('Clipboard module is not available');
      }
    } catch (error) {
      console.error('Clipboard error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to copy payment details. Clipboard functionality is not available.',
      });
    }
  };

  // Open details modal
  const openDetailsModal = (payment) => {
    setSelectedPayment(payment);
    setDetailModalVisible(true);
  };

  // Fallback for missing data
  if (!users || !rewards || !redemptions) {
    return (
      <View style={[styles.tabContent, { backgroundColor: isDarkMode ? '#121212' : '#f0f4f8' }]}>
        <Text style={[styles.title, { color: colors.text }]} accessible accessibilityLabel="History">
          History
        </Text>
        <Text style={[styles.emptyText, { color: colors.text }]} accessible accessibilityLabel="Data not available">
          Data not available.
        </Text>
      </View>
    );
  }

  const renderPayment = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.paymentItem,
        {
          backgroundColor: isDarkMode
            ? index % 2 === 0
              ? '#2a2a2a'
              : '#333333'
            : index % 2 === 0
              ? '#f5f5f5'
              : '#e8ecef',
        },
      ]}
      onPress={() => openDetailsModal(item)}
      accessible
      accessibilityLabel={`View details for payment invoice ${item.invoice}`}
    >
      <View style={styles.paymentHeader}>
        <MaterialIcons name="receipt" size={24} color={colors.primary} style={styles.icon} />
        <Text
          style={[styles.cardText, { color: colors.primary, fontWeight: '700' }]}
          accessible
          accessibilityLabel={`Invoice: ${item.invoice}`}
        >
          Invoice: #{item.invoice}
        </Text>
      </View>
      <View style={styles.paymentDetail}>
        <MaterialCommunityIcons name="currency-inr" size={20} color={colors.text} style={styles.icon} />
        <Text
          style={[styles.cardText, { color: colors.text }]}
          accessible
          accessibilityLabel={`Amount: ${item.amount}`}
        >
          Amount: ₹{item.amount.toFixed(2)}
        </Text>
      </View>
      <View style={styles.paymentDetail}>
        <MaterialIcons name="schedule" size={20} color={colors.text} style={styles.icon} />
        <Text
          style={[styles.cardText, { color: isDarkMode ? '#aaaaaa' : '#666666', fontWeight: '400' }]}
          accessible
          accessibilityLabel={`Date: ${formatDate(item.createdAt)}`}
        >
          Date: {formatDate(item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderPaymentDetails = () => (
    <View
      style={[
        styles.modal,
        { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff', width: isWeb && SCREEN_WIDTH > 600 ? 400 : 320 },
      ]}
    >
      <Text style={[styles.modalTitle, { color: colors.text }]}>Payment Details</Text>
      <View style={styles.paymentDetail}>
        <MaterialIcons name="receipt" size={24} color={colors.primary} style={styles.icon} />
        <Text
          style={[styles.cardText, { color: colors.primary, fontWeight: '700' }]}
          accessible
          accessibilityLabel={`Invoice: ${selectedPayment?.invoice}`}
        >
          Invoice: #{selectedPayment?.invoice}
        </Text>
      </View>
      <View style={styles.paymentDetail}>
        <MaterialCommunityIcons name="currency-inr" size={20} color={colors.text} style={styles.icon} />
        <Text
          style={[styles.cardText, { color: colors.text }]}
          accessible
          accessibilityLabel={`Amount: ${selectedPayment?.amount}`}
        >
          Amount: ₹{selectedPayment?.amount.toFixed(2)}
        </Text>
      </View>
      <View style={styles.paymentDetail}>
        <MaterialCommunityIcons name="percent" size={20} color={colors.text} style={styles.icon} />
        <Text
          style={[styles.cardText, { color: colors.text }]}
          accessible
          accessibilityLabel={`Reward Percentage: ${selectedPayment?.rewardPercentage}%`}
        >
          Reward: {selectedPayment?.rewardPercentage}%
        </Text>
      </View>
      <View style={styles.paymentDetail}>
        <MaterialCommunityIcons name="star" size={20} color={colors.accent || '#FFD700'} style={styles.icon} />
        <Text
          style={[styles.cardText, { color: colors.text }]}
          accessible
          accessibilityLabel={`Points Awarded: ${selectedPayment ? (selectedPayment.amount * selectedPayment.rewardPercentage / 100).toFixed(1) : ''}`}
        >
          Points: {selectedPayment ? (selectedPayment.amount * selectedPayment.rewardPercentage / 100).toFixed(1) : ''}
        </Text>
      </View>
      <View style={styles.paymentDetail}>
        <MaterialIcons name="event" size={20} color={colors.text} style={styles.icon} />
        <Text
          style={[styles.cardText, { color: colors.text }]}
          accessible
          accessibilityLabel={`Expiry: ${selectedPayment ? formatDate(selectedPayment.expiryMonth) : ''}`}
        >
          Expiry: {selectedPayment ? formatDate(selectedPayment.expiryMonth) : ''}
        </Text>
      </View>
      <View style={styles.paymentDetail}>
        <MaterialIcons name="person" size={20} color={colors.text} style={styles.icon} />
        <Text
          style={[styles.cardText, { color: colors.text }]}
          accessible
          accessibilityLabel={`Sender: ${selectedPayment?.senderId?.name || 'Unknown'}`}
        >
          Sender: {selectedPayment?.senderId?.name || 'Unknown'}
        </Text>
      </View>
      <View style={styles.paymentDetail}>
        <MaterialIcons name="person" size={20} color={colors.text} style={styles.icon} />
        <Text
          style={[styles.cardText, { color: colors.text }]}
          accessible
          accessibilityLabel={`Receiver: ${selectedPayment?.receiverId?.name || 'Unknown'}`}
        >
          Receiver: {selectedPayment?.receiverId?.name || 'Unknown'}
        </Text>
      </View>
      <View style={styles.paymentDetail}>
        <MaterialIcons name="schedule" size={20} color={colors.text} style={styles.icon} />
        <Text
          style={[styles.cardText, { color: isDarkMode ? '#aaaaaa' : '#666666', fontWeight: '400' }]}
          accessible
          accessibilityLabel={`Date: ${selectedPayment ? formatDate(selectedPayment.createdAt) : ''}`}
        >
          Date: {selectedPayment ? formatDate(selectedPayment.createdAt) : ''}
        </Text>
      </View>
      <View style={styles.buttonRow}>
        <Button
          mode="contained"
          style={styles.actionButton}
          buttonColor={colors.primary}
          textColor="#fff"
          onPress={() => handleCopyToClipboard(selectedPayment)}
          labelStyle={styles.buttonLabel}
          icon="content-copy"
          disabled={!isClipboardAvailable}
          accessible
          accessibilityLabel={isClipboardAvailable ? 'Copy payment details to clipboard' : 'Copy to clipboard unavailable'}
        >
          Copy to Clipboard
        </Button>
        <Button
          mode="outlined"
          style={styles.actionButton}
          textColor={colors.text}
          onPress={() => setDetailModalVisible(false)}
          labelStyle={styles.buttonLabel}
          accessible
          accessibilityLabel="Close payment details"
        >
          Close
        </Button>
      </View>
    </View>
  );

  return (
    <View style={[styles.tabContent, { backgroundColor: isDarkMode ? '#121212' : '#f0f4f8' }]}>
      <Text style={[styles.title, { color: colors.text }]} accessible accessibilityLabel="History">
        History
      </Text>
      <View style={styles.controlsContainer}>
        <TextInput
          placeholder="Search by Invoice, Sender, Receiver, or Amount"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchBar, { backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5' }]}
          placeholderTextColor={colors.placeholder || (isDarkMode ? '#888' : '#666')}
          mode="outlined"
          theme={{ colors: { text: colors.text, primary: colors.primary } }}
          left={<TextInput.Icon icon="magnify" color={colors.text} />}
          accessible
          accessibilityLabel="Search payment history"
        />
        <Button
          mode="contained"
          style={styles.sortButton}
          buttonColor={colors.primary}
          textColor="#fff"
          onPress={() => setSortDescending(!sortDescending)}
          labelStyle={styles.buttonLabel}
          icon={sortDescending ? 'sort-descending' : 'sort-ascending'}
          accessible
          accessibilityLabel={`Sort payments ${sortDescending ? 'ascending' : 'descending'}`}
        >
          Sort {sortDescending ? 'Oldest First' : 'Newest First'}
        </Button>
      </View>
      <Card style={[styles.card, { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }]}>
        <Card.Title
          title="Payments Activities"
          titleStyle={[styles.cardTitle, { color: colors.text }]}
          left={() => (
            <Avatar.Icon
              size={40}
              icon="history"
              style={{ backgroundColor: colors.primary }}
              accessible
              accessibilityLabel="Payments history icon"
            />
          )}
        />
        <Card.Content>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : error ? (
            <Text
              style={[styles.emptyText, { color: colors.error }]}
              accessible
              accessibilityLabel="Error loading payment history"
            >
              {error}
            </Text>
          ) : filteredPayments.length === 0 ? (
            <Text
              style={[styles.emptyText, { color: colors.text }]}
              accessible
              accessibilityLabel="No payments found"
            >
              No payments found.
            </Text>
          ) : (
            <FlatList
              data={filteredPayments}
              renderItem={renderPayment}
              keyExtractor={(item) => item._id}
              ListEmptyComponent={
                <Text
                  style={[styles.emptyText, { color: colors.text }]}
                  accessible
                  accessibilityLabel="No payments found"
                >
                  No payments found.
                </Text>
              }
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews={true}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </Card.Content>
      </Card>
      <View style={styles.statContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistics</Text>
        <View style={styles.statItem}>
          <MaterialIcons
            name="account-balance-wallet"
            size={30}
            color={colors.primary}
            style={styles.statIcon}
          />
          <Text style={[styles.cardText, { color: colors.text }]}>
            Total Coins Sent: {totalCoins}
          </Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons
            name="gift"
            size={30}
            color={colors.primary}
            style={styles.statIcon}
          />
          <Text style={[styles.cardText, { color: colors.text }]}>
            Total Rewards: {rewards.length}
          </Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={30}
            color={colors.primary}
            style={styles.statIcon}
          />
          <Text style={[styles.cardText, { color: colors.text }]}>
            Pending Redemptions: {pendingRedemptions}
          </Text>
        </View>
      </View>
      {/* Payment Details Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {selectedPayment && renderPaymentDetails()}
        </View>
      </Modal>
    </View>
  );
};

export default History;

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
  emptyText: {
    textAlign: 'center',
    fontSize: 18,
    marginVertical: 15,
    fontWeight: '500',
  },
  statContainer: {
    marginVertical: 15,
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  statIcon: {
    marginRight: 15,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginVertical: 15,
  },
  paymentItem: {
    marginVertical: 10,
    padding: 15,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  icon: {
    marginRight: 10,
  },
  controlsContainer: {
    flexDirection: isWeb && SCREEN_WIDTH > 600 ? 'row' : 'column',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    height: 50,
  },
  sortButton: {
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: isWeb && SCREEN_WIDTH > 600 ? 150 : '100%',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: Platform.OS === 'android' ? 28 : 20,
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
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 15,
    gap: 10,
  },
  actionButton: {
    marginHorizontal: 8,
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 120,
  },
});