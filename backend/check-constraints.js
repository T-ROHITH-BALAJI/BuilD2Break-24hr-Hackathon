import pool from './db.js';

async function checkConstraints() {
  try {
    console.log('Checking skills table constraints...\n');
    
    // Get constraints
    const constraints = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'skills'::regclass
    `);
    
    console.log('Constraints:');
    constraints.rows.forEach(constraint => {
      console.log(`- ${constraint.conname}: ${constraint.definition}`);
    });
    
    // Also check table definition
    console.log('\nTable definition:');
    const tableDef = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'skills'
      ORDER BY ordinal_position
    `);
    
    tableDef.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Try to see what skill_type values are allowed
    console.log('\nTrying different skill_type values...');
    
    const testValues = ['technical', 'soft', 'programming', 'other'];
    
    for (const value of testValues) {
      try {
        await pool.query('INSERT INTO skills (resume_id, skill_type, skills) VALUES ($1, $2, $3)', 
          [7, value, ['test']]);
        console.log(`✅ '${value}' - accepted`);
        // Clean up
        await pool.query('DELETE FROM skills WHERE resume_id = $1 AND skill_type = $2', [7, value]);
      } catch (error) {
        console.log(`❌ '${value}' - rejected: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkConstraints();