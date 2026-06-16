/**
 * Persistência local: IndexedDB para partidas e áudios (blobs),
 * localStorage para configuração leve. Tudo offline, sem backend.
 */
window.TrucoDB = (function () {
  const DB_NAME = "marcador-truco";
  const DB_VERSION = 1;
  const STORE_MATCHES = "matches";
  const STORE_AUDIOS = "audios";
  const CONFIG_KEY = "truco.config.v1";

  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function () {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_MATCHES)) {
          db.createObjectStore(STORE_MATCHES, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_AUDIOS)) {
          db.createObjectStore(STORE_AUDIOS, { keyPath: "id" });
        }
      };
      req.onsuccess = function () {
        resolve(req.result);
      };
      req.onerror = function () {
        reject(req.error);
      };
    });
    return dbPromise;
  }

  function tx(store, mode, run) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        const t = db.transaction(store, mode);
        const result = run(t.objectStore(store));
        t.oncomplete = function () {
          resolve(result && result.value !== undefined ? result.value : result);
        };
        t.onerror = function () {
          reject(t.error);
        };
      });
    });
  }

  function reqValue(request) {
    const box = {};
    request.onsuccess = function () {
      box.value = request.result;
    };
    return box;
  }

  // ----- Partidas -----
  function saveMatch(match) {
    return tx(STORE_MATCHES, "readwrite", function (s) {
      s.put(match);
    });
  }

  function getMatches() {
    return tx(STORE_MATCHES, "readonly", function (s) {
      return reqValue(s.getAll());
    }).then(function (list) {
      return (list || []).sort(function (a, b) {
        return (b.finishedAt || b.startedAt || 0) - (a.finishedAt || a.startedAt || 0);
      });
    });
  }

  function clearMatches() {
    return tx(STORE_MATCHES, "readwrite", function (s) {
      s.clear();
    });
  }

  // ----- Áudios -----
  function saveAudio(audio) {
    return tx(STORE_AUDIOS, "readwrite", function (s) {
      s.put(audio);
    });
  }

  function getAudios() {
    return tx(STORE_AUDIOS, "readonly", function (s) {
      return reqValue(s.getAll());
    }).then(function (list) {
      return list || [];
    });
  }

  function getAudio(id) {
    return tx(STORE_AUDIOS, "readonly", function (s) {
      return reqValue(s.get(id));
    });
  }

  function deleteAudio(id) {
    return tx(STORE_AUDIOS, "readwrite", function (s) {
      s.delete(id);
    });
  }

  // ----- Config (localStorage) -----
  const DEFAULT_CONFIG = {
    nosName: "Nós",
    elesName: "Eles",
    audioMap: {
      default: null,
      "1": null,
      "3": null,
      "6": null,
      "9": null,
      "12": null,
      perdido1: null,
      perdido2: null,
      perdido3: null,
    },
    pranks: { zona: true, long: true, code: true },
    sound: true,
  };

  function getConfig() {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (!raw) return Object.assign({}, DEFAULT_CONFIG);
      const parsed = JSON.parse(raw);
      return Object.assign({}, DEFAULT_CONFIG, parsed, {
        audioMap: Object.assign({}, DEFAULT_CONFIG.audioMap, parsed.audioMap || {}),
        pranks: Object.assign({}, DEFAULT_CONFIG.pranks, parsed.pranks || {}),
      });
    } catch (e) {
      return Object.assign({}, DEFAULT_CONFIG);
    }
  }

  function saveConfig(config) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    return config;
  }

  return {
    saveMatch: saveMatch,
    getMatches: getMatches,
    clearMatches: clearMatches,
    saveAudio: saveAudio,
    getAudios: getAudios,
    getAudio: getAudio,
    deleteAudio: deleteAudio,
    getConfig: getConfig,
    saveConfig: saveConfig,
    DEFAULT_CONFIG: DEFAULT_CONFIG,
  };
})();
