(() => {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  const SCREENS = {
    menu: document.getElementById('menu'),
    game: document.getElementById('game-screen'),
    gameover: document.getElementById('gameover-screen'),
  };

  const UI = {
    wave: document.getElementById('wave-display'),
    score: document.getElementById('score-display'),
    p1Lives: document.getElementById('p1-lives'),
    p2Lives: document.getElementById('p2-lives'),
    message: document.getElementById('game-message'),
    gameoverTitle: document.getElementById('gameover-title'),
    gameoverScore: document.getElementById('gameover-score'),
    gameoverWave: document.getElementById('gameover-wave'),
  };

  const KEYS = {};
  let gameState = null;
  let animationId = null;

  const ENEMY_TYPES = [
    { emoji: '🥕', name: 'Zanahoria', color: '#ff6b35', speed: 1.8, hp: 1, points: 10 },
    { emoji: '🍅', name: 'Tomate', color: '#e63946', speed: 2.2, hp: 1, points: 15 },
    { emoji: '🥦', name: 'Brócoli', color: '#2d6a4f', speed: 1.4, hp: 2, points: 25 },
    { emoji: '🌽', name: 'Maíz', color: '#ffd60a', speed: 1.6, hp: 2, points: 30 },
    { emoji: '🍆', name: 'Berenjena', color: '#7b2cbf', speed: 2.5, hp: 1, points: 20 },
  ];

  function showScreen(name) {
    Object.values(SCREENS).forEach(s => s.classList.remove('active'));
    SCREENS[name].classList.add('active');
  }

  function hearts(count) {
    return '❤️'.repeat(Math.max(0, count)) + (count === 0 ? '💀' : '');
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  const WORMHOLE_PAIRS = [
    [{ x: 130, y: 130 }, { x: 770, y: 470 }],
    [{ x: 770, y: 130 }, { x: 130, y: 470 }],
    [{ x: 450, y: 90 }, { x: 450, y: 510 }],
  ];

  function createWormholes() {
    const wormholes = [];
    WORMHOLE_PAIRS.forEach((pair, pairIdx) => {
      pair.forEach((pos, endIdx) => {
        wormholes.push({
          x: pos.x,
          y: pos.y,
          radius: 28,
          pairId: pairIdx,
          endIdx,
          pulse: Math.random() * Math.PI * 2,
        });
      });
    });
    return wormholes;
  }

  function getWormholePartner(wormhole) {
    return gameState.wormholes.find(
      w => w.pairId === wormhole.pairId && w.endIdx !== wormhole.endIdx
    );
  }

  class Player {
    constructor(x, y, config) {
      this.x = x;
      this.y = y;
      this.radius = 22;
      this.speed = 4;
      this.lives = 3;
      this.cooldown = 0;
      this.invincible = 0;
      this.config = config;
      this.angle = 0;
      this.teleportCooldown = 0;
    }

    update() {
      let dx = 0, dy = 0;
      const k = this.config.keys;

      if (KEYS[k.up]) dy -= 1;
      if (KEYS[k.down]) dy += 1;
      if (KEYS[k.left]) dx -= 1;
      if (KEYS[k.right]) dx += 1;

      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        dx /= len;
        dy /= len;
        this.x += dx * this.speed;
        this.y += dy * this.speed;
        this.angle = Math.atan2(dy, dx);
      }

      this.x = clamp(this.x, this.radius, canvas.width - this.radius);
      this.y = clamp(this.y, this.radius, canvas.height - this.radius);

      if (this.cooldown > 0) this.cooldown--;
      if (this.invincible > 0) this.invincible--;
      if (this.teleportCooldown > 0) this.teleportCooldown--;

      if (KEYS[k.shoot] && this.cooldown <= 0) {
        this.shoot();
        this.cooldown = 12;
      }
    }

    shoot() {
      const bx = this.x + Math.cos(this.angle) * (this.radius + 8);
      const by = this.y + Math.sin(this.angle) * (this.radius + 8);
      gameState.bullets.push(new Bullet(bx, by, this.angle, this.config));
    }

    hit() {
      if (this.invincible > 0) return;
      this.lives--;
      this.invincible = 90;
      spawnParticles(this.x, this.y, this.config.color, 12);
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);

      if (this.invincible > 0 && Math.floor(this.invincible / 5) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }

      // Sombra
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(3, 8, this.radius, this.radius * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cuerpo patata
      ctx.fillStyle = this.config.bodyColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.radius, this.radius * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = this.config.borderColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ojos
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-7, -4, 5, 0, Math.PI * 2);
      ctx.arc(7, -4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(-6, -3, 2.5, 0, Math.PI * 2);
      ctx.arc(8, -3, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Gorro de comandante
      ctx.fillStyle = this.config.hatColor;
      ctx.beginPath();
      ctx.moveTo(-16, -14);
      ctx.lineTo(16, -14);
      ctx.lineTo(12, -28);
      ctx.lineTo(-12, -28);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-18, -14, 36, 5);

      // Estrella
      ctx.font = '14px serif';
      ctx.textAlign = 'center';
      ctx.fillText('⭐', 0, -20);

      // Nombre
      ctx.font = 'bold 11px Fredoka, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(this.config.name, 0, this.radius + 16);
      ctx.fillText(this.config.name, 0, this.radius + 16);

      ctx.restore();
    }
  }

  class Bullet {
    constructor(x, y, angle, ownerConfig) {
      this.x = x;
      this.y = y;
      this.angle = angle;
      this.speed = 9;
      this.radius = 6;
      this.owner = ownerConfig;
      this.alive = true;
    }

    update() {
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;
      if (this.x < -20 || this.x > canvas.width + 20 || this.y < -20 || this.y > canvas.height + 20) {
        this.alive = false;
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.fillStyle = this.owner.bulletColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff8dc';
      ctx.beginPath();
      ctx.arc(4, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class Enemy {
    constructor(type, targetX, targetY) {
      const side = Math.floor(Math.random() * 4);
      if (side === 0) { this.x = rand(0, canvas.width); this.y = -30; }
      else if (side === 1) { this.x = canvas.width + 30; this.y = rand(0, canvas.height); }
      else if (side === 2) { this.x = rand(0, canvas.width); this.y = canvas.height + 30; }
      else { this.x = -30; this.y = rand(0, canvas.height); }

      this.type = type;
      this.hp = type.hp;
      this.radius = 18;
      this.wobble = Math.random() * Math.PI * 2;
      this.targetX = targetX;
      this.targetY = targetY;
      this.alive = true;
    }

    update() {
      const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
      this.x += Math.cos(angle) * this.type.speed;
      this.y += Math.sin(angle) * this.type.speed;
      this.wobble += 0.1;
    }

    hit() {
      this.hp--;
      spawnParticles(this.x, this.y, this.type.color, 6);
      if (this.hp <= 0) {
        this.alive = false;
        gameState.score += this.type.points;
        spawnParticles(this.x, this.y, this.type.color, 16);
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(Math.sin(this.wobble) * 0.15);

      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.type.emoji, 0, 0);

      if (this.type.hp > 1) {
        ctx.font = 'bold 10px Fredoka, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        const hpText = '❤'.repeat(this.hp);
        ctx.strokeText(hpText, 0, -24);
        ctx.fillText(hpText, 0, -24);
      }

      ctx.restore();
    }
  }

  class Particle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.vx = rand(-3, 3);
      this.vy = rand(-3, 3);
      this.life = rand(20, 40);
      this.maxLife = this.life;
      this.color = color;
      this.size = rand(3, 7);
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.1;
      this.life--;
    }

    draw() {
      ctx.globalAlpha = this.life / this.maxLife;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawWormholes() {
    gameState.wormholes.forEach(w => {
      w.pulse += 0.06;
      const glow = 0.5 + Math.sin(w.pulse) * 0.2;
      const r = w.radius;

      ctx.save();
      ctx.translate(w.x, w.y);

      // Brillo exterior
      const gradient = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.4);
      gradient.addColorStop(0, `rgba(120, 80, 200, ${glow * 0.5})`);
      gradient.addColorStop(0.6, `rgba(60, 20, 100, ${glow * 0.3})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Agujero oscuro
      ctx.fillStyle = '#1a0a2e';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Espiral interior
      ctx.strokeStyle = `rgba(180, 130, 255, ${glow})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const start = w.pulse + i * (Math.PI * 2 / 3);
        for (let a = 0; a < Math.PI * 3; a += 0.15) {
          const spiralR = (a / (Math.PI * 3)) * r * 0.85;
          const px = Math.cos(a + start) * spiralR;
          const py = Math.sin(a + start) * spiralR;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // Borde
      ctx.strokeStyle = `rgba(200, 150, 255, ${0.6 + glow * 0.4})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    });
  }

  function checkWormholeTeleports() {
    gameState.players.forEach(player => {
      if (player.lives <= 0 || player.teleportCooldown > 0) return;

      for (const wormhole of gameState.wormholes) {
        if (dist(player, wormhole) >= wormhole.radius - 4) continue;

        const exit = getWormholePartner(wormhole);
        if (!exit) continue;

        const angle = Math.atan2(exit.y - wormhole.y, exit.x - wormhole.x);
        player.x = exit.x + Math.cos(angle) * 8;
        player.y = exit.y + Math.sin(angle) * 8;
        player.teleportCooldown = 45;
        player.invincible = Math.max(player.invincible, 20);

        spawnParticles(wormhole.x, wormhole.y, '#b388ff', 14);
        spawnParticles(exit.x, exit.y, '#b388ff', 14);
        break;
      }
    });
  }

  class PowerUp {
    constructor(x, y, kind) {
      this.x = x;
      this.y = y;
      this.kind = kind;
      this.radius = 16;
      this.alive = true;
      this.bob = 0;
    }

    update() {
      this.bob += 0.08;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y + Math.sin(this.bob) * 4);
      const icons = { heart: '💖', rapid: '⚡', shield: '🛡️' };
      ctx.font = '24px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icons[this.kind], 0, 0);
      ctx.restore();
    }
  }

  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      gameState.particles.push(new Particle(x, y, color));
    }
  }

  function getNearestPlayer(x, y) {
    const players = gameState.players.filter(p => p.lives > 0);
    if (players.length === 0) return { x: canvas.width / 2, y: canvas.height / 2 };
    let nearest = players[0];
    let minD = dist({ x, y }, nearest);
    for (const p of players.slice(1)) {
      const d = dist({ x, y }, p);
      if (d < minD) { minD = d; nearest = p; }
    }
    return nearest;
  }

  function spawnWave() {
    const count = 3 + gameState.wave * 2;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (!gameState || gameState.gameOver) return;
        const typeIdx = Math.min(
          Math.floor(Math.random() * (1 + gameState.wave * 0.5)),
          ENEMY_TYPES.length - 1
        );
        const target = getNearestPlayer(canvas.width / 2, canvas.height / 2);
        gameState.enemies.push(new Enemy(ENEMY_TYPES[typeIdx], target.x, target.y));
      }, i * 400);
    }
    gameState.waveEnemiesTotal = count;
    gameState.waveEnemiesSpawned = count;
  }

  function maybeDropPowerUp(x, y) {
    if (Math.random() < 0.12) {
      const kinds = ['heart', 'rapid', 'shield'];
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      gameState.powerUps.push(new PowerUp(x, y, kind));
    }
  }

  function applyPowerUp(player, powerUp) {
    if (powerUp.kind === 'heart') {
      player.lives = Math.min(player.lives + 1, 5);
    } else if (powerUp.kind === 'rapid') {
      player.cooldown = -60;
    } else if (powerUp.kind === 'shield') {
      player.invincible = 180;
    }
    spawnParticles(powerUp.x, powerUp.y, '#ffd700', 10);
  }

  function drawBackground() {
    // Césped
    ctx.fillStyle = '#4a8f4a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Patrón de huerto
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Cercado
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    // Tierra (parches)
    const patches = [
      [100, 80, 70], [300, 200, 60], [600, 120, 80],
      [200, 400, 65], [700, 350, 70], [450, 480, 55],
    ];
    patches.forEach(([px, py, pr]) => {
      ctx.fillStyle = '#6b4226';
      ctx.beginPath();
      ctx.ellipse(px, py, pr, pr * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Sol
    ctx.font = '40px serif';
    ctx.fillText('☀️', canvas.width - 55, 45);
  }

  function checkCollisions() {
    // Bullets vs enemies
    gameState.bullets.forEach(b => {
      if (!b.alive) return;
      gameState.enemies.forEach(e => {
        if (!e.alive) return;
        if (dist(b, e) < b.radius + e.radius) {
          b.alive = false;
          const wasAlive = e.alive;
          e.hit();
          if (wasAlive && !e.alive) maybeDropPowerUp(e.x, e.y);
        }
      });
    });

    // Enemies vs players
    gameState.enemies.forEach(e => {
      if (!e.alive) return;
      gameState.players.forEach(p => {
        if (p.lives <= 0) return;
        if (dist(e, p) < e.radius + p.radius) {
          e.alive = false;
          p.hit();
          spawnParticles(e.x, e.y, e.type.color, 10);
        }
      });
    });

    // PowerUps vs players
    gameState.powerUps.forEach(pu => {
      if (!pu.alive) return;
      gameState.players.forEach(p => {
        if (p.lives <= 0) return;
        if (dist(pu, p) < pu.radius + p.radius) {
          pu.alive = false;
          applyPowerUp(p, pu);
        }
      });
    });
  }

  function updateHUD() {
    UI.wave.textContent = `Oleada ${gameState.wave}`;
    UI.score.textContent = `Puntos: ${gameState.score}`;
    UI.p1Lives.textContent = `🥔 ${hearts(gameState.players[0].lives)}`;
    if (gameState.duo) {
      UI.p2Lives.textContent = `🧒 ${hearts(gameState.players[1].lives)}`;
    }
  }

  function checkWaveComplete() {
    if (gameState.enemies.length === 0 && gameState.waveEnemiesSpawned > 0) {
      gameState.waveEnemiesSpawned = 0;
      gameState.wave++;
      showMessage(`¡Oleada ${gameState.wave - 1} completada!`);
      setTimeout(() => {
        if (!gameState || gameState.gameOver) return;
        hideMessage();
        spawnWave();
      }, 2000);
    }
  }

  function checkGameOver() {
    const alive = gameState.players.filter(p => p.lives > 0);
    if (alive.length === 0) {
      gameState.gameOver = true;
      setTimeout(() => endGame(), 1000);
    }
  }

  function showMessage(text) {
    UI.message.textContent = text;
    UI.message.classList.remove('hidden');
  }

  function hideMessage() {
    UI.message.classList.add('hidden');
  }

  function gameLoop() {
    if (!gameState || gameState.gameOver) return;

    drawBackground();
    drawWormholes();

    gameState.players.forEach(p => {
      if (p.lives > 0) { p.update(); }
    });
    checkWormholeTeleports();
    gameState.players.forEach(p => {
      if (p.lives > 0) p.draw();
    });

    gameState.bullets.forEach(b => { b.update(); b.draw(); });
    gameState.bullets = gameState.bullets.filter(b => b.alive);

    gameState.enemies.forEach(e => {
      const target = getNearestPlayer(e.x, e.y);
      e.targetX = target.x;
      e.targetY = target.y;
      e.update();
      e.draw();
    });
    gameState.enemies = gameState.enemies.filter(e => e.alive);

    gameState.powerUps.forEach(pu => { pu.update(); pu.draw(); });
    gameState.powerUps = gameState.powerUps.filter(pu => pu.alive);

    gameState.particles.forEach(p => { p.update(); p.draw(); });
    gameState.particles = gameState.particles.filter(p => p.life > 0);

    checkCollisions();
    updateHUD();
    checkWaveComplete();
    checkGameOver();

    animationId = requestAnimationFrame(gameLoop);
  }

  function startGame(duo) {
    if (animationId) cancelAnimationFrame(animationId);

    const p1Config = {
      name: 'Patata',
      bodyColor: '#d4a056',
      borderColor: '#a07830',
      hatColor: '#2d5a27',
      bulletColor: '#f4e4bc',
      color: '#d4a056',
      keys: { up: 'w', down: 's', left: 'a', right: 'd', shoot: ' ' },
    };

    const p2Config = {
      name: 'Mati',
      bodyColor: '#e8a87c',
      borderColor: '#c47a50',
      hatColor: '#1d3557',
      bulletColor: '#a8dadc',
      color: '#e8a87c',
      keys: { up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright', shoot: 'enter' },
    };

    const players = [
      new Player(canvas.width * 0.35, canvas.height / 2, p1Config),
    ];

    if (duo) {
      players.push(new Player(canvas.width * 0.65, canvas.height / 2, p2Config));
      UI.p2Lives.classList.remove('hidden');
    } else {
      UI.p2Lives.classList.add('hidden');
    }

    gameState = {
      duo,
      players,
      wormholes: createWormholes(),
      bullets: [],
      enemies: [],
      particles: [],
      powerUps: [],
      wave: 1,
      score: 0,
      waveEnemiesSpawned: 0,
      waveEnemiesTotal: 0,
      gameOver: false,
    };

    showScreen('game');
    hideMessage();
    showMessage('¡A la batalla!');
    spawnWave();

    setTimeout(() => {
      hideMessage();
      gameLoop();
    }, 1500);
  }

  function endGame() {
    if (animationId) cancelAnimationFrame(animationId);
    UI.gameoverTitle.textContent = gameState.score >= 200
      ? '¡Comandantes legendarios! 🏆'
      : '¡Fin de la partida!';
    UI.gameoverScore.textContent = `Puntuación final: ${gameState.score}`;
    UI.gameoverWave.textContent = `Llegaste a la oleada ${gameState.wave}`;
    showScreen('gameover');
  }

  // Event listeners
  document.addEventListener('keydown', e => {
    KEYS[e.key.toLowerCase()] = true;
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
      e.preventDefault();
    }
  });

  document.addEventListener('keyup', e => {
    KEYS[e.key.toLowerCase()] = false;
  });

  document.getElementById('btn-solo').addEventListener('click', () => startGame(false));
  document.getElementById('btn-duo').addEventListener('click', () => startGame(true));
  document.getElementById('btn-restart').addEventListener('click', () => {
    startGame(gameState?.duo ?? false);
  });
  document.getElementById('btn-menu').addEventListener('click', () => {
    if (animationId) cancelAnimationFrame(animationId);
    gameState = null;
    showScreen('menu');
  });
})();
