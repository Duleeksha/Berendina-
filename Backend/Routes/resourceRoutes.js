import express from 'express';
import { 
  getInventory, 
  addInventoryItem, 
  updateInventoryItem,
  deleteInventoryItem,
  createRequest, 
  getRequests, 
  processRequest, 
  getAllocations, 
  returnResource,
  directAllocate
} from '../controllers/resourceController.js';
import { upload } from '../middleware/upload.js';
const router = express.Router();
router.get('/inventory', getInventory);
router.post('/inventory', upload.single('image'), addInventoryItem);
router.put('/inventory/:id', upload.single('image'), updateInventoryItem);
router.delete('/inventory/:id', deleteInventoryItem);
router.post('/requests', createRequest);
router.get('/requests', getRequests);
router.put('/requests/:id', processRequest);
router.get('/allocations', getAllocations);
router.put('/allocations/:id/return', returnResource);
router.post('/allocate-direct', directAllocate);
export default router;
