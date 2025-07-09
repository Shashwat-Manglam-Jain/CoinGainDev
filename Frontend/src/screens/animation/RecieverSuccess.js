import { View, Text, StyleSheet } from 'react-native';
import React, { useEffect } from 'react';
import LottieView from 'lottie-react-native';

export default function ReceiverSuccess({ route, navigation }) {
  const {
    amount,
    points: updatePoint,
    senderName,
    receiverUniquecode,
  } = route.params || {};

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('UserDashboard');
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* <LottieView
        source={require('../../../assets/success.json')}
        autoPlay
        loop={false}
        style={styles.animation}
      />
      <Text style={styles.successText}>Successfully Received </Text>

      <View style={styles.infoContainer}>
        {amount ? (
          <Text style={styles.infoText}>₹{amount} Paid</Text>
        ) : null}

        <Text style={[styles.infoText, styles.pointsText]}>
          +{updatePoint} Points
        </Text>
        <Text style={styles.infoText}>From: {senderName}</Text>
        <Text style={styles.infoText}>To You: {receiverUniquecode}</Text>
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: 250,
    height: 250,
  },
  successText: {
    fontSize: 26,
    color: '#2ecc71',
    marginTop: 20,
    fontWeight: 'bold',
  },
  infoContainer: {
    marginTop: 25,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 17,
    color: '#333',
    marginVertical: 6,
  },
  pointsText: {
    color: '#e74c3c',
    fontSize: 30,
    fontWeight: 'bold',
  },
});
