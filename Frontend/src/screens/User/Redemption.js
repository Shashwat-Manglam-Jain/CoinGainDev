
import React, { useState, useContext } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { useTheme, Card, Button } from 'react-native-paper';
import { ThemeContext } from '../../ThemeContext';
import styles, { ButtonText } from './styles';

const Redemption = ({ redemptions, handleClearRedemption }) => {
  const { colors } = useTheme();
  const { isDarkMode } = useContext(ThemeContext);
  const [showRewardHistory, setShowRewardHistory] = useState(true);

  const handleToggleRewardHistory = () => {
    setShowRewardHistory((prev) => !prev);
  };

  return (
    <View style={styles.tabContent}>
      <View style={styles.rewardHistoryHeader}>
        <Text style={[styles.title, { color: colors.text }]}>Your Redemptions</Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={handleToggleRewardHistory}
          activeOpacity={0.7}
        >
          <Text style={[styles.toggleButtonText, { color: colors.primary }]}>
            {showRewardHistory ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
      </View>
      {showRewardHistory && (
        <FlatList
          key={`reward-history-${showRewardHistory}`}
          data={redemptions}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => {}} activeOpacity={0.8}>
              <View style={[styles.historyItem, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
                <Card.Content>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                    {item.rewardId?.image && (
                      <Image
                        source={{ uri: item.rewardId.image }}
                        style={styles.historyImage}
                        resizeMode="cover"
                        onError={() => console.log('Failed to load history image')}
                      />
                    )}
                    <View style={{ flex: 1, marginLeft: 10, marginTop: 10 }}>
                      <Text style={[styles.historyName, { color: colors.text }]}>
                        {item.rewardId?.name || 'Unknown'}
                      </Text>
                      <Text
                        style={[
                          styles.historyName,
                          {
                            color:
                              item.status === 'pending' || item.status === 'rejected'
                                ? colors.error
                                : 'green',
                          },
                        ]}
                      >
                        Status: {item.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.historyDetails, { color: colors.text }]}>
                    Redeemed: {new Date(item.redeemedAt).toLocaleString()} | Status: {item.status}
                  </Text>
                  {item.status === 'pending' && (
                    <Button
                      mode="outlined"
                      onPress={() => handleClearRedemption(item._id)}
                      textColor={colors.error}
                      style={styles.clearButton}
                    >
                      <ButtonText>Cancel</ButtonText>
                    </Button>
                  )}
                </Card.Content>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <Text style={[styles.emptyText, { color: colors.text }]}>No redemptions history.</Text>
          )}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}
    </View>
  );
};

export default Redemption;
