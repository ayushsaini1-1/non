import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';

// Express app for Vercel Serverless Function
const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'dormwash-super-secure-jwt-secret-key-2026';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '113222512181-l9msktcrvu5as0ftlt9fm6pimarckdsg.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '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';

function getGoogleRedirectUri(req: express.Request): string {
  if (process.env.APP_URL) {
    const baseUrl = process.env.APP_URL.replace(/\/$/, '');
    return `${baseUrl}/auth/google/callback`;
  }
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  return `${protocol}://${host}/auth/google/callback`;
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Data Models & In-Memory Store (Persistent per warm lambda function)
export interface User {
  id: number;
  email: string;
  full_name: string;
  hashed_password: string;
  role: 'user' | 'admin';
  penalty_points: number;
  is_active: boolean;
  created_at: string;
}

export interface WashingMachine {
  id: number;
  name: string;
  location: string;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  qr_code_token: string;
  created_at: string;
}

export interface Slot {
  id: number;
  user_id: number;
  machine_id: number;
  start_time: string;
  end_time: string;
  grace_period_end: string;
  status: 'BOOKED' | 'CHECKED_IN' | 'EXPIRED' | 'MISUSE_REPORTED' | 'COMPLETED' | 'CANCELLED';
  checked_in_at: string | null;
  created_at: string;
}

export interface MisuseReport {
  id: number;
  reporter_id: number;
  machine_id: number;
  slot_id: number | null;
  reason: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  created_at: string;
  action_taken: string;
}

const users: User[] = [
  {
    id: 1,
    email: 'gamerzayush62@gmail.com',
    full_name: 'Ayush Saini (Admin)',
    hashed_password: bcrypt.hashSync('3004', 10),
    role: 'admin',
    penalty_points: 0,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    email: 'admin@laundry.com',
    full_name: 'Facility Admin',
    hashed_password: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    penalty_points: 0,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    email: 'john@example.com',
    full_name: 'John Doe',
    hashed_password: bcrypt.hashSync('user123', 10),
    role: 'user',
    penalty_points: 0,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    email: 'alice@example.com',
    full_name: 'Alice Smith',
    hashed_password: bcrypt.hashSync('user123', 10),
    role: 'user',
    penalty_points: 0,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const machines: WashingMachine[] = [
  { id: 1, name: 'Machine 1', location: 'Block A - Room 101', status: 'AVAILABLE', qr_code_token: 'WM_QR_MACHINE_1_a1b2c3d4e5f6', created_at: new Date().toISOString() },
  { id: 2, name: 'Machine 2', location: 'Block A - Room 102', status: 'AVAILABLE', qr_code_token: 'WM_QR_MACHINE_2_b2c3d4e5f6a1', created_at: new Date().toISOString() },
  { id: 3, name: 'Machine 3', location: 'Block A - Room 103', status: 'AVAILABLE', qr_code_token: 'WM_QR_MACHINE_3_c3d4e5f6a1b2', created_at: new Date().toISOString() },
  { id: 4, name: 'Machine 4', location: 'Block B - Ground Floor', status: 'AVAILABLE', qr_code_token: 'WM_QR_MACHINE_4_d4e5f6a1b2c3', created_at: new Date().toISOString() },
  { id: 5, name: 'Machine 5', location: 'Block B - 1st Floor', status: 'AVAILABLE', qr_code_token: 'WM_QR_MACHINE_5_e5f6a1b2c3d4', created_at: new Date().toISOString() },
  { id: 6, name: 'Machine 6', location: 'Block B - 2nd Floor', status: 'AVAILABLE', qr_code_token: 'WM_QR_MACHINE_6_f6a1b2c3d4e5', created_at: new Date().toISOString() },
  { id: 7, name: 'Machine 7', location: 'Block C - Basement', status: 'AVAILABLE', qr_code_token: 'WM_QR_MACHINE_7_a7b8c9d0e1f2', created_at: new Date().toISOString() },
  { id: 8, name: 'Machine 8', location: 'Block C - 1st Floor', status: 'AVAILABLE', qr_code_token: 'WM_QR_MACHINE_8_b8c9d0e1f2a7', created_at: new Date().toISOString() },
  { id: 9, name: 'Machine 9', location: 'Block C - 2nd Floor', status: 'AVAILABLE', qr_code_token: 'WM_QR_MACHINE_9_c9d0e1f2a7b8', created_at: new Date().toISOString() },
  { id: 10, name: 'Machine 10', location: 'Block D - Ground Floor', status: 'AVAILABLE', qr_code_token: 'WM_QR_MACHINE_10_d0e1f2a7b8c9', created_at: new Date().toISOString() },
  { id: 11, name: 'Machine 11', location: 'Block D - 1st Floor', status: 'MAINTENANCE', qr_code_token: 'WM_QR_MACHINE_11_e1f2a7b8c9d0', created_at: new Date().toISOString() },
  { id: 12, name: 'Machine 12', location: 'Block D - 2nd Floor', status: 'MAINTENANCE', qr_code_token: 'WM_QR_MACHINE_12_f2a7b8c9d0e1', created_at: new Date().toISOString() },
  { id: 13, name: 'Machine 13', location: 'Block E - Ground Floor', status: 'MAINTENANCE', qr_code_token: 'WM_QR_MACHINE_13_a3b4c5d6e7f8', created_at: new Date().toISOString() },
  { id: 14, name: 'Machine 14', location: 'Block E - 1st Floor', status: 'AVAILABLE', qr_code_token: 'WM_QR_MACHINE_14_b4c5d6e7f8a3', created_at: new Date().toISOString() },
  { id: 15, name: 'Machine 15', location: 'Block E - 2nd Floor', status: 'AVAILABLE', qr_code_token: 'WM_QR_MACHINE_15_c5d6e7f8a3b4', created_at: new Date().toISOString() },
];

const slots: Slot[] = [];
const reports: MisuseReport[] = [];

let nextUserId = 5;
let nextMachineId = 16;
let nextSlotId = 1;
let nextReportId = 1;

function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) return res.status(401).json({ detail: 'Missing or invalid authentication token' });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; email: string; role: 'user' | 'admin' };
    const user = users.find((u) => u.id === Number(payload.sub));
    if (!user) return res.status(401).json({ detail: 'User not found' });
    (req as any).user = user;
    next();
  } catch {
    return res.status(401).json({ detail: 'Invalid or expired token' });
  }
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  authenticateToken(req, res, () => {
    const user = (req as any).user as User;
    if (user.role !== 'admin') return res.status(403).json({ detail: 'Admin privileges required' });
    next();
  });
}

