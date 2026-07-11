const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

router.post('/', (req, res) => {
  try {
    ensureDataDir();
    const { table, rows } = req.body;
    if (!table || !rows) return res.status(400).json({ error: 'table and rows required' });
    const filePath = path.join(dataDir, `${table}.json`);
    fs.writeFileSync(filePath, JSON.stringify({ table, rows, updatedAt: new Date().toISOString() }, null, 2));
    res.json({ success: true, table, rowCount: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:table', (req, res) => {
  try {
    ensureDataDir();
    const filePath = path.join(dataDir, `${req.params.table}.json`);
    if (!fs.existsSync(filePath)) return res.json({ table: req.params.table, rows: [] });
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
