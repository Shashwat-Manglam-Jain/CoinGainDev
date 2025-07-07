const User = require("../models/User");

const handleApproveAdmin = async (req, res) => {
  try {
    const { id: adminId } = req.params;

    if (!adminId) {
        console.log('Missing adminId in URL');
        
      return res.status(400).json({ message: 'Missing adminId in URL' });
    }

    const user = await User.findById(adminId);

    if (!user) {
        console.log('Admin data not found');
        
      return res.status(404).json({ message: 'Admin data not found' });
    }

    user.validate = true;
    await user.save();
 
    res.status(200).json({ message: 'Admin approved successfully', user });
  } catch (error) {
    console.error('Error approving admin:', error);
    res.status(500).json({ message: 'Server error while approving admin' });
  }
};

const handleToggleAdminStatus = async (req, res) => {
  try {
    const { adminId, status } = req.params;

    if (!adminId || !status) {
      return res.status(400).json({ message: 'Missing adminId or status in URL' });
    }

    const user = await User.findById(adminId);

    if (!user) {
      return res.status(404).json({ message: 'Admin data not found' });
    }

    // Toggle status
    user.validate = status === 'approved' ? true : false;
    await user.save();

    res.status(200).json({
      message: `Admin ${status === 'approved' ? 'approved' : 'disapproved'} successfully`,
      user,
    });
  } catch (error) {
    console.error('Error toggling admin status:', error);
    res.status(500).json({ message: 'Server error while updating admin status' });
  }
};

module.exports = { handleApproveAdmin ,handleToggleAdminStatus};
