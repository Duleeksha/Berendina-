import express from 'express';
import { getDashboardStats, getReportData, exportPDF, exportExcel, getOfficerAnalytics } from '../controllers/analyticsController.js';
import { getExecutiveIntelligence } from '../controllers/decisionController.js';
const router = express.Router();

/**
 * All the roads for making reports and seeing how system is doing.
 * Admin use these to see big numbers on dashboard and download files.
 */
// get numbers for dash board
router.get('/dashboard-stats', getDashboardStats);
// get list of data for reports
router.get('/reports', getReportData);
// download report in PDF
router.get('/export/pdf', exportPDF);
// download report in Excel
router.get('/export/excel', exportExcel);
// see how officers are working
router.get('/officer-analytics', getOfficerAnalytics);
// high level info for boss
router.get('/executive-intelligence', getExecutiveIntelligence);

export default router;
