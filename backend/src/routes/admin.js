import express from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.get('/pending-owners', adminController.getPendingOwners);
router.post('/approve-owner/:ownerId', adminController.approveOwner);
router.post('/reject-owner/:ownerId', adminController.rejectOwner);
router.get('/stats', adminController.getStats);

export default router;

