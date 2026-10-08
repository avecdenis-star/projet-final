const CLE_STOCKAGE = "taches";

function chargerTaches() {
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE);
    return brut ? JSON.parse(brut) : [];
  } catch {
    return [];
  }
}

function sauvegarderTaches() {
  localStorage.setItem(CLE_STOCKAGE, JSON.stringify(taches));
}

let taches = chargerTaches();

export function obtenirTaches() {
  return taches;
}

export function ajouterTache(texte) {
  const texteNettoye = texte.trim();
  if (texteNettoye === "") {
    return false;
  }

  taches.push({
    id: crypto.randomUUID(),
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
