import * as THREE from 'three';

export class FallingObject {
  constructor(game) {
    this.game = game;
    this.mesh = null;
    this.fallSpeed = 5 + Math.random() * 5;
    this.isActive = true;

    this.createMesh();
  }

  createMesh() {
    const size = 0.5 + Math.random() * 0.5;
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({
      color: Math.random() * 0xffffff,
      roughness: 0.5,
      metalness: 0.3
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Random spawn position
    const spawnRadius = 20;
    this.mesh.position.set(
      (Math.random() - 0.5) * spawnRadius * 2,
      15 + Math.random() * 10,
      (Math.random() - 0.5) * spawnRadius * 2
    );

    // Random rotation
    this.rotationSpeed = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    );
  }

  update(delta) {
    // Fall down
    this.mesh.position.y -= this.fallSpeed * delta;

    // Rotate
    this.mesh.rotation.x += this.rotationSpeed.x * delta;
    this.mesh.rotation.y += this.rotationSpeed.y * delta;
    this.mesh.rotation.z += this.rotationSpeed.z * delta;

    // Remove if below ground
    if (this.mesh.position.y < -2) {
      this.isActive = false;
    }
  }

  checkCollision(player) {
    if (!this.isActive || !player.isAlive) return false;

    const distance = this.mesh.position.distanceTo(player.mesh.position);
    const collisionDistance = 1.0; // Adjust for object sizes

    return distance < collisionDistance;
  }
}
