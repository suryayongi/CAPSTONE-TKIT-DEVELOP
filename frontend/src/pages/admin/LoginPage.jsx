import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PublicHeader, PublicFooter, Card, Input, Button } from '../../components';
import { Icon, MaterialIcon } from '../../utils/icons';
import { authService } from '../../services/authService';

const resolvePostLoginRoute = (user, restrictedFrom) => {
  const defaultRoute = authService.getHomeRouteForRole(user?.role);
  if (!restrictedFrom || restrictedFrom === '/admin' || restrictedFrom === '/admin/login') {
    return defaultRoute;
  }
  if (restrictedFrom.startsWith('/admin/akun-guru') && user?.role !== 'SUPER_ADMIN') {
    return '/admin/dashboard';
  }
  return restrictedFrom;
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const restrictedFrom = location.state?.restrictedFrom || '';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const existingUser = authService.getCurrentUser();
    if (existingUser) {
      navigate(resolvePostLoginRoute(existingUser, restrictedFrom), { replace: true });
    }
  }, [navigate, restrictedFrom]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await authService.login(username, password);
      setIsLoading(false);

      if (res.success && res.data) {
        navigate(resolvePostLoginRoute(res.data, restrictedFrom), { replace: true });
      } else {
        setErrorMessage(res.message || 'Username atau kata sandi tidak cocok.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Terjadi kendala saat login: ' + (err.message || 'Silakan coba lagi.'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5]">
      <PublicHeader />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <Card className="max-w-md w-full p-6 sm:p-8">
          {/* Header Card */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-sky-50 border border-sky-200/80 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Icon name="teacher" className="w-16 h-16" />
            </div>
            <h1 className="font-duo-display text-2xl sm:text-3xl font-bold text-slate-800">
              Masuk Ruang Guru
            </h1>
            <p className="text-sm font-medium text-slate-600 mt-1">
              Masuk dengan akun guru masing-masing atau akun Super Admin TKIT Al Madani
            </p>
          </div>

          {/* Pemberitahuan Akses Khusus Guru / Super Admin */}
          {restrictedFrom && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-semibold mb-4 flex items-start gap-2.5"
            >
              <MaterialIcon name="lock" className="text-base text-sky-700 shrink-0 mt-0.5" />
              <span>
                {restrictedFrom.includes('rekap-pjj')
                  ? 'Halaman Rekap Belajar PJJ hanya dapat dibuka oleh Guru. Silakan masuk terlebih dahulu.'
                  : restrictedFrom.includes('akun-guru')
                  ? 'Halaman Pengelolaan Akun Guru hanya dapat dibuka oleh Super Admin Sekolah.'
                  : 'Halaman Studio Guru hanya dapat dibuka oleh Guru terautentikasi. Silakan masuk terlebih dahulu.'}
              </span>
            </div>
          )}

          {/* Error Message Box */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold mb-4 flex items-center gap-2"
            >
              <MaterialIcon name="error" className="text-base shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              id="login-username"
              name="username"
              label="Username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username Anda"
              autoComplete="username"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
            />

            <div className="space-y-1 w-full min-w-0">
              <label
                htmlFor="login-password"
                className="block text-xs font-extrabold uppercase tracking-wider text-[#64748B]"
              >
                Kata Sandi <span className="text-rose-500 font-extrabold">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  autoComplete="current-password"
                  className="duo-input w-full min-w-0 pr-11"
                />
                <button
                  type="button"
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 w-9 h-9 rounded-lg text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
                >
                  <MaterialIcon
                    name={showPassword ? 'visibility_off' : 'visibility'}
                    className="text-lg"
                  />
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              variant="primary"
              fullWidth
              loading={isLoading}
              icon={<MaterialIcon name="login" className="text-xl" />}
              className="mt-3"
            >
              Masuk ke Sistem
            </Button>
          </form>
        </Card>
      </main>

      <PublicFooter />
    </div>
  );
};
