// THE LITTLE PILOT
// A game by Divya Polson and Heather Hsueh
// Prototyping Studio Winter 2020
// Game is based on this tutorial by Karim Maaloul:
// https://tympanus.net/codrops/2016/04/26/the-aviator-animating-basic-3d-scene-threejs/
// Also heavily referenced the Three.js docs:
// https://threejs.org/docs/index.html#manual/en/introduction/Creating-a-scene

// game variables
var game;
var deltaTime = 0;
var newTime = new Date().getTime();
var oldTime = new Date().getTime();
var asteroidsPool = [];

function resetGame() {
  game = {
    speed: 0,
    distance: 0,
    score: 0,

    planeDefaultHeight: 100,
    planeMoveSensivity: 0.005,
    planeRotXSensivity: 0.0008,
    planeRotZSensivity: 0.0004,

    starLastSpawn: 0,
    asteroidLastSpawn: 0,

    status: "playing"
  };
  scoreDisplay.innerHTML = Math.floor(game.score);
}

var scene, camera, fieldOfView, aspectRatio, renderer, container, controls;

var HEIGHT,
  WIDTH,
  mousePos = { x: 0, y: 0 };

// init

function createScene() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  scene = new THREE.Scene();
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 50;
  camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio);
  camera.position.x = 0;
  camera.position.z = 200;
  camera.position.y = game.planeDefaultHeight;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(WIDTH, HEIGHT);

  renderer.shadowMap.enabled = true;

  container = document.getElementById("world");
  container.appendChild(renderer.domElement);

  window.addEventListener("resize", handleWindowResize, false);
}

// mouse and screen events

function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

function handleMouseMove(event) {
  var tx = -1 + (event.clientX / WIDTH) * 2;
  var ty = 1 - (event.clientY / HEIGHT) * 2;
  mousePos = { x: tx, y: ty };
}

function handleMouseUp(event) {
  if (game.status == "waitingReplay") {
    resetGame();
    hideReplay();
  }
}

// LIGHTS

var ambientLight, hemisphereLight, shadowLight;

function createLights() {
  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);

  shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);
  shadowLight.position.set(150, 350, 350);
  shadowLight.castShadow = true;
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;
  shadowLight.shadow.mapSize.width = 4096;
  shadowLight.shadow.mapSize.height = 4096;

  ambientLight = new THREE.AmbientLight(0xdc8874, 0.2);

  scene.add(ambientLight);
  scene.add(hemisphereLight);
  scene.add(shadowLight);
}

