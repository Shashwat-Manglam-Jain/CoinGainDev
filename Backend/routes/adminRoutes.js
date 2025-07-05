const express = require('express');
const router = express.Router();
const {
  getAllAdmins,
  getAllUsers,
  updateUser,
  deleteUser,
  sendToken,
  addReward,
  deleteReward,
  deleteAllNotification,
  deleteNotification,
  approveRedemption,
  rejectRedemption,
  editReward,
  getRewards,
  getNotifications,
  getRedemptions,
  makepayment,
  fetchInvoice,
  updateAdmin,
  getAdminRelatedPayments
} = require('../controllers/adminController');

const verifyToken = require('../middleware/verifyToken');

// GET - Fetch all admins
router.get('/admins', getAllAdmins);

// GET - Fetch users created by a specific admin
router.get('/admin/:adminId', verifyToken, getAllUsers);

// PUT - Update a specific user
router.put('/user/:id', verifyToken, updateUser);

// DELETE - Delete a specific user
router.delete('/user/:id', verifyToken, deleteUser);

// POST - Send tokens to a user
router.post('/user/:id/addcoin', verifyToken, sendToken);


router.get('/rewards/:adminId', verifyToken, getRewards);

router.get('/redemptions/:adminId', getRedemptions);



// POST - Add a new reward for admin
router.post('/admin/reward/:adminId', verifyToken, addReward);

router.put('/admin/reward/:rewardId', verifyToken, editReward);

// DELETE - Delete a reward
router.delete('/admin/reward/:rewardId', verifyToken, deleteReward);

// PUT - Approve a redemption
router.put('/redemption/:id/approve', verifyToken, approveRedemption);

// PUT - Reject a redemption
router.put('/redemption/:id/reject', verifyToken, rejectRedemption);


router.put('/updateAdmin/:id', updateAdmin);

router.post('/makepayment',makepayment)
router.post('/fetchInvoice',verifyToken,fetchInvoice)


router.get('/getAdminRelatedPayments/:adminId',getAdminRelatedPayments);

module.exports = router;
