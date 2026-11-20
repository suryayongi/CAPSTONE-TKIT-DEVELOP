import { storage } from './storage.js';

const AUTH_STORAGE_KEY = 'duniamadani_auth_user_v3_1';
const USERNAME_RE = /^[a-z0-9._-]{3,32}$/;

const hashLocalPassword = async (plain) => {
  const input = `madani-local-salt:${String(plain || '')}`;
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return btoa(unescape(encodeURIComponent(input)));
};

const STARTER_ACCOUNTS = [
  {
    id: 'usr-superadmin-01',
    username: 'superadmin',
    nama_lengkap: 'Super Admin TKIT Al Madani',
    role: 'SUPER_ADMIN',
    jabatan_kelas: 'Administrator Sekolah',
    default_pass: 'supermadani123',
    is_active: true
  },
  {
    id: 'usr-guru-hilmy',
    username: 'hilmy',
    nama_lengkap: 'Ibu Hilmy Azimah, M.Pd.',
    role: 'GURU',
    jabatan_kelas: 'Guru',
    default_pass: 'madani123',
    is_active: true
  },
  {
    id: 'usr-guru-tka',
    username: 'gurutka',
    nama_lengkap: 'Ibu Guru TK A',
    role: 'GURU',
    jabatan_kelas: 'Guru',
    default_pass: 'madani123',
    is_active: true
  },
  {
    id: 'usr-guru-tkb',
    username: 'gurutkb',
    nama_lengkap: 'Ibu Guru TK B',
    role: 'GURU',
    jabatan_kelas: 'Guru',
    default_pass: 'madani123',
    is_active: true
  },
  {
    id: 'usr-guru-01',
    username: 'guru',
    nama_lengkap: 'Guru TKIT Al Madani',
    role: 'GURU',
    jabatan_kelas: 'Guru',
    default_pass: 'madani123',
    is_active: true
  }
];

const getTokenFromStorage = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.token || '';
  } catch {
    return '';
  }
};

const getCallerFromStorage = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const toPublicLocalUser = (u) => {
  const { password_digest: _omit, default_pass: _omit2, ...rest } = u;
  return {
    ...rest,
    role: rest.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'GURU',
    is_active: Boolean(rest.is_active)
  };
};

const LEGACY_STARTER_LABELS = new Set([
  'Kepala Sekolah',
  'Wali Kelas TK A',
  'Wali Kelas TK B',
  'Guru Pengelola Materi',
  'Guru Kelas'
]);

const ensureLocalUsersSeeded = async () => {
  const existing = storage.get(storage.USERS_KEY, null);
  if (Array.isArray(existing) && existing.length > 0) {
    let migrated = false;
    const normalized = existing.map((u) => {
      if (u.role !== 'SUPER_ADMIN' && LEGACY_STARTER_LABELS.has(u.jabatan_kelas)) {
        migrated = true;
        return { ...u, jabatan_kelas: 'Guru' };
      }
      return u;
    });
    if (migrated) {
      storage.set(storage.USERS_KEY, normalized);
    }
    return normalized;
  }

  const now = new Date().toISOString();
  const seeded = [];
  for (const item of STARTER_ACCOUNTS) {
    const { default_pass, ...meta } = item;
    seeded.push({
      ...meta,
      password_digest: await hashLocalPassword(default_pass),
      created_at: now,
      updated_at: now,
      last_login_at: null
    });
  }
  storage.set(storage.USERS_KEY, seeded);
  return seeded;
};

const postUserMutation = async (action, payload) => {
  const token = getTokenFromStorage();
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ action, payload })
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { handled: false };
    }

    const json = await res.json();
    if (res.status === 503 && json.mode === 'local_only') {
      return { handled: false };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        handled: true,
        result: {
          success: false,
          requiresAuth: true,
          message: json.message || 'Akses khusus Super Admin.',
          data: null
        }
      };
    }

    return { handled: true, result: json };
  } catch {
    return { handled: false };
  }
};

