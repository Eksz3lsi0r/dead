export class InputSystem {
  constructor(player) {
    this.player = player;
    this.keys = {};

    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  update(delta) {
    if (!this.player.isAlive) return;

    let x = 0;
    let z = 0;

    if (this.keys['w'] || this.keys['arrowup']) z -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) z += 1;
    if (this.keys['a'] || this.keys['arrowleft']) x -= 1;
    if (this.keys['d'] || this.keys['arrowright']) x += 1;

    // Normalize diagonal movement
    if (x !== 0 && z !== 0) {
      x *= 0.707;
      z *= 0.707;
    }

    this.player.setVelocity(x, z);
  }
}
