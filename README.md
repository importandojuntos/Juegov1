# Última Guerra: ¡Supervivencia! 🧟🪖

Un juego estilo **Last War: Survival Game** hecho con HTML, CSS y JavaScript puro.
Sin instalaciones, sin librerías: perfecto para aprender a programar en familia.

## 🎮 Cómo jugar

1. Abre el archivo `index.html` en cualquier navegador (doble clic y listo).
2. Mueve tu tropa con el **ratón**, el **dedo** (en móvil/tablet) o las **flechas ← →**.
3. Pasa por las puertas **AZULES** (`+3`, `x2`...) para ganar soldados.
4. Evita las puertas **ROJAS** (`-4`, `÷2`...) que te quitan soldados.
5. Tu tropa dispara sola: ¡destruye a los zombis antes de que te muerdan!
6. El **Sargento Patata 🥔** va contigo y lanza patatas explosivas que caen
   sobre el zombi más cercano y hacen daño en área. ¡BOOM!
7. Por el camino bajan **5 estrellas doradas ⭐**: recógelas todas para
   completar el nivel **PERFECTO** (mira tu colección debajo del marcador).
8. Pulsa la tecla **M** para silenciar o activar los sonidos.
9. Si te quedas sin soldados... 💀 ¡fin de la partida!
10. Al llegar a la meta del nivel suena la **canción de victoria**
    (¡tu-tu tu-ruuu tu-ruuuuuuuu! 🎺) y se desbloquea el siguiente.

## 🗺️ Los 6 niveles

| Nivel | Nombre | Qué te espera |
|-------|--------------------|----------------------------------------------|
| 0 | Entrenamiento | Solo zombis, para aprender. Sin jefes. |
| 1 | El Primer Jefe | Aparece el JEFE 👑 con sus mocos azules. |
| 2 | Los Dos Jefes | El JEFE... ¡y el MEGA JEFE con orejotas! |
| 3 | ¡Bombardeo! | Llegan los aviones ✈️ (sueltan 1 bomba). |
| 4 | Lluvia de Bombas | Aviones con 2 o 3 bombas + los dos jefes. |
| 5 | El Rey Zombi | 😈 SORPRESA: luna de sangre, zombis dorados velocísimos ¡y EL REY ZOMBI gigante que invoca zombis y escupe en abanico de 5! |

- Los jefes se plantan a pelear (6 segundos, el Rey 10) y escupen
  **mocos azules** que giran y culebrean. ¡Esquívalos!
- Las bombas de los aviones marcan una **X** donde van a caer y dejan
  **pozos** que bloquean el paso.
- Tu progreso se guarda: los niveles desbloqueados quedan disponibles
  en el selector aunque cierres el navegador.

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
- `cadenciaPatata: 30` → el Sargento Patata lanza sin parar.
- `radioExplosion: 200` → explosiones de patata GIGANTES.
- `duracionPelea: 720` → peleas de jefe de 12 segundos.
- `cadaCuantoEscupe: 15` → el jefe escupe mocos como una metralleta.
- `danoMoco: 5` → cada moco te quita 5 soldados, ¡mucho más peligroso!
- `cadaCuantoAvion: 300` → ¡lluvia de aviones bombarderos!
- `radioPozo: 90` → cráteres enormes que obligan a maniobrar.

Y un poco más abajo está la lista `NIVELES`: ahí podéis cambiar la meta
de puntos de cada nivel, cuándo aparece cada jefe, cuántas bombas traen
los aviones... ¡o inventar un **nivel 6** entero añadiendo una línea!

### Retos de programación (de fácil a difícil)

1. **Fácil:** cambia el color de los soldados (busca `#4da6ff` en `game.js`).
2. **Fácil:** inventa una puerta nueva, por ejemplo `["+10", (n) => n + 10]`.
3. **Fácil:** cambia los sonidos en la sección `sonidos` de `game.js`
   (sube o baja los números de frecuencia y escucha qué pasa).
4. **Medio:** haz que los jefes den 1000 puntos en vez de 500.
5. **Medio:** añade una puerta dorada muy rara que haga `x3`.
6. **Medio:** haz que el Sargento Patata lance 3 patatas a la vez.
7. **Difícil:** crea un power-up que caiga y dé disparos dobles unos segundos.
8. **Difícil:** añade un segundo sargento a la izquierda de la tropa.

## 📜 Historial de versiones

Todos los cambios del juego están apuntados en [VERSIONES.md](VERSIONES.md).
Si una versión nueva no os gusta, ahí explica cómo **volver atrás** a
cualquier versión anterior con un solo comando.

## 🔊 ¿Cómo suenan los sonidos sin archivos mp3?

El juego usa la **Web Audio API** del navegador: en vez de reproducir
archivos, genera las ondas de sonido con matemáticas en el momento.
La función `pitido()` crea una nota (frecuencia alta = aguda, baja = grave)
y la función `ruido()` crea estática para las explosiones. ¡Mirad la
sección SONIDOS de `game.js` y experimentad!

## 🧠 Ideas de cómo funciona (para explicárselo)

- El juego es un **bucle** que se repite 60 veces por segundo:
  primero **actualiza** (mueve todo) y luego **dibuja** (pinta todo).
- Cada bala, zombi y puerta es un **objeto** guardado en una **lista**.
- Para saber si una bala toca a un zombi se mide la **distancia** entre
  ambos (¡el teorema de Pitágoras en acción!).

¡A divertirse! 🚀
