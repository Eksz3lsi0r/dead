import './style.css';
import { Game } from './game/core/Game.js';
import { Player } from './game/entities/Player.js';
import { InputSystem } from './game/systems/InputSystem.js';
import { SpawnSystem } from './game/systems/SpawnSystem.js';
import { CollisionSystem } from './game/systems/CollisionSystem.js';
import { UpgradeManager } from './game/systems/UpgradeManager.js';

let game;
let player;
let spawnSystem;
let collisionSystem;
let hudInterval;

function initGame() {
  // Clear any existing game
  if (game) {
    game.stop();
    document.body.querySelector('canvas')?.remove();
    document.querySelectorAll('.stats').forEach(el => el.remove());
    clearInterval(hudInterval);
  }

  updateHud(true);

  // Hide game over screen and upgrade modal
  document.getElementById('game-over').style.display = 'none';
  document.getElementById('upgrade-modal').style.display = 'none';
  document.getElementById('instructions').style.display = 'block';

  // Create game instance
  game = new Game();

  // Create player
  player = new Player(game);
  game.addEntity(player);

  // Add systems
  game.addSystem(new InputSystem(player));
  spawnSystem = new SpawnSystem(game, player);
  collisionSystem = new CollisionSystem(game, player, onGameOver);
  game.addSystem(spawnSystem);
  game.addSystem(collisionSystem);

  // Listen for level-up events
  window.addEventListener('playerLevelUp', handleLevelUp);

  hudInterval = setInterval(() => updateHud(false), 100);
  updateHud(false);

  // Start game
  game.start();
}

function onGameOver() {
  clearInterval(hudInterval);
  window.removeEventListener('playerLevelUp', handleLevelUp);
  document.getElementById('instructions').style.display = 'none';
  document.getElementById('final-level').textContent = player.level;
  document.getElementById('final-kills').textContent = player.kills;
  document.getElementById('game-over').style.display = 'block';
}

function handleLevelUp(event) {
  if (!game) return;

  // Pause game
  game.setPaused(true);

  // Get upgrade choices
  const upgrades = UpgradeManager.getRandomUpgrades(3);

  // Create upgrade UI
  const upgradeChoices = document.getElementById('upgrade-choices');
  upgradeChoices.innerHTML = '';

  upgrades.forEach((upgrade) => {
    const btn = document.createElement('button');
    btn.className = 'upgrade-btn';
    btn.innerHTML = `
      <span class="upgrade-icon">${upgrade.icon}</span>
      <span class="upgrade-name">${upgrade.name}</span>
      <span class="upgrade-desc">${upgrade.description}</span>
    `;
    btn.addEventListener('click', () => {
      UpgradeManager.applyUpgrade(player, upgrade.id);
      document.getElementById('upgrade-modal').style.display = 'none';
      game.setPaused(false);
      updateHud(false);
    });
    upgradeChoices.appendChild(btn);
  });

  // Show upgrade modal
  document.getElementById('upgrade-modal').style.display = 'flex';
}

function updateHud(force = false) {
  if (!player) return;

  const healthRatio = Math.max(0, player.health) / player.maxHealth;
  const xpRatio = player.xp / player.xpForNextLevel();

  const healthFill = document.getElementById('health-fill');
  const xpFill = document.getElementById('xp-fill');
  const healthText = document.getElementById('health-text');
  const xpText = document.getElementById('xp-text');

  if (healthFill) healthFill.style.width = `${Math.max(0, Math.min(1, healthRatio)) * 100}%`;
  if (xpFill) xpFill.style.width = `${Math.max(0, Math.min(1, xpRatio)) * 100}%`;
  if (healthText) healthText.textContent = `${Math.round(player.health)} / ${player.maxHealth}`;
  if (xpText) xpText.textContent = `Lv ${player.level}`;

  const levelEl = document.getElementById('level');
  const waveEl = document.getElementById('wave');
  const killsEl = document.getElementById('kills');
  if (levelEl) levelEl.textContent = `Level ${player.level}`;
  if (waveEl && spawnSystem) waveEl.textContent = `Wave ${spawnSystem.wave}`;
  if (killsEl) killsEl.textContent = `Kills ${player.kills}`;

  if (force) {
    if (healthFill) healthFill.style.width = '100%';
    if (xpFill) xpFill.style.width = '0%';
  }
}

// Restart button
document.getElementById('restart-btn').addEventListener('click', () => {
  initGame();
});

// Shop button
document.getElementById('shopButton').addEventListener('click', function () {
  // Logic to open the shop interface
  openShop();
});

function openShop() {
  // Implement the shop opening logic here
  console.log("Shop opened");
}

// Start initial game
initGame();

