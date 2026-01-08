import dotenv from 'dotenv';
import pkg from 'pg';
import bcrypt from 'bcrypt';

const { Client } = pkg;
dotenv.config();

async function createAdmin() {
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
    
    const hashedPassword = await bcrypt.hash('Password123', 10);
    
    await client.query(
      `INSERT INTO admins (name, email, password) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (email) DO UPDATE SET password = $3`,
      ['Admin User', 'admin@test.com', hashedPassword]
    );
    
    console.log('✓ Admin user created/updated:');
    console.log('  Email: admin@test.com');
    console.log('  Password: Password123');
    
    await client.end();
    console.log('\n✅ Admin creation complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
