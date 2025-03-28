// Constants and Configuration
const CONFIG = {
  MAX_BRANCHES: 15,
  MAX_WATER: 100000,
  MAX_ENERGY: 100000,
  WATER_DECAY_RATE: 0.0001,
  ENERGY_GAIN_RATE: 0.0001,
  WORLD_SIZE: {
    x: 25,
    y: 25,
    z: 25,
  },
  INITIAL_NUTRIENTS: 50,
  INITIAL_WATER: 100,
  INITIAL_OBSTACLES: 10,
  ROOT_GROWTH_RATE: 0.05,
  MIN_RESOURCE_DEPTH: -20, // Shallower depth for resources
  MAX_RESOURCE_DEPTH: -15, // Shallower maximum depth
};

// Game state
const gameState = {
  paused: true,
  gameOver: false,
  waterLevel: 100,
  energy: 90,
  score: 0,
  branches: [],
  nutrients: [],
  waterParticles: [],
  obstacles: [],
  activeBranch: null,
  keysPressed: {},
};

// Nutrient types
const NUTRIENTS = {
  macro: [
    {
      type: "Nitrogen",
      color: 0x00ff00,
      size: 1,
      score: 40,
      water: 5,
      energy: 60,
    }, // N = Nitrogen
    {
      type: "Phosphorus",
      color: 0xff00ff,
      size: 1,
      score: 30,
      water: 3,
      energy: 35,
    }, // P = Phosphorus
    {
      type: "Carbon",
      color: 0x8b4513,
      size: 1,
      score: 20,
      water: 0,
      energy: 30,
    }, // C = Carbon
    {
      type: "Potassium",
      color: 0xffff00,
      size: 1,
      score: 25,
      water: 2,
      energy: 55,
    }, // K = Potassium
  ],
  micro: [
    { type: "Zinc", color: 0xaaaaaa, size: 0.5, score: 5, water: 1, energy: 5 }, // Z = Zinc
    {
      type: "Magnesium",
      color: 0x00ffff,
      size: 0.5,
      score: 5,
      water: 2,
      energy: 4,
    }, // M = Magnesium
    {
      type: "F (Iron)",
      color: 0xffa500,
      size: 0.5,
      score: 5,
      water: 1,
      energy: 6,
    }, // F = Iron
    {
      type: "Boron",
      color: 0x8a2be2,
      size: 0.5,
      score: 5,
      water: 1,
      energy: 7,
    }, // B = Boron
    {
      type: "Cu (Copper)",
      color: 0x00ff7f,
      size: 0.5,
      score: 5,
      water: 1,
      energy: 5,
    }, // C = Copper
    {
      type: "Manganese",
      color: 0x7fffd4,
      size: 0.5,
      score: 5,
      water: 1,
      energy: 5,
    }, // M = Manganese
    {
      type: "Molybdenum",
      color: 0xff6347,
      size: 0.5,
      score: 5,
      water: 1,
      energy: 5,
    }, // M = Molybdenum
    {
      type: "Chlorine",
      color: 0x4682b4,
      size: 0.5,
      score: 5,
      water: 1,
      energy: 5,
    }, // C = Chlorine
    {
      type: "Nickel",
      color: 0x8b0000,
      size: 0.5,
      score: 5,
      water: 1,
      energy: 5,
    }, // N = Nickel
    {
      type: "Sulfur",
      color: 0x006400,
      size: 0.5,
      score: 5,
      water: 1,
      energy: 5,
    }, // S = Sulfur
    {
      type: "Selenium",
      color: 0x8b008b,
      size: 0.5,
      score: 5,
      water: 1,
      energy: 5,
    }, // S = Selenium
    {
      type: "Iodine",
      color: 0xff4500,
      size: 0.5,
      score: 5,
      water: 2,
      energy: 3,
    }, // I = Iodine
    {
      type: "Flourine",
      color: 0x8b4513,
      size: 0.5,
      score: 5,
      water: 1,
      energy: 5,
    }, // F = Fluorine
    {
      type: "Cobalt",
      color: 0xb87333,
      size: 0.5,
      score: 5,
      water: 0,
      energy: 8,
    }, // C = Cobalt
  ],
};

// UI Elements and Three.js globals
let uiElements = {};
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let mouseDown = false;
let scene, camera, renderer;
let soil, rootAnchor, stem;

