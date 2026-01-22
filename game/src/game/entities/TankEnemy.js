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
      this.mesh.position.addScaledVector(toPlayer, this.speed * delta);
    }

    this.mesh.position.y = 0.5;
  }

  applyDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.isActive = false;
    }
  }
}
