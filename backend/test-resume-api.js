import pool from './db.js';

async function testResumeEndpoints() {
  try {
    console.log('🧪 Testing resume-related endpoints...\n');
    
    // Test data
    const testUserId = 5; // srikari user
    console.log(`Testing with user_id: ${testUserId}`);
    
    // Check if job_seeker exists for this user
    const seekerResult = await pool.query('SELECT seeker_id FROM job_seekers WHERE user_id = $1', [testUserId]);
    if (seekerResult.rows.length === 0) {
      console.log('❌ No job_seeker profile found for user');
      return;
    }
    
    const seeker_id = seekerResult.rows[0].seeker_id;
    console.log(`✅ Found job seeker with seeker_id: ${seeker_id}`);
    
    // Check if resume exists
    const resumeResult = await pool.query(
      'SELECT resume_id FROM resumes WHERE seeker_id = $1 ORDER BY is_primary DESC, resume_id DESC LIMIT 1',
      [seeker_id]
    );
    
    let resume_id;
    if (resumeResult.rows.length === 0) {
      console.log('⚠️  No resume found, creating one...');
      const newResume = await pool.query(
        'INSERT INTO resumes (seeker_id, title, statement_profile, is_primary) VALUES ($1, $2, $3, $4) RETURNING resume_id',
        [seeker_id, 'Test Resume', 'Test profile statement', true]
      );
      resume_id = newResume.rows[0].resume_id;
      console.log(`✅ Created new resume with resume_id: ${resume_id}`);
    } else {
      resume_id = resumeResult.rows[0].resume_id;
      console.log(`✅ Found existing resume with resume_id: ${resume_id}`);
    }
    
    // Test adding skills
    console.log('\\n🔧 Testing skills insertion...');
    try {
      await pool.query(
        'INSERT INTO skills (resume_id, skill_type, skills) VALUES ($1, $2, $3)',
        [resume_id, 'technical', 'JavaScript, React, Node.js']
      );
      console.log('✅ Skills inserted successfully');
    } catch (error) {
      console.log('❌ Skills insertion failed:', error.message);
      
      // Check skills table structure
      const skillsSchema = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'skills'
        ORDER BY ordinal_position
      `);
      console.log('Skills table structure:');
      skillsSchema.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }
    
    // Test adding experience
    console.log('\\n💼 Testing experience insertion...');
    try {
      await pool.query(
        'INSERT INTO experiences (resume_id, company, duration, job_title, description) VALUES ($1, $2, $3, $4, $5)',
        [resume_id, 'Test Company', '2020-2023', 'Software Developer', 'Developed web applications']
      );
      console.log('✅ Experience inserted successfully');
    } catch (error) {
      console.log('❌ Experience insertion failed:', error.message);
      
      // Check experiences table structure
      const expSchema = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'experiences'
        ORDER BY ordinal_position
      `);
      console.log('Experiences table structure:');
      expSchema.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }
    
    // Test adding education
    console.log('\\n🎓 Testing education insertion...');
    try {
      await pool.query(
        'INSERT INTO education (resume_id, qualification, college, gpa, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6)',
        [resume_id, 'B.Tech', 'Test University', '8.5', '2018-01-01', '2022-01-01']
      );
      console.log('✅ Education inserted successfully');
    } catch (error) {
      console.log('❌ Education insertion failed:', error.message);
      
      // Check education table structure
      const eduSchema = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'education'
        ORDER BY ordinal_position
      `);
      console.log('Education table structure:');
      eduSchema.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }
    
    // Final check - show all data
    console.log('\\n📊 Final data check...');
    const skills = await pool.query('SELECT * FROM skills WHERE resume_id = $1', [resume_id]);
    const experiences = await pool.query('SELECT * FROM experiences WHERE resume_id = $1', [resume_id]);
    const education = await pool.query('SELECT * FROM education WHERE resume_id = $1', [resume_id]);
    
    console.log(`Skills: ${skills.rows.length} records`);
    console.log(`Experiences: ${experiences.rows.length} records`);
    console.log(`Education: ${education.rows.length} records`);
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testResumeEndpoints();