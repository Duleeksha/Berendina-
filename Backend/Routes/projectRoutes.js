import express from 'express';
import { getProjects, addProject, updateProject } from '../controllers/projectController.js';

const router = express.Router();

router.get('/', getProjects);
router.post('/', addProject);
router.put('/:id', updateProject);

export default router;
