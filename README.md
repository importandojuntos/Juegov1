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
7. **Misión del Nivel 1:** llega a **6.000 puntos** (mira la barra amarilla
   de arriba). Por el camino te esperan **2 jefes**:
   - **El JEFE** 👑 (a los 2.500 puntos): se planta 6 segundos y escupe
     mocos azules que persiguen a tu tropa. ¡Esquívalos!
   - **El MEGA JEFE** (a los 4.500 puntos): el doble de grande, con
     orejotas que se menean, y escupe el doble de rápido y en abanico
     de 3 mocos. Vale 1.000 puntos si lo derrotas.
8. De vez en cuando suena una **alerta aérea ✈️** (el cartel parpadea y
   una flecha indica por dónde vendrá): un avión enemigo cruza el cielo
   soltando **bombas**. Cada bomba marca una **X** donde va a caer, hace
   daño si te pilla cerca, ¡y deja un **pozo** que bloquea el paso!
9. Pulsa la tecla **M** para silenciar o activar los sonidos.
10. Si te quedas sin soldados... 💀 ¡fin de la partida!
11. Al llegar a la meta suena la **canción de victoria**: ¡tu-tu tu-ruuu
    tu-ruuuuuuuu! 🎺

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
- `metaNivel: 2000` → un nivel cortito para probar rápido.
- `jefe1Puntos: 500` → el primer jefe aparece casi al empezar.
- `cadaCuantoAvion: 300` → ¡lluvia de aviones bombarderos!
- `bombasPorAvion: 8` → cada avión deja el camino lleno de pozos.
- `radioPozo: 90` → cráteres enormes que obligan a maniobrar.

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
