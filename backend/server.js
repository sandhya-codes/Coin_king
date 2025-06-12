const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();
const PORT = 4000; // Your frontend is trying to connect to PORT 4000

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1424',
  database: 'user_profile'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('✅ Connected to MySQL database.');
});

// Signup route
app.post('/api/signup', (req, res) => {
  const { username, phone, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  const userId = "CK" + Date.now(); // Generating a unique user ID

  const checkUserQuery = `SELECT * FROM users WHERE email = ?`;
  db.query(checkUserQuery, [email], (err, results) => {
    if (err) {
      console.error("❌ Error checking user:", err.message);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Ensure your table columns match: user_id, name, email, phone, password
    const insertUserQuery = `INSERT INTO users (user_id, name, email, phone, password) VALUES (?, ?, ?, ?, ?)`;
    db.query(insertUserQuery, [userId, username, email, phone, password], (err, result) => {
      if (err) {
        console.error("❌ Error inserting user:", err.message);
        return res.status(500).json({ message: "Failed to register user" });
      }

      res.status(200).json({ message: "Signup successful", userId });
    });
  });
});

// ✅ Login route
app.post('/api/login', (req, res) => {
  const { userId, password } = req.body;

  const query = 'SELECT * FROM users WHERE user_id = ? AND password = ?';
  db.query(query, [userId, password], (err, results) => {
    if (err) {
      console.error("❌ Login error:", err.message);
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid User ID or Password" });
    }

    // You might want to send more user details back on successful login,
    // like username, email, etc., to populate the client-side profile.
    const user = results[0];
    res.status(200).json({
      message: "Login successful",
      userId: user.user_id,
      username: user.name, // Assuming 'name' column for username
      email: user.email,
      phone: user.phone
    });
  });
});

// ⭐ NEW: API Endpoint to get all users for the Admin Dashboard ⭐
app.get('/api/all-users', (req, res) => {
  // Make sure your table name is 'users' and column names are 'user_id', 'name', 'email', 'phone'
  const query = 'SELECT user_id AS id, name AS username, email, phone FROM users ORDER BY user_id ASC';
  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error fetching all users:", err.message);
      return res.status(500).json({ message: "Failed to retrieve user data" });
    }
    // Rename 'user_id' to 'id' and 'name' to 'username' to match frontend expectation
    // This is handled in the SQL query with AS aliases
    res.status(200).json(results);
  });
});


// ⭐ NEW: Placeholder for /api/all-transactions ⭐
// You'll need to implement the actual logic for fetching transactions
app.get('/api/all-transactions', (req, res) => {
    // This is a placeholder. You'll need a 'transactions' table in your DB
    // and query it similar to how you fetch users.
    console.log("Attempting to fetch all transactions (endpoint placeholder)");
    // Example:
    // const query = 'SELECT id, user_id, type, amount, status, created_at FROM transactions ORDER BY created_at DESC';
    // db.query(query, (err, results) => {
    //     if (err) {
    //         console.error("❌ Error fetching all transactions:", err.message);
    //         return res.status(500).json({ message: "Failed to retrieve transaction data" });
    //     }
    //     res.status(200).json(results);
    // });
    res.status(501).json({ message: "Transaction history endpoint not yet fully implemented on the server." });
});


// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});