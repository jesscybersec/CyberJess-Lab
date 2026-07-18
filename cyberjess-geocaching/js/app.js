(() => {
  const SCAN_RADIUS_METERS = 30;

  const state = {
    caches: CacheStore.loadAll(),
    trails: CustomTrailStore.loadAll(),
    position: null, // {lat, lon, accuracy}
    heading: null, // degrees, 0 = north
    tiltBeta: null, // device front-back tilt, used for AR parallax
    tiltGamma: null, // device left-right tilt, used for AR parallax
    targetId: null,
    orientationEnabled: false,
    recording: null, // in-progress custom trail: {id, title, ..., waypoints: []}
    scanner: { stream: null, cacheId: null, rafId: null, baselineBeta: null },
    score: ScoreStore.load(),
    quiz: null, // in-progress quiz: {cacheId, difficultyLabel, questions, currentIndex}
  };

  // ---------- Theming ----------
  const bgPatternEl = document.getElementById("bgPattern");
  let currentThemeId = null;

  function themeIdForScenarioId(scenarioId) {
    if (!scenarioId) return null;
    const scenario = SCENARIOS.find((s) => s.id === scenarioId);
    if (scenario) return scenario.theme;
    const trail = state.trails.find((t) => t.id === scenarioId);
    return trail ? trail.theme : null;
  }

  function applyTheme(themeId) {
    const resolved = themeId || "explorer";
    if (resolved === currentThemeId) return;
    currentThemeId = resolved;
    const theme = getTheme(resolved);
    const root = document.documentElement.style;
    root.setProperty("--accent", theme.accent);
    root.setProperty("--accent-dim", theme.accentDim);
    root.setProperty("--bg", theme.bg);
    root.setProperty("--bg-panel", theme.bgPanel);
    bgPatternEl.className = `app-bg-pattern pattern-${theme.pattern}`;
  }

  function celebrateFound() {
    const theme = getTheme(currentThemeId);
    const burst = document.createElement("div");
    burst.className = "found-burst";
    burst.innerHTML = `<span>${theme.emoji}</span><span>✨</span><span>🎉</span><span>✨</span>`;
    document.body.appendChild(burst);
    setTimeout(() => burst.remove(), 1000);
  }

  // ---------- Quiz & scoreboard ----------
  const quizModalEl = document.getElementById("quizModal");
  const quizProgressEl = document.getElementById("quizProgress");
  const quizQuestionTextEl = document.getElementById("quizQuestionText");
  const quizChoicesEl = document.getElementById("quizChoices");
  const quizFeedbackEl = document.getElementById("quizFeedback");
  const quizNextBtnEl = document.getElementById("quizNextBtn");
  const quizSkipBtnEl = document.getElementById("quizSkipBtn");
  const scoreboardDisplayEl = document.getElementById("scoreboardDisplay");

  function finalizeFound(cache) {
    cache.found = true;
    state.caches = CacheStore.upsert(cache);
    renderCacheList();
    renderRadar();
    renderScenarioList();
    renderTrailList();
    celebrateFound();
  }

  // A cache earns its team a quiz only when it's tied to a scenario or a
  // custom trail (that's where audience + difficulty come from) and that
  // bucket actually has questions. Standalone manually-added caches skip
  // straight to being marked found.
  function markCacheFound(cache) {
    const owner = cache.scenarioId
      ? SCENARIOS.find((s) => s.id === cache.scenarioId) || trailById(cache.scenarioId)
      : null;
    const picked = owner ? pickQuizQuestions(owner.audience, owner.difficultyLabel, 2, state.score.usedQuestions) : null;

    if (!picked) {
      finalizeFound(cache);
      return;
    }

    state.score.usedQuestions[picked.key] = (state.score.usedQuestions[picked.key] || []).concat(picked.indices);
    ScoreStore.save(state.score);

    state.quiz = {
      cacheId: cache.id,
      difficultyLabel: owner.difficultyLabel,
      questions: picked.questions,
      currentIndex: 0,
    };
    renderQuizQuestion();
    quizModalEl.classList.remove("hidden");
  }

  function renderQuizQuestion() {
    const quiz = state.quiz;
    const q = quiz.questions[quiz.currentIndex];
    quizProgressEl.textContent = `Question ${quiz.currentIndex + 1} / ${quiz.questions.length}`;
    quizQuestionTextEl.textContent = q.q;
    quizFeedbackEl.classList.add("hidden");
    quizNextBtnEl.classList.add("hidden");
    quizChoicesEl.innerHTML = q.choices
      .map((choice, i) => `<button type="button" class="btn-secondary" data-choice="${i}">${escapeHtml(choice)}</button>`)
      .join("");
  }

  quizChoicesEl.addEventListener("click", (evt) => {
    const btn = evt.target.closest("button[data-choice]");
    if (!btn || !state.quiz) return;

    const quiz = state.quiz;
    const q = quiz.questions[quiz.currentIndex];
    const choiceIndex = Number(btn.dataset.choice);
    const isCorrect = choiceIndex === q.correct;
    const points = QUIZ_POINTS[quiz.difficultyLabel] || 5;

    Array.from(quizChoicesEl.children).forEach((b) => {
      b.disabled = true;
    });
    btn.classList.add(isCorrect ? "quiz-choice-correct" : "quiz-choice-wrong");
    if (!isCorrect) quizChoicesEl.children[q.correct].classList.add("quiz-choice-correct");

    state.score.total += isCorrect ? points : 0;
    state.score[isCorrect ? "correct" : "incorrect"] += 1;
    ScoreStore.save(state.score);
    renderScoreboard();

    quizFeedbackEl.textContent = isCorrect ? `✅ Bonne réponse ! +${points} points` : "❌ Mauvaise réponse.";
    quizFeedbackEl.classList.remove("hidden");
    quizNextBtnEl.classList.remove("hidden");
    quizNextBtnEl.textContent = quiz.currentIndex + 1 < quiz.questions.length ? "Question suivante" : "Terminer";
  });

  quizNextBtnEl.addEventListener("click", () => {
    if (!state.quiz) return;
    state.quiz.currentIndex += 1;
    if (state.quiz.currentIndex < state.quiz.questions.length) {
      renderQuizQuestion();
    } else {
      closeQuiz();
    }
  });

  quizSkipBtnEl.addEventListener("click", closeQuiz);

  function closeQuiz() {
    const cacheId = state.quiz ? state.quiz.cacheId : null;
    quizModalEl.classList.add("hidden");
    state.quiz = null;
    if (!cacheId) return;
    const cache = state.caches.find((c) => c.id === cacheId);
    if (cache) finalizeFound(cache);
  }

  function renderScoreboard() {
    scoreboardDisplayEl.innerHTML = `
      <div class="score-total">${state.score.total} points</div>
      <div class="muted">${state.score.correct} bonne(s) réponse(s) · ${state.score.incorrect} erreur(s)</div>
    `;
  }

  document.getElementById("resetScoreBtn").addEventListener("click", () => {
    if (confirm("Réinitialiser le score à zéro ? Cette action est irréversible.")) {
      state.score = ScoreStore.reset();
      renderScoreboard();
    }
  });

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
    if (evt.beta !== null) state.tiltBeta = evt.beta;
    if (evt.gamma !== null) state.tiltGamma = evt.gamma;

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
  const compassBezelEl = document.getElementById("compassBezel");

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
    const accentColor = getTheme(currentThemeId).accent;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rad);

    ctx.fillStyle = accentColor;
    ctx.shadowColor = accentColor;
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

    applyTheme(target ? themeIdForScenarioId(target.scenarioId) : null);
    compassBezelEl.classList.toggle("has-target", !!target && !target.found);

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
      ${renderScanGate(target, distance)}
    `;
  }

  function renderScanGate(target, distance) {
    if (target.found) return '<div class="scan-gate muted">✅ Cache déjà trouvée</div>';
    if (!target.ar) return "";
    const obj = getArObject(target.ar);
    if (!obj) return "";
    if (distance <= SCAN_RADIUS_METERS) {
      return `<div class="scan-gate"><button class="btn-primary" data-action="scan">📷 Scanner la zone</button></div>`;
    }
    return `<div class="scan-gate muted">🔒 Approche-toi à moins de ${SCAN_RADIUS_METERS} m pour scanner (encore ${Geo.formatDistance(distance - SCAN_RADIUS_METERS)})</div>`;
  }

  radarInfoEl.addEventListener("click", (evt) => {
    const btn = evt.target.closest('button[data-action="scan"]');
    if (!btn) return;
    const target = getTarget();
    if (target) openScanner(target);
  });

  // ---------- AR scanner (camera + floating virtual object) ----------
  const arScannerEl = document.getElementById("arScanner");
  const arVideoEl = document.getElementById("arVideo");
  const arCanvasEl = document.getElementById("arCanvas");
  const arCtx = arCanvasEl.getContext("2d");
  const arObjectLabelEl = document.getElementById("arObjectLabel");
  const arErrorEl = document.getElementById("arError");

  async function openScanner(cache) {
    const obj = getArObject(cache.ar);
    if (!obj) return;

    state.scanner.cacheId = cache.id;
    state.scanner.baselineBeta = state.tiltBeta;
    arObjectLabelEl.textContent = `Cherche : ${obj.emoji} ${obj.label}`;
    arErrorEl.classList.add("hidden");
    arScannerEl.classList.remove("hidden");
    resizeArCanvas();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      state.scanner.stream = stream;
      arVideoEl.srcObject = stream;
    } catch (e) {
      arErrorEl.textContent =
        "Caméra indisponible (" + e.message + "). Tu peux quand même marquer la cache comme trouvée.";
      arErrorEl.classList.remove("hidden");
    }

    runArLoop(obj);
  }

  function resizeArCanvas() {
    arCanvasEl.width = window.innerWidth;
    arCanvasEl.height = window.innerHeight;
  }

  function runArLoop(obj) {
    const cx = arCanvasEl.width / 2;
    const cy = arCanvasEl.height / 2;
    const maxOffset = 70;

    function frame(timestamp) {
      if (!state.scanner.cacheId) return; // scanner closed
      arCtx.clearRect(0, 0, arCanvasEl.width, arCanvasEl.height);

      const gamma = state.tiltGamma || 0;
      const betaDelta = state.tiltBeta !== null && state.scanner.baselineBeta !== null
        ? state.tiltBeta - state.scanner.baselineBeta
        : 0;
      const offsetX = Math.max(-maxOffset, Math.min(maxOffset, -gamma * 2.2));
      const offsetY = Math.max(-maxOffset, Math.min(maxOffset, -betaDelta * 2.2));
      const bob = Math.sin(timestamp / 500) * 10;

      const x = cx + offsetX;
      const y = cy + offsetY + bob;

      arCtx.save();
      arCtx.shadowColor = obj.color;
      arCtx.shadowBlur = 35;
      arCtx.font = "72px 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
      arCtx.textAlign = "center";
      arCtx.textBaseline = "middle";
      arCtx.fillText(obj.emoji, x, y);
      arCtx.restore();

      state.scanner.rafId = requestAnimationFrame(frame);
    }

    state.scanner.rafId = requestAnimationFrame(frame);
  }

  function closeScanner() {
    if (state.scanner.rafId) cancelAnimationFrame(state.scanner.rafId);
    if (state.scanner.stream) state.scanner.stream.getTracks().forEach((t) => t.stop());
    state.scanner = { stream: null, cacheId: null, rafId: null, baselineBeta: null };
    arVideoEl.srcObject = null;
    arScannerEl.classList.add("hidden");
  }

  window.addEventListener("resize", () => {
    if (!arScannerEl.classList.contains("hidden")) resizeArCanvas();
  });

  document.getElementById("arCloseBtn").addEventListener("click", closeScanner);

  document.getElementById("arFoundBtn").addEventListener("click", () => {
    const cacheId = state.scanner.cacheId;
    const cache = state.caches.find((c) => c.id === cacheId);
    closeScanner();
    if (!cache) return;
    markCacheFound(cache);
  });

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
        const theme = getTheme(s.theme);
        return `
      <div class="scenario-card pattern-${theme.pattern}" data-scenario-id="${s.id}" style="--card-accent:${theme.accent}">
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
        ar: wp.ar || null,
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

  // ---------- Game master mode ----------
  const gmNewTrailForm = document.getElementById("gmNewTrailForm");
  const gmRecordingView = document.getElementById("gmRecordingView");
  const gmRecordingTitleEl = document.getElementById("gmRecordingTitle");
  const gmCheckpointListEl = document.getElementById("gmCheckpointList");
  const gmCheckpointForm = document.getElementById("gmCheckpointForm");
  const trailListEl = document.getElementById("trailList");

  const DIFFICULTY_STARS = { Facile: 1, Moyen: 3, Difficile: 5 };

  function renderGmView() {
    if (state.recording) {
      gmNewTrailForm.classList.add("hidden");
      gmRecordingView.classList.remove("hidden");
      gmRecordingTitleEl.textContent = `Enregistrement : ${state.recording.title}`;
      gmCheckpointListEl.innerHTML =
        state.recording.waypoints
          .map(
            (wp, idx) => `
        <div class="gm-checkpoint-item" data-index="${idx}">
          <span><span class="gm-cp-index">#${idx + 1}</span>${escapeHtml(wp.name)}</span>
          <button type="button" class="btn-danger" data-action="remove-checkpoint">🗑️</button>
        </div>
      `
          )
          .join("") || '<p class="muted">Aucun checkpoint pour l\'instant.</p>';
    } else {
      gmNewTrailForm.classList.remove("hidden");
      gmRecordingView.classList.add("hidden");
    }
  }

  gmNewTrailForm.addEventListener("submit", (evt) => {
    evt.preventDefault();
    const difficultyLabel = document.getElementById("gmDifficulty").value;
    const themeId = document.getElementById("gmTheme").value;
    state.recording = {
      id: CustomTrailStore.newId(),
      title: document.getElementById("gmName").value.trim(),
      emoji: getTheme(themeId).emoji,
      theme: themeId,
      audience: document.getElementById("gmAudience").value,
      difficultyLabel,
      difficultyStars: DIFFICULTY_STARS[difficultyLabel] || 3,
      minAge: "Trajet personnalisé",
      setting: document.getElementById("gmSetting").value.trim() || "Trajet personnalisé",
      intro: document.getElementById("gmIntro").value.trim(),
      waypoints: [],
    };
    gmNewTrailForm.reset();
    renderGmView();
  });

  gmCheckpointForm.addEventListener("submit", (evt) => {
    evt.preventDefault();
    if (!state.recording) return;
    if (!state.position) {
      alert("Position GPS non disponible pour le moment.");
      return;
    }
    state.recording.waypoints.push({
      name: document.getElementById("gmCpName").value.trim(),
      desc: document.getElementById("gmCpDesc").value.trim(),
      hint: document.getElementById("gmCpHint").value.trim(),
      ar: document.getElementById("gmCpAr").value || null,
      lat: state.position.lat,
      lon: state.position.lon,
    });
    gmCheckpointForm.reset();
    renderGmView();
  });

  gmCheckpointListEl.addEventListener("click", (evt) => {
    const btn = evt.target.closest('button[data-action="remove-checkpoint"]');
    if (!btn || !state.recording) return;
    const idx = Number(evt.target.closest(".gm-checkpoint-item").dataset.index);
    state.recording.waypoints.splice(idx, 1);
    renderGmView();
  });

  document.getElementById("gmFinishBtn").addEventListener("click", () => {
    if (!state.recording) return;
    if (state.recording.waypoints.length === 0) {
      alert("Ajoute au moins un checkpoint avant de terminer le trajet.");
      return;
    }
    CustomTrailStore.upsert(state.recording);
    state.trails = CustomTrailStore.loadAll();
    state.recording = null;
    renderGmView();
    renderTrailList();
  });

  document.getElementById("gmCancelBtn").addEventListener("click", () => {
    if (confirm("Annuler l'enregistrement en cours ? Les checkpoints ajoutés seront perdus.")) {
      state.recording = null;
      renderGmView();
    }
  });

  function trailById(id) {
    return state.trails.find((t) => t.id === id);
  }

  function launchTrail(trail) {
    trail.waypoints.forEach((wp, idx) => {
      const cache = {
        id: `${trail.id}::${idx}`,
        name: wp.name,
        desc: wp.desc,
        hint: wp.hint,
        ar: wp.ar || null,
        difficulty: trail.difficultyStars,
        terrain: trail.difficultyStars,
        lat: wp.lat,
        lon: wp.lon,
        found: false,
        scenarioId: trail.id,
        scenarioTitle: trail.title,
        scenarioIndex: idx,
      };
      CacheStore.upsert(cache);
    });
    state.caches = CacheStore.loadAll();
    state.targetId = `${trail.id}::0`;
    renderCacheList();
    renderRadar();
    renderScenarioList();
    document.querySelector('.tab-btn[data-tab="radar"]').click();
  }

  function renderTrailList() {
    if (state.trails.length === 0) {
      trailListEl.innerHTML = '<p class="muted">Aucun trajet personnalisé pour l\'instant.</p>';
      return;
    }

    trailListEl.innerHTML = state.trails
      .map((t) => {
        const launched = isScenarioLaunched(t.id);
        const theme = getTheme(t.theme);
        return `
      <div class="scenario-card pattern-${theme.pattern}" data-trail-id="${t.id}" style="--card-accent:${theme.accent}">
        <div class="scenario-card-head">
          <span class="scenario-emoji">${t.emoji}</span>
          <h3>${escapeHtml(t.title)}</h3>
          <span class="badge badge-audience-${t.audience}">${t.audience === "enfants" ? "👧 Enfants" : "🧑 Adultes"}</span>
          <span class="badge badge-difficulty-${t.difficultyLabel}">${t.difficultyLabel}</span>
        </div>
        <div class="scenario-meta">${t.waypoints.length} checkpoints · ${escapeHtml(t.setting)}</div>
        ${t.intro ? `<div class="scenario-intro-text">${escapeHtml(t.intro)}</div>` : ""}
        <div class="scenario-actions">
          <button class="btn-primary" data-action="launch-trail">🚀 Lancer</button>
          <button class="btn-secondary" data-action="export-trail">⬇️ Exporter</button>
          <button class="btn-danger" data-action="delete-trail">🗑️ Supprimer</button>
          ${
            launched
              ? '<button class="btn-secondary" data-action="goto-trail">📡 Voir sur le radar</button>' +
                '<span class="scenario-launched-tag">✅ Lancé sur cet appareil</span>'
              : ""
          }
        </div>
      </div>
    `;
      })
      .join("");
  }

  trailListEl.addEventListener("click", (evt) => {
    const btn = evt.target.closest("button[data-action]");
    if (!btn) return;
    const card = evt.target.closest(".scenario-card");
    const trailId = card.dataset.trailId;
    const trail = trailById(trailId);
    if (!trail) return;

    switch (btn.dataset.action) {
      case "launch-trail":
        launchTrail(trail);
        break;
      case "goto-trail": {
        const ids = scenarioCacheIds(trailId);
        const nextUnfound = state.caches.find((c) => ids.includes(c.id) && !c.found);
        state.targetId = nextUnfound ? nextUnfound.id : ids[0];
        renderRadar();
        document.querySelector('.tab-btn[data-tab="radar"]').click();
        break;
      }
      case "export-trail": {
        const blob = new Blob([JSON.stringify(trail, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `trajet-${trail.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
        a.click();
        URL.revokeObjectURL(url);
        break;
      }
      case "delete-trail":
        if (confirm(`Supprimer définitivement le trajet "${trail.title}" et ses caches associées ?`)) {
          scenarioCacheIds(trailId).forEach((id) => CacheStore.remove(id));
          CustomTrailStore.remove(trailId);
          state.caches = CacheStore.loadAll();
          state.trails = CustomTrailStore.loadAll();
          if (state.targetId && state.targetId.startsWith(`${trailId}::`)) state.targetId = null;
          renderCacheList();
          renderRadar();
          renderTrailList();
        }
        break;
    }
  });

  const ALLOWED_AUDIENCES = ["enfants", "adultes"];
  const ALLOWED_DIFFICULTY_LABELS = ["Facile", "Moyen", "Difficile"];

  // A trail file may come from someone else's device (shared by cable,
  // Bluetooth, AirDrop...), so its fields are untrusted input: every value
  // is type-checked and coerced to a known-safe shape before it can ever
  // reach innerHTML — ids are always regenerated locally, and free-form
  // enum-like fields (audience, difficulty) are restricted to an allow-list
  // rather than trusted as-is.
  function sanitizeImportedTrail(raw) {
    if (!raw || typeof raw !== "object" || !Array.isArray(raw.waypoints)) return null;
    if (typeof raw.title !== "string" || !raw.title.trim()) return null;

    const waypoints = raw.waypoints
      .map((wp) => {
        if (!wp || typeof wp !== "object") return null;
        const lat = Number(wp.lat);
        const lon = Number(wp.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
        return {
          name: typeof wp.name === "string" && wp.name.trim() ? wp.name.slice(0, 200) : "Checkpoint",
          desc: typeof wp.desc === "string" ? wp.desc.slice(0, 2000) : "",
          hint: typeof wp.hint === "string" ? wp.hint.slice(0, 500) : "",
          ar: typeof wp.ar === "string" && getArObject(wp.ar) ? wp.ar : null,
          lat,
          lon,
        };
      })
      .filter(Boolean);
    if (waypoints.length === 0) return null;

    const difficultyLabel = ALLOWED_DIFFICULTY_LABELS.includes(raw.difficultyLabel) ? raw.difficultyLabel : "Moyen";
    const audience = ALLOWED_AUDIENCES.includes(raw.audience) ? raw.audience : "adultes";
    const themeId = typeof raw.theme === "string" && THEMES[raw.theme] ? raw.theme : "explorer";

    return {
      id: CustomTrailStore.newId(), // never trust an id from an imported file
      title: raw.title.trim().slice(0, 200),
      emoji: getTheme(themeId).emoji,
      theme: themeId,
      audience,
      difficultyLabel,
      difficultyStars: DIFFICULTY_STARS[difficultyLabel] || 3,
      minAge: typeof raw.minAge === "string" ? raw.minAge.slice(0, 100) : "Trajet personnalisé",
      setting: typeof raw.setting === "string" ? raw.setting.slice(0, 200) : "Trajet personnalisé",
      intro: typeof raw.intro === "string" ? raw.intro.slice(0, 2000) : "",
      waypoints,
    };
  }

  document.getElementById("importTrailInput").addEventListener("change", (evt) => {
    const file = evt.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const trail = sanitizeImportedTrail(JSON.parse(reader.result));
        if (!trail) throw new Error("Format de trajet invalide");
        CustomTrailStore.upsert(trail);
        state.trails = CustomTrailStore.loadAll();
        renderTrailList();
        alert(`Trajet "${trail.title}" importé.`);
      } catch (e) {
        alert("Impossible de lire ce fichier : " + e.message);
      } finally {
        evt.target.value = "";
      }
    };
    reader.readAsText(file);
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
        ${c.ar && getArObject(c.ar) ? `<div class="cache-hint">📷 Scan : ${getArObject(c.ar).emoji} ${escapeHtml(getArObject(c.ar).label)}</div>` : ""}
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
        if (cache.found) {
          cache.found = false;
          state.caches = CacheStore.upsert(cache);
          renderCacheList();
          renderRadar();
        } else {
          markCacheFound(cache);
        }
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
          renderTrailList();
        }
        break;
    }
  });

  // ---------- AR object select helper ----------
  function populateArSelect(selectEl) {
    selectEl.innerHTML =
      '<option value="">Aucun</option>' +
      AR_OBJECTS.map((o) => `<option value="${o.id}">${o.emoji} ${escapeHtml(o.label)}</option>`).join("");
  }

  populateArSelect(document.getElementById("fArObject"));
  populateArSelect(document.getElementById("gmCpAr"));

  const gmThemeSelect = document.getElementById("gmTheme");
  gmThemeSelect.innerHTML = Object.keys(THEMES)
    .map((id) => `<option value="${id}">${THEMES[id].label}</option>`)
    .join("");

  // ---------- Add / edit form ----------
  const form = document.getElementById("cacheForm");
  const cancelEditBtn = document.getElementById("cancelEdit");

  function loadCacheIntoForm(cache) {
    document.getElementById("cacheId").value = cache.id;
    document.getElementById("fName").value = cache.name;
    document.getElementById("fDesc").value = cache.desc || "";
    document.getElementById("fHint").value = cache.hint || "";
    document.getElementById("fArObject").value = cache.ar || "";
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
      ar: document.getElementById("fArObject").value || null,
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

  // Same trust boundary as sanitizeImportedTrail above: a caches file may
  // come from another device, so every field is type-checked and coerced
  // before it can reach innerHTML. Ids are always regenerated locally.
  function sanitizeImportedCache(raw) {
    if (!raw || typeof raw !== "object") return null;
    const lat = Number(raw.lat);
    const lon = Number(raw.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    const clampDifficulty = (n) => (Number.isFinite(n) ? Math.min(5, Math.max(1, Math.round(n))) : 3);

    const cache = {
      id: CacheStore.newId(), // never trust an id from an imported file
      name: typeof raw.name === "string" && raw.name.trim() ? raw.name.slice(0, 200) : "Cache importée",
      desc: typeof raw.desc === "string" ? raw.desc.slice(0, 2000) : "",
      hint: typeof raw.hint === "string" ? raw.hint.slice(0, 500) : "",
      ar: typeof raw.ar === "string" && getArObject(raw.ar) ? raw.ar : null,
      difficulty: clampDifficulty(Number(raw.difficulty)),
      terrain: clampDifficulty(Number(raw.terrain)),
      lat,
      lon,
      found: false,
    };
    if (typeof raw.scenarioId === "string" && raw.scenarioId) {
      cache.scenarioId = raw.scenarioId.slice(0, 200);
      cache.scenarioTitle = typeof raw.scenarioTitle === "string" ? raw.scenarioTitle.slice(0, 200) : "";
      cache.scenarioIndex = Number.isFinite(Number(raw.scenarioIndex)) ? Number(raw.scenarioIndex) : 0;
    }
    return cache;
  }

  document.getElementById("importInput").addEventListener("change", (evt) => {
    const file = evt.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!Array.isArray(imported)) throw new Error("Format invalide");
        const sanitized = imported.map(sanitizeImportedCache).filter(Boolean);
        const merged = state.caches.concat(sanitized);
        CacheStore.saveAll(merged);
        state.caches = merged;
        renderCacheList();
        renderScenarioList();
        renderTrailList();
        alert(`${sanitized.length} cache(s) importée(s).`);
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
      renderTrailList();
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
  renderGmView();
  renderTrailList();
  renderScoreboard();
})();
