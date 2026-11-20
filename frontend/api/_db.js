import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { neon } from '@neondatabase/serverless';
import { getStarterUsersSeed, hashPassword, normalizeRole } from './_auth.js';

const require = createRequire(import.meta.url);

export const toPublicUser = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    nama_lengkap: row.nama_lengkap,
    role: normalizeRole(row.role),
    jabatan_kelas: row.jabatan_kelas || 'Guru',
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_login_at: row.last_login_at || null
  };
};

const loadDefaultSiteConfig = () => {
  try {
    return structuredClone(require('../src/data/defaultSiteConfig.json'));
  } catch {
    const candidates = [
      new URL('../src/data/defaultSiteConfig.json', import.meta.url),
      path.join(process.cwd(), 'src', 'data', 'defaultSiteConfig.json'),
      path.join(process.cwd(), 'frontend', 'src', 'data', 'defaultSiteConfig.json')
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      }
    }
    throw new Error('Tidak dapat menemukan seed defaultSiteConfig.json');
  }
};

const loadDefaultCurriculum = () => {
  try {
    return structuredClone(require('../src/data/defaultCurriculum.json'));
  } catch {
    const candidates = [
      new URL('../src/data/defaultCurriculum.json', import.meta.url),
      path.join(process.cwd(), 'src', 'data', 'defaultCurriculum.json'),
      path.join(process.cwd(), 'frontend', 'src', 'data', 'defaultCurriculum.json')
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      }
    }
    throw new Error('Tidak dapat menemukan seed defaultCurriculum.json');
  }
};

