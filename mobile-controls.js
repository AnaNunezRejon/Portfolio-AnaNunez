// ===============================
// CONTROLES TÁCTILES
// ===============================

document.querySelectorAll("#mobile-controls button").forEach(btn => {
  const key = btn.dataset.key;

  // Pulsar
  btn.addEventListener("touchstart", e => {
    e.preventDefault();
    keys[key] = true;
  });

  // Soltar
  btn.addEventListener("touchend", e => {
    e.preventDefault();
    keys[key] = false;
  });

  btn.addEventListener("touchcancel", () => {
    keys[key] = false;
  });
});
