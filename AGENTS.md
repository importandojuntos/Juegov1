# Importando Juntos — Juegos

Colección de juegos web hechos en familia. Es un sitio **100% estático** (HTML + CSS + JavaScript vanilla, sin bundler ni dependencias) desplegado a GitHub Pages (ver `.github/workflows/deploy-pages.yml`, que sube todo el directorio raíz).

Juego principal: **El Comandante Patata** (`index.html` + `css/style.css` + `js/game.js`), un shooter cooperativo sobre `<canvas>`.

## Cursor Cloud specific instructions

- No hay gestor de paquetes, build, tests ni linter configurados. No existe `package.json`. No corras `npm install` / `pnpm` / etc.
- Para desarrollar/probar hay que servir los archivos por HTTP (los `fetch`/rutas relativas y algunas cosas del navegador no funcionan bien con `file://`). Servidor de dev recomendado:
  - `python3 -m http.server 8000` desde la raíz del repo, luego abrir `http://localhost:8000/`.
- Entradas útiles: `/` (juego principal V1), `/comandante-patata.html`, `/Juegos/PataMati2/` (variante V2).
- El juego se controla por teclado: Jugador 1 `WASD` + `Espacio`; Jugador 2 (Mati) flechas + `Enter`. El foco debe estar en el canvas/página.
- "Lint"/validación rápida disponible sin dependencias: `node --check js/game.js` (chequeo de sintaxis de JS).
- La fuente Google Fonts (Fredoka) se carga desde CDN; sin red externa la tipografía cae a la del sistema, pero el juego funciona igual.
