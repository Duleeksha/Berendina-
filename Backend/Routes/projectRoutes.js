import express from 'express';
import { getProjects, addProject, updateProject, deleteProject } from '../controllers/projectController.js';
import { upload } from '../middleware/upload.js';
const router = express.Router();

// get list of all projects we do
router.get('/', getProjects);
// make a new project in the system
router.post('/', upload.single('image'), addProject);
// change information for a project
router.put('/:id', upload.single('image'), updateProject);
// remove a project from our system
router.delete('/:id', deleteProject);

export default router;
