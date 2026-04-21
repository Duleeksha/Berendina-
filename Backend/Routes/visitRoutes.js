import express from 'express';
import { getFieldVisits, addFieldVisit, updateFieldVisit, markAsRead } from '../controllers/visitController.js';
import { upload } from '../middleware/upload.js';
const router = express.Router();

// get list of all visits for officers
router.get('/', getFieldVisits);
// put a new visit on the officer calendar
router.post('/', upload.array('photos'), addFieldVisit);
// update visit notes when officer is done
router.put('/:id', upload.array('photos'), updateFieldVisit);
// say officer already saw the new visit notice
router.post('/mark-read', markAsRead);

export default router;
