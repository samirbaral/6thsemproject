import express from 'express';
import multer from 'multer';
import * as roomController from '../controllers/roomController.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

const handleUploadError = (err, req, res, next) => {
  console.log('[handleUploadError] Error caught:', err);
  if (err instanceof multer.MulterError) {
    console.log('[handleUploadError] MulterError:', err.code, err.message);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 5MB' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    console.log('[handleUploadError] General error:', err.message);
    return res.status(400).json({ error: err.message });
  }
  next();
};

router.post('/', (req, res, next) => {
  console.log('[POST /rooms] Request received');
  console.log('[POST /rooms] Content-Type:', req.headers['content-type']);
  upload.array('images', 10)(req, res, (err) => {
    if (err) {
      console.log('[POST /rooms] Upload error:', err);
      return handleUploadError(err, req, res, next);
    }
    console.log('[POST /rooms] Upload successful, req.body:', req.body);
    console.log('[POST /rooms] req.files:', req.files);
    next();
  });
}, roomController.createRoom);
router.get('/', roomController.getAllRooms);
router.get('/:id', roomController.getRoomById);
router.put('/:id', upload.array('images', 10), handleUploadError, roomController.updateRoom);
router.delete('/:id', roomController.deleteRoom);

export default router;

