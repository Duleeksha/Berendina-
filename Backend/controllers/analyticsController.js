import pool from '../config/db.js';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import ExcelJS from 'exceljs';

export const getDashboardStats = async (req, res) => {
  const data = {};
  try {
    const benRes = await pool.query('SELECT COUNT(*) FROM beneficiary');
    data.totalBeneficiaries = parseInt(benRes.rows[0].count);

    const activeProjRes = await pool.query("SELECT COUNT(*) FROM project WHERE status ILIKE 'active'");
    data.activeProjects = parseInt(activeProjRes.rows[0].count);

    const pendingRes = await pool.query("SELECT COUNT(*) FROM user_table WHERE status = 'Pending'");
    data.pendingRequests = parseInt(pendingRes.rows[0].count);

    const trendRes = await pool.query("SELECT TO_CHAR(created_at, 'Mon') as name, COUNT(*) as beneficiaries FROM beneficiary GROUP BY name");
    data.onboardingTrend = trendRes.rows.map(r => ({ ...r, beneficiaries: parseInt(r.beneficiaries) }));

    const distRes = await pool.query("SELECT ben_project as name, COUNT(*) as beneficiaries FROM beneficiary GROUP BY ben_project");
    data.projectDistribution = distRes.rows.map(r => ({ ...r, beneficiaries: parseInt(r.beneficiaries) }));

    const resRes = await pool.query('SELECT SUM(quantity) as total FROM resource');
    data.totalResources = parseInt(resRes.rows[0].total) || 0;

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving dashboard stats' });
  }
};

export const getReportData = async (req, res) => {
  const { month, year, project, district } = req.query;
  try {
    let query = `SELECT * FROM beneficiary WHERE 1=1`;
    const params = [];
    let pIdx = 1;
    if (project) { query += ` AND ben_project = $${pIdx++}`; params.push(project); }
    if (district) { query += ` AND ben_district = $${pIdx++}`; params.push(district); }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const exportPDF = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM beneficiary');
    const doc = new jsPDF();
    const tableData = result.rows.map(b => [b.ben_name, b.ben_nic, b.ben_district, b.ben_project, b.ben_status]);
    doc.autoTable({ head: [['Name', 'NIC', 'District', 'Project', 'Status']], body: tableData });
    const buffer = Buffer.from(doc.output('arraybuffer'));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=beneficiaries.pdf');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'PDF Export failed' });
  }
};

export const exportExcel = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM beneficiary');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Beneficiaries');
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'NIC', key: 'nic', width: 15 },
      { header: 'District', key: 'district', width: 15 },
      { header: 'Project', key: 'project', width: 20 },
      { header: 'Status', key: 'status', width: 10 }
    ];
    result.rows.forEach(b => worksheet.addRow({ name: b.ben_name, nic: b.ben_nic, district: b.ben_district, project: b.ben_project, status: b.ben_status }));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=beneficiaries.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'Excel Export failed' });
  }
};

export const getOfficerAnalytics = async (req, res) => {
  try {
    const query = `
      SELECT u.user_id, u.first_name || ' ' || u.last_name AS name,
             COUNT(v.visit_id) AS total_visits,
             COUNT(CASE WHEN v.status = 'completed' THEN 1 END) AS completed_visits
      FROM user_table u
      LEFT JOIN field_visits v ON u.user_id = v.officer_id
      WHERE u.role = 'officer'
      GROUP BY u.user_id;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
