import pool from '../config/db.js';
// this function get all high level info for big boss to see
export const getExecutiveIntelligence = async (req, res) => {
  try {
    const { district, project } = req.query;
    let filterClause = "";
    let params = [];
    let pIdx = 1;
    if (project && project !== "") {
      filterClause += ` AND LOWER(TRIM(b.ben_project)) = LOWER(TRIM($${pIdx++}))`;
      params.push(project);
    }
    if (district && district !== "") {
      filterClause += ` AND LOWER(TRIM(b.ben_district)) = LOWER(TRIM($${pIdx++}))`;
      params.push(district);
    }
    const healthRes = await pool.query(`
      WITH LatestProgress AS (
        SELECT DISTINCT ON (beneficiary_id) beneficiary_id, progress_value, update_date
        FROM progress_history
        ORDER BY beneficiary_id, update_date DESC
      ),
      ProjectMetrics AS (
        SELECT 
          p.project_name as name,
          p.start_date,
          p.end_date,
          COUNT(b.beneficiary_id) as beneficiary_count,
          AVG(COALESCE(lp.progress_value, 0)) as avg_prog
        FROM project p
        LEFT JOIN beneficiary b ON p.project_name = b.ben_project
        LEFT JOIN LatestProgress lp ON b.beneficiary_id = lp.beneficiary_id
        WHERE 1=1 ${filterClause.replace(/b\./g, 'p.project_name = b.ben_project AND b.')}
        GROUP BY p.project_id, p.project_name, p.start_date, p.end_date
      )
      SELECT 
        name,
        beneficiary_count,
        ROUND(COALESCE(avg_prog, 0)) as progress,
        CASE 
          WHEN start_date IS NULL OR end_date IS NULL THEN 100
          WHEN end_date <= start_date THEN 100
          WHEN CURRENT_DATE < start_date THEN 0
          WHEN CURRENT_DATE > end_date THEN 100
          ELSE ROUND(
            ( (CURRENT_DATE - start_date)::float / NULLIF(end_date - start_date, 0) ) * 100
          )
        END as expected_progress
      FROM ProjectMetrics
      WHERE (beneficiary_count > 0)
    `, params);
    const healthData = healthRes.rows.map(p => {
      const progress = Number(p.progress) || 0;
      const expected = Math.max(1, Number(p.expected_progress) || 0); 
      const health_score = expected > 0 
        ? Math.min(100, Math.round((progress / expected) * 100))
        : 100;
      return { ...p, health_score, progress, expected_progress: expected };
    });
    const overdueRes = await pool.query(`
      SELECT COUNT(*) as count 
      FROM field_visits v
      JOIN beneficiary b ON v.beneficiary_id = b.beneficiary_id
      WHERE v.status ILIKE 'scheduled' AND v.visit_date < CURRENT_DATE
      ${filterClause}
    `, params);
    const stagnantRes = await pool.query(`
      SELECT COUNT(*) as count
      FROM beneficiary b
      WHERE b.beneficiary_id NOT IN (
        SELECT beneficiary_id FROM progress_history 
        WHERE update_date >= CURRENT_DATE - INTERVAL '30 days'
      ) AND b.ben_status ILIKE 'active'
      ${filterClause}
    `, params);
    const loadRes = await pool.query(`
      SELECT 
        TRIM(CONCAT(u.first_name, ' ', u.last_name)) as name,
        COUNT(DISTINCT b.beneficiary_id) as active_cases,
        COUNT(DISTINCT CASE WHEN v.status = 'Completed' THEN v.visit_id END) as completed_visits,
        COUNT(DISTINCT v.visit_id) as total_visits
      FROM user_table u
      LEFT JOIN beneficiary b ON u.user_id = b.assigned_officer_id
      LEFT JOIN field_visits v ON u.user_id = v.officer_id
      WHERE u.role ILIKE 'officer' AND u.status = 'Active'
      ${filterClause}
      GROUP BY u.user_id, name
      ORDER BY active_cases DESC
    `, params);
    const resourceRes = await pool.query(`
      SELECT 
        inv.item_name as name, 
        COALESCE(inv.available_stock, 0) as stock,
        COALESCE(inv.total_stock, 1) as total_stock,
        COUNT(a.allocation_id) as allocation_count,
        COALESCE(SUM(a.quantity), 0) as total_allocated
      FROM resource_inventory inv
      LEFT JOIN resource_allocations a ON inv.inventory_id = a.inventory_id
      LEFT JOIN beneficiary b ON a.beneficiary_id = b.beneficiary_id
      WHERE 1=1 ${filterClause}
      GROUP BY inv.inventory_id, inv.item_name, inv.available_stock, inv.total_stock
    `, params);
    const actions = [];
    healthData.forEach(p => {
      if (p.health_score < 50 && p.expected_progress > 40) {
        actions.push({
          type: 'risk',
          title: `Project Stalling: ${p.name}`,
          message: `${p.name} is at ${p.progress}% progress but should be at ${p.expected_progress}% based on timeline.`,
          suggestion: 'Initiate Strategic Intervention'
        });
      }
    });
    const loads = loadRes.rows.map(r => parseInt(r.active_cases) || 0);
    const avgLoad = loads.length > 0 ? loads.reduce((a,b) => a+b, 0) / loads.length : 1;
    loadRes.rows.forEach(o => {
      const activeCases = parseInt(o.active_cases) || 0;
      if (activeCases > avgLoad * 1.6) {
        actions.push({
          type: 'warning',
          title: `Efficiency Alert: ${o.name}`,
          message: `${o.name} is carrying ${Math.round(activeCases / avgLoad * 100)}% of the average workload. Risk of burnout or delay.`,
          suggestion: 'Redistribute Assignments'
        });
      }
    });
    resourceRes.rows.forEach(r => {
      const stock = Number(r.stock);
      const total = Math.max(1, Number(r.total_stock));
      const stockLevel = (stock / total) * 100;
      if (stockLevel < 25) {
        actions.push({
          type: 'resource',
          title: `Resource Depletion: ${r.name}`,
          message: `${r.name} stock is at ${Math.round(stockLevel)}%. Predicted stock-out soon based on current mission velocity.`,
          suggestion: 'Immediate Procurement'
        });
      }
    });
    res.json({
      projectHealth: healthData,
      risks: {
        overdueVisits: parseInt(overdueRes.rows[0].count) || 0,
        stagnantBeneficiaries: parseInt(stagnantRes.rows[0].count) || 0
      },
      officerLoad: loadRes.rows,
      resourceStats: resourceRes.rows,
      suggestedActions: actions
    });
  } catch (error) {
    console.error("Decision Intel Error:", error);
    res.status(500).json({ message: 'Error calculating intelligence data', details: error.message });
  }
};
