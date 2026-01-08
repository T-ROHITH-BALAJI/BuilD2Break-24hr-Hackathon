import pool from './db.js';

async function fixApplicationStatus() {
  try {
    // Check current statuses
    const res = await pool.query('SELECT application_id, status FROM applications');
    console.log('Current applications:', res.rows);
    
    // Update NULL or empty statuses to 'applied'
    const upd = await pool.query(`UPDATE applications SET status = 'applied' WHERE status IS NULL OR status = ''`);
    console.log('Updated rows:', upd.rowCount);
    
    // Verify
    const verify = await pool.query('SELECT application_id, status FROM applications');
    console.log('After fix:', verify.rows);
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

fixApplicationStatus();
