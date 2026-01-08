import 'dotenv/config';   // Loads .env automatically in ESM
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD?.toString(),
  port: Number(process.env.DB_PORT || 5432),
});

pool.connect()
  .then(client => {
    console.log('Connected to PostgreSQL database');
    client.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
    // Do not exit — allow the server to start so non-DB endpoints and tooling can run
  });

export default pool;
