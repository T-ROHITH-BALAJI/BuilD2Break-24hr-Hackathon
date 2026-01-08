import pool from './db.js';

async function fixJobSeekersSchema() {
  try {
    console.log('Fixing job_seekers table schema...');
    
    // Remove NOT NULL constraints from optional fields
    await pool.query(`
      ALTER TABLE job_seekers 
      ALTER COLUMN dob DROP NOT NULL
    `);
    console.log('✓ Removed NOT NULL from dob');
    
    await pool.query(`
      ALTER TABLE job_seekers 
      ALTER COLUMN nationality DROP NOT NULL
    `);
    console.log('✓ Removed NOT NULL from nationality');
    
    await pool.query(`
      ALTER TABLE job_seekers 
      ALTER COLUMN address DROP NOT NULL
    `);
    console.log('✓ Removed NOT NULL from address');
    
    console.log('\n✅ Schema fixed successfully!');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('does not exist') || error.message.includes('already')) {
      console.log('Column constraint already modified or does not exist, skipping...');
      process.exit(0);
    }
    console.error('Error fixing schema:', error.message);
    process.exit(1);
  }
}

fixJobSeekersSchema();
