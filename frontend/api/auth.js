import { readJsonBody, sendJson } from './_http.js';
import { hasDatabase, getSql, ensureSchemaAndSeed, toPublicUser } from './_db.js';
import {
  verifyPassword,
  signTeacherToken,
  verifyTeacherRequest
} from './_auth.js';

export default async function handler(req, res) {
  if (!hasDatabase()) {
    return sendJson(res, 503, {
      success: false,
      mode: 'local_only',
      message: 'DATABASE_URL belum tersedia; autentikasi memakai data lokal browser.'
    });
  }

  try {
    await ensureSchemaAndSeed(false);
    const sql = getSql();

    if (req.method === 'GET') {
      const tokenUser = verifyTeacherRequest(req);
      if (!tokenUser) {
        return sendJson(res, 401, {
          success: false,
          authenticated: false,
          message: 'Sesi belum masuk atau telah berakhir.'
        });
      }

      const rows = await sql`SELECT * FROM users WHERE id = ${tokenUser.id} LIMIT 1`;
      const dbUser = rows[0];
      if (!dbUser || !dbUser.is_active) {
        return sendJson(res, 401, {
          success: false,
          authenticated: false,
          message: 'Akun Anda sudah tidak aktif. Silakan hubungi Super Admin Sekolah.'
        });
      }

      return sendJson(res, 200, {
        success: true,
        authenticated: true,
        source: 'postgres',
        data: toPublicUser(dbUser)
      });
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      const username = String(body.username || '').trim().toLowerCase();
      const password = String(body.password || '').trim();

      if (!username || !password) {
        return sendJson(res, 400, {
          success: false,
          message: 'Mohon isi username dan kata sandi.',
          data: null
        });
      }

      const rows = await sql`SELECT * FROM users WHERE LOWER(username) = ${username} LIMIT 1`;
      const dbUser = rows[0];

      if (!dbUser || !verifyPassword(password, dbUser.password_hash)) {
        return sendJson(res, 401, {
          success: false,
          message: 'Username atau kata sandi belum tepat.',
          data: null
        });
      }

      if (!dbUser.is_active) {
        return sendJson(res, 403, {
          success: false,
          message: 'Akun Anda sedang dinonaktifkan oleh Super Admin. Silakan hubungi administrator sekolah.',
          data: null
        });
      }

      await sql`UPDATE users SET last_login_at = NOW() WHERE id = ${dbUser.id}`;
      const refreshed = await sql`SELECT * FROM users WHERE id = ${dbUser.id} LIMIT 1`;
      const publicUser = toPublicUser(refreshed[0] || dbUser);
      const token = signTeacherToken(publicUser);

      return sendJson(res, 200, {
        success: true,
        source: 'postgres',
        message: 'Login berhasil. Selamat datang, ' + publicUser.nama_lengkap,
        data: {
          ...publicUser,
          token,
          login_at: new Date().toISOString()
        }
      });
    }

    return sendJson(res, 405, { success: false, message: 'Metode tidak didukung.' });
  } catch (err) {
    console.error('[/api/auth error]', err);
    return sendJson(res, 500, {
      success: false,
      message: err.message || 'Terjadi kendala pada layanan autentikasi.'
    });
  }
}
