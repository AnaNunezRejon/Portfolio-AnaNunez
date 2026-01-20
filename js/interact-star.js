// ===============================
// INTERACT STAR (UI INDICATOR)
// ===============================

const interactStar = {
  image: new Image(),
  floatTime: 0,

  init() {
    this.image.src = "assets/ui/star.png";
  },

  update() {
    this.floatTime += 0.05;
  },

  draw(ctx, object, scale, offsetX, offsetY) {
    if (!object || !this.image.complete) return;

    const baseY = object.y - 18;
    const floatOffset = Math.sin(this.floatTime) * 3;

    const x = offsetX + (object.x + object.width / 2 - 8) * scale;
    const y = offsetY + (baseY + floatOffset) * scale;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.image, x, y, 16 * scale, 16 * scale);
    ctx.restore();
  }
};
