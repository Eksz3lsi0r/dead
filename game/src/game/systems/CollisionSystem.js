import * as THREE from 'three';
import { Enemy } from '../entities/Enemy.js';
import { FastEnemy } from '../entities/FastEnemy.js';
import { TankEnemy } from '../entities/TankEnemy.js';
import { BossEnemy } from '../entities/BossEnemy.js';
import { Projectile } from '../entities/Projectile.js';
import { XpOrb } from '../entities/XpOrb.js';

export class CollisionSystem {
  constructor(game, player, onGameOver) {
    this.game = game;
    this.player = player;
    this.onGameOver = onGameOver;
    this.gameOverTriggered = false;
  }

  update(delta) {
    if (!this.player.isAlive) return;

    const enemies = this.game.entities.filter(e =>
      (e instanceof Enemy || e instanceof FastEnemy || e instanceof TankEnemy || e instanceof BossEnemy) &&
      e.isActive !== false
    );
    const projectiles = this.game.entities.filter(p => p instanceof Projectile && p.isActive !== false && !p.isFx);

    this.handleEnemyPlayerCollisions(enemies);
    this.handleProjectileCollisions(projectiles, enemies);
    this.handleXpPickups();
  }

  handleEnemyPlayerCollisions(enemies) {
    enemies.forEach(enemy => {
      const distance = enemy.mesh.position.distanceTo(this.player.mesh.position);
      if (distance < 1.0) {
        this.player.applyDamage(enemy.damage);
        enemy.isActive = false;
        if (!this.player.isAlive) {
          this.triggerGameOver();
        }
      }
    });
  }

  handleProjectileCollisions(projectiles, enemies) {
    projectiles.forEach(projectile => {
      if (projectile.isActive === false) return;
      enemies.forEach(enemy => {
        if (enemy.isActive === false) return;

        // Überspeichern Sie bereits getroffene Gegner für durchdringende Projektile
        if (projectile.isPiercing && projectile.hitEnemies.has(enemy)) return;

        const distance = projectile.mesh.position.distanceTo(enemy.mesh.position);
        if (distance < 1.0 + projectile.size * 0.3) {
          enemy.applyDamage(projectile.damage);
          // Elementareffekte auf Treffer
          if (projectile.element === 'fire' && projectile.burnDps && projectile.burnDuration) {
            enemy.applyBurn(projectile.burnDps, projectile.burnDuration);
          }
          if (projectile.element === 'frost' && projectile.slowFactor && projectile.slowDuration) {
            enemy.applySlow(projectile.slowFactor, projectile.slowDuration);
          }

          // Kettenblitz: springt auf nahe Gegner über
          if (this.player.hasChainLightning && this.player.chainTargets > 0) {
            let jumps = 0;
            let sourcePos = enemy.mesh.position.clone();
            const visited = new Set([enemy]);
            while (jumps < this.player.chainTargets) {
              // Finde nächstes Ziel im Radius
              let nextTarget = null;
              let nextDist = Infinity;
              enemies.forEach(e2 => {
                if (e2.isActive === false || visited.has(e2)) return;
                const d = e2.mesh.position.distanceTo(sourcePos);
                if (d <= (this.player.chainRadius || 0) && d < nextDist) {
                  nextDist = d;
                  nextTarget = e2;
                }
              });
              if (!nextTarget) break;

              const jumpDamage = (projectile.damage || 0) * (this.player.chainDamageMultiplier || 0.6);
              nextTarget.applyDamage(jumpDamage);
              visited.add(nextTarget);

              // FX: kurzer Blitz zwischen den Zielen
              const dir = new THREE.Vector3().subVectors(nextTarget.mesh.position, sourcePos);
              const fx = new Projectile(this.game, sourcePos.clone().setY(0.5), dir, {
                damage: 0,
                speed: 120,
                lifetime: 0.08,
                size: 0.4,
                element: 'lightning',
                color: 0xf9e79f,
                isPiercing: true,
                hasAoE: false,
                isFx: true
              });
              this.game.addEntity(fx);

              sourcePos = nextTarget.mesh.position.clone();
              jumps += 1;
              if (nextTarget.health <= 0) {
                this.handleEnemyKilled(nextTarget);
              }
            }
          }

          // Knockback-Effekt
          if (projectile.hasKnockback) {
            const knockDir = new THREE.Vector3().subVectors(
              enemy.mesh.position,
              projectile.mesh.position
            ).normalize();
            const knockForce = projectile.knockbackForce * 0.5;
            enemy.mesh.position.addScaledVector(knockDir, knockForce);
          }

          if (projectile.isPiercing) {
            projectile.hitEnemies.add(enemy);
          } else {
            projectile.isActive = false;
          }

          if (enemy.health <= 0) {
            this.handleEnemyKilled(enemy);
          }
        }
      });
    });
  }

  handleEnemyKilled(enemy) {
    enemy.isActive = false;
    this.player.kills += 1;

    // Life Steal
    if (this.player.lifeStealAmount > 0) {
      this.player.health = Math.min(
        this.player.maxHealth,
        this.player.health + this.player.lifeStealAmount
      );
    }

    const xpAmount = 6 + Math.floor(Math.random() * 5);
    const orb = new XpOrb(this.game, enemy.mesh.position.clone(), xpAmount);
    this.game.addEntity(orb);
  }

  handleXpPickups() {
    this.game.entities.forEach(entity => {
      if (entity instanceof XpOrb && entity.isActive !== false) {
        const distance = entity.mesh.position.distanceTo(this.player.mesh.position);
        const radius = this.player.pickupRadius || 1.0;
        if (distance < radius) {
          entity.isActive = false;
          this.player.gainXp(entity.xpValue);
        }
      }
    });
  }

  triggerGameOver() {
    if (this.gameOverTriggered) return;
    this.gameOverTriggered = true;
    this.player.die();
    if (this.onGameOver) {
      this.onGameOver();
    }
  }
}
