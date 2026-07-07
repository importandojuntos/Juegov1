# 📜 Historial de versiones

Aquí apuntamos todo lo que cambia el juego en cada versión. Si algo
nuevo no nos gusta, ¡podemos volver a la versión anterior!

## Las versiones (de la más nueva a la más vieja)

### v1.5 — ¡6 niveles y el Rey Zombi! 🗺️👑
- El juego ahora tiene 6 niveles con selector en el menú (los no
  desbloqueados salen con candado 🔒 y el progreso se guarda):
  - Nivel 0 "Entrenamiento": sin jefes.
  - Nivel 1 "El Primer Jefe": solo el JEFE.
  - Nivel 2 "Los Dos Jefes": JEFE + MEGA JEFE.
  - Nivel 3 "¡Bombardeo!": aviones con 1 bomba.
  - Nivel 4 "Lluvia de Bombas": aviones con 2 o 3 bombas.
  - Nivel 5 "El Rey Zombi": la sorpresa — luna de sangre, zombis
    dorados súper rápidos (valen 200 puntos) y EL REY ZOMBI: gigante,
    rojo, con corona enorme, pelea 10 segundos, escupe en abanico
    de 5 e invoca zombis gritando "¡A MÍ, ZOMBIS!".
- Al ganar un nivel, el botón te lleva directo al siguiente.
- Botón "🔊 Probar sonido" en el menú y aviso en pantalla si el juego
  está silenciado con la tecla M.

### v1.4 — Estrellas coleccionables ⭐
- Bajan 5 estrellas doradas por el camino durante el nivel.
- Si las juntas todas, completas el nivel **PERFECTO** (se ve en la
  pantalla de victoria: ⭐⭐⭐⭐⭐).
- Contador de estrellas debajo del marcador, sonido brillante al
  recogerlas y +100 puntos cada una.
- Este archivo de versiones.

### v1.3 — Aviones bombarderos y ajustes de ritmo ✈️
- Alerta aérea con cartel parpadeante y flecha que avisa por dónde
  vendrá el avión (con doble pitido de sirena).
- Aviones que cruzan el cielo y sueltan bombas (marcan una X donde
  van a caer, con silbido de caída).
- Las bombas dejan **pozos** que bloquean el paso de la tropa.
- Los mocos del jefe ahora **giran** y **culebrean** (ya no van rectos),
  y el MEGA JEFE escupe menos (era demasiado difícil).
- El juego acelera más despacio y hay más distancia entre puertas.
- Los jefes tienen mucha más vida y llegan con **escudo** (no reciben
  daño hasta que empieza su pelea).
- Canción de victoria de 3 segundos: ¡tu-tu tu-ruuu tu-ruuuuuuuu! 🎺

### v1.2 — Nivel 1 con meta, jefes y mejor diseño 👑
- Meta del nivel: 6.000 puntos, con barra de progreso arriba.
- Dos jefes programados: el JEFE (a los 2.500 puntos) y el MEGA JEFE
  (a los 4.500), el doble de grande, con orejotas que se menean.
- Pelea de jefe: se plantan 6 segundos y escupen mocos azules.
- Pantalla de victoria al completar el nivel.
- Mejor diseño: fondo con degradado, puertas de neón redondeadas,
  zombis con brazos y ojos brillantes, soldados con fusil.
- Más distancia entre filas de puertas.

### v1.1 — Sonidos y Sargento Patata 🥔
- Sonidos generados con código (Web Audio API, sin archivos mp3):
  disparos, explosiones, puertas, mordiscos... Tecla M para silenciar.
- El Sargento Patata: acompaña a la tropa y lanza patatas explosivas
  en parábola contra el zombi más cercano, con daño en área.

### v1.0 — El juego base 🎮
- La tropa se mueve con ratón, dedo o flechas y dispara sola.
- Puertas azules que suman soldados y rojas que restan.
- Zombis con barra de vida y jefes morados aleatorios.
- Puntos, récord guardado en el navegador, partículas y explosiones.

## ⏪ ¿Cómo volvemos a una versión anterior?

Cada versión tiene una **etiqueta** en git. Para probar una versión
vieja (por ejemplo la v1.2), desde la carpeta del juego:

```bash
git checkout v1.2
```

Abres `index.html` y juegas esa versión. Para volver a la más nueva:

```bash
git checkout cursor/juego-last-war-7da9
```

Y si queréis ver qué cambió exactamente entre dos versiones:

```bash
git diff v1.2 v1.3
```

> Truco: `git tag` muestra la lista de todas las versiones disponibles.
