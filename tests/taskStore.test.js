import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

// taskStore.js lit/écrit `taches` dans une variable de module initialisée une
// seule fois au chargement (`let taches = chargerTaches()`). Pour obtenir un
// état frais à chaque test, on réimporte le module avec une query string
// différente : Node traite chaque URL de module comme une instance séparée.
let compteurImport = 0;
async function importerTaskStoreFrais() {
  compteurImport += 1;
  return import(`../src/taskStore.js?instance=${compteurImport}`);
}

function creerFauxLocalStorage() {
  const magasin = new Map();
  return {
    getItem(cle) {
      return magasin.has(cle) ? magasin.get(cle) : null;
    },
    setItem(cle, valeur) {
      magasin.set(cle, String(valeur));
    },
    removeItem(cle) {
      magasin.delete(cle);
    },
    clear() {
      magasin.clear();
    },
  };
}

let localStorageOriginal;

beforeEach(() => {
  localStorageOriginal = globalThis.localStorage;
  globalThis.localStorage = creerFauxLocalStorage();
});

afterEach(() => {
  globalThis.localStorage = localStorageOriginal;
});

describe("taskStore - chargement initial / obtenirTaches", () => {
  test("retourne un tableau vide quand localStorage ne contient rien", async () => {
    const { obtenirTaches } = await importerTaskStoreFrais();
    assert.deepEqual(obtenirTaches(), []);
  });

  test("charge les taches existantes depuis localStorage au chargement du module", async () => {
    globalThis.localStorage.setItem(
      "taches",
      JSON.stringify([{ id: "1", texte: "Faire les courses", fait: false }])
    );
    const { obtenirTaches } = await importerTaskStoreFrais();
    assert.deepEqual(obtenirTaches(), [
      { id: "1", texte: "Faire les courses", fait: false },
    ]);
  });

  test("retourne un tableau vide si le contenu de localStorage est du JSON invalide", async () => {
    globalThis.localStorage.setItem("taches", "{ceci n'est pas du JSON");
    const { obtenirTaches } = await importerTaskStoreFrais();
    assert.deepEqual(obtenirTaches(), []);
  });
});

describe("taskStore - ajouterTache", () => {
  test("ajoute une tache avec un texte valide et retourne true", async () => {
    const { ajouterTache, obtenirTaches } = await importerTaskStoreFrais();

    const resultat = ajouterTache("Acheter du pain");

    assert.equal(resultat, true);
    const taches = obtenirTaches();
    assert.equal(taches.length, 1);
    assert.equal(taches[0].texte, "Acheter du pain");
    assert.equal(taches[0].fait, false);
    assert.equal(typeof taches[0].id, "string");
    assert.ok(taches[0].id.length > 0);
  });

  test("rejette un texte vide et retourne false sans modifier la liste", async () => {
    const { ajouterTache, obtenirTaches } = await importerTaskStoreFrais();

    const resultat = ajouterTache("");

    assert.equal(resultat, false);
    assert.deepEqual(obtenirTaches(), []);
  });

  test("rejette un texte composé uniquement d'espaces", async () => {
    const { ajouterTache, obtenirTaches } = await importerTaskStoreFrais();

    const resultat = ajouterTache("    ");

    assert.equal(resultat, false);
    assert.deepEqual(obtenirTaches(), []);
  });

  test("nettoie (trim) le texte avant de l'enregistrer", async () => {
    const { ajouterTache, obtenirTaches } = await importerTaskStoreFrais();

    ajouterTache("  Nettoyer la maison  ");

    assert.equal(obtenirTaches()[0].texte, "Nettoyer la maison");
  });

  test("génère des id distincts pour deux taches ajoutées successivement", async () => {
    const { ajouterTache, obtenirTaches } = await importerTaskStoreFrais();

    ajouterTache("Premiere tache");
    ajouterTache("Deuxieme tache");

    const [premiere, deuxieme] = obtenirTaches();
    assert.notEqual(premiere.id, deuxieme.id);
  });
});

