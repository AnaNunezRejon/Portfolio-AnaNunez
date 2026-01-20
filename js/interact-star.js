// ===============================
// INTERACT STAR (OBJECT INDICATOR)
// ===============================

const interactStar = {
  image: new Image(),
  time: 0,

  init() {
    this.image.src = "assets/ui/star.png";
  },

  update() {
    this.time += 0.05;
  },

  draw(ctx, object, scale, offsetX, offsetY) {
    if (!object || !this.image.complete) return;

    // Posición sobre el objeto
    const baseX = object.x + object.width / 2;
    const baseY = object.y - 22 - (object.height * 0.3);

    // ⭐ Respirar / brillar
    const pulse = 1 + Math.sin(this.time) * 0.15;
    const alpha = 0.7 + Math.sin(this.time) * 0.3;

    const size = 16 * pulse;

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
