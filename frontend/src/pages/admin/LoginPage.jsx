import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicHeader, PublicFooter, Card, Input, Button } from '../../components';
import { Icon, MaterialIcon } from '../../utils/icons';
import { authService } from '../../services/authService';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleFillDemo = () => {
    setUsername('guru');
    setPassword('madani123');
    setErrorMessage('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await authService.login(username, password);
      setIsLoading(false);

      if (res.success) {
        navigate('/admin/dashboard');
      } else {
        setErrorMessage(res.message || 'Username atau kata sandi tidak cocok.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Terjadi kendala saat login: ' + (err.message || 'Silakan coba lagi.'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <Card className="max-w-md w-full p-6 sm:p-8 animate-pop-in">
          {/* Header Card */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-sky-50 border border-sky-200/80 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Icon name="teacher" className="w-16 h-16" />
            </div>
            <h1 className="font-duo-display text-2xl sm:text-3xl font-bold text-slate-800">
              Masuk Ruang Guru
            </h1>
            <p className="text-sm font-semibold text-slate-500 mt-1">
              Kelola Tema, Sub Tema, Video Pembelajaran, dan Pertanyaan Kuis Interaktif
            </p>
          </div>

          {/* Kotak Pintasan Demo 1-Klik */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 mb-5 flex items-center justify-between gap-3">
            <div className="text-xs font-semibold text-slate-700">
              <span className="font-bold text-amber-800 block mb-0.5">
                Akun Contoh Guru:
              </span>
              Username: <code className="bg-white/90 border border-amber-200/60 px-1.5 py-0.5 rounded font-mono text-slate-800">guru</code> • Sandi: <code className="bg-white/90 border border-amber-200/60 px-1.5 py-0.5 rounded font-mono text-slate-800">madani123</code>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleFillDemo}
              icon={<MaterialIcon name="bolt" className="text-base" />}
              className="shrink-0"
            >
              Isi Otomatis
            </Button>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold mb-4 flex items-center gap-2">
              <MaterialIcon name="error" className="text-base shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Username Guru"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Contoh: guru"
              autoComplete="username"
            />

            <Input
              label="Kata Sandi"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
              autoComplete="current-password"
            />

            <Button
              type="submit"
              size="lg"
              variant="primary"
              fullWidth
              loading={isLoading}
              icon={<MaterialIcon name="login" className="text-xl" />}
              className="mt-3"
            >
              Masuk ke Studio Guru
            </Button>
          </form>
        </Card>
      </main>

      <PublicFooter />
    </div>
  );
};
