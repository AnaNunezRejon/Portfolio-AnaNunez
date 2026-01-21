// ===============================
// Portfolio RPG - game.js
// ===============================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
let isFullscreen = false;

// ========== VARIABLES DE ESCALADO ==========
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let currentMap = "room"; // ← EMPIEZA EN LA SALA
let isFirstLoad = true;

// Tamaño REAL de la imagen room.png (640x480)
const GAME_WIDTH = 640;
const GAME_HEIGHT = 480;

// VARIABLES DE SPAWN

const ROOM_SPAWN_CENTER = { x: 320, y: 260 };
const ROOM_SPAWN_DOOR = { x: 320, y: 420 };
const OUTSIDE_SPAWN_DOOR = { x: 300, y: 260 };

// ---------- ASSETS ----------
const room = new Image();
room.src = "assets/room.png";

const exteriorBg = new Image();
exteriorBg.src = "assets/exterior.jpg";

interactStar.init();

const playerSprite = new Image();
playerSprite.src = "assets/player.png";

// ---------- PLAYER ----------
const player = {
  x: 320,
  y: 250,
  width: 32,
  height: 32,
  speed: 2
};

// ---------- ANIMATION ----------
let direction = "down";
let frame = 0;
let frameTimer = 0;
const frameSpeed = 10;
const framesPerRow = 4;

// ---------- INPUT ----------
const keys = {};
let nearbyObject = null;
let canInteract = true;

// ---------- MAP DATA ----------
let collisionObjects = [];
let interactables = [];
let mapLoaded = false;
let MAP_WIDTH = GAME_WIDTH;   // 640
let MAP_HEIGHT = GAME_HEIGHT; // 480

// ---------- FUNCIONES DE ESCALADO ----------

// Función para escalar el canvas
function setupCanvas() {
  // Obtener el tamaño del contenedor
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  // Cambiar el tamaño interno del canvas
  canvas.width = displayWidth;
  canvas.height = displayHeight;

  // Calcular escala para mantener proporción 4:3
  const scaleX = displayWidth / GAME_WIDTH;
  const scaleY = displayHeight / GAME_HEIGHT;
  scale = Math.min(scaleX, scaleY); // Escala uniforme

  // Calcular offset para centrar
  offsetX = (displayWidth - GAME_WIDTH * scale) / 2;
  offsetY = (displayHeight - GAME_HEIGHT * scale) / 2;

  // Mantener el pixel art nítido
  ctx.imageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
}

// Función para dibujar con escalado
function drawScaled(image, sx, sy, sw, sh, dx, dy, dw, dh) {
  ctx.drawImage(
    image,
    sx, sy, sw, sh,
    offsetX + dx * scale,
    offsetY + dy * scale,
    dw * scale,
    dh * scale
  );
}

function fillRectScaled(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(
    offsetX + x * scale,
    offsetY + y * scale,
    width * scale,
    height * scale
  );
}

function fillTextScaled(text, x, y, fontSize = 14) {
  const scaledFontSize = Math.max(8, fontSize * scale);
  ctx.font = `${scaledFontSize}px monospace`;
  ctx.fillText(
    text,
    offsetX + x * scale,
    offsetY + y * scale
  );
}

// ---------- FUNCIONES DE PANTALLA COMPLETA ----------
function enterFullscreen() {
  if (!isFullscreen) {
    const elem = document.documentElement;

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }

    isFullscreen = true;
    document.body.classList.add('fullscreen');
    document.getElementById('fullscreenIndicator').style.display = 'block';

    setTimeout(setupCanvas, 100);
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }

  isFullscreen = false;
  document.body.classList.remove('fullscreen');
  document.getElementById('fullscreenIndicator').style.display = 'none';

  setTimeout(setupCanvas, 100);
}

function toggleFullscreen() {
  if (!isFullscreen) {
    enterFullscreen();
  } else {
    exitFullscreen();
  }
}

// Detectar cambios de pantalla completa
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('msfullscreenchange', handleFullscreenChange);

function handleFullscreenChange() {
  const isCurrentlyFullscreen = !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
  );

  if (isCurrentlyFullscreen !== isFullscreen) {
    isFullscreen = isCurrentlyFullscreen;
    document.body.classList.toggle('fullscreen', isFullscreen);
    document.getElementById('fullscreenIndicator').style.display = isFullscreen ? 'block' : 'none';

    setTimeout(setupCanvas, 100);
  }
}

// ---------- INICIO DEL JUEGO ----------
function startGame() {

  AudioManager.init();
  AudioManager.playMusic();

  interactStar.init();


  // Ocultar modal
  document.getElementById('welcomeModal').style.display = 'none';

  // Mostrar instrucciones
  document.querySelector('.instructions').style.display = 'block';

  // Configurar canvas
  setupCanvas();

  // Iniciar en pantalla completa después de un breve delay
  setTimeout(() => {
    enterFullscreen();
  }, 300);
}

// ---------- INPUT HANDLING ----------
window.addEventListener("keydown", e => {
  keys[e.key] = true;

  // Tecla F para pantalla completa
  if (e.key === "f" || e.key === "F") {
    e.preventDefault();
    toggleFullscreen();
  }

  if ((e.key === "e" || e.key === "E") && canInteract && nearbyObject) {
    const action = nearbyObject.properties?.find(p => p.name === "action")?.value;
    if (action) handleAction(action);
    canInteract = false;
  }
});

window.addEventListener("keyup", e => {
  keys[e.key] = false;
  if (e.key === "e" || e.key === "E") canInteract = true;
});

// Inicializar
window.addEventListener('load', function () {
  setupCanvas();
});

