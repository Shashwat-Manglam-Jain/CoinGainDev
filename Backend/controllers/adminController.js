const User = require('../models/User');
const Reward = require('../models/Reward');
const Notification = require('../models/Notification');
const Redemption = require('../models/Redemption');
const PaymentHistory=require('../models/paymentHistory');
const { sendNotificationToUser, approveRedemptionByAdmin, disapproveRedemptionByAdmin } = require('../socket');
//  Get all admins
const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' });
    res.status(200).json({ admins });
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




const approveRedemption = async (req, res) => {
  try {
    const redemption = await Redemption.findById(req.params.id);
    if (!redemption) return res.status(404).json({ error: 'Redemption not found' });
    if (redemption.status === 'approved') return res.status(400).json({ message: 'Already approved' });

    const user = await User.findById(redemption.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let pointsToDeduct = redemption.pointsRequired;

    // Step 1: Try deducting from remainingPointsToDeduct first
    const paymentsWithRemainder = await PaymentHistory.find({
      receiverId: redemption.userId,
      remainingPointsToDeduct: { $gt: 0 },
      status: 'valid',
    }).sort({ expiryMonth: 1 });

    for (const payment of paymentsWithRemainder) {
      if (pointsToDeduct <= 0) break;

      const available = payment.remainingPointsToDeduct;

      if (pointsToDeduct >= available) {
        pointsToDeduct -= available;
        payment.remainingPointsToDeduct = null;
        payment.status = 'expired';
      } else {
        payment.remainingPointsToDeduct = available - pointsToDeduct;
        pointsToDeduct = 0;
      }

      await payment.save();
    }

    // Step 2: If still points left, deduct from unused payments
    if (pointsToDeduct > 0) {
      const newPayments = await PaymentHistory.find({
        receiverId: redemption.userId,
        status: 'valid',
        remainingPointsToDeduct: null, // not partially used before
      }).sort({ expiryMonth: 1 });

      for (const payment of newPayments) {
        if (pointsToDeduct <= 0) break;

        const percent = payment.rewardPercentage || 0;
        const rewardPoints = Math.floor((payment.amount * percent) / 100);

        if (pointsToDeduct >= rewardPoints) {
          pointsToDeduct -= rewardPoints;
          payment.status = 'expired';
          payment.remainingPointsToDeduct = null;
        } else {
          payment.remainingPointsToDeduct = rewardPoints - pointsToDeduct;
          pointsToDeduct = 0;
        }

        await payment.save();
      }
    }

    if (pointsToDeduct > 0) {
      return res.status(400).json({ message: 'Not enough available reward points' });
    }

    // Step 3: Deduct from user's points balance
    user.points = Math.max(0, user.points - redemption.pointsRequired);
    await user.save();

    redemption.status = 'approved';
    await redemption.save();

    return res.status(200).json({ message: 'Redemption approved', redemption });
  } catch (err) {
    console.error('Redemption error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Reject a redemption request
const rejectRedemption = async (req, res) => {
  try {
    const redemption = await Redemption.findById(req.params.id);

    if (!redemption) {
      return res.status(404).json({ error: 'Redemption not found' });
    }

    if (redemption.status === 'rejected') {
      return res.status(400).json({ message: 'Redemption is already rejected' });
    }

    const originalStatus = redemption.status;
    redemption.status = 'rejected';
    await redemption.save();

    disapproveRedemptionByAdmin(redemption.userId.toString(), { redemption });

    if (originalStatus !== 'rejected') {
      const user = await User.findById(redemption.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const pointsToRefund = redemption.pointsRequired || 0;
      user.points += pointsToRefund;
      await user.save();

      return res.status(200).json({
        message: 'Redemption rejected and user refunded points',
        redemption,
        refundedPoints: pointsToRefund,
      });
    }

    res.status(200).json({ message: 'Redemption rejected', redemption });
  } catch (err) {
    console.error('Reject redemption error:', err);
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


const getRedemptions = async (req, res) => {
  try {
    const { adminId } = req.params;


    const redemptions = await Redemption.find({ adminId })
      .sort({ createdAt: -1 })
      .populate('userId rewardId');

    res.status(200).json(redemptions);
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
      expiryMonth,
      senderId,
      receiverUniquecode
    } = req.body;

    const [numStr, unit] = expiryMonth.trim().split(" ");
    const num = parseInt(numStr);
    if (isNaN(num) || unit.toLowerCase() !== "months") {
      return res.status(400).json({ error: "Invalid expiryMonth format. Use format like '3 months'" });
    }

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + num);

    const receiver = await User.findOne({ userUniqueCode: receiverUniquecode });
    if (!receiver) return res.status(404).json({ error: "Receiver not found" });

    const updatePoint = Math.round((rewardPercentage / 100) * amount);
    receiver.points = (receiver.points || 0) + updatePoint;
    await receiver.save();

    const paymentData = await PaymentHistory.create({
      invoice,
      amount,
      rewardPercentage,
      expiryMonth: expiryDate,
      senderId,
      receiverId: receiver._id
    });

    const admindata = await User.findById(senderId);
    if (!admindata) return res.status(404).json({ error: "Sender ID not found" });

    await Notification.create({
      message: `Transferred ${updatePoint} points from ${admindata.name}`,
      userId: receiver._id,
    });

    if (!Array.isArray(admindata.paymentHistory)) {
      admindata.paymentHistory = [];
    }
    admindata.paymentHistory.push(paymentData._id);
    await admindata.save();

    sendNotificationToUser(receiver._id.toString(), {
      type: "payment",
      message: `You received ${updatePoint} points from ${admindata.name}`,
      amount,
      points: updatePoint,
      senderName: admindata.name,
    });

    res.status(200).json({
      message: "Payment recorded successfully",
      payment: paymentData
    });
  } catch (error) {
    console.error("Payment error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ error: "Duplicate invoice number" });
    }
    res.status(500).json({ error: "Something went wrong" });
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

const updateAdmin = async (req, res) => {
  try {
    const { adminId, name, phoneno } = req.body;
console.log(adminId, name, phoneno);

    // Validate inputs
    if (!adminId) {
      return res.status(400).json({ error: 'Admin ID is required' });
    }
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required and cannot be empty' });
    }
    if (!phoneno || !/^\d{10}$/.test(phoneno)) {
      return res.status(400).json({ error: 'Phone number must be a valid 10-digit number' });
    }

    // Find admin by ID and role
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Apply updates
    admin.name = name.trim();
    admin.mobile = phoneno;

    // Save only if changes were made
    if (admin.isModified()) {
      await admin.save();
    }

    // Return minimal admin data
    res.status(200).json({
      message: 'Admin updated successfully',
      admin: {
        _id: admin._id,
        name: admin.name,
        mobile: admin.mobile,
        role: admin.role,
        uniqueCode: admin.uniqueCode,
      },
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ error: 'Failed to update admin due to server error' });
  }
};

const getAdminRelatedPayments = async (req, res) => {
  try {
    const { adminId } = req.params;

    const payments = await PaymentHistory.find({
      $or: [{ senderId: adminId }, { receiverId: adminId }],
    })
      .populate('senderId')
      .populate('receiverId');

    res.status(200).json({
      message: 'All payments related to admin',
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    if (!adminId) {
      return res.status(400).json({ message: 'adminId not found. Please login.' });
    }

    const data = await User.findById(adminId);

    if (!data) {
      return res.status(404).json({ message: 'Admin not found.' });
    }

    res.status(200).json({ data });
  } catch (error) {
    console.error('Error fetching admin:', error.message);
    res.status(500).json({ message: 'Server error. Please try again later.' });
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
  approveRedemption,
  rejectRedemption,
   getRewards,
  getRedemptions,
  makepayment,
  fetchInvoice,
  updateAdmin,
  getAdminRelatedPayments ,
  getAdmin
};
