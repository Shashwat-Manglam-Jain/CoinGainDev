import React from 'react';
import { View, Text, FlatList, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Avatar, Button } from 'react-native-paper';

const isWeb = Platform.OS === 'web';

const ButtonText = ({ children, style }) => (
  <Text
    style={[
      {
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '600',
        lineHeight: Platform.OS === 'android' ? 24 : 20,
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
  handlereadNotification,
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
    <View style={[styles.redemptionItem, { backgroundColor: isDarkMode ? '#2a2a2a' : '#f8f9fa' }]}>
      <Avatar.Icon
        size={32}
        icon="account"
        style={{ backgroundColor: colors.primary, marginRight: 12 }}
      />
      <View style={styles.textContainer}>
        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          style={[styles.cardText, { color: colors.primary, fontWeight: '600' }]}
        >
          {item.userId?.name || 'Unknown'}
        </Text>
        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          style={[styles.cardText, { color: colors.text, opacity: 0.8 }]}
        >
          Reward: {item.rewardId?.name || 'Unknown'}
        </Text>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.buttonContainer, { backgroundColor: '#28a745' }]}
          onPress={() => handleButtonPress(() => handleApproveRedemption(item._id))}
        >
          <Avatar.Icon
            size={28}
            icon="check"
            style={{ backgroundColor: 'transparent' }}
            color="#fff"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonContainer, { backgroundColor: '#dc3545' }]}
          onPress={() => handleButtonPress(() => handleRejectRedemption(item._id))}
        >
          <Avatar.Icon
            size={28}
            icon="close"
            style={{ backgroundColor: 'transparent' }}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNotification = ({ item }) => (
    <TouchableOpacity    onPress={() => handleButtonPress(() =>handlereadNotification(item._id))}
     onLongPress={() => handleButtonPress(() =>handleClearNotification(item._id))}>
    <View
      style={[
        styles.notificationItem,
        {
          backgroundColor: item.read
            ? isDarkMode
              ? '#2a2a2a'
              : '#f8f9fa'
            : isDarkMode
            ? '#333'
            : '#fff',
        },
      ]}
     
    >
    {!item.read && (
  <View
  style={{
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
    marginRight: 12,
  }}
   
/>

)}

  
      <Avatar.Icon
        size={32}
        icon={item.read ? 'bell-outline' : 'bell'}
        style={{
          backgroundColor: item.read ? colors.secondary : colors.primary,
          marginRight: 12,
        }}
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.notificationText, { color: colors.text }]}>
          {item.message}
        </Text>
        <Text style={[styles.notificationDate, { color: colors.text, opacity: 0.7 }]}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
    </View></TouchableOpacity>
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
              size={36}
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
              size={36}
              icon="bell"
              style={{ backgroundColor: colors.primary }}
            />
          )}
          right={() =>
            notifications.length > 0 ? (
              <View style={styles.buttonContainer}>
               <TouchableOpacity
          style={[styles.buttonContainer, { backgroundColor: '#dc3545' }]}
       onPress={() => handleButtonPress(handleDismissAllNotifications)}
        >
                  <Avatar.Icon
            size={28}
            icon="delete"
            style={{ backgroundColor: 'transparent' }}
            color="#fff"
          />
                </TouchableOpacity>
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
  tabContent: {
    flex: 1,
    width: '100%',
    paddingBottom: 80,
    backgroundColor: '#f0f4f8',
  },
  card: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    padding: 12,
    width: '100%',
  
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 16,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  cardText: {
    fontSize: Platform.OS === 'android' ? 13 : 14,
    marginVertical: 2,
    fontWeight: '500',
    lineHeight: Platform.OS === 'android' ? 18 : 20,
  },
  textContainer: {
    flex: 1,
    flexShrink: 1,
    flexGrow: 1,
    marginRight: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...(isWeb ? { transition: 'background-color 0.2s ease' } : {}),
  },
  notificationText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  notificationDate: {
    fontSize: 12,
    marginTop: 4,
  },
  redemptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...(isWeb ? { transition: 'background-color 0.2s ease' } : {}),
    minHeight: 72,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
    flexShrink: 0,
    justifyContent: 'flex-end',
  },
  buttonContainer: {
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    ...(isWeb ? { transition: 'transform 0.2s ease' } : {}),
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginVertical: 12,
    fontWeight: '500',
    opacity: 0.7,
  },
});