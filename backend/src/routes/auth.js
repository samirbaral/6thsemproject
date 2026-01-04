import express from 'express';
import { register, signin, signout } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/signin
router.post('/signin', signin);

// POST /api/auth/signout
// signout does not require auth - it clears the cookie on the server
router.post('/signout', signout);

export default router;