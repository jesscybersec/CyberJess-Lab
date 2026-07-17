// Bibliothèque d'objets virtuels utilisables pour le "scan caméra" : à chaque
// checkpoint, un de ces objets peut être assigné. Il est ensuite dessiné en
// surimpression du flux caméra (voir openScanner dans app.js) — jamais un
// vrai rendu 3D ancré au décor, juste une forme flottante avec une légère
// parallaxe liée à l'orientation du téléphone.
const AR_OBJECTS = [
  { id: "orb", emoji: "🔮", label: "Orbe mystérieux", color: "#8a2be2" },
  { id: "ghost", emoji: "👻", label: "Fantôme facétieux", color: "#e8e8e8" },
  { id: "crystal", emoji: "💎", label: "Cristal scintillant", color: "#4cc9f0" },
  { id: "ufo", emoji: "🛸", label: "Soucoupe miniature", color: "#39ff14" },
  { id: "key", emoji: "🗝️", label: "Clé dorée", color: "#ffd166" },
  { id: "dice", emoji: "🎲", label: "Dé cosmique", color: "#ff6b6b" },
  { id: "coin", emoji: "🪙", label: "Pièce ancienne", color: "#ffb84d" },
  { id: "skull", emoji: "💀", label: "Crâne mystique", color: "#c9d1d9" },
  { id: "alien", emoji: "👾", label: "Alien pixelisé", color: "#39ff14" },
  { id: "fairy", emoji: "🧚", label: "Fée lumineuse", color: "#ffd6ec" },
];

function getArObject(id) {
  return AR_OBJECTS.find((o) => o.id === id) || null;
}
