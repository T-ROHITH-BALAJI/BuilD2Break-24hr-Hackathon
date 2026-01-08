import pool from './db.js';

async function testDatabase() {
  try {
    console.log('Testing database connection and schema...\n');
    
    // Check if tables exist
    const tables = ['users', 'job_seekers', 'resumes', 'experiences', 'skills', 'education'];
    
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ Table '${table}' exists with ${result.rows[0].count} records`);
      } catch (error) {
        console.log(`❌ Table '${table}' error:`, error.message);
      }
    }
    
    // Check job_seekers table structure
    console.log('\n📊 Checking job_seekers table structure...');
    try {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'job_seekers'
        ORDER BY ordinal_position
      `);
      console.log('Job_seekers columns:');
      result.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    } catch (error) {
      console.log('Error checking job_seekers structure:', error.message);
    }
    
    // Check resumes table structure  
    console.log('\n📊 Checking resumes table structure...');
    try {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'resumes'
        ORDER BY ordinal_position
      `);
      console.log('Resumes columns:');
      result.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    } catch (error) {
      console.log('Error checking resumes structure:', error.message);
    }
    
    console.log('\n🔍 Testing actual data...');
    
    // Check users
    try {
      const users = await pool.query('SELECT user_id, name, email, role FROM users LIMIT 5');
      console.log(`Users (${users.rows.length}):`, users.rows);
    } catch (error) {
      console.log('Error fetching users:', error.message);
    }
    
    // Check job_seekers
    try {
      const seekers = await pool.query('SELECT * FROM job_seekers LIMIT 5');
      console.log(`Job seekers (${seekers.rows.length}):`, seekers.rows);
    } catch (error) {
      console.log('Error fetching job_seekers:', error.message);
    }
    
    // Check resumes
    try {
      const resumes = await pool.query('SELECT resume_id, seeker_id, title, file_name FROM resumes LIMIT 5');
      console.log(`Resumes (${resumes.rows.length}):`, resumes.rows);
    } catch (error) {
      console.log('Error fetching resumes:', error.message);
    }
    
  } catch (error) {
    console.error('Database test failed:', error);
  } finally {
    process.exit(0);
  }
}

testDatabase();