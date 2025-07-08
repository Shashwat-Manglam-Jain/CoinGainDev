import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Animated, Platform, Dimensions } from 'react-native';
import { useTheme, Button } from 'react-native-paper';
import { ThemeContext } from '../../ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';
let momentTz;
try {
  momentTz = require('moment-timezone');
} catch (e) {
  console.warn('moment-timezone not found, falling back to moment');
  momentTz = moment;
}
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const getUrgency = (expiryDate, status) => {
  if (status === 'expired') {
    console.log(`getUrgency: Status is expired`);
    return 'expired';
  }
  if (!expiryDate) {
    console.log(`getUrgency: Invalid or missing expiry date: ${expiryDate}`);
    return 'expired';
  }
  const now = momentTz.tz ? momentTz.tz('Asia/Kolkata') : moment();
  const expiry = momentTz.tz
    ? momentTz.tz(expiryDate, ['YYYY-MM-DD', 'YYYY-MM', moment.ISO_8601], 'Asia/Kolkata')
    : moment(expiryDate, ['YYYY-MM-DD', 'YYYY-MM', moment.ISO_8601]);
  if (!expiry.isValid()) {
    console.log(`getUrgency: Invalid expiry date: ${JSON.stringify(expiryDate)}`);
    return 'expired';
  }
  const effectiveExpiry = expiry.date() ? expiry : expiry.endOf('month');
  const diffDays = effectiveExpiry.diff(now, 'days', true);
  console.log(`getUrgency: Expiry: ${effectiveExpiry.format('YYYY-MM-DD HH:mm:ss Z')}, Diff: ${diffDays.toFixed(2)} days, Now: ${now.format('YYYY-MM-DD HH:mm:ss Z')}`);
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

const CountdownTimer = ({ expiry, urgency, points, paymentId }) => {
  const [timeLeft, setTimeLeft] = useState('Calculating...');
  const scaleAnim = useState(new Animated.Value(1))[0];
  const { colors } = useTheme();

  useEffect(() => {
    console.log(`CountdownTimer [${paymentId}]: Rendering with urgency: ${urgency}`);

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
      const now = momentTz.tz ? momentTz.tz('Asia/Kolkata') : moment();
      const parsedExpiry = momentTz.tz
        ? momentTz.tz(expiry, ['YYYY-MM-DD', 'YYYY-MM', moment.ISO_8601], 'Asia/Kolkata')
        : moment(expiry, ['YYYY-MM-DD', 'YYYY-MM', moment.ISO_8601]);
      const effectiveExpiry = parsedExpiry.isValid() && parsedExpiry.date() ? parsedExpiry : parsedExpiry.endOf('month');

      console.log(`CountdownTimer [${paymentId}]: Expiry: ${JSON.stringify(expiry)}, Parsed: ${effectiveExpiry.format('YYYY-MM-DD HH:mm:ss Z')}, Valid: ${parsedExpiry.isValid()}`);

      if (!parsedExpiry.isValid()) {
        setTimeLeft('Invalid Date');
        clearInterval(interval);
        return;
      }

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
  }, [expiry, urgency, scaleAnim, paymentId]);

  return (
    <Animated.View style={{ transform: [{ scale: urgency === 'high' ? scaleAnim : 1 }], flexDirection: 'row', alignItems: 'center' }}>
      <MaterialIcons
        name={timeLeft === 'Invalid Date' ? 'timer-off' : 'timer'}
        size={16}
        color={getUrgencyColor(urgency, colors.background === '#121212')}
        style={styles.icon}
      />
      <Text style={[styles.timerText, { color: getUrgencyColor(urgency, colors.background === '#121212') }]}>
        {timeLeft}
      </Text>
    </Animated.View>
  );
};

const History = ({ users, rewards, redemptions, setCurrentTab }) => {
  const { colors } = useTheme();
  const { isDarkMode: contextDarkMode } = useContext(ThemeContext);
  const effectiveDarkMode = contextDarkMode ?? false;
  const history = useMemo(() => {
    const validHistory = Array.isArray(redemptions) ? redemptions.filter(item => item && item._id) : [];
    return validHistory.sort((a, b) => moment(a.expiryMonth).diff(moment(b.expiryMonth)));
  }, [redemptions]);

  const totalUnusedPoints = history.reduce((sum, item) => {
    if (item.status === 'valid') {
      return sum + (item.remainingPointsToDeduct !== null ? item.remainingPointsToDeduct : Math.round((item.rewardPercentage / 100) * item.amount));
    }
    return sum;
  }, 0);

  const handleRedeemNow = useCallback(() => {
    console.log('handleRedeemNow: Triggered');
    Toast.show({
      type: 'info',
      text1: 'Redirecting',
      text2: 'Navigate to Rewards to redeem your tokens!',
    });
    setCurrentTab('rewards');
  }, [setCurrentTab]);

  console.log('History: Rendering with redemptions:', JSON.stringify(history, null, 2));

  if (!history.length) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: effectiveDarkMode ? '#121212' : '#f0f4f8' }]}>
        <MaterialIcons name="history" size={40} color={colors.text} style={styles.emptyIcon} />
        <Text style={[styles.emptyText, { color: colors.text }]}>No payment history available.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: effectiveDarkMode ? '#121212' : '#f0f4f8' }]}>
      <View style={styles.titleContainer}>
        <MaterialIcons name="account-balance-wallet" size={28} color={colors.text} style={styles.titleIcon} />
        <Text style={[styles.title, { color: colors.text }]}>Payment History</Text>
      </View>
      <Animated.View style={[styles.headerContainer, { transform: [{ scale: useState(new Animated.Value(1))[0] }] }]}>
        <View style={[styles.headerGradient, { backgroundColor: effectiveDarkMode ? '#6200ee' : '#b388ff' }]}>
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
              buttonColor="#ff4081"
            >
              Redeem Now
            </Button>
          </View>
        </View>
      </Animated.View>
      <FlatList
        data={history}
        keyExtractor={(item) => {
          console.log(`keyExtractor: ID: ${item._id}`);
          return item._id.toString();
        }}
        renderItem={({ item }) => {
          console.log(`renderItem: Processing ID: ${item._id}`);
          try {
            const urgency = getUrgency(item.expiryMonth, item.status);
            const urgencyColor = getUrgencyColor(urgency, effectiveDarkMode);
            const senderName = item.senderId?.name || item.senderId?.uniqueCode || 'Unknown';
            const receiverName = item.receiverId?.name || item.receiverId?.userUniqueCode || 'Unknown';
            const totalPoints = Math.round((item.rewardPercentage / 100) * item.amount);
            const points = item.remainingPointsToDeduct !== null ? item.remainingPointsToDeduct : totalPoints;

            console.log(`Payment ID: ${item._id}, Status: ${item.status}, Urgency: ${urgency}, Points: ${points}, Expiry: ${JSON.stringify(item.expiryMonth)}`);

            return (
              <View
                style={[
                  styles.card,
                  {
                    borderColor: urgencyColor,
                    backgroundColor: effectiveDarkMode ? '#1e1e1e' : '#fff',
                    shadowColor: urgency === 'high' ? '#ff4d4d' : '#000',
                    shadowOpacity: urgency === 'high' ? 0.5 : 0.3,
                    marginVertical: 10,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleContainer}>
                    <MaterialIcons name="receipt" size={20} color={urgencyColor} style={styles.icon} />
                    <Text style={[styles.cardTitle, { color: urgencyColor }]}>Invoice #{item.invoice} - ₹{item.amount}</Text>
                  </View>
                  <Text style={[styles.cardSubtitle, { color: colors.text }]}>
                    {moment(item.createdAt).isValid() ? moment(item.createdAt).format('DD MMM YYYY, hh:mm A') : 'Invalid Date'}
                  </Text>
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.cardTextContainer}>
                    <MaterialIcons name="monetization-on" size={18} color={colors.text} style={styles.icon} />
                    <Text style={[styles.cardText, { color: colors.text }]}>
                      <Text style={styles.bold}>Points:</Text> {points} {item.remainingPointsToDeduct !== null && `(of ${totalPoints})`}
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
                      <Text style={styles.bold}>Expires:</Text> {moment(item.expiryMonth).isValid() ? moment(item.expiryMonth).format('DD MMM YYYY') : 'Invalid Date'}
                    </Text>
                  </View>
                  <View style={styles.cardTextContainer}>
                    <MaterialIcons name="info" size={18} color={urgencyColor} style={styles.icon} />
                    <Text style={[styles.cardText, { color: urgencyColor }]}>
                      <Text style={styles.bold}>Status:</Text> {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown'}
                    </Text>
                  </View>
                  {item.status === 'valid' ? (
                    <CountdownTimer expiry={item.expiryMonth} urgency={urgency} points={points} paymentId={item._id} />
                  ) : (
                    <View style={styles.warningContainer}>
                      <MaterialIcons name="block" size={20} color={urgencyColor} style={styles.icon} />
                      <Text style={[styles.warningText, { color: urgencyColor }]}>This payment has expired.</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          } catch (error) {
            console.error(`renderItem error for ID: ${item._id}`, error);
            return (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error rendering payment: {error.message}</Text>
              </View>
            );
          }
        }}
        showsVerticalScrollIndicator={!isWeb}
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
    color: 'white',
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
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffe6e6',
    borderRadius: 8,
    marginVertical: 10,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 14,
  },
});

export default History;