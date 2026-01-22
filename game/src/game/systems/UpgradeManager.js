/**
 * UpgradeManager: Manages available upgrades and applies them to player
 */
export class UpgradeManager {
  static UPGRADES = {
    fireRate: {
      id: 'fireRate',
      name: 'Fire Rate',
      description: 'Reduce projectile cooldown by 0.08s (min 0.1s)',
      icon: '⚡',
      apply: (player) => {
        player.fireCooldown = Math.max(0.1, player.fireCooldown - 0.08);
      }
    },
    aoeSpell: {
      id: 'aoeSpell',
      name: 'AoE Spell',
      description: 'Increase projectile damage by 4, affect nearby enemies',
      icon: '💥',
      apply: (player) => {
        player.projectileDamage += 4;
        player.hasAoE = true;
        player.aoeRadius = player.aoeRadius || 3;
      }
    },
    healthBoost: {
      id: 'healthBoost',
      name: 'Health Boost',
      description: 'Gain 25 max health and restore all health',
      icon: '❤️',
      apply: (player) => {
        player.maxHealth += 25;
        player.health = player.maxHealth;
      }
    },
    damageUp: {
      id: 'damageUp',
      name: 'Damage Up',
      description: 'Increase projectile damage by 3',
      icon: '🔥',
      apply: (player) => {
        player.projectileDamage += 3;
      }
    },
    speedUp: {
      id: 'speedUp',
      name: 'Speed Up',
      description: 'Increase movement speed by 20%',
      icon: '💨',
      apply: (player) => {
        player.speed *= 1.2;
      }
    },
    // Neue Fähigkeiten
    multiShot: {
      id: 'multiShot',
      name: 'Multi-Shot',
      description: 'Fire 2 additional projectiles at angles',
      icon: '⚔️',
      apply: (player) => {
        player.multiShotCount = (player.multiShotCount || 0) + 2;
        player.projectileDamage += 2;
      }
    },
    piercing: {
      id: 'piercing',
      name: 'Piercing Shots',
      description: 'Projectiles pierce through enemies',
      icon: '🔱',
      apply: (player) => {
        player.isPiercing = true;
        player.projectileDamage += 2;
      }
    },
    lifeSteal: {
      id: 'lifeSteal',
      name: 'Life Steal',
      description: 'Heal 2 HP for each kill',
      icon: '🩸',
      apply: (player) => {
        player.lifeStealAmount = (player.lifeStealAmount || 0) + 2;
      }
    },
    doubleHealth: {
      id: 'doubleHealth',
      name: 'Double Health',
      description: 'Double your max health',
      icon: '💗',
      apply: (player) => {
        player.maxHealth *= 2;
        player.health = player.maxHealth;
      }
    },
    projectileSize: {
      id: 'projectileSize',
      name: 'Larger Projectiles',
      description: 'Increase projectile size and collision radius',
      icon: '🎯',
      apply: (player) => {
        player.projectileSize = (player.projectileSize || 1) * 1.5;
      }
    },
    knockback: {
      id: 'knockback',
      name: 'Knockback',
      description: 'Push enemies away on hit',
      icon: '💪',
      apply: (player) => {
        player.hasKnockback = true;
        player.knockbackForce = (player.knockbackForce || 1) + 2;
      }
    },
    regen: {
      id: 'regen',
      name: 'Regeneration',
      description: 'Passively heal 0.1 HP per second',
      icon: '🌱',
      apply: (player) => {
        player.regenRate = (player.regenRate || 0) + 0.1;
      }
    },
    critChance: {
      id: 'critChance',
      name: 'Critical Strike',
      description: 'Deal 2x damage with 25% chance',
      icon: '⭐',
      apply: (player) => {
        player.critChance = (player.critChance || 0) + 0.25;
        player.critMultiplier = player.critMultiplier || 2;
      }
    }
    ,
    // Neue Upgrades: Magnet, Blitz, Kettenblitz, Feuerball, Frostblitz
    xpMagnet: {
      id: 'xpMagnet',
      name: 'XP-Orb Magnet',
      description: 'Erhöht XP-Aufnahmeradius und Orb-Anziehung',
      icon: '🧲',
      apply: (player) => {
        player.pickupRadius = (player.pickupRadius || 1.0) + 0.6;
        player.magnetRadius = (player.magnetRadius || 0) + 3;
      }
    },
    lightningStrike: {
      id: 'lightningStrike',
      name: 'Blitzschlag',
      description: 'Periodischer Blitzschaden um den Spieler',
      icon: '⚡️',
      apply: (player) => {
        if (!player.lightningEnabled) {
          player.lightningEnabled = true;
          player.lightningCooldown = 4.0;
          player.lightningDamage = 10;
          player.lightningRadius = 4.5;
        } else {
          player.lightningCooldown = Math.max(1.2, player.lightningCooldown * 0.85);
          player.lightningDamage += 3;
          player.lightningRadius += 0.5;
        }
      }
    },
    chainLightning: {
      id: 'chainLightning',
      name: 'Kettenblitz',
      description: 'Projektiltreffer springen auf nahe Gegner über',
      icon: '🪢',
      apply: (player) => {
        if (!player.hasChainLightning) {
          player.hasChainLightning = true;
          player.chainTargets = 2;
          player.chainRadius = 5;
          player.chainDamageMultiplier = 0.6;
        } else {
          player.chainTargets += 1;
          player.chainRadius += 0.8;
          player.chainDamageMultiplier = Math.min(0.85, player.chainDamageMultiplier + 0.05);
        }
      }
    },
    fireball: {
      id: 'fireball',
      name: 'Feuerball',
      description: 'Basis-Schuss wird zu Feuerball mit Brand-Effekt',
      icon: '🔥',
      apply: (player) => {
        if (!player.fireballEnabled) {
          player.fireballEnabled = true;
          player.burnDps = player.burnDps || 4;
          player.burnDuration = player.burnDuration || 3.0;
        } else {
          player.burnDps += 1.5;
          player.burnDuration += 0.6;
        }
        // Elementrotation aktivieren
        player.enableElementRotation && player.enableElementRotation('fire');
      }
    },
    frostbolt: {
      id: 'frostbolt',
      name: 'Frostblitz',
      description: 'Basis-Schuss wird zu Frostblitz mit Verlangsamung',
      icon: '❄️',
      apply: (player) => {
        if (!player.frostboltEnabled) {
          player.frostboltEnabled = true;
          player.slowFactor = player.slowFactor || 0.6;
          player.slowDuration = player.slowDuration || 2.5;
        } else {
          player.slowFactor = Math.max(0.4, (player.slowFactor || 0.6) - 0.05);
          player.slowDuration += 0.4;
        }
        // Elementrotation aktivieren
        player.enableElementRotation && player.enableElementRotation('frost');
      }
    }
  };

  static getRandomUpgrades(count = 3) {
    const upgradeKeys = Object.keys(this.UPGRADES);
    const selected = [];
    const indices = new Set();

    while (selected.length < Math.min(count, upgradeKeys.length)) {
      const idx = Math.floor(Math.random() * upgradeKeys.length);
      if (!indices.has(idx)) {
        indices.add(idx);
        selected.push(this.UPGRADES[upgradeKeys[idx]]);
      }
    }

    return selected;
  }

  static applyUpgrade(player, upgradeId) {
    const upgrade = this.UPGRADES[upgradeId];
    if (upgrade) {
      upgrade.apply(player);
      return true;
    }
    return false;
  }
}
