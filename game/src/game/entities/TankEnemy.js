import * as THREE from 'three';

export class TankEnemy {
  constructor(game, player, options = {}) {
    this.game = game;
    this.player = player;
    this.mesh = null;
    this.speed = options.speed ?? 1.5; // Langsamer
    this.health = options.health ?? 35; // Viel mehr Health
    this.maxHealth = this.health;
    this.damage = options.damage ?? 15; // Mehr Schaden
    this.isActive = true;

    // Status-Effekte
    this.slowTimeRemaining = 0;
    this.slowFactor = 1;
    this.burnTimeRemaining = 0;
    this.burnDps = 0;

    this.createMesh();
    this.spawnAtRing(options.spawnRadius ?? 26, options.variance ?? 6);
  }

  createMesh() {
    const geometry = new THREE.CubeGeometry(0.8, 0.8, 0.8);
    const material = new THREE.MeshStandardMaterial({
      color: 0xc0392b, // Dunkles Rot
      roughness: 0.4,
      metalness: 0.8
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }

  spawnAtRing(radius, variance) {
    const angle = Math.random() * Math.PI * 2;
    const r = radius + (Math.random() - 0.5) * variance;
    this.mesh.position.set(Math.cos(angle) * r, 0.5, Math.sin(angle) * r);
  }

  update(delta) {
    if (!this.isActive || !this.player.isAlive) return;

    const toPlayer = new THREE.Vector3().subVectors(
      this.player.mesh.position,
      this.mesh.position
    );
    toPlayer.y = 0;
    const distance = toPlayer.length();
    if (distance > 0.001) {
      toPlayer.normalize();
      const slowMul = this.slowTimeRemaining > 0 ? this.slowFactor : 1;
      this.mesh.position.addScaledVector(toPlayer, this.speed * slowMul * delta);
    }

    this.mesh.position.y = 0.5;

    // Burn-Tick
    if (this.burnTimeRemaining > 0 && this.burnDps > 0) {
      this.applyDamage(this.burnDps * delta);
      this.burnTimeRemaining = Math.max(0, this.burnTimeRemaining - delta);
    }
    // Slow abklingen
    if (this.slowTimeRemaining > 0) {
      this.slowTimeRemaining = Math.max(0, this.slowTimeRemaining - delta);
      if (this.slowTimeRemaining === 0) {
        this.slowFactor = 1;
      }
    }
  }

  applyDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.isActive = false;
    }
  }

  applySlow(factor, duration) {
    if (duration <= 0) return;
    this.slowFactor = Math.min(this.slowFactor, factor);
    this.slowTimeRemaining = Math.max(this.slowTimeRemaining, duration);
  }

  applyBurn(dps, duration) {
    if (duration <= 0 || dps <= 0) return;
    this.burnDps = Math.max(this.burnDps, dps);
    this.burnTimeRemaining = Math.max(this.burnTimeRemaining, duration);
  }
}
