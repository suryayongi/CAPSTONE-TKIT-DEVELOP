import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const loadStarterRoster = () => {
  try {
    return structuredClone(require('../src/data/starterTeachers.json'));
  } catch {
    const candidates = [
      new URL('../src/data/starterTeachers.json', import.meta.url),
      path.join(process.cwd(), 'src', 'data', 'starterTeachers.json'),
      path.join(process.cwd(), 'frontend', 'src', 'data', 'starterTeachers.json')
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      }
    }
    throw new Error('Tidak dapat menemukan data starterTeachers.json');
  }
};

const getSecret = () =>
  process.env.AUTH_SECRET ||
  process.env.DATABASE_URL ||
  'duniamadani-tkit-al-madani-secret-2026';

export const normalizeRole = (role) => {
  const clean = String(role || '').trim().toUpperCase();
  if (clean === 'SUPER_ADMIN') return 'SUPER_ADMIN';
  return 'GURU';
};

export const isSuperAdminRole = (role) => normalizeRole(role) === 'SUPER_ADMIN';

export const isTeacherRole = (role) => {
  const clean = String(role || '').trim().toUpperCase();
  return clean === 'SUPER_ADMIN' || clean === 'GURU' || clean === 'GURU_ADMIN';
};

export const hashPassword = (plainPassword) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(plainPassword || ''), salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
};

export const verifyPassword = (plainPassword, storedHash) => {
  const raw = String(storedHash || '');
  if (!raw.startsWith('scrypt$')) {
    return false;
  }
  const parts = raw.split('$');
  if (parts.length !== 3) return false;
  const [, salt, hexKey] = parts;
  if (!salt || !hexKey) return false;

  try {
    const derived = crypto.scryptSync(String(plainPassword || ''), salt, 64);
    const storedBuf = Buffer.from(hexKey, 'hex');
    if (derived.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(derived, storedBuf);
  } catch {
    return false;
  }
};

export const getStarterUsersSeed = () => {
  const roster = loadStarterRoster();
  const defaultTeacherPass = process.env.TEACHER_PASSWORD || 'madani123';
  const teachers = Array.isArray(roster?.teachers) ? roster.teachers : [];

  return [
    {
      id: 'usr-superadmin-01',
      username: 'superadmin',
      nama_lengkap: 'Super Admin TKIT Al Madani',
      role: 'SUPER_ADMIN',
      jabatan_kelas: 'Administrator Sekolah',
      plain_password: process.env.SUPERADMIN_PASSWORD || 'supermadani123',
      is_active: true
    },
    ...teachers.map((t) => ({
      id: t.id,
      username: t.username,
      nama_lengkap: t.nama_lengkap,
      role: 'GURU',
      jabatan_kelas: t.kelas ? `Kelas ${t.kelas}` : 'Guru',
      plain_password: defaultTeacherPass,
      is_active: true
    }))
  ];
};

export const signTeacherToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    role: normalizeRole(user.role),
    nama_lengkap: user.nama_lengkap,
    jabatan_kelas: user.jabatan_kelas || 'Guru',
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 hari
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
};

export const verifyTeacherToken = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encoded, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getSecret())
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) return null;
    if (!isTeacherRole(payload.role)) return null;
    return {
      ...payload,
      role: normalizeRole(payload.role)
    };
  } catch {
    return null;
  }
};

export const verifyTeacherRequest = (req) => {
  const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
  const altToken = req.headers?.['x-teacher-token'] || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const token = bearer || altToken;
  return verifyTeacherToken(token);
};

export const verifySuperAdminRequest = (req) => {
  const user = verifyTeacherRequest(req);
  if (!user || !isSuperAdminRole(user.role)) return null;
  return user;
};
