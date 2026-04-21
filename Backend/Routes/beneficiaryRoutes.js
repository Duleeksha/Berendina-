import express from 'express';
import { getBeneficiaries, addBeneficiary, updateBeneficiary, updateProgress, getHistory, getBeneficiaryByNIC, deleteBeneficiary } from '../controllers/beneficiaryController.js';
import { upload } from '../middleware/upload.js';
const router = express.Router();

/**
 * All the roads to manage people who get help from Berendina.
 * Admin and Officers use these to add, change, or remove beneficiaries.
 */
// get list of all people getting help
router.get('/', getBeneficiaries);
// add a new person who needs help
router.post('/', upload.array('documents'), addBeneficiary);
// change info for the person
router.put('/:id', upload.array('documents'), updateBeneficiary);
// update how much work is done for person
router.put('/:id/progress', updateProgress);
// see what happen to person before
router.get('/:id/history', getHistory);
// find person using their ID card number
router.get('/nic/:nic', getBeneficiaryByNIC);
// remove person from our system
router.delete('/:id', deleteBeneficiary);

export default router;
