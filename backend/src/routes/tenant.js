import express from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import * as tenantController from '../controllers/tenantController.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Public room browsing (authenticated users can view)
router.get('/rooms', tenantController.getAllRooms);
router.get('/rooms/:roomId', tenantController.getRoom);

// Tenant-only routes
router.post('/bookings', requireRole('TENANT'), tenantController.bookRoom);
router.get('/bookings', requireRole('TENANT'), tenantController.getMyBookings);
router.post('/bookings/:bookingId/cancel', requireRole('TENANT'), tenantController.cancelBooking);

export default router;

