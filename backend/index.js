require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const emailRoutes = require('./routes/email');
const uploadRoutes = require('./routes/upload');
const backupRoutes = require('./routes/backup');
const staffRoutes = require('./routes/staff');
const hotelRoutes = require('./routes/hotel');
const { startBackupScheduler } = require('./jobs/backupScheduler');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()) : ['http://localhost:3000'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/email', emailRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/hotel', hotelRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/backup/trigger', async (req, res) => {
  try {
    const { performBackup } = require('./jobs/backupScheduler');
    await performBackup();
    res.json({ success: true, message: 'Backup triggered manually' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Otel.Pro backend running on http://localhost:${PORT}`);
  startBackupScheduler();
});
