import * as THREE from 'three';
import { Enemy } from './Enemy.js';
import { FastEnemy } from './FastEnemy.js';
import { TankEnemy } from './TankEnemy.js';
import { BossEnemy } from './BossEnemy.js';
import { Projectile } from './Projectile.js';

export class Player {
  constructor(game) {
    this.game = game;
    this.mesh = null;
    this.velocity = new THREE.Vector3();
    this.speed = 9;
    this.isAlive = true;
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.level = 1;
    this.xp = 0;
    this.kills = 0;
    this.fireCooldown = 0.55;
    this.fireTimer = 0;
    this.projectileDamage = 12;
    // XP-Orb Aufnahmeradius & Magnet
    this.pickupRadius = 1.0;
    this.magnetRadius = 0;

    // AoE spell properties
    this.hasAoE = false;
    this.aoeRadius = 3;
    this.aoeMultiplier = 0.6; // Damage multiplier for AoE targets

    // Neue Fähigkeiten
    this.multiShotCount = 0; // Zusätzliche Projektile
    this.isPiercing = false; // Durchdringende Projektile
    this.lifeStealAmount = 0; // HP pro Kill
    this.projectileSize = 1; // Größenmodifikator
    this.hasKnockback = false; // Knockback-Effekt
    this.knockbackForce = 1;
    this.regenRate = 0; // Passive Regeneration
    this.critChance = 0; // Kritischer Hit Chance (0-1)
    this.critMultiplier = 1; // Kritischer Schaden-Multiplikator

    // Blitzschlag (zeitgesteuert)
    this.lightningEnabled = false;
    this.lightningCooldown = Infinity;
    this.lightningTimer = 0;
    this.lightningDamage = 0;
    this.lightningRadius = 0;

    // Kettenblitz Flags
    this.hasChainLightning = false;
    this.chainTargets = 0;
    this.chainRadius = 0;
    this.chainDamageMultiplier = 1;

    // Feuerball / Frostblitz
    this.fireballEnabled = false;
    this.frostboltEnabled = false;
    this.burnDps = 0;
    this.burnDuration = 0;
    this.slowFactor = 1;
    this.slowDuration = 0;

    // Elementrotation & zusätzlicher Auto-Cast
    this.elementRotation = [];
    this.elementRotationIndex = 0;
    this.autoCastCooldown = 3.5;
    this.autoCastTimer = this.autoCastCooldown;

    this.createMesh();
  }

  createMesh() {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0x3498db,
      roughness: 0.3,
      metalness: 0.5
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.set(0, 0.5, 0);
  }

  update(delta) {
    if (!this.isAlive) return;

    this.fireTimer -= delta;
    this.handleAutoFire();

    // Zusätzlicher Element-Auto-Cast
    this.autoCastTimer -= delta;
    if (this.autoCastTimer <= 0) {
      this.autoCastTimer = this.autoCastCooldown;
      const target = this.findNearestEnemy();
      if (target) {
        const element = this.getNextElement();
        if (element !== 'default') {
          this.fireElementalProjectile(target, element, 0.85);
        }
      }
    }

    // Blitzschlag tick
    if (this.lightningEnabled) {
      this.lightningTimer -= delta;
      if (this.lightningTimer <= 0) {
        this.lightningTimer = this.lightningCooldown;
        this.castLightningStrike();
      }
    }

    // Passive Regeneration
    if (this.regenRate > 0) {
      this.health = Math.min(this.maxHealth, this.health + this.regenRate * delta);
    }

    // Apply velocity
    this.mesh.position.x += this.velocity.x * delta;
    this.mesh.position.z += this.velocity.z * delta;

    // Keep player on ground
    this.mesh.position.y = 0.5;

    // Boundary constraints
    const boundary = 24;
    this.mesh.position.x = Math.max(-boundary, Math.min(boundary, this.mesh.position.x));
    this.mesh.position.z = Math.max(-boundary, Math.min(boundary, this.mesh.position.z));

    // Update camera to follow player
    const cameraOffset = new THREE.Vector3(0, 5, 10);
    const desiredCameraPosition = this.mesh.position.clone().add(cameraOffset);
    this.game.camera.position.lerp(desiredCameraPosition, 0.1);
    this.game.camera.lookAt(this.mesh.position);
  }

