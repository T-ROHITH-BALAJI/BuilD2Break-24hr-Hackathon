import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  console.log('\n🚀 Setting up Job Portal Database...\n');
  
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✓ Connected to Supabase database');

    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('\n📋 Creating tables...');
    await client.query(schema);
    console.log('✓ All tables created successfully');

    // Run migrations
    const migrationsDir = path.join(__dirname);
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.startsWith('migration_') && f.endsWith('.sql'))
      .sort();

    if (migrationFiles.length > 0) {
      console.log('\n🔄 Running migrations...');
      for (const file of migrationFiles) {
        const migrationPath = path.join(migrationsDir, file);
        const migration = fs.readFileSync(migrationPath, 'utf8');
        await client.query(migration);
        console.log(`✓ ${file}`);
      }
    }

    console.log('\n✅ Database setup complete!');
    console.log('\n📊 Your Job Portal database is ready!\n');

  } catch (error) {
    console.error('\n❌ Error setting up database:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\n✓ Tables already exist - database is ready!');
    } else {
      throw error;
    }
  } finally {
    await client.end();
  }
}

setupDatabase().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
