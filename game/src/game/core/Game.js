import * as THREE from 'three';

export class Game {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.entities = [];
    this.systems = [];
    this.isPaused = false;
    this.lastTime = 0;

    this.init();
  }

  init() {
    // Setup renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    // Setup camera
    this.camera.position.set(0, 20, 20);
    this.camera.lookAt(0, 0, 0);

    // Setup lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(100, 50, 0x444444, 0x222222);
    this.scene.add(gridHelper);

    // Erstelle sichtbare Wände
    this.createWalls();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  createWalls() {
    const wallHeight = 3;
    const wallThickness = 0.5;
    const playAreaSize = 50; // Größer, um mit boundary 24 zu passen
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c3e50,
      roughness: 0.7,
      metalness: 0.3,
      emissive: 0x3498db,
      emissiveIntensity: 0.1
    });

    // Nord-Wand
    const northWall = new THREE.Mesh(
      new THREE.BoxGeometry(playAreaSize, wallHeight, wallThickness),
      wallMaterial
    );
    northWall.position.set(0, wallHeight / 2, -playAreaSize / 2);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    this.scene.add(northWall);

    // Süd-Wand
    const southWall = new THREE.Mesh(
      new THREE.BoxGeometry(playAreaSize, wallHeight, wallThickness),
      wallMaterial
    );
    southWall.position.set(0, wallHeight / 2, playAreaSize / 2);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    this.scene.add(southWall);

    // West-Wand
    const westWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, playAreaSize),
      wallMaterial
    );
    westWall.position.set(-playAreaSize / 2, wallHeight / 2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    this.scene.add(westWall);

    // Ost-Wand
    const eastWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, playAreaSize),
      wallMaterial
    );
    eastWall.position.set(playAreaSize / 2, wallHeight / 2, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    this.scene.add(eastWall);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  addEntity(entity) {
    this.entities.push(entity);
    if (entity.mesh) {
      this.scene.add(entity.mesh);
    }
  }

  removeEntity(entity) {
    const index = this.entities.indexOf(entity);
    if (index > -1) {
      this.entities.splice(index, 1);
      if (entity.mesh) {
        this.scene.remove(entity.mesh);
        if (entity.mesh.geometry) entity.mesh.geometry.dispose();
        if (entity.mesh.material) {
          if (Array.isArray(entity.mesh.material)) {
            entity.mesh.material.forEach(mat => mat.dispose());
          } else {
            entity.mesh.material.dispose();
          }
        }
      }
    }
  }

  addSystem(system) {
    this.systems.push(system);
  }

  setPaused(paused) {
    this.isPaused = paused;
  }

  start() {
    this.lastTime = performance.now();
    this.animate();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  animate = () => {
    this.animationId = requestAnimationFrame(this.animate);

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (!this.isPaused) {
      this.update(deltaTime);
    }

    this.render();
  }

  update(deltaTime) {
    // Update all systems
    for (const system of this.systems) {
      if (system.update) {
        system.update(deltaTime);
      }
    }

    // Update all entities
    for (const entity of this.entities) {
      if (entity.update) {
        entity.update(deltaTime);
      }
    }

    // Cleanup inactive entities
    const inactiveEntities = this.entities.filter(e => e.isActive === false);
    inactiveEntities.forEach(entity => this.removeEntity(entity));
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  getEntitiesByType(type) {
    return this.entities.filter(entity => entity instanceof type);
  }
}
