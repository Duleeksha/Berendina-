import express from 'express';
import cors from 'cors';

// METHANA WENAS KALA: '../' wenuwata './' damma
import authRoutes from './Routes/authenticationRoutes.js'; 

// METHANA WENAS KALA: '../Backend/db.js' wenuwata './db.js' damma (Mokada server.js ekayi db.js ekayi ekama thana thiyenne)
import pool from './db.js';

const app = express();

// React (Frontend) run wenne Port 3000 wala nisa, api Backend eka 5000 walata gamu.
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json()); 

// --- ROUTES ---

// 1. Auth Routes (Register & Login)
app.use("/api/auth", authRoutes);

// 2. Test Route 
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM resource");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Server Start
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});