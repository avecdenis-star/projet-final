# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Gestionnaire de tâches local : Vite + JavaScript natif (pas de framework), interface en français (noms de variables, fonctions et id DOM en français — rester cohérent avec cette convention).

## Commands

```bash
npm run dev       # serveur de dev Vite (port 5173 par défaut)
npm run build     # build de production dans dist/
npm run preview   # sert le build de production localement
npm test          # tests unitaires (node:test, aucune dépendance)
node --test --test-name-pattern="basculerTache" "tests/**/*.test.js"   # un seul groupe de tests
```

Tests live in `tests/*.test.js` and run on Node's built-in `node:test` runner (no browser, no extra dependency). They cover `taskStore.js` only: `localStorage` is replaced by an in-memory fake, and since the store initializes its state at module load, each test re-imports it with a unique query string (`?instance=N`) to get a fresh instance. No lint script is configured.

**WSL gotcha**: in this environment, `npm`/`node` resolved from `PATH` may point to the Windows binaries under `/mnt/c/...`, which fail (`CMD.EXE` can't handle the WSL UNC path). Use a Linux-native Node instead (e.g. the one under `~/.nvm/versions/node/<version>/bin`), prepended to `PATH`, before running any `npm` command.

When starting the dev server to verify changes, check for an already-running instance first (`lsof -i :5173`) — Vite auto-increments to the next free port (5174, ...) if 5173 is taken, which silently produces a second, redundant server instead of failing.

## Architecture

Three modules, strictly separated by responsibility, wired together only in `main.js`:

- **`src/taskStore.js`** — state + business logic. Owns the sole source of truth: a module-private `taches` array (never exported directly). Exposes a minimal API: `obtenirTaches()`, `ajouterTache(texte)`, `basculerTache(id)`. All mutation and validation (trimming, rejecting empty text) happens here.
- **`src/render.js`** — pure view. `afficherTaches(taches, conteneur, titre)` wipes and rebuilds the `<ul>` from scratch on every call (full re-render, not a diff); it also toggles the `#titre-liste` heading's `hidden` state and swaps in an empty-state message when `taches` is empty. It has no knowledge of business logic or persistence.
- **`src/main.js`** — controller. Wires DOM events (form `submit`, checkbox `change` via delegation on the list container) to store calls, then calls a local `rafraichirAffichage()` that re-fetches `obtenirTaches()` and re-renders. There is no fine-grained state diffing: any mutation is followed by a full `obtenirTaches()` + `afficherTaches()` pass.

**Persistence** lives entirely inside `taskStore.js`, behind the same public API — `main.js` and `render.js` have zero knowledge of it. On module load, `taches` is initialized from `localStorage` (key `"taches"`, JSON-encoded, with a try/catch fallback to `[]` on missing/corrupt data). After every mutation (`ajouterTache`, `basculerTache`), the full array is re-serialized and written back. Any future change to the storage backend (e.g. swapping `localStorage` for a server API) should stay confined to `taskStore.js`.

When adding a new piece of UI state that depends on the task list (like the conditional `#titre-liste` title), follow the existing pattern: compute it inside `render.js` from the `taches` array passed in, not from a separate flag threaded through `main.js`.
