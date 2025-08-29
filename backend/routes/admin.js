// routes/admin.js
const express = require('express');
const router = express.Router();

// Example admin route
router.get('/dashboard', (req, res) => {
  res.json({ message: 'Admin dashboard route' });
});

// Add your admin routes here...

module.exports = router;