function sanitizeUser(u: User) {
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    penalty_points: u.penalty_points,
    is_active: u.is_active,
    created_at: u.created_at,
  };
}

// Check expired slots
function checkGraceExpirations() {
  const now = new Date();
  for (const slot of slots) {
    if (slot.status === 'BOOKED') {
      const graceEnd = new Date(slot.grace_period_end);
      if (now > graceEnd) {
        slot.status = 'EXPIRED';
        const user = users.find((u) => u.id === slot.user_id);
        if (user) user.penalty_points += 1;
      }
    }
  }
}

// Google Callback route
app.get(['/auth/google/callback', '/auth/google/callback/'], async (req, res) => {
  const { code, error } = req.query;
  if (error || !code) {
    return res.status(400).send(`<html><body><h3>Google Auth Failed: ${error || 'No code'}</h3></body></html>`);
  }
  try {
    const redirectUri = getGoogleRedirectUri(req);
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResp.ok) throw new Error(`Google token exchange failed`);

    const tokens = (await tokenResp.json()) as { access_token: string };
    const userResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userResp.ok) throw new Error('Failed user profile fetch');

    const googleUser = (await userResp.json()) as { email?: string; name?: string; given_name?: string };
    const email = (googleUser.email || '').toLowerCase().trim();
    const fullName = googleUser.name || googleUser.given_name || email.split('@')[0];

    let user = users.find((u) => u.email.toLowerCase() === email);
    if (!user) {
      const isAdmin = email === 'gamerzayush62@gmail.com' || email.includes('admin');
      user = { id: nextUserId++, email, full_name: fullName, hashed_password: '', role: isAdmin ? 'admin' : 'user', penalty_points: 0, is_active: true, created_at: new Date().toISOString() };
      users.push(user);
    }

    const access_token = jwt.sign({ sub: String(user.id), email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const sanitized = sanitizeUser(user);

    res.send(`
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc; color: #0f172a; text-align: center;">
        <div style="padding: 2rem; background: white; border-radius: 1rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
          <h2>Signed in as ${fullName}</h2>
          <p>Redirecting back...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', token: ${JSON.stringify(access_token)}, user: ${JSON.stringify(sanitized)} }, '*');
            setTimeout(() => window.close(), 500);
          } else {
            localStorage.setItem('dormwash_auth_token', ${JSON.stringify(access_token)});
            window.location.href = '/';
          }
        </script>
      </body>
      </html>
    `);
  } catch (err: any) {
    res.status(500).send(`<html><body><h3>Auth Error: ${err.message}</h3></body></html>`);
  }
});

