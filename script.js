const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let y = 0;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // falling twinkly rose
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(200, y, 20, 0, Math.PI * 2);
    ctx.fill();

    y += 2;
    if (y > canvas.height) y = 0;

    requestAnimationFrame(draw);
}

draw();
// Frosted Roses — cute snowflake catcher

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("scoreValue");
const missEl = document.getElementById("missValue");
const messageEl = document.getElementById("message");
const messageTextEl = document.getElementById("messageText");
const playButton = document.getElementById("playButton");

// Fixed game size (we scale visually via CSS)
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Player
const player = {
  x: WIDTH / 2,
  y: HEIGHT * 0.22,
  radius: 16,
  color: "#ffffff",
  glow: "#ffe1f4"
};

// Game state
let snowflakes = [];
let backgroundFlakes = [];
let particles = [];
let score = 0;
let misses = 0;
const maxMisses = 5;
let running = false;
let lastTime = 0;
let spawnTimer = 0;

// Sound
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  return audioCtx;
}

function playTwinkle() {
  const ctxAudio = getAudioContext();
  if (!ctxAudio) return;

  const osc = ctxAudio.createOscillator();
  const gain = ctxAudio.createGain();

  osc.type = "triangle";
  const now = ctxAudio.currentTime;
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(2200, now + 0.15);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

  osc.connect(gain).connect(ctxAudio.destination);
  osc.start(now);
  osc.stop(now + 0.2);
}

function playLose() {
  const ctxAudio = getAudioContext();
  if (!ctxAudio) return;

  const osc = ctxAudio.createOscillator();
  const gain = ctxAudio.createGain();

  osc.type = "sine";
  const now = ctxAudio.currentTime;
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

  osc.connect(gain).connect(ctxAudio.destination);
  osc.start(now);
  osc.stop(now + 0.4);
}

// Helpers
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

// Snowflakes & particles
function spawnSnowflake() {
  snowflakes.push({
    x: rand(30, WIDTH - 30),
    y: -20,
    radius: rand(8, 13),
    speed: rand(80, 120),
    drift: rand(-30, 30),
    phase: Math.random() * Math.PI * 2
  });
}

function spawnBackgroundFlakes(count) {
  for (let i = 0; i < count; i++) {
    backgroundFlakes.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      radius: rand(2, 4),
      speed: rand(15, 30),
      drift: rand(-10, 10),
      phase: Math.random() * Math.PI * 2,
      alpha: rand(0.3, 0.8)
    });
  }
}

function spawnSparkles(x, y, color) {
  for (let i = 0; i < 10; i++) {
    particles.push({
      x,
      y,
      vx: rand(-50, 50),
      vy: rand(-90, -20),
      life: 0.45,
      age: 0,
      color
    });
  }
}

// Game control
function resetGame() {
  snowflakes = [];
  particles = [];
  score = 0;
  misses = 0;
  scoreEl.textContent = score;
  missEl.textContent = misses;
  player.x = WIDTH / 2;
}

function startGame() {
  resetGame();
  running = true;
  lastTime = performance.now();
  spawnTimer = 0;
  messageEl.classList.add("hidden");
  requestAnimationFrame(loop);
}

function gameOver() {
  running = false;
  messageTextEl.textContent = `Game over! Score: ${score}`;
  messageEl.classList.remove("hidden");
  playLose();
}

// Input (tap / drag)
function canvasToGameX(clientX, rect) {
  const scale = WIDTH / rect.width;
  const x = (clientX - rect.left) * scale;
  return Math.max(player.radius + 6, Math.min(WIDTH - player.radius - 6, x));
}

function handlePointer(evt) {
  const rect = canvas.getBoundingClientRect();
  const x = canvasToGameX(
    evt.touches ? evt.touches[0].clientX : evt.clientX,
    rect
  );
  player.x = x;
}

canvas.addEventListener("pointerdown", (e) => {
  if (!running) return;
  handlePointer(e);
});

canvas.addEventListener("pointermove", (e) => {
  if (!running || e.buttons === 0) return;
  handlePointer(e);
});

