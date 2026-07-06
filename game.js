// ================================================================
//  ÚLTIMA GUERRA: ¡SUPERVIVENCIA!
//  Un juego estilo "Last War" hecho en JavaScript puro.
//
//  ¿Cómo funciona un juego? Es un bucle que se repite 60 veces
//  por segundo y hace siempre 2 cosas:
//    1. ACTUALIZAR: mover todo (tropa, balas, zombis, puertas)
//    2. DIBUJAR: pintar todo en la pantalla
// ================================================================

// ---------- El lienzo donde dibujamos ----------
const canvas = document.getElementById("juego");
const ctx = canvas.getContext("2d");
const ANCHO = canvas.width;   // 480
const ALTO = canvas.height;   // 800

// ---------- AJUSTES DEL JUEGO (¡cambia estos números y experimenta!) ----------
const AJUSTES = {
  soldadosIniciales: 5,     // con cuántos soldados empiezas
  soldadosMaximos: 50,      // límite para que quepan en pantalla
  velocidadBala: 10,        // qué tan rápido suben las balas
  cadenciaDisparo: 18,      // cada cuántos fotogramas dispara la tropa (menos = más rápido)
  velocidadMundo: 2.2,      // qué tan rápido baja todo al principio
  aceleracion: 0.00012,     // cuánto se acelera el juego con el tiempo
  vidaZombi: 3,             // disparos que aguanta un zombi normal
  vidaJefe: 40,             // disparos que aguanta un JEFE
  cadaCuantoPuertas: 430,   // píxeles entre una fila de puertas y la siguiente
  cadaCuantoZombis: 55,     // cada cuántos fotogramas puede salir un zombi
  cadenciaPatata: 90,       // cada cuántos fotogramas dispara el Sargento Patata
  danoPatata: 10,           // daño de la explosión de cada patata
  radioExplosion: 80,       // tamaño de la onda expansiva de la patata
  duracionPelea: 360,       // fotogramas que dura la pelea de jefe (360 = 6 segundos)
  cadaCuantoEscupe: 40,     // cada cuántos fotogramas escupe moco el jefe
  danoMoco: 2,              // soldados que pierdes si te da un moco azul
};

// ---------- Estado del juego ----------
let estado = "inicio";        // "inicio", "jugando" o "fin"
let fotograma = 0;            // contador de fotogramas (60 por segundo)
let puntos = 0;
let record = Number(localStorage.getItem("record") || 0);
let velocidad = AJUSTES.velocidadMundo;

// ---------- La tropa ----------
const tropa = {
  x: ANCHO / 2,               // posición horizontal (el centro de la tropa)
  y: ALTO - 110,              // altura fija, cerca de abajo
  soldados: AJUSTES.soldadosIniciales,
  destinoX: ANCHO / 2,        // hacia dónde quiere moverse
};

// ---------- Listas de cosas que hay en pantalla ----------
let balas = [];
let zombis = [];
let puertas = [];
let patatas = [];             // ¡las patatas que lanza el Sargento Patata!
let mocos = [];               // los mocos azules que escupen los jefes
let particulas = [];          // trocitos de colores cuando explota algo
let textos = [];              // números flotantes tipo "+5"
let distanciaPuerta = 0;      // para saber cuándo toca crear más puertas

// Piedritas decorativas del suelo (solo para que se vea bonito)
const decoracion = [];
for (let i = 0; i < 16; i++) {
  decoracion.push({
    x: Math.random() * ANCHO,
    y: Math.random() * ALTO,
    radio: 1.5 + Math.random() * 3,
  });
}

// ================================================================
//  SONIDOS: hechos con código, ¡sin archivos mp3!
//  La Web Audio API genera ondas de sonido al vuelo.
//  Pulsa la tecla M para silenciar/activar.
// ================================================================
let audio = null;             // el "altavoz" del navegador
let silencio = false;

function encenderAudio() {
  // Los navegadores solo dejan sonar tras un clic del jugador
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
}

// Un pitido: frecuencia (grave o agudo), duración en segundos,
// tipo de onda y volumen. "deslizarA" hace que la nota suba o baje.
function pitido(frecuencia, duracion, tipo, volumen, deslizarA) {
  if (!audio || silencio) return;
  const onda = audio.createOscillator();
  const ganancia = audio.createGain();
  onda.type = tipo;
  onda.frequency.setValueAtTime(frecuencia, audio.currentTime);
  if (deslizarA) onda.frequency.exponentialRampToValueAtTime(deslizarA, audio.currentTime + duracion);
  ganancia.gain.setValueAtTime(volumen, audio.currentTime);
  ganancia.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duracion);
  onda.connect(ganancia);
  ganancia.connect(audio.destination);
  onda.start();
  onda.stop(audio.currentTime + duracion);
}

