import pool from './db.js';

async function cleanupDuplicates() {
  try {
    console.log('🧹 Cleaning up duplicate records...\n');
    
    // Clean up duplicate experiences
    console.log('Cleaning experiences...');
    const dupExperiences = await pool.query(`
      DELETE FROM experiences 
      WHERE experience_id NOT IN (
        SELECT MIN(experience_id) 
        FROM experiences 
        GROUP BY resume_id, company, job_title, duration, description
      )
    `);
    console.log(`✅ Removed ${dupExperiences.rowCount} duplicate experiences`);
    
    // Clean up duplicate education records
    console.log('Cleaning education...');
    const dupEducation = await pool.query(`
      DELETE FROM education 
      WHERE education_id NOT IN (
        SELECT MIN(education_id) 
        FROM education 
        GROUP BY resume_id, qualification, college, gpa
      )
    `);
    console.log(`✅ Removed ${dupEducation.rowCount} duplicate education records`);
    
    // Clean up duplicate skills (keep latest)
    console.log('Cleaning skills...');
    const dupSkills = await pool.query(`
      DELETE FROM skills 
      WHERE skill_id NOT IN (
        SELECT MAX(skill_id) 
        FROM skills 
        GROUP BY resume_id, skill_type
      )
    `);
    console.log(`✅ Removed ${dupSkills.rowCount} duplicate skills records`);
    
    // Show final counts
    console.log('\n📊 Final record counts:');
    const counts = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM experiences) as experiences,
        (SELECT COUNT(*) FROM education) as education,
        (SELECT COUNT(*) FROM skills) as skills,
        (SELECT COUNT(*) FROM resumes) as resumes
    `);
    
    const c = counts.rows[0];
    console.log(`Experiences: ${c.experiences}`);
    console.log(`Education: ${c.education}`);
    console.log(`Skills: ${c.skills}`);
    console.log(`Resumes: ${c.resumes}`);
    
    console.log('\n🎉 Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    process.exit(0);
  }
}

cleanupDuplicates();