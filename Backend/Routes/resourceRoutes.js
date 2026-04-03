import express from 'express';
import { getResources, addResource, updateResource, deleteResource } from '../controllers/resourceController.js';

const router = express.Router();

router.get('/', getResources);
router.post('/', addResource);
router.put('/:id', updateResource);
router.delete('/:id', deleteResource);

export default router;
