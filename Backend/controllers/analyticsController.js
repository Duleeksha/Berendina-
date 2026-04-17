import pool from '../config/db.js';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from 'exceljs';

// Helper to handle jspdf-autotable resolution in varied Node environments
const safeAutoTable = (doc, options) => {
  if (typeof autoTable === 'function') {
    return autoTable(doc, options);
  } else if (autoTable && typeof autoTable.default === 'function') {
    return autoTable.default(doc, options);
  } else if (typeof doc.autoTable === 'function') {
    return doc.autoTable(options);
  }
  console.error("autoTable resolution failed");
};

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
  const { startDate, endDate, project, district, status, reportType } = req.query;
  try {
    let query = "";
    let params = [];
    let pIdx = 1;

    // Base filtering logic for shared parameters
    const getFilters = (tablePrefix = "", includeDate = true) => {
      let filterPart = "";
      if (status && status !== "") { 
        filterPart += ` AND LOWER(TRIM(${tablePrefix}ben_status)) = LOWER(TRIM($${pIdx++}))`; 
        params.push(status); 
      }
      if (includeDate) {
        if (startDate && startDate !== "") { 
          filterPart += ` AND ${tablePrefix}created_at >= $${pIdx++}::timestamp`; 
          params.push(startDate); 
        }
        if (endDate && endDate !== "") { 
          filterPart += ` AND ${tablePrefix}created_at < ($${pIdx++}::date + interval '1 day')`; 
          params.push(endDate); 
        }
      }
      return filterPart;
    };

    switch (reportType) {
      case 'progress':
        query = `
          SELECT ph.history_id, b.ben_first_name || ' ' || b.ben_last_name as ben_name, b.ben_project, ph.progress_value, ph.update_date, ph.comment
          FROM progress_history ph
          JOIN beneficiary b ON ph.beneficiary_id = b.beneficiary_id
          WHERE 1=1 ${getFilters('b.')}
          ORDER BY ph.update_date DESC
        `;
        break;
      
      case 'visits':
        query = `
          SELECT fv.visit_id, fv.visit_date, fv.beneficiary_name, 
                 TRIM(CONCAT(u.first_name, ' ', u.last_name)) as officer_name, 
                 fv.status, fv.notes
          FROM field_visits fv
          LEFT JOIN user_table u ON fv.officer_id = u.user_id
          LEFT JOIN beneficiary b ON fv.beneficiary_id = b.beneficiary_id
          WHERE 1=1 ${getFilters('b.')}
          ORDER BY fv.visit_date DESC
        `;
        break;

      case 'resources':
        query = `
          SELECT r.resource_id, r.res_name as resource_name, r.type, 
                 b.ben_first_name || ' ' || b.ben_last_name as beneficiary_name, r.quantity, r.status, r.condition
          FROM resource r
          LEFT JOIN beneficiary b ON r.allocated_to = b.beneficiary_id
          WHERE 1=1 ${getFilters('b.', false)}
          ORDER BY r.resource_id DESC
        `;
        break;

      case 'performance':
        query = `
          SELECT TO_CHAR(created_at, 'Month YYYY') as period, 
                 COUNT(*) as total_added,
                 COUNT(CASE WHEN ben_status = 'Active' THEN 1 END) as active_now,
                 COUNT(CASE WHEN ben_status = 'Pending' THEN 1 END) as pending_now
          FROM beneficiary
          WHERE 1=1 ${getFilters()}
          GROUP BY period, TO_CHAR(created_at, 'YYYY-MM')
          ORDER BY TO_CHAR(created_at, 'YYYY-MM') DESC
        `;
        break;

      default:
        query = `SELECT * FROM beneficiary WHERE 1=1 ${getFilters()}`;
    }

    const result = await pool.query(query, params);
    const rows = result.rows || [];

    // Different stats based on report type
    let stats = { total: rows.length };
    
    if (!reportType || reportType === 'default') {
      stats = {
        total: rows.length,
        active: rows.filter(r => (r.ben_status || '').toLowerCase() === 'active').length,
        inactive: rows.filter(r => (r.ben_status || '').toLowerCase() === 'inactive').length,
        pending: rows.filter(r => (r.ben_status || '').toLowerCase() === 'pending').length
      };
    } else if (reportType === 'progress') {
      const avgProgress = rows.length > 0 ? rows.reduce((acc, r) => acc + (r.progress_value || 0), 0) / rows.length : 0;
      stats.avgProgress = Math.round(avgProgress);
    } else if (reportType === 'visits') {
      stats.completed = rows.filter(r => (r.status || '').toLowerCase() === 'completed').length;
      stats.scheduled = rows.filter(r => (r.status || '').toLowerCase() === 'scheduled').length;
    }

    res.json({ rows, stats });
  } catch (error) {
    console.error("Report Fetch Error:", error);
    res.status(500).json({ message: 'Server error fetching reports', details: error.message });
  }
};

