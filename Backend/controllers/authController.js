const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const registerUser = async (req, res) => {
  try {
    const { name, mobile, password, location, adminId, role } = req.body;

    if (!name || !mobile || !password || !role) {
      return res.status(400).json({ message: 'Name, mobile, password, and role are required' });
    }

    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ message: 'Mobile number already registered' });
    }

    let userUniqueCode;
    let assignedAdmin;

    // Handle user role logic
    if (role === 'user') {
      if (!adminId) {
        return res.status(400).json({ message: 'Admin ID is required for user registration' });
      }

      const admin = await User.findOne({ _id: adminId, role: 'admin' });
      if (!admin) {
        return res.status(400).json({ message: 'Invalid admin selected' });
      }

      const userCount = await User.countDocuments({ adminId });
      if (admin.userLimit && userCount >= admin.userLimit) {
        return res.status(400).json({ message: 'Admin user limit reached' });
      }

      const newUserNumber = String(userCount + 1).padStart(2, '0');
      userUniqueCode = `${admin.uniqueCode}${newUserNumber}`;
      assignedAdmin = adminId;
    }

    if (role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot create superadmin through this endpoint' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      name,
      mobile,
      password: hashedPassword,
      plainPassword: password,
      role,
      location,
    };

    if (assignedAdmin) userData.adminId = assignedAdmin;
    if (userUniqueCode) userData.userUniqueCode = userUniqueCode;
    if (role !== 'user') {
      userData.uniqueCode = name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase() + mobile.slice(-3);
    }

    const user = new User(userData);
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        uniqueCode: user.uniqueCode || user.userUniqueCode,
        adminId: user.adminId,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};


const loginUser = async (req, res) => {
  try {
    const { mobile, password, role } = req.body;

    if (!mobile || !password || !role) {
      return res.status(400).json({ message: 'Mobile, password and role are required' });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(400).json({ message: 'Invalid mobile number or password' });
    }

    if (user.role !== role) {
      return res.status(400).json({ message: 'Incorrect role for this user' });
    }

    // ✅ Only check validate for admin
    if (role === 'admin' && user.validate !== true) {
      return res.status(403).json({
        message: 'Superadmin has not validated your account',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid mobile number or password' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        uniqueCode: user.uniqueCode || user.userUniqueCode,
        adminId: user.adminId,
        validate:user.validate
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};



module.exports = {
  registerUser,
  loginUser,
};