// Ruido tipo "explosión": estática que se va apagando
function ruido(duracion, volumen) {
  if (!audio || silencio) return;
  const muestras = Math.floor(audio.sampleRate * duracion);
  const bufer = audio.createBuffer(1, muestras, audio.sampleRate);
  const datos = bufer.getChannelData(0);
  for (let i = 0; i < muestras; i++) {
    datos[i] = (Math.random() * 2 - 1) * (1 - i / muestras);
  }
  const fuente = audio.createBufferSource();
  fuente.buffer = bufer;
  const ganancia = audio.createGain();
  ganancia.gain.value = volumen;
  fuente.connect(ganancia);
  ganancia.connect(audio.destination);
  fuente.start();
}

// Todos los sonidos del juego (¡prueba a cambiar los números!)
const sonidos = {
  disparo:     () => pitido(900, 0.06, "square", 0.04, 250),
  lanzapatata: () => pitido(200, 0.25, "sine", 0.3, 600),      // "¡PLOP!" hacia arriba
  explosion:   () => { ruido(0.35, 0.3); pitido(90, 0.35, "sawtooth", 0.25, 35); },
  zombiMuere:  () => pitido(160, 0.18, "sawtooth", 0.15, 40),
  jefeMuere:   () => { ruido(0.5, 0.35); pitido(70, 0.6, "sawtooth", 0.3, 25); },
  puertaBuena: () => { pitido(523, 0.1, "sine", 0.25); setTimeout(() => pitido(784, 0.15, "sine", 0.25), 90); },
  puertaMala:  () => pitido(220, 0.3, "sawtooth", 0.2, 90),
  mordisco:    () => { ruido(0.12, 0.25); pitido(130, 0.22, "square", 0.2, 55); },
  fin:         () => { pitido(400, 0.5, "sawtooth", 0.25, 90); setTimeout(() => ruido(0.6, 0.3), 250); },
  peleaJefe:   () => {  // bocina de alarma: ¡empieza la pelea!
    pitido(110, 0.28, "sawtooth", 0.3);
    setTimeout(() => pitido(110, 0.28, "sawtooth", 0.3), 340);
    setTimeout(() => pitido(175, 0.5, "sawtooth", 0.35), 680);
  },
  escupitajo:  () => pitido(320, 0.18, "sine", 0.2, 70), // "¡PTUU!" del moco
};

window.addEventListener("keydown", (e) => {
  if (e.key === "m" || e.key === "M") silencio = !silencio;
});

// ================================================================
//  CONTROLES: ratón, dedo y teclado
// ================================================================
function moverA(xPantalla) {
  // Convertimos la posición de la pantalla a la posición del canvas
  const caja = canvas.getBoundingClientRect();
  const escala = ANCHO / caja.width;
  tropa.destinoX = (xPantalla - caja.left) * escala;
}

canvas.addEventListener("mousemove", (e) => moverA(e.clientX));
canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  moverA(e.touches[0].clientX);
}, { passive: false });

const teclas = {};
window.addEventListener("keydown", (e) => (teclas[e.key] = true));
window.addEventListener("keyup", (e) => (teclas[e.key] = false));

// ================================================================
//  CREAR COSAS
// ================================================================

// Una fila de puertas: dos opciones, una a la izquierda y otra a la derecha
function crearPuertas() {
  // Operaciones posibles: [texto, función que la aplica, ¿es buena?]
  const buenas = [
    ["+3", (n) => n + 3],
    ["+5", (n) => n + 5],
    ["x2", (n) => n * 2],
    ["+8", (n) => n + 8],
  ];
  const malas = [
    ["-4", (n) => n - 4],
    ["-7", (n) => n - 7],
    ["÷2", (n) => Math.floor(n / 2)],
  ];

  const buena = buenas[Math.floor(Math.random() * buenas.length)];
  const mala = malas[Math.floor(Math.random() * malas.length)];

  // Al azar decidimos si la buena va a la izquierda o a la derecha
  const buenaIzquierda = Math.random() < 0.5;

  const izquierda = buenaIzquierda ? buena : mala;
  const derecha = buenaIzquierda ? mala : buena;

  puertas.push({
    y: -60,
    lado: "izquierda", texto: izquierda[0], aplicar: izquierda[1],
    esBuena: izquierda === buena, usada: false,
  });
  puertas.push({
    y: -60,
    lado: "derecha", texto: derecha[0], aplicar: derecha[1],
    esBuena: derecha === buena, usada: false,
  });
}

