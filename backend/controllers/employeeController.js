const User = require('../models/User');
const Bus = require('../models/Bus');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private/Admin
exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' });
    res.status(200).json({ success: true, count: employees.length, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get employees that are currently not assigned to any bus
// @route   GET /api/employees/available
// @access  Private/Admin
exports.getAvailableEmployees = async (req, res) => {
  try {
    // Find all employees
    const employees = await User.find({ role: 'employee' });

    // Find all assigned employee IDs
    const assignedBuses = await Bus.find({ driverId: { $ne: null } }).select('driverId');
    const assignedEmployeeIds = assignedBuses.map((bus) => bus.driverId.toString());

    // Filter available employees
    const availableEmployees = employees.filter(
      (emp) => !assignedEmployeeIds.includes(emp._id.toString())
    );

    res.status(200).json({
      success: true,
      count: availableEmployees.length,
      data: availableEmployees,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new employee from Admin Panel
// @route   POST /api/employees
// @access  Private/Admin
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, password, employeeId, designation, shiftStart, shiftEnd } = req.body;

    const employeeExists = await User.findOne({ email });
    if (employeeExists) {
      return res.status(400).json({ success: false, message: 'Employee with this email already exists' });
    }

    const employee = await User.create({
      name,
      email,
      password,
      role: 'employee',
      employeeId,
      designation,
      shiftStart: shiftStart || '09:00',
      shiftEnd: shiftEnd || '17:00',
    });

    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
