const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcrypt'); // added bcrypt
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Create users table if not exists
const createTableQuery = `
CREATE TABLE IF NOT EXISTS users (
  userId INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  age INT,
  dob DATE,
  gender ENUM('Male','Female','Other'),
  weight FLOAT,
  height FLOAT
);`;

db.query(createTableQuery)
  .then(() => console.log("Users table ready"))
  .catch(err => console.log("Error creating table:", err));

// ---------------- Routes ---------------- //

// Get all users
app.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM users");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login route (check email + password with bcrypt)
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    res.json({ success: true, message: "Login successful", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single user by ID
app.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE userId = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new user (hash password before saving)
app.post('/users', async (req, res) => {
  const { name, email, password, age, dob, gender, weight, height } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      "INSERT INTO users (name, email, password, age, dob, gender, weight, height) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [name, email, hashedPassword, age, dob, gender, weight, height]
    );
    res.status(201).json({ userId: result.insertId, message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user (re-hash password if provided)
app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, password, age, dob, gender, weight, height } = req.body;

  try {
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const [result] = await db.query(
      "UPDATE users SET name=?, email=?, password=IFNULL(?, password), age=?, dob=?, gender=?, weight=?, height=? WHERE userId=?",
      [name, email, hashedPassword, age, dob, gender, weight, height, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM users WHERE userId=?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