// Initialize Three.js
function initializeThreeJS() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x87ceeb, 0.3);
  document.getElementById("container").appendChild(renderer.domElement);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  addLighting();
}

function addLighting() {
  const ambientLight = new THREE.AmbientLight(0x606060);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
}

function createSoil() {
  const soilGeometry = new THREE.PlaneGeometry(50, 50);
  const soilTexture = new THREE.TextureLoader().load(
    "https://threejs.org/examples/textures/terrain/grasslight-big.jpg"
  );
  soilTexture.wrapS = THREE.RepeatWrapping;
  soilTexture.wrapT = THREE.RepeatWrapping;
  soilTexture.repeat.set(5, 5);
  const soilMaterial = new THREE.MeshPhongMaterial({
    map: soilTexture,
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7,
  });
  soil = new THREE.Mesh(soilGeometry, soilMaterial);
  soil.rotation.x = Math.PI / 2;
  scene.add(soil);
}

function createPlant() {
  const stemGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 16);
  const stemMaterial = new THREE.MeshPhongMaterial({ color: 0x228b22 });
  stem = new THREE.Mesh(stemGeometry, stemMaterial);
  stem.position.y = 1.5;
  scene.add(stem);

  const anchorGeometry = new THREE.SphereGeometry(0.8, 16, 16);
  const anchorMaterial = new THREE.MeshPhongMaterial({ color: 0xd2b48c });
  rootAnchor = new THREE.Mesh(anchorGeometry, anchorMaterial);
  rootAnchor.position.y = 0;
  scene.add(rootAnchor);

  createLeaves();
}

function createLeaves() {
  const leafGeometry = new THREE.PlaneGeometry(1, 0.5);
  const leafMaterial = new THREE.MeshPhongMaterial({
    color: 0x228b22,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  });

  for (let i = 0; i < 8; i++) {
    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
    const height = 1.5 + (i % 4) * 0.5;
    const angle = (i * Math.PI) / 4;
    leaf.position.set(Math.cos(angle) * 0.5, height, Math.sin(angle) * 0.5);
    leaf.rotation.y = angle;
    leaf.rotation.z = Math.PI / 4 + (Math.random() - 0.5) * 0.2;
    scene.add(leaf);
  }
}

// Restored multi-segment RootBranch with proper path persistence
class RootBranch {
  constructor(startPosition, parentDirection = null) {
    this.geometry = new THREE.BufferGeometry();
    this.positions = []; // Array of x, y, z coordinates
    this.material = new THREE.MeshPhongMaterial({ color: 0xd2b48c });
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this.startPosition = startPosition.clone();
    this.tipPosition = startPosition.clone();
    this.positions.push(startPosition.x, startPosition.y, startPosition.z);

    this.direction = parentDirection
      ? parentDirection.clone()
      : new THREE.Vector3(0, -0.05, 0);
    this.growthSpeed = CONFIG.ROOT_GROWTH_RATE;
    this.isActive = true;
    this.age = 0;
    this.nutrientHistory = [];

    scene.add(this.mesh);
  }

  update() {
    if (!this.isActive || gameState.paused || gameState.gameOver) return;

    this.age++;

    if (gameState.waterLevel > 0) {
      this.grow();
      this.updateGeometry();
    }
  }

  grow() {
    this.direction.x += (Math.random() - 0.5) * 0.02;
    this.direction.z += (Math.random() - 0.5) * 0.02;
    this.direction.y -= Math.random() * 0.01;
    this.direction.normalize();

    this.tipPosition.addScaledVector(this.direction, this.growthSpeed);
    this.growthSpeed = 0.03 + (gameState.waterLevel / CONFIG.MAX_WATER) * 0.04;

    // Add new point every few frames for smoother growth
    if (this.age % 5 === 0) {
      this.positions.push(
        this.tipPosition.x,
        this.tipPosition.y,
        this.tipPosition.z
      );
    }

    this.enforceWorldBoundaries();
  }

  updateGeometry() {
    const points = [];
    for (let i = 0; i < this.positions.length; i += 3) {
      points.push(
        new THREE.Vector3(
          this.positions[i],
          this.positions[i + 1],
          this.positions[i + 2]
        )
      );
    }
    points.push(this.tipPosition); // Ensure tip is included

    const path = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(path, 64, 0.2, 8, false);
    this.mesh.geometry.dispose();
    this.mesh.geometry = tubeGeometry;
  }

