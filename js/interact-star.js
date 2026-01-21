// ===============================
// INTERACT STAR
// Interior (estrellas fijas)
// Exterior (estrellas dinámicas por objeto)
// ===============================

//  Posiciones fijas SOLO para el interior (room)
const STAR_POSITIONS = [
  { x: 215, y: 80 },   // Lámpara
  { x: 340, y: 60 },   // TV
  { x: 460, y: 100 },  // Cocina
  { x: 520, y: 80 },   // Cocina
  { x: 585, y: 95 },   // Nevera
  { x: 170, y: 300 },  // Escritorio
  { x: 40, y: 330 },   // Librería
  { x: 520, y: 300 }   // Espejo
];

const interactStar = {
  image: new Image(),
  time: 0,

  init() {
    this.image.src = "assets/ui/star.png";
  },

  update() {
    this.time += 0.06;
  },

  //  INTERIOR: dibuja todas las estrellas decorativas
  drawAll(ctx, scale, offsetX, offsetY) {
    if (!this.image.complete) return;

    const pulse = 1 + Math.sin(this.time) * 0.25;
    const alpha = 0.65 + Math.sin(this.time) * 0.35;
    const baseSize = 16;
    const size = baseSize * pulse;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = alpha;

    STAR_POSITIONS.forEach(pos => {
      ctx.drawImage(
        this.image,
        offsetX + (pos.x - size / 2) * scale,
        offsetY + (pos.y - size / 2) * scale,
        size * scale,
        size * scale
      );
    });

    ctx.restore();
  },

  //  EXTERIOR: dibuja una estrella puntual (buzón, tocón, etc.)
  drawAt(ctx, x, y, scale, offsetX, offsetY) {
    if (!this.image.complete) return;

    const pulse = 1 + Math.sin(this.time) * 0.25;
    const alpha = 0.65 + Math.sin(this.time) * 0.35;
    const baseSize = 16;
    const size = baseSize * pulse;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = alpha;

    ctx.drawImage(
      this.image,
      offsetX + (x - size / 2) * scale,
      offsetY + (y - size / 2) * scale,
      size * scale,
      size * scale
    );

    ctx.restore();
  }
};