function crearZombi() {
  const esJefe = Math.random() < 0.06; // 6% de probabilidad de que sea un JEFE
  const vidaExtra = Math.floor(puntos / 300); // los zombis se hacen más duros con el tiempo
  zombis.push({
    x: 40 + Math.random() * (ANCHO - 80),
    y: -40,
    radio: esJefe ? 34 : 16,
    vida: (esJefe ? AJUSTES.vidaJefe : AJUSTES.vidaZombi) + vidaExtra,
    vidaMaxima: (esJefe ? AJUSTES.vidaJefe : AJUSTES.vidaZombi) + vidaExtra,
    esJefe: esJefe,
    balanceo: Math.random() * 6.28, // para que caminen tambaleándose
    peleando: false,                // ¿está en plena pelea de jefe?
    yaPeleo: false,                 // para que solo se plante una vez
    tiempoPelea: 0,                 // fotogramas que le quedan de pelea
  });
}

// El jefe escupe un moco azul apuntando a donde está la tropa
function escupirMoco(jefe) {
  const dx = tropa.x - jefe.x;
  const dy = tropa.y - jefe.y;
  const distancia = Math.sqrt(dx * dx + dy * dy);
  const rapidez = 4.5;
  mocos.push({
    x: jefe.x,
    y: jefe.y + jefe.radio,
    vx: (dx / distancia) * rapidez,  // dirección hacia la tropa
    vy: (dy / distancia) * rapidez,
    burbuja: Math.random() * 6.28,   // para que el moco tiemble
  });
  sonidos.escupitajo();
}

function crearExplosion(x, y, color, cantidad) {
  for (let i = 0; i < cantidad; i++) {
    particulas.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      vida: 30,
      color: color,
    });
  }
}

function crearTexto(x, y, mensaje, color) {
  textos.push({ x: x, y: y, mensaje: mensaje, color: color, vida: 50 });
}

// ================================================================
//  EL SARGENTO PATATA 🥔
//  Un soldado especial que va junto a la tropa y lanza patatas
//  por el aire. Cuando caen... ¡BOOM! Explotan y dañan a todos
//  los zombis cercanos.
// ================================================================

// ¿Dónde está el sargento? Siempre a la derecha de la tropa
function posicionSargento() {
  return { x: tropa.x + 58, y: tropa.y + 6 };
}

function lanzarPatata(objetivo) {
  const inicio = posicionSargento();
  const vuelo = 45;        // fotogramas que tarda la patata en llegar
  const gravedad = 0.35;   // lo que "pesa" la patata

  // Matemáticas de puntería: calculamos la velocidad inicial para
  // que la patata caiga justo donde estará el zombi
  patatas.push({
    x: inicio.x,
    y: inicio.y,
    vx: (objetivo.x - inicio.x) / vuelo,
    vy: (objetivo.y - inicio.y) / vuelo - (gravedad * vuelo) / 2,
    gravedad: gravedad,
    tiempo: vuelo,
    giro: 0,
  });
  sonidos.lanzapatata();
}

function explotarPatata(patata) {
  sonidos.explosion();
  crearExplosion(patata.x, patata.y, "#ffaa33", 30);
  crearExplosion(patata.x, patata.y, "#d9a066", 15);

  // Daño en área: todos los zombis dentro del radio reciben daño
  for (const zombi of zombis) {
    const dx = zombi.x - patata.x;
    const dy = zombi.y - patata.y;
    if (Math.sqrt(dx * dx + dy * dy) < AJUSTES.radioExplosion + zombi.radio) {
      zombi.vida -= AJUSTES.danoPatata;
      if (zombi.vida <= 0) {
        puntos += zombi.esJefe ? 500 : 50;
        crearExplosion(zombi.x, zombi.y, zombi.esJefe ? "#b366ff" : "#7fe37f", zombi.esJefe ? 35 : 12);
        if (zombi.esJefe) sonidos.jefeMuere(); else sonidos.zombiMuere();
      }
    }
  }
}