  enforceWorldBoundaries() {
    const bounds = CONFIG.WORLD_SIZE;
    this.tipPosition.x = THREE.MathUtils.clamp(
      this.tipPosition.x,
      -bounds.x,
      bounds.x
    );
    this.tipPosition.y = THREE.MathUtils.clamp(
      this.tipPosition.y,
      -bounds.y,
      0
    );
    this.tipPosition.z = THREE.MathUtils.clamp(
      this.tipPosition.z,
      -bounds.z,
      bounds.z
    );
  }
}

function spawnNutrient() {
  const isMacro = Math.random() > 0.7;
  const nutrientList = isMacro ? NUTRIENTS.macro : NUTRIENTS.micro;
  const nutrientData =
    nutrientList[Math.floor(Math.random() * nutrientList.length)];

  const geometry = isMacro
    ? new THREE.SphereGeometry(nutrientData.size, 16, 16)
    : new THREE.BoxGeometry(
        nutrientData.size,
        nutrientData.size,
        nutrientData.size
      );

  const material = new THREE.MeshPhongMaterial({
    color: nutrientData.color,
    emissive: nutrientData.color,
    emissiveIntensity: 0.3,
  });

  const nutrient = new THREE.Mesh(geometry, material);

  let validPosition = false;
  let position = new THREE.Vector3();
  const maxAttempts = 20;
  let attempts = 0;

  while (!validPosition && attempts < maxAttempts) {
    attempts++;
    position.set(
      (Math.random() - 0.5) * 40,
      CONFIG.MIN_RESOURCE_DEPTH +
        Math.random() * (CONFIG.MAX_RESOURCE_DEPTH - CONFIG.MIN_RESOURCE_DEPTH),
      (Math.random() - 0.5) * 40
    );

    validPosition = true;
    for (const obstacle of gameState.obstacles) {
      if (position.distanceTo(obstacle.position) < 3) {
        validPosition = false;
        break;
      }
    }
  }

  nutrient.position.copy(position);
  nutrient.userData = {
    type: nutrientData.type,
    score: nutrientData.score,
    water: nutrientData.water,
    energy: nutrientData.energy,
  };

  addNutrientParticles(nutrient, nutrientData);
  scene.add(nutrient);
  gameState.nutrients.push(nutrient);
}

function addNutrientParticles(nutrient, nutrientData) {
  const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const particleMaterial = new THREE.MeshBasicMaterial({
    color: nutrientData.color,
    transparent: true,
    opacity: 0.5,
  });

  for (let i = 0; i < 3; i++) {
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    nutrient.add(particle);
    const angle = Math.random() * Math.PI * 2;
    const radius = nutrientData.size * 1.5;
    particle.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      0
    );
  }
}

function spawnWaterParticle() {
  const geometry = new THREE.SphereGeometry(0.3, 8, 8);
  const material = new THREE.MeshPhongMaterial({
    color: 0x1e90ff,
    transparent: true,
    opacity: 0.7,
    emissive: 0x1e90ff,
    emissiveIntensity: 0.3,
  });

  const water = new THREE.Mesh(geometry, material);
  water.position.set(
    (Math.random() - 0.5) * 40,
    CONFIG.MIN_RESOURCE_DEPTH +
      Math.random() * (CONFIG.MAX_RESOURCE_DEPTH - CONFIG.MIN_RESOURCE_DEPTH),
    (Math.random() - 0.5) * 40
  );

  water.userData = { type: "water", value: 10 };
  scene.add(water);
  gameState.waterParticles.push(water);
}

function spawnObstacle() {
  const geometry = new THREE.DodecahedronGeometry(1 + Math.random() * 2, 0);
  const material = new THREE.MeshPhongMaterial({
    color: 0x888888,
    flatShading: true,
  });

  const rock = new THREE.Mesh(geometry, material);
  rock.position.set(
    (Math.random() - 0.5) * 40,
    CONFIG.MIN_RESOURCE_DEPTH +
      Math.random() * (CONFIG.MAX_RESOURCE_DEPTH - CONFIG.MIN_RESOURCE_DEPTH),
    (Math.random() - 0.5) * 40
  );

  rock.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );
  scene.add(rock);
  gameState.obstacles.push(rock);
}

