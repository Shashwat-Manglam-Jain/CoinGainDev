
import React, { useState, useContext } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { useTheme, Card, TextInput, Button, Badge } from 'react-native-paper';
import { ThemeContext } from '../../ThemeContext';
import styles, { ButtonText } from './styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Rewards = ({ user, rewards, handleRedeem }) => {
  const { colors } = useTheme();
  const { isDarkMode } = useContext(ThemeContext);
  const [searchReward, setSearchReward] = useState('');

  return (
    <View style={styles.tabContent}>
      <Text style={[styles.title, { color: colors.text }]}>Rewards</Text>
      <TextInput
        placeholder="Search Rewards by Name"
        value={searchReward}
        onChangeText={setSearchReward}
        style={[styles.searchBar, { backgroundColor: isDarkMode ? '#3A3A3A' : '#F5F5F5' }]}
        placeholderTextColor={colors.text}
        mode="outlined"
        theme={{ colors: { text: colors.text, primary: colors.primary } }}
      />
      <FlatList
        data={rewards.filter((reward) =>
          reward.name.toLowerCase().includes(searchReward.toLowerCase())
        )}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const pointsEarned = user?.points ?? 0;
          const pointsRequired = item.pointsRequired || 100;
          const percentage = Math.min((pointsEarned / pointsRequired) * 100, 100);
          const remainingPoints = Math.max(pointsRequired - pointsEarned, 0);
          const isAchieved = pointsEarned >= pointsRequired;

          return (
            <TouchableOpacity
              onPress={() => {}}
              activeOpacity={0.8}
            >
              <View style={[styles.rewardCard, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
                <Card.Content style={{paddingVertical:10}}>
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
                  {item.image && (
                    <Image
                      source={{ uri: item.image }}
                      style={styles.rewardImage}
                      resizeMode="cover"
                      onError={() => console.log('Failed to load reward image')}
                    />
                  )}
                  <Text style={[styles.rewardName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.rewardDetails, { color: colors.text }]}>
                    Price: ₹{item.price} | Points Required: {pointsRequired}
                  </Text>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${percentage}%`,
                            backgroundColor: isAchieved ? '#2196F3' : '#4CAF50',
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressText, { color: colors.text }]}>
                      <Text style={[styles.progressText, { color: colors.error }]}>{pointsEarned}</Text>
                      /{pointsRequired} points ({percentage.toFixed(2)}% achieved)
                    </Text>
                    <Text style={[styles.progressText, { color: colors.text }]}>
                      {remainingPoints} points remaining
                    </Text>
                    {isAchieved ? (
                      <Text style={[styles.rewardAchieved, { color: '#2196F3' }]}>
                        🎉 Reward Achieved
                      </Text>
                    ) : (
                      <Text style={[styles.remainingPoints, { color: '#FF5722' }]}>
                        Need {remainingPoints} more points to unlock
                      </Text>
                    )}
                  </View>
                  {isAchieved && (
                    <Button
                      mode="contained"
                      onPress={() => handleRedeem(item)}
                      style={styles.redeemButton}
                      buttonColor={colors.primary}
                      textColor="#FFFFFF"
                      contentStyle={{ paddingVertical: 6 }}
                    >  <MaterialCommunityIcons name="gift" size={28} color={'white'} style={styles.statIcon} />
                      <ButtonText> Redeem Now</ButtonText>
                    </Button>
                  )}
                </Card.Content>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => (
          <Text style={[styles.emptyText, { color: colors.text }]}>No rewards found.</Text>
        )}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </View>
  );
};

export default Rewards;
