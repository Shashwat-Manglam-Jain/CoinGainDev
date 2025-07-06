import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

export default function SuccessScreen({ route, navigation }) {
  const { amount, points, receiverUniquecode, senderName } = route.params || {};

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('AdminDashboard');
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../../assets/success.json')}
        autoPlay
        loop={false}
        style={styles.animation}
      />
      <Text style={styles.successText}>Payment Successful!</Text>

      <View style={styles.infoContainer}>
        {amount ? (
          <Text style={styles.infoText}>₹{amount} Items Purchased</Text>
        ) : null}

        <Text style={[styles.infoText, { color: 'red', fontSize: 25, fontWeight: 'bold' }]}>
          {points} Points Transferred
        </Text>
        <Text style={styles.infoText}>From: {senderName}</Text>
        <Text style={styles.infoText}>To: {receiverUniquecode}</Text>
      </View>
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
    fontSize: 28,
    color: 'green',
    marginTop: 20,
    fontWeight: 'bold',
  },
  infoContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginVertical: 4,
  },
});
