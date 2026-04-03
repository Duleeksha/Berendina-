import express from 'express';
import { getBeneficiaries, addBeneficiary, updateBeneficiary, updateProgress, getHistory, getBeneficiaryByNIC, deleteBeneficiary } from '../controllers/beneficiaryController.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/', getBeneficiaries);
router.post('/', upload.array('documents'), addBeneficiary);
router.put('/:id', upload.array('documents'), updateBeneficiary);
router.put('/:id/progress', updateProgress);
router.get('/:id/history', getHistory);
router.get('/nic/:nic', getBeneficiaryByNIC);
router.delete('/:id', deleteBeneficiary);

export default router;

