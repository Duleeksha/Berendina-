import pool from '../config/db.js';
async function testQuery(name, sql) {
  try {
    console.log(`Testing: ${name}...`);
    const start = Date.now();
    const res = await pool.query(sql);
    console.log(`✅ ${name} passed (${res.rowCount} rows, ${Date.now() - start}ms)`);
    return res;
  } catch (e) {
    console.error(`❌ ${name} FAILED:`, e.message);
    return null;
  }
}
async function run() {
  await testQuery('Project Pulse', `
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
        ELSE ROUND((EXTRACT(EPOCH FROM (CURRENT_DATE - start_date)) / NULLIF(EXTRACT(EPOCH FROM (end_date - start_date)), 0)) * 100)
      END as expected_progress
    FROM ProjectMetrics
    WHERE (beneficiary_count > 0 OR name IS NOT NULL)
  `);
  await testQuery('Overdue Visits', `
    SELECT COUNT(*) as count 
    FROM field_visits 
    WHERE status ILIKE 'scheduled' AND visit_date < CURRENT_DATE
  `);
  await testQuery('Stagnant Ben', `
    SELECT COUNT(*) as count
    FROM beneficiary b
    WHERE b.beneficiary_id NOT IN (
      SELECT beneficiary_id FROM progress_history 
      WHERE update_date >= CURRENT_DATE - INTERVAL '30 days'
    ) AND b.ben_status ILIKE 'active'
  `);
  await testQuery('Officer Load', `
    SELECT 
      TRIM(CONCAT(u.first_name, ' ', u.last_name)) as name,
      COUNT(DISTINCT b.beneficiary_id) as active_cases,
      COUNT(DISTINCT v.visit_id) as total_visits
    FROM user_table u
    LEFT JOIN beneficiary b ON u.user_id = b.assigned_officer_id
    LEFT JOIN field_visits v ON u.user_id = v.officer_id
    WHERE u.role ILIKE 'officer' AND u.status = 'Active'
    GROUP BY u.user_id, name
  `);
  await testQuery('Resource Velocity', `
    SELECT 
      inv.item_name as name, 
      COALESCE(inv.available_stock, 0) as stock,
      COALESCE(inv.total_stock, 1) as total_stock,
      COUNT(a.allocation_id) as allocation_count,
      COALESCE(SUM(a.quantity), 0) as total_allocated
    FROM resource_inventory inv
    LEFT JOIN resource_allocations a ON inv.inventory_id = a.inventory_id
    GROUP BY inv.inventory_id, inv.item_name, inv.available_stock, inv.total_stock
  `);
  process.exit(0);
}
run();
