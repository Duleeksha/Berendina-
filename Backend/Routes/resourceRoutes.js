import express from 'express';
import { getResources, addResource, updateResource } from '../controllers/resourceController.js';

const router = express.Router();

router.get('/', getResources);
router.post('/', addResource);
router.put('/:id', updateResource);

export default router;