// For iOS Safari touch events as well
canvas.addEventListener("touchstart", (e) => {
  if (!running) return;
  e.preventDefault();
  handlePointer(e);
});
canvas.addEventListener("touchmove", (e) => {
  if (!running) return;
  e.preventDefault();
  handlePointer(e);
});

// Keyboard option
window.addEventListener("keydown", (e) => {
  const step = 24;
  if (e.key === "ArrowLeft") {
    player.x = Math.max(player.radius + 6, player.x - step);
  } else if (e.key === "ArrowRight") {
    player.x = Math.min(WIDTH - player.radius - 6, player.x + step);
  }
});

// Main loop
function update(dt) {
  const dtSec = dt / 1000;

  // Background flakes
  backgroundFlakes.forEach((f) => {
    f.phase += dtSec;
    f.y += f.speed * dtSec;
    f.x += Math.sin(f.phase) * f.drift * dtSec;
    if (f.y > HEIGHT + 10) {
      f.y = -10;
      f.x = Math.random() * WIDTH;
    }
  });

  // Spawn new snowflakes
  spawnTimer += dtSec;
  const spawnInterval = Math.max(0.6 - score * 0.02, 0.25); // faster with higher score
  if (spawnTimer > spawnInterval) {
    spawnTimer = 0;
    spawnSnowflake();
  }

  // Move snowflakes
  snowflakes.forEach((f) => {
    f.phase += dtSec * 2;
    f.y += f.speed * dtSec;
    f.x += Math.sin(f.phase) * f.drift * dtSec;
  });

  // Check collisions & misses
  for (let i = snowflakes.length - 1; i >= 0; i--) {
    const f = snowflakes[i];

    // Missed
    if (f.y - f.radius > HEIGHT) {
      snowflakes.splice(i, 1);
      misses++;
      missEl.textContent = misses;
      if (misses >= maxMisses) {
        gameOver();
      }
      continue;
    }

    // Collected
    const dx = f.x - player.x;
    const dy = f.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < player.radius + f.radius + 4) {
      snowflakes.splice(i, 1);
      score++;
      scoreEl.textContent = score;
      spawnSparkles(f.x, f.y, "#ffb5e6");
      playTwinkle();
    }
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.age += dtSec;
    if (p.age >= p.life) {
      particles.splice(i, 1);
      continue;
    }
    p.vy += 200 * dtSec; // gravity
    p.x += p.vx * dtSec;
    p.y += p.vy * dtSec;
  }
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Soft vignette background (over the existing gradient)
  const radial = ctx.createRadialGradient(
    WIDTH / 2,
    HEIGHT * 0.1,
    40,
    WIDTH / 2,
    HEIGHT / 2,
    HEIGHT
  );
  radial.addColorStop(0, "rgba(255, 255, 255, 0.8)");
  radial.addColorStop(1, "rgba(255, 200, 230, 0.1)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Background flakes (behind player)
  backgroundFlakes.forEach((f) => {
    ctx.save();
    ctx.globalAlpha = f.alpha;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Player with glow
  ctx.save();
  ctx.shadowColor = player.glow;
  ctx.shadowBlur = 25;
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Foreground snowflakes
  snowflakes.forEach((f) => {
    ctx.save();
    const gradient = ctx.createRadialGradient(
      f.x - f.radius * 0.4,
      f.y - f.radius * 0.4,
      2,
      f.x,
      f.y,
      f.radius + 2
    );
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.6, "#ffe3ff");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0.2)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Sparkle particles
  particles.forEach((p) => {
    const t = p.age / p.life;
    const alpha = 1 - t;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3 * (1 - t * 0.4), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function loop(timestamp) {
  if (!running) return;
  const dt = timestamp - lastTime;
  lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// Initial setup
spawnBackgroundFlakes(40);
draw();

// Message for start screen
messageTextEl.textContent = "Catch the sparkling snowflakes.\nMiss 5 and it's game over!";
messageEl.classList.remove("hidden");

playButton.addEventListener("click", () => {
  startGame();
});
