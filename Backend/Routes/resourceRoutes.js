import express from 'express';
import { getResources, addResource, updateResource, deleteResource } from '../controllers/resourceController.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/', getResources);
router.post('/', upload.single('image'), addResource);
router.put('/:id', upload.single('image'), updateResource);
router.delete('/:id', deleteResource);


export default router;