// ---------- LOAD MAP ----------
fetch("map/room.tmj")
  .then(res => res.json())
  .then(data => {
    const triggers = data.layers.find(l => l.name === "triggers")?.objects || [];
    collisionObjects = data.layers.find(l => l.name === "collisions")?.objects || [];
    interactables = data.layers.find(l => l.name === "interactables")?.objects || [];

    const TMJ_WIDTH = data.width * data.tilewidth;
    const TMJ_HEIGHT = data.height * data.tileheight;

    if (TMJ_WIDTH !== GAME_WIDTH || TMJ_HEIGHT !== GAME_HEIGHT) {
      const scaleX = GAME_WIDTH / TMJ_WIDTH;
      const scaleY = GAME_HEIGHT / TMJ_HEIGHT;

      collisionObjects = collisionObjects.map(obj => ({
        x: Math.round(obj.x * scaleX),
        y: Math.round(obj.y * scaleY),
        width: Math.round(obj.width * scaleX),
        height: Math.round(obj.height * scaleY),
        properties: obj.properties || []
      }));

      interactables = interactables.map(obj => ({
        x: Math.round(obj.x * scaleX),
        y: Math.round(obj.y * scaleY),
        width: Math.round(obj.width * scaleX),
        height: Math.round(obj.height * scaleY),
        properties: obj.properties || []
      }));
    }

    mapLoaded = true;
  });

// ---------- COLLISIONS ----------
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  // Aumenta el rango de detección
  const margin = 10;
  return ax < bx + bw + margin &&
    ax + aw + margin > bx &&
    ay < by + bh + margin &&
    ay + ah + margin > by;
}

function collidesAt(x, y) {
  return collisionObjects.some(o =>
    rectsOverlap(x, y, player.width, player.height, o.x, o.y, o.width, o.height)
  );
}
function getNearbyInteractable() {
  for (let i = 0; i < interactables.length; i++) {
    const obj = interactables[i];

    if (
      rectsOverlap(
        player.x, player.y, player.width, player.height,
        obj.x, obj.y, obj.width, obj.height
      )
    ) {
      return obj;
    }
  }
  return null;
}


// ---------- UPDATE ----------

function update() {
  if (!mapLoaded) return;

  let dx = 0;
  let dy = 0;
  let moving = false;

  if (keys["ArrowUp"] || keys["w"]) {
    dy -= player.speed;
    direction = "up";
    moving = true;
  }
  if (keys["ArrowDown"] || keys["s"]) {
    dy += player.speed;
    direction = "down";
    moving = true;
  }
  if (keys["ArrowLeft"] || keys["a"]) {
    dx -= player.speed;
    direction = "left";
    moving = true;
  }
  if (keys["ArrowRight"] || keys["d"]) {
    dx += player.speed;
    direction = "right";
    moving = true;
  }

  const nextX = Math.max(0, Math.min(player.x + dx, MAP_WIDTH - player.width));
  const nextY = Math.max(0, Math.min(player.y + dy, MAP_HEIGHT - player.height));

  if (dx !== 0 && !collidesAt(nextX, player.y)) player.x = nextX;
  if (dy !== 0 && !collidesAt(player.x, nextY)) player.y = nextY;

  if (moving) {
    AudioManager.playStep();
    frameTimer++;
    if (frameTimer >= frameSpeed) {
      frame = (frame + 1) % framesPerRow;
      frameTimer = 0;
    }
  } else {
    frame = 0;
  }

  nearbyObject = getNearbyInteractable();
}


// ---------- SONIDO ----------

const soundToggle = document.getElementById("soundToggle");

soundToggle.addEventListener("click", () => {
  AudioManager.toggleSound();
  soundToggle.classList.toggle("off", !AudioManager.enabled);
  soundToggle.textContent = AudioManager.enabled ? "🔊 SONIDO" : "🔇 SONIDO";
});

// ---------- DRAW FUNCTIONS ----------
function drawRoom() {
  // Dibujar fondo negro primero
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Elegir imagen según mapa actual
  if (currentMap === "room") {
    drawScaled(room, 0, 0, room.width, room.height, 0, 0, GAME_WIDTH, GAME_HEIGHT);
  } else if (currentMap === "outside") {
    drawScaled(exteriorBg, 0, 0, exteriorBg.width, exteriorBg.height, 0, 0, GAME_WIDTH, GAME_HEIGHT);
  }
}

function drawPlayer() {
  const SPRITE_SIZE = 96;
  const rowMap = { down: 0, up: 1, left: 2, right: 3 };
  const row = rowMap[direction];

  const offsetSpriteX = (SPRITE_SIZE - player.width) / 2;
  const offsetSpriteY = SPRITE_SIZE - player.height;

  drawScaled(
    playerSprite,
    frame * SPRITE_SIZE,
    row * SPRITE_SIZE,
    SPRITE_SIZE,
    SPRITE_SIZE,
    player.x - offsetSpriteX,
    player.y - offsetSpriteY,
    SPRITE_SIZE,
    SPRITE_SIZE
  );
}

function drawInteractHint() {
  if (!nearbyObject) return;

  const action = nearbyObject.properties?.find(p => p.name === "action")?.value;

  // Texto según la acción
  let text = "E";
  if (action === "exit-outside") text = "Salir fuera (E)";
  if (action === "enter-room") text = "Entrar (E)";

  const padding = 6;
  ctx.font = `${Math.max(10, 12 * scale)}px monospace`;
  const textWidth = ctx.measureText(text).width / scale;
  const boxWidth = textWidth + padding * 2;
  const boxHeight = 20;

  const x = nearbyObject.x + nearbyObject.width / 2 - boxWidth / 2;
  const y = nearbyObject.y - boxHeight - 10;

  // Fondo
  fillRectScaled(x, y, boxWidth, boxHeight, "rgba(0,0,0,0.7)");
  // Borde
  fillRectScaled(x - 1, y - 1, boxWidth + 2, boxHeight + 2, "#ffd500");

  // Texto
  ctx.fillStyle = "#5e003a";
  ctx.textAlign = "center";
  fillTextScaled(
    text,
    nearbyObject.x + nearbyObject.width / 2,
    y + 14,
    12
  );
  ctx.textAlign = "left";
}


