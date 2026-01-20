// ===============================
// INTERACT STAR (UI INDICATOR)
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

  // Dibujo sobre objeto interactuable
  draw(ctx, object, scale, offsetX, offsetY) {
    if (!object || !this.image.complete) return;

    // Posición base sobre el objeto
    const baseX = object.x + object.width / 2;
    const baseY = object.y - 22 - (object.height * 0.3);

    // ⭐ EFECTO RESPIRAR (crece y encoge)
    const pulse = 1 + Math.sin(this.time) * 0.15; // tamaño
    const alpha = 0.7 + Math.sin(this.time) * 0.3; // brillo

    const size = 16 * pulse;

    // Posición escalada
    const x =
      offsetX + (baseX - size / 2) * scale;
    const y =
      offsetY + (baseY - size / 2) * scale;

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
