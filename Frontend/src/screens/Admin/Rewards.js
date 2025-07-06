import React, { useContext } from 'react';
import { View, Text, FlatList, Platform, ImageBackground, Image, Alert , StyleSheet } from 'react-native';
import { Card, Avatar, Button, TextInput } from 'react-native-paper';
import { ThemeContext } from '../../ThemeContext';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const CARD_WIDTH = SCREEN_WIDTH - 140;
const CARD_HEIGHT = 250;

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

const Rewards = ({
  rewards,
  newReward,
  setNewReward,
  imagePreview,
  setImagePreview,
  editingRewardId,
  setEditingRewardId,
  isUploading,
  handleImageUpload,
  handleAddReward,
  handleCancelEdit,
  handleDeleteReward,
  deletingRewardId,
  colors,
  isDarkMode,
}) => {
  const handleButtonPress = (callback) => {
    callback();
  };

  const renderReward = ({ item }) => (
    <View style={[styles.rewardCard, { width: CARD_WIDTH }]}>
      <ImageBackground
        source={{ uri: item.image }}
        resizeMode="contain"
        style={styles.rewardCardImage}
        imageStyle={styles.rewardCardImageStyle}
        defaultSource={require('../../../assets/placeholder.webp')}
        onError={() => Alert.alert('Error', 'Failed to load reward image')}
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
            onPress={() => handleButtonPress(() => handleDeleteReward(item._id))}
          >
            <ButtonText>{deletingRewardId === item._id ? 'Deleting...' : 'Delete'}</ButtonText>
          </Button>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.tabContent, { backgroundColor: isDarkMode ? '#121212' : '#f0f4f8' ,padding:10,}]}>
      <Text style={[styles.title, { color: colors.text }]}>Rewards</Text>
      <Card style={[styles.card, { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }]}>
        <Card.Title
          title={editingRewardId ? 'Edit Reward' : 'Manage Rewards'}
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
            onChangeText={(text) => setNewReward({ ...newReward, name: text })}
            style={styles.input}
            theme={{ colors: { text: colors.text, primary: colors.primary } }}
            mode="outlined"
          />
          <TextInput
            label="Price (₹)"
            value={newReward.price}
            onChangeText={(text) => setNewReward({ ...newReward, price: text })}
            keyboardType="numeric"
            style={styles.input}
            theme={{ colors: { text: colors.text, primary: colors.primary } }}
            mode="outlined"
          />
          <TextInput
            label="Points Required"
            value={newReward.pointsRequired}
            onChangeText={(text) => setNewReward({ ...newReward, pointsRequired: text })}
            keyboardType="numeric"
            style={styles.input}
            theme={{ colors: { text: colors.text, primary: colors.primary } }}
            mode="outlined"
          />
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              style={styles.actionButton}
              buttonColor={colors.primary}
              textColor="#fff"
              onPress={() => handleButtonPress(handleImageUpload)}
              disabled={isUploading}
            >
              <ButtonText>{isUploading ? 'Uploading...' : 'Upload Image'}</ButtonText>
            </Button>
          </View>
          {imagePreview && (
            <Image
              source={{ uri: imagePreview }}
              style={[styles.rewardImage, { marginVertical: 12 }]}
              onError={() => Alert.alert('Error', 'Failed to load image preview')}
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
                      ? 'Updating...'
                      : 'Adding...'
                    : editingRewardId
                    ? 'Update Reward'
                    : 'Add Reward'}
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
            renderItem={renderReward}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No rewards available.
              </Text>
            }
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </Card.Content>
      </Card>
    </View>
  );
};

export default Rewards;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
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
  emptyText: {
    textAlign: 'center',
    fontSize: 18,
    marginVertical: 15,
    fontWeight: '500',
  },
  rewardCard: {
    
    margin: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  rewardCardImage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    justifyContent: 'flex-end',
    padding: 10,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  rewardCardImageStyle: {
    borderRadius: 12,
  },
  rewardCardText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rewardCardSubText: {
    color: '#fff',
    fontSize: 14,
  },
  rewardImage: {
    width: 140,
    height: 140,
    borderRadius: 12,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  textOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 12,
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
});