// ---------- GAME LOOP ----------

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawRoom();
  update();
  drawInteractHint();
  drawPlayer();

  //  INTERIOR → estrellas fijas
  if (currentMap === "room") {
    interactStar.update();
    interactStar.drawAll(ctx, scale, offsetX, offsetY);
  }

  //  EXTERIOR → solo objetos con sparkle
  if (currentMap === "outside") {
    interactStar.update();

    interactables.forEach(obj => {
      const hasSparkle = obj.properties?.find(p => p.name === "sparkle")?.value;
      if (hasSparkle) {
        interactStar.drawAt(
          ctx,
          obj.x + obj.width / 2,
          obj.y - 10,
          scale,
          offsetX,
          offsetY
        );
      }
    });
  }

  requestAnimationFrame(gameLoop);
}


// ---------- START ----------
room.onload = () => {
  console.log(`Imagen sala cargada: ${room.width}x${room.height}`);

  // Verificar que coincida con nuestro tamaño esperado
  if (room.width !== GAME_WIDTH || room.height !== GAME_HEIGHT) {
    console.warn(`ADVERTENCIA: Tamaño de imagen (${room.width}x${room.height}) no coincide con juego (${GAME_WIDTH}x${GAME_HEIGHT})`);
  }

  // Iniciar el bucle del juego
  gameLoop();
};

// AGREGAR ESTO PARA LA IMAGEN EXTERIOR
exteriorBg.onload = () => {
  console.log(`Imagen exterior cargada: ${exteriorBg.width}x${exteriorBg.height}`);
};

// Event listener para redimensionar
window.addEventListener('resize', setupCanvas);

// ---------- OVERLAY LOGIC ----------
const overlay = document.getElementById("overlay");
const overlayBody = document.getElementById("overlayBody");
const closeOverlayBtn = document.getElementById("closeOverlay");

// ABRIR
function openOverlay(html) {
  AudioManager.lowerMusic(); // ✔️ solo baja volumen
  overlayBody.innerHTML = html;
  overlay.classList.remove("hidden");
  overlay.classList.add("show");
}

// CERRAR
function closeOverlay() {
  overlay.classList.remove("show");

  AudioManager.restoreMusic(); //  vuelve volumen
  setTimeout(() => {
    overlay.classList.add("hidden");
    overlayBody.innerHTML = "";
  }, 300);
}


// BOTÓN X
closeOverlayBtn.addEventListener("click", closeOverlay);

// ESC
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeOverlay();
});

// CLIC FUERA
overlay.addEventListener("click", (e) => {
  if (e.target.id === "overlay") {
    closeOverlay();
  }
});

// ------------------------------------------------------------------------------

const imageViewer = document.getElementById("imageViewer");
const imageViewerImg = document.getElementById("imageViewerImg");
const closeImageBtn = document.querySelector(".close-image");

function openImage(src) {
  imageViewerImg.src = src;
  imageViewer.classList.add("show");
  imageViewer.classList.remove("hidden");
}

function closeImage() {
  imageViewer.classList.remove("show");
  setTimeout(() => {
    imageViewer.classList.add("hidden");
    imageViewerImg.src = "";
  }, 300);
}

closeImageBtn.addEventListener("click", closeImage);

window.addEventListener("keydown", e => {
  if (e.key === "Escape") closeImage();
});

imageViewer.addEventListener("click", e => {
  if (e.target === imageViewer) closeImage();
});

// ---------- CAMBIAR MAPA ----------
function changeMap(mapName) {
  mapLoaded = false;

  const previousMap = currentMap;
  lastMap = previousMap;
  currentMap = mapName;

  if (mapName === "outside") {
    loadMap("map/outside.tmj");

    player.x = OUTSIDE_SPAWN_DOOR.x;
    player.y = OUTSIDE_SPAWN_DOOR.y;
  }

  if (mapName === "room") {
    loadMap("map/room.tmj");

    if (lastMap === null) {
      player.x = ROOM_SPAWN_CENTER.x;
      player.y = ROOM_SPAWN_CENTER.y;
    } else if (lastMap === "outside") {
      player.x = ROOM_SPAWN_DOOR.x;
      player.y = ROOM_SPAWN_DOOR.y;
    }
  }

  if (collidesAt(player.x, player.y)) {
    player.y += 30;
  }
}




function loadMap(path) {
  fetch(path)
    .then(res => res.json())
    .then(data => {

      // Capas principales
      collisionObjects = data.layers.find(l => l.name === "collisions")?.objects || [];
      interactables = data.layers.find(l => l.name === "interactables")?.objects || [];

      // Tamaño real del mapa TMJ
      const TMJ_WIDTH = data.width * data.tilewidth;
      const TMJ_HEIGHT = data.height * data.tileheight;

      // Escalado si el TMJ no coincide con el canvas del juego
      if (TMJ_WIDTH !== GAME_WIDTH || TMJ_HEIGHT !== GAME_HEIGHT) {
        const scaleX = GAME_WIDTH / TMJ_WIDTH;
        const scaleY = GAME_HEIGHT / TMJ_HEIGHT;

        collisionObjects = collisionObjects.map(obj => ({
          x: Math.round(obj.x * scaleX),
          y: Math.round(obj.y * scaleY),
          width: Math.round(obj.width * scaleX),
          height: Math.round(obj.height * scaleY),
          properties: obj.properties || []
        }));

        interactables = interactables.map(obj => ({
          x: Math.round(obj.x * scaleX),
          y: Math.round(obj.y * scaleY),
          width: Math.round(obj.width * scaleX),
          height: Math.round(obj.height * scaleY),
          properties: obj.properties || []
        }));
      }

      mapLoaded = true;
    })
    .catch(error => {
      console.error(` Error cargando mapa: ${path}`, error);
    });
}


