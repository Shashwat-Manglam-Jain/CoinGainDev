import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Animated, Platform, Dimensions } from 'react-native';
import { useTheme, Button } from 'react-native-paper';
import { ThemeContext } from '../../ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const getUrgency = (expiryDate) => {
  const now = moment();
  const expiry = moment(expiryDate, ['YYYY-MM-DD', 'YYYY-MM', moment.ISO_8601], true);
  const diffDays = expiry.isValid() ? expiry.diff(now, 'days') : -1;
  if (diffDays < 0) return 'expired';
  if (diffDays < 3) return 'high';
  if (diffDays < 7) return 'medium';
  return 'low';
};

const getUrgencyColor = (urgency, isDarkMode) => {
  if (urgency === 'expired') return '#808080';
  if (urgency === 'high') return '#ff4d4d';
  if (urgency === 'medium') return '#ffa500';
  return isDarkMode ? '#00e676' : '#008000';
};

const CountdownTimer = ({ expiry, urgency }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const scaleAnim = useState(new Animated.Value(1))[0];
  const { colors } = useTheme();

  useEffect(() => {
    if (urgency === 'high') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    const interval = setInterval(() => {
      const now = moment();
      const parsedExpiry = moment(expiry, ['YYYY-MM-DD', 'YYYY-MM', moment.ISO_8601], true);
      const effectiveExpiry = parsedExpiry.isValid() && parsedExpiry.date() ? parsedExpiry : parsedExpiry.startOf('month');

      console.log('Expiry:', expiry, 'Parsed:', effectiveExpiry.format(), 'Valid:', parsedExpiry.isValid());

      const duration = moment.duration(effectiveExpiry.diff(now));
      if (duration.asMilliseconds() <= 0) {
        setTimeLeft('Expired');
        clearInterval(interval);
      } else {
        const days = Math.floor(duration.asDays());
        const hours = duration.hours();
        const minutes = duration.minutes();
        const seconds = duration.seconds();
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiry, urgency, scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: urgency === 'high' ? scaleAnim : 1 }], flexDirection: 'row', alignItems: 'center' }}>
      <MaterialIcons name="timer" size={16} color={getUrgencyColor(urgency, colors.background === '#121212')} style={styles.icon} />
      <Text style={[styles.timerText, { color: getUrgencyColor(urgency, colors.background === '#121212') }]}>{timeLeft}</Text>
    </Animated.View>
  );
};

