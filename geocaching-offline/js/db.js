const CacheStore = (() => {
  const KEY = "geocaches_v1";

  function loadAll() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Failed to read cache store", e);
      return [];
    }
  }

  function saveAll(caches) {
    localStorage.setItem(KEY, JSON.stringify(caches));
  }

  function upsert(cache) {
    const caches = loadAll();
    const idx = caches.findIndex((c) => c.id === cache.id);
    if (idx >= 0) {
      caches[idx] = cache;
    } else {
      caches.push(cache);
    }
    saveAll(caches);
    return caches;
  }

  function remove(id) {
    const caches = loadAll().filter((c) => c.id !== id);
    saveAll(caches);
    return caches;
  }

  function clear() {
    saveAll([]);
  }

  function newId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  return { loadAll, saveAll, upsert, remove, clear, newId };
})();
