const express = require('express');
const router = express.Router();
const { handleApproveAdmin, handleToggleAdminStatus } = require('../controllers/superAdminController');

router.put('/approveAdmin/:id', handleApproveAdmin);
router.put('/toggleAdmin/:adminId/:status', handleToggleAdminStatus);

module.exports = router;  
