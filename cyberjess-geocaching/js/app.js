(() => {
  const SCAN_RADIUS_METERS = 30;

  const state = {
    caches: CacheStore.loadAll(),
    trails: CustomTrailStore.loadAll(),
    position: null, // {lat, lon, accuracy} — effective position, real or simulated
    lastRealPosition: null, // last position reported by the real GPS, kept even while simulating
    heading: null, // degrees, 0 = north — falls back to the simulated slider when no real compass exists
    // Real device orientation is tracked per source, independently, instead of merged into a
    // single mutable value: mixing sources into one variable is what caused the AR search to
    // freeze or flicker on some phones (see git history). Each source keeps its own latest
    // value + timestamp; the AR scanner locks onto ONE source per session (see openScanner) and
    // only reconsiders that choice if its source goes quiet, so it never flip-flops mid-search.
    webkitHeading: null, // iOS Safari's webkitCompassHeading — always true-north
    absoluteHeading: null, // from deviceorientationabsolute / deviceorientation with absolute:true
    relativeHeading: null, // from plain deviceorientation with no absolute flag — not true-north
    headingUpdatedAt: { webkit: null, absolute: null, relative: null },
    tiltBeta: null, // device front-back tilt, used for AR parallax
    tiltGamma: null, // device left-right tilt, used for AR parallax
    targetId: null,
    orientationEnabled: false,
    recording: null, // in-progress custom trail: {id, title, ..., waypoints: []}
    scanner: {
      stream: null,
      cacheId: null,
      rafId: null,
      baselineBeta: null,
      objectBearing: null,
      headingCategory: null, // the locked heading source for the current scan session
      frozen: false, // true once the object has been spotted and the camera view is held still
    },
    score: ScoreStore.load(),
    quiz: null, // in-progress quiz: {cacheId, difficultyLabel, questions, currentIndex}
    simulation: { active: false },
    settings: SettingsStore.load(),
  };

  // ---------- Sound & vibration feedback ----------
  function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  function feedback(kind) {
    if (!state.settings.soundEnabled) return;
    switch (kind) {
      case "proximity":
        SoundFx.playProximity();
        vibrate(80);
        break;
      case "correct":
        SoundFx.playCorrect();
        vibrate(50);
        break;
      case "incorrect":
        SoundFx.playIncorrect();
        vibrate([50, 80, 50]);
        break;
      case "found":
        SoundFx.playFound();
        vibrate([30, 50, 30, 50, 80]);
        break;
    }
  }

  // Autoplay policies require a user gesture before audio can play; the
  // very first tap anywhere "unlocks" the AudioContext so later feedback
  // (which may fire from a GPS update rather than a click) isn't blocked.
  function unlockAudioOnce() {
    SoundFx.ensureCtx();
    document.removeEventListener("click", unlockAudioOnce);
    document.removeEventListener("touchstart", unlockAudioOnce);
  }
  document.addEventListener("click", unlockAudioOnce, { once: true });
  document.addEventListener("touchstart", unlockAudioOnce, { once: true });

  const soundToggleEl = document.getElementById("soundToggle");
  soundToggleEl.checked = state.settings.soundEnabled;
  soundToggleEl.addEventListener("change", () => {
    state.settings.soundEnabled = soundToggleEl.checked;
    SettingsStore.save(state.settings);
  });

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
    feedback("found");
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
    feedback(isCorrect ? "correct" : "incorrect");

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

  function renderCoordsReadout() {
    if (!state.position) return;
    const simTag = state.simulation.active ? " (simulée)" : "";
    coordsReadoutEl.textContent =
      `lat: ${state.position.lat.toFixed(6)}, lon: ${state.position.lon.toFixed(6)} ` +
      `(précision: ±${Math.round(state.position.accuracy)} m)${simTag}`;
  }

  function onPosition(pos) {
    state.lastRealPosition = {
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    };
    gpsStatusEl.className = "gps-status gps-ok";
    gpsLabelEl.textContent = "Position acquise";
    if (state.simulation.active) return; // simulated position takes over
    state.position = state.lastRealPosition;
    renderCoordsReadout();
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
  // A source is considered stale (no longer "actively flowing") after this long
  // with no update — used both to decide when the AR scanner should reconsider
  // which source it's locked onto, and to warn in the debug readout.
  const HEADING_STALE_MS = 1000;
  const enableOrientationBtn = document.getElementById("enableOrientationBtn");

  function handleOrientation(evt) {
    // Always tracked, even while position is simulated: a real phone's own
    // rotation must still work for the AR search and the compass — only a
    // desktop/no-sensor test session should ever need the simulated slider.
    if (evt.beta !== null) state.tiltBeta = evt.beta;
    if (evt.gamma !== null) state.tiltGamma = evt.gamma;

    const now = performance.now();

    // iOS Safari: webkitCompassHeading is a true, north-referenced compass
    // heading -- EXCEPT it reports the sentinel value -1 (per Apple's own
    // docs) when the heading genuinely can't be determined yet (compass not
    // calibrated). That's a valid `number` and was being treated as real
    // data, permanently locking the AR search onto a frozen, meaningless
    // heading forever (since it kept refreshing its own "fresh" timestamp
    // every event) and making both real rotation and the simulation dial
    // powerless to ever bring the object into view.
    if ("webkitCompassHeading" in evt) {
      if (typeof evt.webkitCompassHeading === "number" && evt.webkitCompassHeading >= 0) {
        state.webkitHeading = evt.webkitCompassHeading;
        state.headingUpdatedAt.webkit = now;
        renderRadar();
      }
      // Deliberately not falling through to alpha/absolute below: on iOS,
      // alpha comes from the same sensor-fusion pipeline as
      // webkitCompassHeading, so if THAT says the heading is unknown, alpha
      // from this same event isn't a trustworthy independent signal either
      // -- unlike Android, where plain deviceorientation is a genuinely
      // separate, gyro-only source worth using as a fallback.
      return;
    }

    if (evt.alpha === null) return;
    // A plain "deviceorientation" event without absolute=true is relative to
    // whatever direction the phone happened to face when the listener was
    // attached, NOT true north. Each source (absolute vs. relative) keeps its
    // own independent value — never merged into one shared variable — so one
    // can never clobber or flicker against the other; the AR scanner picks
    // which source to trust for a whole session (see openScanner/runArLoop).
    const isAbsolute = evt.absolute === true || evt.type === "deviceorientationabsolute";
    const value = (360 - evt.alpha + 360) % 360;
    if (isAbsolute) {
      state.absoluteHeading = value;
      state.headingUpdatedAt.absolute = now;
    } else {
      state.relativeHeading = value;
      state.headingUpdatedAt.relative = now;
    }
    renderRadar();
  }

  // Whichever real source last reported data at all (regardless of staleness) —
  // used outside the AR scanner (radar arrow, cap label) where session
  // consistency doesn't matter, only showing the best available number now.
  // Falls back to the simulated slider only when there's no real sensor data
  // whatsoever (e.g. testing on a laptop with no orientation support).
  function getEffectiveHeading() {
    if (state.webkitHeading !== null) return state.webkitHeading;
    if (state.absoluteHeading !== null) return state.absoluteHeading;
    if (state.relativeHeading !== null) return state.relativeHeading;
    return state.heading;
  }

  function startOrientation() {
    window.addEventListener("deviceorientationabsolute", handleOrientation, true);
    window.addEventListener("deviceorientation", handleOrientation, true);
    state.orientationEnabled = true;
  }

  // Requests the iOS 13+ motion/orientation permission if not already granted.
  // Must run directly inside a user-gesture handler (a click) — both the
  // small "Activer la boussole" button in the Radar tab AND the AR scan
  // button itself call this, so the prompt also appears right when the
  // search actually needs it, instead of relying solely on a button a player
  // testing via simulation might never notice or think to tap.
  //
  // On some iOS setups (notably a home-screen-installed PWA, which is
  // exactly what this app's own install instructions encourage) the native
  // permission prompt can fail to appear at all and the promise just hangs
  // forever. A timeout guarantees this call always settles either way, so
  // nothing that depends on it (like opening the AR scanner) can ever be
  // left stuck waiting on a prompt the user has no way to answer.
  const ORIENTATION_PERMISSION_TIMEOUT_MS = 3000;
  let orientationPermissionState = "unrequested"; // "unrequested" | "granted" | "denied" | "unsupported"
  let orientationPermissionRequestPromise = null; // in-flight request, if any, to avoid double-prompting
  function ensureOrientationPermission() {
    if (orientationPermissionRequestPromise) return orientationPermissionRequestPromise;

    orientationPermissionRequestPromise = (async () => {
      if (typeof DeviceOrientationEvent === "undefined") {
        orientationPermissionState = "unsupported";
        return orientationPermissionState;
      }
      if (typeof DeviceOrientationEvent.requestPermission !== "function") {
        // Android and most non-iOS browsers don't gate this behind a prompt.
        if (!state.orientationEnabled) startOrientation();
        orientationPermissionState = "granted";
        return orientationPermissionState;
      }
      if (orientationPermissionState === "granted") return orientationPermissionState;
      try {
        const result = await Promise.race([
          DeviceOrientationEvent.requestPermission(),
          new Promise((resolve) => setTimeout(() => resolve("timeout"), ORIENTATION_PERMISSION_TIMEOUT_MS)),
        ]);
        if (result === "timeout") {
          console.error("La demande de permission boussole n'a pas répondu à temps.");
          orientationPermissionState = "denied";
        } else {
          orientationPermissionState = result; // "granted" or "denied"
          if (result === "granted") {
            startOrientation();
            enableOrientationBtn.classList.add("hidden");
          }
        }
      } catch (e) {
        console.error(e);
        orientationPermissionState = "denied";
      }
      return orientationPermissionState;
    })();

    orientationPermissionRequestPromise.finally(() => {
      orientationPermissionRequestPromise = null;
    });
    return orientationPermissionRequestPromise;
  }

  if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
    enableOrientationBtn.classList.remove("hidden");
    enableOrientationBtn.addEventListener("click", ensureOrientationPermission);
  } else if (typeof DeviceOrientationEvent !== "undefined") {
    startOrientation();
  }

  // ---------- Simulation mode ----------
  const simBannerEl = document.getElementById("simBanner");
  const simToggleBtn = document.getElementById("simToggleBtn");
  const simControlsEl = document.getElementById("simControls");
  const simLatEl = document.getElementById("simLat");
  const simLonEl = document.getElementById("simLon");
  const simPadEl = document.getElementById("simPad");
  const simHeadingSliderEl = document.getElementById("simHeadingSlider");
  const simHeadingValueEl = document.getElementById("simHeadingValue");

  function renderSimulationView() {
    const active = state.simulation.active;
    simBannerEl.classList.toggle("hidden", !active);
    simControlsEl.classList.toggle("hidden", !active);
    simToggleBtn.textContent = active ? "⏹️ Désactiver la simulation" : "🧪 Activer la simulation";
    simToggleBtn.className = active ? "btn-danger" : "btn-secondary";

    if (active && state.position) {
      simLatEl.value = state.position.lat;
      simLonEl.value = state.position.lon;
    }
    simHeadingSliderEl.value = state.heading || 0;
    simHeadingValueEl.textContent = `${Math.round(state.heading || 0)}°`;
  }

  function moveSimulatedPosition(lat, lon) {
    state.position = { lat, lon, accuracy: 5 };
    renderCoordsReadout();
    renderCacheList();
    renderRadar();
    renderSimulationView();
  }

  simToggleBtn.addEventListener("click", () => {
    if (state.simulation.active) {
      state.simulation.active = false;
      if (state.lastRealPosition) state.position = state.lastRealPosition;
    } else {
      state.simulation.active = true;
      if (!state.position && state.lastRealPosition) state.position = { ...state.lastRealPosition };
      if (state.heading === null) state.heading = 0;
    }
    renderCoordsReadout();
    renderCacheList();
    renderRadar();
    renderSimulationView();
  });

  document.getElementById("simApplyBtn").addEventListener("click", () => {
    const lat = Number(simLatEl.value);
    const lon = Number(simLonEl.value);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      alert("Merci d'entrer une latitude et une longitude valides.");
      return;
    }
    moveSimulatedPosition(lat, lon);
  });

  document.getElementById("simUseRealBtn").addEventListener("click", () => {
    if (!state.lastRealPosition) {
      alert("Aucune position GPS réelle connue pour le moment.");
      return;
    }
    moveSimulatedPosition(state.lastRealPosition.lat, state.lastRealPosition.lon);
  });

  document.getElementById("simGotoTargetBtn").addEventListener("click", () => {
    const target = getTarget();
    if (!target) {
      alert("Aucune cache ciblée sur le radar pour le moment.");
      return;
    }
    moveSimulatedPosition(target.lat, target.lon);
  });

  simPadEl.addEventListener("click", (evt) => {
    const btn = evt.target.closest("button[data-bearing]");
    if (!btn) return;
    if (!state.position) {
      alert("Entre d'abord une position de départ ci-dessus.");
      return;
    }
    const bearing = Number(btn.dataset.bearing);
    const step = Number(document.getElementById("simStep").value);
    const dest = Geo.destinationPoint(state.position.lat, state.position.lon, bearing, step);
    moveSimulatedPosition(dest.lat, dest.lon);
  });

  simHeadingSliderEl.addEventListener("input", (evt) => {
    state.heading = Number(evt.target.value);
    simHeadingValueEl.textContent = `${state.heading}°`;
    renderRadar();
  });

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
    const effectiveHeading = getEffectiveHeading();
    const arrowAngle =
      effectiveHeading !== null ? (bearingToTarget - effectiveHeading + 360) % 360 : bearingToTarget;
    drawArrow(arrowAngle);

    radarInfoEl.innerHTML = `
      <div class="target-name">🎯 ${escapeHtml(target.name)}</div>
      <div class="target-distance">${Geo.formatDistance(distance)}</div>
      <div class="muted">cap: ${Math.round(bearingToTarget)}°${
      effectiveHeading === null ? " (boussole non calibrée — cap par rapport au nord)" : ""
    }</div>
      ${renderScanGate(target, distance)}
    `;
  }

  let proximityAlertedCacheId = null;

  function renderScanGate(target, distance) {
    if (target.found) {
      if (!target.scenarioId) return '<div class="scan-gate muted">✅ Cache déjà trouvée</div>';
      const ids = scenarioCacheIds(target.scenarioId);
      const next = state.caches.find((c) => ids.includes(c.id) && !c.found);
      if (next) {
        return `
          <div class="scan-gate">
            <p class="muted">✅ Cache trouvée !</p>
            <button class="btn-primary" data-action="next-cache" data-next-id="${next.id}">➡️ Cache suivante : ${escapeHtml(next.name)}</button>
          </div>
        `;
      }
      return '<div class="scan-gate muted">✅ Cache trouvée — 🎉 Scénario terminé, bravo !</div>';
    }
    if (!target.ar) return "";
    const obj = getArObject(target.ar);
    if (!obj) return "";
    if (distance <= SCAN_RADIUS_METERS) {
      if (proximityAlertedCacheId !== target.id) {
        proximityAlertedCacheId = target.id;
        feedback("proximity");
      }
      return `<div class="scan-gate"><button class="btn-primary" data-action="scan">📷 Scanner la zone</button></div>`;
    }
    if (proximityAlertedCacheId === target.id) proximityAlertedCacheId = null;
    return `<div class="scan-gate muted">🔒 Approche-toi à moins de ${SCAN_RADIUS_METERS} m pour scanner (encore ${Geo.formatDistance(distance - SCAN_RADIUS_METERS)})</div>`;
  }

  radarInfoEl.addEventListener("click", (evt) => {
    const scanBtn = evt.target.closest('button[data-action="scan"]');
    if (scanBtn) {
      const target = getTarget();
      if (target) openScanner(target);
      return;
    }
    const nextBtn = evt.target.closest('button[data-action="next-cache"]');
    if (nextBtn) {
      state.targetId = nextBtn.dataset.nextId;
      renderRadar();
    }
  });

  // ---------- AR scanner (camera + floating virtual object) ----------
  const AR_SEARCH_FOV_DEG = 55; // how wide a "field of view" reveals the object

  const arScannerEl = document.getElementById("arScanner");
  const arVideoEl = document.getElementById("arVideo");
  const arCanvasEl = document.getElementById("arCanvas");
  const arCtx = arCanvasEl.getContext("2d");
  const arObjectLabelEl = document.getElementById("arObjectLabel");
  const arSearchHintEl = document.getElementById("arSearchHint");
  const arErrorEl = document.getElementById("arError");
  const arFoundBtnEl = document.getElementById("arFoundBtn");
  const arDebugReadoutEl = document.getElementById("arDebugReadout");
  const arSimHeadingControlsEl = document.getElementById("arSimHeadingControls");
  const arSimHeadingLabelEl = document.getElementById("arSimHeadingLabel");
  const arHeadingLeftBtn = document.getElementById("arHeadingLeftBtn");
  const arHeadingRightBtn = document.getElementById("arHeadingRightBtn");

  function nudgeSimHeading(delta) {
    const base = state.heading !== null ? state.heading : 0;
    state.heading = (base + delta + 360) % 360;
    arSimHeadingLabelEl.textContent = Math.round(state.heading) + "°";
    if (simHeadingSliderEl) simHeadingSliderEl.value = state.heading;
    if (simHeadingValueEl) simHeadingValueEl.textContent = Math.round(state.heading) + "°";
  }
  arHeadingLeftBtn.addEventListener("click", () => nudgeSimHeading(-15));
  arHeadingRightBtn.addEventListener("click", () => nudgeSimHeading(15));

  function setArFoundLocked(locked) {
    arFoundBtnEl.disabled = locked;
    arFoundBtnEl.textContent = locked ? "🔒 Cherche encore l'objet…" : "✅ J'ai trouvé l'objet !";
  }

  // Smallest signed angle to rotate `from` by to reach `to`, in (-180, 180].
  function signedAngleDiff(from, to) {
    return ((to - from + 540) % 360) - 180;
  }

  async function openScanner(cache) {
    const obj = getArObject(cache.ar);
    if (!obj) return;

    state.scanner.cacheId = cache.id;
    state.scanner.baselineBeta = state.tiltBeta;
    state.scanner.headingCategory = null; // pick fresh for this session, see runArLoop
    state.scanner.frozen = false;
    // The object is "hidden" at a random compass bearing: with a real or
    // simulated heading available, finding it means physically panning the
    // camera around (or dragging the simulated heading slider) until it
    // comes into view, instead of it just floating in the middle of frame.
    state.scanner.objectBearing = Math.random() * 360;
    arObjectLabelEl.textContent = `Cherche : ${obj.emoji} ${obj.label}`;
    arSearchHintEl.classList.add("hidden");
    arErrorEl.classList.add("hidden");
    arScannerEl.classList.remove("hidden");
    // Locked until the object is actually spotted in frame — unless the
    // camera itself fails to start, in which case there's no way to search
    // at all, so it falls back to being immediately usable.
    setArFoundLocked(true);
    resizeArCanvas();
    arDebugReadoutEl.textContent = "🧭 Demande d'accès à la boussole…";

    // Ask for the compass permission right when it's actually needed, from
    // this same click gesture — a player testing via simulation, or anyone
    // who missed the small "Activer la boussole" button in the Radar tab,
    // still gets prompted at the moment the search starts. This IS awaited,
    // before the camera/search become interactive: a native permission
    // dialog left open while the player starts tapping "found"/"close" can
    // silently swallow those taps, so it must be fully resolved first. It's
    // still bounded by a timeout inside ensureOrientationPermission, so a
    // prompt that fails to appear at all (a known issue on some iOS setups)
    // can never leave the scanner stuck — worst case a few seconds' wait.
    await ensureOrientationPermission();
    if (state.simulation.active && state.heading === null) state.heading = 0;

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
      setArFoundLocked(false);
    }

    runArLoop(obj);
  }

  function resizeArCanvas() {
    arCanvasEl.width = window.innerWidth;
    arCanvasEl.height = window.innerHeight;
  }

  // Among the real (non-simulated) sources, pick whichever has reported data
  // most recently, but only if that data isn't stale — used to choose (and,
  // if it goes quiet, replace) the AR scanner's locked-in session source.
  // Fixed priority order, NOT "most recently updated": a true-north source
  // must always win over a relative one when both are actively flowing, even
  // if a device happens to dispatch the relative event a few microseconds
  // after the absolute one on every single sample (which would otherwise
  // make "most recent" always pick the wrong, relative-only one forever).
  function pickFreshRealHeadingCategory(now) {
    const priority = ["webkit", "absolute", "relative"];
    for (const category of priority) {
      const t = state.headingUpdatedAt[category];
      if (t !== null && now - t < HEADING_STALE_MS) return category;
    }
    return null;
  }

  // The AR search locks onto ONE heading source for the whole scan session
  // (chosen the first time real data appears, or re-chosen only if that
  // source goes quiet) instead of picking freshest-per-frame: two sources
  // that are both actively updating can have different reference frames
  // (true north vs. relative-to-startup), so switching between them frame to
  // frame made the object flicker in and out unpredictably. Falls back to
  // the simulated slider live (not locked) while no real data exists at all,
  // and to "no heading" (always-visible) if nothing exists at all.
  function getSessionHeading(now) {
    const currentCategory = state.scanner.headingCategory;
    const currentIsStale =
      currentCategory !== null &&
      (state.headingUpdatedAt[currentCategory] === null ||
        now - state.headingUpdatedAt[currentCategory] >= HEADING_STALE_MS);
    if (currentCategory === null || currentIsStale) {
      state.scanner.headingCategory = pickFreshRealHeadingCategory(now);
    }
    const locked = state.scanner.headingCategory;
    if (locked === "webkit") return { value: state.webkitHeading, source: "boussole" };
    if (locked === "absolute") return { value: state.absoluteHeading, source: "boussole" };
    if (locked === "relative") return { value: state.relativeHeading, source: "boussole non calibrée" };
    if (state.heading !== null) return { value: state.heading, source: "simulation" };
    return { value: null, source: null };
  }

  function runArLoop(obj) {
    const cx = arCanvasEl.width / 2;
    const cy = arCanvasEl.height / 2;
    const maxOffset = Math.min(arCanvasEl.width, arCanvasEl.height) * 0.32;
    const halfFov = AR_SEARCH_FOV_DEG / 2;

    function frame(timestamp) {
      if (!state.scanner.cacheId) return; // scanner closed

      try {
        arCtx.clearRect(0, 0, arCanvasEl.width, arCanvasEl.height);

        // Without any heading (no compass permission, not simulating), we
        // can't gate by direction — fall back to always-visible so the
        // feature still works, just without the search mechanic.
        const { value: currentHeading, source } = getSessionHeading(performance.now());
        const hasHeading = currentHeading !== null;
        const diff = hasHeading ? signedAngleDiff(currentHeading, state.scanner.objectBearing) : 0;
        const inView = !hasHeading || Math.abs(diff) <= halfFov;

        // Visible diagnostic readout — makes any future compass-sourcing issue
        // immediately obvious on-device instead of requiring remote back-and-forth to debug.
        arDebugReadoutEl.textContent = hasHeading
          ? `🧭 ${Math.round(currentHeading)}° → 🎯 ${Math.round(state.scanner.objectBearing)}° (${source})`
          : "🧭 aucune donnée de boussole";

        // While simulating and no real phone rotation is driving the search
        // (no live sensor category won the lock this frame), show a mini
        // heading dial right inside the scanner so the object can still be
        // found without leaving this fullscreen view to reach the Radar
        // tab's slider, which is hidden behind the scanner while it's open.
        const showSimHeadingControls = state.simulation.active && source === "simulation";
        arSimHeadingControlsEl.classList.toggle("hidden", !showSimHeadingControls);
        if (showSimHeadingControls) arSimHeadingLabelEl.textContent = Math.round(currentHeading) + "°";

        // The "found" button only unlocks once the object has actually been
        // spotted in frame (unless there's no camera/heading to search with
        // at all, handled by openScanner's catch and the !hasHeading case).
        setArFoundLocked(!inView);

        if (inView) {
          // Frozen on the very first frame the object is spotted: the video
          // is paused (its last frame stays on screen, like a photo) and the
          // search loop stops entirely, instead of continuing to redraw and
          // re-evaluate the heading every frame while the player decides
          // whether to tap "J'ai trouvé l'objet !". This makes the moment of
          // discovery unambiguous — a still, held frame with a clear next
          // step — rather than a constantly-live camera view where it isn't
          // obvious anything has actually been "found" yet.
          const justFroze = !state.scanner.frozen;
          if (justFroze) {
            state.scanner.frozen = true;
            arVideoEl.pause();
          }

          const gamma = state.tiltGamma || 0;
          const betaDelta = state.tiltBeta !== null && state.scanner.baselineBeta !== null
            ? state.tiltBeta - state.scanner.baselineBeta
            : 0;
          const bearingOffsetX = hasHeading ? (diff / halfFov) * maxOffset : 0;
          const tiltOffsetX = Math.max(-30, Math.min(30, -gamma * 1.2));
          const offsetY = Math.max(-50, Math.min(50, -betaDelta * 2));
          const bob = 0; // no more idle bobbing once captured -- the frame is held still

          const x = cx + bearingOffsetX + tiltOffsetX;
          const y = cy + offsetY + bob;

          arCtx.save();
          arCtx.shadowColor = obj.color;
          arCtx.shadowBlur = 35;
          arCtx.font = "72px 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
          arCtx.textAlign = "center";
          arCtx.textBaseline = "middle";
          arCtx.fillText(obj.emoji, x, y);
          arCtx.restore();

          arSearchHintEl.textContent = "📸 Objet capturé ! Appuie sur « J'ai trouvé l'objet ! »";
          arSearchHintEl.classList.remove("hidden");
        } else {
          const turnRight = diff > 0;
          const distance = Math.abs(diff);
          const arrow = turnRight ? "➡️" : "⬅️";
          const dirText = turnRight ? "Tourne à droite" : "Tourne à gauche";
          const tempText = distance < halfFov + 20 ? "tu chauffes !" : distance < 100 ? "tu te réchauffes…" : "c'est encore loin…";
          arSearchHintEl.textContent = `${arrow} ${dirText} — ${tempText}`;
          arSearchHintEl.classList.remove("hidden");
        }
      } catch (e) {
        // Never let an unexpected error silently freeze the loop (leaving the
        // player staring at nothing with no explanation) — surface it and
        // unlock the found button so the game can still continue.
        console.error("Erreur dans la boucle du scanner AR", e);
        arErrorEl.textContent = "Erreur du scanner (" + e.message + "). Tu peux quand même marquer la cache comme trouvée.";
        arErrorEl.classList.remove("hidden");
        setArFoundLocked(false);
      }

      // Once the object has been captured, the search loop itself stops
      // (no more requestAnimationFrame) so the held frame truly stays still
      // instead of continuing to redraw every frame for no purpose.
      if (!state.scanner.frozen) {
        state.scanner.rafId = requestAnimationFrame(frame);
      }
    }

    state.scanner.rafId = requestAnimationFrame(frame);
  }

  function closeScanner() {
    if (state.scanner.rafId) cancelAnimationFrame(state.scanner.rafId);
    if (state.scanner.stream) state.scanner.stream.getTracks().forEach((t) => t.stop());
    state.scanner = { stream: null, cacheId: null, rafId: null, baselineBeta: null, objectBearing: null, headingCategory: null, frozen: false };
    arVideoEl.pause();
    arVideoEl.srcObject = null;
    arScannerEl.classList.add("hidden");
    setArFoundLocked(false);
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
  // Without this, a tab/PWA instance left open from before a deploy keeps
  // running the old JS entirely from memory forever — the new service
  // worker installs and activates in the background (skipWaiting +
  // clients.claim already handle that), but nothing tells the already-
  // loaded page to actually pick it up. Reloading once when a new worker
  // takes control is what makes updates actually reach an open tab.
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch((e) => console.error("SW registration failed", e));
    });

    let swRefreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (swRefreshing) return;
      swRefreshing = true;
      window.location.reload();
    });
  }

  document.getElementById("checkUpdateBtn").addEventListener("click", async () => {
    if (!("serviceWorker" in navigator)) {
      alert("Ce navigateur ne supporte pas les mises à jour automatiques de l'app.");
      return;
    }
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      alert("Aucune version installée pour l'instant — recharge la page une première fois avec une connexion.");
      return;
    }
    await reg.update();
    alert("Vérification lancée. S'il y a une nouvelle version, l'app va se recharger automatiquement dans quelques secondes.");
  });

  // ---------- Init ----------
  renderCacheList();
  renderRadar();
  renderScenarioList();
  renderGmView();
  renderTrailList();
  renderScoreboard();
  renderSimulationView();
})();
