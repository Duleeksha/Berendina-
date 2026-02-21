import express from 'express';
import cors from 'cors';
 // DB Connection eka (Test route eka sadaha)
import authRoutes from '../Routes/authenticationRoutes.js'; // Api hadapu Register/Login routes
import pool from '../Backend/db.js';

const app = express();

// React (Frontend) run wenne Port 3000 wala nisa, api Backend eka 5000 walata gamu.
// Nathnam "Port already in use" kiyala error enna puluwan.
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json()); // JSON data kiyawanna puluwan wenna

// --- ROUTES ---

// 1. Auth Routes (Register & Login)
// Meka dammahama oyage register URL eka wenne: http://localhost:5000/api/auth/register
app.use("/api/auth", authRoutes);

// 2. Test Route (Resources Table Check Karanna)
// Meka thibba kiyala awulak na, oyata connection check karanna puluwan.
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