var Prince = function() {
  this.mesh = new THREE.Object3D();
  this.mesh.name = "prince";
  this.angleScarfs = 0;

  // body
  var bodyGeom = new THREE.BoxGeometry(20, 35, 20);
  var bodyMat = new THREE.MeshPhongMaterial({
    color: 0xc3ff5c,
    shading: THREE.FlatShading
  });
  var body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.set(15, -10, 0);
  this.mesh.add(body);
  // neck
  var neckGeom = new THREE.BoxGeometry(20, 8, 20);
  var neckMat = new THREE.MeshPhongMaterial({
    color: 0xfae35f,
    shading: THREE.FlatShading
  });
  var neck = new THREE.Mesh(neckGeom, neckMat);
  neck.position.set(15, 10, 0);
  this.mesh.add(neck);
  // face
  var faceGeom = new THREE.BoxGeometry(15, 15, 15);
  var faceMat = new THREE.MeshLambertMaterial({ color: 0xfff1e3 });
  var face = new THREE.Mesh(faceGeom, faceMat);
  face.position.set(15, 20, 0);
  this.mesh.add(face);
  // eyes
  var eyesGeom = new THREE.BoxGeometry(3, 3, 15);
  var eyesMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
  var eyes = new THREE.Mesh(eyesGeom, eyesMat);
  eyes.position.set(18, 21, 0);
  this.mesh.add(eyes);
  // blush
  var blushGeom = new THREE.BoxGeometry(4.5, 2.5, 15);
  var blushMat = new THREE.MeshLambertMaterial({ color: 0xebb2e1 });
  var blush = new THREE.Mesh(blushGeom, blushMat);
  blush.position.set(16, 17, 0);
  this.mesh.add(blush);
  // nose
  var noseGeom = new THREE.BoxGeometry(7.5, 3.5, 3.5);
  var noseMat = new THREE.MeshLambertMaterial({ color: 0xe8d5c3 });
  var nose = new THREE.Mesh(noseGeom, noseMat);
  nose.position.set(22, 19.5, 1);
  this.mesh.add(nose);
  // hair
  var hairGeom = new THREE.BoxGeometry(17, 8, 17);
  var hairMat = new THREE.MeshLambertMaterial({ color: 0xffd900 });
  var hair = new THREE.Mesh(hairGeom, hairMat);
  hair.position.set(15, 30, 0);
  this.mesh.add(hair);
  // scarf
  var scarfGeom = new THREE.BoxGeometry(5, 4, 4);
  var scarfMat = new THREE.MeshLambertMaterial({ color: 0xffd900 });
  var scarf = new THREE.Mesh(scarfGeom, scarfMat);
  scarf.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 4, 0));
  var scarfs = new THREE.Object3D();
  this.scarfSide = new THREE.Object3D();

  // positioning scarf
  for (var i = 0; i < 12; i++) {
    var h = scarf.clone();
    var col = i % 3;
    var row = Math.floor(i / 3);
    var startPosZ = -4;
    var startPosX = -10;
    h.position.set(startPosX + row * 4, 0, startPosZ + col * 4);
    this.scarfSide.add(h);
  }
  scarfs.add(this.scarfSide);

  this.mesh.add(scarfs);
};

// move the scarf
Prince.prototype.moveScarf = function() {
  var scarfs = this.scarfSide.children;
  var l = scarfs.length;
  for (var i = 0; i < l; i++) {
    var h = scarfs[i];
    // each scarf element will scale on cyclical basis between 75% and 100% of its original size
    h.scale.y = 2.0 + Math.cos(this.angleScarfs + i / 3) * 0.25;
  }
  // increment the angle for the next frame
  this.angleScarfs += 0.3;
};

var AirPlane = function() {
  this.mesh = new THREE.Object3D();
  this.mesh.name = "airPlane";

  // cockpit
  var geomCockpit = new THREE.BoxGeometry(80, 50, 50, 1, 1, 1);
  var matCockpit = new THREE.MeshPhongMaterial({
    color: 0xf25346,
    shading: THREE.FlatShading
  });

  geomCockpit.vertices[4].y -= 10;
  geomCockpit.vertices[4].z += 20;
  geomCockpit.vertices[5].y -= 10;
  geomCockpit.vertices[5].z -= 20;
  geomCockpit.vertices[6].y += 30;
  geomCockpit.vertices[6].z += 20;
  geomCockpit.vertices[7].y += 30;
  geomCockpit.vertices[7].z -= 20;

  var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
  cockpit.castShadow = true;
  cockpit.receiveShadow = true;
  this.mesh.add(cockpit);

  // engine
  var geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
  var matEngine = new THREE.MeshPhongMaterial({
    color: 0xd8d0d1,
    shading: THREE.FlatShading
  });
  var engine = new THREE.Mesh(geomEngine, matEngine);
  engine.position.x = 40;
  engine.castShadow = true;
  engine.receiveShadow = true;
  this.mesh.add(engine);

  // tail
  var geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
  var matTailPlane = new THREE.MeshPhongMaterial({
    color: 0xf25346,
    shading: THREE.FlatShading
  });
  var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
  tailPlane.position.set(-34, 25, 0);
  tailPlane.castShadow = true;
  tailPlane.receiveShadow = true;
  this.mesh.add(tailPlane);

  // wing
  var geomSideWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
  var matSideWing = new THREE.MeshPhongMaterial({
    color: 0xf25346,
    shading: THREE.FlatShading
  });
  var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
  sideWing.position.set(0, 0, 0);
  sideWing.castShadow = true;
  sideWing.receiveShadow = true;
  this.mesh.add(sideWing);

  // propeller
  var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
  var matPropeller = new THREE.MeshPhongMaterial({
    color: 0x00000,
    shading: THREE.FlatShading
  });
  this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
  this.propeller.castShadow = true;
  this.propeller.receiveShadow = true;

  // blades
  var geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
  var matBlade = new THREE.MeshPhongMaterial({
    color: 0x00000,
    shading: THREE.FlatShading
  });

  var blade = new THREE.Mesh(geomBlade, matBlade);
  blade.position.set(8, 0, 0);
  blade.castShadow = true;
  blade.receiveShadow = true;
  this.propeller.add(blade);
  this.propeller.position.set(50, 0, 0);
  this.mesh.add(this.propeller);

  this.prince = new Prince();
  this.prince.mesh.position.set(-10, 27, 0);
  this.mesh.add(this.prince.mesh);
};

