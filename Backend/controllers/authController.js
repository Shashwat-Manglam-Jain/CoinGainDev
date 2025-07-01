const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const generateCode = require('../utils/generateCode');

// Register
const registerUser = async (req, res) => {
  try {
    const { name, mobile, password, location, adminId, role } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ message: 'Mobile number already registered' });
    }

    // Check admin if role is user
    if (role === 'user') {
      if (!adminId) {
        return res.status(400).json({ message: 'Admin selection is required for user registration' });
      }

      const admin = await User.findOne({ _id: adminId, role: 'admin' });
      if (!admin) {
        return res.status(400).json({ message: 'Invalid admin selected' });
      }

      const count = await User.countDocuments({ adminId });
      if (admin.userLimit && count >= admin.userLimit) {
        return res.status(400).json({ message: 'Admin user limit reached' });
      }
    }

    if (role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot create superadmin through this endpoint' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const uniqueCode = generateCode();

    // Create and save user
    const user = new User({
      name,
      mobile,
      password: hashedPassword,
      plainPassword: password,
      location,
      role: role || 'user',
      uniqueCode,
      adminId: role === 'user' ? adminId : null,
    });

    await user.save();

    // Generate JWT token
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
        uniqueCode: user.uniqueCode,
      },
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login
const loginUser = async (req, res) => {
  try {
    const { mobile, password, role } = req.body; 

    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(400).json({ message: 'Invalid mobile number or password' });
    }

    if (user.role !== role) {
      return res.status(400).json({ message: 'Invalid role for this user' });
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
        uniqueCode: user.uniqueCode,
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
