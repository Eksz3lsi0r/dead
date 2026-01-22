import { Enemy } from '../entities/Enemy.js';
import { FastEnemy } from '../entities/FastEnemy.js';
import { TankEnemy } from '../entities/TankEnemy.js';
import { BossEnemy } from '../entities/BossEnemy.js';

export class SpawnSystem {
  constructor(game, player) {
    this.game = game;
    this.player = player;
    this.spawnInterval = 1.2;
    this.spawnTimer = 0;
    this.wave = 1;
    this.elapsed = 0;
  }

  update(delta) {
    this.elapsed += delta;
    this.spawnTimer += delta;

    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnBatch();
    }

    // Gradually speed up spawns and advance waves every 18s
    this.spawnInterval = Math.max(0.45, 1.2 - this.wave * 0.05);
    if (this.elapsed > this.wave * 18) {
      this.wave += 1;
    }
  }

  spawnBatch() {
    const activeEnemies = this.game.entities.filter(e =>
      (e instanceof Enemy || e instanceof FastEnemy || e instanceof TankEnemy || e instanceof BossEnemy) &&
      e.isActive !== false
    ).length;
    const targetCap = Math.min(12 + this.wave * 4, 80);
    const slots = Math.max(0, targetCap - activeEnemies);
    const toSpawn = Math.min(slots, 2 + Math.floor(this.wave / 2));

    for (let i = 0; i < toSpawn; i += 1) {
      // Boss spawnt alle 10 Wellen
      if (this.wave > 0 && this.wave % 10 === 0 && Math.random() < 0.15) {
        const boss = new BossEnemy(this.game, this.player, {
          speed: 2 + this.wave * 0.1,
          health: 150 + this.wave * 15,
          damage: 25 + this.wave * 2,
          spawnRadius: 26 + this.wave * 0.4,
          variance: 8
        });
        this.game.addEntity(boss);
      }
      // Tank-Gegner ab Welle 5
      else if (this.wave >= 5 && Math.random() < 0.25) {
        const tank = new TankEnemy(this.game, this.player, {
          speed: 1.5 + this.wave * 0.08,
          health: 40 + this.wave * 5,
          damage: 12 + this.wave * 1.5,
          spawnRadius: 26 + this.wave * 0.4,
          variance: 8
        });
        this.game.addEntity(tank);
      }
      // Fast-Gegner ab Welle 3
      else if (this.wave >= 3 && Math.random() < 0.3) {
        const fastEnemy = new FastEnemy(this.game, this.player, {
          speed: 5 + this.wave * 0.15,
          health: 6 + this.wave * 1,
          damage: 5 + this.wave * 0.8,
          spawnRadius: 26 + this.wave * 0.4,
          variance: 8
        });
        this.game.addEntity(fastEnemy);
      }
      // Standard-Gegner
      else {
        const enemy = new Enemy(this.game, this.player, {
          speed: 2.4 + this.wave * 0.1,
          health: 14 + this.wave * 2 + Math.floor(this.wave / 5) * 3,
          damage: 8 + this.wave * 1.1 + Math.floor(this.wave / 8) * 2,
          spawnRadius: 26 + this.wave * 0.4,
          variance: 8
        });
        this.game.addEntity(enemy);
      }
    }
  }
}
