const express = require('express');
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, authorize('Admin', 'Asset Manager', 'Department Head'), getEmployees)
  .post(protect, authorize('Admin'), createEmployee);

router.route('/:id')
  .get(protect, authorize('Admin', 'Asset Manager', 'Department Head'), getEmployee)
  .put(protect, authorize('Admin'), updateEmployee)
  .delete(protect, authorize('Admin'), deleteEmployee);

module.exports = router;
