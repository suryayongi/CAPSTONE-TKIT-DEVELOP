import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AdminLayout,
  Button,
  ConfirmModal,
  EmptyState,
  useToast
} from '../../components';
import { MaterialIcon } from '../../utils/icons';
import { userService } from '../../services/userService';
import { curriculumService } from '../../services/curriculumService';
import { authService } from '../../services/authService';

const USERNAME_RE = /^[a-z0-9._-]{3,32}$/;

const slugifyUsername = (name) =>
  String(name || '')
    .toLowerCase()
    .replace(/^(ibu|bapak|ustadzah|ustadz|bu|pak)\s+/i, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 24);

const generateReadablePassword = () => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `madani${num}`;
};

export const SuperAdminAccountsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const currentUser = authService.getCurrentUser();

  // State Form Tambah Akun Baru
  const [namaLengkap, setNamaLengkap] = useState('');
  const [username, setUsername] = useState('');
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [jabatanKelas, setJabatanKelas] = useState('Guru');
  const [role, setRole] = useState('GURU');
  const [password, setPassword] = useState('');
  const [showCreatePass, setShowCreatePass] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [lastCreatedCreds, setLastCreatedCreds] = useState(null);

  const namaInputRef = useRef(null);
  const usernameInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // State Filter Daftar Akun
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // State Native <dialog> Reset Kata Sandi
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [resetNewPass, setResetNewPass] = useState('');
  const [showResetPass, setShowResetPass] = useState(false);
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const resetDialogRef = useRef(null);
  const resetPassInputRef = useRef(null);

  // State Native <dialog> Edit Akun
  const [editTargetUser, setEditTargetUser] = useState(null);
  const [editNama, setEditNama] = useState('');
  const [editJabatan, setEditJabatan] = useState('');
  const [editRole, setEditRole] = useState('GURU');
  const [editActive, setEditActive] = useState(true);
  const [editError, setEditError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const editDialogRef = useRef(null);

  // State Delete ConfirmModal
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);

  const {
    data: usersRes,
    isLoading,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await userService.listUsers();
      if (res.requiresAuth) {
        authService.logout();
        navigate('/admin/login', { replace: true });
      }
      return res;
    }
  });

  const { data: statsRes } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => curriculumService.getStats()
  });

  const allUsers = useMemo(() => usersRes?.data || [], [usersRes?.data]);
  const dataSource = usersRes?.source || 'local';
  const curriculumStats = statsRes?.data || { totalThemes: 0, totalVideos: 0 };

  const activeTeachersCount = allUsers.filter((u) => u.is_active).length;
  const inactiveCount = allUsers.filter((u) => !u.is_active).length;

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return allUsers.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (q) {
        const matchName = (u.nama_lengkap || '').toLowerCase().includes(q);
        const matchUser = (u.username || '').toLowerCase().includes(q);
        const matchJab = (u.jabatan_kelas || '').toLowerCase().includes(q);
        if (!matchName && !matchUser && !matchJab) return false;
      }
      return true;
    });
  }, [allUsers, roleFilter, searchTerm]);

  // Sinkronisasi native <dialog> showModal() untuk Reset Kata Sandi
  useEffect(() => {
    const dlg = resetDialogRef.current;
    if (!dlg) return;
    if (resetTargetUser) {
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [resetTargetUser]);

  // Sinkronisasi native <dialog> showModal() untuk Edit Info Akun
  useEffect(() => {
    const dlg = editDialogRef.current;
    if (!dlg) return;
    if (editTargetUser) {
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [editTargetUser]);

  const handleNamaChange = (val) => {
    setNamaLengkap(val);
    setFormError('');
    if (!usernameTouched) {
      setUsername(slugifyUsername(val));
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const cleanName = namaLengkap.trim();
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (cleanName.length < 2) {
      setFormError('Mohon isi nama lengkap guru minimal 2 karakter.');
      namaInputRef.current?.focus();
      return;
    }
    if (!USERNAME_RE.test(cleanUser)) {
      setFormError('Username harus 3–32 karakter (huruf kecil, angka, titik, garis bawah, atau tanda hubung).');
      usernameInputRef.current?.focus();
      return;
    }
    if (cleanPass.length < 6) {
      setFormError('Kata sandi awal minimal 6 karakter.');
      passwordInputRef.current?.focus();
      return;
    }

    setIsCreating(true);
    const res = await userService.createUser({
      nama_lengkap: cleanName,
      username: cleanUser,
      jabatan_kelas: jabatanKelas.trim() || 'Guru',
      role,
      password: cleanPass
    });
    setIsCreating(false);

    if (!res.success) {
      setFormError(res.message || 'Gagal membuat akun baru.');
      return;
    }

    setLastCreatedCreds({
      nama_lengkap: cleanName,
      username: cleanUser,
      password: cleanPass,
      role
    });

    setNamaLengkap('');
    setUsername('');
    setUsernameTouched(false);
    setPassword('');
    setRole('GURU');
    setJabatanKelas('Guru');

    queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    showToast(res.message || 'Akun guru berhasil ditambahkan.', 'success');
  };

  const handleCopyCredentials = async (creds) => {
    const text = `Akun Dunia Madani\nNama: ${creds.nama_lengkap}\nUsername: ${creds.username}\nKata Sandi: ${creds.password}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Info login disalin ke clipboard.', 'success');
    } catch {
      showToast('Info siap dicatat dari layar ini.', 'info');
    }
  };

  const openResetModal = (u) => {
    setResetTargetUser(u);
    setResetNewPass('');
    setShowResetPass(false);
    setResetError('');
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    if (resetNewPass.trim().length < 6) {
      setResetError('Kata sandi baru minimal 6 karakter.');
      resetPassInputRef.current?.focus();
      return;
    }

    setIsResetting(true);
    const res = await userService.resetPassword({
      id: resetTargetUser.id,
      newPassword: resetNewPass.trim()
    });
    setIsResetting(false);

    if (!res.success) {
      setResetError(res.message || 'Gagal mengatur ulang kata sandi.');
      return;
    }

    setLastCreatedCreds({
      nama_lengkap: resetTargetUser.nama_lengkap,
      username: resetTargetUser.username,
      password: resetNewPass.trim(),
      role: resetTargetUser.role,
      isReset: true
    });
    setResetTargetUser(null);
    queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    showToast(res.message, 'success');
  };

  const openEditModal = (u) => {
    setEditTargetUser(u);
    setEditNama(u.nama_lengkap || '');
    setEditJabatan(u.jabatan_kelas || 'Guru');
    setEditRole(u.role || 'GURU');
    setEditActive(Boolean(u.is_active));
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    if (editNama.trim().length < 2) {
      setEditError('Nama lengkap minimal 2 karakter.');
      return;
    }

    setIsUpdating(true);
    const res = await userService.updateUser({
      id: editTargetUser.id,
      nama_lengkap: editNama.trim(),
      jabatan_kelas: editJabatan.trim() || 'Guru',
      role: editRole,
      is_active: editActive
    });
    setIsUpdating(false);

    if (!res.success) {
      setEditError(res.message || 'Gagal menyimpan perubahan akun.');
      return;
    }

    setEditTargetUser(null);
    queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    showToast(res.message, 'success');
  };

  const handleToggleActive = async (u) => {
    const res = await userService.updateUser({
      id: u.id,
      is_active: !u.is_active
    });
    if (res.success) {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      showToast(
        u.is_active
          ? `Akun @${u.username} dinonaktifkan.`
          : `Akun @${u.username} diaktifkan kembali.`,
        'success'
      );
    } else {
      showToast(res.message || 'Gagal mengubah status akun.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetUser) return;
    const res = await userService.deleteUser(deleteTargetUser.id);
    if (res.success) {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      showToast(res.message, 'success');
    } else {
      showToast(res.message || 'Gagal menghapus akun.', 'error');
    }
    setDeleteTargetUser(null);
  };

  return (
    <AdminLayout maxWidth="max-w-7xl">
      {/* Header Portal Khusus Super Admin (Berbeda secara visual & peran dari Studio Guru) */}
      <section className="bg-[#1E293B] text-white rounded-2xl p-6 sm:p-8 mb-6 border border-slate-700/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-600 text-amber-300 flex items-center justify-center shrink-0">
            <MaterialIcon name="admin_panel_settings" className="text-3xl" />
          </div>
          <div>
            <div className="inline-flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-300 mb-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  dataSource === 'postgres' ? 'bg-emerald-400' : 'bg-amber-300'
                }`}
              />
              <span>Portal Khusus Super Admin TKIT Al Madani</span>
              <span>•</span>
              <span className={dataSource === 'postgres' ? 'text-emerald-300' : 'text-amber-200'}>
                {dataSource === 'postgres' ? 'PostgreSQL Neon Aktif' : 'Penyimpanan Lokal'}
              </span>
            </div>
            <h1 className="font-duo-display text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
              Pusat Pengelolaan Akun Guru
            </h1>
            <p className="text-sm font-medium text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Buat akun individual untuk setiap guru agar tidak terjadi bentrok sesi saat digunakan bersamaan, dan kelola reset kata sandi dari satu tempat.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link to="/admin/tema">
            <Button
              size="sm"
              variant="secondary"
              icon={<MaterialIcon name="folder_shared" className="text-base" />}
            >
              Bank Materi Bersama
            </Button>
          </Link>
          <Link to="/admin/rekap-pjj">
            <Button
              size="sm"
              variant="white"
              icon={<MaterialIcon name="assignment_ind" className="text-base text-slate-700" />}
            >
              Rekap PJJ
            </Button>
          </Link>
        </div>
      </section>

      {/* Ringkasan Angka (Seimbang, Non-Berlebihan) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <span className="text-xs font-semibold text-slate-500">Total Akun Terdaftar</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-mono tabular-nums text-3xl font-bold text-slate-800">
              {allUsers.length}
            </span>
            <span className="text-xs font-medium text-slate-500">Pengguna</span>
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5">
          <span className="text-xs font-semibold text-emerald-800">Akun Aktif</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-mono tabular-nums text-3xl font-bold text-emerald-950">
              {activeTeachersCount}
            </span>
            <span className="text-xs font-medium text-emerald-800">Siap Login</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <span className="text-xs font-semibold text-slate-500">Akun Dinonaktifkan</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-mono tabular-nums text-3xl font-bold text-slate-800">
              {inactiveCount}
            </span>
            <span className="text-xs font-medium text-slate-500">Nonaktif</span>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5">
          <span className="text-xs font-semibold text-amber-800">Bank Materi Bersama</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-mono tabular-nums text-3xl font-bold text-amber-950">
              {curriculumStats.totalThemes}
            </span>
            <span className="text-xs font-medium text-amber-800">
              Tema • {curriculumStats.totalVideos} Video
            </span>
          </div>
        </div>
      </div>

      {/* Konten Utama 2 Kolom: Tambah Akun (Kiri) + Daftar Akun (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KOLOM KIRI: Formulir Penambahan Akun Guru & Password */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="pb-4 border-b border-slate-200">
            <h2 className="font-duo-display text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
              <MaterialIcon name="person_add" className="text-xl text-emerald-700" />
              <span>Tambah Akun Guru Baru</span>
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Setiap guru mendapat username & kata sandi sendiri namun tetap berbagi akses ke Bank Materi Bersama.
            </p>
          </div>

          {lastCreatedCreds && (
            <div
              role="status"
              className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <MaterialIcon name="check_circle" className="text-base shrink-0" />
                  <span>
                    {lastCreatedCreds.isReset
                      ? 'Kata Sandi Baru Siap Diberikan'
                      : 'Akun Baru Siap Digunakan'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setLastCreatedCreds(null)}
                  className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                >
                  Tutup
                </button>
              </div>
              <div className="text-xs space-y-1 bg-white/90 border border-emerald-200/80 rounded-lg p-3 font-medium">
                <div>Nama: <strong>{lastCreatedCreds.nama_lengkap}</strong></div>
                <div>Username: <code className="font-mono text-slate-900">{lastCreatedCreds.username}</code></div>
                <div>Kata Sandi: <code className="font-mono text-slate-900">{lastCreatedCreds.password}</code></div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleCopyCredentials(lastCreatedCreds)}
                icon={<MaterialIcon name="content_copy" className="text-sm" />}
              >
                Salin Info Login
              </Button>
            </div>
          )}

          {formError && (
            <div
              role="alert"
              aria-live="polite"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2"
            >
              <MaterialIcon name="error_outline" className="text-base shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreateSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="create-nama" className="block text-sm font-semibold text-slate-700">
                Nama Lengkap Guru <span className="text-rose-600" aria-hidden="true">*</span>
              </label>
              <input
                ref={namaInputRef}
                id="create-nama"
                name="nama_lengkap"
                type="text"
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                value={namaLengkap}
                onChange={(e) => handleNamaChange(e.target.value)}
                placeholder="Contoh: Ibu Siti Rahmawati"
                className="pjj-field-control w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="create-username" className="block text-sm font-semibold text-slate-700">
                Username Login <span className="text-rose-600" aria-hidden="true">*</span>
              </label>
              <span id="create-username-hint" className="block text-xs text-slate-500">
                3–32 karakter huruf kecil, angka, titik, atau tanda hubung (tanpa spasi).
              </span>
              <input
                ref={usernameInputRef}
                id="create-username"
                name="username"
                type="text"
                required
                pattern="(?:[a-z0-9._]|-){3,32}"
                maxLength={32}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                aria-describedby="create-username-hint"
                value={username}
                onChange={(e) => {
                  setUsernameTouched(true);
                  setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''));
                  setFormError('');
                }}
                placeholder="Contoh: siti.rahma"
                className="pjj-field-control w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="create-jabatan" className="block text-sm font-semibold text-slate-700">
                Peran / Keterangan Akun
              </label>
              <input
                id="create-jabatan"
                name="jabatan_kelas"
                type="text"
                maxLength={80}
                value={jabatanKelas}
                onChange={(e) => setJabatanKelas(e.target.value)}
                placeholder="Contoh: Guru"
                className="pjj-field-control w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600"
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-slate-700">
                Peran Akses
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    value: 'GURU',
                    title: 'Akun Guru',
                    desc: 'Kelola materi bersama & Rekap PJJ'
                  },
                  {
                    value: 'SUPER_ADMIN',
                    title: 'Super Admin',
                    desc: 'Kelola semua akun + reset sandi'
                  }
                ].map((opt) => {
                  const selected = role === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-start gap-2.5 min-h-[48px] ${
                        selected
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="create-role"
                        value={opt.value}
                        checked={selected}
                        onChange={() => setRole(opt.value)}
                        className="mt-1 accent-emerald-700"
                      />
                      <span className="text-xs leading-snug">
                        <strong className="block font-bold">{opt.title}</strong>
                        <span className="text-slate-500">{opt.desc}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="create-password" className="block text-sm font-semibold text-slate-700">
                  Kata Sandi Awal <span className="text-rose-600" aria-hidden="true">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setPassword(generateReadablePassword());
                    setShowCreatePass(true);
                    setFormError('');
                  }}
                  className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                >
                  Buat Sandi Otomatis
                </button>
              </div>
              <span id="create-pass-hint" className="block text-xs text-slate-500">
                Minimal 6 karakter. Bisa direset kapan saja oleh Super Admin.
              </span>
              <div className="relative flex items-center">
                <input
                  ref={passwordInputRef}
                  id="create-password"
                  name="password"
                  type={showCreatePass ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  aria-describedby="create-pass-hint"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFormError('');
                  }}
                  placeholder="Minimal 6 karakter"
                  className="pjj-field-control w-full pl-3.5 pr-12 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
                <button
                  type="button"
                  aria-pressed={showCreatePass}
                  aria-label={showCreatePass ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  onClick={() => setShowCreatePass((v) => !v)}
                  className="absolute right-2 w-9 h-9 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 flex items-center justify-center cursor-pointer"
                >
                  <MaterialIcon
                    name={showCreatePass ? 'visibility_off' : 'visibility'}
                    className="text-lg"
                  />
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              variant="secondary"
              fullWidth
              loading={isCreating}
              icon={<MaterialIcon name="person_add" className="text-xl" />}
            >
              Simpan & Buat Akun Guru
            </Button>
          </form>
        </section>

        {/* KOLOM KANAN: Daftar Akun Guru & Kontrol Reset Sandi */}
        <section className="lg:col-span-7 space-y-4">
          <search className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <label htmlFor="accounts-search" className="text-xs font-semibold text-slate-600">
                Cari Nama atau Username Guru
              </label>
              <input
                id="accounts-search"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ketik nama, username, atau kelas"
                className="w-full h-11 px-3 text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-600"
              />
            </div>

            <div className="w-full sm:w-44 flex flex-col gap-1 shrink-0">
              <label htmlFor="accounts-role-filter" className="text-xs font-semibold text-slate-600">
                Filter Peran
              </label>
              <select
                id="accounts-role-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full h-11 px-3 text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-600"
              >
                <option value="ALL">Semua Peran</option>
                <option value="GURU">Akun Guru</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              loading={isFetching}
              icon={<MaterialIcon name="refresh" className="text-base" />}
              className="h-11 shrink-0"
            >
              Muat Ulang
            </Button>
          </search>

          {isLoading ? (
            <div className="p-12 text-center text-sm font-semibold text-slate-500 bg-white border border-slate-200 rounded-2xl">
              Memuat daftar akun guru TKIT Al Madani...
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              materialIcon="group"
              title="Akun Tidak Ditemukan"
              description="Coba ubah kata kunci pencarian atau tambahkan akun guru baru di sebelah kiri."
            />
          ) : (
            <div
              tabIndex={0}
              role="region"
              aria-labelledby="accounts-table-caption"
              className="pjj-table-wrapper"
            >
              <table className="pjj-table">
                <caption id="accounts-table-caption" className="sr-only">
                  Daftar Akun Guru dan Super Admin TKIT Al Madani
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Nama & Username</th>
                    <th scope="col">Peran & Kelas</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isSelf = currentUser?.id === u.id;
                    const isAdmin = u.role === 'SUPER_ADMIN';

                    return (
                      <tr key={u.id}>
                        <th scope="row" className="font-bold text-slate-800">
                          <div className="min-w-[160px]">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span>{u.nama_lengkap}</span>
                              {isSelf && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-600">
                                  Anda
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-xs font-medium text-slate-500 block mt-0.5">
                              @{u.username}
                            </span>
                          </div>
                        </th>

                        <td data-label="Peran & Kelas">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-xs font-semibold whitespace-nowrap ${
                                isAdmin
                                  ? 'bg-slate-800 text-white border-slate-700'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              <MaterialIcon
                                name={isAdmin ? 'shield_person' : 'school'}
                                className="text-sm"
                              />
                              <span>{isAdmin ? 'Super Admin' : 'Guru'}</span>
                            </span>
                            {u.jabatan_kelas &&
                              u.jabatan_kelas.toLowerCase() !== 'guru' && (
                                <span className="block text-xs text-slate-500">
                                  {u.jabatan_kelas}
                                </span>
                              )}
                          </div>
                        </td>

                        <td data-label="Status">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-xs font-semibold whitespace-nowrap ${
                              u.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            <MaterialIcon
                              name={u.is_active ? 'check_circle' : 'pause_circle'}
                              className="text-sm"
                            />
                            <span>{u.is_active ? 'Aktif' : 'Nonaktif'}</span>
                          </span>
                        </td>

                        <td data-label="Aksi" className="text-right">
                          <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openResetModal(u)}
                              className="h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-xs font-semibold text-slate-700 hover:text-amber-900 inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title="Reset Kata Sandi"
                            >
                              <MaterialIcon name="lock_reset" className="text-base" />
                              <span>Reset Sandi</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModal(u)}
                              className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 inline-flex items-center justify-center transition-colors cursor-pointer"
                              title="Ubah Profil & Peran"
                            >
                              <MaterialIcon name="edit" className="text-base" />
                            </button>

                            {!isSelf && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleActive(u)}
                                  className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 inline-flex items-center justify-center transition-colors cursor-pointer"
                                  title={u.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                                >
                                  <MaterialIcon
                                    name={u.is_active ? 'person_off' : 'how_to_reg'}
                                    className="text-base"
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDeleteTargetUser(u)}
                                  className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 inline-flex items-center justify-center transition-colors cursor-pointer"
                                  title="Hapus Akun"
                                >
                                  <MaterialIcon name="delete_outline" className="text-base" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Native <dialog> Reset Kata Sandi (sesuai Modern Web Guidance `dialog`) */}
      <dialog
        ref={resetDialogRef}
        aria-labelledby="reset-dialog-title"
        closedby="closerequest"
        onClose={() => setResetTargetUser(null)}
        onCancel={() => setResetTargetUser(null)}
        className="w-[92vw] max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl m-auto"
      >
        {resetTargetUser && (
          <form onSubmit={handleResetSubmit} noValidate className="space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 id="reset-dialog-title" className="font-duo-display text-lg font-bold text-slate-800">
                  Reset Kata Sandi Akun
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {resetTargetUser.nama_lengkap} (<span className="font-mono">@{resetTargetUser.username}</span>)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResetTargetUser(null)}
                className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
                aria-label="Tutup dialog"
              >
                <MaterialIcon name="close" className="text-lg" />
              </button>
            </div>

            {resetError && (
              <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {resetError}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="reset-pass-input" className="text-sm font-semibold text-slate-700">
                  Kata Sandi Baru <span className="text-rose-600" aria-hidden="true">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetNewPass(generateReadablePassword());
                    setShowResetPass(true);
                    setResetError('');
                  }}
                  className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                >
                  Buat Sandi Otomatis
                </button>
              </div>
              <span id="reset-pass-hint" className="block text-xs text-slate-500">
                Minimal 6 karakter. Berikan sandi baru ini ke guru bersangkutan.
              </span>
              <div className="relative flex items-center">
                <input
                  ref={resetPassInputRef}
                  id="reset-pass-input"
                  type={showResetPass ? 'text' : 'password'}
                  autoFocus
                  required
                  minLength={6}
                  autoComplete="new-password"
                  aria-describedby="reset-pass-hint"
                  value={resetNewPass}
                  onChange={(e) => {
                    setResetNewPass(e.target.value);
                    setResetError('');
                  }}
                  placeholder="Masukkan kata sandi baru"
                  className="pjj-field-control w-full pl-3.5 pr-12 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
                <button
                  type="button"
                  aria-pressed={showResetPass}
                  aria-label={showResetPass ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  onClick={() => setShowResetPass((v) => !v)}
                  className="absolute right-2 w-9 h-9 rounded-lg text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
                >
                  <MaterialIcon
                    name={showResetPass ? 'visibility_off' : 'visibility'}
                    className="text-lg"
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setResetTargetUser(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="primary"
                loading={isResetting}
                icon={<MaterialIcon name="lock_reset" className="text-base" />}
              >
                Simpan Sandi Baru
              </Button>
            </div>
          </form>
        )}
      </dialog>

      {/* Native <dialog> Ubah Info & Peran Akun */}
      <dialog
        ref={editDialogRef}
        aria-labelledby="edit-dialog-title"
        closedby="closerequest"
        onClose={() => setEditTargetUser(null)}
        onCancel={() => setEditTargetUser(null)}
        className="w-[92vw] max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl m-auto"
      >
        {editTargetUser && (
          <form onSubmit={handleEditSubmit} noValidate className="space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 id="edit-dialog-title" className="font-duo-display text-lg font-bold text-slate-800">
                  Ubah Data Akun Guru
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Username: <span className="font-mono">@{editTargetUser.username}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditTargetUser(null)}
                className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
                aria-label="Tutup dialog"
              >
                <MaterialIcon name="close" className="text-lg" />
              </button>
            </div>

            {editError && (
              <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {editError}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="edit-nama" className="text-sm font-semibold text-slate-700">
                Nama Lengkap <span className="text-rose-600" aria-hidden="true">*</span>
              </label>
              <input
                id="edit-nama"
                type="text"
                autoFocus
                required
                minLength={2}
                value={editNama}
                onChange={(e) => {
                  setEditNama(e.target.value);
                  setEditError('');
                }}
                className="pjj-field-control w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-jabatan" className="text-sm font-semibold text-slate-700">
                Jabatan / Kelas Mengajar
              </label>
              <input
                id="edit-jabatan"
                type="text"
                value={editJabatan}
                onChange={(e) => setEditJabatan(e.target.value)}
                className="pjj-field-control w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-role" className="text-sm font-semibold text-slate-700">
                Peran Akses
              </label>
              <select
                id="edit-role"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                disabled={currentUser?.id === editTargetUser.id}
                className="pjj-field-control w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600 disabled:opacity-60"
              >
                <option value="GURU">Guru (Materi Bersama & Rekap PJJ)</option>
                <option value="SUPER_ADMIN">Super Admin (Kelola Semua Akun)</option>
              </select>
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer min-h-[48px]">
              <input
                type="checkbox"
                checked={editActive}
                disabled={currentUser?.id === editTargetUser.id}
                onChange={(e) => setEditActive(e.target.checked)}
                className="w-4 h-4 accent-emerald-700"
              />
              <span className="text-sm font-medium text-slate-700">
                Akun aktif (diizinkan masuk ke sistem)
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEditTargetUser(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                loading={isUpdating}
                icon={<MaterialIcon name="save" className="text-base" />}
              >
                Simpan Perubahan
              </Button>
            </div>
          </form>
        )}
      </dialog>

      {/* Modal Konfirmasi Hapus Akun (Aman: autofocus pada tombol Batal) */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetUser)}
        onClose={() => setDeleteTargetUser(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Akun Guru?"
        message={
          deleteTargetUser
            ? `Akun ${deleteTargetUser.nama_lengkap} (@${deleteTargetUser.username}) akan dihapus. Materi yang sudah pernah dibuat guru ini di Bank Materi Bersama tidak ikut terhapus.`
            : ''
        }
        confirmText="Ya, Hapus Akun"
        cancelText="Batal"
        variant="danger"
        icon="delete"
      />
    </AdminLayout>
  );
};
