// ===============================
// INTERACT STAR (HUD INDICATOR)
// ===============================

const interactStar = {
  image: new Image(),
  time: 0,

  // Inicialización
  init() {
    this.image.src = "assets/ui/star.png";
  },

  // Animación (respiración)
  update() {
    this.time += 0.05;
  },

  // Dibujo fijo en HUD (esquina)
  draw(ctx, scale, offsetX, offsetY) {
    if (!this.image.complete) return;

    // ⭐ EFECTO RESPIRAR / BRILLAR
    const pulse = 1 + Math.sin(this.time) * 0.15;
    const alpha = 0.7 + Math.sin(this.time) * 0.3;

    const baseSize = 16;
    const size = baseSize * pulse;

    // 📍 Posición HUD: esquina superior derecha del juego
    const margin = 10;

    const x =
      offsetX +
      (GAME_WIDTH * scale) -
      (size * scale) -
      margin;

    const y =
      offsetY +
      margin;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = alpha;

    ctx.drawImage(
      this.image,
      x,
      y,
      size * scale,
      size * scale
    );

    ctx.restore();
  }
};