export const getDatabaseUrl = () => {
  const raw = (process.env.DATABASE_URL || '').trim();
  if (!raw) return '';
  // Antisipasi jika ada tanda kutip membungkus string di env
  return raw.replace(/^['"]|['"]$/g, '').trim();
};

export const hasDatabase = () => {
  const url = getDatabaseUrl();
  return url.startsWith('postgres://') || url.startsWith('postgresql://');
};

let cachedSql = null;
let cachedUrl = '';

export const getSql = () => {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error('DATABASE_URL belum terpasang di environment.');
  }
  if (!cachedSql || cachedUrl !== url) {
    cachedSql = neon(url);
    cachedUrl = url;
  }
  return cachedSql;
};

let initPromise = null;

export const ensureSchemaAndSeed = async (forceReset = false) => {
  if (!forceReset && initPromise) {
    return initPromise;
  }

  const runInit = async () => {
    const sql = getSql();

    await sql`
      CREATE TABLE IF NOT EXISTS site_config (
        id TEXT PRIMARY KEY,
        config_json JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS themes (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        judul_tema TEXT NOT NULL,
        deskripsi TEXT NOT NULL DEFAULT '',
        rentang_usia TEXT NOT NULL DEFAULT '',
        warna_tema TEXT NOT NULL DEFAULT '#0EA5E9',
        ikon_emoji TEXT NOT NULL DEFAULT 'star',
        teks_tombol_kartu TEXT NOT NULL DEFAULT 'Mulai Belajar',
        label_kategori TEXT NOT NULL DEFAULT '',
        status_publikasi TEXT NOT NULL DEFAULT 'PUBLISHED',
        urutan INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS subthemes (
        id TEXT PRIMARY KEY,
        theme_id TEXT NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
        judul_subtema TEXT NOT NULL,
        deskripsi_subtema TEXT NOT NULL DEFAULT '',
        urutan INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        theme_id TEXT NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
        subtheme_id TEXT NOT NULL REFERENCES subthemes(id) ON DELETE CASCADE,
        label_episode TEXT NOT NULL DEFAULT 'Video 1',
        judul_video TEXT NOT NULL,
        deskripsi_singkat TEXT NOT NULL DEFAULT '',
        youtube_url TEXT NOT NULL DEFAULT '',
        youtube_video_id TEXT NOT NULL,
        durasi_detik INTEGER NOT NULL DEFAULT 180,
        sumber_atribusi TEXT NOT NULL DEFAULT '',
        jenis_lisensi TEXT NOT NULL DEFAULT '',
        deklarasi_ai TEXT NOT NULL DEFAULT '',
        status_publikasi TEXT NOT NULL DEFAULT 'PUBLISHED',
        urutan INTEGER NOT NULL DEFAULT 1,
        is_pjj_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        pjj_notes TEXT NOT NULL DEFAULT '',
        closing_game_json JSONB DEFAULT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS cue_points (
        id TEXT PRIMARY KEY,
        video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
        detik_muncul INTEGER NOT NULL DEFAULT 0,
        tipe_interaksi TEXT NOT NULL DEFAULT 'MULTIPLE_CHOICE',
        judul_pertanyaan TEXT NOT NULL,
        ikon_stimulus TEXT NOT NULL DEFAULT 'question',
        payload_interaksi JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        nama_lengkap TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'GURU',
        jabatan_kelas TEXT NOT NULL DEFAULT 'Guru Kelas',
        password_hash TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_login_at TIMESTAMPTZ DEFAULT NULL
      )
    `;

    // Migrasi idempoten agar skema lama tetap kompatibel dengan Bank Materi Bersama (audit pembuat)
    await sql`ALTER TABLE themes ADD COLUMN IF NOT EXISTS created_by_id TEXT DEFAULT NULL`;
    await sql`ALTER TABLE themes ADD COLUMN IF NOT EXISTS created_by_name TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE themes ADD COLUMN IF NOT EXISTS updated_by_name TEXT NOT NULL DEFAULT ''`;

    await sql`ALTER TABLE subthemes ADD COLUMN IF NOT EXISTS created_by_id TEXT DEFAULT NULL`;
    await sql`ALTER TABLE subthemes ADD COLUMN IF NOT EXISTS created_by_name TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE subthemes ADD COLUMN IF NOT EXISTS updated_by_name TEXT NOT NULL DEFAULT ''`;

    await sql`ALTER TABLE videos ADD COLUMN IF NOT EXISTS created_by_id TEXT DEFAULT NULL`;
    await sql`ALTER TABLE videos ADD COLUMN IF NOT EXISTS created_by_name TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE videos ADD COLUMN IF NOT EXISTS updated_by_name TEXT NOT NULL DEFAULT ''`;

    await sql`
      CREATE TABLE IF NOT EXISTS pjj_records (
        id TEXT PRIMARY KEY,
        theme_id TEXT REFERENCES themes(id) ON DELETE SET NULL,
        theme_title TEXT NOT NULL,
        subtheme_id TEXT REFERENCES subthemes(id) ON DELETE SET NULL,
        subtheme_title TEXT NOT NULL DEFAULT '',
        video_id TEXT REFERENCES videos(id) ON DELETE SET NULL,
        video_title TEXT NOT NULL,
        student_name TEXT NOT NULL,
        class_name TEXT NOT NULL,
        predicate TEXT NOT NULL DEFAULT 'GOOD',
        badge_symbol TEXT NOT NULL DEFAULT 'star',
        closing_game_played BOOLEAN NOT NULL DEFAULT TRUE,
        notes TEXT NOT NULL DEFAULT '',
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    const existingUsers = await sql`SELECT COUNT(*)::int AS cnt FROM users`;
    if ((existingUsers[0]?.cnt || 0) === 0) {
      const seedUsers = getStarterUsersSeed();
      for (const u of seedUsers) {
        const pwdHash = hashPassword(u.plain_password);
        await sql`
          INSERT INTO users (id, username, nama_lengkap, role, jabatan_kelas, password_hash, is_active)
          VALUES (${u.id}, ${u.username}, ${u.nama_lengkap}, ${u.role}, ${u.jabatan_kelas}, ${pwdHash}, ${u.is_active})
          ON CONFLICT (username) DO NOTHING
        `;
      }
    }

    const existingConfig = await sql`SELECT id FROM site_config WHERE id = 'default' LIMIT 1`;
    if (forceReset || existingConfig.length === 0) {
      const defaultSiteConfig = loadDefaultSiteConfig();
      await sql`
        INSERT INTO site_config (id, config_json, updated_at)
        VALUES ('default', ${JSON.stringify(defaultSiteConfig)}::jsonb, NOW())
        ON CONFLICT (id) DO UPDATE
        SET config_json = EXCLUDED.config_json, updated_at = NOW()
      `;
    }

    const existingThemes = await sql`SELECT COUNT(*)::int AS cnt FROM themes`;
    const themeCount = existingThemes[0]?.cnt || 0;

    if (forceReset || themeCount === 0) {
      if (forceReset) {
        await sql`DELETE FROM cue_points`;
        await sql`DELETE FROM videos`;
        await sql`DELETE FROM subthemes`;
        await sql`DELETE FROM themes`;
      }

      const defaultCurriculum = loadDefaultCurriculum();
      await seedCurriculumIntoDb(sql, defaultCurriculum);
    }
  };

  initPromise = runInit().catch((err) => {
    initPromise = null;
    throw err;
  });

  return initPromise;
};

export const seedCurriculumIntoDb = async (sql, curriculum) => {
  const themes = Array.isArray(curriculum?.themes) ? curriculum.themes : [];

  for (let tIdx = 0; tIdx < themes.length; tIdx++) {
    const theme = themes[tIdx];
    const themeId = theme.id || `theme-${tIdx + 1}`;
    const slug = theme.slug || themeId;

    await sql`
      INSERT INTO themes (
        id, slug, judul_tema, deskripsi, rentang_usia, warna_tema,
        ikon_emoji, teks_tombol_kartu, label_kategori, status_publikasi, urutan
      )
      VALUES (
        ${themeId},
        ${slug},
        ${theme.judul_tema || `Tema ${tIdx + 1}`},
        ${theme.deskripsi || ''},
        ${theme.rentang_usia || ''},
        ${theme.warna_tema || theme.warna_hex || '#0EA5E9'},
        ${theme.ikon_emoji || 'star'},
        ${theme.teks_tombol_kartu || 'Mulai Belajar'},
        ${theme.label_kategori || ''},
        ${theme.status_publikasi || 'PUBLISHED'},
        ${Number(theme.urutan) || tIdx + 1}
      )
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug,
        judul_tema = EXCLUDED.judul_tema,
        deskripsi = EXCLUDED.deskripsi,
        rentang_usia = EXCLUDED.rentang_usia,
        warna_tema = EXCLUDED.warna_tema,
        ikon_emoji = EXCLUDED.ikon_emoji,
        teks_tombol_kartu = EXCLUDED.teks_tombol_kartu,
        label_kategori = EXCLUDED.label_kategori,
        status_publikasi = EXCLUDED.status_publikasi,
        urutan = EXCLUDED.urutan,
        updated_at = NOW()
    `;

    const subthemes = Array.isArray(theme.subthemes) ? theme.subthemes : [];
    for (let sIdx = 0; sIdx < subthemes.length; sIdx++) {
      const sub = subthemes[sIdx];
      const subId = sub.id || `subtema-${themeId}-${sIdx + 1}`;

      await sql`
        INSERT INTO subthemes (id, theme_id, judul_subtema, deskripsi_subtema, urutan)
        VALUES (
          ${subId},
          ${themeId},
          ${sub.judul_subtema || `Sub Tema ${sIdx + 1}`},
          ${sub.deskripsi_subtema || ''},
          ${Number(sub.urutan) || sIdx + 1}
        )
        ON CONFLICT (id) DO UPDATE SET
          theme_id = EXCLUDED.theme_id,
          judul_subtema = EXCLUDED.judul_subtema,
          deskripsi_subtema = EXCLUDED.deskripsi_subtema,
          urutan = EXCLUDED.urutan,
          updated_at = NOW()
      `;

      const videos = Array.isArray(sub.videos) ? sub.videos : [];
      for (let vIdx = 0; vIdx < videos.length; vIdx++) {
        const vid = videos[vIdx];
        const vidId = vid.id || `vid-${subId}-${vIdx + 1}`;
        const closingGameJson = vid.closing_game ? JSON.stringify(vid.closing_game) : null;

        await sql`
          INSERT INTO videos (
            id, theme_id, subtheme_id, label_episode, judul_video, deskripsi_singkat,
            youtube_url, youtube_video_id, durasi_detik, sumber_atribusi, jenis_lisensi,
            deklarasi_ai, status_publikasi, urutan, is_pjj_enabled, pjj_notes, closing_game_json
          )
          VALUES (
            ${vidId},
            ${themeId},
            ${subId},
            ${vid.label_episode || `Video ${vIdx + 1}`},
            ${vid.judul_video || vid.judul_subtema || `Video ${vIdx + 1}`},
            ${vid.deskripsi_singkat || ''},
            ${vid.youtube_url || ''},
            ${vid.youtube_video_id || ''},
            ${Number(vid.durasi_detik) || 180},
            ${vid.sumber_atribusi || ''},
            ${vid.jenis_lisensi || ''},
            ${vid.deklarasi_ai || ''},
            ${vid.status_publikasi || 'PUBLISHED'},
            ${Number(vid.urutan) || vIdx + 1},
            ${Boolean(vid.is_pjj_enabled)},
            ${vid.pjj_notes || ''},
            ${closingGameJson}::jsonb
          )
          ON CONFLICT (id) DO UPDATE SET
            theme_id = EXCLUDED.theme_id,
            subtheme_id = EXCLUDED.subtheme_id,
            label_episode = EXCLUDED.label_episode,
            judul_video = EXCLUDED.judul_video,
            deskripsi_singkat = EXCLUDED.deskripsi_singkat,
            youtube_url = EXCLUDED.youtube_url,
            youtube_video_id = EXCLUDED.youtube_video_id,
            durasi_detik = EXCLUDED.durasi_detik,
            sumber_atribusi = EXCLUDED.sumber_atribusi,
            jenis_lisensi = EXCLUDED.jenis_lisensi,
            deklarasi_ai = EXCLUDED.deklarasi_ai,
            status_publikasi = EXCLUDED.status_publikasi,
            urutan = EXCLUDED.urutan,
            is_pjj_enabled = EXCLUDED.is_pjj_enabled,
            pjj_notes = EXCLUDED.pjj_notes,
            closing_game_json = EXCLUDED.closing_game_json,
            updated_at = NOW()
        `;

        const cuePoints = Array.isArray(vid.cue_points) ? vid.cue_points : [];
        for (let cIdx = 0; cIdx < cuePoints.length; cIdx++) {
          const cp = cuePoints[cIdx];
          const cpId = cp.id || `cp-${vidId}-${cIdx + 1}`;
          await sql`
            INSERT INTO cue_points (
              id, video_id, detik_muncul, tipe_interaksi, judul_pertanyaan,
              ikon_stimulus, payload_interaksi
            )
            VALUES (
              ${cpId},
              ${vidId},
              ${Number(cp.detik_muncul) || 0},
              ${cp.tipe_interaksi || 'MULTIPLE_CHOICE'},
              ${cp.judul_pertanyaan || ''},
              ${cp.ikon_stimulus || 'question'},
              ${JSON.stringify(cp.payload_interaksi || {})}::jsonb
            )
            ON CONFLICT (id) DO UPDATE SET
              video_id = EXCLUDED.video_id,
              detik_muncul = EXCLUDED.detik_muncul,
              tipe_interaksi = EXCLUDED.tipe_interaksi,
              judul_pertanyaan = EXCLUDED.judul_pertanyaan,
              ikon_stimulus = EXCLUDED.ikon_stimulus,
              payload_interaksi = EXCLUDED.payload_interaksi,
              updated_at = NOW()
          `;
        }
      }
    }
  }
};

export const loadFullData = async () => {
  await ensureSchemaAndSeed(false);
  const sql = getSql();

  const [cfgRows, themeRows, subRows, videoRows, cpRows] = await Promise.all([
    sql`SELECT config_json, updated_at FROM site_config WHERE id = 'default' LIMIT 1`,
    sql`SELECT * FROM themes ORDER BY urutan ASC, created_at ASC`,
    sql`SELECT * FROM subthemes ORDER BY urutan ASC, created_at ASC`,
    sql`SELECT * FROM videos ORDER BY urutan ASC, created_at ASC`,
    sql`SELECT * FROM cue_points ORDER BY detik_muncul ASC, created_at ASC`
  ]);

  const defaultSiteConfig = loadDefaultSiteConfig();
  const siteConfig = {
    ...defaultSiteConfig,
    ...(cfgRows[0]?.config_json || {})
  };

  const cpByVideo = new Map();
  for (const cp of cpRows) {
    if (!cpByVideo.has(cp.video_id)) cpByVideo.set(cp.video_id, []);
    cpByVideo.get(cp.video_id).push({
      id: cp.id,
      detik_muncul: Number(cp.detik_muncul) || 0,
      tipe_interaksi: cp.tipe_interaksi,
      judul_pertanyaan: cp.judul_pertanyaan,
      ikon_stimulus: cp.ikon_stimulus,
      payload_interaksi: cp.payload_interaksi || {}
    });
  }

  const videosBySub = new Map();
  for (const vid of videoRows) {
    if (!videosBySub.has(vid.subtheme_id)) videosBySub.set(vid.subtheme_id, []);
    videosBySub.get(vid.subtheme_id).push({
      id: vid.id,
      theme_id: vid.theme_id,
      subtheme_id: vid.subtheme_id,
      label_episode: vid.label_episode,
      judul_video: vid.judul_video,
      judul_subtema: vid.judul_video,
      deskripsi_singkat: vid.deskripsi_singkat,
      youtube_url: vid.youtube_url,
      youtube_video_id: vid.youtube_video_id,
      durasi_detik: Number(vid.durasi_detik) || 180,
      sumber_atribusi: vid.sumber_atribusi,
      jenis_lisensi: vid.jenis_lisensi,
      deklarasi_ai: vid.deklarasi_ai,
      status_publikasi: vid.status_publikasi,
      urutan: Number(vid.urutan) || 1,
      is_pjj_enabled: Boolean(vid.is_pjj_enabled),
      pjj_notes: vid.pjj_notes || '',
      closing_game: vid.closing_game_json || null,
      created_by_id: vid.created_by_id || null,
      created_by_name: vid.created_by_name || '',
      updated_by_name: vid.updated_by_name || '',
      cue_points: cpByVideo.get(vid.id) || []
    });
  }

  const subsByTheme = new Map();
  for (const sub of subRows) {
    if (!subsByTheme.has(sub.theme_id)) subsByTheme.set(sub.theme_id, []);
    subsByTheme.get(sub.theme_id).push({
      id: sub.id,
      theme_id: sub.theme_id,
      judul_subtema: sub.judul_subtema,
      deskripsi_subtema: sub.deskripsi_subtema,
      urutan: Number(sub.urutan) || 1,
      created_by_id: sub.created_by_id || null,
      created_by_name: sub.created_by_name || '',
      updated_by_name: sub.updated_by_name || '',
      videos: videosBySub.get(sub.id) || []
    });
  }

  const themes = themeRows.map((t) => ({
    id: t.id,
    slug: t.slug,
    judul_tema: t.judul_tema,
    deskripsi: t.deskripsi,
    rentang_usia: t.rentang_usia,
    warna_tema: t.warna_tema,
    warna_hex: t.warna_tema,
    ikon_emoji: t.ikon_emoji,
    teks_tombol_kartu: t.teks_tombol_kartu,
    label_kategori: t.label_kategori,
    status_publikasi: t.status_publikasi,
    is_published: t.status_publikasi === 'PUBLISHED',
    urutan: Number(t.urutan) || 1,
    created_by_id: t.created_by_id || null,
    created_by_name: t.created_by_name || '',
    updated_by_name: t.updated_by_name || '',
    subthemes: subsByTheme.get(t.id) || []
  }));

  return {
    siteConfig,
    curriculum: {
      version: '3.1.0-postgres-pjj-closing-game',
      school_name: 'TKIT Al Madani',
      updated_at: cfgRows[0]?.updated_at || new Date().toISOString(),
      themes
    }
  };
};
