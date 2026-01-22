import * as THREE from 'three';

export class Projectile {
  constructor(game, origin, direction, options = {}) {
    this.game = game;
    this.mesh = null;
    this.speed = options.speed ?? 24;
    this.damage = options.damage ?? 10;
    this.lifetime = options.lifetime ?? 1.6;
    this.age = 0;
    this.isActive = true;
    this.direction = direction.clone().normalize();

    // Neue Eigenschaften
    this.hasAoE = options.hasAoE ?? false;
    this.aoeRadius = options.aoeRadius ?? 3;
    this.aoeMultiplier = options.aoeMultiplier ?? 0.6;
    this.isPiercing = options.isPiercing ?? false;
    this.size = options.size ?? 1;
    this.hasKnockback = options.hasKnockback ?? false;
    this.knockbackForce = options.knockbackForce ?? 1;
    this.hitEnemies = new Set(); // Für durchdringende Projektile

    // Element & Effekte
    this.element = options.element ?? 'default';
    this.isFx = options.isFx ?? false;
    this.color = options.color ?? 0x9b59b6;
    this.burnDps = options.burnDps;
    this.burnDuration = options.burnDuration;
    this.slowFactor = options.slowFactor;
    this.slowDuration = options.slowDuration;

    this.createMesh();
    this.mesh.position.copy(origin);
  }

  createMesh() {
    const geometry = new THREE.SphereGeometry(0.2 * this.size, 12, 12);
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: 0x000000,
      metalness: 0.3,
      roughness: 0.2
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }

  update(delta) {
    if (!this.isActive) return;

    this.age += delta;
    if (this.age >= this.lifetime) {
      this.isActive = false;
      return;
    }

    const step = this.direction.clone().multiplyScalar(this.speed * delta);
    this.mesh.position.add(step);
    this.mesh.position.y = 0.5;
  }
}
