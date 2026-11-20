import {
  hasDatabase,
  getSql,
  ensureSchemaAndSeed,
  toPublicUser
} from './_db.js';
import {
  hashPassword,
  normalizeRole,
  verifyTeacherRequest,
  verifySuperAdminRequest
} from './_auth.js';
import { readJsonBody, sendJson } from './_http.js';

const USERNAME_RE = /^[a-z0-9._-]{3,32}$/;

const ensureActiveSuperAdmin = async (req, res) => {
  const caller = verifyTeacherRequest(req);
  if (!caller) {
    sendJson(res, 401, {
      success: false,
      message: 'Sesi belum login atau telah berakhir. Silakan masuk kembali.'
    });
    return null;
  }

  const adminToken = verifySuperAdminRequest(req);
  if (!adminToken) {
    sendJson(res, 403, {
      success: false,
      message: 'Akses ditolak. Pengelolaan akun guru hanya diperbolehkan untuk Super Admin.'
    });
    return null;
  }

  await ensureSchemaAndSeed(false);
  const sql = getSql();
  const rows = await sql`SELECT * FROM users WHERE id = ${adminToken.id} LIMIT 1`;
  const dbAdmin = rows[0];
  if (!dbAdmin || !dbAdmin.is_active || normalizeRole(dbAdmin.role) !== 'SUPER_ADMIN') {
    sendJson(res, 403, {
      success: false,
      message: 'Akun Super Admin Anda tidak aktif atau tidak memiliki hak akses lagi.'
    });
    return null;
  }

  return toPublicUser(dbAdmin);
};

