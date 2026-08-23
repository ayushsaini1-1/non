import express from 'express';
import cors from 'cors';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
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

// Data Models & In-Memory Store
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

// Initial Seed Users
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

// Seed Washing Machines
const machines: WashingMachine[] = [
  {
    id: 1,
    name: 'Machine 1',
    location: 'Block A - Room 101',
    status: 'AVAILABLE',
    qr_code_token: 'WM_QR_MACHINE_1_a1b2c3d4e5f6',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Machine 2',
    location: 'Block A - Room 102',
    status: 'AVAILABLE',
    qr_code_token: 'WM_QR_MACHINE_2_b2c3d4e5f6a1',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Machine 3',
    location: 'Block A - Room 103',
    status: 'AVAILABLE',
    qr_code_token: 'WM_QR_MACHINE_3_c3d4e5f6a1b2',
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'Machine 4',
    location: 'Block B - Ground Floor',
    status: 'AVAILABLE',
    qr_code_token: 'WM_QR_MACHINE_4_d4e5f6a1b2c3',
    created_at: new Date().toISOString(),
  },
  {
    id: 5,
    name: 'Machine 5',
    location: 'Block B - 1st Floor',
    status: 'AVAILABLE',
    qr_code_token: 'WM_QR_MACHINE_5_e5f6a1b2c3d4',
    created_at: new Date().toISOString(),
  },
  {
    id: 6,
    name: 'Machine 6',
    location: 'Block B - 2nd Floor',
    status: 'AVAILABLE',
    qr_code_token: 'WM_QR_MACHINE_6_f6a1b2c3d4e5',
    created_at: new Date().toISOString(),
  },
  {
    id: 7,
    name: 'Machine 7',
    location: 'Block C - Basement',
    status: 'AVAILABLE',
    qr_code_token: 'WM_QR_MACHINE_7_a7b8c9d0e1f2',
    created_at: new Date().toISOString(),
  },
  {
    id: 8,
    name: 'Machine 8',
    location: 'Block C - 1st Floor',
    status: 'AVAILABLE',
    qr_code_token: 'WM_QR_MACHINE_8_b8c9d0e1f2a7',
    created_at: new Date().toISOString(),
  },
  {
    id: 9,
    name: 'Machine 9',
    location: 'Block C - 2nd Floor',
    status: 'AVAILABLE',
    qr_code_token: 'WM_QR_MACHINE_9_c9d0e1f2a7b8',
    created_at: new Date().toISOString(),
  },
  {
    id: 10,
    name: 'Machine 10',
    location: 'Block D - Ground Floor',
    status: 'AVAILABLE',
    qr_code_token: 'WM_QR_MACHINE_10_d0e1f2a7b8c9',
    created_at: new Date().toISOString(),
  },
  {
    id: 11,
    name: 'Machine 11',
    location: 'Block D - 1st Floor',
    status: 'MAINTENANCE',
    qr_code_token: 'WM_QR_MACHINE_11_e1f2a7b8c9d0',
    created_at: new Date().toISOString(),
  },
  {
    id: 12,
    name: 'Machine 12',
    location: 'Block D - 2nd Floor',
    status: 'MAINTENANCE',
    qr_code_token: 'WM_QR_MACHINE_12_f2a7b8c9d0e1',
    created_at: new Date().toISOString(),
  },
  {
    id: 13,
    name: 'Machine 13',
    location: 'Block E - Ground Floor',
    status: 'MAINTENANCE',
    qr_code_token: 'WM_QR_MACHINE_13_a3b4c5d6e7f8',
    created_at: new Date().toISOString(),
  },
  {
    id: 14,
    name: 'Machine 14',
    location: 'Block E - 1st Floor',
    status: 'AVAILABLE',
    qr_code_token: 'WM_QR_MACHINE_14_b4c5d6e7f8a3',
    created_at: new Date().toISOString(),
  },
  {
    id: 15,
    name: 'Machine 15',
    location: 'Block E - 2nd Floor',
    status: 'AVAILABLE',
    qr_code_token: 'WM_QR_MACHINE_15_c5d6e7f8a3b4',
    created_at: new Date().toISOString(),
  },
];

const slots: Slot[] = [];
const reports: MisuseReport[] = [];

let nextUserId = 5;
let nextMachineId = 16;
let nextSlotId = 1;
let nextReportId = 1;

