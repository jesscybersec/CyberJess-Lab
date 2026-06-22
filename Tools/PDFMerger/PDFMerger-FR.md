# PDF Merger — Documentation française

[🏠 Accueil](README.md) · [🇬🇧 Read in English](PDFMerger-EN.md)

```diff
+ Fusion locale de PDF
+ Réorganisation par glisser-déposer
+ OCR et signets facultatifs
- Aucun document envoyé vers un service tiers
```

## Présentation

PDF Merger est une application web locale construite avec Python et
Streamlit. Elle a été créée pour regrouper des notes de cybersécurité, des
laboratoires, de la documentation technique, des articles de recherche et
d'autres grandes collections de PDF sans les téléverser vers un service en
ligne.

```text
VOS PDF → TRAITEMENT LOCAL → DOCUMENT CONSULTABLE
              │
              └── aucun téléversement externe
```

## Fonctionnalités

### Fusion de PDF

- Fusionner plusieurs fichiers PDF en un seul document.
- Traiter de grandes collections avec les ressources de la machine locale.
- Télécharger directement le document final depuis l'interface.
- Suivre l'opération grâce à une barre de progression.

### Deux modes d'entrée

**Mode téléversement**

- Sélectionner plusieurs fichiers depuis l'interface Streamlit.
- Ajouter des documents pendant la session en cours.

**Mode dossier local**

- Charger tous les PDF présents dans un répertoire local.
- Analyser facultativement les sous-répertoires.
- Traiter efficacement des dépôts de notes structurés.

```text
CyberNotes/
├── Blue-Team/
├── Detection-Engineering/
├── Malware-Analysis/
├── Pentest/
└── Research/
```

### Réorganisation interactive

Les fichiers peuvent être réorganisés par glisser-déposer avant le début de
la fusion. L'ordre affiché devient celui du document final.

### Signets PDF

Des signets facultatifs peuvent être générés à partir des noms de fichiers :

```text
PDF fusionné
├── Notes Blue Team
├── Laboratoires Detection Engineering
├── Analyse de logiciels malveillants
└── Cahier Pentest
```

### OCR

OCRmyPDF et Tesseract peuvent rendre les documents numérisés consultables par
recherche textuelle avant leur fusion.

Langues prises en charge par la configuration actuelle :

- anglais : `eng`;
- français : `fra`.

L'OCR peut également faire pivoter et redresser les pages numérisées. Le
temps de traitement dépend du nombre, de la résolution et de la complexité
des documents.

### Noms de fichiers identiques

Chaque entrée reçoit un identifiant interne unique. Plusieurs fichiers nommés
`Notes.pdf` et provenant de dossiers différents peuvent donc coexister sans
collision.

> [!NOTE]
> La prise en charge de noms identiques n'est pas une détection de doublons
> basée sur le contenu. Le calcul d'empreintes SHA-256 est prévu pour
> reconnaître les fichiers strictement identiques.

## Confidentialité et sécurité

| Propriété | PDF Merger | Outil en ligne typique |
| --- | :---: | :---: |
| Traitement local | ✅ | ❌ |
| Téléversement vers un tiers | ❌ | ✅ |
| Compte requis | ❌ | Parfois |
| Fonctionnement hors ligne | ✅ | ❌ |
| Code source inspectable | ✅ | Rarement |
| Limites imposées par un fournisseur | ❌ | Souvent |

Les limites pratiques dépendent de la mémoire, du stockage et de la puissance
de traitement de la machine locale.

> [!WARNING]
> Un fichier PDF peut être malformé ou malveillant. Exécutez l'application
> avec un compte non privilégié, maintenez les dépendances à jour et
> n'exposez le mode dossier local qu'à des utilisateurs de confiance.

Pour un usage strictement local, liez Streamlit à l'interface de bouclage :

```bash
streamlit run PDFMerger.py \
  --server.address 127.0.0.1 \
  --server.port 8501
```

## Pile technologique

| Composant | Rôle |
| --- | --- |
| Python | logique applicative |
| Streamlit | interface web locale |
| pypdf | lecture, fusion et signets PDF |
| streamlit-sortables | ordre par glisser-déposer |
| OCRmyPDF | traitement OCR et optimisation |
| Tesseract OCR | reconnaissance de caractères |

## Installation

### Prérequis

- Kali Linux, Debian ou une distribution Linux compatible
- Python 3.10 ou une version plus récente
- modules linguistiques Tesseract nécessaires à l'OCR

### Installation automatisée

```bash
git clone https://github.com/jesscybersec/CyberJess-Lab.git
cd CyberJess-Lab/Tools/PDFMerger
chmod +x install_kali.sh
./install_kali.sh
```

### Installation manuelle

```bash
sudo apt update
sudo apt install -y \
  python3-full \
  python3-venv \
  ocrmypdf \
  tesseract-ocr \
  tesseract-ocr-eng \
  tesseract-ocr-fra

python3 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

### Lancer l'application

```bash
source venv/bin/activate
streamlit run PDFMerger.py
```

## Structure attendue du projet

```text
PDFMerger/
├── PDFMerger.py
├── requirements.txt
├── install_kali.sh
├── README.md
├── PDFMerger-EN.md
└── PDFMerger-FR.md
```

## Feuille de route

- détection de doublons par SHA-256;
- validation renforcée des PDF;
- prévisualisation et retrait de fichiers avant la fusion;
- gestion des PDF chiffrés et corrompus;
- sélection et extraction de pages;
- séparation et compression de PDF;
- modification des métadonnées;
- table des matières automatique;
- indexation plein texte locale;
- assistant RAG local;
- déploiement Docker sans privilèges;
- corpus de tests automatisés.

## Idées de laboratoires orientés sécurité

- Mesurer la consommation de mémoire avec 10, 100 et 500 PDF.
- Tester des documents valides, chiffrés, malformés et numérisés.
- Comparer la précision et la durée de l'OCR selon les langues.
- Ajouter des journaux structurés sans enregistrer le contenu des documents.
- Construire un threat model pour les déploiements locaux et réseau.

## Conclusion

PDF Merger repose sur un principe simple : un document ne devrait pas avoir à
quitter votre ordinateur uniquement pour être réorganisé.

L'interface reste accessible, le processus demeure inspectable et les données
restent là où elles doivent être.

```text
[ FUSION TERMINÉE ]
[ EXPOSITION AU CLOUD : 0 ]
[ MODE CONFIDENTIALITÉ : ACTIF ]
```

---

[🏠 Retour à l'accueil](README.md) ·
[🇬🇧 Read in English](PDFMerger-EN.md)
