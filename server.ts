import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';

app.use(cors());
app.use(express.json());

// Initialize SQLite Database
const db = new Database('inventory.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    manager_code TEXT,
    role TEXT,
    name TEXT,
    email TEXT,
    phone TEXT,
    password TEXT,
    username TEXT,
    status TEXT,
    permissions TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    manager_code TEXT,
    name TEXT,
    barcode TEXT,
    purchase_price REAL,
    sell_price REAL,
    quantity INTEGER
  );

  CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    manager_code TEXT,
    invoice_number INTEGER,
    total_amount REAL,
    total_items INTEGER,
    discount REAL,
    created_at TEXT,
    created_by TEXT
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT,
    product_id TEXT,
    quantity INTEGER,
    price REAL,
    total REAL
  );

  CREATE TABLE IF NOT EXISTS debts (
    id TEXT PRIMARY KEY,
    manager_code TEXT,
    person_name TEXT,
    amount REAL,
    paid REAL,
    details TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    manager_code TEXT,
    action TEXT,
    details TEXT,
    executor_name TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    manager_code TEXT,
    plan TEXT,
    expiry_date TEXT
  );

  CREATE TABLE IF NOT EXISTS activation_codes (
    code TEXT PRIMARY KEY,
    type TEXT,
    used_by TEXT,
    used_at TEXT,
    expiry_date TEXT,
    valid INTEGER
  );
