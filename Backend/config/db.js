import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;
// we put our database details here so we can talk to it
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  ssl: process.env.DB_SSL === 'true'
});
// check if we can join the database party
pool.query('SELECT 1', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Successfully connected to the database!');
  }
});
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client:', err);
});
export default pool;
