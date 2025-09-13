const mysql = require('mysql2');
const fs = require('fs');
require('dotenv').config();

const caPath = process.env.DB_CA_PATH || './ca.pem'; 
const ssl = fs.existsSync(caPath) ? { ca: fs.readFileSync(caPath) } : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl
});

module.exports = pool.promise();