export const userService = {
  async authenticateLocal(username, password) {
    const list = await ensureLocalUsersSeeded();
    const u = String(username || '').trim().toLowerCase();
    const p = String(password || '').trim();
    const digest = await hashLocalPassword(p);

    const foundIdx = list.findIndex((item) => item.username.toLowerCase() === u);
    const found = foundIdx >= 0 ? list[foundIdx] : null;

    if (!found || found.password_digest !== digest) {
      return {
        success: false,
        message: 'Username atau kata sandi belum tepat.',
        data: null
      };
    }

    if (!found.is_active) {
      return {
        success: false,
        message: 'Akun Anda sedang dinonaktifkan oleh Super Admin Sekolah.',
        data: null
      };
    }

    const now = new Date().toISOString();
    list[foundIdx] = { ...found, last_login_at: now };
    storage.set(storage.USERS_KEY, list);

    const pub = toPublicLocalUser(list[foundIdx]);
    return {
      success: true,
      source: 'local',
      message: 'Login berhasil! Selamat datang, ' + pub.nama_lengkap,
      data: {
        ...pub,
        token: `local-${pub.role.toLowerCase()}-${Date.now()}`,
        login_at: now
      }
    };
  },

  async listUsers() {
    const token = getTokenFromStorage();
    try {
      const res = await fetch('/api/users', {
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (res.status === 401 || res.status === 403) {
          return {
            success: false,
            requiresAuth: true,
            message: json.message || 'Akses khusus Super Admin.',
            data: []
          };
        }
        if (res.ok && json.success) {
          return {
            success: true,
            source: 'postgres',
            data: json.data || []
          };
        }
      }
    } catch {
      // Fallback ke data lokal saat mode local_only
    }

    const list = await ensureLocalUsersSeeded();
    return {
      success: true,
      source: 'local',
      data: list.map(toPublicLocalUser)
    };
  },

  async createUser(userData) {
    const mutated = await postUserMutation('createUser', userData);
    if (mutated.handled) return mutated.result;

    const username = String(userData.username || '').trim().toLowerCase();
    const namaLengkap = String(userData.nama_lengkap || '').trim();
    const jabatanKelas = String(userData.jabatan_kelas || 'Guru').trim() || 'Guru';
    const role = userData.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'GURU';
    const password = String(userData.password || '').trim();

    if (!USERNAME_RE.test(username)) {
      return {
        success: false,
        message: 'Username wajib 3–32 karakter huruf kecil, angka, titik, garis bawah, atau tanda hubung tanpa spasi.'
      };
    }
    if (namaLengkap.length < 2) {
      return { success: false, message: 'Nama lengkap minimal 2 karakter.' };
    }
    if (password.length < 6) {
      return { success: false, message: 'Kata sandi awal minimal 6 karakter.' };
    }

    const list = await ensureLocalUsersSeeded();
    if (list.some((u) => u.username.toLowerCase() === username)) {
      return { success: false, message: `Username "${username}" sudah terdaftar.` };
    }

    const now = new Date().toISOString();
    const newUser = {
      id: 'usr-' + username.replace(/[^a-z0-9]/g, '') + '-' + Date.now().toString().slice(-4),
      username,
      nama_lengkap: namaLengkap,
      role,
      jabatan_kelas: jabatanKelas,
      is_active: true,
      password_digest: await hashLocalPassword(password),
      created_at: now,
      updated_at: now,
      last_login_at: null
    };

    const nextList = [...list, newUser];
    storage.set(storage.USERS_KEY, nextList);
    return {
      success: true,
      source: 'local',
      message: `Akun untuk ${namaLengkap} (@${username}) berhasil dibuat.`,
      data: toPublicLocalUser(newUser)
    };
  },

  async updateUser(userData) {
    const mutated = await postUserMutation('updateUser', userData);
    if (mutated.handled) return mutated.result;

    const caller = getCallerFromStorage();
    const list = await ensureLocalUsersSeeded();
    const idx = list.findIndex((u) => u.id === userData.id);
    if (idx === -1) {
      return { success: false, message: 'Akun pengguna tidak ditemukan.' };
    }

    const existing = list[idx];
    const nextRole = userData.role ? (userData.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'GURU') : existing.role;
    const nextActive = userData.is_active !== undefined ? Boolean(userData.is_active) : existing.is_active;

    if (caller?.id === existing.id && (!nextActive || nextRole !== 'SUPER_ADMIN')) {
      return {
        success: false,
        message: 'Anda tidak dapat menonaktifkan atau menurunkan peran akun yang sedang dipakai.'
      };
    }

    const nextName = userData.nama_lengkap !== undefined ? String(userData.nama_lengkap).trim() : existing.nama_lengkap;
    if (nextName.length < 2) {
      return { success: false, message: 'Nama lengkap minimal 2 karakter.' };
    }

    list[idx] = {
      ...existing,
      nama_lengkap: nextName,
      jabatan_kelas:
        userData.jabatan_kelas !== undefined
          ? String(userData.jabatan_kelas || '').trim() || 'Guru'
          : existing.jabatan_kelas,
      role: nextRole,
      is_active: nextActive,
      updated_at: new Date().toISOString()
    };

    storage.set(storage.USERS_KEY, list);
    return {
      success: true,
      source: 'local',
      message: `Data akun ${nextName} berhasil diperbarui.`,
      data: toPublicLocalUser(list[idx])
    };
  },

  async resetPassword({ id, newPassword }) {
    const mutated = await postUserMutation('resetPassword', { id, newPassword });
    if (mutated.handled) return mutated.result;

    const cleanPass = String(newPassword || '').trim();
    if (cleanPass.length < 6) {
      return { success: false, message: 'Kata sandi baru minimal 6 karakter.' };
    }

    const list = await ensureLocalUsersSeeded();
    const idx = list.findIndex((u) => u.id === id);
    if (idx === -1) {
      return { success: false, message: 'Akun pengguna tidak ditemukan.' };
    }

    list[idx] = {
      ...list[idx],
      password_digest: await hashLocalPassword(cleanPass),
      updated_at: new Date().toISOString()
    };
    storage.set(storage.USERS_KEY, list);
    return {
      success: true,
      source: 'local',
      message: `Kata sandi untuk ${list[idx].nama_lengkap} (@${list[idx].username}) berhasil diatur ulang.`
    };
  },

  async deleteUser(id) {
    const mutated = await postUserMutation('deleteUser', { id });
    if (mutated.handled) return mutated.result;

    const caller = getCallerFromStorage();
    if (caller?.id === id) {
      return { success: false, message: 'Anda tidak dapat menghapus akun yang sedang aktif.' };
    }

    const list = await ensureLocalUsersSeeded();
    const target = list.find((u) => u.id === id);
    if (!target) {
      return { success: false, message: 'Akun tidak ditemukan.' };
    }

    const activeSuperAdmins = list.filter((u) => u.role === 'SUPER_ADMIN' && u.is_active);
    if (target.role === 'SUPER_ADMIN' && activeSuperAdmins.length <= 1) {
      return { success: false, message: 'Minimal harus ada 1 akun Super Admin yang aktif.' };
    }

    const nextList = list.filter((u) => u.id !== id);
    storage.set(storage.USERS_KEY, nextList);
    return {
      success: true,
      source: 'local',
      message: `Akun ${target.nama_lengkap} berhasil dihapus.`
    };
  }
};
