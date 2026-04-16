import app from './server.js';
import listEndpoints from 'express-list-endpoints';
console.log(JSON.stringify(listEndpoints(app), null, 2));
process.exit();
