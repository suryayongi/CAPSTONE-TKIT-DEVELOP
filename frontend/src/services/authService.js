import { userService } from './userService.js';

const AUTH_KEY = 'duniamadani_auth_user_v3_1';

export const normalizeUserRole = (role) => {
  const clean = String(role || '').trim().toUpperCase();
  if (clean === 'SUPER_ADMIN') return 'SUPER_ADMIN';
  return 'GURU';
};

export const isAllowedAdminRole = (role) => {
  const clean = String(role || '').trim().toUpperCase();
  return clean === 'SUPER_ADMIN' || clean === 'GURU' || clean === 'GURU_ADMIN';
};

export const authService = {
  async login(username, password) {
    const u = (username || '').trim().toLowerCase();
    const p = (password || '').trim();

    if (!u || !p) {
      return {
        success: false,
        message: 'Mohon isi username dan kata sandi terlebih dahulu.',
        data: null
      };
    }

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      });

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await response.json();
        if (response.ok && json.success && json.data) {
          const normalizedUser = {
            ...json.data,
            role: normalizeUserRole(json.data.role)
          };
          localStorage.setItem(AUTH_KEY, JSON.stringify(normalizedUser));
          return { ...json, data: normalizedUser };
        }

        // Jika DATABASE_URL tersedia dan API menolak login (400/401/403), jangan bypass ke fallback lokal
        if (!(response.status === 503 && json.mode === 'local_only')) {
          return {
            success: false,
            message: json.message || 'Username atau kata sandi belum tepat.',
            data: null
          };
        }
      }
    } catch {
      // Fallback ke akun lokal saat offline / local_only
    }

    const localRes = await userService.authenticateLocal(u, p);
    if (localRes.success && localRes.data) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(localRes.data));
    }
    return localRes;
  },

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.token || !isAllowedAdminRole(parsed.role)) return null;
      return {
        ...parsed,
        role: normalizeUserRole(parsed.role)
      };
    } catch {
      return null;
    }
  },

  getToken() {
    const user = this.getCurrentUser();
    return user?.token || '';
  },

  isAuthenticated() {
    return Boolean(this.getCurrentUser());
  },

  isSuperAdmin() {
    const user = this.getCurrentUser();
    return user?.role === 'SUPER_ADMIN';
  },

  getHomeRouteForRole(role) {
    return normalizeUserRole(role) === 'SUPER_ADMIN'
      ? '/admin/akun-guru'
      : '/admin/dashboard';
  },

  logout() {
    localStorage.removeItem(AUTH_KEY);
    return {
      success: true,
      message: 'Anda berhasil keluar dari Ruang Studio.'
    };
  }
};