const apiRouter = express.Router();

apiRouter.use((req, res, next) => {
  checkGraceExpirations();
  next();
});

apiRouter.get('/auth/google/url', (req, res) => {
  const redirectUri = getGoogleRedirectUri(req);
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });
  return res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, redirect_uri: redirectUri });
});

apiRouter.post('/auth/google/login-token', async (req, res) => {
  const { credential, access_token: googleAccessToken } = req.body;
  try {
    let email = '';
    let fullName = '';

    if (credential) {
      const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (!resp.ok) return res.status(400).json({ detail: 'Invalid Google ID token' });
      const data = (await resp.json()) as any;
      email = (data.email || '').toLowerCase();
      fullName = data.name || data.given_name || email.split('@')[0];
    } else if (googleAccessToken) {
      const resp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
      });
      if (!resp.ok) return res.status(400).json({ detail: 'Invalid Google Access token' });
      const data = (await resp.json()) as any;
      email = (data.email || '').toLowerCase();
      fullName = data.name || data.given_name || email.split('@')[0];
    } else {
      return res.status(400).json({ detail: 'Missing token' });
    }

    let user = users.find((u) => u.email.toLowerCase() === email);
    if (!user) {
      const isAdmin = email === 'gamerzayush62@gmail.com' || email.includes('admin');
      user = { id: nextUserId++, email, full_name: fullName, hashed_password: '', role: isAdmin ? 'admin' : 'user', penalty_points: 0, is_active: true, created_at: new Date().toISOString() };
      users.push(user);
    }

    const access_token = jwt.sign({ sub: String(user.id), email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ access_token, token_type: 'bearer', role: user.role, user: sanitizeUser(user) });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message || 'Validation failed' });
  }
});

apiRouter.get('/', (req, res) => res.json({ message: 'DormWash API v1' }));

apiRouter.post('/auth/register', (req, res) => {
  const { email, password, full_name } = req.body;
  const isAdmin = req.query.is_admin === 'true';
  if (!email || !password || !full_name) return res.status(400).json({ detail: 'Missing required fields' });
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) return res.status(400).json({ detail: 'User exists' });

  const newUser: User = { id: nextUserId++, email: email.toLowerCase(), full_name, hashed_password: bcrypt.hashSync(password, 10), role: isAdmin ? 'admin' : 'user', penalty_points: 0, is_active: true, created_at: new Date().toISOString() };
  users.push(newUser);
  return res.status(201).json(sanitizeUser(newUser));
});

apiRouter.post('/auth/login-json', (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.hashed_password)) return res.status(401).json({ detail: 'Incorrect credentials' });
  const access_token = jwt.sign({ sub: String(user.id), email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ access_token, token_type: 'bearer', role: user.role, user_id: user.id, email: user.email });
});

apiRouter.post('/auth/login', (req, res) => {
  const email = req.body.username || req.body.email;
  const password = req.body.password;
  const user = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.hashed_password)) return res.status(401).json({ detail: 'Incorrect credentials' });
  const access_token = jwt.sign({ sub: String(user.id), email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ access_token, token_type: 'bearer', role: user.role, user_id: user.id, email: user.email });
});

apiRouter.get('/auth/me', authenticateToken, (req, res) => {
  return res.json(sanitizeUser((req as any).user));
});

apiRouter.get('/machines', (req, res) => {
  const now = new Date();
  const machineList = machines.map((m) => {
    const activeSlot = slots.find((s) => s.machine_id === m.id && (s.status === 'BOOKED' || s.status === 'CHECKED_IN') && new Date(s.start_time) <= now && new Date(s.end_time) >= now);
    let status = m.status;
    if (m.status !== 'MAINTENANCE') status = activeSlot ? 'IN_USE' : 'AVAILABLE';
    return { ...m, status };
  });
  return res.json(machineList);
});

