import * as THREE from './build/three.module.js';
import { GLTFLoader } from './build/GLTFLoader.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(0, 5, 10); // Adjusted camera position

// Variables for manual controls
let isRotating = false;
let isPanning = false;
let mouseX = 0, mouseY = 0;

document.addEventListener('mousedown', onMouseDown, false);
document.addEventListener('mousemove', onMouseMove, false);
document.addEventListener('mouseup', onMouseUp, false);
document.addEventListener('keydown', onKeyDown, false);

// Create a circle (target object)
const circleGeometry = new THREE.CircleGeometry(0.1, 32);
const circleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const circle = new THREE.Mesh(circleGeometry, circleMaterial);
scene.add(circle);

const groundGeometry = new THREE.PlaneGeometry(20, 20, 32, 32);
groundGeometry.rotateX(-Math.PI / 2);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x555555,
  side: THREE.DoubleSide
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.castShadow = false;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

const spotLight = new THREE.SpotLight(0xffd700, 300, 100, 0.22, 1);
spotLight.position.set(0, 25, 0);
spotLight.castShadow = true;
spotLight.shadow.bias = -0.0001;
spotLight.shadow.mapSize.width = 2048;
spotLight.shadow.mapSize.height = 2048;
scene.add(spotLight);

const directionalLight = new THREE.DirectionalLight(0x404040, 1);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
scene.add(ambientLight);

const objects = [];
let selectedObject = null;

const loaderRoom = new GLTFLoader().setPath('public/room-furnished/');
loaderRoom.load('roomFurnished.gltf', (gltf) => {
  const meshRoom = gltf.scene;
  meshRoom.traverse((child) => {
    if (child.isMesh) {
      const originalMaterial = child.material;
      child.material = new THREE.MeshStandardMaterial({
        color: originalMaterial.color,
        map: originalMaterial.map,
        metalness: 0.2,
        roughness: 0.8,
      });
      child.castShadow = false;
      child.receiveShadow = true;
      child.geometry.computeBoundingBox();
      child.userData.boundingBox = new THREE.Box3().setFromObject(child);
      child.userData.id = 'Room';
    }
  });

  meshRoom.position.set(-0.4, 0.2, 1.5);
  scene.add(meshRoom);
  meshRoom.scale.set(0.003, 0.003, 0.003);
  meshRoom.rotation.y = -Math.PI / 2;

  document.getElementById('progress-container').style.display = 'none';
});

const loader = new GLTFLoader().setPath('public/trial/');
loader.load('scene2.gltf', (gltf) => {
  const mesh = gltf.scene;
  mesh.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.geometry.computeBoundingBox();
      child.userData.boundingBox = new THREE.Box3().setFromObject(child);
      child.userData.id = 'weirdSphere';
    }
  });
  mesh.position.set(-0.4, 0.2, 1.5);
  scene.add(mesh);
  mesh.scale.set(0.01, 0.01, 0.01);
  objects.push(mesh);
  document.getElementById('progress-container').style.display = 'none';
});

const loader2 = new GLTFLoader().setPath('public/cup/');
loader2.load('cup.gltf', (gltf) => {
  const mesh2 = gltf.scene;
  mesh2.position.set(-1, 2, 2);
  mesh2.traverse((child) => {
    if (child.isMesh) {
      child.userData.id = 'cup';
    }
  });
  scene.add(mesh2);
  mesh2.scale.set(0.0020, 0.0020, 0.0020);
  objects.push(mesh2);
});

const loaderTrophy = new GLTFLoader().setPath('public/trophy/');
loaderTrophy.load('trophy.gltf', (gltf) => {
  const meshTrophy = gltf.scene;
  meshTrophy.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.geometry.computeBoundingBox();
      child.userData.boundingBox = new THREE.Box3().setFromObject(child);
      child.userData.id = 'trophy';
    }
  });
  meshTrophy.position.set(0, 1.2, -0.5);
  meshTrophy.scale.set(0.002, 0.002, 0.002);
  scene.add(meshTrophy);
  objects.push(meshTrophy);
  document.getElementById('progress-container').style.display = 'none';
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function onMouseDown(event) {
  event.preventDefault();
  mouseX = event.clientX;
  mouseY = event.clientY;
  
  if (event.button === 0) { // Left mouse button
    isRotating = true;
  } else if (event.button === 2) { // Right mouse button
    isPanning = true;
  }
}

