import pool from './db.js';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('✓ Database connected:', result.rows[0]);
    
    console.log('\nChecking users table...');
    const users = await pool.query('SELECT user_id, email, role FROM users LIMIT 5');
    console.log('✓ Users found:', users.rows.length);
    users.rows.forEach(u => console.log(`  - ${u.email} (${u.role})`));
    
    console.log('\nChecking test user...');
    const testUser = await pool.query('SELECT * FROM users WHERE email = $1', ['test@jobseeker.com']);
    if (testUser.rows.length > 0) {
      console.log('✓ Test user exists:', testUser.rows[0].email);
    } else {
      console.log('✗ Test user NOT found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

testConnection();
