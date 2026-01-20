// ===============================
// SONIDOS.JS - Audio Manager
// ===============================

window.AudioManager = {

  // ===============================
  // ESTADO
  // ===============================
  music: null,
  sounds: {},
  stepCooldown: false,
  enabled: true,

  // ===============================
  // INIT
  // ===============================
  init() {

    // Estado guardado (on/off)
    const saved = localStorage.getItem("sound-enabled");
    this.enabled = saved !== null ? saved === "true" : true;

    //  Música ambiente
    this.music = new Audio("assets/sounds/music/jigglypuffs.mp3");
    this.music.loop = true;
    this.music.volume = 0.07;

    if (!this.enabled) this.music.volume = 0;

    //  Efectos de sonido
    this.sounds = {

      // Pasos (sonido único)
      step: new Audio(
        "assets/sounds/steps/footstep-1-83098.mp3"
      ),

      // 🪟 UI
      openUI: new Audio("assets/sounds/ui/open.mp3"),
      closeUI: new Audio("assets/sounds/ui/close.mp3"),

      //  Objetos
      keyboard: new Audio(
        "assets/sounds/objects/keyboard-typing-2-292589.mp3"
      ),

      tv: new Audio(
        "assets/sounds/objects/old-tv-button-102956.mp3"
      ),

      fridgeOpen: new Audio(
        "assets/sounds/objects/fridge-open-80053.mp3"
      ),

      fridgeClose: new Audio(
        "assets/sounds/objects/fridge-door-closing-98782.mp3"
      ),

      microwave: new Audio(
        "assets/sounds/objects/microwave-ding-104123.mp3"
      ),

      keys: new Audio(
        "assets/sounds/objects/llaveskeys-338166.mp3"
      ),

      book: new Audio(
        "assets/sounds/objects/book-closing-466850.mp3"
      ),

      sit: new Audio(
        "assets/sounds/objects/sitting-on-bed-97752.mp3"
      ),
            water: new Audio(
        "assets/sounds/objects/water-drop-notification-7-463599.mp3"
      )
    };

Object.values(this.sounds).forEach(sound => {
  sound.volume = 0.3;
});

// Ajustes finos por tipo
this.sounds.step.volume = 0.22;        // pasos
this.sounds.keyboard.volume = 0.35;    // teclado (suele venir bajo)
this.sounds.fridgeOpen.volume = 1;   // frigo abrir
this.sounds.fridgeClose.volume = 0.35; // frigo cerrar
this.sounds.book.volume = 0.35;
this.sounds.keys.volume = 0.4;
this.sounds.microwave.volume = 0.4;
this.sounds.water.volume = 0.4;

  },

  // ===============================
  // MÚSICA
  // ===============================
  playMusic() {
    if (!this.enabled) return;

    if (this.music && this.music.paused) {
      this.music.play().catch(() => {});
    }
  },

  lowerMusic() {
    if (this.music) this.music.volume = 0.06;
  },

  restoreMusic() {
    if (this.music) this.music.volume = 0.12;
  },

  // ===============================
  // EFECTOS
  // ===============================
  play(name) {
    if (!this.enabled) return;

    const sound = this.sounds[name];
    if (!sound) return;

    sound.currentTime = 0;
    sound.play().catch(() => {});
  },

  playStep() {
    if (!this.enabled) return;
    if (this.stepCooldown) return;

    this.play("step");
    this.stepCooldown = true;

    setTimeout(() => {
      this.stepCooldown = false;
    }, 220); // ritmo natural de paso
  },

  // ===============================
  // TOGGLE ON / OFF
  // ===============================
  toggleSound() {
    this.enabled = !this.enabled;
    localStorage.setItem("sound-enabled", this.enabled);

    if (!this.enabled) {
      if (this.music) this.music.pause();
    } else {
      this.playMusic();
    }
  }
};
