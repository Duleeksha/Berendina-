import pool from '../config/db.js';
async function deduplicate() {
  try {
    console.log('Starting officer deduplication...');
    const res = await pool.query("SELECT user_id, first_name, last_name, email FROM user_table WHERE role = 'officer'");
    const officers = res.rows;
    const groups = {};
    officers.forEach(o => {
      const nameKey = (o.first_name + ' ' + o.last_name).toLowerCase().trim();
      if (!groups[nameKey]) groups[nameKey] = [];
      groups[nameKey].push(o);
    });
    for (const name in groups) {
      const group = groups[name];
      if (group.length > 1) {
        console.log(`\nFound duplicates for: ${name}`);
        group.sort((a, b) => a.user_id - b.user_id);
        const main = group[0];
        const duplicates = group.slice(1);
        const duplicateIds = duplicates.map(d => d.user_id);
        console.log(`- Main ID: ${main.user_id} (${main.email})`);
        console.log(`- Duplicate IDs to remove: ${duplicateIds.join(', ')}`);
        const benRes = await pool.query(
          "UPDATE beneficiary SET assigned_officer_id = $1 WHERE assigned_officer_id IN (" + duplicateIds.join(',') + ")",
          [main.user_id]
        );
        console.log(`  - Migrated ${benRes.rowCount} beneficiaries.`);
        const visitRes = await pool.query(
          "UPDATE field_visits SET officer_id = $1 WHERE officer_id IN (" + duplicateIds.join(',') + ")",
          [main.user_id]
        );
        console.log(`  - Migrated ${visitRes.rowCount} field visits.`);
        await pool.query("DELETE FROM officer_details WHERE user_id IN (" + duplicateIds.join(',') + ")");
        console.log('  - Deleted duplicate officer details.');
        await pool.query("DELETE FROM user_table WHERE user_id IN (" + duplicateIds.join(',') + ")");
        console.log('  - Deleted duplicate users.');
      }
    }
    console.log('\nDeduplication complete!');
  } catch (err) {
    console.error('Deduplication failed:', err.message);
  } finally {
    process.exit();
  }
}
deduplicate();
