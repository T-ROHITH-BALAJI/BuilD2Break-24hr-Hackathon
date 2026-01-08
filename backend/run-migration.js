import pool from './db.js';
import fs from 'fs';

async function runMigration() {
  try {
    console.log('Running profile schema migration...\n');
    
    const migrationSQL = fs.readFileSync('enhance-profile-schema.sql', 'utf8');
    
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Show updated schema
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'job_seekers'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Updated job_seekers table structure:');
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check new tables
    const tables = ['job_seeker_social_links', 'skills_profile', 'education_profile'];
    for (const table of tables) {
      try {
        const count = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ Table '${table}' created successfully (${count.rows[0].count} records)`);
      } catch (error) {
        console.log(`❌ Table '${table}' error:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

runMigration();