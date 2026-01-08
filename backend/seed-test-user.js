import dotenv from 'dotenv';
import pkg from 'pg';
import bcrypt from 'bcrypt';

const { Client } = pkg;
dotenv.config();

async function seedTestUser() {
  const client = new Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    ssl: process.env.DB_HOST && process.env.DB_HOST.includes('supabase') 
      ? { rejectUnauthorized: false } 
      : false
  });

  try {
    await client.connect();
    console.log('✓ Connected to database');

    // Create test job seeker
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    
    const userResult = await client.query(
      `INSERT INTO users (email, password, role, created_at, name, phone_no) 
       VALUES ($1, $2, $3, NOW(), $4, $5) 
       ON CONFLICT (email) DO UPDATE SET password = $2
       RETURNING user_id`,
      ['test@jobseeker.com', hashedPassword, 'job_seeker', 'Test Job Seeker', '1234567890']
    );

    const userId = userResult.rows[0].user_id;

    await client.query(
      `INSERT INTO job_seekers (user_id, dob, nationality, address, age) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, '1990-01-01', 'Indian', 'Test Address', 34]
    );

    console.log('✓ Created test job seeker:');
    console.log('  Email: test@jobseeker.com');
    console.log('  Password: Test@123');

    // Create test recruiter
    const recruiterUserResult = await client.query(
      `INSERT INTO users (email, password, role, created_at, name, phone_no) 
       VALUES ($1, $2, $3, NOW(), $4, $5) 
       ON CONFLICT (email) DO UPDATE SET password = $2
       RETURNING user_id`,
      ['test@recruiter.com', hashedPassword, 'recruiter', 'Test Recruiter', '1234567890']
    );

    const recruiterUserId = recruiterUserResult.rows[0].user_id;

    await client.query(
      `INSERT INTO recruiters (user_id, company, designation) 
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO NOTHING`,
      [recruiterUserId, 'Test Company', 'HR Manager']
    );

    console.log('✓ Created test recruiter:');
    console.log('  Email: test@recruiter.com');
    console.log('  Password: Test@123');

    await client.end();
    console.log('\n✅ Test users created successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedTestUser();
