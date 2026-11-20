import { hasDatabase, ensureSchemaAndSeed, getSql } from './_db.js';
import { sendJson } from './_http.js';

export default async function handler(req, res) {
  if (!hasDatabase()) {
    return sendJson(res, 200, {
      ok: true,
      mode: 'local_only',
      message: 'DATABASE_URL belum tersedia; aplikasi memakai penyimpanan lokal browser.'
    });
  }

  try {
    await ensureSchemaAndSeed(false);
    const sql = getSql();
    const check = await sql`SELECT NOW() AS server_time`;
    return sendJson(res, 200, {
      ok: true,
      mode: 'postgres',
      serverTime: check[0]?.server_time || new Date().toISOString(),
      message: 'Koneksi PostgreSQL Neon aktif dan skema siap.'
    });
  } catch (err) {
    return sendJson(res, 500, {
      ok: false,
      mode: 'error',
      message: err.message || 'Gagal menghubungi PostgreSQL Neon.'
    });
  }
}
