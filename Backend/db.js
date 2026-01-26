const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "127.0.0.1",
  database: "berendina_db",
  password: "9966",
  port: 5432,
  ssl: false
});

// Me pool eka anith files walata use karanna puluwan wenna export karanawa
module.exports = pool;