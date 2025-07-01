const Reward = require('../models/Reward');
const Notification = require('../models/Notification');
const Redemption = require('../models/Redemption');

const getRewards = async (req, res) => {
  try {
    const { adminId } = req.params;
    const rewards = await Reward.find({ adminId });
    res.json(rewards);
  } catch (error) {
    console.error('Error fetching rewards:', error);
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }

};

const getNotifications = async (req, res) => {
 try {
    const { adminId } = req.params;
    const notifications = await Notification.find({ adminId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }

};

const getRedemptions = async (req, res) => {
  try {
    const { adminId } = req.params;
    const redemptions = await Redemption.find({ adminId }).sort({ createdAt: -1 });
    res.json(redemptions);
  } catch (error) {
    console.error('Error fetching redemptions:', error);
    res.status(500).json({ error: 'Failed to fetch redemptions' });
  }
};

module.exports = {
  getRewards,
  getNotifications,
  getRedemptions,
};
