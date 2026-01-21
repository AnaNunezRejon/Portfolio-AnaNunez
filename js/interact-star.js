
// Posiciones fijas de estrellas (coordenadas del mapa 640x480)
const STAR_POSITIONS = [
  // Cama / mesita
  //{ x: 150, y: 90 },

  // Lámpara
  { x: 215, y: 80 },

  // TV
  { x: 340, y: 60 },

  // Cocina
  { x: 460, y: 100 },
  { x: 520, y: 80 },

  // Nevera
  { x: 585, y: 95 },

  // Escritorio PC
  { x: 170, y: 300 },

  // Librería
  { x: 40, y: 330 },

  // Espejo
  { x: 520, y: 300 }
];

// ===============================
// INTERACT STAR (STATIC OBJECTS)
// ===============================

const interactStar = {
  image: new Image(),
  time: 0,

  init() {
    this.image.src = "assets/ui/star.png";
  },

  update() {
    this.time += 0.06;
  },

  drawAll(ctx, scale, offsetX, offsetY) {
    if (!this.image.complete) return;

    // ⭐ Animación respirar
    const pulse = 1 + Math.sin(this.time) * 0.25;
    const alpha = 0.65 + Math.sin(this.time) * 0.35;
    const baseSize = 16;
    const size = baseSize * pulse;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = alpha;

    STAR_POSITIONS.forEach(pos => {
      const x = offsetX + (pos.x - size / 2) * scale;
      const y = offsetY + (pos.y - size / 2) * scale;

      ctx.drawImage(
        this.image,
        x,
        y,
        size * scale,
        size * scale
      );
    });

    ctx.restore();
  }
};