apiRouter.get('/machines/:id', (req, res) => {
  const machine = machines.find((m) => m.id === Number(req.params.id));
  if (!machine) return res.status(404).json({ detail: 'Not found' });
  return res.json(machine);
});

apiRouter.post('/machines', requireAdmin, (req, res) => {
  const { name, location } = req.body;
  if (!name || !location) return res.status(400).json({ detail: 'Name and location required' });
  const token = `WM_QR_${name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}_${Math.random().toString(16).substring(2, 14)}`;
  const newMachine: WashingMachine = { id: nextMachineId++, name, location, status: 'AVAILABLE', qr_code_token: token, created_at: new Date().toISOString() };
  machines.push(newMachine);
  return res.status(201).json(newMachine);
});

apiRouter.get('/machines/:id/qr-info', (req, res) => {
  const machine = machines.find((m) => m.id === Number(req.params.id));
  if (!machine) return res.status(404).json({ detail: 'Not found' });
  return res.json({ machine_id: machine.id, name: machine.name, qr_code_token: machine.qr_code_token, printable_qr_url: `/api/v1/machines/${machine.id}/qr-image` });
});

apiRouter.get('/machines/:id/qr-image', async (req, res) => {
  const machine = machines.find((m) => m.id === Number(req.params.id));
  if (!machine) return res.status(404).json({ detail: 'Not found' });
  try {
    const pngBuffer = await QRCode.toBuffer(machine.qr_code_token, { type: 'png', width: 320, margin: 3, errorCorrectionLevel: 'H' });
    res.setHeader('Content-Type', 'image/png');
    return res.send(pngBuffer);
  } catch {
    return res.status(500).json({ detail: 'QR image error' });
  }
});

apiRouter.post('/slots/book', authenticateToken, (req, res) => {
  const user = (req as any).user as User;
  const { machine_id, start_time, end_time } = req.body;
  if (!machine_id || !start_time || !end_time) return res.status(400).json({ detail: 'Missing parameters' });
  const start = new Date(start_time);
  const end = new Date(end_time);

  const newSlot: Slot = {
    id: nextSlotId++,
    user_id: user.id,
    machine_id: Number(machine_id),
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    grace_period_end: new Date(start.getTime() + 5 * 60 * 1000).toISOString(),
    status: 'BOOKED',
    checked_in_at: null,
    created_at: new Date().toISOString(),
  };
  slots.push(newSlot);
  return res.status(201).json(newSlot);
});

apiRouter.get('/slots/my-slots', authenticateToken, (req, res) => {
  const user = (req as any).user as User;
  return res.json(slots.filter((s) => s.user_id === user.id));
});

apiRouter.post('/slots/:id/verify-qr', authenticateToken, (req, res) => {
  const user = (req as any).user as User;
  const slot = slots.find((s) => s.id === Number(req.params.id));
  if (!slot || slot.user_id !== user.id) return res.status(404).json({ detail: 'Slot error' });
  slot.status = 'CHECKED_IN';
  slot.checked_in_at = new Date().toISOString();
  return res.json({ message: 'Verified', status: slot.status, slot_id: slot.id, checked_in_at: slot.checked_in_at });
});

apiRouter.post('/slots/:id/cancel', authenticateToken, (req, res) => {
  const user = (req as any).user as User;
  const slot = slots.find((s) => s.id === Number(req.params.id) && s.user_id === user.id);
  if (!slot) return res.status(404).json({ detail: 'Slot not found' });
  slot.status = 'CANCELLED';
  return res.json(slot);
});

apiRouter.post('/reports/misuse', authenticateToken, (req, res) => {
  const user = (req as any).user as User;
  const { qr_code_token, reason } = req.body;
  const machine = machines.find((m) => m.qr_code_token === qr_code_token);
  if (!machine) return res.status(404).json({ detail: 'Machine not found' });
  const newReport: MisuseReport = {
    id: nextReportId++,
    reporter_id: user.id,
    machine_id: machine.id,
    slot_id: null,
    reason: reason || 'Unattended machine',
    status: 'PENDING',
    created_at: new Date().toISOString(),
    action_taken: 'Report logged',
  };
  reports.push(newReport);
  return res.status(201).json(newReport);
});

apiRouter.get('/reports', requireAdmin, (req, res) => res.json(reports));

app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);

export default app;
