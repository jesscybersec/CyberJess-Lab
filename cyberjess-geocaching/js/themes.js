// Palette d'ambiances visuelles : une par scénario/trajet, plus un thème
// "Explorateur" neutre par défaut. L'app entière (couleurs, texture de fond)
// s'adapte à l'aventure actuellement ciblée sur le radar — purement via
// CSS custom properties + classes, sans image ni police externe.
const THEMES = {
  explorer: {
    emoji: "🧭",
    label: "Explorateur",
    accent: "#d4a24c",
    accentDim: "#8a6a2f",
    bg: "#10181a",
    bgPanel: "#172224",
    pattern: "contours",
  },
  fairy: {
    emoji: "🧚",
    label: "Jardin enchanté",
    accent: "#ff9ecb",
    accentDim: "#a85f80",
    bg: "#1c1730",
    bgPanel: "#271f42",
    pattern: "sparkles",
  },
  pirates: {
    emoji: "🏴‍☠️",
    label: "Pirates",
    accent: "#e8b923",
    accentDim: "#8f6f10",
    bg: "#0d1b2a",
    bgPanel: "#142b40",
    pattern: "waves",
  },
  forest: {
    emoji: "🌲",
    label: "Forêt mystérieuse",
    accent: "#7ee081",
    accentDim: "#3f7d43",
    bg: "#0e1a12",
    bgPanel: "#16261a",
    pattern: "leaves",
  },
  heritage: {
    emoji: "🏛️",
    label: "Vintage",
    accent: "#c9a15a",
    accentDim: "#7d6535",
    bg: "#201812",
    bgPanel: "#2b2018",
    pattern: "paper",
  },
  spy: {
    emoji: "🕵️",
    label: "Espionnage",
    accent: "#e0413a",
    accentDim: "#8a2a26",
    bg: "#16161a",
    bgPanel: "#201f24",
    pattern: "redacted",
  },
  ghost: {
    emoji: "📡",
    label: "Protocole Fantôme",
    accent: "#39ff14",
    accentDim: "#1f8a0c",
    bg: "#060a06",
    bgPanel: "#0c140c",
    pattern: "circuit",
  },
};

function getTheme(id) {
  return THEMES[id] || THEMES.explorer;
}
