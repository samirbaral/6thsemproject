import express from 'express';
import { health } from '../controllers/healthController.js';

const router = express.Router();

// GET /health
router.get('/', health);

export default router;
