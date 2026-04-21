/**
 * THIS IS THE MAIN ENGINE FOR OUR BACKEND.
 * Everything starts from here! We setup the server, add security with CORS,
 * and define all the 'roads' (routes) where our app can talk to the database.
 */
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


app.use(cors());
app.use(express.json()); 


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use("/api/auth", authRoutes);
app.use("/api/beneficiaries", beneficiaryRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/analytics", analyticsRoutes);


app.use((req, res) => {  
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});


app.use((err, req, res, next) => {  
  console.error('SERVER ERROR:', err);  
  res.status(500).json({     
    message: 'Internal Server Error',     
    error: err.message,    
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined  
  });
});


app.listen(port, () => {  
  console.log(`Server running at http://localhost:${port}`);
});