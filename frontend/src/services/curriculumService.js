import defaultCurriculum from '../data/defaultCurriculum.json' with { type: 'json' };
import defaultSiteConfig from '../data/defaultSiteConfig.json' with { type: 'json' };
import { storage } from './storage.js';
import { authService } from './authService.js';
import { extractYouTubeId, parseMMSSToSeconds, slugify } from '../utils/formatters.js';

let remoteMode = 'unknown'; // 'postgres' | 'local_only' | 'unknown'
let remoteSyncPromise = null;

/**
 * Pastikan struktur data selalu menggunakan hirarki 3 level:
 * Tema (themes) -> Sub Tema (subthemes) -> Video (videos)
 */
const normalizeCurriculum = (raw) => {
  if (!raw || !Array.isArray(raw.themes)) return null;

  raw.themes = raw.themes.map((theme, tIdx) => {
    let themeId = theme.id;
    if (!themeId || themeId === 'undefined' || themeId === 'null') {
      themeId = 'theme-' + slugify(theme.judul_tema || `tema-${tIdx + 1}`) + '-' + Date.now().toString().slice(-4);
    }
    let themeSlug = theme.slug;
    if (!themeSlug || themeSlug === 'undefined' || themeSlug === 'null') {
      themeSlug = slugify(theme.judul_tema || themeId);
    }

    const rawSubs = Array.isArray(theme.subthemes) ? theme.subthemes : [];
    const normalizedSubthemes = [];

    rawSubs.forEach((item, sIdx) => {
      let subId = item.id;
      if (!subId || subId === 'undefined' || subId === 'null') {
        subId = 'subtema-' + slugify(item.judul_subtema || `sub-${sIdx + 1}`) + '-' + Date.now().toString().slice(-4);
      }

      if (Array.isArray(item.videos)) {
        const videos = item.videos.map((v, vIdx) => {
          let vidId = v.id;
          if (!vidId || vidId === 'undefined' || vidId === 'null') {
            vidId = 'vid-' + slugify(v.judul_video || v.judul_subtema || `video-${vIdx + 1}`) + '-' + Date.now().toString().slice(-4);
          }
          const cuePoints = Array.isArray(v.cue_points)
            ? v.cue_points.map((cp, cpIdx) => {
                let cpId = cp.id;
                if (!cpId || cpId === 'undefined' || cpId === 'null') {
                  cpId = 'cp-' + (cpIdx + 1) + '-' + (cp.detik_muncul || 0);
                }
                return {
                  ...cp,
                  id: cpId,
                  detik_muncul:
                    typeof cp.detik_muncul === 'number'
                      ? cp.detik_muncul
                      : parseMMSSToSeconds(cp.detik_muncul)
                };
              })
            : [];

          return {
            ...v,
            id: vidId,
            theme_id: themeId,
            subtheme_id: subId,
            judul_video: v.judul_video || v.judul_subtema || `Video ${vIdx + 1}`,
            judul_subtema: v.judul_video || v.judul_subtema || `Video ${vIdx + 1}`,
            label_episode: v.label_episode || `Video ${vIdx + 1}`,
            jenis_lisensi:
              v.jenis_lisensi ||
              v.lisensi_penggunaan ||
              'YouTube Standard License (Official IFrame Embed)',
            deklarasi_ai:
              v.deklarasi_ai ||
              v.ai_assistance_statement ||
              'Kuis interaktif disusun oleh Guru TKIT Al Madani.',
            is_pjj_enabled: Boolean(v.is_pjj_enabled),
            pjj_notes: v.pjj_notes || '',
            closing_game: v.closing_game || null,
            cue_points: cuePoints
          };
        });

        normalizedSubthemes.push({
          ...item,
          id: subId,
          theme_id: themeId,
          judul_subtema: item.judul_subtema || `Sub Tema ${sIdx + 1}`,
          deskripsi_subtema: item.deskripsi_subtema || item.deskripsi_singkat || '',
          urutan: item.urutan || sIdx + 1,
          videos
        });
      } else if (item.youtube_video_id || item.youtube_url) {
        const groupId = `subtema-${subId}`;
        const videoId = `vid-${subId}`;
        const videoObj = {
          ...item,
          id: videoId,
          theme_id: themeId,
          subtheme_id: groupId,
          judul_video: item.judul_video || item.judul_subtema || `Video ${sIdx + 1}`,
          judul_subtema: item.judul_video || item.judul_subtema || `Video ${sIdx + 1}`,
          label_episode: item.label_episode || 'Video 1',
          jenis_lisensi:
            item.jenis_lisensi ||
            item.lisensi_penggunaan ||
            'YouTube Standard License (Official IFrame Embed)',
          deklarasi_ai:
            item.deklarasi_ai ||
            item.ai_assistance_statement ||
            'Kuis interaktif disusun oleh Guru TKIT Al Madani.',
          is_pjj_enabled: Boolean(item.is_pjj_enabled),
          pjj_notes: item.pjj_notes || '',
          closing_game: item.closing_game || null,
          cue_points: Array.isArray(item.cue_points) ? item.cue_points : []
        };
        normalizedSubthemes.push({
          id: groupId,
          theme_id: themeId,
          judul_subtema: item.judul_subtema || `Sub Tema ${sIdx + 1}`,
          deskripsi_subtema: item.deskripsi_singkat || '',
          urutan: sIdx + 1,
          videos: [videoObj]
        });
      }
    });

    return {
      ...theme,
      id: themeId,
      slug: themeSlug,
      status_publikasi: theme.status_publikasi || 'PUBLISHED',
      urutan: theme.urutan || tIdx + 1,
      subthemes: normalizedSubthemes
    };
  });

  return raw;
};