function processInput() {
  if (!gameState.activeBranch || gameState.paused || gameState.gameOver) return;

  let dirX = 0;
  let dirY = 0;
  let dirZ = 0;

  if (
    gameState.keysPressed["ArrowUp"] ||
    gameState.keysPressed["w"] ||
    gameState.keysPressed["W"]
  )
    dirZ = -1;
  if (
    gameState.keysPressed["ArrowDown"] ||
    gameState.keysPressed["s"] ||
    gameState.keysPressed["S"]
  )
    dirZ = 1;
  if (
    gameState.keysPressed["ArrowLeft"] ||
    gameState.keysPressed["a"] ||
    gameState.keysPressed["A"]
  )
    dirX = -1;
  if (
    gameState.keysPressed["ArrowRight"] ||
    gameState.keysPressed["d"] ||
    gameState.keysPressed["D"]
  )
    dirX = 1;
  if (gameState.keysPressed["q"] || gameState.keysPressed["Q"]) dirY = -1;
  if (gameState.keysPressed["e"] || gameState.keysPressed["E"]) dirY = 1;

  if (mouseDown) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(soil);

    if (intersects.length > 0) {
      const target = intersects[0].point;
      target.y = Math.min(0, target.y);

      const direction = new THREE.Vector3()
        .subVectors(target, gameState.activeBranch.tipPosition)
        .normalize();

      dirX = dirX * 0.5 + direction.x * 0.5;
      dirY = dirY * 0.5 + direction.y * 0.5;
      dirZ = dirZ * 0.5 + direction.z * 0.5;
    }
  }

  if (dirX !== 0 || dirY !== 0 || dirZ !== 0) {
    gameState.activeBranch.direction.set(dirX, dirY, dirZ).normalize();
  }
}

function createNewBranch() {
  if (
    gameState.branches.length >= CONFIG.MAX_BRANCHES ||
    !gameState.activeBranch ||
    gameState.gameOver ||
    gameState.energy < 10
  )
    return;

  gameState.energy -= 10;
  gameState.activeBranch.isActive = false;

  const newBranch = new RootBranch(
    gameState.activeBranch.tipPosition.clone(),
    gameState.activeBranch.direction.clone()
  );

  gameState.branches.push(newBranch);
  gameState.activeBranch = newBranch;

  displayMessage(
    `New root branch (${gameState.branches.length}/${CONFIG.MAX_BRANCHES})`,
    2000
  );
  createBranchingEffect(newBranch.tipPosition);
}

function createBranchingEffect(position) {
  const glowGeometry = new THREE.SphereGeometry(0.5, 16, 16);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.7,
  });

  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.copy(position);
  scene.add(glow);

  let glowSize = 0.5;
  const glowInterval = setInterval(() => {
    glowSize += 0.1;
    glow.scale.set(glowSize, glowSize, glowSize);
    glow.material.opacity -= 0.05;
    if (glow.material.opacity <= 0) {
      clearInterval(glowInterval);
      scene.remove(glow);
    }
  }, 50);
}

function updateResourceDisplay() {
  uiElements.waterDisplay.textContent = `Water: ${Math.floor(
    gameState.waterLevel
  )}%`;
  uiElements.energyDisplay.textContent = `Energy: ${Math.floor(
    gameState.energy
  )}%`;
  uiElements.waterDisplay.style.color =
    gameState.waterLevel < 30 ? "red" : "white";
  uiElements.energyDisplay.style.color =
    gameState.energy < 20 ? "red" : "white";
  uiElements.scoreDisplay.textContent = `Score: ${gameState.score} | Branches: ${gameState.branches.length}/${CONFIG.MAX_BRANCHES}`;
}

function displayMessage(text, duration = 2000) {
  uiElements.messageDisplay.textContent = text;
  if (duration > 0) {
    setTimeout(() => {
      uiElements.messageDisplay.textContent = "";
    }, duration);
  }
}

function resetGame() {
  gameState.branches.forEach((branch) => scene.remove(branch.mesh));
  gameState.nutrients.forEach((nutrient) => scene.remove(nutrient));
  gameState.waterParticles.forEach((water) => scene.remove(water));
  gameState.obstacles.forEach((obstacle) => scene.remove(obstacle));

  gameState.branches = [];
  gameState.nutrients = [];
  gameState.waterParticles = [];
  gameState.obstacles = [];

  gameState.score = 0;
  gameState.waterLevel = 100;
  gameState.energy = 50;
  gameState.gameOver = false;
  gameState.paused = false;

  const initialRootPosition = new THREE.Vector3(0, 0, 0);
  const firstBranch = new RootBranch(initialRootPosition);
  gameState.branches.push(firstBranch);
  gameState.activeBranch = firstBranch;

  for (let i = 0; i < CONFIG.INITIAL_NUTRIENTS; i++) spawnNutrient();
  for (let i = 0; i < CONFIG.INITIAL_WATER; i++) spawnWaterParticle();
  for (let i = 0; i < CONFIG.INITIAL_OBSTACLES; i++) spawnObstacle();

  camera.position.set(0, 10, 15);
  camera.lookAt(0, 0, 0);

  displayMessage("Game Restarted", 2000);
}

