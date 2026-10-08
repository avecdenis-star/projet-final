import "./style.css";
import { obtenirTaches, ajouterTache, basculerTache } from "./taskStore.js";
import { afficherTaches } from "./render.js";

const formulaire = document.querySelector("#formulaire-ajout");
const champNouvelleTache = document.querySelector("#champ-nouvelle-tache");
const messageErreur = document.querySelector("#message-erreur");
const conteneurListe = document.querySelector("#liste-taches");
const titreListe = document.querySelector("#titre-liste");

function rafraichirAffichage() {
  afficherTaches(obtenirTaches(), conteneurListe, titreListe);
}

formulaire.addEventListener("submit", (evenement) => {
  evenement.preventDefault();

  const succes = ajouterTache(champNouvelleTache.value);

  if (!succes) {
    messageErreur.textContent = "Le texte de la tâche ne peut pas être vide.";
    return;
  }

  messageErreur.textContent = "";
  champNouvelleTache.value = "";
  champNouvelleTache.focus();
  rafraichirAffichage();
});

conteneurListe.addEventListener("change", (evenement) => {
  if (evenement.target.matches('input[type="checkbox"]')) {
    const id = evenement.target.closest("li").dataset.id;
    basculerTache(id);
    rafraichirAffichage();
  }
});

rafraichirAffichage();
