const User = require('../models/User');
const Reward = require('../models/Reward');
const Notification = require('../models/Notification');
const Redemption = require('../models/Redemption');
const PaymentHistory=require('../models/paymentHistory')
//  Get all admins
const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id name mobile uniqueCode');
    res.json({ admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ message: 'Server error fetching admins' });
  }
};

//  Get all users for a specific admin
const getAllUsers = async (req, res) => {
  try {
    const { adminId } = req.params;

    if (req.user.role !== 'admin' || String(req.user.userId) !== adminId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const users = await User.find({ adminId }).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

//  Update user details
const updateUser = async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

//  Delete a user
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

//  Send token/points to user
const sendToken = async (req, res) => {
  try {
    const { amount } = req.body;
   
    
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.points = (user.points || 0) + parseInt(amount);
    await user.save();

    res.json({ message: 'Tokens added', points: user.points });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send tokens' });
  }
};

//  Add a new reward
const addReward = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { name, price, pointsRequired, image } = req.body;

    if (!name || !price || !pointsRequired || !image) {
      return res.status(400).json({ error: 'All reward fields are required' });
    }

    const reward = new Reward({
      adminId,
      name,
      price,
      pointsRequired,
      image,
    });

    const savedReward = await reward.save();
    res.status(201).json(savedReward);
  } catch (error) {
    console.error('Error adding reward:', error);
    res.status(500).json({ error: 'Server error while adding reward' });
  }
};


const editReward=async (req, res) => {
  try {
    const { name, price, pointsRequired, image } = req.body;
    const { rewardId } = req.params;

    const updatedReward = await Reward.findByIdAndUpdate(
      rewardId,
      { name, price, pointsRequired, image },
      { new: true }
    );

    if (!updatedReward) {
      return res.status(404).json({ error: 'Reward not found' });
    }

    res.json(updatedReward);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update reward' });
  }
};

//  Delete a reward
const deleteReward = async (req, res) => {
  try {
    const { rewardId } = req.params;
    await Reward.findByIdAndDelete(rewardId);
    res.json({ message: 'Reward deleted' });
  } catch (err) {
    console.error('Error deleting reward:', err);
    res.status(500).json({ error: 'Failed to delete reward' });
  }
};


//  Delete a single notification
const deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

//  Delete all notifications for logged-in user
const deleteAllNotification = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.userId });
    res.json({ message: 'All notifications cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete all notifications' });
  }
};

//  Approve a redemption request
const approveRedemption = async (req, res) => {
  try {
    const updated = await Redemption.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve redemption' });
  }
};

//  Reject a redemption request
const rejectRedemption = async (req, res) => {
  try {
    const updated = await Redemption.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject redemption' });
  }
};



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

const makepayment = async (req, res) => {
  try {
    const {
      invoice,
      amount,
      rewardPercentage,
      expiryMonth, // expects a string like "3 months"
      senderId,
      receiverUniquecode
    } = req.body;

    // Validate expiryMonth format (e.g., "3 months")
    const [numStr, unit] = expiryMonth.split(" ");
    const num = parseInt(numStr);
    if (isNaN(num) || unit !== "months") {
      return res.status(400).json({ error: "Invalid expiryMonth format. Use format like '3 months'" });
    }

    // Calculate expiry date from today
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + num); // Add N months

    // Find receiver
    const receiver = await User.findOne({ userUniqueCode: receiverUniquecode });
    if (!receiver) {
      console.log("No receiver found with unique code mentioned");
      return res.status(404).json({ error: "Receiver not found with provided unique code" });
    }

    // Create payment history entry
    const paymentData = await PaymentHistory.create({
      invoice,
      amount,
      rewardPercentage,
      expiryMonth: expiryDate, // now a Date object
      senderId,
      receiverId: receiver._id
    });

    // Find sender/admin
    const admindata = await User.findById(senderId);
    if (!admindata) {
      console.log("No sender ID found, check it");
      return res.status(404).json({ error: "Sender ID not found" });
    }

    // Ensure paymentHistory array exists
    if (!admindata.paymentHistory) {
      admindata.paymentHistory = [];
    }

    // Add payment record to sender's history
    admindata.paymentHistory.push(paymentData._id);
    await admindata.save();

    // Done
    res.status(200).json({ message: "Payment recorded successfully", payment: paymentData });
  } catch (error) {
    console.error("Payment error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ error: "Duplicate invoice number" });
    }
    res.status(500).json({ error: "Something went wrong while making payment" });
  }
};


const fetchInvoice = async (req, res) => {
  try {
    const { adminId } = req.body;
    const admin = await User.findById(adminId);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const invoiceCount = admin.paymentHistory.length;
    res.status(200).json({ invoiceCount });
  } catch (error) {
    console.error('Fetch invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


//  Export all functions
module.exports = {
  getAllAdmins,
  getAllUsers,
  updateUser,
  deleteUser,
  sendToken,
  addReward,
  editReward,
  deleteReward,
  deleteNotification,
  deleteAllNotification,
  approveRedemption,
  rejectRedemption,
   getRewards,
  getNotifications,
  getRedemptions,
  makepayment,
  fetchInvoice
};