// generate waves on planet

Planet = function() {
  var geom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);
  geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
  geom.mergeVertices();
  var l = geom.vertices.length;

  this.waves = [];

  for (var i = 0; i < l; i++) {
    var v = geom.vertices[i];
    this.waves.push({
      y: v.y,
      x: v.x,
      z: v.z,
      ang: Math.random() * Math.PI * 2,
      amp: Math.random() * (20 - 5),
      speed: Math.random() * (0.003 - 0.001)
    });
  }
  var mat = new THREE.MeshPhongMaterial({
    color: 0xc4c4c4,
    transparent: true,
    opacity: 0.8,
    shading: THREE.FlatShading
  });

  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.name = "waves";
  this.mesh.receiveShadow = true;

  var stemGeom = new THREE.BoxGeometry(5, 40, 5);
  var stemMat = new THREE.MeshLambertMaterial({ color: 0x29993e });
  var stem = new THREE.Mesh(stemGeom, stemMat);
  stem.position.set(16, 620, -250);
  this.mesh.add(stem);

  var roseGeom = new THREE.BoxGeometry(13, 13, 13);
  var roseMat = new THREE.MeshLambertMaterial({ color: 0xfa5a5a });
  var rose = new THREE.Mesh(roseGeom, roseMat);
  rose.position.set(16, 635, -250);
  this.mesh.add(rose);
};

Planet.prototype.moveWaves = function() {
  var verts = this.mesh.geometry.vertices;
  var l = verts.length;
  for (var i = 0; i < l; i++) {
    var v = verts[i];
    var vprops = this.waves[i];
    v.x = vprops.x + Math.cos(vprops.ang) * vprops.amp;
    v.y = vprops.y + Math.sin(vprops.ang) * vprops.amp;
    vprops.ang += vprops.speed * deltaTime;
    this.mesh.geometry.verticesNeedUpdate = true;
  }
};

