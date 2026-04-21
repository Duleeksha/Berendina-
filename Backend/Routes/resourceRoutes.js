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

/**
 * All the roads for managing the items in storage and giving them to people.
 * Officers can ask for things, and Admin can approve or give directly.
 */
// get all items in the store
router.get('/inventory', getInventory);
// add new item to the store
router.post('/inventory', upload.single('image'), addInventoryItem);
// change info for store item
router.put('/inventory/:id', upload.single('image'), updateInventoryItem);
// remove item from the store
router.delete('/inventory/:id', deleteInventoryItem);
// ask for things for a person
router.post('/requests', createRequest);
// see all things people asked for
router.get('/requests', getRequests);
// admin say YES or NO to request
router.put('/requests/:id', processRequest);
// see who got what from store
router.get('/allocations', getAllocations);
// person give back the item to store
router.put('/allocations/:id/return', returnResource);
// give thing directly to person
router.post('/allocate-direct', directAllocate);

export default router;
