import { hasDatabase, getSql, ensureSchemaAndSeed } from './_db.js';
import { parseQuery, readJsonBody, sendJson } from './_http.js';
import { verifyTeacherRequest } from './_auth.js';

export default async function handler(req, res) {
  if (!hasDatabase()) {
    return sendJson(res, 503, {
      success: false,
      mode: 'local_only',
      message: 'DATABASE_URL belum tersedia.'
    });
  }

  try {
    await ensureSchemaAndSeed(false);
    const sql = getSql();

    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      const studentName = String(body.student_name || '').trim().slice(0, 80);
      const className = String(body.class_name || '').trim().slice(0, 40);
      const predicate = body.predicate === 'EXCELLENT' ? 'EXCELLENT' : 'GOOD';
      const badgeSymbol = ['trophy', 'star', 'medal'].includes(body.badge_symbol)
        ? body.badge_symbol
        : predicate === 'EXCELLENT'
        ? 'trophy'
        : 'star';

      if (!studentName) {
        return sendJson(res, 400, {
          success: false,
          message: 'Mohon isi nama ananda terlebih dahulu.'
        });
      }
      if (!className) {
        return sendJson(res, 400, {
          success: false,
          message: 'Mohon pilih kelas ananda terlebih dahulu.'
        });
      }

      const id = 'pjj-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);

      // Pastikan foreign key aman jika ID belum ada di DB (fallback NULL jika video demo lokal)
      const videoIdRaw = body.video_id ? String(body.video_id) : null;
      const vidExists = videoIdRaw
        ? await sql`SELECT id, theme_id, subtheme_id, judul_video FROM videos WHERE id = ${videoIdRaw} LIMIT 1`
        : [];
      const dbVideo = vidExists[0] || null;

      const themeIdRaw = dbVideo?.theme_id || (body.theme_id ? String(body.theme_id) : null);
      const themeExists = themeIdRaw
        ? await sql`SELECT id, judul_tema FROM themes WHERE id = ${themeIdRaw} LIMIT 1`
        : [];
      const dbTheme = themeExists[0] || null;

      const subIdRaw = dbVideo?.subtheme_id || (body.subtheme_id ? String(body.subtheme_id) : null);
      const subExists = subIdRaw
        ? await sql`SELECT id, judul_subtema FROM subthemes WHERE id = ${subIdRaw} LIMIT 1`
        : [];
      const dbSub = subExists[0] || null;

      const safeThemeTitle = dbTheme?.judul_tema || String(body.theme_title || 'Tema Pembelajaran').slice(0, 120);
      const safeSubTitle = dbSub?.judul_subtema || String(body.subtheme_title || '').slice(0, 120);
      const safeVideoTitle = dbVideo?.judul_video || String(body.video_title || 'Video Pembelajaran').slice(0, 150);

      await sql`
        INSERT INTO pjj_records (
          id, theme_id, theme_title, subtheme_id, subtheme_title, video_id, video_title,
          student_name, class_name, predicate, badge_symbol, closing_game_played, notes, submitted_at
        )
        VALUES (
          ${id},
          ${dbTheme ? dbTheme.id : null},
          ${safeThemeTitle},
          ${dbSub ? dbSub.id : null},
          ${safeSubTitle},
          ${dbVideo ? dbVideo.id : null},
          ${safeVideoTitle},
          ${studentName},
          ${className},
          ${predicate},
          ${badgeSymbol},
          ${body.closing_game_played !== false},
          ${String(body.notes || '').slice(0, 200)},
          NOW()
        )
      `;

      const inserted = await sql`SELECT * FROM pjj_records WHERE id = ${id} LIMIT 1`;
      return sendJson(res, 201, {
        success: true,
        message: 'Catatan partisipasi PJJ ananda berhasil tersimpan untuk Ibu Guru.',
        data: inserted[0]
      });
    }

    if (req.method === 'GET') {
      const teacher = verifyTeacherRequest(req);
      if (!teacher) {
        return sendJson(res, 401, {
          success: false,
          message: 'Akses ditolak. Rekap aktivitas anak hanya boleh dibuka oleh Guru.'
        });
      }

      const query = parseQuery(req);
      const rows = await sql`SELECT * FROM pjj_records ORDER BY submitted_at DESC`;

      let filtered = rows;
      if (query.class_name && query.class_name !== 'ALL') {
        filtered = filtered.filter((r) => r.class_name === query.class_name);
      }
      if (query.predicate && query.predicate !== 'ALL') {
        filtered = filtered.filter((r) => r.predicate === query.predicate);
      }
      if (query.theme_id && query.theme_id !== 'ALL') {
        filtered = filtered.filter((r) => r.theme_id === query.theme_id);
      }
      if (query.search) {
        const q = String(query.search).toLowerCase();
        filtered = filtered.filter(
          (r) =>
            (r.student_name || '').toLowerCase().includes(q) ||
            (r.video_title || '').toLowerCase().includes(q) ||
            (r.theme_title || '').toLowerCase().includes(q)
        );
      }

      return sendJson(res, 200, {
        success: true,
        source: 'postgres',
        data: filtered
      });
    }

    if (req.method === 'DELETE') {
      const teacher = verifyTeacherRequest(req);
      if (!teacher) {
        return sendJson(res, 401, {
          success: false,
          message: 'Akses ditolak. Hanya Guru yang dapat menghapus catatan PJJ.'
        });
      }

      const query = parseQuery(req);
      if (query.all === 'true') {
        await sql`DELETE FROM pjj_records`;
        return sendJson(res, 200, {
          success: true,
          message: 'Seluruh catatan PJJ berhasil dibersihkan.'
        });
      }

      if (!query.id) {
        return sendJson(res, 400, { success: false, message: 'ID catatan tidak ditemukan.' });
      }

      await sql`DELETE FROM pjj_records WHERE id = ${query.id}`;
      return sendJson(res, 200, {
        success: true,
        message: 'Catatan belajar anak berhasil dihapus.',
        data: { id: query.id }
      });
    }

    return sendJson(res, 405, { success: false, message: 'Metode tidak didukung.' });
  } catch (err) {
    console.error('[/api/pjj error]', err);
    return sendJson(res, 500, {
      success: false,
      message: err.message || 'Gagal memproses data aktivitas PJJ.'
    });
  }
}