// ================================================================
//  ACTUALIZAR: aquí se mueve todo (se ejecuta 60 veces por segundo)
// ================================================================
function actualizar() {
  fotograma++;
  puntos += 1; // ganas puntos solo por sobrevivir
  velocidad += AJUSTES.aceleracion * fotograma * 0.01; // cada vez más rápido...

  // --- Mover la tropa ---
  if (teclas["ArrowLeft"]) tropa.destinoX -= 8;
  if (teclas["ArrowRight"]) tropa.destinoX += 8;
  // La tropa se acerca poco a poco a su destino (queda suave)
  tropa.x += (tropa.destinoX - tropa.x) * 0.2;
  // Que no se salga de la pantalla (dejamos hueco a la derecha
  // para que el Sargento Patata no quede cortado)
  tropa.x = Math.max(50, Math.min(ANCHO - 78, tropa.x));

  // --- Disparar ---
  if (fotograma % AJUSTES.cadenciaDisparo === 0) {
    // Cada soldado dispara una bala (máximo 12 balas por ráfaga para no saturar)
    const disparos = Math.min(tropa.soldados, 12);
    for (let i = 0; i < disparos; i++) {
      balas.push({
        x: tropa.x + (i - disparos / 2) * 9 + Math.random() * 4,
        y: tropa.y - 20,
        // Cuantos más soldados, más daño hace cada bala
        dano: Math.max(1, Math.round(tropa.soldados / disparos)),
      });
    }
    sonidos.disparo();
  }

  // --- El Sargento Patata apunta y lanza ---
  if (fotograma % AJUSTES.cadenciaPatata === 0 && zombis.length > 0) {
    // Busca al zombi más peligroso: el que está más abajo (más cerca de ti)
    let objetivo = zombis[0];
    for (const zombi of zombis) {
      if (zombi.y > objetivo.y) objetivo = zombi;
    }
    // Apunta un poco por delante, porque el zombi sigue bajando
    lanzarPatata({ x: objetivo.x, y: objetivo.y + velocidad * 45 });
  }

  // --- Mover las patatas (vuelan en curva por la gravedad) ---
  for (const patata of patatas) {
    patata.vy += patata.gravedad;  // la gravedad tira hacia abajo
    patata.x += patata.vx;
    patata.y += patata.vy;
    patata.giro += 0.3;            // gira mientras vuela
    patata.tiempo--;
    if (patata.tiempo <= 0) explotarPatata(patata);
  }
  patatas = patatas.filter((p) => p.tiempo > 0);

  // --- Mover balas (van hacia arriba) ---
  for (const bala of balas) bala.y -= AJUSTES.velocidadBala;
  balas = balas.filter((b) => b.y > -20); // borrar las que salen de pantalla

  // --- Crear puertas cada cierta distancia ---
  distanciaPuerta += velocidad;
  if (distanciaPuerta > AJUSTES.cadaCuantoPuertas) {
    distanciaPuerta = 0;
    crearPuertas();
  }

  // --- Mover puertas y comprobar si la tropa pasa por una ---
  for (const puerta of puertas) {
    puerta.y += velocidad;

    const enSuAltura = puerta.y > tropa.y - 30 && puerta.y < tropa.y + 30;
    const ladoTropa = tropa.x < ANCHO / 2 ? "izquierda" : "derecha";

    if (!puerta.usada && enSuAltura && puerta.lado === ladoTropa) {
      puerta.usada = true;
      const antes = tropa.soldados;
      tropa.soldados = Math.min(AJUSTES.soldadosMaximos, Math.max(0, puerta.aplicar(tropa.soldados)));
      const cambio = tropa.soldados - antes;
      crearTexto(tropa.x, tropa.y - 60,
        (cambio >= 0 ? "+" : "") + cambio,
        cambio >= 0 ? "#4dff88" : "#ff5c5c");
      if (cambio >= 0) sonidos.puertaBuena(); else sonidos.puertaMala();
      if (cambio > 0) puntos += cambio * 10;
    }
  }
  puertas = puertas.filter((p) => p.y < ALTO + 80);

  // --- Crear zombis ---
  if (fotograma % AJUSTES.cadaCuantoZombis === 0 && Math.random() < 0.8) {
    crearZombi();
  }

  // --- Mover zombis (¡y peleas de jefe!) ---
  for (const zombi of zombis) {
    // Cuando un jefe llega a su sitio, se planta 6 segundos a pelear
    if (zombi.esJefe && !zombi.yaPeleo && zombi.y >= 170) {
      zombi.yaPeleo = true;
      zombi.peleando = true;
      zombi.tiempoPelea = AJUSTES.duracionPelea;
      crearTexto(ANCHO / 2, 300, "¡PELEA DE JEFE!", "#ffd94d");
      sonidos.peleaJefe();
    }

    if (zombi.peleando) {
      // El jefe se queda arriba, moviéndose de lado a lado y escupiendo
      zombi.balanceo += 0.05;
      zombi.x += Math.sin(zombi.balanceo) * 1.6;
      zombi.tiempoPelea--;
      if (zombi.tiempoPelea % AJUSTES.cadaCuantoEscupe === 0) escupirMoco(zombi);
      if (zombi.tiempoPelea <= 0) zombi.peleando = false; // se cansó: vuelve a avanzar
    } else {
      zombi.y += velocidad * (zombi.esJefe ? 0.7 : 1); // los jefes son lentos
      zombi.balanceo += 0.15;
      zombi.x += Math.sin(zombi.balanceo) * 0.8; // caminan tambaleándose
    }

    // ¿Un zombi tocó a la tropa? ¡Pierdes soldados!
    const dx = zombi.x - tropa.x;
    const dy = zombi.y - tropa.y;
    if (Math.sqrt(dx * dx + dy * dy) < zombi.radio + 30) {
      const mordisco = zombi.esJefe ? 10 : 2;
      tropa.soldados -= mordisco;
      zombi.vida = 0; // el zombi también "muere" al atacar
      crearExplosion(tropa.x, tropa.y, "#ff5c5c", 20);
      crearTexto(tropa.x, tropa.y - 60, "-" + mordisco, "#ff5c5c");
      sonidos.mordisco();
    }
  }

  // --- ¿Las balas dan a los zombis? ---
  for (const bala of balas) {
    for (const zombi of zombis) {
      const dx = bala.x - zombi.x;
      const dy = bala.y - zombi.y;
      if (Math.sqrt(dx * dx + dy * dy) < zombi.radio + 5) {
        zombi.vida -= bala.dano;
        bala.y = -999; // la bala desaparece
        if (zombi.vida <= 0) {
          puntos += zombi.esJefe ? 500 : 50;
          crearExplosion(zombi.x, zombi.y, zombi.esJefe ? "#b366ff" : "#7fe37f", zombi.esJefe ? 35 : 12);
          if (zombi.esJefe) crearTexto(zombi.x, zombi.y, "+500", "#ffd94d");
          if (zombi.esJefe) sonidos.jefeMuere(); else sonidos.zombiMuere();
        }
        break;
      }
    }
  }
  zombis = zombis.filter((z) => z.vida > 0 && z.y < ALTO + 60);

  // --- Mover los mocos azules (¡esquívalos!) ---
  for (const moco of mocos) {
    moco.x += moco.vx;
    moco.y += moco.vy;
    moco.burbuja += 0.25;

    // ¿Un moco alcanzó a la tropa? ¡Splat!
    const dx = moco.x - tropa.x;
    const dy = moco.y - tropa.y;
    if (Math.sqrt(dx * dx + dy * dy) < 34) {
      tropa.soldados -= AJUSTES.danoMoco;
      moco.y = ALTO + 999; // el moco desaparece
      crearExplosion(tropa.x, tropa.y, "#4dc3ff", 18);
      crearTexto(tropa.x, tropa.y - 60, "-" + AJUSTES.danoMoco, "#4dc3ff");
      sonidos.mordisco();
    }
  }
  mocos = mocos.filter((m) => m.y < ALTO + 40 && m.x > -40 && m.x < ANCHO + 40);

  // --- Partículas y textos flotantes ---
  for (const p of particulas) {
    p.x += p.vx; p.y += p.vy; p.vida--;
  }
  particulas = particulas.filter((p) => p.vida > 0);
  for (const t of textos) { t.y -= 1; t.vida--; }
  textos = textos.filter((t) => t.vida > 0);

  // --- ¿Perdiste? ---
  if (tropa.soldados <= 0) {
    finDePartida();
  }
}

