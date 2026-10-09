const CLE_STOCKAGE = "taches";

function obtenirStockage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function genererIdTache() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `tache-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function chargerTaches() {
  const stockage = obtenirStockage();
  if (!stockage) {
    return [];
  }

  try {
    const brut = stockage.getItem(CLE_STOCKAGE);
    const donnees = brut ? JSON.parse(brut) : [];
    return Array.isArray(donnees) ? donnees : [];
  } catch {
    return [];
  }
}

function sauvegarderTaches() {
  const stockage = obtenirStockage();
  if (!stockage) {
    return;
  }

  try {
    stockage.setItem(CLE_STOCKAGE, JSON.stringify(taches));
  } catch {
    // Ignorer les erreurs de stockage (ex. quota dépassé)
  }
}

let taches = chargerTaches();

export function obtenirTaches() {
  return [...taches];
}

export function ajouterTache(texte) {
  if (typeof texte !== "string") {
    return false;
  }

  const texteNettoye = texte.trim();
  if (texteNettoye === "") {
    return false;
  }

  taches.push({
    id: genererIdTache(),
    texte: texteNettoye,
    fait: false,
  });

  sauvegarderTaches();

  return true;
}

export function basculerTache(id) {
  const tache = taches.find((t) => t.id === id);
  if (tache) {
    tache.fait = !tache.fait;
    sauvegarderTaches();
  }
}

export function supprimerTache(id) {
  const index = taches.findIndex((t) => t.id === id);
  if (index !== -1) {
    taches.splice(index, 1);
    sauvegarderTaches();
  }
}
