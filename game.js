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
  cadaCuantoPuertas: 260,   // píxeles entre una fila de puertas y la siguiente
  cadaCuantoZombis: 55,     // cada cuántos fotogramas puede salir un zombi
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
let particulas = [];          // trocitos de colores cuando explota algo
let textos = [];              // números flotantes tipo "+5"
let distanciaPuerta = 0;      // para saber cuándo toca crear más puertas

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
  });
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
  // Que no se salga de la pantalla
  tropa.x = Math.max(50, Math.min(ANCHO - 50, tropa.x));

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
  }

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
      if (cambio > 0) puntos += cambio * 10;
    }
  }
  puertas = puertas.filter((p) => p.y < ALTO + 80);

  // --- Crear zombis ---
  if (fotograma % AJUSTES.cadaCuantoZombis === 0 && Math.random() < 0.8) {
    crearZombi();
  }

  // --- Mover zombis ---
  for (const zombi of zombis) {
    zombi.y += velocidad * (zombi.esJefe ? 0.7 : 1); // los jefes son lentos
    zombi.balanceo += 0.15;
    zombi.x += Math.sin(zombi.balanceo) * 0.8; // caminan tambaleándose

    // ¿Un zombi tocó a la tropa? ¡Pierdes soldados!
    const dx = zombi.x - tropa.x;
    const dy = zombi.y - tropa.y;
    if (Math.sqrt(dx * dx + dy * dy) < zombi.radio + 30) {
      const mordisco = zombi.esJefe ? 10 : 2;
      tropa.soldados -= mordisco;
      zombi.vida = 0; // el zombi también "muere" al atacar
      crearExplosion(tropa.x, tropa.y, "#ff5c5c", 20);
      crearTexto(tropa.x, tropa.y - 60, "-" + mordisco, "#ff5c5c");
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
        }
        break;
      }
    }
  }
  zombis = zombis.filter((z) => z.vida > 0 && z.y < ALTO + 60);

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
  // Fondo: carretera oscura con líneas que bajan (da sensación de avanzar)
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, ANCHO, ALTO);

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

  // --- Puertas ---
  for (const puerta of puertas) {
    const x = puerta.lado === "izquierda" ? 0 : ANCHO / 2;
    ctx.fillStyle = puerta.usada
      ? "rgba(120,120,120,0.25)"
      : puerta.esBuena ? "rgba(77,166,255,0.45)" : "rgba(255,92,92,0.45)";
    ctx.fillRect(x + 8, puerta.y - 28, ANCHO / 2 - 16, 56);
    ctx.strokeStyle = puerta.esBuena ? "#4da6ff" : "#ff5c5c";
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 8, puerta.y - 28, ANCHO / 2 - 16, 56);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText(puerta.texto, x + ANCHO / 4, puerta.y + 11);
  }

  // --- Balas ---
  ctx.fillStyle = "#ffe066";
  for (const bala of balas) {
    ctx.fillRect(bala.x - 2, bala.y - 8, 4, 12);
  }

  // --- Zombis ---
  for (const zombi of zombis) {
    // Cuerpo
    ctx.fillStyle = zombi.esJefe ? "#8033cc" : "#3d9940";
    ctx.beginPath();
    ctx.arc(zombi.x, zombi.y, zombi.radio, 0, Math.PI * 2);
    ctx.fill();
    // Ojos
    ctx.fillStyle = "#ff3333";
    const ojo = zombi.radio * 0.28;
    ctx.beginPath();
    ctx.arc(zombi.x - ojo * 1.4, zombi.y - ojo, ojo * 0.6, 0, Math.PI * 2);
    ctx.arc(zombi.x + ojo * 1.4, zombi.y - ojo, ojo * 0.6, 0, Math.PI * 2);
    ctx.fill();
    // Barra de vida
    const anchoBarra = zombi.radio * 2;
    ctx.fillStyle = "#333";
    ctx.fillRect(zombi.x - zombi.radio, zombi.y - zombi.radio - 12, anchoBarra, 6);
    ctx.fillStyle = "#ff9933";
    ctx.fillRect(zombi.x - zombi.radio, zombi.y - zombi.radio - 12,
      anchoBarra * (zombi.vida / zombi.vidaMaxima), 6);
    if (zombi.esJefe) {
      ctx.fillStyle = "#ffd94d";
      ctx.font = "bold 16px Trebuchet MS";
      ctx.fillText("JEFE", zombi.x, zombi.y - zombi.radio - 18);
    }
  }

  // --- La tropa: soldaditos azules en filas ---
  const columnas = 5;
  for (let i = 0; i < tropa.soldados; i++) {
    const columna = i % columnas;
    const fila = Math.floor(i / columnas);
    const sx = tropa.x + (columna - 2) * 18;
    const sy = tropa.y + fila * 16;
    // Cuerpo
    ctx.fillStyle = "#4da6ff";
    ctx.beginPath();
    ctx.arc(sx, sy, 7, 0, Math.PI * 2);
    ctx.fill();
    // Casco
    ctx.fillStyle = "#2d6b99";
    ctx.beginPath();
    ctx.arc(sx, sy - 3, 5, Math.PI, 0);
    ctx.fill();
  }

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

  // --- Marcador (arriba) ---
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px Trebuchet MS";
  ctx.textAlign = "left";
  ctx.fillText("⭐ " + puntos, 14, 32);
  ctx.textAlign = "right";
  ctx.fillText("🪖 " + tropa.soldados, ANCHO - 14, 32);
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
  particulas = [];
  textos = [];
  distanciaPuerta = 0;

  document.getElementById("pantalla-inicio").classList.add("oculta");
  document.getElementById("pantalla-fin").classList.add("oculta");
  estado = "jugando";
}

function finDePartida() {
  estado = "fin";
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
