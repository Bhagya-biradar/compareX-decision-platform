import express from 'express';
import { compareProducts, getPrices, getSuggestions } from '../controllers/productController.js';

const router = express.Router();

router.get('/suggestions', getSuggestions);
router.post('/compare', compareProducts);
router.get('/prices', getPrices);

export default router;