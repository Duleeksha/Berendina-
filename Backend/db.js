require('dotenv').config();

const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  ssl: process.env.DB_SSL === 'true'
});

// Test database connection on startup
pool.query('SELECT 1', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Successfully connected to the database!');
  }
});

// Handle connection errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client:', err);
});

// Me pool eka anith files walata use karanna puluwan wenna export karanawa
module.exports = pool;