const STORAGE_KEY = 'duniamadani_curriculum_v3_2';
const SITE_CONFIG_KEY = 'duniamadani_site_config_v3_1';
const PJJ_RECORDS_KEY = 'duniamadani_pjj_records_v3_1';
const USERS_KEY = 'duniamadani_users_v3_2';

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn(`[storage] Error reading key "${key}":`, e);
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`[storage] Error writing key "${key}":`, e);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`[storage] Error removing key "${key}":`, e);
      return false;
    }
  },

  CURRICULUM_KEY: STORAGE_KEY,
  CONFIG_KEY: SITE_CONFIG_KEY,
  PJJ_KEY: PJJ_RECORDS_KEY,
  USERS_KEY
};