// Auth Helpers
function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ detail: 'Missing or invalid authentication token' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; email: string; role: 'user' | 'admin' };
    const user = users.find((u) => u.id === Number(payload.sub));
    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }
    (req as any).user = user;
    next();
  } catch {
    return res.status(401).json({ detail: 'Invalid or expired token' });
  }
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  authenticateToken(req, res, () => {
    const user = (req as any).user as User;
    if (user.role !== 'admin') {
      return res.status(403).json({ detail: 'Admin privileges required' });
    }
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

// Background scheduler for expiring no-show slots (start_time + 5 mins grace passed)
setInterval(() => {
  const now = new Date();
  for (const slot of slots) {
    if (slot.status === 'BOOKED') {
      const graceEnd = new Date(slot.grace_period_end);
      if (now > graceEnd) {
        slot.status = 'EXPIRED';
        const user = users.find((u) => u.id === slot.user_id);
        if (user) {
          user.penalty_points += 1;
        }
      }
    }
  }
}, 5000);

// Google OAuth Callback Handler (HTML page postMessage opener)
app.get(['/auth/google/callback', '/auth/google/callback/'], async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc; color: #0f172a;">
        <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
          <h3 style="color: #dc2626; margin-bottom: 0.5rem;">Google Authentication Failed</h3>
          <p style="color: #64748b; font-size: 0.875rem;">${error || 'No authorization code received'}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: ${JSON.stringify(String(error || 'Failed'))} }, '*');
              setTimeout(() => window.close(), 2000);
            }
          </script>
        </div>
      </body>
      </html>
    `);
  }

  try {
    const redirectUri = getGoogleRedirectUri(req);

    // Exchange authorization code for Google Access Token
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

    if (!tokenResp.ok) {
      const errBody = await tokenResp.text();
      throw new Error(`Google token exchange failed: ${errBody}`);
    }

    const tokens = (await tokenResp.json()) as { access_token: string; id_token?: string };

    // Fetch User Profile from Google API
    const userResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userResp.ok) {
      throw new Error('Failed to fetch user profile from Google');
    }

    const googleUser = (await userResp.json()) as { email?: string; name?: string; given_name?: string };
    const email = (googleUser.email || '').toLowerCase().trim();
    const fullName = googleUser.name || googleUser.given_name || email.split('@')[0];

    if (!email) {
      throw new Error('Google account did not provide an email address');
    }

    // Find or create user
    let user = users.find((u) => u.email.toLowerCase() === email);
    if (!user) {
      const isAdmin = email === 'gamerzayush62@gmail.com' || email.includes('admin');
      user = {
        id: nextUserId++,
        email: email,
        full_name: fullName,
        hashed_password: '',
        role: isAdmin ? 'admin' : 'user',
        penalty_points: 0,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      users.push(user);
    } else {
      user.full_name = fullName;
    }

    // Issue application JWT
    const access_token = jwt.sign(
      { sub: String(user.id), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const sanitized = sanitizeUser(user);

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Google Sign-In Success</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f8fafc; color: #0f172a;">
        <div style="text-align: center; padding: 2.5rem; background: #ffffff; border-radius: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); max-width: 380px; width: 90%;">
          <div style="width: 56px; height: 56px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 24px; font-weight: bold;">
            ✓
          </div>
          <h2 style="margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 800; color: #0f172a;">Signed in with Google</h2>
          <p style="margin: 0 0 1.5rem; font-size: 0.875rem; color: #64748b;">Welcome, ${fullName}!</p>
          <p style="font-size: 0.75rem; color: #94a3b8; margin: 0;">Completing sign-in and closing popup...</p>
        </div>
        <script>
          const authPayload = {
            type: 'GOOGLE_AUTH_SUCCESS',
            token: ${JSON.stringify(access_token)},
            user: ${JSON.stringify(sanitized)}
          };
          if (window.opener) {
            window.opener.postMessage(authPayload, '*');
            setTimeout(() => { window.close(); }, 600);
          } else {
            localStorage.setItem('dormwash_auth_token', ${JSON.stringify(access_token)});
            window.location.href = '/';
          }
        </script>
      </body>
      </html>
    `);
  } catch (err: any) {
    console.error('Google OAuth error:', err);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; text-align: center; padding: 3rem; background: #f8fafc;">
        <h3 style="color: #ef4444;">Google Sign-In Error</h3>
        <p style="color: #64748b;">${err.message || 'Authentication failed'}</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: ${JSON.stringify(err.message)} }, '*');
          }
        </script>
      </body>
      </html>
    `);
  }
});

// ======================== API ROUTERS ========================
const apiRouter = express.Router();

// Google OAuth URL Endpoint
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
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return res.json({ url, redirect_uri: redirectUri });
});

// Direct Google Token Login Verification Endpoint
apiRouter.post('/auth/google/login-token', async (req, res) => {
  const { credential, access_token: googleAccessToken } = req.body;

  try {
    let email = '';
    let fullName = '';

    if (credential) {
      const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (!resp.ok) {
        return res.status(400).json({ detail: 'Invalid Google ID token' });
      }
      const data = (await resp.json()) as any;
      email = (data.email || '').toLowerCase();
      fullName = data.name || data.given_name || email.split('@')[0];
    } else if (googleAccessToken) {
      const resp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
      });
      if (!resp.ok) {
        return res.status(400).json({ detail: 'Invalid Google Access token' });
      }
      const data = (await resp.json()) as any;
      email = (data.email || '').toLowerCase();
      fullName = data.name || data.given_name || email.split('@')[0];
    } else {
      return res.status(400).json({ detail: 'Missing Google credential or access token' });
    }

    if (!email) {
      return res.status(400).json({ detail: 'No email provided by Google account' });
    }

    let user = users.find((u) => u.email.toLowerCase() === email);
    if (!user) {
      const isAdmin = email === 'gamerzayush62@gmail.com' || email.includes('admin');
      user = {
        id: nextUserId++,
        email: email,
        full_name: fullName,
        hashed_password: '',
        role: isAdmin ? 'admin' : 'user',
        penalty_points: 0,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      users.push(user);
    } else {
      user.full_name = fullName;
    }

    const access_token = jwt.sign(
      { sub: String(user.id), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      access_token,
      token_type: 'bearer',
      role: user.role,
      user: sanitizeUser(user),
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message || 'Google token validation failed' });
  }
});

// Root & Health
apiRouter.get('/', (req, res) => {
  res.json({ message: 'Welcome to DormWash API v1', docs: '/docs' });
});

// Authentication
apiRouter.post('/auth/register', (req, res) => {
  const { email, password, full_name } = req.body;
  const isAdmin = req.query.is_admin === 'true';

  if (!email || !password || !full_name) {
    return res.status(400).json({ detail: 'Missing required fields' });
  }

  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ detail: 'User with this email already exists' });
  }

  const newUser: User = {
    id: nextUserId++,
    email: email.trim().toLowerCase(),
    full_name: full_name.trim(),
    hashed_password: bcrypt.hashSync(password, 10),
    role: isAdmin ? 'admin' : 'user',
    penalty_points: 0,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  users.push(newUser);
  return res.status(201).json(sanitizeUser(newUser));
});

apiRouter.post('/auth/login-json', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ detail: 'Email and password required' });
  }

  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.hashed_password)) {
    return res.status(401).json({ detail: 'Incorrect email or password' });
  }

  const access_token = jwt.sign(
    { sub: String(user.id), email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    access_token,
    token_type: 'bearer',
    role: user.role,
    user_id: user.id,
    email: user.email,
  });
});

apiRouter.post('/auth/login', (req, res) => {
  const email = req.body.username || req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(401).json({ detail: 'Incorrect email or password' });
  }

  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.hashed_password)) {
    return res.status(401).json({ detail: 'Incorrect email or password' });
  }

  const access_token = jwt.sign(
    { sub: String(user.id), email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    access_token,
    token_type: 'bearer',
    role: user.role,
    user_id: user.id,
    email: user.email,
  });
});

apiRouter.get('/auth/me', authenticateToken, (req, res) => {
  const user = (req as any).user as User;
  return res.json(sanitizeUser(user));
});

// Machines
apiRouter.get('/machines', (req, res) => {
  const now = new Date();
  const machineList = machines.map((m) => {
    // Check if machine currently has an active CHECKED_IN or BOOKED slot
    const activeSlot = slots.find(
      (s) =>
        s.machine_id === m.id &&
        (s.status === 'BOOKED' || s.status === 'CHECKED_IN') &&
        new Date(s.start_time) <= now &&
        new Date(s.end_time) >= now
    );

    let status = m.status;
    if (m.status !== 'MAINTENANCE') {
      status = activeSlot ? 'IN_USE' : 'AVAILABLE';
    }

    return {
      id: m.id,
      name: m.name,
      location: m.location,
      status,
      qr_code_token: m.qr_code_token,
      created_at: m.created_at,
    };
  });

  return res.json(machineList);
});

apiRouter.get('/machines/:id', (req, res) => {
  const machine = machines.find((m) => m.id === Number(req.params.id));
  if (!machine) {
    return res.status(404).json({ detail: 'Washing machine not found' });
  }
  return res.json(machine);
});

apiRouter.post('/machines', requireAdmin, (req, res) => {
  const { name, location } = req.body;
  if (!name || !location) {
    return res.status(400).json({ detail: 'Name and location are required' });
  }

  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const randomHex = Math.random().toString(16).substring(2, 14);
  const token = `WM_QR_${cleanName}_${randomHex}`;

  const newMachine: WashingMachine = {
    id: nextMachineId++,
    name,
    location,
    status: 'AVAILABLE',
    qr_code_token: token,
    created_at: new Date().toISOString(),
  };

  machines.push(newMachine);
  return res.status(201).json(newMachine);
});

apiRouter.get('/machines/:id/qr-info', (req, res) => {
  const machine = machines.find((m) => m.id === Number(req.params.id));
  if (!machine) {
    return res.status(404).json({ detail: 'Washing machine not found' });
  }

  return res.json({
    machine_id: machine.id,
    name: machine.name,
    qr_code_token: machine.qr_code_token,
    printable_qr_url: `/api/v1/machines/${machine.id}/qr-image`,
  });
});

apiRouter.get('/machines/:id/qr-image', async (req, res) => {
  const machine = machines.find((m) => m.id === Number(req.params.id));
  if (!machine) {
    return res.status(404).json({ detail: 'Washing machine not found' });
  }

  try {
    const pngBuffer = await QRCode.toBuffer(machine.qr_code_token, {
      type: 'png',
      width: 320,
      margin: 3,
      errorCorrectionLevel: 'H',
    });
    res.setHeader('Content-Type', 'image/png');
    return res.send(pngBuffer);
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to generate QR code image' });
  }
});

// Slot Bookings & QR Verification
apiRouter.post('/slots/book', authenticateToken, (req, res) => {
  const user = (req as any).user as User;
  const { machine_id, start_time, end_time } = req.body;

  if (!machine_id || !start_time || !end_time) {
    return res.status(400).json({ detail: 'machine_id, start_time, and end_time are required' });
  }

  const start = new Date(start_time);
  const end = new Date(end_time);
  const now = new Date();

  if (end <= start) {
    return res.status(400).json({ detail: 'End time must be after start time' });
  }

  if (start.getTime() < now.getTime() - 2 * 60 * 1000) {
    return res.status(400).json({ detail: 'Cannot book slot in the past' });
  }

  const machine = machines.find((m) => m.id === Number(machine_id));
  if (!machine) {
    return res.status(404).json({ detail: 'Washing machine not found' });
  }
  if (machine.status === 'MAINTENANCE') {
    return res.status(400).json({ detail: 'Machine is currently under maintenance' });
  }

  // Check overlapping active slots
  const overlapping = slots.find((s) => {
    if (s.machine_id !== Number(machine_id)) return false;
    if (s.status !== 'BOOKED' && s.status !== 'CHECKED_IN') return false;
    const sStart = new Date(s.start_time);
    const sEnd = new Date(s.end_time);
    return (
      (sStart <= start && sEnd > start) ||
      (sStart < end && sEnd >= end) ||
      (sStart >= start && sEnd <= end)
    );
  });

  if (overlapping) {
    return res.status(400).json({ detail: 'Machine is already booked for the requested time slot' });
  }

  const gracePeriodEnd = new Date(start.getTime() + 5 * 60 * 1000).toISOString();

  const newSlot: Slot = {
    id: nextSlotId++,
    user_id: user.id,
    machine_id: Number(machine_id),
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    grace_period_end: gracePeriodEnd,
    status: 'BOOKED',
    checked_in_at: null,
    created_at: new Date().toISOString(),
  };

  slots.push(newSlot);
  return res.status(201).json(newSlot);
});

apiRouter.get('/slots/my-slots', authenticateToken, (req, res) => {
  const user = (req as any).user as User;
  const userSlots = slots
    .filter((s) => s.user_id === user.id)
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  return res.json(userSlots);
});

apiRouter.post('/slots/:id/verify-qr', authenticateToken, (req, res) => {
  const user = (req as any).user as User;
  const slotId = Number(req.params.id);
  const { qr_code_token } = req.body;

  const slot = slots.find((s) => s.id === slotId);
  if (!slot) {
    return res.status(404).json({ detail: 'Slot booking not found' });
  }

  if (slot.user_id !== user.id) {
    return res.status(403).json({ detail: 'You can only verify QR code for your own booked slot' });
  }

  if (slot.status === 'CHECKED_IN') {
    return res.json({
      message: 'Slot is already verified and checked in!',
      status: slot.status,
      slot_id: slot.id,
      checked_in_at: slot.checked_in_at,
    });
  }

  if (['EXPIRED', 'CANCELLED', 'MISUSE_REPORTED'].includes(slot.status)) {
    return res.status(400).json({ detail: `Cannot verify slot in status '${slot.status}'` });
  }

  const machine = machines.find((m) => m.id === slot.machine_id);
  if (!machine || machine.qr_code_token !== qr_code_token) {
    return res.status(400).json({
      detail: 'Invalid QR Code! Scanned code does not match the assigned washing machine.',
    });
  }

  const now = new Date();
  const slotStart = new Date(slot.start_time);
  const graceEnd = new Date(slot.grace_period_end);

  if (now.getTime() < slotStart.getTime() - 2 * 60 * 1000) {
    return res.status(400).json({
      detail: `Too early! Slot starts at ${slotStart.toISOString()}. Please wait until start time.`,
    });
  }

  if (now > graceEnd) {
    slot.status = 'EXPIRED';
    user.penalty_points += 1;
    return res.status(400).json({
      detail:
        'Grace period expired! You did not scan the QR code within 5 minutes of slot start time. Slot forfeited (+1 penalty point).',
    });
  }

  slot.status = 'CHECKED_IN';
  slot.checked_in_at = now.toISOString();

  return res.json({
    message: 'QR Code verified successfully! Your washing machine slot is now active.',
    status: slot.status,
    slot_id: slot.id,
    checked_in_at: slot.checked_in_at,
  });
});

apiRouter.post('/slots/:id/cancel', authenticateToken, (req, res) => {
  const user = (req as any).user as User;
  const slotId = Number(req.params.id);

  const slot = slots.find((s) => s.id === slotId && s.user_id === user.id);
  if (!slot) {
    return res.status(404).json({ detail: 'Slot not found' });
  }

  if (slot.status !== 'BOOKED') {
    return res.status(400).json({ detail: `Cannot cancel slot with status '${slot.status}'` });
  }

  slot.status = 'CANCELLED';
  return res.json(slot);
});

// Misuse Reporting
apiRouter.post('/reports/misuse', authenticateToken, (req, res) => {
  const user = (req as any).user as User;
  const { qr_code_token, reason } = req.body;

  const machine = machines.find((m) => m.qr_code_token === qr_code_token);
  if (!machine) {
    return res.status(404).json({
      detail: 'Invalid QR Code! No washing machine found with this code.',
    });
  }

  const now = new Date();
  const currentSlot = slots.find(
    (s) =>
      s.machine_id === machine.id &&
      (s.status === 'BOOKED' || s.status === 'CHECKED_IN') &&
      new Date(s.start_time) <= now &&
      new Date(s.end_time) >= now
  );

  let actionTaken = '';
  let slotIdRef: number | null = null;

  if (currentSlot) {
    slotIdRef = currentSlot.id;
    const graceEnd = new Date(currentSlot.grace_period_end);

    if (currentSlot.status === 'BOOKED') {
      if (now > graceEnd) {
        currentSlot.status = 'EXPIRED';
        const bookingUser = users.find((u) => u.id === currentSlot.user_id);
        if (bookingUser) {
          bookingUser.penalty_points += 1;
        }
        actionTaken = `Misuse confirmed: Booking for User #${currentSlot.user_id} expired due to 5-min grace period timeout. Machine #${machine.id} is now freed!`;
      } else {
        actionTaken = `Booking user is still within their 5-minute grace window (until ${graceEnd.toISOString()}). Report logged.`;
      }
    } else if (currentSlot.status === 'CHECKED_IN') {
      currentSlot.status = 'MISUSE_REPORTED';
      actionTaken = `Report filed for checked-in slot #${currentSlot.id}. Flagged for admin inspection.`;
    }
  } else {
    actionTaken = `No active booking found for Machine #${machine.id} at this time. Machine is free to use.`;
  }

  const newReport: MisuseReport = {
    id: nextReportId++,
    reporter_id: user.id,
    machine_id: machine.id,
    slot_id: slotIdRef,
    reason: reason || 'Unattended machine / no-show',
    status: 'PENDING',
    created_at: new Date().toISOString(),
    action_taken: actionTaken,
  };

  reports.push(newReport);
  return res.status(201).json(newReport);
});

apiRouter.get('/reports', requireAdmin, (req, res) => {
  const reportList = reports.map((r) => ({
    id: r.id,
    reporter_id: r.reporter_id,
    machine_id: r.machine_id,
    slot_id: r.slot_id,
    reason: r.reason,
    status: r.status,
    created_at: r.created_at,
    action_taken: r.action_taken || `Report status: ${r.status}`,
  }));
  return res.json(reportList);
});

// Mount /api/v1 and legacy /api endpoints
app.use('/api/v1', apiRouter);

// Health check endpoint for connection monitors
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Root API welcome
app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'DormWash API Gateway' });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DormWash Unified Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
