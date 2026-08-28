const express = require('express');
const router = express.Router();
const { getEmployees, getAvailableEmployees, createEmployee } = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getEmployees)
  .post(createEmployee);

router.get('/available', getAvailableEmployees);

module.exports = router;
