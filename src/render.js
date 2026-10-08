export function afficherTaches(taches, conteneur, titre) {
  conteneur.innerHTML = "";
  titre.hidden = taches.length === 0;

  if (taches.length === 0) {
    const messageVide = document.createElement("li");
    messageVide.className = "message-vide";
    messageVide.textContent = "Aucune tâche en cours";
    conteneur.append(messageVide);
    return;
  }

  for (const tache of taches) {
    const li = document.createElement("li");
    li.dataset.fait = String(tache.fait);
    li.dataset.id = tache.id;

    const label = document.createElement("label");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = tache.fait;

    const span = document.createElement("span");
    span.textContent = tache.texte;

    label.append(checkbox, span);
    li.append(label);
    conteneur.append(li);
  }
}
