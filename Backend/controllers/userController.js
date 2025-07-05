const User = require('../models/User');
const Redemption = require('../models/Redemption');
const Notification = require('../models/Notification');
const {  sendApproveToAdmin} = require('../socket');
// Get user by ID
const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await User.findById(id);

    if (!data) {
      console.log('Error in finding user!');
      return res.status(404).json({ message: 'Error in finding user!' });
    }

    console.log('Successfully found user and sent to frontend.');
    res.status(200).json(data);
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user by ID
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body; // Expect the full user object or partial updates

    if (!id || !updateData) {
      return res.status(400).json({ message: 'Missing user ID or update data' });
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      console.log('User not found!');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User updated successfully.');
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const postRedemptionData = async (req, res) => {
  try {
    const { userid, redemption, adminId } = req.body;

    if (
      !userid ||
      !redemption ||
      !redemption.rewardId?._id ||
      !redemption.redeemedAt ||
      !redemption.status ||
      !redemption.pointsRequired
    ) {
      return res.status(400).json({ message: 'Invalid redemption data' });
    }

    // Deduct points from user
    const user = await User.findById(userid);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.points < redemption.pointsRequired) {
      return res.status(400).json({ message: 'Insufficient points' });
    }

    user.points -= redemption.pointsRequired;
    await user.save();

    // Create redemption
    const data = await Redemption.create({
      adminId,
      userId: userid,
      rewardId: redemption.rewardId._id,
      redeemedAt: redemption.redeemedAt,
      pointsRequired: redemption.pointsRequired,
      status: redemption.status,
    });

    const payload = {
      _id: data._id,
      adminId,
      userId: data.userId,
      rewardId: {
        _id: redemption.rewardId._id,
        name: redemption.rewardId.name,
        image: redemption.rewardId.image,
      },
      redeemedAt: data.redeemedAt,
      status: data.status,
    };

    sendApproveToAdmin(adminId.toString(), { redemption: payload });

    res.status(200).json({ redemption: payload });
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Get redemption data for a user
const getRedemptionsData = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await Redemption.find({ userId: id }).populate('rewardId', 'name image');

    // Format response to match frontend expectations
    const formattedData = data.map((redemption) => ({
      _id: redemption._id,
      userId: redemption.userId,
      rewardId: {
        _id: redemption.rewardId._id,
        name: redemption.rewardId.name,
        image: redemption.rewardId.image,
      },
      redeemedAt: redemption.redeemedAt,
      status: redemption.status,
    }));

    console.log('Successfully retrieved redemption data');
    res.status(200).json(formattedData|| []);
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// Get notifications for a user
const getNotifications = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await Notification.find({ userId: id });

    console.log('Successfully retrieved notification data');

    res.status(200).json(data || []);
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Post a notification
const postNotification = async (req, res) => {
  try {
    const { userid, message } = req.body;

    if (!userid || !message) {
      console.log('Invalid notification data');
      return res.status(400).json({ message: 'Invalid notification data' });
    }

    const data = await Notification.create({
      message,
      userId: userid,
      createdAt: new Date().toISOString(),
      read: false,
    });

    if (!data) {
      console.log('Error occurred in posting notification');
      return res.status(400).json({ message: 'Error occurred in posting notification' });
    }

    console.log('Successfully posted notification');
    res.status(200).json(data); // Return the created notification
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Fetch admin details
const fetchAdminDetails = async (req, res) => {
  try {
    const { adminId } = req.params;

    const data = await User.findById(adminId);

    if (!data) {
      console.error('Admin not found');
      return res.status(404).json({ message: 'Admin not found' });
    }

    console.log('Admin details fetched successfully');
    return res.status(200).json({
      name: data.name,
      uniqueCode: data.uniqueCode || null,
      mobile:data.mobile 
    });
  } catch (error) {
    console.error('Error occurred:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Notification.findByIdAndDelete(id);
    if (!deleted) {
      console.log('Notification not found');
      return res.status(404).json({ message: 'Notification not found' });
    }
    console.log('Notification deleted successfully');
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark all notifications as read
const markAllNotificationsRead = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      console.log('Missing user ID');
      return res.status(400).json({ message: 'Missing user ID' });
    }
    await Notification.updateMany({ userId }, { read: true });
    console.log('All notifications marked as read');
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete (or cancel) a redemption
const deleteRedemption = async (req, res) => {
  try {
    const { id } = req.params;
    const redemption = await Redemption.findById(id);
    if (!redemption) {
      console.log('Redemption not found');
      return res.status(404).json({ message: 'Redemption not found' });
    }
    if (redemption.status !== 'pending') {
      console.log('Only pending redemptions can be cancelled');
      return res.status(400).json({ message: 'Only pending redemptions can be cancelled' });
    }
    await Redemption.findByIdAndUpdate(id, { status: 'cancelled' });
    console.log('Redemption cancelled successfully');
    res.status(200).json({ message: 'Redemption cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling redemption:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUser,
  updateUser,
  postRedemptionData,
  getRedemptionsData,
  getNotifications,
  postNotification,
  deleteNotification,
  markAllNotificationsRead,
  deleteRedemption,
  fetchAdminDetails,
};
