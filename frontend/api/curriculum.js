import {
  hasDatabase,
  getSql,
  ensureSchemaAndSeed,
  loadFullData,
  seedCurriculumIntoDb
} from './_db.js';
import { readJsonBody, sendJson } from './_http.js';
import { verifyTeacherRequest } from './_auth.js';

const extractYouTubeId = (url) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:shorts\/|embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match && match[1] ? match[1] : '';
};

const parseMMSSToSeconds = (str) => {
  if (!str) return 0;
  if (typeof str === 'number') return str;
  const parts = String(str).trim().split(':');
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10) || 0;
    const s = parseInt(parts[1], 10) || 0;
    return m * 60 + s;
  }
  return parseInt(str, 10) || 0;
};

const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default async function handler(req, res) {
  if (!hasDatabase()) {
    return sendJson(res, 503, {
      success: false,
      mode: 'local_only',
      message: 'DATABASE_URL belum tersedia.'
    });
  }

  try {
    if (req.method === 'GET') {
      const data = await loadFullData();
      return sendJson(res, 200, {
        success: true,
        source: 'postgres',
        data
      });
    }

    if (req.method === 'POST') {
      const teacher = verifyTeacherRequest(req);
      if (!teacher) {
        return sendJson(res, 401, {
          success: false,
          message: 'Akses ditolak. Perubahan kurikulum hanya boleh dilakukan oleh Guru.'
        });
      }

      await ensureSchemaAndSeed(false);
      const sql = getSql();
      const body = await readJsonBody(req);
      const { action, payload = {} } = body;

      if (action === 'saveSiteConfig') {
        const current = await sql`SELECT config_json FROM site_config WHERE id = 'default' LIMIT 1`;
        const merged = { ...(current[0]?.config_json || {}), ...payload };
        await sql`
          INSERT INTO site_config (id, config_json, updated_at)
          VALUES ('default', ${JSON.stringify(merged)}::jsonb, NOW())
          ON CONFLICT (id) DO UPDATE SET config_json = EXCLUDED.config_json, updated_at = NOW()
        `;
        return sendJson(res, 200, {
          success: true,
          message: 'Pengaturan tampilan berhasil disimpan ke PostgreSQL.',
          data: merged
        });
      }

      if (action === 'resetSeedData') {
        await ensureSchemaAndSeed(true);
        const data = await loadFullData();
        return sendJson(res, 200, {
          success: true,
          message: 'Seluruh materi berhasil dikosongkan dan pengaturan dikembalikan ke awal.',
          data
        });
      }

      if (action === 'clearAllThemes') {
        await sql`DELETE FROM cue_points`;
        await sql`DELETE FROM videos`;
        await sql`DELETE FROM subthemes`;
        await sql`DELETE FROM themes`;
        const data = await loadFullData();
        return sendJson(res, 200, {
          success: true,
          message: 'Seluruh tema, subtema, dan video berhasil dikosongkan.',
          data
        });
      }

      if (action === 'saveTheme') {
        const isEdit = Boolean(payload.id && payload.id !== 'undefined');
        let targetId = isEdit ? payload.id : null;

        if (isEdit) {
          const rows = await sql`SELECT * FROM themes WHERE id = ${targetId} OR slug = ${targetId} LIMIT 1`;
          if (rows.length === 0) {
            return sendJson(res, 404, { success: false, message: 'Tema tidak ditemukan.' });
          }
          const existing = rows[0];
          targetId = existing.id;
          const nextTitle = payload.judul_tema || existing.judul_tema;
          const nextSlug = payload.slug || slugify(nextTitle) || existing.slug;

          await sql`
            UPDATE themes SET
              slug = ${nextSlug},
              judul_tema = ${nextTitle},
              deskripsi = ${payload.deskripsi ?? existing.deskripsi},
              rentang_usia = ${payload.rentang_usia ?? existing.rentang_usia},
              warna_tema = ${payload.warna_tema || payload.warna_hex || existing.warna_tema},
              ikon_emoji = ${payload.ikon_emoji || existing.ikon_emoji},
              teks_tombol_kartu = ${payload.teks_tombol_kartu || existing.teks_tombol_kartu},
              label_kategori = ${payload.label_kategori ?? existing.label_kategori},
              status_publikasi = ${payload.status_publikasi || existing.status_publikasi},
              urutan = ${Number(payload.urutan) || existing.urutan},
              updated_by_name = ${teacher.nama_lengkap || ''},
              updated_at = NOW()
            WHERE id = ${targetId}
          `;
        } else {
          const countRows = await sql`SELECT COUNT(*)::int AS cnt FROM themes`;
          const nextOrder = Number(payload.urutan) || (countRows[0]?.cnt || 0) + 1;
          targetId = 'theme-' + slugify(payload.judul_tema || 'baru') + '-' + Date.now().toString().slice(-4);
          const nextSlug = slugify(payload.judul_tema || targetId) + '-' + Date.now().toString().slice(-3);

          await sql`
            INSERT INTO themes (
              id, slug, judul_tema, deskripsi, rentang_usia, warna_tema,
              ikon_emoji, teks_tombol_kartu, label_kategori, status_publikasi, urutan,
              created_by_id, created_by_name, updated_by_name
            )
            VALUES (
              ${targetId},
              ${nextSlug},
              ${payload.judul_tema || 'Tema Baru'},
              ${payload.deskripsi || ''},
              ${payload.rentang_usia || 'Usia 4–6 Tahun (TK A & TK B)'},
              ${payload.warna_tema || payload.warna_hex || '#0EA5E9'},
              ${payload.ikon_emoji || 'star'},
              ${payload.teks_tombol_kartu || 'Mulai Belajar'},
              ${payload.label_kategori || ''},
              ${payload.status_publikasi || 'PUBLISHED'},
              ${nextOrder},
              ${teacher.id || null},
              ${teacher.nama_lengkap || ''},
              ${teacher.nama_lengkap || ''}
            )
          `;
        }

        const full = await loadFullData();
        const savedTheme = full.curriculum.themes.find((t) => t.id === targetId);
        return sendJson(res, 200, {
          success: true,
          message: isEdit ? 'Tema berhasil diperbarui.' : 'Tema baru berhasil ditambahkan.',
          data: savedTheme
        });
      }

      if (action === 'deleteTheme') {
        const themeId = payload.themeId;
        await sql`DELETE FROM themes WHERE id = ${themeId} OR slug = ${themeId}`;
        return sendJson(res, 200, {
          success: true,
          message: 'Tema berhasil dihapus.',
          data: { id: themeId }
        });
      }

      if (action === 'saveSubthemeGroup') {
        const { themeId, groupData = {} } = payload;
        const themeRows = await sql`SELECT id FROM themes WHERE id = ${themeId} OR slug = ${themeId} LIMIT 1`;
        if (themeRows.length === 0) {
          return sendJson(res, 404, { success: false, message: 'Tema tidak ditemukan.' });
        }
        const realThemeId = themeRows[0].id;
        const isEdit = Boolean(groupData.id && groupData.id !== 'undefined');
        let targetGroupId = isEdit ? groupData.id : null;

        if (isEdit) {
          const rows = await sql`SELECT * FROM subthemes WHERE id = ${targetGroupId} LIMIT 1`;
          if (rows.length === 0) {
            return sendJson(res, 404, { success: false, message: 'Sub Tema tidak ditemukan.' });
          }
          const existing = rows[0];
          await sql`
            UPDATE subthemes SET
              judul_subtema = ${groupData.judul_subtema || existing.judul_subtema},
              deskripsi_subtema = ${groupData.deskripsi_subtema ?? existing.deskripsi_subtema},
              urutan = ${Number(groupData.urutan) || existing.urutan},
              updated_by_name = ${teacher.nama_lengkap || ''},
              updated_at = NOW()
            WHERE id = ${targetGroupId}
          `;
        } else {
          const countRows = await sql`SELECT COUNT(*)::int AS cnt FROM subthemes WHERE theme_id = ${realThemeId}`;
          const nextOrder = Number(groupData.urutan) || (countRows[0]?.cnt || 0) + 1;
          targetGroupId = 'subtema-' + slugify(groupData.judul_subtema || 'baru') + '-' + Date.now().toString().slice(-4);
          await sql`
            INSERT INTO subthemes (
              id, theme_id, judul_subtema, deskripsi_subtema, urutan,
              created_by_id, created_by_name, updated_by_name
            )
            VALUES (
              ${targetGroupId},
              ${realThemeId},
              ${groupData.judul_subtema || 'Sub Tema Baru'},
              ${groupData.deskripsi_subtema || ''},
              ${nextOrder},
              ${teacher.id || null},
              ${teacher.nama_lengkap || ''},
              ${teacher.nama_lengkap || ''}
            )
          `;
        }

        const full = await loadFullData();
        const theme = full.curriculum.themes.find((t) => t.id === realThemeId);
        const savedSub = theme?.subthemes.find((g) => g.id === targetGroupId);
        return sendJson(res, 200, {
          success: true,
          message: isEdit ? 'Sub Tema berhasil diperbarui.' : 'Sub Tema baru berhasil ditambahkan.',
          data: savedSub
        });
      }

      if (action === 'deleteSubthemeGroup') {
        const { groupId } = payload;
        await sql`DELETE FROM subthemes WHERE id = ${groupId}`;
        return sendJson(res, 200, {
          success: true,
          message: 'Sub Tema beserta videonya berhasil dihapus.',
          data: { id: groupId }
        });
      }

      if (action === 'saveVideo') {
        const { themeId, videoData = {} } = payload;
        const themeRows = await sql`SELECT id FROM themes WHERE id = ${themeId} OR slug = ${themeId} LIMIT 1`;
        if (themeRows.length === 0) {
          return sendJson(res, 404, { success: false, message: 'Tema induk tidak ditemukan.' });
        }
        const realThemeId = themeRows[0].id;
        const ytId = extractYouTubeId(videoData.youtube_url) || videoData.youtube_video_id;
        if (!ytId) {
          return sendJson(res, 400, { success: false, message: 'Tautan YouTube belum valid.' });
        }

        let targetSubId = videoData.subtheme_id;
        const existingSub = targetSubId
          ? await sql`SELECT id FROM subthemes WHERE id = ${targetSubId} LIMIT 1`
          : [];
        if (existingSub.length === 0) {
          const fallbackSub = await sql`SELECT id FROM subthemes WHERE theme_id = ${realThemeId} ORDER BY urutan ASC LIMIT 1`;
          if (fallbackSub.length > 0) {
            targetSubId = fallbackSub[0].id;
          } else {
            targetSubId = 'subtema-' + slugify(videoData.subtheme_title || 'utama') + '-' + Date.now().toString().slice(-4);
            await sql`
              INSERT INTO subthemes (id, theme_id, judul_subtema, deskripsi_subtema, urutan)
              VALUES (${targetSubId}, ${realThemeId}, ${videoData.subtheme_title || 'Sub Tema 1'}, '', 1)
            `;
          }
        }

        const isEdit = Boolean(videoData.id && videoData.id !== 'undefined');
        let targetVideoId = isEdit ? videoData.id : null;
        const videoTitle = videoData.judul_video || videoData.judul_subtema || 'Video Pembelajaran';

        if (isEdit) {
          const rows = await sql`SELECT * FROM videos WHERE id = ${targetVideoId} LIMIT 1`;
          if (rows.length === 0) {
            return sendJson(res, 404, { success: false, message: 'Video tidak ditemukan.' });
          }
          const ex = rows[0];
          const closingGameJson =
            videoData.closing_game !== undefined
              ? videoData.closing_game
                ? JSON.stringify(videoData.closing_game)
                : null
              : ex.closing_game_json
              ? JSON.stringify(ex.closing_game_json)
              : null;

          await sql`
            UPDATE videos SET
              theme_id = ${realThemeId},
              subtheme_id = ${targetSubId},
              label_episode = ${videoData.label_episode || ex.label_episode},
              judul_video = ${videoTitle},
              deskripsi_singkat = ${videoData.deskripsi_singkat ?? ex.deskripsi_singkat},
              youtube_url = ${videoData.youtube_url || ex.youtube_url},
              youtube_video_id = ${ytId},
              durasi_detik = ${Number(videoData.durasi_detik) || ex.durasi_detik},
              sumber_atribusi = ${videoData.sumber_atribusi ?? ex.sumber_atribusi},
              jenis_lisensi = ${videoData.jenis_lisensi ?? ex.jenis_lisensi},
              deklarasi_ai = ${videoData.deklarasi_ai ?? ex.deklarasi_ai},
              status_publikasi = ${videoData.status_publikasi || ex.status_publikasi},
              is_pjj_enabled = ${videoData.is_pjj_enabled !== undefined ? Boolean(videoData.is_pjj_enabled) : ex.is_pjj_enabled},
              pjj_notes = ${videoData.pjj_notes !== undefined ? videoData.pjj_notes : ex.pjj_notes},
              closing_game_json = ${closingGameJson}::jsonb,
              updated_by_name = ${teacher.nama_lengkap || ''},
              updated_at = NOW()
            WHERE id = ${targetVideoId}
          `;
        } else {
          const countRows = await sql`SELECT COUNT(*)::int AS cnt FROM videos WHERE subtheme_id = ${targetSubId}`;
          const nextOrder = (countRows[0]?.cnt || 0) + 1;
          targetVideoId = 'vid-' + slugify(videoTitle) + '-' + Date.now().toString().slice(-4);
          const closingGameJson = videoData.closing_game ? JSON.stringify(videoData.closing_game) : null;

          await sql`
            INSERT INTO videos (
              id, theme_id, subtheme_id, label_episode, judul_video, deskripsi_singkat,
              youtube_url, youtube_video_id, durasi_detik, sumber_atribusi, jenis_lisensi,
              deklarasi_ai, status_publikasi, urutan, is_pjj_enabled, pjj_notes, closing_game_json,
              created_by_id, created_by_name, updated_by_name
            )
            VALUES (
              ${targetVideoId},
              ${realThemeId},
              ${targetSubId},
              ${videoData.label_episode || `Video ${nextOrder}`},
              ${videoTitle},
              ${videoData.deskripsi_singkat || ''},
              ${videoData.youtube_url || ''},
              ${ytId},
              ${Number(videoData.durasi_detik) || 180},
              ${videoData.sumber_atribusi || 'Kanal Edukasi YouTube'},
              ${videoData.jenis_lisensi || 'YouTube Standard License (Official IFrame Embed)'},
              ${videoData.deklarasi_ai || 'Pertanyaan kuis disusun oleh Guru TKIT Al Madani.'},
              ${videoData.status_publikasi || 'PUBLISHED'},
              ${nextOrder},
              ${Boolean(videoData.is_pjj_enabled)},
              ${videoData.pjj_notes || ''},
              ${closingGameJson}::jsonb,
              ${teacher.id || null},
              ${teacher.nama_lengkap || ''},
              ${teacher.nama_lengkap || ''}
            )
          `;
        }

        const full = await loadFullData();
        let savedVideo = null;
        for (const t of full.curriculum.themes) {
          for (const g of t.subthemes) {
            const v = g.videos.find((item) => item.id === targetVideoId);
            if (v) savedVideo = v;
          }
        }
        return sendJson(res, 200, {
          success: true,
          message: isEdit ? 'Video pembelajaran berhasil diperbarui.' : 'Video pembelajaran baru berhasil ditambahkan.',
          data: savedVideo
        });
      }

      if (action === 'deleteVideo') {
        const { videoId } = payload;
        await sql`DELETE FROM videos WHERE id = ${videoId}`;
        return sendJson(res, 200, {
          success: true,
          message: 'Video pembelajaran berhasil dihapus.',
          data: { id: videoId }
        });
      }

      if (action === 'saveCuePoint') {
        const { videoId, cuePointData = {} } = payload;
        const vidRows = await sql`SELECT id FROM videos WHERE id = ${videoId} LIMIT 1`;
        if (vidRows.length === 0) {
          return sendJson(res, 404, { success: false, message: 'Video tidak ditemukan.' });
        }

        const isEdit = Boolean(cuePointData.id && cuePointData.id !== 'undefined');
        let targetCpId = isEdit ? cuePointData.id : null;
        const detikMuncul = parseMMSSToSeconds(cuePointData.detik_muncul);

        if (isEdit) {
          const rows = await sql`SELECT * FROM cue_points WHERE id = ${targetCpId} LIMIT 1`;
          if (rows.length === 0) {
            return sendJson(res, 404, { success: false, message: 'Kuis tidak ditemukan.' });
          }
          const ex = rows[0];
          await sql`
            UPDATE cue_points SET
              detik_muncul = ${detikMuncul},
              tipe_interaksi = ${cuePointData.tipe_interaksi || ex.tipe_interaksi},
              judul_pertanyaan = ${cuePointData.judul_pertanyaan || ex.judul_pertanyaan},
              ikon_stimulus = ${cuePointData.ikon_stimulus || ex.ikon_stimulus},
              payload_interaksi = ${JSON.stringify(cuePointData.payload_interaksi || ex.payload_interaksi)}::jsonb,
              updated_at = NOW()
            WHERE id = ${targetCpId}
          `;
        } else {
          targetCpId = 'cp-' + Date.now().toString().slice(-6);
          await sql`
            INSERT INTO cue_points (
              id, video_id, detik_muncul, tipe_interaksi, judul_pertanyaan,
              ikon_stimulus, payload_interaksi
            )
            VALUES (
              ${targetCpId},
              ${videoId},
              ${detikMuncul},
              ${cuePointData.tipe_interaksi || 'MULTIPLE_CHOICE'},
              ${cuePointData.judul_pertanyaan || ''},
              ${cuePointData.ikon_stimulus || 'question'},
              ${JSON.stringify(cuePointData.payload_interaksi || {})}::jsonb
            )
          `;
        }

        const full = await loadFullData();
        let savedCp = null;
        for (const t of full.curriculum.themes) {
          for (const g of t.subthemes) {
            const vid = g.videos.find((v) => v.id === videoId);
            if (vid) savedCp = vid.cue_points.find((c) => c.id === targetCpId);
          }
        }
        return sendJson(res, 200, {
          success: true,
          message: isEdit ? 'Pertanyaan kuis berhasil diperbarui.' : 'Pertanyaan kuis baru berhasil disimpan.',
          data: savedCp
        });
      }

      if (action === 'deleteCuePoint') {
        const { cuePointId } = payload;
        await sql`DELETE FROM cue_points WHERE id = ${cuePointId}`;
        return sendJson(res, 200, {
          success: true,
          message: 'Pertanyaan kuis berhasil dihapus.',
          data: { id: cuePointId }
        });
      }

      if (action === 'saveClosingGame') {
        const { videoId, closingGame, isPjjEnabled, pjjNotes } = payload;
        const vidRows = await sql`SELECT * FROM videos WHERE id = ${videoId} LIMIT 1`;
        if (vidRows.length === 0) {
          return sendJson(res, 404, { success: false, message: 'Video tidak ditemukan.' });
        }
        const ex = vidRows[0];
        const nextClosing = closingGame === undefined ? ex.closing_game_json : closingGame;
        const nextPjj = isPjjEnabled === undefined ? ex.is_pjj_enabled : Boolean(isPjjEnabled);
        const nextPjjNotes = pjjNotes === undefined ? ex.pjj_notes : pjjNotes;

        await sql`
          UPDATE videos SET
            closing_game_json = ${nextClosing ? JSON.stringify(nextClosing) : null}::jsonb,
            is_pjj_enabled = ${nextPjj},
            pjj_notes = ${nextPjjNotes},
            updated_at = NOW()
          WHERE id = ${videoId}
        `;

        return sendJson(res, 200, {
          success: true,
          message: 'Pengaturan penutup akhir video dan PJJ berhasil disimpan.',
          data: { videoId, closing_game: nextClosing, is_pjj_enabled: nextPjj, pjj_notes: nextPjjNotes }
        });
      }

      if (action === 'importBackup') {
        const { curriculum, config } = payload;
        if (!curriculum || !Array.isArray(curriculum.themes)) {
          return sendJson(res, 400, { success: false, message: 'Berkas cadangan tidak valid.' });
        }
        await sql`DELETE FROM cue_points`;
        await sql`DELETE FROM videos`;
        await sql`DELETE FROM subthemes`;
        await sql`DELETE FROM themes`;
        await seedCurriculumIntoDb(sql, curriculum);

        if (config && typeof config === 'object') {
          await sql`
            INSERT INTO site_config (id, config_json, updated_at)
            VALUES ('default', ${JSON.stringify(config)}::jsonb, NOW())
            ON CONFLICT (id) DO UPDATE SET config_json = EXCLUDED.config_json, updated_at = NOW()
          `;
        }

        const data = await loadFullData();
        return sendJson(res, 200, {
          success: true,
          message: 'Cadangan materi berhasil dipulihkan ke PostgreSQL.',
          data
        });
      }

      return sendJson(res, 400, { success: false, message: `Aksi tidak dikenal: ${action}` });
    }

    return sendJson(res, 405, { success: false, message: 'Metode tidak didukung.' });
  } catch (err) {
    console.error('[/api/curriculum error]', err);
    return sendJson(res, 500, {
      success: false,
      message: err.message || 'Terjadi kesalahan pada server database.'
    });
  }
}