function onMouseMove(event) {
  if (isRotating) {
    const deltaX = event.clientX - mouseX;
    const deltaY = event.clientY - mouseY;

    const rotationSpeed = 0.005;
    camera.rotation.y += deltaX * rotationSpeed;
    camera.rotation.x += deltaY * rotationSpeed;
    
    mouseX = event.clientX;
    mouseY = event.clientY;
  } else if (isPanning) {
    const deltaX = event.clientX - mouseX;
    const deltaY = event.clientY - mouseY;

    const panSpeed = 0.005;
    camera.position.x -= deltaX * panSpeed;
    camera.position.y += deltaY * panSpeed;
    
    mouseX = event.clientX;
    mouseY = event.clientY;
  }
}

function onMouseUp(event) {
  isRotating = false;
  isPanning = false;
}

function onKeyDown(event) {
  const moveSpeed = 0.2;
  const rotationSpeed = 0.05;
  
  switch (event.key) {
    case 'w':
      moveCameraIfNoCollision(new THREE.Vector3(0, 0, -moveSpeed));
      break;
    case 's':
      moveCameraIfNoCollision(new THREE.Vector3(0, 0, moveSpeed));
      break;
    case 'a':
      moveCameraIfNoCollision(new THREE.Vector3(-moveSpeed, 0, 0));
      break;
    case 'd':
      moveCameraIfNoCollision(new THREE.Vector3(moveSpeed, 0, 0));
      break;
    case 'q':
      camera.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), rotationSpeed);
      break;
    case 'e':
      camera.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), -rotationSpeed);
      break;
    case 'ArrowUp':
      moveCameraIfNoCollision(new THREE.Vector3(0, moveSpeed, 0));
      break;
    case 'ArrowDown':
      moveCameraIfNoCollision(new THREE.Vector3(0, -moveSpeed, 0));
      break;
  }
}

function moveCameraIfNoCollision(delta) {
  const originalPosition = camera.position.clone();
  camera.position.add(delta);

  const raycaster = new THREE.Raycaster();
  const directions = [
    new THREE.Vector3(delta.x, 0, 0).normalize(),
    new THREE.Vector3(0, delta.y, 0).normalize(),
    new THREE.Vector3(0, 0, delta.z).normalize()
  ];

  let collision = false;

  directions.forEach((direction) => {
    raycaster.set(camera.position, direction);
    const intersects = raycaster.intersectObjects(objects, true);

    if (intersects.length > 0 && intersects[0].distance < delta.length()) {
      collision = true;
    }
  });

  if (collision) {
    camera.position.copy(originalPosition);
  }
}

function onDocumentMouseDown(event) {
  event.preventDefault();

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(objects, true);

  if (intersects.length > 0) {
    const object = intersects[0].object;
    showMessage(`Selected ${object.userData.id}.`);
    changeLighting(object.userData.id);
  }
}

function showMessage(message) {
  const textBox = document.createElement('div');
  textBox.style.position = 'absolute';
  textBox.style.top = '10px';
  textBox.style.left = '10px';
  textBox.style.padding = '10px';
  textBox.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  textBox.style.color = '#ffffff';
  textBox.textContent = message;
  document.body.appendChild(textBox);
}

function changeLighting(objectID) {
  if (objectID === 'weirdSphere') {
    // Adjust lighting for specific object
    spotLight.intensity = 300;
  } else if (objectID === 'cup' || objectID === 'trophy') {
    // Adjust lighting for specific object
    spotLight.intensity = Math.max(spotLight.intensity - 50, 0);
    spotLight.color.setHex(0x0000ff); // Blue tint
  }
}

document.addEventListener('mousedown', onDocumentMouseDown, false);

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
