// Banque de questions quiz, organisée par public + difficulté (même
// classification que les scénarios : enfants/adultes x Facile/Moyen/
// Difficile). Déclenchées quand une équipe trouve une cache liée à un
// scénario ou un trajet, pour gagner des points. Chaque question a 4
// choix, un seul correct. Pour ajouter des questions : complète le
// tableau correspondant à la case audience-difficulté ci-dessous.
const QUIZ_POINTS = { Facile: 5, Moyen: 10, Difficile: 15 };

const QUIZ_BANK = {
  "enfants-Facile": [
    { q: "Combien de pattes a une araignée ?", choices: ["6", "8", "4", "10"], correct: 1 },
    { q: "Quelle couleur obtient-on en mélangeant du bleu et du jaune ?", choices: ["Rouge", "Vert", "Orange", "Violet"], correct: 1 },
    { q: "Quel animal fait \"miaou\" ?", choices: ["Le chien", "Le chat", "La vache", "Le canard"], correct: 1 },
    { q: "Combien de jours y a-t-il dans une semaine ?", choices: ["5", "6", "7", "8"], correct: 2 },
    { q: "Combien de doigts as-tu sur une main ?", choices: ["4", "5", "6", "10"], correct: 1 },
    { q: "Quel est le contraire de \"grand\" ?", choices: ["Petit", "Rapide", "Fort", "Doux"], correct: 0 },
    { q: "Quel animal vit dans l'eau et a des nageoires ?", choices: ["Le chien", "Le poisson", "L'oiseau", "Le chat"], correct: 1 },
    { q: "Combien font 2 + 2 ?", choices: ["3", "4", "5", "6"], correct: 1 },
    { q: "Quelle saison vient juste après l'hiver ?", choices: ["L'été", "Le printemps", "L'automne", "La nuit"], correct: 1 },
    { q: "Quel fruit est jaune et allongé ?", choices: ["La pomme", "La banane", "La fraise", "Le raisin"], correct: 1 },
    { q: "Combien de roues a un vélo ?", choices: ["1", "2", "3", "4"], correct: 1 },
    { q: "Quel animal a une très longue trompe ?", choices: ["Le tigre", "L'éléphant", "Le singe", "Le lion"], correct: 1 },
  ],
  "enfants-Moyen": [
    { q: "Quelle est la capitale du Canada ?", choices: ["Toronto", "Ottawa", "Montréal", "Vancouver"], correct: 1 },
    { q: "Combien de continents y a-t-il sur Terre ?", choices: ["5", "6", "7", "8"], correct: 2 },
    { q: "Quelle est la planète la plus proche du soleil ?", choices: ["Vénus", "Mercure", "Mars", "Terre"], correct: 1 },
    { q: "Combien de côtés a un hexagone ?", choices: ["5", "6", "7", "8"], correct: 1 },
    { q: "Quel organe pompe le sang dans le corps ?", choices: ["Le cerveau", "Le cœur", "L'estomac", "Le poumon"], correct: 1 },
    { q: "Quel est le plus grand océan du monde ?", choices: ["Atlantique", "Indien", "Pacifique", "Arctique"], correct: 2 },
    { q: "Combien font 7 x 8 ?", choices: ["54", "56", "58", "64"], correct: 1 },
    { q: "Quel insecte produit du miel ?", choices: ["La fourmi", "L'abeille", "Le papillon", "La mouche"], correct: 1 },
    { q: "Quelle langue parle-t-on principalement en France ?", choices: ["L'anglais", "Le français", "L'espagnol", "L'italien"], correct: 1 },
    { q: "Combien de joueurs y a-t-il dans une équipe de soccer sur le terrain ?", choices: ["9", "10", "11", "12"], correct: 2 },
    { q: "Quel est le plus long fleuve du monde ?", choices: ["Le Nil", "L'Amazone", "Le Mississippi", "Le Danube"], correct: 0 },
    { q: "Quel est le plus grand mammifère terrestre ?", choices: ["Le rhinocéros", "L'éléphant", "La girafe", "L'hippopotame"], correct: 1 },
  ],
  "enfants-Difficile": [
    { q: "Un train roule à 60 km/h. Combien de kilomètres parcourt-il en 2 heures ?", choices: ["90", "100", "120", "150"], correct: 2 },
    { q: "Quel est le symbole chimique de l'eau ?", choices: ["H2O", "CO2", "O2", "NaCl"], correct: 0 },
    { q: "Combien de côtés a un dodécagone ?", choices: ["10", "11", "12", "13"], correct: 2 },
    { q: "Qui a formulé la théorie de la relativité ?", choices: ["Newton", "Einstein", "Galilée", "Darwin"], correct: 1 },
    { q: "Quelle est la racine carrée de 144 ?", choices: ["10", "11", "12", "13"], correct: 2 },
    { q: "Dans quel pays se trouve la tour Eiffel ?", choices: ["Italie", "France", "Espagne", "Allemagne"], correct: 1 },
    { q: "Combien de zéros y a-t-il dans un million (1 000 000) ?", choices: ["4", "5", "6", "7"], correct: 2 },
    { q: "Quel gaz les plantes absorbent-elles pour la photosynthèse ?", choices: ["Oxygène", "Azote", "Dioxyde de carbone", "Hydrogène"], correct: 2 },
    { q: "Si on est mercredi, quel jour sera-t-on dans 10 jours ?", choices: ["Lundi", "Mardi", "Vendredi", "Samedi"], correct: 3 },
    { q: "Quel est le plus petit nombre premier ?", choices: ["0", "1", "2", "3"], correct: 2 },
    { q: "Quelle planète est surnommée la \"planète rouge\" ?", choices: ["Vénus", "Mars", "Jupiter", "Saturne"], correct: 1 },
    { q: "Environ combien de temps la lumière du soleil met-elle à atteindre la Terre ?", choices: ["8 secondes", "8 minutes", "8 heures", "8 jours"], correct: 1 },
  ],
  "adultes-Facile": [
    { q: "Quelle est la capitale de l'Italie ?", choices: ["Milan", "Rome", "Venise", "Naples"], correct: 1 },
    { q: "En quelle année a eu lieu le premier pas sur la Lune ?", choices: ["1965", "1969", "1972", "1959"], correct: 1 },
    { q: "Combien de cordes a une guitare classique ?", choices: ["4", "5", "6", "7"], correct: 2 },
    { q: "Quel est le plus petit État du monde ?", choices: ["Monaco", "Vatican", "Luxembourg", "Malte"], correct: 1 },
    { q: "Qui a peint la Joconde ?", choices: ["Van Gogh", "Picasso", "Léonard de Vinci", "Michel-Ange"], correct: 2 },
    { q: "Quelle est la monnaie utilisée au Japon ?", choices: ["Le yuan", "Le yen", "Le won", "Le dong"], correct: 1 },
    { q: "Combien de jours compte une année bissextile ?", choices: ["364", "365", "366", "367"], correct: 2 },
    { q: "Quel est l'organe le plus étendu du corps humain ?", choices: ["Le foie", "La peau", "Le cœur", "Le cerveau"], correct: 1 },
    { q: "Quelle est la langue officielle du Brésil ?", choices: ["L'espagnol", "Le portugais", "Le français", "L'anglais"], correct: 1 },
    { q: "Combien de temps la Terre met-elle à faire le tour du soleil ?", choices: ["Un jour", "Un mois", "Une année", "Une décennie"], correct: 2 },
    { q: "Quel est le plus grand désert chaud du monde ?", choices: ["Gobi", "Sahara", "Kalahari", "Mojave"], correct: 1 },
    { q: "Quel instrument sert à mesurer la température ?", choices: ["Le baromètre", "Le thermomètre", "L'altimètre", "L'hygromètre"], correct: 1 },
  ],
  "adultes-Moyen": [
    { q: "Quel traité a officiellement mis fin à la Première Guerre mondiale ?", choices: ["Traité de Rome", "Traité de Versailles", "Traité de Paris", "Traité de Vienne"], correct: 1 },
    { q: "Quel élément chimique a pour symbole \"Fe\" ?", choices: ["Fluor", "Fer", "Francium", "Fermium"], correct: 1 },
    { q: "Qui a composé la 9e symphonie (\"Ode à la joie\") ?", choices: ["Mozart", "Bach", "Beethoven", "Chopin"], correct: 2 },
    { q: "Quelle est la plus haute montagne du monde ?", choices: ["K2", "Everest", "Kilimandjaro", "Mont Blanc"], correct: 1 },
    { q: "En quelle année le mur de Berlin est-il tombé ?", choices: ["1987", "1989", "1991", "1993"], correct: 1 },
    { q: "Quel pays a offert la statue de la Liberté aux États-Unis ?", choices: ["Le Royaume-Uni", "L'Espagne", "La France", "L'Italie"], correct: 2 },
    { q: "Quelle est l'unité de mesure de la puissance électrique ?", choices: ["Le volt", "L'ampère", "Le watt", "L'ohm"], correct: 2 },
    { q: "Quel océan sépare l'Europe de l'Amérique du Nord ?", choices: ["Pacifique", "Atlantique", "Indien", "Arctique"], correct: 1 },
    { q: "Qui a écrit le roman \"1984\" ?", choices: ["Aldous Huxley", "George Orwell", "Ray Bradbury", "H.G. Wells"], correct: 1 },
    { q: "Quelle planète possède les anneaux les plus visibles ?", choices: ["Jupiter", "Saturne", "Uranus", "Neptune"], correct: 1 },
    { q: "Comment appelle-t-on le passage de l'eau liquide à la vapeur ?", choices: ["Condensation", "Évaporation", "Solidification", "Fusion"], correct: 1 },
    { q: "Quelle ville est surnommée la \"Ville Lumière\" ?", choices: ["Londres", "Rome", "Paris", "New York"], correct: 2 },
  ],
  "adultes-Difficile": [
    { q: "Que signifie l'acronyme \"VPN\" ?", choices: ["Virtual Private Network", "Verified Personal Node", "Virtual Protected Node", "Very Private Network"], correct: 0 },
    { q: "Quel protocole assure le chiffrement des connexions HTTPS ?", choices: ["FTP", "SSH", "TLS", "SMTP"], correct: 2 },
    { q: "Combien de bits compose un octet ?", choices: ["4", "8", "16", "32"], correct: 1 },
    { q: "Quelle attaque consiste à intercepter une communication entre deux parties à leur insu ?", choices: ["Phishing", "Man-in-the-middle", "DDoS", "Brute force"], correct: 1 },
    { q: "Quel algorithme de hachage est aujourd'hui considéré comme cassé ?", choices: ["SHA-256", "MD5", "bcrypt", "AES"], correct: 1 },
    { q: "Que signifie l'acronyme \"DNS\" ?", choices: ["Domain Name System", "Digital Network Server", "Data Node Security", "Direct Name Service"], correct: 0 },
    { q: "En cybersécurité, que désigne une faille \"zero-day\" ?", choices: ["Une sauvegarde quotidienne", "Une faille inconnue et non corrigée", "Un mot de passe expiré", "Un pare-feu désactivé"], correct: 1 },
    { q: "Quel port réseau est habituellement utilisé par HTTPS ?", choices: ["21", "80", "443", "8080"], correct: 2 },
    { q: "Comment appelle-t-on la technique qui manipule une personne pour obtenir des informations confidentielles ?", choices: ["Cryptographie", "Ingénierie sociale", "Virtualisation", "Compression"], correct: 1 },
    { q: "Qui a théorisé la machine universelle, à la base de l'informatique moderne ?", choices: ["Alan Turing", "Ada Lovelace", "Claude Shannon", "John von Neumann"], correct: 0 },
    { q: "Quel type de logiciel malveillant chiffre les fichiers d'une victime contre rançon ?", choices: ["Ver", "Ransomware", "Cheval de Troie", "Rootkit"], correct: 1 },
    { q: "Que signifie l'acronyme \"GPS\" ?", choices: ["Global Positioning System", "General Public Service", "Geo Positioning Sensor", "Global Protocol System"], correct: 0 },
  ],
};

function quizBucketKey(audience, difficultyLabel) {
  return `${audience}-${difficultyLabel}`;
}

// Picks up to `count` questions from the audience+difficulty bucket,
// avoiding indices already used this game (tracked in `usedMap`, keyed by
// bucket). If the bucket has been exhausted, it wraps around rather than
// blocking the game. Returns null if the bucket doesn't exist at all.
function pickQuizQuestions(audience, difficultyLabel, count, usedMap) {
  const key = quizBucketKey(audience, difficultyLabel);
  const bank = QUIZ_BANK[key];
  if (!bank || bank.length === 0) return null;

  let used = usedMap[key] || [];
  let available = bank.map((_, i) => i).filter((i) => !used.includes(i));
  if (available.length < Math.min(count, bank.length)) {
    used = [];
    available = bank.map((_, i) => i);
  }

  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }

  const indices = available.slice(0, Math.min(count, bank.length));
  return { key, indices, questions: indices.map((i) => bank[i]) };
}