function checkObstacleCollisions() {
  if (!gameState.activeBranch || !gameState.activeBranch.isActive) return;

  for (const obstacle of gameState.obstacles) {
    const distance = gameState.activeBranch.tipPosition.distanceTo(
      obstacle.position
    );
    if (distance < 2) {
      gameState.activeBranch.direction.multiplyScalar(-0.8);
      gameState.activeBranch.growthSpeed *= 0.5;
      displayMessage("Hit a rock!", 1000);
      return;
    }
  }
}

function checkResourceAbsorption() {
  if (!gameState.activeBranch || !gameState.activeBranch.isActive) return;

  for (let i = gameState.nutrients.length - 1; i >= 0; i--) {
    const nutrient = gameState.nutrients[i];
    const distance = gameState.activeBranch.tipPosition.distanceTo(
      nutrient.position
    );
    if (distance < 1) {
      absorbNutrient(nutrient, i);
    }
  }

  for (let i = gameState.waterParticles.length - 1; i >= 0; i--) {
    const water = gameState.waterParticles[i];
    const distance = gameState.activeBranch.tipPosition.distanceTo(
      water.position
    );
    if (distance < 1) {
      absorbWater(water, i);
    }
  }
}

function absorbNutrient(nutrient, index) {
  createAbsorptionEffect(nutrient.position, nutrient.material.color);
  scene.remove(nutrient);

  gameState.score += nutrient.userData.score;
  gameState.waterLevel = Math.min(
    CONFIG.MAX_WATER,
    gameState.waterLevel + nutrient.userData.water
  );
  gameState.energy = Math.min(
    CONFIG.MAX_ENERGY,
    gameState.energy + nutrient.userData.energy
  );
  displayMessage(`Absorbed ${nutrient.userData.type}`, 1000);
  gameState.activeBranch.nutrientHistory.push(nutrient.userData.type);

  gameState.nutrients.splice(index, 1);
  spawnNutrient();

  const branchChance = (gameState.energy / CONFIG.MAX_ENERGY) * 0.3;
  if (
    Math.random() < branchChance &&
    gameState.branches.length < CONFIG.MAX_BRANCHES
  ) {
    setTimeout(() => createNewBranch(), 500);
  }
}

function absorbWater(water, index) {
  scene.remove(water);
  gameState.waterLevel = Math.min(
    CONFIG.MAX_WATER,
    gameState.waterLevel + water.userData.value
  );
  displayMessage("Water absorbed!", 1000);
  gameState.waterParticles.splice(index, 1);
  setTimeout(() => spawnWaterParticle(), Math.random() * 10000);
}

function createAbsorptionEffect(position, color) {
  const effectGeometry = new THREE.SphereGeometry(0.3, 8, 8);
  const effectMaterial = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.7,
  });

  const effect = new THREE.Mesh(effectGeometry, effectMaterial);
  effect.position.copy(position);
  scene.add(effect);

  let size = 0.3;
  const effectInterval = setInterval(() => {
    size += 0.1;
    effect.scale.set(size, size, size);
    effect.material.opacity -= 0.05;
    if (effect.material.opacity <= 0) {
      clearInterval(effectInterval);
      scene.remove(effect);
    }
  }, 50);
}

function updateResources() {
  gameState.waterLevel = Math.max(
    0,
    gameState.waterLevel - CONFIG.WATER_DECAY_RATE
  );
  if (gameState.waterLevel > 0) {
    const branchFactor = Math.min(gameState.branches.length / 5, 1);
    gameState.energy = Math.min(
      CONFIG.MAX_ENERGY,
      gameState.energy + CONFIG.ENERGY_GAIN_RATE * branchFactor
    );
  }

  if (gameState.waterLevel <= 0 && gameState.energy <= 0) {
    gameState.gameOver = true;
    displayMessage(
      `Game Over! Final Score: ${gameState.score} - Press R to restart`
    );
  }
}

