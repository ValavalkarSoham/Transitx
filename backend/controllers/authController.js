const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'transitx_super_secret_jwt_key_123456', {
    expiresIn: '30d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, rollNumber, department, employeeId, designation, shiftStart, shiftEnd } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Prepare fields based on role
    const userData = {
      name,
      email,
      password,
      role: role || 'student',
    };

    if (role === 'student') {
      userData.rollNumber = rollNumber || '';
      userData.department = department || '';
      userData.passStatus = 'none';
    } else if (role === 'employee') {
      userData.employeeId = employeeId || '';
      userData.designation = designation || 'Driver';
      userData.shiftStart = shiftStart || '09:00';
      userData.shiftEnd = shiftEnd || '17:00';
    }

    // Create user
    const user = await User.create(userData);

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      data: {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Activate or renew Student transport pass
// @route   PUT /api/auth/me/pass
// @access  Private/Student
exports.updateStudentPass = async (req, res) => {
  try {
    const { planName, amount, route } = req.body;
    let days = 30;
    if (planName === 'Semester Pass') days = 180;
    if (planName === 'Annual Pass') days = 365;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + days);

    const transactionId = `TX-TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    const newTransaction = {
      transactionId,
      planName,
      amount: amount || 0,
      route: route || 'N/A',
      date: new Date(),
      status: 'Success',
    };

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.passStatus = 'active';
    user.passPlan = planName;
    user.passValidUntil = validUntil;
    user.paymentHistory.push(newTransaction);
    await user.save();

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
