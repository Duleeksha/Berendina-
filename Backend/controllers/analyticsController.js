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

    // Onboarding Trend with dummy data fallback
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonth - i + 12) % 12;
      // If it's the current month (i == 0), use 0 as base dummy data; otherwise use random dummy data.
      const baseCount = (i === 0) ? 0 : (Math.floor(Math.random() * 10) + 5);
      last6Months.push({ name: months[idx], beneficiaries: baseCount });
    }

    const trendRes = await pool.query("SELECT TO_CHAR(created_at, 'Mon') as name, COUNT(*) as beneficiaries FROM beneficiary GROUP BY name");
    
    // Merge real data into the last 6 months
    data.onboardingTrend = last6Months.map(m => {
      const real = trendRes.rows.find(r => r.name === m.name);
      const realCount = real ? parseInt(real.beneficiaries) : 0;
      // If it's the current month (matching current label), show exact real count.
      // Otherwise, show dummy + real.
      return { ...m, beneficiaries: m.beneficiaries + realCount };
    });

    const distRes = await pool.query("SELECT COALESCE(ben_project, 'Unassigned') as name, COUNT(*) as beneficiaries FROM beneficiary GROUP BY name");
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
    // 1. Get all officers (using CONCAT to handle NULL first/last names)
    const officersRes = await pool.query(`
      SELECT user_id, 
             TRIM(CONCAT(first_name, ' ', last_name)) AS name 
      FROM user_table 
      WHERE TRIM(LOWER(role)) = 'officer'
    `);


    const officers = officersRes.rows;


    // Get all visits with beneficiary and project info
    const visitsRes = await pool.query(`
      SELECT 
        v.officer_id,
        v.beneficiary_name,
        b.ben_project AS project_name,
        b.ben_status AS status
      FROM field_visits v
      LEFT JOIN beneficiary b ON v.beneficiary_name = b.ben_name
    `);

    const visits = visitsRes.rows;

    // Structure the data: Officer -> Projects -> Beneficiaries
    const structuredData = officers.map(officer => {
      const officerVisits = visits.filter(v => v.officer_id === officer.user_id);
      
      // Group by project
      const projectsMap = {};
      officerVisits.forEach(v => {
        const projName = v.project_name || "Unassigned/Field Visit";
        if (!projectsMap[projName]) {
          projectsMap[projName] = { name: projName, beneficiaries: [] };
        }
        // Avoid duplicate beneficiaries in the same project list for this officer
        if (!projectsMap[projName].beneficiaries.find(b => b.name === v.beneficiary_name)) {
          projectsMap[projName].beneficiaries.push({
            name: v.beneficiary_name,
            status: v.status || 'Pending'
          });
        }
      });


      return {
        officerName: officer.name,
        totalVisits: officerVisits.length,
        projects: Object.values(projectsMap)
      };
    });

    // Sort by enthusiasm: Star Performers -> New Members (Zeroes) -> Others
    structuredData.sort((a, b) => {
      const aScore = a.projects.length + a.totalVisits;
      const bScore = b.projects.length + b.totalVisits;

      // If both are zero, they are equal
      if (aScore === 0 && bScore === 0) return 0;
      
      // If one is high activity (e.g. > 5 total engagement) and other is zero, high activity wins
      // If one is low activity (e.g. 1-2 engagement) and other is zero, zero activity (new) wins to be "second"
      if (aScore === 0) return bScore > 5 ? 1 : -1;
      if (bScore === 0) return aScore > 5 ? -1 : 1;

      // Normal descending sort for active members
      if (b.projects.length !== a.projects.length) {
        return b.projects.length - a.projects.length;
      }
      return b.totalVisits - a.totalVisits;
    });


    res.json(structuredData);

  } catch (error) {
    console.error('Officer Analytics Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