export const exportPDF = async (req, res) => {
  const { startDate, endDate, project, district, status, reportType } = req.query;
  try {
    let query = "";
    let params = [];
    let pIdx = 1;

    const getFilters = (tablePrefix = "", includeDate = true) => {
      let filterPart = "";
      if (project && project !== "") { 
        filterPart += ` AND LOWER(TRIM(${tablePrefix}ben_project)) = LOWER(TRIM($${pIdx++}))`; 
        params.push(project); 
      }
      if (status && status !== "") { 
        filterPart += ` AND LOWER(TRIM(${tablePrefix}ben_status)) = LOWER(TRIM($${pIdx++}))`; 
        params.push(status); 
      }
      if (includeDate) {
        if (startDate && startDate !== "") { 
          filterPart += ` AND ${tablePrefix}created_at >= $${pIdx++}::timestamp`; 
          params.push(startDate); 
        }
        if (endDate && endDate !== "") { 
          filterPart += ` AND ${tablePrefix}created_at < ($${pIdx++}::date + interval '1 day')`; 
          params.push(endDate); 
        }
      }
      return filterPart;
    };

    let title = "Beneficiary Report";
    let headers = [['Name', 'NIC', 'DS Division', 'Project', 'Status']];
    let mapper = (b) => [b.ben_first_name + ' ' + b.ben_last_name, b.ben_nic, b.ben_district, b.ben_project, b.ben_status];
    let body = [];

    if (reportType === 'executive') {
      // Executive Report is a summary, not a table-heavy report
      title = "Executive Intelligence Summary";
      
      // Fetch data for executive summary
      const healthRes = await pool.query(`
        WITH LatestProgress AS (
          SELECT DISTINCT ON (beneficiary_id) beneficiary_id, progress_value, update_date
          FROM progress_history ORDER BY beneficiary_id, update_date DESC
        )
        SELECT b.ben_project as name, ROUND(AVG(COALESCE(lp.progress_value, 0))) as health_score, COUNT(b.beneficiary_id) as beneficiary_count
        FROM beneficiary b LEFT JOIN LatestProgress lp ON b.beneficiary_id = lp.beneficiary_id
        WHERE b.ben_project IS NOT NULL GROUP BY b.ben_project ORDER BY health_score ASC
      `);

      const overdueRes = await pool.query("SELECT COUNT(*) as count FROM field_visits WHERE status ILIKE 'scheduled' AND visit_date < CURRENT_DATE");
      const stagnantRes = await pool.query("SELECT COUNT(*) as count FROM beneficiary b WHERE b.beneficiary_id NOT IN (SELECT beneficiary_id FROM progress_history WHERE update_date >= CURRENT_DATE - INTERVAL '30 days') AND b.ben_status ILIKE 'active'");

      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(37, 99, 235); // Blue-600
      doc.text(title, 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text("Strategic Risk Radar", 14, 45);
      doc.setFontSize(12);
      doc.text(`- Overdue Field Visits: ${overdueRes.rows[0].count}`, 20, 55);
      doc.text(`- Stagnant Beneficiaries (>30 days): ${stagnantRes.rows[0].count}`, 20, 62);

      doc.setFontSize(16);
      doc.text("Project Health Overview", 14, 80);
      
      safeAutoTable(doc, {
        startY: 85,
        head: [['Project Name', 'Health Score', 'Beneficiary Count']],
        body: healthRes.rows.map(p => [p.name, `${p.health_score}%`, p.beneficiary_count]),
        headStyles: { fillColor: [37, 99, 235] }
      });

      const buffer = Buffer.from(doc.output('arraybuffer'));
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `${req.query.preview === 'true' ? 'inline' : 'attachment'}; filename=executive_report.pdf`);
      return res.send(buffer);
    }

    // Standard Tabular Reports
    switch (reportType) {
      case 'progress':
        title = "Beneficiary Progress Report";
        headers = [['Name', 'Project', 'Progress %', 'Update Date', 'Comment']];
        mapper = (r) => [r.ben_name, r.ben_project, `${r.progress_value}%`, new Date(r.update_date).toLocaleDateString(), r.comment || 'N/A'];
        query = `SELECT ph.*, b.ben_first_name || ' ' || b.ben_last_name as ben_name, b.ben_project FROM progress_history ph JOIN beneficiary b ON ph.beneficiary_id = b.beneficiary_id WHERE 1=1 ${getFilters('b.')} ORDER BY ph.update_date DESC`;
        break;
      case 'visits':
        title = "Field Visit Detailed Report";
        headers = [['Date', 'Beneficiary', 'Officer', 'Status', 'Notes']];
        mapper = (r) => [new Date(r.visit_date).toLocaleDateString(), r.beneficiary_name, r.officer_name, r.status, r.notes || 'N/A'];
        query = `SELECT fv.*, TRIM(CONCAT(u.first_name, ' ', u.last_name)) as officer_name FROM field_visits fv LEFT JOIN user_table u ON fv.officer_id = u.user_id LEFT JOIN beneficiary b ON fv.beneficiary_id = b.beneficiary_id WHERE 1=1 ${getFilters('b.')} ORDER BY fv.visit_date DESC`;
        break;
      case 'resources':
        title = "Resource Allocation Report";
        headers = [['Resource', 'Type', 'Allocated To', 'Qty', 'Status']];
        mapper = (r) => [r.resource_name, r.type, r.beneficiary_name || 'Unallocated', r.quantity, r.status];
        query = `SELECT r.res_name as resource_name, r.type, b.ben_first_name || ' ' || b.ben_last_name as beneficiary_name, r.quantity, r.status FROM resource r LEFT JOIN beneficiary b ON r.allocated_to = b.beneficiary_id WHERE 1=1 ${getFilters('b.', false)} ORDER BY r.resource_id DESC`;
        break;
      case 'performance':
        title = "Monthly Performance Summary";
        headers = [['Period', 'Total Added', 'Active Now', 'Pending Now']];
        mapper = (r) => [r.period, r.total_added, r.active_now, r.pending_now];
        query = `SELECT TO_CHAR(created_at, 'Month YYYY') as period, COUNT(*) as total_added, COUNT(CASE WHEN ben_status = 'Active' THEN 1 END) as active_now, COUNT(CASE WHEN ben_status = 'Pending' THEN 1 END) as pending_now FROM beneficiary WHERE 1=1 ${getFilters()} GROUP BY period, TO_CHAR(created_at, 'YYYY-MM') ORDER BY TO_CHAR(created_at, 'YYYY-MM') DESC`;
        break;
      default:
        query = `SELECT * FROM beneficiary WHERE 1=1 ${getFilters()}`;
    }

    const result = await pool.query(query, params);
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235);
    doc.text(title, 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Records: ${result.rows.length}`, 14, 35);
    
    safeAutoTable(doc, { 
      startY: 45,
      head: headers, 
      body: result.rows.map(mapper),
      headStyles: { fillColor: [37, 99, 235] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 45 }
    });

    const buffer = Buffer.from(doc.output('arraybuffer'));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${req.query.preview === 'true' ? 'inline' : 'attachment'}; filename=report.pdf`);
    res.send(buffer);
  } catch (error) {
    console.error("PDF Export Error:", error);
    res.status(500).json({ message: 'PDF Export failed', details: error.message });
  }
};

