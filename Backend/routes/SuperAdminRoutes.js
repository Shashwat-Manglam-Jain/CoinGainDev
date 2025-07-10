const express = require('express');
const router = express.Router();
const { handleApproveAdmin, handleToggleAdminStatus, createSuperadmin, getSuperAdmins, updateSuperAdmin } = require('../controllers/superAdminController');

router.put('/approveAdmin/:id', handleApproveAdmin);
router.put('/toggleAdmin/:adminId/:status', handleToggleAdminStatus);
router.post('/createSuperAdmin', createSuperadmin);
router.get('/getSuperAdmin', getSuperAdmins);
router.put('/update/:id',  updateSuperAdmin);
module.exports = router;  
