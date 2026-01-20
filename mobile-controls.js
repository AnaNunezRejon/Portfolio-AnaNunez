// ===============================
// CONTROLES TÁCTILES
// ===============================

// ===============================
// CONTROLES TÁCTILES
// ===============================

document.querySelectorAll("#mobile-controls button").forEach(btn => {
  const key = btn.dataset.key;

  // MOVIMIENTO
  if (key.startsWith("Arrow")) {

    btn.addEventListener("touchstart", e => {
      e.preventDefault();
      keys[key] = true;
    });

    btn.addEventListener("touchend", e => {
      e.preventDefault();
      keys[key] = false;
    });

    btn.addEventListener("touchcancel", () => {
      keys[key] = false;
    });
  }

  // INTERACTUAR (E)
  if (key === "e") {
    btn.addEventListener("touchstart", e => {
      e.preventDefault();

      if (canInteract && nearbyObject) {
        const action = nearbyObject.properties
          ?.find(p => p.name === "action")?.value;

        if (action) handleAction(action);
        canInteract = false;
      }
    });

    btn.addEventListener("touchend", () => {
      canInteract = true;
    });
  }
});
