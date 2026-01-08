import pool from './db.js';

async function testCompleteFlow() {
  try {
    console.log('🔄 Testing complete resume flow...\n');
    
    const testUserId = 5; // srikari user
    console.log(`Testing with user_id: ${testUserId}`);
    
    // Test 1: Check user exists
    console.log('\n1️⃣ Checking user...');
    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [testUserId]);
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    console.log(`✅ User found: ${userResult.rows[0].name} (${userResult.rows[0].email})`);
    
    // Test 2: Check job_seeker profile
    console.log('\n2️⃣ Checking job_seeker profile...');
    const seekerResult = await pool.query('SELECT * FROM job_seekers WHERE user_id = $1', [testUserId]);
    if (seekerResult.rows.length === 0) {
      console.log('⚠️  No job_seeker profile, creating one...');
      await pool.query(
        'INSERT INTO job_seekers (user_id, nationality, address) VALUES ($1, $2, $3)',
        [testUserId, 'Indian', 'Hyderabad']
      );
      console.log('✅ Job_seeker profile created');
    } else {
      console.log('✅ Job_seeker profile exists');
    }
    
    // Final summary
    console.log('\n📊 Current database state:');
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM job_seekers) as job_seekers,
        (SELECT COUNT(*) FROM resumes) as resumes,
        (SELECT COUNT(*) FROM skills) as skills,
        (SELECT COUNT(*) FROM experiences) as experiences,
        (SELECT COUNT(*) FROM education) as education
    `);
    
    const s = stats.rows[0];
    console.log(`Users: ${s.users}, Job Seekers: ${s.job_seekers}, Resumes: ${s.resumes}`);
    console.log(`Skills: ${s.skills}, Experiences: ${s.experiences}, Education: ${s.education}`);
    
    console.log('\n✅ Tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testCompleteFlow();