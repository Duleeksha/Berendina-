import pool from '../config/db.js';

/**
 * Aggregates high-level mission intelligence for executive decision support.
 */
export const getExecutiveIntelligence = async (req, res) => {
  try {
    const { district, project } = req.query;
    let params = [];
    let pIdx = 1;

    // --- 1. PROJECT HEALTH (Avg Progress per Project) ---
    // Join latest progress with project names
    const healthRes = await pool.query(`
      WITH LatestProgress AS (
        SELECT DISTINCT ON (beneficiary_id) beneficiary_id, progress_value, update_date
        FROM progress_history
        ORDER BY beneficiary_id, update_date DESC
      )
      SELECT 
        b.ben_project as name, 
        ROUND(AVG(COALESCE(lp.progress_value, 0))) as health_score,
        COUNT(b.beneficiary_id) as beneficiary_count
      FROM beneficiary b
      LEFT JOIN LatestProgress lp ON b.beneficiary_id = lp.beneficiary_id
      WHERE b.ben_project IS NOT NULL
      GROUP BY b.ben_project
      ORDER BY health_score ASC
    `);

    // --- 2. RISK RADAR (Identify Bottlenecks) ---
    // a. Overdue Visits
    const overdueRes = await pool.query(`
      SELECT COUNT(*) as count 
      FROM field_visits 
      WHERE status ILIKE 'scheduled' AND visit_date < CURRENT_DATE
    `);

    // b. Stagnant Beneficiaries (No update in 30 days)
    const stagnantRes = await pool.query(`
      SELECT COUNT(*) as count
      FROM beneficiary b
      WHERE b.beneficiary_id NOT IN (
        SELECT beneficiary_id FROM progress_history 
        WHERE update_date >= CURRENT_DATE - INTERVAL '30 days'
      ) AND b.ben_status ILIKE 'active'
    `);

    // --- 3. OFFICER LOAD HEATMAP ---
    const loadRes = await pool.query(`
      SELECT 
        TRIM(CONCAT(u.first_name, ' ', u.last_name)) as name,
        COUNT(b.beneficiary_id) as active_cases
      FROM user_table u
      LEFT JOIN beneficiary b ON u.user_id = b.assigned_officer_id
      WHERE u.role ILIKE 'officer' AND u.status = 'Active'
      GROUP BY name
      ORDER BY active_cases DESC
    `);

    // --- 4. RESOURCE VELOCITY (Stock Ratio) ---
    const resourceRes = await pool.query(`
      SELECT 
        res_name as name, 
        quantity as stock,
        (SELECT COUNT(*) FROM resource WHERE res_name = r.res_name AND allocated_to IS NOT NULL) as allocated
      FROM resource r
    `);

    // --- 5. GENERATE SMART ACTIONS ---
    const actions = [];
    
    // Project Logic
    healthRes.rows.forEach(p => {
      if (p.health_score < 30 && p.beneficiary_count > 5) {
        actions.push({
          id: `proj-${p.name}`,
          type: 'risk',
          title: `Stagnant Project: ${p.name}`,
          message: `Project health is at ${p.health_score}%. Consider a mid-term review.`,
          suggestion: 'Initiate Strategic Review'
        });
      }
    });

    // Load Logic
    const avgLoad = loadRes.rows.reduce((acc, o) => acc + parseInt(o.active_cases), 0) / (loadRes.rows.length || 1);
    loadRes.rows.forEach(o => {
      if (o.active_cases > avgLoad * 1.5) {
        actions.push({
          id: `load-${o.name}`,
          type: 'warning',
          title: `High Load: ${o.name}`,
          message: `${o.name} is managing ${o.active_cases} cases (Avg is ${Math.round(avgLoad)}).`,
          suggestion: 'Rebalance Workload'
        });
      }
    });

    // Resource Logic
    resourceRes.rows.forEach(r => {
      if (r.stock < 10) {
        actions.push({
          id: `res-${r.name}`,
          type: 'resource',
          title: `Low Stock: ${r.name}`,
          message: `Only ${r.stock} items remaining in inventory.`,
          suggestion: 'Procure Stock'
        });
      }
    });

    res.json({
      projectHealth: healthRes.rows,
      risks: {
        overdueVisits: parseInt(overdueRes.rows[0].count),
        stagnantBeneficiaries: parseInt(stagnantRes.rows[0].count)
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
