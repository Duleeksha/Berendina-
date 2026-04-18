import express from 'express';
import { getFieldVisits, addFieldVisit, updateFieldVisit, markAsRead } from '../controllers/visitController.js';
import { upload } from '../middleware/upload.js';
const router = express.Router();
router.get('/', getFieldVisits);
router.post('/', upload.array('photos'), addFieldVisit);
router.put('/:id', upload.array('photos'), updateFieldVisit);
router.post('/mark-read', markAsRead);
export default router;