// ================================================================
//  DIBUJAR: aquí se pinta todo en pantalla
// ================================================================
function dibujar() {
  // Fondo: un degradado que va de noche cerrada a azul oscuro
  const cielo = ctx.createLinearGradient(0, 0, 0, ALTO);
  cielo.addColorStop(0, "#0e0e20");
  cielo.addColorStop(0.6, "#1a1a30");
  cielo.addColorStop(1, "#26263e");
  ctx.fillStyle = cielo;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // Piedritas del suelo que bajan (dan sensación de avanzar)
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  for (const piedra of decoracion) {
    piedra.y += velocidad;
    if (piedra.y > ALTO + 10) {
      piedra.y = -10;
      piedra.x = Math.random() * ANCHO;
    }
    ctx.beginPath();
    ctx.arc(piedra.x, piedra.y, piedra.radio, 0, Math.PI * 2);
    ctx.fill();
  }

  // Líneas de la carretera
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 4;
  ctx.setLineDash([30, 40]);
  const desplazamiento = (fotograma * velocidad) % 70;
  for (const x of [ANCHO * 0.25, ANCHO * 0.5, ANCHO * 0.75]) {
    ctx.beginPath();
    ctx.moveTo(x, desplazamiento - 70);
    ctx.lineTo(x, ALTO);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // --- Puertas (con esquinas redondeadas y brillo de neón) ---
  for (const puerta of puertas) {
    const x = puerta.lado === "izquierda" ? 0 : ANCHO / 2;
    const px = x + 10, py = puerta.y - 30, pancho = ANCHO / 2 - 20, palto = 60;

    ctx.save();
    if (!puerta.usada) {
      // El brillo de neón alrededor
      ctx.shadowColor = puerta.esBuena ? "#4da6ff" : "#ff5c5c";
      ctx.shadowBlur = 18;
    }
    // Relleno con degradado
    const degradado = ctx.createLinearGradient(0, py, 0, py + palto);
    if (puerta.usada) {
      degradado.addColorStop(0, "rgba(110,110,110,0.2)");
      degradado.addColorStop(1, "rgba(70,70,70,0.2)");
    } else if (puerta.esBuena) {
      degradado.addColorStop(0, "rgba(90,180,255,0.6)");
      degradado.addColorStop(1, "rgba(30,90,180,0.55)");
    } else {
      degradado.addColorStop(0, "rgba(255,110,110,0.6)");
      degradado.addColorStop(1, "rgba(170,30,30,0.55)");
    }
    ctx.fillStyle = degradado;
    ctx.beginPath();
    ctx.roundRect(px, py, pancho, palto, 14);
    ctx.fill();
    ctx.strokeStyle = puerta.esBuena ? "#7fc4ff" : "#ff8f8f";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // El texto de la puerta con su emoji
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px Trebuchet MS";
    ctx.textAlign = "center";
    const icono = puerta.usada ? "" : puerta.esBuena ? "🪖 " : "☠️ ";
    ctx.fillText(icono + puerta.texto, x + ANCHO / 4, puerta.y + 11);
  }

  // --- Balas ---
  ctx.fillStyle = "#ffe066";
  for (const bala of balas) {
    ctx.fillRect(bala.x - 2, bala.y - 8, 4, 12);
  }

  // --- Patatas volando (girando por el aire) ---
  for (const patata of patatas) {
    ctx.save();
    ctx.translate(patata.x, patata.y);
    ctx.rotate(patata.giro);
    // La patata: un óvalo marrón con manchitas
    ctx.fillStyle = "#c8925a";
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#9c6b3d";
    ctx.beginPath();
    ctx.arc(-4, -2, 1.8, 0, Math.PI * 2);
    ctx.arc(4, 2, 1.8, 0, Math.PI * 2);
    ctx.arc(1, -3, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Sombra en el suelo para ver dónde va a caer
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(patata.x, patata.y + 20, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Mocos azules (con brillo y temblor de gelatina) ---
  for (const moco of mocos) {
    const tamano = 10 + Math.sin(moco.burbuja) * 2;
    ctx.save();
    ctx.shadowColor = "#4dc3ff";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#3fa9e8";
    ctx.beginPath();
    ctx.arc(moco.x, moco.y, tamano, 0, Math.PI * 2);
    ctx.fill();
    // Gotita que deja detrás
    ctx.fillStyle = "rgba(77,195,255,0.5)";
    ctx.beginPath();
    ctx.arc(moco.x - moco.vx * 2.5, moco.y - moco.vy * 2.5, tamano * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Brillito encima (como si fuera gelatina)
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath();
    ctx.arc(moco.x - 3, moco.y - 3, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Zombis ---
  for (const zombi of zombis) {
    const colorCuerpo = zombi.esJefe ? "#8033cc" : "#3d9940";
    const colorOscuro = zombi.esJefe ? "#5a2490" : "#2a6b2d";

    // Brazos que se balancean (dos círculos a los lados)
    const vaiven = Math.sin(zombi.balanceo) * zombi.radio * 0.3;
    ctx.fillStyle = colorOscuro;
    ctx.beginPath();
    ctx.arc(zombi.x - zombi.radio * 0.95, zombi.y + vaiven, zombi.radio * 0.35, 0, Math.PI * 2);
    ctx.arc(zombi.x + zombi.radio * 0.95, zombi.y - vaiven, zombi.radio * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Cuerpo con degradado (más claro arriba, como si le diera la luz)
    const luz = ctx.createRadialGradient(
      zombi.x - zombi.radio * 0.3, zombi.y - zombi.radio * 0.4, zombi.radio * 0.2,
      zombi.x, zombi.y, zombi.radio);
    luz.addColorStop(0, zombi.esJefe ? "#a95ce8" : "#57c25b");
    luz.addColorStop(1, colorCuerpo);
    ctx.fillStyle = luz;
    ctx.beginPath();
    ctx.arc(zombi.x, zombi.y, zombi.radio, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colorOscuro;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ojos rojos que brillan
    ctx.save();
    ctx.shadowColor = "#ff3333";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#ff3333";
    const ojo = zombi.radio * 0.28;
    ctx.beginPath();
    ctx.arc(zombi.x - ojo * 1.4, zombi.y - ojo, ojo * 0.6, 0, Math.PI * 2);
    ctx.arc(zombi.x + ojo * 1.4, zombi.y - ojo, ojo * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Boca: abierta de par en par si está peleando (¡para escupir!)
    ctx.fillStyle = "#1a0d26";
    ctx.beginPath();
    if (zombi.peleando) {
      ctx.arc(zombi.x, zombi.y + zombi.radio * 0.4, zombi.radio * 0.35, 0, Math.PI * 2);
    } else {
      ctx.arc(zombi.x, zombi.y + zombi.radio * 0.35, zombi.radio * 0.3, 0, Math.PI);
    }
    ctx.fill();

    // Corona de pinchos para el jefe
    if (zombi.esJefe) {
      ctx.fillStyle = "#ffd94d";
      for (let i = -2; i <= 2; i++) {
        const bx = zombi.x + i * zombi.radio * 0.35;
        const by = zombi.y - zombi.radio + 2;
        ctx.beginPath();
        ctx.moveTo(bx - 5, by);
        ctx.lineTo(bx, by - 12);
        ctx.lineTo(bx + 5, by);
        ctx.fill();
      }
    }

    // Barra de vida
    const anchoBarra = zombi.radio * 2;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(zombi.x - zombi.radio, zombi.y - zombi.radio - 14, anchoBarra, 6);
    ctx.fillStyle = zombi.vida / zombi.vidaMaxima > 0.4 ? "#7fe37f" : "#ff9933";
    ctx.fillRect(zombi.x - zombi.radio, zombi.y - zombi.radio - 14,
      anchoBarra * (zombi.vida / zombi.vidaMaxima), 6);
    if (zombi.esJefe) {
      ctx.fillStyle = "#ffd94d";
      ctx.font = "bold 16px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText(zombi.peleando ? "¡PELEANDO!" : "JEFE", zombi.x, zombi.y - zombi.radio - 22);
    }
  }

  // --- La tropa: soldaditos azules en filas ---
  const columnas = 5;
  for (let i = 0; i < tropa.soldados; i++) {
    const columna = i % columnas;
    const fila = Math.floor(i / columnas);
    const sx = tropa.x + (columna - 2) * 18;
    const sy = tropa.y + fila * 16;
    // Fusil apuntando hacia arriba (solo la primera fila, que es la que dispara)
    if (fila === 0) {
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(sx + 4, sy - 2);
      ctx.lineTo(sx + 4, sy - 14);
      ctx.stroke();
    }
    // Cuerpo
    ctx.fillStyle = "#4da6ff";
    ctx.beginPath();
    ctx.arc(sx, sy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2d6b99";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Casco
    ctx.fillStyle = "#2d6b99";
    ctx.beginPath();
    ctx.arc(sx, sy - 3, 5, Math.PI, 0);
    ctx.fill();
  }

  // --- El Sargento Patata y su lanzador ---
  const sargento = posicionSargento();
  // Cuerpo (más grande que un soldado normal y de color caqui)
  ctx.fillStyle = "#8a9a5b";
  ctx.beginPath();
  ctx.arc(sargento.x, sargento.y, 11, 0, Math.PI * 2);
  ctx.fill();
  // Casco
  ctx.fillStyle = "#5c6b3c";
  ctx.beginPath();
  ctx.arc(sargento.x, sargento.y - 4, 8, Math.PI, 0);
  ctx.fill();
  // El lanzador de patatas: un tubo inclinado sobre su hombro
  ctx.save();
  ctx.translate(sargento.x, sargento.y);
  ctx.rotate(-0.5); // inclinado apuntando hacia arriba
  ctx.fillStyle = "#4a4a4a";
  ctx.fillRect(-5, -30, 10, 26);       // el tubo
  ctx.fillStyle = "#6b6b6b";
  ctx.fillRect(-7, -34, 14, 6);        // la boca del tubo
  // Una patata asomando, lista para salir
  ctx.fillStyle = "#c8925a";
  ctx.beginPath();
  ctx.ellipse(0, -34, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Su nombre
  ctx.fillStyle = "#ffd94d";
  ctx.font = "bold 10px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("SGT. 🥔", sargento.x, sargento.y + 24);

  // --- Partículas ---
  for (const p of particulas) {
    ctx.globalAlpha = p.vida / 30;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
  }
  ctx.globalAlpha = 1;

  // --- Textos flotantes ---
  for (const t of textos) {
    ctx.globalAlpha = t.vida / 50;
    ctx.fillStyle = t.color;
    ctx.font = "bold 28px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText(t.mensaje, t.x, t.y);
  }
  ctx.globalAlpha = 1;

  // --- Marcador (arriba, en paneles redondeados) ---
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.roundRect(10, 8, 150, 34, 17);
  ctx.roundRect(ANCHO - 120, 8, 110, 34, 17);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px Trebuchet MS";
  ctx.textAlign = "left";
  ctx.fillText("⭐ " + puntos, 24, 32);
  ctx.textAlign = "right";
  ctx.fillText("🪖 " + tropa.soldados, ANCHO - 24, 32);

  // --- Barra gigante del jefe cuando hay pelea ---
  const jefeEnPelea = zombis.find((z) => z.peleando);
  if (jefeEnPelea) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.roundRect(ANCHO / 2 - 130, 52, 260, 22, 11);
    ctx.fill();
    ctx.fillStyle = "#b366ff";
    ctx.beginPath();
    ctx.roundRect(ANCHO / 2 - 126, 55, 252 * (jefeEnPelea.vida / jefeEnPelea.vidaMaxima), 16, 8);
    ctx.fill();
    ctx.fillStyle = "#ffd94d";
    ctx.font = "bold 14px Trebuchet MS";
    ctx.textAlign = "center";
    // Cuenta atrás de la pelea en segundos
    const segundos = Math.ceil(jefeEnPelea.tiempoPelea / 60);
    ctx.fillText("👑 JEFE — " + segundos + "s", ANCHO / 2, 90);
  }
}

// ================================================================
//  EL BUCLE DEL JUEGO
// ================================================================
function bucle() {
  if (estado === "jugando") {
    actualizar();
    dibujar();
  }
  requestAnimationFrame(bucle); // "llámame otra vez en el próximo fotograma"
}

// ================================================================
//  EMPEZAR Y TERMINAR PARTIDAS
// ================================================================
function empezarPartida() {
  // Reiniciamos todo
  fotograma = 0;
  puntos = 0;
  velocidad = AJUSTES.velocidadMundo;
  tropa.soldados = AJUSTES.soldadosIniciales;
  tropa.x = ANCHO / 2;
  tropa.destinoX = ANCHO / 2;
  balas = [];
  zombis = [];
  puertas = [];
  patatas = [];
  mocos = [];
  particulas = [];
  textos = [];
  distanciaPuerta = 0;

  encenderAudio(); // el clic en el botón nos da permiso para sonar
  document.getElementById("pantalla-inicio").classList.add("oculta");
  document.getElementById("pantalla-fin").classList.add("oculta");
  estado = "jugando";
}

function finDePartida() {
  estado = "fin";
  sonidos.fin();
  if (puntos > record) {
    record = puntos;
    localStorage.setItem("record", record); // guardamos el récord en el navegador
  }
  document.getElementById("texto-puntos").textContent = "Puntos: " + puntos;
  document.getElementById("texto-record").textContent = "Récord: " + record;
  document.getElementById("pantalla-fin").classList.remove("oculta");
}

document.getElementById("boton-jugar").addEventListener("click", empezarPartida);
document.getElementById("boton-reintentar").addEventListener("click", empezarPartida);

// ¡Arrancamos el bucle! (aunque no dibuja nada hasta que pulses JUGAR)
bucle();