const getLocalData = () => {
  const saved = storage.get(storage.CURRICULUM_KEY);
  if (saved && Array.isArray(saved.themes)) {
    const normalized = normalizeCurriculum(saved);
    storage.set(storage.CURRICULUM_KEY, normalized);
    return normalized;
  }
  const seed = normalizeCurriculum(JSON.parse(JSON.stringify(defaultCurriculum)));
  storage.set(storage.CURRICULUM_KEY, seed);
  return seed;
};

const getLocalConfig = () => {
  const saved = storage.get(storage.CONFIG_KEY);
  if (saved && typeof saved === 'object') {
    return { ...defaultSiteConfig, ...saved };
  }
  const seed = JSON.parse(JSON.stringify(defaultSiteConfig));
  storage.set(storage.CONFIG_KEY, seed);
  return seed;
};

const fetchRemoteCurriculum = async (force = false) => {
  if (!force && remoteSyncPromise) {
    return remoteSyncPromise;
  }

  remoteSyncPromise = (async () => {
    try {
      const res = await fetch('/api/curriculum', { cache: 'no-store' });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        if (res.status === 503) remoteMode = 'local_only';
        return null;
      }

      const json = await res.json();
      if (json.success && json.data) {
        remoteMode = 'postgres';
        const normalizedCur = normalizeCurriculum(json.data.curriculum);
        const mergedCfg = { ...defaultSiteConfig, ...(json.data.siteConfig || {}) };
        if (normalizedCur) {
          storage.set(storage.CURRICULUM_KEY, normalizedCur);
        }
        storage.set(storage.CONFIG_KEY, mergedCfg);
        return { curriculum: normalizedCur, siteConfig: mergedCfg };
      }
      return null;
    } catch {
      if (remoteMode === 'unknown') remoteMode = 'local_only';
      return null;
    } finally {
      setTimeout(() => {
        remoteSyncPromise = null;
      }, 400);
    }
  })();

  return remoteSyncPromise;
};

