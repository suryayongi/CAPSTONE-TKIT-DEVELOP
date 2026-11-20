import crypto from 'node:crypto';

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

export const getStarterUsersSeed = () => [
  {
    id: 'usr-superadmin-01',
    username: 'superadmin',
    nama_lengkap: 'Super Admin TKIT Al Madani',
    role: 'SUPER_ADMIN',
    jabatan_kelas: 'Administrator Sekolah',
    plain_password: process.env.SUPERADMIN_PASSWORD || 'supermadani123',
    is_active: true
  },
  {
    id: 'usr-guru-hilmy',
    username: 'hilmy',
    nama_lengkap: 'Ibu Hilmy Azimah, M.Pd.',
    role: 'GURU',
    jabatan_kelas: 'Guru',
    plain_password: 'madani123',
    is_active: true
  },
  {
    id: 'usr-guru-tka',
    username: 'gurutka',
    nama_lengkap: 'Ibu Guru TK A',
    role: 'GURU',
    jabatan_kelas: 'Guru',
    plain_password: 'madani123',
    is_active: true
  },
  {
    id: 'usr-guru-tkb',
    username: 'gurutkb',
    nama_lengkap: 'Ibu Guru TK B',
    role: 'GURU',
    jabatan_kelas: 'Guru',
    plain_password: 'madani123',
    is_active: true
  },
  {
    id: 'usr-guru-01',
    username: 'guru',
    nama_lengkap: 'Guru TKIT Al Madani',
    role: 'GURU',
    jabatan_kelas: 'Guru',
    plain_password: process.env.TEACHER_PASSWORD || 'madani123',
    is_active: true
  }
];

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
