import React, { useContext } from 'react';
import { View, Text, FlatList, Platform, StyleSheet  } from 'react-native';
import { Card, Avatar, Button } from 'react-native-paper';
import { ThemeContext } from '../../ThemeContext';

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

const Notification = ({
  notifications,
  redemptions,
  handleClearNotification,
  handleDismissAllNotifications,
  handleApproveRedemption,
  handleRejectRedemption,
  colors,
  isDarkMode,
}) => {
  const handleButtonPress = (callback) => {
    callback();
  };

  const renderRedemption = ({ item }) => (
    <View style={[styles.redemptionItem, { backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5' }]}>
      <Avatar.Icon
        size={36}
        icon="account"
        style={{ backgroundColor: colors.primary, marginRight: 10 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardText, { color: colors.text, fontWeight: 'bold' }]}>
          {item.userId?.name || 'Unknown'}
        </Text>
        <Text style={[styles.cardText, { color: colors.text }]}>
          Reward: {item.rewardId?.name || 'Unknown'}
        </Text>
      </View>
      <View style={styles.buttonRow}>
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            style={styles.actionButton}
            buttonColor={colors.primary}
            textColor="#fff"
            onPress={() => handleButtonPress(() => handleApproveRedemption(item._id))}
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
            onPress={() => handleButtonPress(() => handleRejectRedemption(item._id))}
          >
            <ButtonText>Reject</ButtonText>
          </Button>
        </View>
      </View>
    </View>
  );

  const renderNotification = ({ item }) => (
    <View
      style={[
        styles.notificationItem,
        {
          backgroundColor: item.read
            ? isDarkMode
              ? '#2a2a2a'
              : '#f5f5f5'
            : isDarkMode
            ? '#333'
            : '#fff',
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
      <View style={styles.buttonContainer}>
        <Button
          mode="text"
          textColor={colors.error}
          onPress={() => handleButtonPress(() => handleClearNotification(item._id))}
        >
          <ButtonText>Dismiss</ButtonText>
        </Button>
      </View>
    </View>
  );

  return (
    <View style={[styles.tabContent, { backgroundColor: isDarkMode ? '#121212' : '#f0f4f8' }]}>
      <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
      <Card style={[styles.card, { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }]}>
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
            data={redemptions.filter((r) => r.status === 'pending')}
            keyExtractor={(item) => item._id}
            renderItem={renderRedemption}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No pending redemptions.
              </Text>
            }
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
          />
        </Card.Content>
      </Card>
      <Card style={[styles.card, { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }]}>
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
          right={() =>
            notifications.length > 0 ? (
              <View style={styles.buttonContainer}>
                <Button
                  mode="text"
                  textColor={colors.error}
                  onPress={() => handleButtonPress(handleDismissAllNotifications)}
                >
                  <ButtonText>Dismiss All</ButtonText>
                </Button>
              </View>
            ) : null
          }
        />
        <Card.Content>
          <FlatList
            data={notifications}
            keyExtractor={(item) => item._id}
            renderItem={renderNotification}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No notifications available.
              </Text>
            }
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
          />
        </Card.Content>
      </Card>
    </View>
  );
};

export default Notification;

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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
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
  redemptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
});