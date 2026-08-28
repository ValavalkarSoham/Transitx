const Bus = require('../models/Bus');

// @desc    Get all buses
// @route   GET /api/buses
// @access  Public
exports.getBuses = async (req, res) => {
  try {
    const buses = await Bus.find()
      .populate('routeId')
      .populate('driverId', 'name email role');
    res.status(200).json({ success: true, count: buses.length, data: buses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single bus
// @route   GET /api/buses/:id
// @access  Public
exports.getBus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)
      .populate('routeId')
      .populate('driverId', 'name email role');
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }
    res.status(200).json({ success: true, data: bus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new bus
// @route   POST /api/buses
// @access  Private/Admin
exports.createBus = async (req, res) => {
  try {
    const { busNumber, capacity, routeId, driverId, status } = req.body;

    const busExists = await Bus.findOne({ busNumber });
    if (busExists) {
      return res.status(400).json({ success: false, message: 'Bus with this number already exists' });
    }

    const bus = await Bus.create({
      busNumber,
      capacity,
      routeId: routeId || null,
      driverId: driverId || null,
      status: status || 'inactive',
    });

    const populatedBus = await Bus.findById(bus._id)
      .populate('routeId')
      .populate('driverId', 'name email role');

    res.status(201).json({ success: true, data: populatedBus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update bus
// @route   PUT /api/buses/:id
// @access  Private
exports.updateBus = async (req, res) => {
  try {
    let bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    // Role verification: either admin or the assigned driver
    if (req.user.role !== 'admin' && bus.driverId?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this bus' });
    }

    bus = await Bus.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('routeId')
      .populate('driverId', 'name email role');

    res.status(200).json({ success: true, data: bus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete bus
// @route   DELETE /api/buses/:id
// @access  Private/Admin
exports.deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    await bus.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bus assigned to current driver
// @route   GET /api/buses/driver/mybus
// @access  Private/Driver
exports.getMyBus = async (req, res) => {
  try {
    const bus = await Bus.findOne({ driverId: req.user.id })
      .populate('routeId')
      .populate('driverId', 'name email role');
    
    if (!bus) {
      return res.status(404).json({ success: false, message: 'No bus assigned to this driver' });
    }

    res.status(200).json({ success: true, data: bus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