const postCurriculumMutation = async (action, payload) => {
  const token = authService.getToken();
  try {
    const res = await fetch('/api/curriculum', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ action, payload })
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { handled: false };
    }

    const json = await res.json();
    if (res.status === 503 && json.mode === 'local_only') {
      remoteMode = 'local_only';
      return { handled: false };
    }

    if (res.status === 401) {
      return {
        handled: true,
        result: {
          success: false,
          requiresAuth: true,
          message: json.message || 'Sesi guru berakhir. Silakan login kembali.',
          data: null
        }
      };
    }

    remoteMode = 'postgres';
    // Segarkan cache lokal setelah mutasi Postgres sukses
    await fetchRemoteCurriculum(true);
    return { handled: true, result: json };
  } catch {
    return { handled: false };
  }
};

export const curriculumService = {
  getStorageMode() {
    return remoteMode;
  },

  async checkDatabaseHealth() {
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return { mode: 'local_only', ok: true };
      }
      const json = await res.json();
      remoteMode = json.mode === 'postgres' ? 'postgres' : 'local_only';
      return json;
    } catch {
      remoteMode = 'local_only';
      return { mode: 'local_only', ok: true };
    }
  },

  // ==========================================
  // CONFIG / PENGATURAN TEKS & KELAS PJJ
  // ==========================================
  async getSiteConfig() {
    const remote = await fetchRemoteCurriculum();
    const config = remote?.siteConfig || getLocalConfig();
    return {
      success: true,
      message: 'Berhasil memuat pengaturan tampilan',
      data: config
    };
  },

  async saveSiteConfig(newConfig) {
    const mutated = await postCurriculumMutation('saveSiteConfig', newConfig);
    if (mutated.handled) return mutated.result;

    const current = getLocalConfig();
    const updated = { ...current, ...(newConfig || {}) };
    storage.set(storage.CONFIG_KEY, updated);
    return {
      success: true,
      message: 'Pengaturan tampilan berhasil disimpan!',
      data: updated
    };
  },

  async resetSeedData() {
    const mutated = await postCurriculumMutation('resetSeedData', {});
    if (mutated.handled) return mutated.result;

    const seedCurriculum = normalizeCurriculum(JSON.parse(JSON.stringify(defaultCurriculum)));
    const seedConfig = JSON.parse(JSON.stringify(defaultSiteConfig));
    storage.set(storage.CURRICULUM_KEY, seedCurriculum);
    storage.set(storage.CONFIG_KEY, seedConfig);
    return {
      success: true,
      message: 'Data materi berhasil dikembalikan ke pengaturan awal!',
      data: { curriculum: seedCurriculum, config: seedConfig }
    };
  },

  // ==========================================
  // LEVEL 1: TEMA (THEMES)
  // ==========================================
  async getThemes(onlyPublished = true) {
    const remote = await fetchRemoteCurriculum();
    const cur = remote?.curriculum || getLocalData();
    let themes = [...(cur.themes || [])];
    if (onlyPublished) {
      themes = themes.filter((t) => t.status_publikasi === 'PUBLISHED');
    }
    themes.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
    return {
      success: true,
      message: 'Berhasil memuat daftar tema',
      data: themes
    };
  },

  async getThemeBySlug(slug) {
    const remote = await fetchRemoteCurriculum();
    const cur = remote?.curriculum || getLocalData();
    const theme = (cur.themes || []).find((t) => t.slug === slug || t.id === slug);
    if (!theme) {
      return { success: false, message: 'Tema tidak ditemukan', data: null };
    }
    return { success: true, message: 'Berhasil memuat detail tema', data: theme };
  },

  async getThemeById(themeId) {
    const remote = await fetchRemoteCurriculum();
    const cur = remote?.curriculum || getLocalData();
    const theme = (cur.themes || []).find((t) => t.id === themeId || t.slug === themeId);
    if (!theme) {
      return { success: false, message: 'Tema tidak ditemukan', data: null };
    }
    return { success: true, message: 'Berhasil memuat tema', data: theme };
  },

  async saveTheme(themeData) {
    const mutated = await postCurriculumMutation('saveTheme', themeData);
    if (mutated.handled) return mutated.result;

    const cur = getLocalData();
    const themes = cur.themes || [];
    const isEdit = Boolean(themeData.id && themeData.id !== 'undefined');
    let targetId = isEdit ? themeData.id : null;

    const actor = authService.getCurrentUser();
    const actorId = actor?.id || null;
    const actorName = actor?.nama_lengkap || '';

    if (isEdit) {
      const idx = themes.findIndex((t) => t.id === targetId || t.slug === targetId);
      if (idx === -1) {
        return { success: false, message: 'Tema tidak ditemukan untuk diperbarui', data: null };
      }
      targetId = themes[idx].id;
      themes[idx] = {
        ...themes[idx],
        ...themeData,
        id: targetId,
        slug: themeData.slug || slugify(themeData.judul_tema || themes[idx].judul_tema),
        updated_by_name: actorName || themes[idx].updated_by_name || '',
        updated_at: new Date().toISOString()
      };
    } else {
      targetId = 'theme-' + slugify(themeData.judul_tema || 'baru') + '-' + Date.now().toString().slice(-4);
      const { id: _ignoredId, ...cleanData } = themeData;
      const newTheme = {
        subthemes: [],
        urutan: themes.length + 1,
        status_publikasi: 'PUBLISHED',
        ...cleanData,
        id: targetId,
        slug: slugify(themeData.judul_tema || targetId),
        created_by_id: actorId,
        created_by_name: actorName,
        updated_by_name: actorName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      themes.push(newTheme);
    }

    cur.updated_at = new Date().toISOString();
    storage.set(storage.CURRICULUM_KEY, cur);

    return {
      success: true,
      message: isEdit ? 'Tema berhasil diperbarui!' : 'Tema baru berhasil ditambahkan!',
      data: themes.find((t) => t.id === targetId)
    };
  },

  async deleteTheme(themeId) {
    const mutated = await postCurriculumMutation('deleteTheme', { themeId });
    if (mutated.handled) return mutated.result;

    const cur = getLocalData();
    cur.themes = (cur.themes || []).filter((t) => t.id !== themeId && t.slug !== themeId);
    cur.updated_at = new Date().toISOString();
    storage.set(storage.CURRICULUM_KEY, cur);
    return { success: true, message: 'Tema berhasil dihapus!', data: { id: themeId } };
  },

  async clearAllThemes() {
    const mutated = await postCurriculumMutation('clearAllThemes', {});
    if (mutated.handled) return mutated.result;

    const cur = getLocalData();
    cur.themes = [];
    cur.updated_at = new Date().toISOString();
    storage.set(storage.CURRICULUM_KEY, cur);
    return { success: true, message: 'Seluruh tema, subtema, dan video berhasil dikosongkan!', data: [] };
  },

  // ==========================================
  // LEVEL 2: SUB TEMA (SUBTHEME GROUPS)
  // ==========================================
  async saveSubthemeGroup(themeId, groupData) {
    const mutated = await postCurriculumMutation('saveSubthemeGroup', { themeId, groupData });
    if (mutated.handled) return mutated.result;

    const cur = getLocalData();
    const theme = (cur.themes || []).find((t) => t.id === themeId || t.slug === themeId);
    if (!theme) {
      return { success: false, message: 'Tema tidak ditemukan', data: null };
    }
    if (!Array.isArray(theme.subthemes)) theme.subthemes = [];

    const actor = authService.getCurrentUser();
    const actorId = actor?.id || null;
    const actorName = actor?.nama_lengkap || '';
    const isEdit = Boolean(groupData.id && groupData.id !== 'undefined');
    let targetGroupId = isEdit ? groupData.id : null;

    if (isEdit) {
      const idx = theme.subthemes.findIndex((g) => g.id === targetGroupId);
      if (idx === -1) {
        return { success: false, message: 'Sub Tema tidak ditemukan untuk diperbarui', data: null };
      }
      theme.subthemes[idx] = {
        ...theme.subthemes[idx],
        ...groupData,
        id: targetGroupId,
        judul_subtema: groupData.judul_subtema,
        deskripsi_subtema: groupData.deskripsi_subtema || '',
        urutan: groupData.urutan || theme.subthemes[idx].urutan || idx + 1,
        updated_by_name: actorName || theme.subthemes[idx].updated_by_name || '',
        updated_at: new Date().toISOString()
      };
    } else {
      targetGroupId = 'subtema-' + slugify(groupData.judul_subtema || 'baru') + '-' + Date.now().toString().slice(-4);
      const { id: _ignoredId, ...cleanData } = groupData;
      const newGroup = {
        urutan: theme.subthemes.length + 1,
        videos: [],
        ...cleanData,
        id: targetGroupId,
        theme_id: theme.id,
        judul_subtema: groupData.judul_subtema,
        deskripsi_subtema: groupData.deskripsi_subtema || '',
        created_by_id: actorId,
        created_by_name: actorName,
        updated_by_name: actorName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      theme.subthemes.push(newGroup);
    }

    cur.updated_at = new Date().toISOString();
    storage.set(storage.CURRICULUM_KEY, cur);

    return {
      success: true,
      message: isEdit ? 'Sub Tema berhasil diperbarui!' : 'Sub Tema baru berhasil ditambahkan!',
      data: theme.subthemes.find((g) => g.id === targetGroupId)
    };
  },

  async deleteSubthemeGroup(themeId, groupId) {
    const mutated = await postCurriculumMutation('deleteSubthemeGroup', { themeId, groupId });
    if (mutated.handled) return mutated.result;

    const cur = getLocalData();
    const theme = (cur.themes || []).find((t) => t.id === themeId || t.slug === themeId);
    if (!theme) {
      return { success: false, message: 'Tema tidak ditemukan', data: null };
    }
    theme.subthemes = (theme.subthemes || []).filter((g) => g.id !== groupId);
    cur.updated_at = new Date().toISOString();
    storage.set(storage.CURRICULUM_KEY, cur);
    return {
      success: true,
      message: 'Sub Tema beserta videonya berhasil dihapus!',
      data: { id: groupId }
    };
  },

  // ==========================================
  // LEVEL 3: VIDEO PEMBELAJARAN (VIDEOS)
  // ==========================================
  async getSubthemeById(videoId) {
    const remote = await fetchRemoteCurriculum();
    const cur = remote?.curriculum || getLocalData();
    for (const theme of cur.themes || []) {
      for (const subGroup of theme.subthemes || []) {
        const foundVideo = (subGroup.videos || []).find(
          (v) => v.id === videoId || v.slug === videoId
        );
        if (foundVideo) {
          return {
            success: true,
            message: 'Berhasil memuat video pembelajaran',
            data: {
              theme,
              subthemeGroup: subGroup,
              subtheme: foundVideo,
              video: foundVideo
            }
          };
        }
      }
    }
    return { success: false, message: 'Video pembelajaran tidak ditemukan', data: null };
  },

  async saveSubtheme(themeId, videoData) {
    const mutated = await postCurriculumMutation('saveVideo', { themeId, videoData });
    if (mutated.handled) return mutated.result;

    const cur = getLocalData();
    const theme = (cur.themes || []).find((t) => t.id === themeId || t.slug === themeId);
    if (!theme) {
      return { success: false, message: 'Tema induk tidak ditemukan', data: null };
    }
    if (!Array.isArray(theme.subthemes)) theme.subthemes = [];

    const ytId = extractYouTubeId(videoData.youtube_url);
    if (!ytId) {
      return { success: false, message: 'Tautan YouTube belum valid!', data: null };
    }

    let targetGroupId = videoData.subtheme_id;
    let targetGroup = (theme.subthemes || []).find((g) => g.id === targetGroupId);

    if (!targetGroup) {
      if (theme.subthemes.length > 0) {
        targetGroup = theme.subthemes[0];
        targetGroupId = targetGroup.id;
      } else {
        targetGroupId = 'subtema-' + slugify(videoData.subtheme_title || 'utama') + '-' + Date.now().toString().slice(-4);
        targetGroup = {
          id: targetGroupId,
          theme_id: theme.id,
          judul_subtema: videoData.subtheme_title || 'Sub Tema 1',
          deskripsi_subtema: '',
          urutan: 1,
          videos: []
        };
        theme.subthemes.push(targetGroup);
      }
    }

    if (!Array.isArray(targetGroup.videos)) targetGroup.videos = [];

    const isEdit = Boolean(videoData.id && videoData.id !== 'undefined');
    let targetVideoId = isEdit ? videoData.id : null;
    const videoTitle = videoData.judul_video || videoData.judul_subtema || 'Video Pembelajaran';

    const { id: _ignoredId, ...cleanVideoData } = videoData;
    const normalizedPayload = {
      ...cleanVideoData,
      theme_id: theme.id,
      subtheme_id: targetGroup.id,
      judul_video: videoTitle,
      judul_subtema: videoTitle,
      youtube_video_id: ytId,
      jenis_lisensi:
        videoData.jenis_lisensi ||
        videoData.lisensi_penggunaan ||
        'YouTube Standard License (Official IFrame Embed)',
      deklarasi_ai:
        videoData.deklarasi_ai ||
        videoData.ai_assistance_statement ||
        'Pertanyaan kuis disusun oleh Guru TKIT Al Madani.',
      is_pjj_enabled: Boolean(videoData.is_pjj_enabled),
      pjj_notes: videoData.pjj_notes || ''
    };

    const actor = authService.getCurrentUser();
    const actorId = actor?.id || null;
    const actorName = actor?.nama_lengkap || '';

    if (isEdit) {
      let existingVideo = null;
      for (const g of theme.subthemes) {
        const idx = (g.videos || []).findIndex((v) => v.id === targetVideoId);
        if (idx !== -1) {
          existingVideo = g.videos[idx];
          if (g.id !== targetGroup.id) {
            g.videos.splice(idx, 1);
          } else {
            g.videos[idx] = {
              ...existingVideo,
              ...normalizedPayload,
              id: targetVideoId,
              updated_by_name: actorName || existingVideo.updated_by_name || '',
              updated_at: new Date().toISOString()
            };
          }
          break;
        }
      }

      if (!existingVideo) {
        return { success: false, message: 'Video tidak ditemukan untuk diperbarui', data: null };
      }

      if (!targetGroup.videos.some((v) => v.id === targetVideoId)) {
        targetGroup.videos.push({
          ...existingVideo,
          ...normalizedPayload,
          id: targetVideoId,
          updated_by_name: actorName || existingVideo.updated_by_name || '',
          updated_at: new Date().toISOString()
        });
      }
    } else {
      targetVideoId = 'vid-' + slugify(videoTitle) + '-' + Date.now().toString().slice(-4);
      const newVideo = {
        urutan: targetGroup.videos.length + 1,
        label_episode: normalizedPayload.label_episode || `Video ${targetGroup.videos.length + 1}`,
        status_publikasi: 'PUBLISHED',
        cue_points: [],
        closing_game: null,
        ...normalizedPayload,
        id: targetVideoId,
        created_by_id: actorId,
        created_by_name: actorName,
        updated_by_name: actorName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      targetGroup.videos.push(newVideo);
    }

    cur.updated_at = new Date().toISOString();
    storage.set(storage.CURRICULUM_KEY, cur);

    const savedVideo = targetGroup.videos.find((v) => v.id === targetVideoId);
    return {
      success: true,
      message: isEdit
        ? 'Video pembelajaran berhasil diperbarui!'
        : 'Video pembelajaran baru berhasil ditambahkan!',
      data: savedVideo
    };
  },

  async deleteSubtheme(videoId) {
    const mutated = await postCurriculumMutation('deleteVideo', { videoId });
    if (mutated.handled) return mutated.result;

    const cur = getLocalData();
    let deleted = false;
    for (const theme of cur.themes || []) {
      for (const group of theme.subthemes || []) {
        const prevLen = (group.videos || []).length;
        group.videos = (group.videos || []).filter((v) => v.id !== videoId);
        if (group.videos.length < prevLen) {
          deleted = true;
          break;
        }
      }
      if (deleted) break;
    }

    if (!deleted) {
      return { success: false, message: 'Video tidak ditemukan', data: null };
    }

    cur.updated_at = new Date().toISOString();
    storage.set(storage.CURRICULUM_KEY, cur);
    return { success: true, message: 'Video pembelajaran berhasil dihapus!', data: { id: videoId } };
  },

  async saveClosingGame(videoId, { closingGame, isPjjEnabled, pjjNotes }) {
    const mutated = await postCurriculumMutation('saveClosingGame', {
      videoId,
      closingGame,
      isPjjEnabled,
      pjjNotes
    });
    if (mutated.handled) return mutated.result;

    const cur = getLocalData();
    let targetVideo = null;
    for (const theme of cur.themes || []) {
      for (const group of theme.subthemes || []) {
        targetVideo = (group.videos || []).find((v) => v.id === videoId);
        if (targetVideo) break;
      }
      if (targetVideo) break;
    }

    if (!targetVideo) {
      return { success: false, message: 'Video tidak ditemukan', data: null };
    }

    if (closingGame !== undefined) targetVideo.closing_game = closingGame;
    if (isPjjEnabled !== undefined) targetVideo.is_pjj_enabled = Boolean(isPjjEnabled);
    if (pjjNotes !== undefined) targetVideo.pjj_notes = pjjNotes;
    targetVideo.updated_at = new Date().toISOString();

    cur.updated_at = new Date().toISOString();
    storage.set(storage.CURRICULUM_KEY, cur);

    return {
      success: true,
      message: 'Pengaturan penutup akhir video dan PJJ berhasil disimpan.',
      data: targetVideo
    };
  },

  // ==========================================
  // CUE POINTS (TITIK KUIS DI DALAM VIDEO)
  // ==========================================
  async saveCuePoint(videoId, cuePointData) {
    const mutated = await postCurriculumMutation('saveCuePoint', { videoId, cuePointData });
    if (mutated.handled) return mutated.result;

    const cur = getLocalData();
    let targetVideo = null;
    for (const theme of cur.themes || []) {
      for (const group of theme.subthemes || []) {
        targetVideo = (group.videos || []).find((v) => v.id === videoId);
        if (targetVideo) break;
      }
      if (targetVideo) break;
    }

    if (!targetVideo) {
      return { success: false, message: 'Video tidak ditemukan', data: null };
    }

    if (!Array.isArray(targetVideo.cue_points)) targetVideo.cue_points = [];

    const isEdit = Boolean(cuePointData.id && cuePointData.id !== 'undefined');
    let targetCpId = isEdit ? cuePointData.id : null;
    const detikMuncul = parseMMSSToSeconds(cuePointData.detik_muncul);

    if (isEdit) {
      const idx = targetVideo.cue_points.findIndex((c) => c.id === targetCpId);
      if (idx === -1) {
        return { success: false, message: 'Kuis tidak ditemukan untuk diperbarui', data: null };
      }
      targetVideo.cue_points[idx] = {
        ...targetVideo.cue_points[idx],
        ...cuePointData,
        id: targetCpId,
        detik_muncul: detikMuncul,
        updated_at: new Date().toISOString()
      };
    } else {
      targetCpId = 'cp-' + Date.now().toString().slice(-6);
      const { id: _ignoredId, ...cleanCpData } = cuePointData;
      const newCp = {
        detik_muncul: detikMuncul,
        tipe_interaksi: 'MULTIPLE_CHOICE',
        ikon_stimulus: 'question',
        ...cleanCpData,
        id: targetCpId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      targetVideo.cue_points.push(newCp);
    }

    targetVideo.cue_points.sort((a, b) => a.detik_muncul - b.detik_muncul);
    cur.updated_at = new Date().toISOString();
    storage.set(storage.CURRICULUM_KEY, cur);

    return {
      success: true,
      message: isEdit
        ? 'Pertanyaan kuis berhasil diperbarui!'
        : 'Pertanyaan kuis baru berhasil ditambahkan!',
      data: targetVideo.cue_points.find((c) => c.id === targetCpId)
    };
  },

  async deleteCuePoint(videoId, cuePointId) {
    const mutated = await postCurriculumMutation('deleteCuePoint', { videoId, cuePointId });
    if (mutated.handled) return mutated.result;

    const cur = getLocalData();
    let targetVideo = null;
    for (const theme of cur.themes || []) {
      for (const group of theme.subthemes || []) {
        targetVideo = (group.videos || []).find((v) => v.id === videoId);
        if (targetVideo) break;
      }
      if (targetVideo) break;
    }

    if (!targetVideo) {
      return { success: false, message: 'Video tidak ditemukan', data: null };
    }

    targetVideo.cue_points = (targetVideo.cue_points || []).filter((c) => c.id !== cuePointId);
    cur.updated_at = new Date().toISOString();
    storage.set(storage.CURRICULUM_KEY, cur);

    return {
      success: true,
      message: 'Pertanyaan kuis berhasil dihapus!',
      data: { id: cuePointId }
    };
  },

  // ==========================================
  // STATS (BERANDA STUDIO GURU)
  // ==========================================
  async getStats() {
    const remote = await fetchRemoteCurriculum();
    const cur = remote?.curriculum || getLocalData();
    const themes = cur.themes || [];
    let totalSubthemeGroups = 0;
    let totalVideos = 0;
    let totalCuePoints = 0;
    let totalPjjVideos = 0;

    themes.forEach((t) => {
      const groups = t.subthemes || [];
      totalSubthemeGroups += groups.length;
      groups.forEach((g) => {
        const videos = g.videos || [];
        totalVideos += videos.length;
        videos.forEach((v) => {
          totalCuePoints += (v.cue_points || []).length;
          if (v.is_pjj_enabled) totalPjjVideos += 1;
        });
      });
    });

    return {
      success: true,
      message: 'Berhasil memuat ringkasan materi',
      data: {
        totalThemes: themes.length,
        totalSubthemeGroups,
        totalVideos,
        totalSubthemes: totalVideos,
        totalCuePoints,
        totalPjjVideos,
        storageMode: remoteMode,
        schoolName: cur.school_name || 'TKIT Al Madani',
        lastUpdated: cur.updated_at || new Date().toISOString()
      }
    };
  },

  // ==========================================
  // SIMPAN & MUAT CADANGAN MATERI
  // ==========================================
  exportCurriculumJson() {
    const cur = getLocalData();
    const cfg = getLocalConfig();
    const backup = {
      app: 'DuniaMadani',
      version: '3.1',
      exported_at: new Date().toISOString(),
      config: cfg,
      curriculum: cur
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadangan_materi_duniamadani_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true, message: 'Cadangan materi berhasil disimpan ke komputer!' };
  },

  async importCurriculumJson(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      const curriculum = data.curriculum && Array.isArray(data.curriculum.themes)
        ? normalizeCurriculum(data.curriculum)
        : Array.isArray(data.themes)
        ? normalizeCurriculum(data)
        : null;

      if (!curriculum) {
        return { success: false, message: 'Berkas cadangan yang dipilih tidak sesuai.' };
      }

      const mutated = await postCurriculumMutation('importBackup', {
        curriculum,
        config: data.config
      });
      if (mutated.handled) return mutated.result;

      storage.set(storage.CURRICULUM_KEY, curriculum);
      if (data.config && typeof data.config === 'object') {
        storage.set(storage.CONFIG_KEY, data.config);
      }
      return { success: true, message: 'Alhamdulillah, data cadangan materi berhasil dimuat!' };
    } catch {
      return { success: false, message: 'Gagal membaca berkas cadangan materi.' };
    }
  }
};
