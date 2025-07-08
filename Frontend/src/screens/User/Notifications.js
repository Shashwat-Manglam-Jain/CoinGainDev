
import React, { memo, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useTheme, Button, Avatar } from 'react-native-paper';
import { ThemeContext } from '../../ThemeContext';
import styles, { ButtonText } from './styles';

const Notifications = ({ notifications, handleMarkAllRead, handleClearNotification ,readNotification }) => {
  const { colors } = useTheme();
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <View style={styles.tabContent}>
      <View style={styles.rewardHistoryHeader}>
        <Text style={[styles.title, { color: colors.text}]}>Notifications</Text>
        {notifications.length > 0 && (
      <TouchableOpacity
  onPress={handleMarkAllRead}
  style={{
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: 'transparent',
  }}
>
  <Text style={{ color:colors.primary, fontSize: 16, fontWeight: 'bold' }}>
    Mark All Read
  </Text>
</TouchableOpacity>

      
        )}
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
         <TouchableOpacity   onPress={()=>readNotification(item._id)}   onLongPress={() => handleClearNotification(item._id)}>
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
           
          </View></TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <Text style={[styles.emptyText, { color: colors.text }]}>No notifications.</Text>
        )}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </View>
  );
};

export default memo(Notifications);
