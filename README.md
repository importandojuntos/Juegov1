# Última Guerra: ¡Supervivencia! 🧟🪖

Un juego estilo **Last War: Survival Game** hecho con HTML, CSS y JavaScript puro.
Sin instalaciones, sin librerías: perfecto para aprender a programar en familia.

## 🎮 Cómo jugar

1. Abre el archivo `index.html` en cualquier navegador (doble clic y listo).
2. Mueve tu tropa con el **ratón**, el **dedo** (en móvil/tablet) o las **flechas ← →**.
3. Pasa por las puertas **AZULES** (`+3`, `x2`...) para ganar soldados.
4. Evita las puertas **ROJAS** (`-4`, `÷2`...) que te quitan soldados.
5. Tu tropa dispara sola: ¡destruye a los zombis antes de que te muerdan!
6. Cuidado con los **JEFES** morados: aguantan muchos disparos y muerden fuerte.
7. Si te quedas sin soldados... 💀 ¡fin de la partida!

También puedes jugarlo con un mini-servidor local (opcional):

```bash
# desde la carpeta del proyecto
python3 -m http.server 8000
# y abre http://localhost:8000 en el navegador
```

## 📁 Los 3 archivos del juego

| Archivo      | Qué hace                                                        |
|--------------|-----------------------------------------------------------------|
| `index.html` | El esqueleto: el lienzo del juego y las pantallas de menú       |
| `style.css`  | El aspecto: colores, botones, tipografías                       |
| `game.js`    | El cerebro: toda la lógica del juego, comentada paso a paso     |

## 🧪 Experimentos para hacer con tu hijo

Al principio de `game.js` hay una sección llamada `AJUSTES`. Cambiad los
números, guardad y recargad el navegador (F5) para ver qué pasa:

- `soldadosIniciales: 20` → ¿empezar con un ejército enorme lo hace muy fácil?
- `cadenciaDisparo: 5` → ¡modo ametralladora!
- `velocidadMundo: 5` → modo turbo, mucho más difícil.
- `vidaJefe: 100` → jefes casi indestructibles.

### Retos de programación (de fácil a difícil)

1. **Fácil:** cambia el color de los soldados (busca `#4da6ff` en `game.js`).
2. **Fácil:** inventa una puerta nueva, por ejemplo `["+10", (n) => n + 10]`.
3. **Medio:** haz que los jefes den 1000 puntos en vez de 500.
4. **Medio:** añade una puerta dorada muy rara que haga `x3`.
5. **Difícil:** añade sonidos con `new Audio("disparo.mp3").play()`.
6. **Difícil:** crea un power-up que caiga y dé disparos dobles unos segundos.

## 🧠 Ideas de cómo funciona (para explicárselo)

- El juego es un **bucle** que se repite 60 veces por segundo:
  primero **actualiza** (mueve todo) y luego **dibuja** (pinta todo).
- Cada bala, zombi y puerta es un **objeto** guardado en una **lista**.
- Para saber si una bala toca a un zombi se mide la **distancia** entre
  ambos (¡el teorema de Pitágoras en acción!).

¡A divertirse! 🚀
