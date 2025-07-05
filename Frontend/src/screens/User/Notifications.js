
import React, { useContext } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useTheme, Button, Avatar } from 'react-native-paper';
import { ThemeContext } from '../../ThemeContext';
import styles, { ButtonText } from './styles';

const Notifications = ({ notifications, handleMarkAllRead, handleClearNotification }) => {
  const { colors } = useTheme();
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <View style={styles.tabContent}>
      <View style={styles.rewardHistoryHeader}>
        <Text style={[styles.title, { color: colors.text,marginRight:10 }]}>Notifications</Text>
        {notifications.length > 0 && (
          <Button
            mode="contained"
            onPress={handleMarkAllRead}
            buttonColor={colors.primary}
            textColor="#FFFFFF"
          >
            <ButtonText>Mark All Read</ButtonText>
          </Button>
        )}
      </View>
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
                    ? '#3A3A3A'
                    : '#F5F5F5'
                  : isDarkMode
                  ? '#444444'
                  : '#FFFFFF',
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
            <Button
              mode="text"
              onPress={() => handleClearNotification(item._id)}
              textColor={colors.error}
              style={styles.clearButton}
            >
              <ButtonText>Dismiss</ButtonText>
            </Button>
          </View>
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

export default Notifications;
