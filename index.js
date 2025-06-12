const express = require('express');
const mysql = require('mysql2');
const authRoutes = require('./routes/auth'); // make sure this file exists
const app = express();

app.use(express.json()); // for parsing application/json

// ✅ MySQL connection setup
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1424', // replace with your MySQL password
  database: 'user_profile' // replace with your actual database name
});

db.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection failed:', err.message);
  } else {
    console.log('✅ Connected to MySQL database');
    app.locals.db = db;

    // Optional: Generate user ID function
    app.locals.generateUserId = () => 'UID' + Date.now();
  }
});

// ✅ Use Auth Routes
app.use('/api', authRoutes);

// ✅ Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
