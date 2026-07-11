const fs = require('fs');
const path = require('path');
const https = require('https');

const dataDir = path.join(__dirname, '..', 'data');
const BACKUP_INTERVAL = 6 * 60 * 60 * 1000;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function performBackup() {
  ensureDir(dataDir);
  const timestamp = new Date().toISOString();
  const backup = {
    timestamp,
    tables: {},
  };

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (supabaseUrl && supabaseKey) {
      const tables = ['rooms', 'bookings', 'guests', 'invoices', 'payments', 'quotes', 'food_orders', 'cleaning_requests', 'profiles'];

      for (const table of tables) {
        try {
          const data = await fetchFromSupabase(supabaseUrl, supabaseKey, table);
          backup.tables[table] = data;

          const filePath = path.join(dataDir, `${table}.json`);
          fs.writeFileSync(filePath, JSON.stringify({ table, rows: data, updatedAt: timestamp }, null, 2));
        } catch (err) {
          console.error(`Backup failed for ${table}:`, err.message);
        }
      }

      const manifestPath = path.join(dataDir, 'backup-manifest.json');
      const manifests = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : [];
      manifests.push({ timestamp, tables: Object.keys(backup.tables) });
      if (manifests.length > 50) manifests.shift();
      fs.writeFileSync(manifestPath, JSON.stringify(manifests, null, 2));

      console.log(`[Backup] Completed at ${timestamp}`);
    }
  } catch (err) {
    console.error('[Backup] Error:', err.message);
  }
}

function fetchFromSupabase(url, key, table) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.replace(/https?:\/\//, ''),
      path: `/rest/v1/${table}?select=*`,
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function startBackupScheduler() {
  console.log('[Backup] Scheduler started (every 6 hours)');
  performBackup();
  setInterval(performBackup, BACKUP_INTERVAL);
}

module.exports = { startBackupScheduler, performBackup };
