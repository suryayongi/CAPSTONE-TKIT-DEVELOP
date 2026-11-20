import { storage } from './storage.js';
import { authService } from './authService.js';

const getLocalRecords = () => {
  const saved = storage.get(storage.PJJ_KEY, []);
  return Array.isArray(saved) ? saved : [];
};

const saveLocalRecords = (records) => {
  storage.set(storage.PJJ_KEY, Array.isArray(records) ? records : []);
};

export const pjjService = {
  async submitRecord(payload) {
    const recordPayload = {
      theme_id: payload.theme_id || null,
      theme_title: payload.theme_title || 'Tema Pembelajaran',
      subtheme_id: payload.subtheme_id || null,
      subtheme_title: payload.subtheme_title || '',
      video_id: payload.video_id || null,
      video_title: payload.video_title || 'Video Pembelajaran',
      student_name: String(payload.student_name || '').trim(),
      class_name: String(payload.class_name || '').trim(),
      predicate: payload.predicate === 'EXCELLENT' ? 'EXCELLENT' : 'GOOD',
      badge_symbol: payload.badge_symbol || (payload.predicate === 'EXCELLENT' ? 'trophy' : 'star'),
      closing_game_played: payload.closing_game_played !== false,
      notes: String(payload.notes || '').trim()
    };

    try {
      const res = await fetch('/api/pjj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordPayload)
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (res.ok && json.success) {
          return { ...json, source: 'postgres' };
        }
        if (res.status === 400) {
          return json;
        }
      }
    } catch {
      // Lanjut fallback lokal jika mode offline / local_only
    }

    // Fallback localStorage untuk pengujian lokal tanpa DATABASE_URL
    const current = getLocalRecords();
    const localRecord = {
      ...recordPayload,
      id: 'pjj-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      submitted_at: new Date().toISOString()
    };
    saveLocalRecords([localRecord, ...current]);
    return {
      success: true,
      source: 'local',
      message: 'Catatan partisipasi PJJ ananda tersimpan untuk Ibu Guru.',
      data: localRecord
    };
  },

  async getRecords(filters = {}) {
    const token = authService.getToken();
    const params = new URLSearchParams();
    if (filters.class_name && filters.class_name !== 'ALL') params.set('class_name', filters.class_name);
    if (filters.predicate && filters.predicate !== 'ALL') params.set('predicate', filters.predicate);
    if (filters.theme_id && filters.theme_id !== 'ALL') params.set('theme_id', filters.theme_id);
    if (filters.search) params.set('search', filters.search);

    try {
      const url = `/api/pjj${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, {
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (res.status === 401) {
          return {
            success: false,
            requiresAuth: true,
            message: json.message || 'Halaman ini hanya dapat dibuka oleh Guru.',
            data: []
          };
        }
        if (res.ok && json.success) {
          return {
            success: true,
            source: 'postgres',
            data: json.data || []
          };
        }
      }
    } catch {
      // Fallback ke penyimpanan lokal
    }

    let list = getLocalRecords();
    if (filters.class_name && filters.class_name !== 'ALL') {
      list = list.filter((r) => r.class_name === filters.class_name);
    }
    if (filters.predicate && filters.predicate !== 'ALL') {
      list = list.filter((r) => r.predicate === filters.predicate);
    }
    if (filters.theme_id && filters.theme_id !== 'ALL') {
      list = list.filter((r) => r.theme_id === filters.theme_id);
    }
    if (filters.search) {
      const q = String(filters.search).toLowerCase();
      list = list.filter(
        (r) =>
          (r.student_name || '').toLowerCase().includes(q) ||
          (r.video_title || '').toLowerCase().includes(q) ||
          (r.theme_title || '').toLowerCase().includes(q)
      );
    }

    return {
      success: true,
      source: 'local',
      data: list
    };
  },

  async deleteRecord(id) {
    const token = authService.getToken();
    try {
      const res = await fetch(`/api/pjj?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (res.ok && json.success) return json;
        if (res.status === 401) return { ...json, requiresAuth: true };
      }
    } catch {
      // Fallback lokal
    }

    const updated = getLocalRecords().filter((r) => r.id !== id);
    saveLocalRecords(updated);
    return { success: true, message: 'Catatan PJJ berhasil dihapus.' };
  },

  async clearAllRecords() {
    const token = authService.getToken();
    try {
      const res = await fetch('/api/pjj?all=true', {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (res.ok && json.success) return json;
        if (res.status === 401) return { ...json, requiresAuth: true };
      }
    } catch {
      // Fallback lokal
    }

    saveLocalRecords([]);
    return { success: true, message: 'Seluruh catatan PJJ berhasil dibersihkan.' };
  },

  exportCsv(records = []) {
    const headers = [
      'Tanggal',
      'Waktu',
      'Nama Anak',
      'Kelas',
      'Tema',
      'Sub Tema',
      'Video Pembelajaran',
      'Simbol & Predikat',
      'Catatan'
    ];

    const escapeCell = (val) => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = records.map((r) => {
      const d = r.submitted_at ? new Date(r.submitted_at) : new Date();
      const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const predicateText =
        r.predicate === 'EXCELLENT' ? 'Bintang Emas (Excellent)' : 'Jempol Ceria (Good)';

      return [
        dateStr,
        timeStr,
        r.student_name,
        r.class_name,
        r.theme_title,
        r.subtheme_title || '-',
        r.video_title,
        predicateText,
        r.notes || '-'
      ]
        .map(escapeCell)
        .join(',');
    });

    const csvContent = '\uFEFF' + [headers.map(escapeCell).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap_pjj_tkit_al_madani_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
