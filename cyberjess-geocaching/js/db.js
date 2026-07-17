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

// Trajets créés par un(e) maître du jeu en marchant le parcours réel : les
// waypoints sont des coordonnées ABSOLUES (pas de cap/distance relatifs),
// donc un trajet exporté peut être rejoué tel quel sur un autre appareil,
// sans même avoir besoin d'un point de départ commun.
const CustomTrailStore = (() => {
  const KEY = "custom_trails_v1";

  function loadAll() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Failed to read trail store", e);
      return [];
    }
  }

  function saveAll(trails) {
    localStorage.setItem(KEY, JSON.stringify(trails));
  }

  function upsert(trail) {
    const trails = loadAll();
    const idx = trails.findIndex((t) => t.id === trail.id);
    if (idx >= 0) {
      trails[idx] = trail;
    } else {
      trails.push(trail);
    }
    saveAll(trails);
    return trails;
  }

  function remove(id) {
    const trails = loadAll().filter((t) => t.id !== id);
    saveAll(trails);
    return trails;
  }

  function newId() {
    return `trail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  return { loadAll, saveAll, upsert, remove, newId };
})();
