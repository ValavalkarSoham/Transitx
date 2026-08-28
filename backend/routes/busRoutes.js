const express = require('express');
const router = express.Router();
const {
  getBuses,
  getBus,
  createBus,
  updateBus,
  deleteBus,
  getMyBus,
} = require('../controllers/busController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/employee/mybus', protect, getMyBus);

router
  .route('/')
  .get(getBuses)
  .post(protect, authorize('admin'), createBus);

router
  .route('/:id')
  .get(getBus)
  .put(protect, updateBus) // Protected, role checked inside controller
  .delete(protect, authorize('admin'), deleteBus);

module.exports = router;