  enableElementRotation = (type) => {
    const map = { fire: 'fire', frost: 'frost' };
    const tag = map[type];
    if (!tag) return;
    if (!this.elementRotation.includes(tag)) {
      this.elementRotation.push(tag);
    }
  }

  getNextElement() {
    if (this.elementRotation.length === 0) return 'default';
    const element = this.elementRotation[this.elementRotationIndex % this.elementRotation.length];
    this.elementRotationIndex = (this.elementRotationIndex + 1) % this.elementRotation.length;
    return element;
  }

  setVelocity(x, z) {
    this.velocity.set(x * this.speed, 0, z * this.speed);
  }

  applyDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.die();
    }
  }

  gainXp(amount) {
    this.xp += amount;
    while (this.xp >= this.xpForNextLevel()) {
      this.xp -= this.xpForNextLevel();
      this.level += 1;
      this.onLevelUp();
    }
  }

  xpForNextLevel() {
    return 30 + (this.level - 1) * 12;
  }

  onLevelUp() {
    // Base stat improvements (before upgrade selection)
    // More generous scaling to keep up with enemy difficulty
    this.maxHealth += 6;
    this.health = Math.min(this.maxHealth, this.health + 6);
    this.fireCooldown = Math.max(0.1, this.fireCooldown - 0.03);
    this.projectileDamage += 1.2;

    // Dispatch event so main.js can show upgrade UI
    const event = new CustomEvent('playerLevelUp', {
      detail: { level: this.level }
    });
    window.dispatchEvent(event);
  }

  handleAutoFire() {
    const target = this.findNearestEnemy();
    if (!target) return;

    if (this.fireTimer <= 0) {
      this.fireTimer = this.fireCooldown;
      const element = this.getNextElement();
      if (element === 'default') {
        this.fireProjectile(target);
      } else {
        this.fireElementalProjectile(target, element, 1.0);
      }
    }
  }

  findNearestEnemy() {
    let nearest = null;
    let nearestDistSq = Infinity;
    this.game.entities.forEach(entity => {
      if ((entity instanceof Enemy || entity instanceof FastEnemy || entity instanceof TankEnemy || entity instanceof BossEnemy) && entity.isActive !== false) {
        const distSq = entity.mesh.position.distanceToSquared(this.mesh.position);
        if (distSq < nearestDistSq) {
          nearestDistSq = distSq;
          nearest = entity;
        }
      }
    });
    return nearest;
  }

  fireProjectile(target) {
    const direction = new THREE.Vector3().subVectors(
      target.mesh.position,
      this.mesh.position
    );
    direction.y = 0;
    if (direction.lengthSq() === 0) return;
    const origin = this.mesh.position.clone().setY(0.5);

    // Berechne kritischen Schaden
    let damage = this.projectileDamage;
    if (Math.random() < this.critChance) {
      damage *= this.critMultiplier;
    }

    const projectile = new Projectile(this.game, origin, direction, {
      damage: damage,
      speed: 26,
      lifetime: 1.8,
      hasAoE: this.hasAoE,
      aoeRadius: this.aoeRadius,
      aoeMultiplier: this.aoeMultiplier,
      isPiercing: this.isPiercing,
      size: this.projectileSize,
      hasKnockback: this.hasKnockback,
      knockbackForce: this.knockbackForce,
      element: 'default',
      color: 0x9b59b6
    });
    this.game.addEntity(projectile);

    // Multi-Shot: Zusätzliche Projektile schießen
    if (this.multiShotCount > 0) {
      for (let i = 0; i < this.multiShotCount; i++) {
        const angle = (Math.PI * 2 / (this.multiShotCount + 1)) * (i + 1);
        const rotated = new THREE.Vector3(
          direction.x * Math.cos(angle) - direction.z * Math.sin(angle),
          0,
          direction.x * Math.sin(angle) + direction.z * Math.cos(angle)
        ).normalize();

        const projectile2 = new Projectile(this.game, origin, rotated, {
          damage: damage * 0.7,
          speed: 26,
          lifetime: 1.8,
          hasAoE: this.hasAoE,
          aoeRadius: this.aoeRadius,
          aoeMultiplier: this.aoeMultiplier,
          isPiercing: this.isPiercing,
          size: this.projectileSize,
          hasKnockback: this.hasKnockback,
          knockbackForce: this.knockbackForce,
          element: 'default',
          color: 0x9b59b6
        });
        this.game.addEntity(projectile2);
      }
    }
  }

  fireElementalProjectile(target, element, damageScale = 1.0) {
    const direction = new THREE.Vector3().subVectors(
      target.mesh.position,
      this.mesh.position
    );
    direction.y = 0;
    if (direction.lengthSq() === 0) return;
    const origin = this.mesh.position.clone().setY(0.5);

    let damage = this.projectileDamage * damageScale;
    if (Math.random() < this.critChance) {
      damage *= this.critMultiplier;
    }

    // Element-spezifische Parameter
    let opts = { speed: 26, lifetime: 1.8, element: 'default', color: 0x9b59b6 };
    if (element === 'fire') {
      opts = {
        speed: 24,
        lifetime: 1.8,
        element: 'fire',
        color: 0xe74c3c,
        burnDps: this.burnDps,
        burnDuration: this.burnDuration
      };
    } else if (element === 'frost') {
      opts = {
        speed: 24,
        lifetime: 1.8,
        element: 'frost',
        color: 0x5dade2,
        slowFactor: this.slowFactor,
        slowDuration: this.slowDuration
      };
    }

    const baseOptions = {
      damage: damage,
      speed: opts.speed,
      lifetime: opts.lifetime,
      hasAoE: this.hasAoE,
      aoeRadius: this.aoeRadius,
      aoeMultiplier: this.aoeMultiplier,
      isPiercing: this.isPiercing,
      size: this.projectileSize,
      hasKnockback: this.hasKnockback,
      knockbackForce: this.knockbackForce,
      element: opts.element,
      color: opts.color,
      burnDps: opts.burnDps,
      burnDuration: opts.burnDuration,
      slowFactor: opts.slowFactor,
      slowDuration: opts.slowDuration
    };
    const projectile = new Projectile(this.game, origin, direction, baseOptions);
    this.game.addEntity(projectile);

    if (this.multiShotCount > 0) {
      for (let i = 0; i < this.multiShotCount; i++) {
        const angle = (Math.PI * 2 / (this.multiShotCount + 1)) * (i + 1);
        const rotated = new THREE.Vector3(
          direction.x * Math.cos(angle) - direction.z * Math.sin(angle),
          0,
          direction.x * Math.sin(angle) + direction.z * Math.cos(angle)
        ).normalize();

        const projectile2 = new Projectile(this.game, origin, rotated, baseOptions);
        this.game.addEntity(projectile2);
      }
    }
  }

  castLightningStrike() {
    const center = this.mesh.position;
    this.game.entities.forEach(entity => {
      if (!(entity instanceof Enemy || entity instanceof FastEnemy || entity instanceof TankEnemy || entity instanceof BossEnemy)) return;
      if (entity.isActive === false) return;
      const dist = entity.mesh.position.distanceTo(center);
      if (dist <= (this.lightningRadius || 0)) {
        entity.applyDamage(this.lightningDamage || 0);
        // FX: kurzer Blitzfunke auf dem Ziel
        const fxDir = new THREE.Vector3(0, 0, 0);
        const fx = new Projectile(this.game, entity.mesh.position.clone().setY(0.5), fxDir, {
          damage: 0,
          speed: 0,
          lifetime: 0.15,
          size: 0.6,
          element: 'lightning',
          color: 0xf4d03f,
          isPiercing: true,
          hasAoE: false,
          isFx: true
        });
        this.game.addEntity(fx);
      }
    });
  }

  die() {
    this.isAlive = false;
    // Visual feedback
    this.mesh.material.color.setHex(0xe74c3c);
  }
}
