# El Proyecto Definitivo

RPG 2D urbano y surrealista, ejecutado completamente en el navegador y publicado con GitHub Pages.

## Jugar

- WASD / flechas: movimiento
- E / Enter: interactuar / confirmar
- Nueva partida: reinicia el registro del residente
- Estado persistente: `localStorage`

## Stack

- HTML + CSS + JavaScript
- Canvas 2D
- GitHub Pages
- sin framework ni backend
- sprites PNG reales para Nico y Vera
- render nearest-neighbor, sin antialiasing

## Sprites protagonistas

- `assets/sprites/nico_poses.png`
- `assets/sprites/vera_poses.png`

Ambos son sheets 4×4 de 16 poses. El renderer está en `character-style.js` y usa exclusivamente los dibujos aprobados; no reconstruye los protagonistas con primitivas.

La dirección visual completa está documentada en `docs/ART_STYLE.md`.

## Estructura principal

- `index.html`: shell del juego
- `style.css`: presentación del canvas y terminal
- `game.js`: mundo, movimiento, interacción y prólogo
- `selection-fix.js`: selección diegética del residente
- `character-style.js`: renderer de sprites de protagonista
- `assets/sprites/`: arte de runtime
- `docs/ART_STYLE.md`: contrato de dirección de arte

## GitHub Pages

`https://reallotex.github.io/elproyectodefinitivo/`