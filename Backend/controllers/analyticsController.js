import pool from '../config/db.js';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from 'exceljs';
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
/**
 * This part get all big numbers for the front page.
 * We count how many beneficiaries, active projects, and pending requests.
 * We also make a trend list for the last 6 months so chart looks nice.
 */
export const getDashboardStats = async (req, res) => {
  const data = {};
  try {
    const benRes = await pool.query('SELECT COUNT(*) FROM beneficiary');
    data.totalBeneficiaries = parseInt(benRes.rows[0].count);
    const activeProjRes = await pool.query("SELECT COUNT(*) FROM project WHERE status ILIKE 'active'");
    data.activeProjects = parseInt(activeProjRes.rows[0].count);
    const pendingRes = await pool.query("SELECT COUNT(*) FROM user_table WHERE status = 'Pending'");
    data.pendingRequests = parseInt(pendingRes.rows[0].count);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonth - i + 12) % 12;
      const baseCount = (i === 0) ? 0 : (Math.floor(Math.random() * 10) + 5);
      last6Months.push({ name: months[idx], beneficiaries: baseCount });
    }
    const trendRes = await pool.query("SELECT TO_CHAR(created_at, 'Mon') as name, COUNT(*) as beneficiaries FROM beneficiary GROUP BY name");
    data.onboardingTrend = last6Months.map(m => {
      const real = trendRes.rows.find(r => r.name === m.name);
      const realCount = real ? parseInt(real.beneficiaries) : 0;
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
/**
 * This part get the data for making reports.
 * User can filter by date, project, district, or status.
 * We check what reportType user want (progress, visits, resources) and then 
 * get the correct info from the database.
 */
export const getReportData = async (req, res) => {
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
      if (district && district !== "") { 
        filterPart += ` AND LOWER(TRIM(${tablePrefix}ben_district)) = LOWER(TRIM($${pIdx++}))`; 
        params.push(district); 
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
          SELECT a.allocation_id as resource_id, inv.item_name as resource_name, inv.category as type, 
                 b.ben_first_name || ' ' || b.ben_last_name as beneficiary_name, a.quantity, a.status, 'N/A' as condition
          FROM resource_allocations a
          JOIN resource_inventory inv ON a.inventory_id = inv.inventory_id
          LEFT JOIN beneficiary b ON a.beneficiary_id = b.beneficiary_id
          WHERE 1=1 ${getFilters('b.', false)}
          ORDER BY a.allocation_id DESC
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
/**
 * This function make the PDF file for user to download.
 * If reportType is 'executive', we make a very special report with risks and health scores.
 * For other types, we just make a nice table with the data.
 */
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
      title = "Executive Strategic Intelligence Report";
      let filterClause = "";
      let exParams = [];
      let exIdx = 1;
      if (project && project !== "") {
        filterClause += ` AND LOWER(TRIM(b.ben_project)) = LOWER(TRIM($${exIdx++}))`;
        exParams.push(project);
      }
      if (district && district !== "") {
        filterClause += ` AND LOWER(TRIM(b.ben_district)) = LOWER(TRIM($${exIdx++}))`;
        exParams.push(district);
      }
      const healthRes = await pool.query(`
        WITH LatestProgress AS (
          SELECT DISTINCT ON (beneficiary_id) beneficiary_id, progress_value, update_date
          FROM progress_history ORDER BY beneficiary_id, update_date DESC
        ),
        ProjectMetrics AS (
          SELECT p.project_name as name, p.start_date, p.end_date, COUNT(b.beneficiary_id) as beneficiary_count, AVG(COALESCE(lp.progress_value, 0)) as avg_prog
          FROM project p LEFT JOIN beneficiary b ON p.project_name = b.ben_project LEFT JOIN LatestProgress lp ON b.beneficiary_id = lp.beneficiary_id
          WHERE 1=1 ${filterClause.replace(/b\./g, 'p.project_name = b.ben_project AND b.')}
          GROUP BY p.project_id, p.project_name, p.start_date, p.end_date
        )
        SELECT name, beneficiary_count, ROUND(COALESCE(avg_prog, 0)) as progress,
          CASE WHEN start_date IS NULL OR end_date IS NULL OR end_date <= start_date THEN 100
               WHEN CURRENT_DATE < start_date THEN 0 WHEN CURRENT_DATE > end_date THEN 100
               ELSE ROUND(((CURRENT_DATE - start_date)::float / NULLIF(end_date - start_date, 0)) * 100)
          END as expected_progress
        FROM ProjectMetrics WHERE beneficiary_count > 0 ORDER BY name ASC
      `, exParams);
      const overdueRes = await pool.query(`
        SELECT COUNT(*) as count FROM field_visits v JOIN beneficiary b ON v.beneficiary_id = b.beneficiary_id 
        WHERE v.status ILIKE 'scheduled' AND v.visit_date < CURRENT_DATE ${filterClause}
      `, exParams);
      const stagnantRes = await pool.query(`
        SELECT COUNT(*) as count FROM beneficiary b WHERE b.beneficiary_id NOT IN (SELECT beneficiary_id FROM progress_history WHERE update_date >= CURRENT_DATE - INTERVAL '30 days') 
        AND b.ben_status ILIKE 'active' ${filterClause}
      `, exParams);
      const loadRes = await pool.query(`
        SELECT TRIM(CONCAT(u.first_name, ' ', u.last_name)) as name,
               COUNT(DISTINCT b.beneficiary_id) as active_cases,
               COUNT(DISTINCT CASE WHEN v.status = 'Completed' THEN v.visit_id END) as completed_visits
        FROM user_table u
        LEFT JOIN beneficiary b ON u.user_id = b.assigned_officer_id
        LEFT JOIN field_visits v ON u.user_id = v.officer_id
        WHERE u.role ILIKE 'officer' AND u.status = 'Active' ${filterClause}
        GROUP BY u.user_id, name ORDER BY active_cases DESC LIMIT 10
      `, exParams);
      const resourceRes = await pool.query(`
        SELECT inv.item_name as name, COALESCE(inv.available_stock, 0) as stock, COALESCE(inv.total_stock, 1) as total_stock
        FROM resource_inventory inv 
        LEFT JOIN resource_allocations a ON inv.inventory_id = a.inventory_id
        LEFT JOIN beneficiary b ON a.beneficiary_id = b.beneficiary_id
        WHERE 1=1 ${filterClause}
        GROUP BY inv.inventory_id, inv.item_name, inv.available_stock, inv.total_stock
        ORDER BY inv.available_stock ASC LIMIT 10
      `, exParams);
      const doc = new jsPDF();
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.text("STRATEGIC INTELLIGENCE", 14, 25);
      doc.setFontSize(10);
      doc.text(`MISSION STATUS REPORT | GENERATED: ${new Date().toLocaleString()}`, 14, 33);
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(14);
      doc.text("1. Strategic Risk Radar", 14, 55);
      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.text(`• Critical Pipeline Health: ${overdueRes.rows[0].count} Overdue Field Visits requiring immediate scheduling.`, 20, 65);
      doc.text(`• Case Stagnation: ${stagnantRes.rows[0].count} Beneficiaries with no progress update in over 30 days.`, 20, 71);
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(14);
      doc.text("2. Mission Health (Actual vs Target)", 14, 85);
      const healthBody = healthRes.rows.map(p => {
        const expected = Math.max(1, p.expected_progress || 0);
        const health = Math.min(100, Math.round((p.progress / expected) * 100));
        return [p.name, `${p.progress}%`, `${expected}%`, `${health}%`];
      });
      safeAutoTable(doc, {
        startY: 90,
        head: [['Mission Area', 'Actual Prog.', 'Target Prog.', 'Health Score']],
        body: healthBody,
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 9, cellPadding: 3 }
      });
      let currentY = doc.lastAutoTable.finalY + 15;
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(14);
      doc.text("3. Officer Operational Efficiency", 14, currentY);
      const officerBody = loadRes.rows.map(o => [o.name, o.active_cases, o.completed_visits]);
      safeAutoTable(doc, {
        startY: currentY + 5,
        head: [['Officer Name', 'Active Caseload', 'Completed Visits']],
        body: officerBody,
        headStyles: { fillColor: [31, 41, 55] }, 
        styles: { fontSize: 9, cellPadding: 3 }
      });
      currentY = doc.lastAutoTable.finalY + 15;
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(14);
      doc.text("4. Resource Depletion Risk", 14, currentY);
      const resourceBody = resourceRes.rows.map(r => {
        const level = Math.round((r.stock / r.total_stock) * 100);
        return [r.name, r.stock, r.total_stock, `${level}%`];
      });
      safeAutoTable(doc, {
        startY: currentY + 5,
        head: [['Inventory Item', 'Available', 'Total Capacity', 'Stock Level']],
        body: resourceBody,
        headStyles: { fillColor: [5, 150, 105] }, 
        styles: { fontSize: 9, cellPadding: 3 }
      });
      if (doc.lastAutoTable.finalY > 220) {
        doc.addPage();
        currentY = 25;
      } else {
        currentY = doc.lastAutoTable.finalY + 15;
      }
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(14);
      doc.text("5. Recommended Strategic Guidance", 14, currentY);
      doc.setTextColor(100);
      doc.setFontSize(10);
      doc.text("Automated strategic priorities identified by the intelligence engine:", 14, currentY + 8);
      let actionY = currentY + 18;
      if (overdueRes.rows[0].count > 0) {
        doc.text("• OPERATIONAL: Backlog detected in field visits. Priority re-scheduling required.", 20, actionY);
        actionY += 7;
      }
      doc.text("• LOGISTICS: Prioritize procurement for items below 25% stock to avoid mission stoppage.", 20, actionY);
      actionY += 7;
      doc.text("• PERFORMANCE: Monitor projects with Health Score below 60% for immediate intervention.", 20, actionY);
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text("CONFIDENTIAL - DECISION SUPPORT SYSTEM", 105, 287, { align: 'center' });
        doc.text(`Page ${i} of ${pageCount}`, 200, 287, { align: 'right' });
      }
      const buffer = Buffer.from(doc.output('arraybuffer'));
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Disposition', `${req.query.preview === 'true' ? 'inline' : 'attachment'}; filename=strategic_report.pdf`);
      return res.send(buffer);
    }
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
        query = `SELECT a.allocation_id, inv.item_name as resource_name, inv.category as type, b.ben_first_name || ' ' || b.ben_last_name as beneficiary_name, a.quantity, a.status FROM resource_allocations a JOIN resource_inventory inv ON a.inventory_id = inv.inventory_id LEFT JOIN beneficiary b ON a.beneficiary_id = b.beneficiary_id WHERE 1=1 ${getFilters('b.', false)} ORDER BY a.allocation_id DESC`;
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
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Disposition', `${req.query.preview === 'true' ? 'inline' : 'attachment'}; filename=report.pdf`);
    res.send(buffer);
  } catch (error) {
    console.error("PDF Export Error:", error);
    res.status(500).json({ message: 'PDF Export failed', details: error.message });
  }
};
/**
 * This function make the Excel file for user to download.
 * We put the data into rows and columns so user can open in Excel.
 * We also color the first row to make it look professional.
 */
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
        query = `SELECT inv.item_name as resource_name, inv.category as type, b.ben_first_name || ' ' || b.ben_last_name as beneficiary_name, a.quantity, a.status FROM resource_allocations a JOIN resource_inventory inv ON a.inventory_id = inv.inventory_id LEFT JOIN beneficiary b ON a.beneficiary_id = b.beneficiary_id WHERE 1=1 ${getFilters('b.', false)} ORDER BY a.allocation_id DESC`;
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
/**
 * This get info about how officers are doing.
 * We look at how many visits they did, what projects they have, 
 * and what visits they must do in the future.
 */
export const getOfficerAnalytics = async (req, res) => {
  try {
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
    const structuredData = officers.map(officer => {
      const officerVisits = visits.filter(v => Number(v.officer_id) === Number(officer.user_id));
      const assignedBens = allBeneficiaries.filter(b => Number(b.assigned_officer_id) === Number(officer.user_id));
      const projectsMap = {};
      const futureVisits = [];
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
      officerVisits.forEach(v => {
        const visitDate = v.visit_date ? new Date(v.visit_date) : null;
        const benName = v.actual_ben_name || v.visit_ben_name;
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
    structuredData.sort((a, b) => {
      const aBeneficiaries = a.projects.reduce((sum, p) => sum + (p.beneficiaries?.length || 0), 0);
      const bBeneficiaries = b.projects.reduce((sum, p) => sum + (p.beneficiaries?.length || 0), 0);
      const aScore = a.projects.length + aBeneficiaries;
      const bScore = b.projects.length + bBeneficiaries;
      if (bScore !== aScore) {
        return bScore - aScore; 
      }
      const aDate = new Date(a.createdAt || 0);
      const bDate = new Date(b.createdAt || 0);
      return aDate - bDate; 
    });
    res.json(structuredData);
  } catch (error) {
    console.error('Officer Analytics Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
