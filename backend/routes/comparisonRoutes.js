import express from 'express';
import {
  createComparison,
  deleteComparison,
  getComparisonById,
  getComparisons,
  updateComparison,
} from '../controllers/comparisonController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.route('/').post(protect, createComparison).get(protect, getComparisons);
router.route('/:id').get(protect, getComparisonById).put(protect, updateComparison).delete(protect, deleteComparison);

export default router;
