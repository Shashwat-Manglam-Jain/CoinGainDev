const User = require("../models/User");
const bcrypt =require( 'bcryptjs');
const Superadmin = require("../models/Superadmin");



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


const createSuperadmin = async (req, res) => {
  try {
    const { name, mobile, password, plainPassword, location } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new Superadmin document
    const superadmin = new Superadmin({
      name,
      mobile,
      password: hashedPassword,
      plainPassword,
      location,
    });

    await superadmin.save();

    res.status(201).json({
      message: 'Superadmin created successfully',
      superadmin: {
        id: superadmin._id,
        name: superadmin.name,
        mobile: superadmin.mobile,
        role: superadmin.role,
        location: superadmin.location,
      },
    });
  } catch (error) {
    console.error('Error creating superadmin:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

const getSuperAdmins = async (req, res) => {
  try {
    const superadmin = await Superadmin.findOne(); // just one

    if (!superadmin) {
      return res.status(404).json({ message: 'Superadmin not found' });
    }

    res.status(200).json({
      message: 'Superadmin fetched successfully',
      superadmin,
    });
  } catch (error) {
    console.error('Error fetching superadmin:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};


const updateSuperAdmin = async (req, res) => {
  try {
    const { id } = req.params; 
    const { name, mobile, location } = req.body; 

    if (!name && !mobile && !location) {
      return res.status(400).json({ message: 'No fields provided for update' });
    }

    const updated = await Superadmin.findByIdAndUpdate(
      id,
      { $set: { name, mobile, location } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'SuperAdmin not found' });
    }

    res.status(200).json({
      message: 'SuperAdmin updated successfully',
      superadmin: {
        id: updated._id,
        name: updated.name,
        mobile: updated.mobile,
        location: updated.location,
        role: updated.role,
      },
    });
  } catch (error) {
    console.error('Error updating SuperAdmin:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { handleApproveAdmin ,handleToggleAdminStatus, createSuperadmin,getSuperAdmins, updateSuperAdmin};
