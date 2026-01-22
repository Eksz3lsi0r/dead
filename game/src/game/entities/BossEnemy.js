import * as THREE from 'three';

export class BossEnemy {
  constructor(game, player, options = {}) {
    this.game = game;
    this.player = player;
    this.mesh = null;
    this.speed = options.speed ?? 2.5;
    this.health = options.health ?? 100;
    this.maxHealth = this.health;
    this.damage = options.damage ?? 20;
    this.isActive = true;

    this.createMesh();
    this.spawnAtRing(options.spawnRadius ?? 26, options.variance ?? 6);
  }

  createMesh() {
    const geometry = new THREE.OctahedronGeometry(1.2, 2);
    const material = new THREE.MeshStandardMaterial({
      color: 0x8b0000, // Dunkelrot
      roughness: 0.2,
      metalness: 1,
      emissive: 0xff0000,
      emissiveIntensity: 0.3
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

    // Rotation für visuellen Effekt
    this.mesh.rotation.x += delta * 0.5;
    this.mesh.rotation.y += delta * 0.5;
  }

  applyDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.isActive = false;
    }
  }
}