const History = ({ users, rewards, redemptions, navigation,setCurrentTab }) => {
  const { colors } = useTheme();
  const { isDarkMode: contextDarkMode } = useContext(ThemeContext);
  const effectiveDarkMode = contextDarkMode ?? false;
  const history = redemptions || [];
  const [headerAnim] = useState(new Animated.Value(1)); // Initialize headerAnim

  // Calculate total unused points
  const totalUnusedPoints = history.reduce((sum, item) => {
    const urgency = getUrgency(item.expiryMonth);
    if (urgency !== 'expired') {
      return sum + Math.round((item.rewardPercentage / 100) * item.amount);
    }
    return sum;
  }, 0);

  const handleRedeemNow = () => {
    Toast.show({
      type: 'info',
      text1: 'Redirecting',
      text2: 'Navigate to Rewards to redeem your tokens!',
    });
    setCurrentTab("rewards")
    // navigation.navigate('UserDashboard', { screen: 'rewards' });
  };

  if (!history || history.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: effectiveDarkMode ? '#121212' : '#f0f4f8' }]}>
        <MaterialIcons name="history" size={40} color={colors.text} style={styles.emptyIcon} />
        <Text style={[styles.emptyText, { color: colors.text }]}>
          No payment history available.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: effectiveDarkMode ? '#121212' : '#f0f4f8' }]}>
       <View style={styles.titleContainer}>
        <MaterialIcons name="account-balance-wallet" size={28} color={colors.text} style={styles.titleIcon} />
        <Text style={[styles.title, { color: colors.text }]}>Payment History</Text>
      </View>
      <Animated.View style={[styles.headerContainer, { transform: [{ scale: headerAnim }] }]}>
        <View
          style={[styles.headerGradient, { backgroundColor: effectiveDarkMode ? '#6200ee' : '#b388ff' }]}
        >
          <View style={styles.headerContent}>
            <MaterialIcons name="monetization-on" size={32} color="#fff" style={styles.headerIcon} />
            <Text style={styles.headerText}>{totalUnusedPoints} Unused Points</Text>
            <Text style={styles.headerSubText}>Redeem before they expire!</Text>
            <Button
              mode="contained"
              onPress={handleRedeemNow}
              style={styles.redeemButton}
              labelStyle={styles.redeemButtonText}
              icon={() => <MaterialIcons name="redeem" size={16} color="#fff" />}
              buttonColor={"#ff4081"}
            >
              Redeem Now
            </Button>
          </View>
        </View>
      </Animated.View>

     
      <FlatList
        data={history.sort((a, b) => moment(a.expiryMonth).diff(moment(b.expiryMonth)))}
        keyExtractor={(item) => item._id.toString()} // Ensure _id is a string
        renderItem={({ item }) => {
          const urgency = getUrgency(item.expiryMonth);
          const urgencyColor = getUrgencyColor(urgency, effectiveDarkMode);
          const senderName = item.senderId?.name || item.senderId?.uniqueCode || 'Unknown';
          const receiverName = item.receiverId?.name || item.receiverId?.userUniqueCode || 'Unknown';
          const points = Math.round((item.rewardPercentage / 100) * item.amount);

          return (
            <View
              style={[
                styles.card,
                {
                  borderColor: urgencyColor,
                  backgroundColor: effectiveDarkMode ? '#1e1e1e' : '#fff',
                  shadowColor: urgency === 'high' ? '#ff4d4d' : '#000',
                  shadowOpacity: urgency === 'high' ? 0.5 : 0.3,
                  marginVertical:10
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <MaterialIcons name="receipt" size={20} color={urgencyColor} style={styles.icon} />
                  <Text style={[styles.cardTitle, { color: urgencyColor }]}>
                    Invoice #{item.invoice} - ₹{item.amount}
                  </Text>
                </View>
                <Text style={[styles.cardSubtitle, { color: colors.text }]}>
                  {moment(item.createdAt).format('DD MMM YYYY, hh:mm A')}
                </Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardTextContainer}>
                  <MaterialIcons name="monetization-on" size={18} color={colors.text} style={styles.icon} />
                  <Text style={[styles.cardText, { color: colors.text }]}>
                    <Text style={styles.bold}>Points:</Text> {points}
                  </Text>
                </View>
                <View style={styles.cardTextContainer}>
                  <MaterialIcons name="person" size={18} color={colors.text} style={styles.icon} />
                  <Text style={[styles.cardText, { color: colors.text }]}>
                    <Text style={styles.bold}>From:</Text> {senderName} ({item.senderId?.uniqueCode || 'N/A'})
                  </Text>
                </View>
                <View style={styles.cardTextContainer}>
                  <MaterialIcons name="person-outline" size={18} color={colors.text} style={styles.icon} />
                  <Text style={[styles.cardText, { color: colors.text }]}>
                    <Text style={styles.bold}>To:</Text> {receiverName} ({item.receiverId?.userUniqueCode || 'N/A'})
                  </Text>
                </View>
                <View style={styles.cardTextContainer}>
                  <MaterialIcons name="event" size={18} color={urgencyColor} style={styles.icon} />
                  <Text style={[styles.cardText, { color: urgencyColor }]}>
                    <Text style={styles.bold}>Expires:</Text> {moment(item.expiryMonth).format('DD MMM YYYY')}
                  </Text>
                </View>
                <CountdownTimer expiry={item.expiryMonth} urgency={urgency} />
                {urgency === 'high' && (
                  <View style={styles.warningContainer}>
                    <MaterialIcons name="warning" size={20} color="#ff4d4d" style={styles.icon} />
                    <Text style={styles.warningText}>
                      Expiring soon! Redeem your {points} points now!
                    </Text>
                    <Button
                      mode="contained"
                      onPress={handleRedeemNow}
                      style={styles.redeemButton}
                      labelStyle={styles.redeemButtonText}
                      icon={() => <MaterialIcons name="redeem" size={16} color="#fff" />}
                      buttonColor={urgencyColor}
                    >
                      Redeem Now
                    </Button>
                  </View>
                )}
              </View>
            </View>
          );
        }}
        showsVerticalScrollIndicator={!isWeb} // Disable scroll indicator on web for better UX
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 6,
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerGradient: {
    borderRadius: 12,
    padding: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 8,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  titleIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  card: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  cardContent: {
    marginTop: 8,
  },
  cardTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  cardText: {
    fontSize: 16,
    marginLeft: 8,
  },
  bold: {
    fontWeight: '600',
  },
  timerText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  warningText: {
    color: '#ff4d4d',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    minWidth: 150,
  },
  redeemButton: {
    borderRadius: 8,
    paddingVertical: 4,
    marginTop: 8,
  },
  redeemButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color:'white'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  icon: {
    marginRight: 4,
  },
});

export default History;