import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/db.js';

import authRoutes from './Routes/authRoutes.js';
import beneficiaryRoutes from './Routes/beneficiaryRoutes.js';
import visitRoutes from './Routes/visitRoutes.js';
import resourceRoutes from './Routes/resourceRoutes.js';
import projectRoutes from './Routes/projectRoutes.js';
import analyticsRoutes from './Routes/analyticsRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json()); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- ROUTES ---

// --- STANDARDIZED API ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/beneficiaries", beneficiaryRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/analytics", analyticsRoutes);

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