const User = require('../models/User');
const Redemption = require('../models/Redemption');
const Notification = require('../models/Notification');

// Get user by ID
const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await User.findById(id);

    if (!data) {
      console.log('Error in finding user!');
      return res.status(404).json({ message: 'Error in finding user!' });
    }

    console.log("Successfully found user and sent to frontend.");
    res.status(200).json(data);
  } catch (error) {
    console.log('Error occurred:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Post a redemption request
const postRedemeData = async (req, res) => {
  try {
    const { userid, rewardid } = req.body;

    const data = await Redemption.create({
      userId: userid,
      rewardId: rewardid,
    });

    if (!data) {
      console.log('Error occurred in posting redemption request');
      return res.status(400).json({ message: 'Error occurred in posting redemption request' });
    }

    console.log("Successfully posted redemption data");
    res.status(200).json({ message: 'Successfully posted redemption data' });
  } catch (error) {
    console.log('Error occurred:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get redemption data for a user
const getRedemptionsdata = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await Redemption.find({ userId: id });

    if (!data || data.length === 0) {
      console.log('No redemption data found');
      return res.status(404).json({ message: 'No redemption data found' });
    }

    console.log("Successfully retrieved redemption data");
    res.status(200).json(data);
  } catch (error) {
    console.log('Error occurred:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get notifications for a user
const getNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await Notification.find({ userId: id });

    if (!data || data.length === 0) {
      console.log('No notification data found');
      return res.status(404).json({ message: 'No notification data found' });
    }

    console.log("Successfully retrieved notification data");
    res.status(200).json(data);
  } catch (error) {
    console.log('Error occurred:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Post a notification
const postNotification = async (req, res) => {
  try {
    const { userid, message } = req.body;

    const data = await Notification.create({
      message,
      userId: userid,
    });

    if (!data) {
      console.log('Error occurred in posting notification');
      return res.status(400).json({ message: 'Error occurred in posting notification' });
    }

    console.log("Successfully posted notification");
    res.status(200).json({ message: 'Successfully posted notification' });
  } catch (error) {
    console.log('Error occurred:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const fetchadmindetails = async (req, res) => {
  try {
    const { adminId } = req.params;

    const data = await User.findById(adminId);

    if (!data) {
      console.error('Admin not found');
      return res.status(404).json({ message: 'Admin not found' });
    }

    console.log('Admin details fetched successfully');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error occurred:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUser,
  postRedemeData,
  getRedemptionsdata,
  getNotification,
  postNotification,
  fetchadmindetails
};