describe("taskStore - basculerTache", () => {
  test("bascule l'état fait de false à true pour un id existant", async () => {
    const { ajouterTache, obtenirTaches, basculerTache } =
      await importerTaskStoreFrais();
    ajouterTache("Tache test");
    const { id } = obtenirTaches()[0];

    basculerTache(id);

    assert.equal(obtenirTaches()[0].fait, true);
  });

  test("bascule à nouveau à false si on appelle basculerTache deux fois", async () => {
    const { ajouterTache, obtenirTaches, basculerTache } =
      await importerTaskStoreFrais();
    ajouterTache("Tache test");
    const { id } = obtenirTaches()[0];

    basculerTache(id);
    basculerTache(id);

    assert.equal(obtenirTaches()[0].fait, false);
  });

  test("ne modifie rien si l'id n'existe pas", async () => {
    const { ajouterTache, obtenirTaches, basculerTache } =
      await importerTaskStoreFrais();
    ajouterTache("Tache test");

    basculerTache("id-inexistant");

    assert.equal(obtenirTaches()[0].fait, false);
    assert.equal(obtenirTaches().length, 1);
  });
});

describe("taskStore - supprimerTache", () => {
  test("retire la tâche correspondant à l'id", async () => {
    const { ajouterTache, obtenirTaches, supprimerTache } =
      await importerTaskStoreFrais();
    ajouterTache("Tache A");
    ajouterTache("Tache B");
    const { id } = obtenirTaches()[0];

    supprimerTache(id);

    assert.equal(obtenirTaches().length, 1);
    assert.equal(obtenirTaches()[0].texte, "Tache B");
  });

  test("ne modifie rien si l'id n'existe pas", async () => {
    const { ajouterTache, obtenirTaches, supprimerTache } =
      await importerTaskStoreFrais();
    ajouterTache("Tache test");

    supprimerTache("id-inexistant");

    assert.equal(obtenirTaches().length, 1);
  });

  test("persiste la suppression dans localStorage", async () => {
    const { ajouterTache, obtenirTaches, supprimerTache } =
      await importerTaskStoreFrais();
    ajouterTache("Tache test");
    const { id } = obtenirTaches()[0];

    supprimerTache(id);

    const sauvegarde = JSON.parse(globalThis.localStorage.getItem("taches"));
    assert.deepEqual(sauvegarde, []);
  });
});

describe("taskStore - persistance (localStorage)", () => {
  test("ajouterTache écrit la liste complète des taches dans localStorage", async () => {
    const { ajouterTache } = await importerTaskStoreFrais();

    ajouterTache("Laver la voiture");

    const sauvegarde = JSON.parse(globalThis.localStorage.getItem("taches"));
    assert.equal(sauvegarde.length, 1);
    assert.equal(sauvegarde[0].texte, "Laver la voiture");
    assert.equal(sauvegarde[0].fait, false);
  });

  test("ajouterTache avec un texte invalide n'écrit pas dans localStorage", async () => {
    const { ajouterTache } = await importerTaskStoreFrais();

    ajouterTache("   ");

    assert.equal(globalThis.localStorage.getItem("taches"), null);
  });

  test("basculerTache persiste le nouvel état dans localStorage", async () => {
    const { ajouterTache, obtenirTaches, basculerTache } =
      await importerTaskStoreFrais();
    ajouterTache("Tache test");
    const { id } = obtenirTaches()[0];

    basculerTache(id);

    const sauvegarde = JSON.parse(globalThis.localStorage.getItem("taches"));
    assert.equal(sauvegarde[0].fait, true);
  });

  test("une nouvelle instance du module relit l'état précédemment sauvegardé", async () => {
    const premiereInstance = await importerTaskStoreFrais();
    premiereInstance.ajouterTache("Tache persistante");

    const deuxiemeInstance = await importerTaskStoreFrais();

    assert.equal(deuxiemeInstance.obtenirTaches().length, 1);
    assert.equal(
      deuxiemeInstance.obtenirTaches()[0].texte,
      "Tache persistante"
    );
  });
});