export default async function handler(req, res) {
  if (!hasDatabase()) {
    return sendJson(res, 503, {
      success: false,
      mode: 'local_only',
      message: 'DATABASE_URL belum tersedia.'
    });
  }

  try {
    const caller = await ensureActiveSuperAdmin(req, res);
    if (!caller) return;

    const sql = getSql();

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT id, username, nama_lengkap, role, jabatan_kelas, is_active, created_at, updated_at, last_login_at
        FROM users
        ORDER BY CASE WHEN role = 'SUPER_ADMIN' THEN 0 ELSE 1 END, created_at ASC
      `;
      return sendJson(res, 200, {
        success: true,
        source: 'postgres',
        data: rows.map(toPublicUser)
      });
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      const { action, payload = {} } = body;

      if (action === 'createUser') {
        const username = String(payload.username || '').trim().toLowerCase();
        const namaLengkap = String(payload.nama_lengkap || '').trim().slice(0, 100);
        const jabatanKelas = String(payload.jabatan_kelas || 'Guru').trim().slice(0, 80) || 'Guru';
        const role = normalizeRole(payload.role || 'GURU');
        const password = String(payload.password || '').trim();

        if (!USERNAME_RE.test(username)) {
          return sendJson(res, 400, {
            success: false,
            message: 'Username wajib 3–32 karakter (huruf kecil, angka, titik, garis bawah, atau tanda hubung tanpa spasi).'
          });
        }
        if (namaLengkap.length < 2) {
          return sendJson(res, 400, {
            success: false,
            message: 'Mohon isi nama lengkap guru minimal 2 karakter.'
          });
        }
        if (password.length < 6) {
          return sendJson(res, 400, {
            success: false,
            message: 'Kata sandi awal minimal 6 karakter.'
          });
        }

        const existing = await sql`SELECT id FROM users WHERE LOWER(username) = ${username} LIMIT 1`;
        if (existing.length > 0) {
          return sendJson(res, 409, {
            success: false,
            message: `Username "${username}" sudah digunakan oleh akun lain.`
          });
        }

        const newId = 'usr-' + username.replace(/[^a-z0-9]/g, '') + '-' + Date.now().toString().slice(-4);
        const passwordHash = hashPassword(password);

        await sql`
          INSERT INTO users (id, username, nama_lengkap, role, jabatan_kelas, password_hash, is_active)
          VALUES (${newId}, ${username}, ${namaLengkap}, ${role}, ${jabatanKelas}, ${passwordHash}, TRUE)
        `;

        const inserted = await sql`SELECT * FROM users WHERE id = ${newId} LIMIT 1`;
        return sendJson(res, 201, {
          success: true,
          message: `Akun untuk ${namaLengkap} (@${username}) berhasil dibuat.`,
          data: toPublicUser(inserted[0])
        });
      }

      if (action === 'updateUser') {
        const targetId = String(payload.id || '').trim();
        const rows = await sql`SELECT * FROM users WHERE id = ${targetId} LIMIT 1`;
        if (rows.length === 0) {
          return sendJson(res, 404, { success: false, message: 'Akun pengguna tidak ditemukan.' });
        }

        const target = rows[0];
        const nextName =
          payload.nama_lengkap !== undefined
            ? String(payload.nama_lengkap || '').trim().slice(0, 100)
            : target.nama_lengkap;
        const nextJabatan =
          payload.jabatan_kelas !== undefined
            ? String(payload.jabatan_kelas || '').trim().slice(0, 80)
            : target.jabatan_kelas;
        const nextRole =
          payload.role !== undefined ? normalizeRole(payload.role) : normalizeRole(target.role);
        const nextActive =
          payload.is_active !== undefined ? Boolean(payload.is_active) : Boolean(target.is_active);

        if (nextName.length < 2) {
          return sendJson(res, 400, {
            success: false,
            message: 'Nama lengkap minimal 2 karakter.'
          });
        }

        if (target.id === caller.id && (!nextActive || nextRole !== 'SUPER_ADMIN')) {
          return sendJson(res, 400, {
            success: false,
            message: 'Anda tidak dapat menonaktifkan atau menurunkan peran akun Super Admin yang sedang Anda pakai.'
          });
        }

        await sql`
          UPDATE users SET
            nama_lengkap = ${nextName},
            jabatan_kelas = ${nextJabatan || 'Guru Kelas'},
            role = ${nextRole},
            is_active = ${nextActive},
            updated_at = NOW()
          WHERE id = ${targetId}
        `;

        const updated = await sql`SELECT * FROM users WHERE id = ${targetId} LIMIT 1`;
        return sendJson(res, 200, {
          success: true,
          message: `Data akun ${nextName} berhasil diperbarui.`,
          data: toPublicUser(updated[0])
        });
      }

      if (action === 'resetPassword') {
        const targetId = String(payload.id || '').trim();
        const newPassword = String(payload.newPassword || '').trim();
        if (newPassword.length < 6) {
          return sendJson(res, 400, {
            success: false,
            message: 'Kata sandi baru minimal 6 karakter.'
          });
        }

        const rows = await sql`SELECT id, nama_lengkap, username FROM users WHERE id = ${targetId} LIMIT 1`;
        if (rows.length === 0) {
          return sendJson(res, 404, { success: false, message: 'Akun pengguna tidak ditemukan.' });
        }

        const passwordHash = hashPassword(newPassword);
        await sql`
          UPDATE users SET
            password_hash = ${passwordHash},
            updated_at = NOW()
          WHERE id = ${targetId}
        `;

        return sendJson(res, 200, {
          success: true,
          message: `Kata sandi untuk ${rows[0].nama_lengkap} (@${rows[0].username}) berhasil diatur ulang.`
        });
      }

      if (action === 'deleteUser') {
        const targetId = String(payload.id || '').trim();
        if (targetId === caller.id) {
          return sendJson(res, 400, {
            success: false,
            message: 'Anda tidak dapat menghapus akun yang sedang aktif digunakan.'
          });
        }

        const rows = await sql`SELECT * FROM users WHERE id = ${targetId} LIMIT 1`;
        if (rows.length === 0) {
          return sendJson(res, 404, { success: false, message: 'Akun tidak ditemukan.' });
        }

        if (normalizeRole(rows[0].role) === 'SUPER_ADMIN') {
          const superAdmins = await sql`SELECT COUNT(*)::int AS cnt FROM users WHERE role = 'SUPER_ADMIN' AND is_active = TRUE`;
          if ((superAdmins[0]?.cnt || 0) <= 1) {
            return sendJson(res, 400, {
              success: false,
              message: 'Minimal harus ada 1 akun Super Admin yang aktif.'
            });
          }
        }

        await sql`DELETE FROM users WHERE id = ${targetId}`;
        return sendJson(res, 200, {
          success: true,
          message: `Akun ${rows[0].nama_lengkap} berhasil dihapus.`
        });
      }

      return sendJson(res, 400, { success: false, message: `Aksi tidak dikenal: ${action}` });
    }

    return sendJson(res, 405, { success: false, message: 'Metode tidak didukung.' });
  } catch (err) {
    console.error('[/api/users error]', err);
    return sendJson(res, 500, {
      success: false,
      message: err.message || 'Terjadi kesalahan pada pengelolaan akun.'
    });
  }
}
