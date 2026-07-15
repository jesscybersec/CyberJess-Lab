(() => {
  const state = {
    caches: CacheStore.loadAll(),
    position: null, // {lat, lon, accuracy}
    heading: null, // degrees, 0 = north
    targetId: null,
    orientationEnabled: false,
  };

  // ---------- Tabs ----------
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
    });
  });

  // ---------- GPS ----------
  const gpsStatusEl = document.getElementById("gpsStatus");
  const gpsLabelEl = document.getElementById("gpsLabel");
  const coordsReadoutEl = document.getElementById("coordsReadout");

  function onPosition(pos) {
    state.position = {
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    };
    gpsStatusEl.className = "gps-status gps-ok";
    gpsLabelEl.textContent = "Position acquise";
    coordsReadoutEl.textContent =
      `lat: ${state.position.lat.toFixed(6)}, lon: ${state.position.lon.toFixed(6)} ` +
      `(précision: ±${Math.round(state.position.accuracy)} m)`;
    renderCacheList();
    renderRadar();
  }

  function onPositionError(err) {
    gpsStatusEl.className = "gps-status gps-error";
    gpsLabelEl.textContent = `GPS indisponible (${err.message})`;
  }

  if ("geolocation" in navigator) {
    navigator.geolocation.watchPosition(onPosition, onPositionError, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 20000,
    });
  } else {
    gpsLabelEl.textContent = "Géolocalisation non supportée";
  }

  // ---------- Device orientation (compass heading) ----------
  const enableOrientationBtn = document.getElementById("enableOrientationBtn");

  function handleOrientation(evt) {
    let heading = evt.webkitCompassHeading; // iOS Safari, already 0=north clockwise
    if (heading === undefined || heading === null) {
      if (evt.alpha === null) return;
      heading = 360 - evt.alpha; // approximate for absolute orientation on other browsers
    }
    state.heading = heading;
    renderRadar();
  }

  function startOrientation() {
    window.addEventListener("deviceorientationabsolute", handleOrientation, true);
    window.addEventListener("deviceorientation", handleOrientation, true);
    state.orientationEnabled = true;
  }

  if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
    enableOrientationBtn.classList.remove("hidden");
    enableOrientationBtn.addEventListener("click", async () => {
      try {
        const result = await DeviceOrientationEvent.requestPermission();
        if (result === "granted") {
          startOrientation();
          enableOrientationBtn.classList.add("hidden");
        }
      } catch (e) {
        console.error(e);
      }
    });
  } else if (typeof DeviceOrientationEvent !== "undefined") {
    startOrientation();
  }

  // ---------- Radar / compass rendering ----------
  const canvas = document.getElementById("compassCanvas");
  const ctx = canvas.getContext("2d");
  const radarInfoEl = document.getElementById("radarInfo");

  function drawCompassFace() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = cx - 10;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#30363d";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Tick marks every 30 degrees
    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      const inner = deg % 90 === 0 ? r - 14 : r - 8;
      const x1 = cx + inner * Math.sin(rad);
      const y1 = cy - inner * Math.cos(rad);
      const x2 = cx + r * Math.sin(rad);
      const y2 = cy - r * Math.cos(rad);
      ctx.strokeStyle = "#30363d";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.fillStyle = "#6e7681";
    ctx.font = "14px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const labels = [["N", 0], ["E", 90], ["S", 180], ["O", 270]];
    labels.forEach(([label, deg]) => {
      const rad = (deg * Math.PI) / 180;
      const x = cx + (r - 26) * Math.sin(rad);
      const y = cy - (r - 26) * Math.cos(rad);
      ctx.fillText(label, x, y);
    });
  }

  function drawArrow(angleDeg) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const rad = (angleDeg * Math.PI) / 180;
    const len = canvas.width / 2 - 40;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rad);

    ctx.fillStyle = "#39ff14";
    ctx.shadowColor = "#39ff14";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, -len);
    ctx.lineTo(14, 10);
    ctx.lineTo(0, -4);
    ctx.lineTo(-14, 10);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function getTarget() {
    if (!state.targetId) return null;
    return state.caches.find((c) => c.id === state.targetId) || null;
  }

  function renderRadar() {
    drawCompassFace();
    const target = getTarget();

    if (!target || !state.position) {
      radarInfoEl.innerHTML = target
        ? '<p class="muted">En attente du signal GPS…</p>'
        : '<p class="muted">Sélectionne une cache dans l\'onglet "Caches" pour la pointer ici.</p>';
      return;
    }

    const bearingToTarget = Geo.bearingDegrees(
      state.position.lat,
      state.position.lon,
      target.lat,
      target.lon
    );
    const distance = Geo.distanceMeters(
      state.position.lat,
      state.position.lon,
      target.lat,
      target.lon
    );

    // If we have a heading, point relative to device facing; otherwise point relative to true north.
    const arrowAngle =
      state.heading !== null ? (bearingToTarget - state.heading + 360) % 360 : bearingToTarget;
    drawArrow(arrowAngle);

    radarInfoEl.innerHTML = `
      <div class="target-name">🎯 ${escapeHtml(target.name)}</div>
      <div class="target-distance">${Geo.formatDistance(distance)}</div>
      <div class="muted">cap: ${Math.round(bearingToTarget)}°${
      state.heading === null ? " (boussole non calibrée — cap par rapport au nord)" : ""
    }</div>
    `;
  }

  // ---------- Scenarios ----------
  const scenarioListEl = document.getElementById("scenarioList");
  const filterAudienceEl = document.getElementById("filterAudience");
  const filterDifficultyEl = document.getElementById("filterDifficulty");
  const originPickerEl = document.getElementById("originPicker");
  const originScenarioTitleEl = document.getElementById("originScenarioTitle");
  let pendingScenario = null;

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function scenarioCacheIds(scenarioId) {
    return state.caches.filter((c) => c.scenarioId === scenarioId).map((c) => c.id);
  }

  function isScenarioLaunched(scenarioId) {
    return scenarioCacheIds(scenarioId).length > 0;
  }

  function renderScenarioList() {
    const audienceFilter = filterAudienceEl.value;
    const difficultyFilter = filterDifficultyEl.value;

    const filtered = SCENARIOS.filter(
      (s) =>
        (!audienceFilter || s.audience === audienceFilter) &&
        (!difficultyFilter || s.difficultyLabel === difficultyFilter)
    );

    if (filtered.length === 0) {
      scenarioListEl.innerHTML = '<p class="muted">Aucun scénario ne correspond à ces filtres.</p>';
      return;
    }

    scenarioListEl.innerHTML = filtered
      .map((s) => {
        const launched = isScenarioLaunched(s.id);
        return `
      <div class="scenario-card" data-scenario-id="${s.id}">
        <div class="scenario-card-head">
          <span class="scenario-emoji">${s.emoji}</span>
          <h3>${escapeHtml(s.title)}</h3>
          <span class="badge badge-audience-${s.audience}">${s.audience === "enfants" ? "👧 Enfants" : "🧑 Adultes"}</span>
          <span class="badge badge-difficulty-${s.difficultyLabel}">${s.difficultyLabel}</span>
        </div>
        <div class="scenario-meta">
          ${s.waypoints.length} étapes · ${escapeHtml(s.minAge)} · ${escapeHtml(s.setting)}
        </div>
        <div class="scenario-intro-text">${escapeHtml(s.intro)}</div>
        <div class="scenario-actions">
          <button class="btn-primary" data-action="launch">🚀 Lancer ici</button>
          ${
            launched
              ? '<button class="btn-secondary" data-action="goto">📡 Voir sur le radar</button>' +
                '<button class="btn-danger" data-action="reset">↺ Réinitialiser</button>' +
                '<span class="scenario-launched-tag">✅ Lancé sur cet appareil</span>'
              : ""
          }
        </div>
      </div>
    `;
      })
      .join("");
  }

  filterAudienceEl.addEventListener("change", renderScenarioList);
  filterDifficultyEl.addEventListener("change", renderScenarioList);

  function showOriginPicker(scenario) {
    pendingScenario = scenario;
    originScenarioTitleEl.textContent = `Lancer : ${scenario.title}`;
    document.getElementById("originLat").value = state.position ? state.position.lat : "";
    document.getElementById("originLon").value = state.position ? state.position.lon : "";
    originPickerEl.classList.remove("hidden");
    originPickerEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function hideOriginPicker() {
    pendingScenario = null;
    originPickerEl.classList.add("hidden");
  }

  document.getElementById("useCurrentPosOrigin").addEventListener("click", () => {
    if (!state.position) {
      alert("Position GPS non disponible pour le moment.");
      return;
    }
    document.getElementById("originLat").value = state.position.lat;
    document.getElementById("originLon").value = state.position.lon;
  });

  document.getElementById("cancelLaunch").addEventListener("click", hideOriginPicker);

  document.getElementById("confirmLaunch").addEventListener("click", () => {
    if (!pendingScenario) return;
    const originLat = Number(document.getElementById("originLat").value);
    const originLon = Number(document.getElementById("originLon").value);
    if (Number.isNaN(originLat) || Number.isNaN(originLon)) {
      alert("Merci d'indiquer une latitude et une longitude de départ valides.");
      return;
    }

    const scenario = pendingScenario;
    scenario.waypoints.forEach((wp, idx) => {
      const dest = Geo.destinationPoint(originLat, originLon, wp.bearing, wp.distance);
      const cache = {
        id: `${scenario.id}::${idx}`,
        name: wp.name,
        desc: wp.desc,
        hint: wp.hint,
        difficulty: scenario.difficultyStars,
        terrain: scenario.difficultyStars,
        lat: dest.lat,
        lon: dest.lon,
        found: false,
        scenarioId: scenario.id,
        scenarioTitle: scenario.title,
        scenarioIndex: idx,
      };
      CacheStore.upsert(cache);
    });

    state.caches = CacheStore.loadAll();
    state.targetId = `${scenario.id}::0`;
    hideOriginPicker();
    renderScenarioList();
    renderCacheList();
    renderRadar();
    document.querySelector('.tab-btn[data-tab="radar"]').click();
  });

  scenarioListEl.addEventListener("click", (evt) => {
    const btn = evt.target.closest("button[data-action]");
    if (!btn) return;
    const card = evt.target.closest(".scenario-card");
    const scenarioId = card.dataset.scenarioId;
    const scenario = SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return;

    switch (btn.dataset.action) {
      case "launch":
        showOriginPicker(scenario);
        break;
      case "goto": {
        const ids = scenarioCacheIds(scenarioId);
        const nextUnfound = state.caches.find((c) => ids.includes(c.id) && !c.found);
        state.targetId = nextUnfound ? nextUnfound.id : ids[0];
        renderRadar();
        document.querySelector('.tab-btn[data-tab="radar"]').click();
        break;
      }
      case "reset":
        if (confirm(`Réinitialiser le scénario "${scenario.title}" sur cet appareil ? Les caches associées seront supprimées.`)) {
          scenarioCacheIds(scenarioId).forEach((id) => CacheStore.remove(id));
          state.caches = CacheStore.loadAll();
          if (state.targetId && state.targetId.startsWith(`${scenarioId}::`)) state.targetId = null;
          renderScenarioList();
          renderCacheList();
          renderRadar();
        }
        break;
    }
  });

  // ---------- Cache list ----------
  const cacheListEl = document.getElementById("cacheList");

  function renderCacheList() {
    if (state.caches.length === 0) {
      cacheListEl.innerHTML = '<p class="muted">Aucune cache enregistrée. Ajoute-en une dans l\'onglet "Ajouter".</p>';
      return;
    }

    const withDistance = state.caches.map((c) => {
      const distance = state.position
        ? Geo.distanceMeters(state.position.lat, state.position.lon, c.lat, c.lon)
        : null;
      return { ...c, distance };
    });

    withDistance.sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

    cacheListEl.innerHTML = withDistance
      .map(
        (c) => `
      <div class="cache-card ${c.found ? "found" : ""}" data-id="${c.id}">
        <div class="cache-card-head">
          <h3>${escapeHtml(c.name)}</h3>
          <span class="cache-dist">${c.distance !== null ? Geo.formatDistance(c.distance) : "--"}</span>
        </div>
        <div class="cache-meta">D${c.difficulty}/T${c.terrain} · lat ${c.lat.toFixed(5)}, lon ${c.lon.toFixed(5)}${
          c.scenarioTitle ? ` · 🎬 ${escapeHtml(c.scenarioTitle)}` : ""
        }</div>
        ${c.desc ? `<div class="cache-desc">${escapeHtml(c.desc)}</div>` : ""}
        ${c.hint ? `<div class="cache-hint">💡 ${escapeHtml(c.hint)}</div>` : ""}
        <div class="cache-actions">
          <button class="btn-secondary" data-action="target">📡 Pointer</button>
          <button class="btn-secondary" data-action="found">${c.found ? "↩️ Marquer non trouvée" : "✅ Marquer trouvée"}</button>
          <button class="btn-secondary" data-action="edit">✏️ Modifier</button>
          <button class="btn-danger" data-action="delete">🗑️ Supprimer</button>
        </div>
      </div>
    `
      )
      .join("");
  }

  cacheListEl.addEventListener("click", (evt) => {
    const btn = evt.target.closest("button[data-action]");
    if (!btn) return;
    const card = evt.target.closest(".cache-card");
    const id = card.dataset.id;
    const cache = state.caches.find((c) => c.id === id);
    if (!cache) return;

    switch (btn.dataset.action) {
      case "target":
        state.targetId = id;
        document.querySelector('.tab-btn[data-tab="radar"]').click();
        renderRadar();
        break;
      case "found":
        cache.found = !cache.found;
        state.caches = CacheStore.upsert(cache);
        renderCacheList();
        break;
      case "edit":
        loadCacheIntoForm(cache);
        document.querySelector('.tab-btn[data-tab="add"]').click();
        break;
      case "delete":
        if (confirm(`Supprimer la cache "${cache.name}" ?`)) {
          state.caches = CacheStore.remove(id);
          if (state.targetId === id) state.targetId = null;
          renderCacheList();
          renderRadar();
          renderScenarioList();
        }
        break;
    }
  });

  // ---------- Add / edit form ----------
  const form = document.getElementById("cacheForm");
  const cancelEditBtn = document.getElementById("cancelEdit");

  function loadCacheIntoForm(cache) {
    document.getElementById("cacheId").value = cache.id;
    document.getElementById("fName").value = cache.name;
    document.getElementById("fDesc").value = cache.desc || "";
    document.getElementById("fHint").value = cache.hint || "";
    document.getElementById("fDifficulty").value = cache.difficulty;
    document.getElementById("fTerrain").value = cache.terrain;
    document.getElementById("fLat").value = cache.lat;
    document.getElementById("fLon").value = cache.lon;
    cancelEditBtn.classList.remove("hidden");
  }

  function resetForm() {
    form.reset();
    document.getElementById("cacheId").value = "";
    cancelEditBtn.classList.add("hidden");
  }

  cancelEditBtn.addEventListener("click", resetForm);

  document.getElementById("useCurrentPos").addEventListener("click", () => {
    if (!state.position) {
      alert("Position GPS non disponible pour le moment.");
      return;
    }
    document.getElementById("fLat").value = state.position.lat;
    document.getElementById("fLon").value = state.position.lon;
  });

  form.addEventListener("submit", (evt) => {
    evt.preventDefault();
    const id = document.getElementById("cacheId").value || CacheStore.newId();
    const existing = state.caches.find((c) => c.id === id);
    const cache = {
      id,
      name: document.getElementById("fName").value.trim(),
      desc: document.getElementById("fDesc").value.trim(),
      hint: document.getElementById("fHint").value.trim(),
      difficulty: Number(document.getElementById("fDifficulty").value),
      terrain: Number(document.getElementById("fTerrain").value),
      lat: Number(document.getElementById("fLat").value),
      lon: Number(document.getElementById("fLon").value),
      found: existing ? existing.found : false,
    };
    state.caches = CacheStore.upsert(cache);
    resetForm();
    renderCacheList();
    renderRadar();
    document.querySelector('.tab-btn[data-tab="list"]').click();
  });

  // ---------- Import / export ----------
  document.getElementById("exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state.caches, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `geocaches-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("importInput").addEventListener("change", (evt) => {
    const file = evt.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!Array.isArray(imported)) throw new Error("Format invalide");
        const existingIds = new Set(state.caches.map((c) => c.id));
        const merged = state.caches.concat(
          imported
            .filter((c) => c && c.lat !== undefined && c.lon !== undefined)
            .map((c) => (existingIds.has(c.id) ? { ...c, id: CacheStore.newId() } : c))
        );
        CacheStore.saveAll(merged);
        state.caches = merged;
        renderCacheList();
        renderScenarioList();
        alert(`${imported.length} cache(s) importée(s).`);
      } catch (e) {
        alert("Impossible de lire ce fichier : " + e.message);
      } finally {
        evt.target.value = "";
      }
    };
    reader.readAsText(file);
  });

  document.getElementById("clearBtn").addEventListener("click", () => {
    if (confirm("Supprimer définitivement toutes les caches enregistrées sur cet appareil ?")) {
      CacheStore.clear();
      state.caches = [];
      state.targetId = null;
      renderCacheList();
      renderRadar();
      renderScenarioList();
    }
  });

  // ---------- Service worker ----------
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch((e) => console.error("SW registration failed", e));
    });
  }

  // ---------- Init ----------
  renderCacheList();
  renderRadar();
  renderScenarioList();
})();
