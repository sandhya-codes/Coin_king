const express = require('express');
const bcrypt = require("bcryptjs");
const mysql = require("mysql2");  // ✅ Using mysql2
const router = express.Router();
const { sendEmail } = require("../utils/mailer");

// ✅ MySQL Connection Setup
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1424',       // 🔁 Change this
  database: 'user_profile'         // ✅ Your DB name
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection error:", err.message);
  } else {
    console.log("✅ Connected to MySQL");
  }
});

// ✅ Helper Function to Generate User ID
const generateUserId = () => 'USER' + Date.now();

// ✅ Signup Route
router.post('/signup', async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const userId = generateUserId();
  console.log("🔁 Signup attempt:", { name, email, phone });

  try {
    // 🔍 Check if user exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
        console.error("❌ DB error:", err.message);
        return res.status(500).json({ message: 'Database error' });
      }

      if (results.length > 0) {
        console.log("⚠️ User already exists:", email);
        return res.status(400).json({ message: 'User already exists' });
      }

      // 🔐 Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 📝 Insert user
      db.query(
        'INSERT INTO users (user_id, name, email, phone, password) VALUES (?, ?, ?, ?, ?)',
        [userId, name, email, phone, hashedPassword],
        async (err, result) => {
          if (err) {
            console.error("❌ Insert error:", err.message);
            return res.status(500).json({ message: 'Signup failed' });
          }

          // 📧 Send email
          const userMail = await sendEmail(
            email,
            "🎉 Welcome to Coin King",
            `<h2>Hi ${name}!</h2><p>Your account (ID: <strong>${userId}</strong>) has been created.</p>`
          );

          const adminMail = await sendEmail(
            "ncsupritha@gmail.com",
            "📥 New User Signup",
            `<p>User <strong>${name}</strong> (${email}) just signed up.</p>`
          );

          if (!userMail || !adminMail) {
            console.warn("⚠️ Email sending failed");
          } else {
            console.log("✅ Emails sent");
          }

          console.log("✅ Signup complete");
          res.status(200).json({ message: 'Signup successful', userId });
        }
      );
    });
  } catch (err) {
    console.error("❌ Signup error:", err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ✅ Login Route
router.post('/login', (req, res) => {
  const { userId, password } = req.body;

  db.query(
    'SELECT * FROM users WHERE user_id = ? OR email = ? OR phone = ?',
    [userId, userId, userId],
    async (err, results) => {
      if (err || results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      res.json({ message: "Login successful", user });
    }
  );
});

module.exports = router;
