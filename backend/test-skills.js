import pool from './db.js';

async function testSkillsArray() {
  try {
    console.log('Testing skills array insertion...\n');
    
    const resume_id = 7; // existing resume
    const skills = ['JavaScript', 'React', 'Node.js', 'Python'];
    
    // First, clear existing skills for this resume
    await pool.query('DELETE FROM skills WHERE resume_id = $1', [resume_id]);
    
    console.log('Inserting skills array:', skills);
    
    await pool.query(
      'INSERT INTO skills (resume_id, skill_type, skills) VALUES ($1, $2, $3)',
      [resume_id, 'tech', skills]
    );
    
    console.log('✅ Skills inserted successfully!');
    
    // Verify
    const result = await pool.query('SELECT * FROM skills WHERE resume_id = $1', [resume_id]);
    console.log('Retrieved skills:', result.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

testSkillsArray();