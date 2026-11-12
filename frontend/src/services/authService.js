const AUTH_KEY = 'duniamadani_auth_user_v3_0';

export const authService = {
  async login(username, password) {
    const u = (username || '').trim().toLowerCase();
    const p = (password || '').trim();

    if ((u === 'guru' || u === 'admin' || u === 'hilmy') && (p === 'madani123' || p === 'admin123')) {
      const user = {
        id: 'usr-guru-01',
        username: u,
        nama_lengkap: u === 'hilmy' ? 'Ibu Hilmy Azimah, M.Pd. (Kepala Sekolah)' : 'Guru TKIT Al Madani',
        role: 'GURU_ADMIN',
        token: 'mock-jwt-duniamadani-' + Date.now(),
        login_at: new Date().toISOString()
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      return {
        success: true,
        message: 'Login berhasil! Selamat datang, ' + user.nama_lengkap,
        data: user
      };
    }

    return {
      success: false,
      message: 'Username atau kata sandi belum tepat. Gunakan akun demo: guru / madani123',
      data: null
    };
  },

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) return JSON.parse(raw);
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        const defaultUser = {
          id: 'usr-guru-01',
          username: 'guru',
          nama_lengkap: 'Guru TKIT Al Madani',
          role: 'GURU_ADMIN',
          token: 'mock-jwt-duniamadani-demo',
          login_at: new Date().toISOString()
        };
        try { localStorage.setItem(AUTH_KEY, JSON.stringify(defaultUser)); } catch (e) {}
        return defaultUser;
      }
      return null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return Boolean(this.getCurrentUser());
  },

  logout() {
    localStorage.removeItem(AUTH_KEY);
    return {
      success: true,
      message: 'Anda berhasil keluar dari ruang guru.'
    };
  }
};
