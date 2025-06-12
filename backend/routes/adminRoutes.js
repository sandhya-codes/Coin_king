
module.exports = (app) => {
  const express = require('express');
  const router = express.Router();

  router.get('/users', (req, res) => {
    const db = app.locals.db;

    db.all('SELECT user_id, name, email FROM users', [], (err, rows) => {
      if (err) {
        console.error('DB error:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    });
  });
  return router;
};
