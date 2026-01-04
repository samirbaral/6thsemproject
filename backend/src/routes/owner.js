import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import * as ownerController from '../controllers/ownerController.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

// All owner routes require authentication and owner role
router.use(requireAuth);
router.use(requireRole('OWNER'));

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 5MB' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) return res.status(400).json({ error: err.message });
  next();
};

// Accept multiple images (up to 10)
router.post('/rooms', (req, res, next) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, next);
    next();
  });
}, ownerController.createRoom);

router.get('/rooms', ownerController.getMyRooms);
router.get('/rooms/:roomId', ownerController.getRoom);
router.put('/rooms/:roomId', (req, res, next) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, next);
    next();
  });
}, ownerController.updateRoom);
router.delete('/rooms/:roomId', ownerController.deleteRoom);
router.put('/bookings/:bookingId/status', ownerController.updateBookingStatus);

export default router;