// ===============================
// HANDLE ACTION 
// ===============================

function handleAction(action) {
  switch (action) {

    // ===============================
    //  PROYECTOS (GITHUB)
    // ===============================
    case "projects-pc":
      AudioManager.play("keyboard");
      openOverlay(`
        <h2> PROYECTOS</h2>

        <div class="grid grid-2">

          <!-- iMirly -->
          <div class="card">
            <img src="assets/img/AppImirly.jpg" onclick="openImage(this.src)" alt="iMirly App">
            <h3>IMIRLY</h3>
            <p>Marketplace de servicios locales para Android y Web.</p>
            <div class="tags">
              <span class="tag">Android</span>
              <span class="tag">Kotlin</span>
              <span class="tag">UX</span>
              <span class="tag">UI</span>
            </div>
            <a href="https://github.com/AnaNunezRejon" target="_blank">
              Ver en GitHub →
            </a>
          </div>

          <!-- No Lo Tiro -->
          <div class="card">
            <img src="assets/img/NoLoTiroApp.jpg" onclick="openImage(this.src)" alt="No Lo Tiro App">
            <h3>NO LO TIRO</h3>
            <p>App para reutilización y consumo responsable.</p>
            <div class="tags">
              <span class="tag">Android</span>
              <span class="tag">Kotlin</span>
              <span class="tag">UI</span>
            </div>
            <a href="https://www.figma.com/" target="_blank">
              Ver en Figma →
            </a>
          </div>

          <!-- Notas App -->
          <div class="card">
            <img src="assets/img/NotasApp.jpg" onclick="openImage(this.src)" alt="Notas App">
            <h3>NOTAS APP</h3>
            <p>Aplicación de notas con arquitectura MVVM.</p>
            <div class="tags">
              <span class="tag">Android</span>
              <span class="tag">MVVM</span>
              <span class="tag">Java</span>
            </div>
            <a href="https://github.com/AnaNunezRejon" target="_blank">
              Ver en GitHub →
            </a>
          </div>

          <!-- Pokédex -->
          <div class="card">
            <img src="assets/img/Pokedex.jpg" onclick="openImage(this.src)" alt="Pokédex">
            <h3>POKÉDEX</h3>
            <p>Diseño y maquetación estilo videojuego retro.</p>
            <div class="tags">
              <span class="tag">Android</span>
              <span class="tag">Diseño</span>
              <span class="tag">Java</span>
            </div>
            <a href="https://github.com/AnaNunezRejon" target="_blank">
              Ver en GitHub →
            </a>
          </div>

          <!-- Rebranding Joyería -->
          <div class="card">
            <img src="assets/img/RebrandingJoyas.jpg" onclick="openImage(this.src)" alt="Rebranding Joyería">
            <h3>REBRANDING JOYERÍA</h3>
            <p>Identidad visual y rediseño web completo.</p>
            <div class="tags">
              <span class="tag">Branding</span>
              <span class="tag">Diseño</span>
              <span class="tag">Web</span>
            </div>
            <a href="https://www.figma.com/" target="_blank">
              Ver en Figma →
            </a>
          </div>

          <!-- Proyecto Extra -->
          <div class="card">
            <img src="assets/img/placeholder.jpg" onclick="openImage(this.src)" alt="Proyecto Extra">
            <h3>PORTFOLIO WEB</h3>
            <p>Sitio web personal con diseño pixel art interactivo.</p>
            <div class="tags">
              <span class="tag">HTML/CSS</span>
              <span class="tag">JS</span>
              <span class="tag">Pixel Art</span>
            </div>
            <a href="https://github.com/AnaNunezRejon" target="_blank">
              Ver en GitHub →
            </a>
          </div>

        </div>
      `);
      break;

    case "projects-design":
      AudioManager.play("tv");
      openOverlay(`
    <h2 style="font-size: 16px; margin-bottom: 25px; text-align: center;">PROYECTOS DE DISEÑO</h2>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <p style="font-size: 12px; line-height: 1.6; color: var(--pixel-text); max-width: 600px; margin: 0 auto;">
        Explora mi portfolio de diseño gráfico, branding, UI/UX y experiencia de usuario. 
        Cada proyecto representa soluciones creativas centradas en el usuario.
      </p>
    </div>
    
    <div class="grid grid-2" style="gap: 20px; margin-bottom: 30px;">
      <!-- Proyecto 1: Branding -->
      <div class="card" style="padding: 20px;">
        <h3 style="font-size: 13px; margin-bottom: 15px; color: var(--pixel-accent);">BRANDING & IDENTIDAD</h3>
        <div style="margin-bottom: 15px;">
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px;">
            <span class="tag" style="font-size: 9px;">Logotipos</span>
            <span class="tag" style="font-size: 9px;">Manuales</span>
            <span class="tag" style="font-size: 9px;">Packaging</span>
            <span class="tag" style="font-size: 9px;">Identidad</span>
          </div>
        </div>
        <p style="font-size: 11px; line-height: 1.7;">Creación de identidades visuales coherentes y memorables para marcas.</p>
      </div>
      
      <!-- Proyecto 2: UI Design -->
      <div class="card" style="padding: 20px;">
        <h3 style="font-size: 13px; margin-bottom: 15px; color: var(--pixel-accent);">UI DESIGN</h3>
        <div style="margin-bottom: 15px;">
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px;">
            <span class="tag" style="font-size: 9px;">Interfaces</span>
            <span class="tag" style="font-size: 9px;">Web Apps</span>
            <span class="tag" style="font-size: 9px;">Mobile Apps</span>
            <span class="tag" style="font-size: 9px;">Prototipos</span>
          </div>
        </div>
        <p style="font-size: 11px; line-height: 1.7;">Diseño de interfaces intuitivas, atractivas y funcionales.</p>
      </div>
    </div>
    
    <!-- UX & Experiencia de Usuario -->
    <div class="card" style="margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, var(--pixel-card) 0%, #2a1a3d 100%);">
      <h3 style="font-size: 13px; margin-bottom: 15px; color: var(--pixel-border);">UX & EXPERIENCIA DE USUARIO</h3>
      <div style="display: flex; align-items: center; gap: 20px;">
        <div style="flex: 1;">
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 15px;">
            <span class="tag" style="font-size: 9px; background: var(--pixel-border-dark);">Research</span>
            <span class="tag" style="font-size: 9px; background: var(--pixel-border-dark);">User Testing</span>
            <span class="tag" style="font-size: 9px; background: var(--pixel-border-dark);">Wireframes</span>
            <span class="tag" style="font-size: 9px; background: var(--pixel-border-dark);">Flujos</span>
            <span class="tag" style="font-size: 9px; background: var(--pixel-border-dark);">Personas</span>
          </div>
          <p style="font-size: 11px; line-height: 1.7;">
            Diseño centrado en el usuario: investigación, testing, arquitectura de información 
            y optimización de flujos para mejorar la experiencia completa.
          </p>
        </div>
        
        </div>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 10px;">
      <a href="https://www.behance.net/ananunezrejon" target="_blank" class="pixel-btn" style="font-size: 12px; padding: 14px 30px; background: linear-gradient(135deg, #0057FF 0%, #00B2FF 100%);">
        VER PORTFOLIO EN BEHANCE
      </a>
      <p style="font-size: 10px; margin-top: 15px; color: var(--pixel-text); opacity: 0.8;">
        behance.net/ananunezrejon
      </p>
    </div>
  `);
      break;

    // ===============================
    // FIGMA / DISEÑO
    // ===============================
    case "figma":
      openOverlay(`
        <h2> DISEÑO UI/UX</h2>

        <div class="grid grid-3">

          <div class="card">
            <img src="assets/img/figma-imirlly.png" onclick="openImage(this.src)" alt="iMirly Figma">
            <h3>IMIRLY APP</h3>
            <p>Diseño completo de app de servicios locales.</p>
            <div class="tags">
              <span class="tag">Figma</span>
              <span class="tag">Mobile</span>
            </div>
          </div>

          <div class="card">
            <img src="assets/img/sama.png" onclick="openImage(this.src)" alt="Sama Vintage">
            <h3>SAMA VINTAGE</h3>
            <p>Rebranding y tienda online para marca vintage.</p>
            <div class="tags">
              <span class="tag">Branding</span>
              <span class="tag">E-commerce</span>
            </div>
          </div>

          <div class="card">
            <img src="assets/img/portfolio.png" onclick="openImage(this.src)" alt="Portfolio">
            <h3>PORTFOLIO</h3>
            <p>Diseño web personal con estética pixel art.</p>
            <div class="tags">
              <span class="tag">Web</span>
              <span class="tag">Pixel Art</span>
            </div>
          </div>

          <div class="card">
            <img src="assets/img/placeholder.jpg" onclick="openImage(this.src)" alt="UI Kit">
            <h3>UI KIT PIXEL</h3>
            <p>Kit de componentes para diseño retro.</p>
            <div class="tags">
              <span class="tag">Design System</span>
              <span class="tag">Components</span>
            </div>
          </div>

          <div class="card">
            <img src="assets/img/placeholder.jpg" onclick="openImage(this.src)" alt="Game UI">
            <h3>GAME UI</h3>
            <p>Interfaces para videojuegos estilo retro.</p>
            <div class="tags">
              <span class="tag">Game Design</span>
              <span class="tag">UI</span>
            </div>
          </div>

          <div class="card">
            <img src="assets/img/placeholder.jpg" onclick="openImage(this.src)" alt="Mobile Apps">
            <h3>MOBILE APPS</h3>
            <p>Colección de diseños para aplicaciones móviles.</p>
            <div class="tags">
              <span class="tag">iOS</span>
              <span class="tag">Android</span>
            </div>
          </div>

        </div>

        <div style="margin-top: 24px; text-align: center;">
          <a href="https://www.behance.net/ananunezrejon" target="_blank" class="pixel-btn">
            VER MÁS EN BEHANCE →
          </a>
        </div>
      `);
      break;

    // ===============================
    // SOBRE MÍ / SOFT SKILLS
    // ===============================
    case "softskills":
      AudioManager.play("sit");
      openOverlay(`
        <h2>SOBRE MÍ</h2>

        <div class="card" style="margin-bottom: 24px;">
          <p>
            <strong>DISEÑADORA GRÁFICA + DESARROLLADORA DAM</strong><br>
            Diseñadora gráfica con más de 11 años de experiencia liderando proyectos de branding y estrategia digital. Actualmente cursando Desarrollo de Aplicaciones Multiplataforma (DAM).
Busco prácticas donde aportar mi perspectiva creativa y mi capacidad de aprendizaje rápido a un equipo de desarrollo. Motivada por resolver problemas, aprender tecnologías nuevas y contribuir en proyectos desafiantes.
          </p>
        </div>

        <div class="grid grid-3">

          <div class="card">
            <h3>CREATIVIDAD</h3>
            <p>Conceptual y visual con enfoque innovador.</p>
          </div>

          <div class="card">
            <h3>UX THINKING</h3>
            <p>Diseño centrado en experiencia de usuario.</p>
          </div>

          <div class="card">
            <h3>RESOLUCIÓN</h3>
            <p>Soluciones prácticas y eficientes.</p>
          </div>

          <div class="card">
            <h3>TRABAJO EN EQUIPO</h3>
            <p>Colaboración en entornos multidisciplinares.</p>
          </div>

          <div class="card">
            <h3>COMUNICACIÓN</h3>
            <p>Ideas claras tanto visuales como verbales.</p>
          </div>

          <div class="card">
            <h3>AUTONOMÍA</h3>
            <p>Gestión y ejecución de proyectos propios.</p>
          </div>

          <div class="card">
            <h3>ADAPTABILIDAD</h3>
            <p>Rápido aprendizaje de nuevas tecnologías.</p>
          </div>

          <div class="card">
            <h3>ATENCIÓN AL DETALLE</h3>
            <p>Diseño pulido y cuidadosamente elaborado.</p>
          </div>

          <div class="card">
            <h3>PASIÓN POR LO RETRO</h3>
            <p>Amor por la estética pixel art y videojuegos clásicos.</p>
          </div>

        </div>
      `);
      break;

    // ===============================
    // FORMACIÓN
    // ===============================
    case "education":
      AudioManager.play("book");
      openOverlay(`
    <h2>FORMACIÓN</h2>

    <div class="grid grid-2">

      <div class="card">
        <h3>Licenciatura en Bellas Artes</h3>
        <p><strong>Universidad de Granada</strong></p>
        <p>2004 – 2009</p>
        <p>Formación artística integral: dibujo, pintura, escultura, composición, color y creatividad visual.</p>
        <div class="tags">
          <span class="tag">Arte</span>
          <span class="tag">Diseño</span>
        </div>
      </div>

      <div class="card">
        <h3>Grado Superior en Diseño Gráfico</h3>
        <p><strong>Escuela de Arte de Granada</strong></p>
        <p>2007 – 2009</p>
        <p>Diseño gráfico, identidad visual, branding y diseño editorial.</p>
        <div class="tags">
          <span class="tag">Branding</span>
          <span class="tag">Editorial</span>
        </div>
      </div>

      <div class="card">
        <h3>Máster Oficial en Dibujo: Creación, Producción y Difusión</h3>
        <p><strong>Facultad de Bellas Artes | Granada</strong></p>
        <p>2011 – 2012</p>
        <p>Especialización en procesos creativos, producción artística y difusión cultural.</p>
        <div class="tags">
          <span class="tag">Arte</span>
          <span class="tag">Producción</span>
        </div>
      </div>

      <div class="card">
        <h3>Máster en Diseño Web</h3>
        <p><strong>Estación Diseño | Granada</strong></p>
        <p>2017 – 2018 · 1500 horas</p>
        <p>Diseño y desarrollo de sitios web, UX/UI, branding digital y WordPress.</p>
        <div class="tags">
          <span class="tag">Diseño Web</span>
          <span class="tag">UX/UI</span>
          <span class="tag">WordPress</span>
        </div>
      </div>

      <div class="card">
        <h3>Máster Full Stack Developer</h3>
        <p><strong>UNIR</strong></p>
        <p>2023 – 2024 · 1500 horas</p>
        <p>Desarrollo web full stack: frontend, backend, bases de datos y despliegue.</p>
        <div class="tags">
          <span class="tag">Web</span>
          <span class="tag">Full Stack</span>
        </div>
      </div>

      <div class="card">
        <h3>Curso Front-End HTML y CSS</h3>
        <p><strong>UNIR</strong></p>
        <p>2023 · 125 horas</p>
        <p>Maquetación web, HTML5, CSS3 y diseño responsive.</p>
        <div class="tags">
          <span class="tag">HTML</span>
          <span class="tag">CSS</span>
        </div>
      </div>

      <div class="card">
        <h3>FP Desarrollo de Aplicaciones Multiplataforma (DAM)</h3>
        <p><strong>New Digital Talent | Granada</strong></p>
        <p>2024 – Actualidad</p>
        <p>Desarrollo de aplicaciones Android y Web, programación y bases de datos.</p>
        <div class="tags">
          <span class="tag">Programación</span>
          <span class="tag">Android</span>
        </div>
      </div>

      <div class="card">
        <h3>Certificado Profesional Google UX/UI Design</h3>
        <p><strong>Coursera · Google</strong></p>
        <p>Formación profesional en diseño UX/UI</p>
        <p>Investigación de usuarios, wireframes, prototipos y testing.</p>
        <div class="tags">
          <span class="tag">UX/UI</span>
          <span class="tag">Figma</span>
          <span class="tag">User Testing</span>
        </div>
      </div>

      <div class="card">
        <h3>Formación continua</h3>
        <p>Actualización constante en diseño y desarrollo.</p>
        <p>UX/UI, Figma, JavaScript, Android, Pixel Art.</p>
        <div class="tags">
          <span class="tag">Autoaprendizaje</span>
          <span class="tag">Cursos</span>
        </div>
      </div>

    </div>
  `);
      break;


    // ===============================
    //  HERRAMIENTAS
    // ===============================
    case "tools-develop":
      AudioManager.play("microwave");
      openOverlay(`
    <h2 style="font-size: 16px; margin-bottom: 25px;">🖥️ HERRAMIENTAS DE DESARROLLO</h2>
    
    <div class="grid grid-2" style="gap: 20px;">
      <!-- Frontend -->
      <div class="card" style="padding: 20px;">
        <h3 style="font-size: 13px; margin-bottom: 15px;">FRONTEND</h3>
        <div class="tags" style="margin-bottom: 15px;">
          <span class="tag" style="font-size: 10px; padding: 5px 8px;">HTML5</span>
          <span class="tag" style="font-size: 10px; padding: 5px 8px;">CSS3</span>
          <span class="tag" style="font-size: 10px; padding: 5px 8px;">JavaScript</span>
          <span class="tag" style="font-size: 10px; padding: 5px 8px;">Angular</span>
        </div>
        <p style="font-size: 11px; line-height: 1.8;">Desarrollo de interfaces modernas, responsivas y aplicaciones web.</p>
      </div>
      
      <!-- Backend -->
      <div class="card" style="padding: 20px;">
        <h3 style="font-size: 13px; margin-bottom: 15px;">BACKEND & DATABASES</h3>
        <div class="tags" style="margin-bottom: 15px;">
          <span class="tag" style="font-size: 10px; padding: 5px 8px;">Node.js</span>
                    <span class="tag" style="font-size: 10px; padding: 5px 8px;">MySQL</span>
          <span class="tag" style="font-size: 10px; padding: 5px 8px;">MongoDB</span>
        </div>
        <p style="font-size: 11px; line-height: 1.8;">APIs, bases de datos, servidores y lógica de negocio.</p>
      </div>
    </div>
    
    <!-- Desarrollo Móvil -->
    <div class="card" style="margin-top: 20px; padding: 20px;">
      <h3 style="font-size: 13px; margin-bottom: 15px;">DESARROLLO MÓVIL</h3>
      <div class="tags" style="margin-bottom: 15px;">
        <span class="tag" style="font-size: 10px; padding: 5px 8px;">Android Studio</span>
        <span class="tag" style="font-size: 10px; padding: 5px 8px;">Java</span>
        <span class="tag" style="font-size: 10px; padding: 5px 8px;">Kotlin</span>
        <span class="tag" style="font-size: 10px; padding: 5px 8px;">Jetpack Compose</span>
        <span class="tag" style="font-size: 10px; padding: 5px 8px;">Firebase</span>
      </div>
      <p style="font-size: 11px; line-height: 1.8;">Desarrollo nativo de aplicaciones Android con arquitecturas modernas.</p>
    </div>
    
    <div style="margin-top: 30px; text-align: center;">
      <a href="https://github.com/tu-usuario" target="_blank" class="pixel-btn" style="font-size: 11px; padding: 12px 24px;">VER GITHUB</a>
    </div>
  `);
      break;

    case "tools-design":
      AudioManager.play("fridgeOpen");
      openOverlay(`
    <h2> HERRAMIENTAS DE DISEÑO</h2>
    
    <div class="grid grid-2">
      <div class="card">
        <h3 style="font-size: 12px;"> ADOBE SUITE</h3>
        <div class="tags">
          <span class="tag" style="font-size: 9px;">Photoshop</span>
          <span class="tag" style="font-size: 9px;">Illustrator</span>
          <span class="tag" style="font-size: 9px;">InDesign</span>
          <span class="tag" style="font-size: 9px;">XD</span>
        </div>
        <p style="font-size: 10px; line-height: 1.8;">Diseño gráfico profesional y edición digital.</p>
      </div>
      
      <div class="card">
        <h3 style="font-size: 12px;"> UI/UX</h3>
        <div class="tags">
          <span class="tag" style="font-size: 9px;">Figma</span>
          <span class="tag" style="font-size: 9px;">Sketch</span>
          <span class="tag" style="font-size: 9px;">Prototipado</span>
          <span class="tag" style="font-size: 9px;">Wireframes</span>
        </div>
        <p style="font-size: 10px; line-height: 1.8;">Diseño de interfaces y experiencias de usuario.</p>
      </div>
    </div>
    
    <div style="margin-top: 30px; text-align: center;">
      <a href="portfolio.html" class="pixel-btn" style="font-size: 11px; padding: 12px 24px;">VER PORTFOLIO</a>
    </div>
  `);
      break;

    case "tools":
      AudioManager.play("water");
      openOverlay(`
        <h2> TECNOLOGÍAS</h2>

        <div class="grid grid-3">
          <div class="card">
            <h3>JAVA</h3>
            <p>Desarrollo Android nativo.</p>
          </div>
          
          <div class="card">
            <h3>ANDROID</h3>
            <p>Studio, Kotlin, Jetpack.</p>
          </div>
          
          <div class="card">
            <h3>JAVASCRIPT</h3>
            <p>Frontend y lógica web.</p>
          </div>
          
          <div class="card">
            <h3>HTML/CSS</h3>
            <p>Maquetación web moderna.</p>
          </div>
          
          <div class="card">
            <h3>FIGMA</h3>
            <p>Diseño UI/UX y prototipado.</p>
          </div>
          
          <div class="card">
            <h3>GITHUB</h3>
            <p>Control de versiones y colaboración.</p>
          </div>
          
          <div class="card">
            <h3>PIXEL ART</h3>
            <p>Aseprite, Piskel, Photoshop.</p>
          </div>
          
          <div class="card">
            <h3>ADOBE CC</h3>
            <p>Photoshop, Illustrator, InDesign.</p>
          </div>
          
          <div class="card">
            <h3>SQL</h3>
            <p>Bases de datos y consultas.</p>
          </div>
        </div>
      `);
      break;

    case "exit-outside":
      changeMap("outside");
      break;

    case "enter-room":
      changeMap("room");
      break;

    // ===============================
    // CONTACTO
    // ===============================
    case "contact":
      AudioManager.play("keys");
      openOverlay(`
    <div style="color: #c0a0e0;">  <!-- Morado más oscuro -->
      <h2 style="color: #ffe3ff;">📞 CONTACTO</h2>

      <div class="card" style="margin-bottom: 24px;">
        <h3 style="color: #ffe3ff;">ANA NÚÑEZ REJÓN</h3>
        <p style="color: #c0a0e0;">Diseñadora Gráfica · Desarrolladora DAM</p>
        
        <div class="pixel-list">
          <li>678 617 201</li>
          <li>Granada, España</li>
          <li>
            ✉️ <a href="mailto:ananunezrejon@gmail.com" 
                  style="color: #3d0a6fff; text-decoration: none;">
              ananunezrejon@gmail.com
            </a>
          </li>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <a href="https://github.com/AnaNunezRejon" target="_blank" 
             style="text-decoration: none; display: block;">
            <h3 style="color: #ffe3ff;"> GITHUB</h3>
            <p style="color: #3d0a6fff;">Ver proyectos de código</p>
          </a>
        </div>
        
        <div class="card">
          <a href="https://www.linkedin.com/in/ananuñezrejon" target="_blank" 
             style="text-decoration: none; display: block;">
            <h3 style="color: #ffe3ff;"> LINKEDIN</h3>
            <p style="color: #3d0a6fff;">Conectar profesionalmente</p>
          </a>
        </div>
        
        <div class="card">
          <a href="https://www.behance.net/ananunezrejon" target="_blank" 
             style="text-decoration: none; display: block;">
            <h3 style="color: #ffe3ff;"> BEHANCE</h3>
            <p style="color: #3d0a6fff;">Ver portfolio de diseño</p>
          </a>
        </div>
        
       <div class="card">
  <a href="assets/Curriculum_AnaNunezRejon_2026.pdf"
     download="Curriculum_Ana_Nunez_Rejon_2026.pdf"
     style="text-decoration: none; display: block;">

    <h3 style="color: #ffe3ff;">DESCARGAR CV</h3>
    <p style="color: #3d0a6fff;">PDF completo</p>

  </a>
</div>
      </div>

      <div style="margin-top: 24px; text-align: center;">
        <p style="font-size: 9px; color: #c0a0e0; opacity: 0.8;">
          ¡Diseñemos algo increíble juntos!
        </p>
      </div>
    </div>
  `);
      break;

    case "mailbox":
      AudioManager.play("paper");
      openOverlay(`
    <h2>CARTA DE PRESENTACIÓN</h2>

    <div class="letter">
      <p class="letter-text">
        Hola,<br><br>

        Soy Ana, diseñadora gráfica y desarrolladora en formación.
        A lo largo de mi trayectoria he trabajado principalmente en el ámbito del diseño,
        lo que me ha permitido desarrollar una base visual sólida y una forma de trabajar
        creativa y estructurada.
        <br><br>

        Actualmente me estoy formando en Desarrollo de Aplicaciones Multiplataforma (DAM),
        con el objetivo de ampliar mis competencias técnicas y crear proyectos digitales
        donde diseño y desarrollo convivan de forma coherente.
        <br><br>

        Este portfolio es una pequeña representación de mi perfil profesional y personal,
        y de mi manera de entender el trabajo: con calma, curiosidad y ganas de seguir aprendiendo.
        <br><br>

        Gracias por tu tiempo.
      </p>

      <p class="letter-sign">
        — Ana Núñez Rejón
      </p>
    </div>
  `);
      break;

case "about-me":
  openOverlay(`
    <h2> UN DESCANSO</h2>

    <div class="card" style="line-height: 1.7;">
      <p>
        A veces es necesario parar un momento y bajar el ritmo.<br><br>

        En mi día a día disfruto de las cosas sencillas: leer sin prisa, el cine,
        los videojuegos y siempre con buena música de fondo.
        Espacios que me ayudan a desconectar, pero también a observar y reflexionar.
        <br><br>

        Me gusta crear, desmontar y entender cómo funcionan las cosas.
        Desde maquetas hasta electrónica o consolas retro, disfruto del proceso
        tanto como del resultado.
        <br><br>

        También valoro mucho el contacto con la naturaleza y viajar,
        conocer nuevos lugares y culturas, y dejarme inspirar por otras formas
        de mirar y vivir el mundo.
      </p>
    </div>

    <div class="grid grid-3" style="margin-top: 20px;">
      <img src="assets/img/yo_maker.jpg" onclick="openImage(this.src)" alt="Proceso creativo y técnico">
      <img src="assets/img/yo_gato.jpg" onclick="openImage(this.src)" alt="Momentos personales">
      <img src="assets/img/cartel_padul_2025.jpg" onclick="openImage(this.src)" alt="Cartel ganador 2025">
    </div>

    <p style="font-size: 9px; opacity: 0.7; text-align: center; margin-top: 12px;">
      Gracias por tomarte un momento para conocerme.
    </p>
  `);
  break;

  case "song":
  AudioManager.play("paper"); 
  openOverlay(`
    <h2>🎵 MI CANCIÓN FAVORITA</h2>

    <div class="card" style="line-height: 1.7; text-align: center;">
      <p>
        Hay canciones que acompañan momentos y se quedan contigo.<br><br>
        Esta es una de ellas.
      </p>

      <p style="margin-top: 16px;">
        <strong>Aqueous Transmission</strong><br>
        Incubus
      </p>

      <a 
        href="https://open.spotify.com/intl-es/track/5M67k54BVUDADZPryaqV1y"
        target="_blank"
        rel="noopener noreferrer"
        class="spotify-button"
      >
        Escuchar en Spotify
      </a>
    </div>
  `);
  break;


  }

  // ===============================
  // ESCALADO RESPONSIVE DEL CANVAS
  // ===============================

  // Llama a esta función cuando cambie el tamaño de la ventana
  window.addEventListener('resize', handleCanvasScaling);

  function handleCanvasScaling() {

    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
  }

  handleCanvasScaling();

}

document.addEventListener("visibilitychange", () => {
  if (document.hidden && AudioManager.music) {
    AudioManager.music.pause();
    AudioManager.music.currentTime = 0;
  }
});


