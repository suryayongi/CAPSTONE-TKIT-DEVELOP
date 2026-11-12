const STORAGE_KEY = 'duniamadani_curriculum_v3_0';
const SITE_CONFIG_KEY = 'duniamadani_site_config_v3_0';

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
  CONFIG_KEY: SITE_CONFIG_KEY
};
