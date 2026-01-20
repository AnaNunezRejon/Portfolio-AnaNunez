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
    if (!object) return;

    const baseY = object.y - 18;
    const floatOffset = Math.sin(this.floatTime) * 4;

    const x = offsetX + (object.x + object.width / 2 - 8) * scale;
    const y = offsetY + (baseY + floatOffset) * scale;

    ctx.drawImage(
      this.image,
      x,
      y,
      16 * scale,
      16 * scale
    );
  }
};