// create asteroid obstacles
Asteroid = function() {
  var geom = new THREE.TetrahedronGeometry(8, 2);
  var mat = new THREE.MeshPhongMaterial({
    color: 0x353535,
    shininess: 0,
    specular: 0xffffff,
    shading: THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
};

asteroidsHolder = function() {
  this.mesh = new THREE.Object3D();
  this.asteroidsInUse = [];
};

asteroidsHolder.prototype.spawnAsteroids = function() {
  for (var i = 0; i < 1; i++) {
    var asteroid;
    if (asteroidsPool.length) {
      asteroid = asteroidsPool.pop();
    } else {
      asteroid = new Asteroid();
    }

    asteroid.angle = -(i * 0.1);
    asteroid.distance =
      600 + game.planeDefaultHeight + (-1 + Math.random() * 2) * 60;
    asteroid.mesh.position.y =
      -600 + Math.sin(asteroid.angle) * asteroid.distance;
    asteroid.mesh.position.x = Math.cos(asteroid.angle) * asteroid.distance;

    this.mesh.add(asteroid.mesh);
    this.asteroidsInUse.push(asteroid);
  }
};

asteroidsHolder.prototype.rotateAsteroids = function() {
  for (var i = 0; i < this.asteroidsInUse.length; i++) {
    var asteroid = this.asteroidsInUse[i];
    asteroid.angle += game.speed * deltaTime * 0.6;

    if (asteroid.angle > Math.PI * 2) asteroid.angle -= Math.PI * 2;

    asteroid.mesh.position.y =
      -600 + Math.sin(asteroid.angle) * asteroid.distance;
    asteroid.mesh.position.x = Math.cos(asteroid.angle) * asteroid.distance;
    asteroid.mesh.rotation.z += Math.random() * 0.1;
    asteroid.mesh.rotation.y += Math.random() * 0.1;

    var diffPos = airplane.mesh.position
      .clone()
      .sub(asteroid.mesh.position.clone());
    var d = diffPos.length();
    if (d < 10) {
      this.mesh.remove(asteroid.mesh);
      game.status = "gameover";
      i--;
    } else if (asteroid.angle > Math.PI) {
      asteroidsPool.unshift(this.asteroidsInUse.splice(i, 1)[0]);
      this.mesh.remove(asteroid.mesh);
      i--;
    }
  }
};

// collecting stars!
Star = function() {
  var geom = new THREE.TetrahedronGeometry(5, 0);
  var mat = new THREE.MeshPhongMaterial({
    color: 0xfee42c,
    shininess: 0,
    specular: 0xffffff,
    shading: THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
};

starsHolder = function(nStars) {
  this.mesh = new THREE.Object3D();
  this.starsInUse = [];
  this.starsPool = [];
  for (var i = 0; i < nStars; i++) {
    var star = new Star();
    this.starsPool.push(star);
  }
};

starsHolder.prototype.spawnStars = function() {
  var nStars = 1 + Math.floor(Math.random() * 10);
  var d = 600 + game.planeDefaultHeight + (-1 + Math.random() * 2) * 60;
  var amplitude = 10 + Math.round(Math.random() * 10);
  for (var i = 0; i < nStars; i++) {
    var star;
    if (this.starsPool.length) {
      star = this.starsPool.pop();
    } else {
      star = new Star();
    }
    this.mesh.add(star.mesh);
    this.starsInUse.push(star);
    star.angle = -(i * 0.02);
    star.distance = d + Math.cos(i * 0.5) * amplitude;
    star.mesh.position.y = -600 + Math.sin(star.angle) * star.distance;
    star.mesh.position.x = Math.cos(star.angle) * star.distance;
  }
};

starsHolder.prototype.rotateStars = function() {
  for (var i = 0; i < this.starsInUse.length; i++) {
    var star = this.starsInUse[i];
    star.angle += game.speed * deltaTime * 0.5;
    if (star.angle > Math.PI * 2) star.angle -= Math.PI * 2;
    star.mesh.position.y = -600 + Math.sin(star.angle) * star.distance;
    star.mesh.position.x = Math.cos(star.angle) * star.distance;
    star.mesh.rotation.z += Math.random() * 0.1;
    star.mesh.rotation.y += Math.random() * 0.1;

    var diffPos = airplane.mesh.position
      .clone()
      .sub(star.mesh.position.clone());
    var d = diffPos.length();
    if (d < 15) {
      this.starsPool.unshift(this.starsInUse.splice(i, 1)[0]);
      this.mesh.remove(star.mesh);
      game.score++;
      scoreDisplay.innerHTML = game.score;
      i--;
    } else if (star.angle > Math.PI) {
      this.starsPool.unshift(this.starsInUse.splice(i, 1)[0]);
      this.mesh.remove(star.mesh);
      i--;
    }
  }
};

var planet;
var airplane;

function createPlane() {
  airplane = new AirPlane();
  airplane.mesh.scale.set(0.25, 0.25, 0.25);
  airplane.mesh.position.y = game.planeDefaultHeight;
  scene.add(airplane.mesh);
}

function createPlanet() {
  planet = new Planet();
  planet.mesh.position.y = -600;
  scene.add(planet.mesh);
}

function createStars() {
  starsHolder = new starsHolder(20);
  scene.add(starsHolder.mesh);
}

function createAsteroids() {
  for (var i = 0; i < 10; i++) {
    var asteroid = new Asteroid();
    asteroidsPool.push(asteroid);
  }
  asteroidsHolder = new asteroidsHolder();
  scene.add(asteroidsHolder.mesh);
}

function loop() {
  newTime = new Date().getTime();
  deltaTime = newTime - oldTime;
  oldTime = newTime;

  if (game.status == "playing") {
    // add stars every 100m
    if (
      Math.floor(game.distance) % 100 == 0 &&
      Math.floor(game.distance) > game.starLastSpawn
    ) {
      game.starLastSpawn = Math.floor(game.distance);
      starsHolder.spawnStars();
    }

    if (
      Math.floor(game.distance) % 50 == 0 &&
      Math.floor(game.distance) > game.asteroidLastSpawn
    ) {
      game.asteroidLastSpawn = Math.floor(game.distance);
      asteroidsHolder.spawnAsteroids();
    }

    updatePlane();
    updateDistance();
    game.speed = 0.0007;
  } else if (game.status == "gameover") {
    game.speed *= 1;
    airplane.mesh.rotation.z +=
      (-Math.PI / 2 - airplane.mesh.rotation.z) * 0.0002 * deltaTime;
    airplane.mesh.position.y -= 0.1 * deltaTime;

    if (airplane.mesh.position.y < -50) {
      showReplay();
      game.status = "waitingReplay";
    }
  } else if (game.status == "waitingReplay") {
  }

  airplane.propeller.rotation.x += 0.3;
  planet.mesh.rotation.z += game.speed * deltaTime;

  if (planet.mesh.rotation.z > 2 * Math.PI)
    planet.mesh.rotation.z -= 2 * Math.PI;

  starsHolder.rotateStars();
  asteroidsHolder.rotateAsteroids();
  planet.moveWaves();

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function updateDistance() {
  game.distance += game.speed * deltaTime * 50;
}

function updatePlane() {
  var targetY = normalize(mousePos.y, -0.75, 0.75, 20, 180);
  var targetX = normalize(mousePos.x, -1, 1, -52, -75);

  airplane.mesh.position.y +=
    (targetY - airplane.mesh.position.y) * deltaTime * game.planeMoveSensivity;
  airplane.mesh.position.x +=
    (targetX - airplane.mesh.position.x) * deltaTime * game.planeMoveSensivity;
  airplane.mesh.rotation.z =
    (targetY - airplane.mesh.position.y) * deltaTime * game.planeRotXSensivity;
  airplane.mesh.rotation.x =
    (airplane.mesh.position.y - targetY) * deltaTime * game.planeRotZSensivity;
  camera.fov = normalize(mousePos.x, -1, 1, 40, 80);
  camera.updateProjectionMatrix();
  airplane.prince.moveScarf();
}

function showReplay() {
  replayMessage.style.display = "block";
}

function hideReplay() {
  replayMessage.style.display = "none";
}

function normalize(v, vmin, vmax, tmin, tmax) {
  var nv = Math.max(Math.min(v, vmax), vmin);
  var dv = vmax - vmin;
  var pc = (nv - vmin) / dv;
  var dt = tmax - tmin;
  var tv = tmin + pc * dt;
  return tv;
}

var replayMessage;

function init(event) {
  replayMessage = document.getElementById("replayMessage");
  scoreDisplay = document.getElementById("scoreDisplay");

  resetGame();
  createScene();
  createLights();
  createPlane();
  createPlanet();
  createStars();
  createAsteroids();

  document.addEventListener("mousemove", handleMouseMove, false);
  document.addEventListener("mouseup", handleMouseUp, false);

  loop();
}

window.addEventListener("load", init, false);