`);

// Insert initial activation codes if not exists
const insertCode = db.prepare('INSERT OR IGNORE INTO activation_codes (code, type, valid) VALUES (?, ?, ?)');
const monthlyCodes = [
  'A7D9K3P1Q8Z2', 'B4F6L8R0S3N7', 'C2M5T9V1X4Y8', 'D9Q1Z6H3W7K2', 'E3N7A4J8P0L5',
  'F8R2S6B1V9M4', 'G1K9P5X2T7C8', 'H6L3Z8Q0N5Y1', 'J2V7M4R9S1K6', 'K5P8T2A9D3F1',
  'L9X1C6V4B7N2', 'M3S7Q0H4J8P6', 'N4Y2K9Z5R1T7', 'P7B1M8L3S4Q9', 'Q0D6F2V9X3K5',
  'R8N5A1P7Z4M2', 'S2K4T9B6V1Q7', 'T6P3R8X0L5N1', 'V1Z9M4S2K7Q6', 'W3A8D5P1R9L2',
  'X9C2V6B4T1K7', 'Y5Q1N7M3S8P2', 'Z2K7P9X4D1V6', '0A9B8C7D6E5F', '1G4H7J2K9L0M'
];
const yearlyCodes = [
  'G5H8K2L9Q3A1', 'J7M3P0R8S6D4', 'T9C2F8B1W5E7', 'Z6Y1H3X0Q4J9', 'A4B7C9D2E1F8',
  'L8N2K5Q7J3R0', 'P1S9T6V3Z4M2', 'R5X8W0Y2H6J1', 'Q3D7F1G9L0K8', 'H2K6M3P5N1T4',
  'S8J1Q2B4R7X0', 'V4W5E9K1T3C6', 'F0G3H7J2L8M1', 'N9P4R6S1T2V5', 'K1L8M0N3Q6H7',
  'T2C5D8F9W1J3', 'X3Y6Z2A4B9P0', 'J0K1L4M7N8Q5', 'E8F2G1H9K3R6', 'D7C5B3A2W9X0',
  'M2N4O8P1Q6R5', 'H3J5K7L9T0V2', 'P8Q1R4S3T6W7', 'Z0Y2X5A8B1C4', 'F6G9H0J2K4L7',
  'R1S3T5U8V9W0', 'K7L1M4N2P5Q3', 'C9D0E6F1G8H4', 'W5X2Y3Z1A9B7', 'Q8R0S4T5U6V1',
  'T3U5V8W1X9Y0', 'N6O7P2Q4R3S1', 'L0M1N5O8P9Q6', 'J7K9L1M2N4T5', 'B2C4D6E8F0G3',
  'X4Y6Z8A0B1C9', 'H1J3K5L7M9N2', 'P3Q5R7S9T0V4', 'D8E0F2G4H1J6', 'R6T9U2V5W1X3',
  'K4M8N0P2Q7S5', 'A5B7C9D1E3F8', 'W2X4Y6Z8A0B9', 'J0K3L5M7N8P2', 'H9I2J4K6L0M3',
  'V8W0X2Y4Z6A1', 'S1T3U5V7W9X0', 'Q2R4S6T8U0V1', 'K5L7M9N1P3Q8', 'C0D2E4F6G8H3'
];

db.transaction(() => {
  for (const code of monthlyCodes) insertCode.run(code, 'monthly', 1);
  for (const code of yearlyCodes) insertCode.run(code, 'yearly', 1);
})();

// API Routes

// Keep-alive API
app.get('/api/keep-alive', (req, res) => {
  res.json({ status: 'awake' });
});

app.post('/api/keep-alive', (req, res) => {
  res.json({ status: 'server-active', timestamp: new Date().toISOString() });
});

// Middleware to verify token
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Auth Routes
app.post('/api/auth/manager/create', (req, res) => {
  const managerCode = Math.random().toString(36).substring(2, 9).toUpperCase();
  const id = uuidv4();
  
  db.prepare('INSERT INTO users (id, manager_code, role, status, permissions) VALUES (?, ?, ?, ?, ?)').run(
    id, managerCode, 'manager', 'active', 'all'
  );

  const token = jwt.sign({ id, managerCode, role: 'manager' }, JWT_SECRET);
  res.json({ token, managerCode, user: { id, role: 'manager', managerCode } });
});

app.post('/api/auth/manager/update-profile', authenticate, async (req: any, res: any) => {
  const { email, password, username, phone } = req.body;
  const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
  
  const updates = [];
  const values = [];
  if (email) { updates.push('email = ?'); values.push(email); }
  if (hashedPassword) { updates.push('password = ?'); values.push(hashedPassword); }
  if (username) { updates.push('username = ?'); values.push(username); }
  if (phone) { updates.push('phone = ?'); values.push(phone); }
  
  if (updates.length > 0) {
    values.push(req.user.id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }
  res.json({ success: true });
});

app.post('/api/auth/manager/change-code', authenticate, (req: any, res: any) => {
  if (req.user.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });
  
  const newCode = Math.random().toString(36).substring(2, 9).toUpperCase();
  
  db.transaction(() => {
    db.prepare('UPDATE users SET manager_code = ? WHERE manager_code = ?').run(newCode, req.user.managerCode);
    db.prepare('UPDATE products SET manager_code = ? WHERE manager_code = ?').run(newCode, req.user.managerCode);
    db.prepare('UPDATE sales SET manager_code = ? WHERE manager_code = ?').run(newCode, req.user.managerCode);
    db.prepare('UPDATE debts SET manager_code = ? WHERE manager_code = ?').run(newCode, req.user.managerCode);
    db.prepare('UPDATE audit_logs SET manager_code = ? WHERE manager_code = ?').run(newCode, req.user.managerCode);
    db.prepare('UPDATE subscriptions SET manager_code = ? WHERE manager_code = ?').run(newCode, req.user.managerCode);
    
    // Invalidate sessions by updating status or we can just rely on the new code in token being different
    // For simplicity, we just change the code. Employees with old code in token will fail if we check DB.
  })();

  const token = jwt.sign({ id: req.user.id, managerCode: newCode, role: 'manager' }, JWT_SECRET);
  res.json({ token, managerCode: newCode });
});

app.post('/api/auth/recover', async (req, res) => {
  const { email, phone, password, managerCode } = req.body;
  
  let query = 'SELECT * FROM users WHERE manager_code = ? AND role = "manager"';
  const params = [managerCode];
  
  const user = db.prepare(query).get(...params) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  let valid = false;
  if (email && phone && user.email === email && user.phone === phone) valid = true;
  else if (password && phone && user.phone === phone && await bcrypt.compare(password, user.password)) valid = true;
  else if (email && password && user.email === email && await bcrypt.compare(password, user.password)) valid = true;

  if (!valid) return res.status(401).json({ error: 'Invalid recovery details' });

  const token = jwt.sign({ id: user.id, managerCode: user.manager_code, role: 'manager' }, JWT_SECRET);
  res.json({ token, managerCode: user.manager_code, user: { id: user.id, role: 'manager', managerCode: user.manager_code } });
});

app.post('/api/auth/employee/join', (req, res) => {
  const { managerCode, name } = req.body;
  const manager = db.prepare('SELECT id FROM users WHERE manager_code = ? AND role = "manager"').get(managerCode);
  
  if (!manager) return res.status(404).json({ error: 'Manager code not found' });
  
  const id = uuidv4();
  db.prepare('INSERT INTO users (id, manager_code, role, name, status, permissions) VALUES (?, ?, ?, ?, ?, ?)').run(
    id, managerCode, 'employee', name, 'pending', 'sales_only'
  );
  
  res.json({ success: true, message: 'Join request sent' });
});

app.post('/api/auth/employee/login', (req, res) => {
  const { managerCode, name } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE manager_code = ? AND name = ? AND role = "employee"').get(managerCode, name) as any;
  
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.status === 'pending') return res.status(403).json({ error: 'Pending approval' });
  if (user.status === 'rejected' || user.status === 'kicked') return res.status(403).json({ error: 'Access denied' });
  
  const token = jwt.sign({ id: user.id, managerCode: user.manager_code, role: 'employee', permissions: user.permissions, name: user.name }, JWT_SECRET);
  res.json({ token, user: { id: user.id, role: 'employee', managerCode: user.manager_code, name: user.name, permissions: user.permissions } });
});

// Sync Route (For offline PWA to sync data)
app.post('/api/sync', authenticate, (req: any, res: any) => {
  const { managerCode } = req.user;
  const { products, sales, debts, auditLogs } = req.body;

  db.transaction(() => {
    // Sync Products
    if (products) {
      const stmt = db.prepare('INSERT OR REPLACE INTO products (id, manager_code, name, barcode, purchase_price, sell_price, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)');
      for (const p of products) {
        stmt.run(p.id, managerCode, p.name, p.barcode, p.purchase_price, p.sell_price, p.quantity);
      }
    }
    // Sync Sales
    if (sales) {
      const saleStmt = db.prepare('INSERT OR REPLACE INTO sales (id, manager_code, invoice_number, total_amount, total_items, discount, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      const itemStmt = db.prepare('INSERT OR REPLACE INTO sale_items (id, sale_id, product_id, quantity, price, total) VALUES (?, ?, ?, ?, ?, ?)');
      for (const s of sales) {
        saleStmt.run(s.id, managerCode, s.invoice_number, s.total_amount, s.total_items, s.discount, s.created_at, s.created_by);
        for (const item of s.items) {
          itemStmt.run(item.id, s.id, item.product_id, item.quantity, item.price, item.total);
        }
      }
    }
    // Sync Debts
    if (debts) {
      const stmt = db.prepare('INSERT OR REPLACE INTO debts (id, manager_code, person_name, amount, paid, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
      for (const d of debts) {
        stmt.run(d.id, managerCode, d.person_name, d.amount, d.paid, JSON.stringify(d.details), d.created_at);
      }
    }
    // Sync Audit Logs
    if (auditLogs) {
      const stmt = db.prepare('INSERT OR REPLACE INTO audit_logs (id, manager_code, action, details, executor_name, created_at) VALUES (?, ?, ?, ?, ?, ?)');
      for (const l of auditLogs) {
        stmt.run(l.id, managerCode, l.action, l.details, l.executor_name, l.created_at);
      }
    }
  })();

  // Fetch latest data to return
  const serverProducts = db.prepare('SELECT * FROM products WHERE manager_code = ?').all(managerCode);
  const serverSales = db.prepare('SELECT * FROM sales WHERE manager_code = ?').all(managerCode);
  for (const s of serverSales as any) {
    s.items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(s.id);
  }
  const serverDebts = db.prepare('SELECT * FROM debts WHERE manager_code = ?').all(managerCode);
  const serverAuditLogs = db.prepare('SELECT * FROM audit_logs WHERE manager_code = ?').all(managerCode);
  const serverUsers = db.prepare('SELECT id, name, role, status, permissions FROM users WHERE manager_code = ?').all(managerCode);
  const subscription = db.prepare('SELECT * FROM subscriptions WHERE manager_code = ?').get(managerCode);

  res.json({
    products: serverProducts,
    sales: serverSales,
    debts: serverDebts,
    auditLogs: serverAuditLogs,
    users: serverUsers,
    subscription
  });
});

// Manager Actions
app.post('/api/manager/employees/:id/status', authenticate, (req: any, res: any) => {
  if (req.user.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });
  const { status } = req.body;
  db.prepare('UPDATE users SET status = ? WHERE id = ? AND manager_code = ?').run(status, req.params.id, req.user.managerCode);
  res.json({ success: true });
});

app.post('/api/manager/employees/:id/permissions', authenticate, (req: any, res: any) => {
  if (req.user.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });
  const { permissions } = req.body;
  db.prepare('UPDATE users SET permissions = ? WHERE id = ? AND manager_code = ?').run(permissions, req.params.id, req.user.managerCode);
  res.json({ success: true });
});

app.post('/api/manager/activate', authenticate, (req: any, res: any) => {
  if (req.user.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });
  const { code } = req.body;
  
  const activation = db.prepare('SELECT * FROM activation_codes WHERE code = ? AND valid = 1').get(code) as any;
  if (!activation) return res.status(400).json({ error: 'Invalid or used code' });
  
  const months = activation.type === 'yearly' ? 12 : 1;
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + months);
  
  db.transaction(() => {
    db.prepare('UPDATE activation_codes SET valid = 0, used_by = ?, used_at = ? WHERE code = ?').run(req.user.managerCode, new Date().toISOString(), code);
    db.prepare('INSERT OR REPLACE INTO subscriptions (id, manager_code, plan, expiry_date) VALUES (?, ?, ?, ?)').run(uuidv4(), req.user.managerCode, 'pro', expiryDate.toISOString());
  })();
  
  res.json({ success: true, expiryDate: expiryDate.toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
