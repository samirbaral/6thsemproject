import express from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import * as ownerController from '../controllers/ownerController.js';

const router = express.Router();

// All owner routes require authentication and owner role
router.use(requireAuth);
router.use(requireRole('OWNER'));

router.post('/rooms', ownerController.createRoom);
router.get('/rooms', ownerController.getMyRooms);
router.get('/rooms/:roomId', ownerController.getRoom);
router.put('/rooms/:roomId', ownerController.updateRoom);
router.delete('/rooms/:roomId', ownerController.deleteRoom);
router.put('/bookings/:bookingId/status', ownerController.updateBookingStatus);

export default router;