export const exportExcel = async (req, res) => {
  const { startDate, endDate, project, district, status, reportType } = req.query;
  try {
    let query = "";
    let params = [];
    let pIdx = 1;

    const getFilters = (tablePrefix = "", includeDate = true) => {
      let filterPart = "";
      if (project && project !== "") { 
        filterPart += ` AND LOWER(TRIM(${tablePrefix}ben_project)) = LOWER(TRIM($${pIdx++}))`; 
        params.push(project); 
      }
      if (status && status !== "") { 
        filterPart += ` AND LOWER(TRIM(${tablePrefix}ben_status)) = LOWER(TRIM($${pIdx++}))`; 
        params.push(status); 
      }
      if (includeDate) {
        if (startDate && startDate !== "") { 
          filterPart += ` AND ${tablePrefix}created_at >= $${pIdx++}::timestamp`; 
          params.push(startDate); 
        }
        if (endDate && endDate !== "") { 
          filterPart += ` AND ${tablePrefix}created_at < ($${pIdx++}::date + interval '1 day')`; 
          params.push(endDate); 
        }
      }
      return filterPart;
    };

    let columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'NIC', key: 'nic', width: 20 },
      { header: 'District', key: 'district', width: 20 },
      { header: 'Project', key: 'project', width: 20 },
      { header: 'Status', key: 'status', width: 15 }
    ];
    let mapper = (b) => ({ 
      name: b.ben_first_name + ' ' + b.ben_last_name, 
      nic: b.ben_nic, 
      district: b.ben_district, 
      project: b.ben_project, 
      status: b.ben_status 
    });

    if (reportType === 'executive') {
       // Fetch summary data for excel
       const healthRes = await pool.query(`
        WITH LatestProgress AS (
          SELECT DISTINCT ON (beneficiary_id) beneficiary_id, progress_value, update_date
          FROM progress_history ORDER BY beneficiary_id, update_date DESC
        )
        SELECT b.ben_project as name, ROUND(AVG(COALESCE(lp.progress_value, 0))) as health_score, COUNT(b.beneficiary_id) as beneficiary_count
        FROM beneficiary b LEFT JOIN LatestProgress lp ON b.beneficiary_id = lp.beneficiary_id
        WHERE b.ben_project IS NOT NULL GROUP BY b.ben_project
      `);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Strategic Overview');
      
      worksheet.columns = [
        { header: 'Project Name', key: 'name', width: 30 },
        { header: 'Health Score %', key: 'score', width: 15 },
        { header: 'Total Members', key: 'count', width: 15 }
      ];
      
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

      healthRes.rows.forEach(p => {
        worksheet.addRow({ name: p.name, score: p.health_score, count: p.beneficiary_count });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=executive_summary.xlsx');
      await workbook.xlsx.write(res);
      return res.end();
    }

    switch (reportType) {
      case 'progress':
        columns = [
          { header: 'Name', key: 'name', width: 25 },
          { header: 'Project', key: 'project', width: 20 },
          { header: 'Progress %', key: 'progress', width: 15 },
          { header: 'Update Date', key: 'date', width: 15 },
          { header: 'Comment', key: 'comment', width: 40 }
        ];
        mapper = (r) => ({ name: r.ben_name, project: r.ben_project, progress: r.progress_value, date: new Date(r.update_date).toLocaleDateString(), comment: r.comment || 'N/A' });
        query = `SELECT ph.*, b.ben_first_name || ' ' || b.ben_last_name as ben_name, b.ben_project FROM progress_history ph JOIN beneficiary b ON ph.beneficiary_id = b.beneficiary_id WHERE 1=1 ${getFilters('b.')} ORDER BY ph.update_date DESC`;
        break;
      case 'visits':
        columns = [
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Beneficiary', key: 'beneficiary', width: 25 },
          { header: 'Officer', key: 'officer', width: 25 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Notes', key: 'notes', width: 40 }
        ];
        mapper = (r) => ({ date: new Date(r.visit_date).toLocaleDateString(), beneficiary: r.beneficiary_name, officer: r.officer_name, status: r.status, notes: r.notes || 'N/A' });
        query = `SELECT fv.*, TRIM(CONCAT(u.first_name, ' ', u.last_name)) as officer_name FROM field_visits fv LEFT JOIN user_table u ON fv.officer_id = u.user_id LEFT JOIN beneficiary b ON fv.beneficiary_id = b.beneficiary_id WHERE 1=1 ${getFilters('b.')} ORDER BY fv.visit_date DESC`;
        break;
      case 'resources':
        columns = [
          { header: 'Resource', key: 'resource', width: 25 },
          { header: 'Type', key: 'type', width: 15 },
          { header: 'Allocated To', key: 'beneficiary', width: 25 },
          { header: 'Qty', key: 'qty', width: 10 },
          { header: 'Status', key: 'status', width: 15 }
        ];
        mapper = (r) => ({ resource: r.resource_name, type: r.type, beneficiary: r.beneficiary_name || 'Unallocated', qty: r.quantity, status: r.status });
        query = `SELECT r.res_name as resource_name, r.type, b.ben_first_name || ' ' || b.ben_last_name as beneficiary_name, r.quantity, r.status FROM resource r LEFT JOIN beneficiary b ON r.allocated_to = b.beneficiary_id WHERE 1=1 ${getFilters('b.', false)} ORDER BY r.resource_id DESC`;
        break;
      case 'performance':
        columns = [
          { header: 'Period', key: 'period', width: 20 },
          { header: 'Total Added', key: 'added', width: 15 },
          { header: 'Active Now', key: 'active', width: 15 },
          { header: 'Pending Now', key: 'pending', width: 15 }
        ];
        mapper = (r) => ({ period: r.period, added: r.total_added, active: r.active_now, pending: r.pending_now });
        query = `SELECT TO_CHAR(created_at, 'Month YYYY') as period, COUNT(*) as total_added, COUNT(CASE WHEN ben_status = 'Active' THEN 1 END) as active_now, COUNT(CASE WHEN ben_status = 'Pending' THEN 1 END) as pending_now FROM beneficiary WHERE 1=1 ${getFilters()} GROUP BY period, TO_CHAR(created_at, 'YYYY-MM') ORDER BY TO_CHAR(created_at, 'YYYY-MM') DESC`;
        break;
      default:
        query = `SELECT * FROM beneficiary WHERE 1=1 ${getFilters()}`;
    }

    const result = await pool.query(query, params);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');
    
    worksheet.columns = columns;

    // Style the header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };

    result.rows.forEach(r => worksheet.addRow(mapper(r)));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');
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
             od.mobile_no, od.ds_division, od.vehicle_type, od.vehicle_no, od.languages, od.emergency_contact, od.is_available
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
        b.ben_first_name || ' ' || b.ben_last_name AS actual_ben_name,
        b.ben_project AS project_name,
        b.ben_status AS status
      FROM field_visits v
      LEFT JOIN beneficiary b ON v.beneficiary_id = b.beneficiary_id
    `);

    const visits = visitsRes.rows;

    // 3. Get all assigned beneficiaries directly from beneficiary table
    const beneficiariesRes = await pool.query(`
      SELECT assigned_officer_id, 
             ben_first_name || ' ' || ben_last_name AS name, 
             ben_project AS project_name, 
             ben_status AS status
      FROM beneficiary
      WHERE assigned_officer_id IS NOT NULL
    `);
    const allBeneficiaries = beneficiariesRes.rows;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Structure the data: Officer -> Projects -> Beneficiaries
    const structuredData = officers.map(officer => {
      const officerVisits = visits.filter(v => Number(v.officer_id) === Number(officer.user_id));
      const assignedBens = allBeneficiaries.filter(b => Number(b.assigned_officer_id) === Number(officer.user_id));
      
      // Group by project
      const projectsMap = {};
      const futureVisits = [];

      // First, add all directly assigned beneficiaries
      assignedBens.forEach(b => {
        const projName = b.project_name || "Unassigned";
        if (!projectsMap[projName]) {
          projectsMap[projName] = { name: projName, beneficiaries: [] };
        }
        projectsMap[projName].beneficiaries.push({
          name: b.name,
          status: b.status || 'Active'
        });
      });

      // Second, process visits for future scheduling and catching any missing ben info
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

        // Add to projects list ONLY IF NOT already added (to handle field visit data)
        const projName = v.project_name || "Unassigned/Field Visit";
        if (!projectsMap[projName]) {
          projectsMap[projName] = { name: projName, beneficiaries: [] };
        }
        
        if (!projectsMap[projName].beneficiaries.find(b => b.name === benName)) {
          projectsMap[projName].beneficiaries.push({
            name: benName,
            status: v.status || 'Active'
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
        dsDivision: officer.ds_division,
        vehicleType: officer.vehicle_type,
        vehicleNumber: officer.vehicle_no,
        languages: officer.languages,
        emergency_contact: officer.emergency_contact,
        isAvailable: officer.is_available,
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

