const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'employee', 'student'],
      default: 'student',
    },
    // Student specific fields
    rollNumber: {
      type: String,
      default: null,
    },
    department: {
      type: String,
      default: null,
    },
    passStatus: {
      type: String,
      enum: ['active', 'expired', 'none'],
      default: 'none',
    },
    passValidUntil: {
      type: Date,
      default: null,
    },
    passPlan: {
      type: String,
      default: null,
    },
    paymentHistory: [
      {
        transactionId: String,
        planName: String,
        amount: Number,
        route: String,
        date: { type: Date, default: Date.now },
        status: { type: String, default: 'Success' },
      }
    ],
    // Employee specific fields
    employeeId: {
      type: String,
      default: null,
    },
    designation: {
      type: String,
      default: null,
    },
    shiftStart: {
      type: String,
      default: '09:00',
    },
    shiftEnd: {
      type: String,
      default: '17:00',
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
