import * as THREE from 'three';

export class XpOrb {
  constructor(game, position, xpValue = 5) {
    this.game = game;
    this.mesh = null;
    this.isActive = true;
    this.xpValue = xpValue;
    this.bobTime = Math.random() * Math.PI * 2;

    this.createMesh();
    this.mesh.position.copy(position.clone().setY(0.3));
  }

  createMesh() {
    const geometry = new THREE.IcosahedronGeometry(0.3, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0x2ecc71,
      emissive: 0x1e8449,
      metalness: 0.25,
      roughness: 0.35
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }

  update(delta) {
    if (!this.isActive) return;
    this.bobTime += delta * 3;
    this.mesh.rotation.y += delta * 1.5;
    this.mesh.position.y = 0.3 + Math.sin(this.bobTime) * 0.08;

    // Magnetanziehung Richtung Spieler
    const player = this.game.player;
    if (player && player.magnetRadius && player.magnetRadius > 0) {
      const toPlayer = new THREE.Vector3().subVectors(player.mesh.position, this.mesh.position);
      toPlayer.y = 0;
      const dist = toPlayer.length();
      if (dist <= player.magnetRadius && dist > 0.001) {
        toPlayer.normalize();
        const pull = 12 * (1 - dist / player.magnetRadius); // stärker nahe am Spieler
        this.mesh.position.addScaledVector(toPlayer, pull * delta);
        this.mesh.position.y = 0.3; // am Boden halten
      }
    }
  }
}
