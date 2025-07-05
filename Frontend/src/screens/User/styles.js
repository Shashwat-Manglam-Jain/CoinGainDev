
import { StyleSheet, Dimensions, Platform, Text } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 50;
const CARD_HEIGHT = 280;

export const ButtonText = ({ children, style }) => (
  <Text
    style={[
      {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
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

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    width: '100%',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  toggle: {
    marginRight: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: 'white',
  },
  tabIconContainer: {
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#FF4081',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
  },
  tabContent: {
    paddingBottom: 20,
  },
  card: {
    marginVertical: 12,
    borderRadius: 16,
    elevation: 8,
    padding: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 18,
    marginVertical: 6,
    fontWeight: '500',
    lineHeight: 24,
  },
  sliderContainer: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginVertical: 15,
    textAlign: 'center',
  },
  carousel: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  carouselItem: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    justifyContent: 'flex-end',
    padding: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    marginRight: 10,
  },
  carouselImage: {
    borderRadius: 16,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  textOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderRadius: 12,
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  carouselText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  carouselSubText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 4,
  },
  searchBar: {
    marginBottom: 20,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    height: 50,
  },
  rewardCard: {
    marginVertical: 12,
    borderRadius: 16,
    elevation: 8,
    padding: 16,
  },
  rewardImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 12,
  },
  rewardName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  rewardDetails: {
    fontSize: 16,
    marginBottom: 12,
    opacity: 0.8,
  },
  progressContainer: {
    marginVertical: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  progressBar: {
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
  },
  progressText: {
    fontSize: 16,
    marginTop: 6,
    fontWeight: '500',
  },
  rewardAchieved: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  remainingPoints: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  redeemButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  notificationText: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 24,
  },
  notificationDate: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 6,
  },
  clearButton: {
    marginLeft: 10,
  },
  rewardHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  markAllReadButton: {
    borderRadius: 8,
    paddingVertical: 6,
  },
  historyItem: {
    marginVertical: 10,
    borderRadius: 12,
    elevation: 6,
    padding: 16,
  },
  historyImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginBottom: 10,
  },
  historyName: {
    fontSize: 18,
    fontWeight: '600',
  },
  historyDetails: {
    fontSize: 14,
    marginVertical: 6,
    opacity: 0.8,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 18,
    marginVertical: 15,
    fontWeight: '500',
    opacity: 0.7,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modal: {
    width: 340,
    padding: 20,
    borderRadius: 16,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
    gap: 12,
  },
  statContainer: {
    marginVertical: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  statIcon: {
    marginRight: 12,
  },
});