function updateCamera() {
  if (gameState.activeBranch) {
    const tipPos = gameState.activeBranch.tipPosition;
    const cameraY = Math.max(0, tipPos.y + 10);
    const targetPosition = new THREE.Vector3(tipPos.x, cameraY, tipPos.z + 15);
    camera.position.lerp(targetPosition, 0.05);
    camera.lookAt(tipPos);
  }
}

function animate() {
  requestAnimationFrame(animate);

  if (!gameState.gameOver && !gameState.paused) {
    processInput();
    gameState.branches.forEach((branch) => branch.update());

    gameState.nutrients.forEach((nutrient) => {
      const distance = gameState.activeBranch.tipPosition.distanceTo(
        nutrient.position
      );
      nutrient.material.emissiveIntensity = distance < 5 ? 1 : 0.3;
      nutrient.rotation.y += 0.01;
    });

    gameState.waterParticles.forEach((water) => {
      const distance = gameState.activeBranch.tipPosition.distanceTo(
        water.position
      );
      water.material.emissiveIntensity = distance < 5 ? 1 : 0.3;
      water.rotation.y += 0.01;
    });

    checkObstacleCollisions();
    checkResourceAbsorption();
    updateResources();
    updateCamera();
    updateResourceDisplay();
  }

  renderer.render(scene, camera);
}

function initializeGame() {
  initializeThreeJS();
  createSoil();
  createPlant();

  const initialRootPosition = new THREE.Vector3(0, 0, 0);
  const firstBranch = new RootBranch(initialRootPosition);
  gameState.branches.push(firstBranch);
  gameState.activeBranch = firstBranch;

  for (let i = 0; i < CONFIG.INITIAL_NUTRIENTS; i++) spawnNutrient();
  for (let i = 0; i < CONFIG.INITIAL_WATER; i++) spawnWaterParticle();
  for (let i = 0; i < CONFIG.INITIAL_OBSTACLES; i++) spawnObstacle();

  uiElements.scoreDisplay = document.getElementById("score");
  uiElements.waterDisplay = document.getElementById("water");
  uiElements.energyDisplay = document.getElementById("energy");
  uiElements.messageDisplay = document.getElementById("message");

  document.addEventListener("keydown", (event) => {
    gameState.keysPressed[event.key] = true;
    if (event.key === "r" || event.key === "R") resetGame();
    if (event.key === " ") createNewBranch();
    if (event.key === "p" || event.key === "P") togglePause();
  });

  document.addEventListener("keyup", (event) => {
    gameState.keysPressed[event.key] = false;
  });

  document.addEventListener("mousemove", (event) => {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  });

  document.addEventListener("mousedown", (event) => {
    event.preventDefault();
    mouseDown = true;
  });

  document.addEventListener("mouseup", (event) => {
    event.preventDefault();
    mouseDown = false;
  });

  document.addEventListener(
    "touchstart",
    (event) => {
      event.preventDefault();
      if (event.touches.length > 0) {
        mouseDown = true;
        mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
      }
    },
    false
  );

  document.addEventListener(
    "touchmove",
    (event) => {
      event.preventDefault();
      if (event.touches.length > 0) {
        mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
      }
    },
    false
  );

  document.addEventListener(
    "touchend",
    (event) => {
      event.preventDefault();
      mouseDown = false;
    },
    false
  );

  document
    .getElementById("restart-button")
    .addEventListener("click", resetGame);
  document
    .getElementById("new-branch-button")
    .addEventListener("click", createNewBranch);
  document
    .getElementById("pause-button")
    .addEventListener("click", togglePause);

  if ("ontouchstart" in window) {
    displayMessage(
      "Tap 'Start' to begin. Tap screen to direct root growth.",
      0
    );
  } else {
    displayMessage("Press P to start", 0);
  }

  camera.position.set(0, 10, 15);
  camera.lookAt(0, 0, 0);
  animate();
}

function togglePause() {
  gameState.paused = !gameState.paused;
  const pauseButton = document.getElementById("pause-button");
  if (gameState.paused) {
    pauseButton.textContent = "Resume";
    displayMessage("Paused", 1000);
  } else {
    pauseButton.textContent = "Pause";
    displayMessage("Resumed", 1000);
  }
}

window.onload = initializeGame;
