import pool from '../config/db.js';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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
  const { startDate, endDate, project, district, status } = req.query;
  try {
    let query = `SELECT * FROM beneficiary WHERE 1=1`;
    const params = [];
    let pIdx = 1;

    if (project && project !== "") { 
      query += ` AND LOWER(TRIM(ben_project)) = LOWER(TRIM($${pIdx++}))`; 
      params.push(project); 
    }
    if (district && district !== "") { 
      query += ` AND LOWER(TRIM(ben_district)) = LOWER(TRIM($${pIdx++}))`; 
      params.push(district); 
    }
    if (status && status !== "") { 
      query += ` AND LOWER(TRIM(ben_status)) = LOWER(TRIM($${pIdx++}))`; 
      params.push(status); 
    }
    if (startDate && startDate !== "") { 
      query += ` AND created_at >= $${pIdx++}::timestamp`; 
      params.push(startDate); 
    }
    if (endDate && endDate !== "") { 
      query += ` AND created_at < ($${pIdx++}::date + interval '1 day')`; 
      params.push(endDate); 
    }

    const result = await pool.query(query, params);
    
    // Aggregate data for Metric Cards
    const rows = result.rows || [];
    const stats = {
      total: rows.length,
      active: rows.filter(r => (r.ben_status || '').toLowerCase() === 'active').length,
      inactive: rows.filter(r => (r.ben_status || '').toLowerCase() === 'inactive').length,
      pending: rows.filter(r => (r.ben_status || '').toLowerCase() === 'pending').length
    };

    res.json({ rows, stats });
  } catch (error) {
    console.error("Report Fetch Error:", error);
    res.status(500).json({ 
      message: 'Server error fetching reports', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const exportPDF = async (req, res) => {
  const { startDate, endDate, project, district, status } = req.query;
  try {
    let query = `SELECT * FROM beneficiary WHERE 1=1`;
    const params = [];
    let pIdx = 1;
    if (project) { query += ` AND ben_project = $${pIdx++}`; params.push(project); }
    if (district) { query += ` AND ben_district = $${pIdx++}`; params.push(district); }
    if (status) { query += ` AND LOWER(ben_status) = LOWER($${pIdx++})`; params.push(status); }
    if (startDate) { query += ` AND created_at >= $${pIdx++}`; params.push(startDate); }
    if (endDate) { query += ` AND created_at <= $${pIdx++}`; params.push(endDate); }

    const result = await pool.query(query, params);
    const doc = new jsPDF();
    
    // Add title and metadata to PDF
    doc.setFontSize(20);
    doc.text("Beneficiary Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Total Records: ${result.rows.length}`, 14, 35);
    
    const tableData = result.rows.map(b => [b.ben_name, b.ben_nic, b.ben_district, b.ben_project, b.ben_status]);
    doc.autoTable({ 
      startY: 45,
      head: [['Name', 'NIC', 'DS Division', 'Project', 'Status']], 
      body: tableData,
      headStyles: { fillStyle: '#2563eb' }
    });

    const buffer = Buffer.from(doc.output('arraybuffer'));
    res.setHeader('Content-Type', 'application/pdf');
    if (req.query.preview === 'true') {
      res.setHeader('Content-Disposition', 'inline; filename=filtered_report.pdf');
    } else {
      res.setHeader('Content-Disposition', 'attachment; filename=filtered_report.pdf');
    }
    res.send(buffer);
  } catch (error) {
    console.error("PDF Export Error:", error);
    res.status(500).json({ message: 'PDF Export failed' });
  }
};

export const exportExcel = async (req, res) => {
  const { startDate, endDate, project, district, status } = req.query;
  try {
    let query = `SELECT * FROM beneficiary WHERE 1=1`;
    const params = [];
    let pIdx = 1;
    if (project) { query += ` AND ben_project = $${pIdx++}`; params.push(project); }
    if (district) { query += ` AND ben_district = $${pIdx++}`; params.push(district); }
    if (status) { query += ` AND LOWER(ben_status) = LOWER($${pIdx++})`; params.push(status); }
    if (startDate) { query += ` AND created_at >= $${pIdx++}`; params.push(startDate); }
    if (endDate) { query += ` AND created_at <= $${pIdx++}`; params.push(endDate); }

    const result = await pool.query(query, params);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Beneficiaries');
    
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'NIC', key: 'nic', width: 15 },
      { header: 'DS Division', key: 'district', width: 15 },
      { header: 'Project', key: 'project', width: 20 },
      { header: 'Status', key: 'status', width: 10 }
    ];

    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };

    result.rows.forEach(b => worksheet.addRow({ 
      name: b.ben_name, 
      nic: b.ben_nic, 
      district: b.ben_district, 
      project: b.ben_project, 
      status: b.ben_status 
    }));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=filtered_report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Excel Export Error:", error);
    res.status(500).json({ message: 'Excel Export failed' });
  }
};

export const getOfficerAnalytics = async (req, res) => {
  try {
    // 1. Get all officers (using CONCAT to handle NULL first/last names)
    const officersRes = await pool.query(`
      SELECT u.user_id, 
             u.first_name, u.last_name, u.email, u.employee_id, u.organization, u.department, u.branch, u.job_title, u.gender,
             TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS name,
             u.created_at,
             od.mobile_no, od.ds_division, od.vehicle_type, od.vehicle_no, od.languages, od.emergency_contact
      FROM user_table u
      LEFT JOIN officer_details od ON u.user_id = od.user_id
      WHERE TRIM(LOWER(u.role)) = 'officer' AND u.status = 'Active'
    `);


    const officers = officersRes.rows;


    // Get all visits with beneficiary and project info
    const visitsRes = await pool.query(`
      SELECT 
        v.officer_id,
        v.beneficiary_name AS visit_ben_name,
        v.visit_date,
        v.status AS visit_status,
        b.ben_name AS actual_ben_name,
        b.ben_project AS project_name,
        b.ben_status AS status
      FROM field_visits v
      LEFT JOIN beneficiary b ON v.beneficiary_id = b.beneficiary_id
    `);

    const visits = visitsRes.rows;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Structure the data: Officer -> Projects -> Beneficiaries
    const structuredData = officers.map(officer => {
      const officerVisits = visits.filter(v => Number(v.officer_id) === Number(officer.user_id));
      
      // Group by project
      const projectsMap = {};
      const futureVisits = [];

      officerVisits.forEach(v => {
        const visitDate = v.visit_date ? new Date(v.visit_date) : null;
        const benName = v.actual_ben_name || v.visit_ben_name;
        
        // Check if it's a future visit
        if (visitDate && visitDate > today && v.visit_status !== 'Completed') {
          futureVisits.push({
            beneficiary: benName,
            project: v.project_name || "Unassigned",
            date: v.visit_date,
            status: v.visit_status || 'Scheduled'
          });
        }

        const projName = v.project_name || "Unassigned/Field Visit";
        if (!projectsMap[projName]) {
          projectsMap[projName] = { name: projName, beneficiaries: [] };
        }
        // Avoid duplicate beneficiaries in the same project list for this officer
        if (!projectsMap[projName].beneficiaries.find(b => b.name === benName)) {
          projectsMap[projName].beneficiaries.push({
            name: benName,
            status: v.status || 'Pending'
          });
        }
      });


      return {
        officerId: officer.user_id,
        officerName: officer.name,
        firstName: officer.first_name,
        lastName: officer.last_name,
        email: officer.email,
        employee_id: officer.employee_id,
        organization: officer.organization,
        department: officer.department,
        branch: officer.branch,
        job_title: officer.job_title,
        gender: officer.gender,
        mobileNumber: officer.mobile_no,
        ds_division: officer.ds_division,
        vehicleType: officer.vehicle_type,
        vehicleNumber: officer.vehicle_no,
        languages: officer.languages,
        emergency_contact: officer.emergency_contact,
        totalVisits: officerVisits.length,
        projects: Object.values(projectsMap),
        futureVisits: futureVisits.sort((a, b) => new Date(a.date) - new Date(b.date)),
        createdAt: officer.created_at
      };
    });

    // --- NEW PRIORITIZATION LOGIC ---
    // 1. Primary: Project Count + Beneficiary Count (Descending)
    // 2. Secondary: Date of Join (createdAt) (Ascending - Early joiners first)
    structuredData.sort((a, b) => {
      const aBeneficiaries = a.projects.reduce((sum, p) => sum + (p.beneficiaries?.length || 0), 0);
      const bBeneficiaries = b.projects.reduce((sum, p) => sum + (p.beneficiaries?.length || 0), 0);
      
      const aScore = a.projects.length + aBeneficiaries;
      const bScore = b.projects.length + bBeneficiaries;

      if (bScore !== aScore) {
        return bScore - aScore; // Descending by engagement
      }

      // Tie-breaker: Date of Join (Earliest first)
      const aDate = new Date(a.createdAt || 0);
      const bDate = new Date(b.createdAt || 0);
      return aDate - bDate; // Ascending by date
    });


    res.json(structuredData);

  } catch (error) {
    console.error('Officer Analytics Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

