import * as THREE from './build/three.module.js';
import { OrbitControls } from './build/OrbitControls.js';
import { DragControls } from './build/DragControls.js';
import { GLTFLoader } from './build/GLTFLoader.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(4, 5, 11);

let mood = 500;
let unpack = false;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = true;
controls.minDistance = 5;
controls.maxDistance = 20;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.5;
controls.autoRotate = false;
controls.target = new THREE.Vector3(0, 1, 0);
controls.update();

const groundGeometry = new THREE.PlaneGeometry(20, 20);
groundGeometry.rotateX(-Math.PI / 2);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, side: THREE.DoubleSide });
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
      child.castShadow = true;
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

const gltfLoader = new GLTFLoader();

const modelPaths = [
  { path: 'public/trial/', file: 'scene2.gltf', position: [-0.4, 3.1, -0.5], scale: 0.003, id: 'scene2' },
  { path: 'public/cup/', file: 'cup.gltf', position: [1.5, 1.5, -0.3], scale: 0.002, id: 'cup' },
  { path: 'public/chocobox/', file: 'chocobox.gltf', position: [2.5, 1.55, 2.5], scale: 0.0002, id: 'chocobox' },
  { path: 'public/album/', file: 'album.gltf', position: [3.3, 1.15, 2], scale: 0.003, id: 'album' },
  { path: 'public/books/', file: 'book.gltf', position: [-2.4, 1.8, 2], scale: 0.006, id: 'books' },
  { path: 'public/laptop/', file: 'laptop.gltf', position: [-2.0, 1.8, 2.9], scale: 0.003, id: 'laptop' },
  { path: 'public/beaver/', file: 'beaver.gltf', position: [-2.8, 2.35, 4], scale: 0.001, id: 'beaver' },
];

modelPaths.forEach(model => {
  gltfLoader.setPath(model.path).load(model.file, (gltf) => {
    const mesh = gltf.scene;
    mesh.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.geometry.computeBoundingBox();
        child.userData.boundingBox = new THREE.Box3().setFromObject(child);
        child.userData.id = model.id;
      }
    });
    mesh.position.set(...model.position);
    mesh.scale.set(model.scale, model.scale, model.scale);
    if (model.rotationY) mesh.rotation.y = model.rotationY;
    scene.add(mesh);
    objects.push(mesh);
    document.getElementById('progress-container').style.display = 'none';
  });
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function onDocumentMouseDown(event) {
  event.preventDefault();
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(objects, true);

  if (intersects.length > 0) {
    if (selectedObject) {
      selectedObject.material.emissive.setHex(selectedObject.currentHex); // Remove previous outline
    }
    selectedObject = intersects[0].object;
    selectedObject.currentHex = selectedObject.material.emissive.getHex();
    selectedObject.material.emissive.setHex(0xff0000); // Outline with red color
  }
}

function onDocumentKeyDown(event) {
  if (event.key === 'p' && selectedObject) {
    selectedObject.traverse((child) => {
      if (child.isMesh) {
        // Store the original material to revert back later if needed
        if (!child.userData.originalMaterial) {
          child.userData.originalMaterial = child.material.clone();
        }

        // Determine the glow color based on userData.id
        let glowColor;
        if (unpack === false) {
          if (selectedObject.userData.id === 'cup' || selectedObject.userData.id === 'scene2' || selectedObject.userData.id === 'chocobox' || selectedObject.userData.id === 'laptop') {
            glowColor = new THREE.Color(0x0000ff); // Blue
          } else if (selectedObject.userData.id === 'books' || selectedObject.userData.id === 'album' || selectedObject.userData.id === 'beaver') {
            glowColor = new THREE.Color(0xffffff); // White
          }
        } else {
          glowColor = new THREE.Color(0xffd700); // Gold
        }

        // Create an emissive material
        const emissiveMaterial = new THREE.MeshStandardMaterial({
          color: child.material.color, // Use the original color
          emissive: glowColor, // Set the emissive color
          emissiveIntensity: 1, // Adjust intensity as needed
          transparent: true,
          opacity: 1, // Fully opaque
          castShadow: true,
          receiveShadow: true
        });

        // Apply the emissive material
        child.material = emissiveMaterial;
      }
    });

    changeLighting(selectedObject.userData.id); // Change lighting based on object ID, where the mood change with it
    if (mood == 610 || mood >= 7000) {
      showUnpackMessage();
    } else if(mood<=300){
      showGameOverMessage();
    }else {
      showTextBox(selectedObject)

    }
    selectedObject = null;

  }
  console.log('unpack: ' + unpack);
  console.log('mood: ' + mood);



}

function showGameOverMessage() {
  const gameOverMessageBox = document.createElement('div');
  gameOverMessageBox.id = 'game-over-message-box';
  gameOverMessageBox.style.position = 'absolute';
  gameOverMessageBox.style.top = '50%';
  gameOverMessageBox.style.left = '50%';
  gameOverMessageBox.style.transform = 'translate(-50%, -50%)';
  gameOverMessageBox.style.padding = '20px';
  gameOverMessageBox.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
  gameOverMessageBox.style.color = 'blue'; // Text color in blue
  gameOverMessageBox.style.border = '1px solid blue';
  gameOverMessageBox.style.borderRadius = '5px';
  gameOverMessageBox.style.fontSize = '50px';
  gameOverMessageBox.style.width = '90%';
  gameOverMessageBox.style.height = '90%';
  gameOverMessageBox.style.display = 'flex';
  gameOverMessageBox.style.justifyContent = 'center';
  gameOverMessageBox.style.alignItems = 'center';
  gameOverMessageBox.style.textAlign = 'center';
  gameOverMessageBox.style.boxShadow = '0 0 20px blue';

  gameOverMessageBox.innerText = ' "I decided to pack and left that day." \nYour character has died.\n\nTRY AGAIN?\n press "y" to try again.';

  document.body.appendChild(gameOverMessageBox);

  function handleGameOverResponse(event) {
    if (event.key === 'y') { // Assuming 'y' key is pressed for yes
      mood = 500; // Reset mood to 500
      gameOverMessageBox.remove();
      document.removeEventListener('keydown', handleGameOverResponse);
    }
  }

  document.addEventListener('keydown', handleGameOverResponse);
}


function showUnpackMessage() {
  const unpackMessageBox = document.createElement('div');
  unpackMessageBox.id = 'unpack-message-box';
  unpackMessageBox.style.position = 'absolute';
  unpackMessageBox.style.top = '50%';
  unpackMessageBox.style.left = '50%';
  unpackMessageBox.style.transform = 'translate(-50%, -50%)';
  unpackMessageBox.style.padding = '20px';
  unpackMessageBox.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
  unpackMessageBox.style.color = 'yellow';
  unpackMessageBox.style.border = '1px solid yellow';
  unpackMessageBox.style.borderRadius = '5px';
  unpackMessageBox.style.fontSize = '50px';
  unpackMessageBox.style.width = '90%';
  unpackMessageBox.style.height = '90%';
  unpackMessageBox.style.display = 'flex';
  unpackMessageBox.style.justifyContent = 'center';
  unpackMessageBox.style.alignItems = 'center';
  unpackMessageBox.style.textAlign = 'center';
  unpackMessageBox.style.boxShadow = '0 0 20px yellow';

  if(unpack==false){
    unpackMessageBox.innerText = '"Maybe i shouldnt leave." \nYou decided to unpack';
  }else if(unpack==true && mood>7000){
    unpackMessageBox.innerText = 'You have unpacked';
  }


  document.body.appendChild(unpackMessageBox);

  function removeUnpackMessage() {
    unpackMessageBox.remove();
    unpack = true; // Set unpack to true after showing the message
    document.removeEventListener('mousedown', removeUnpackMessage);
    document.removeEventListener('keydown', removeUnpackMessage);
  }

  document.addEventListener('mousedown', removeUnpackMessage);
  document.addEventListener('keydown', removeUnpackMessage);
}

function showTextBox(object) {
  const textBox = document.createElement('div');
  textBox.id = 'info-box';
  textBox.style.position = 'absolute';
  textBox.style.top = '50%';
  textBox.style.left = '50%';
  textBox.style.transform = 'translate(-50%, -50%)';
  textBox.style.padding = '10px';
  textBox.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  textBox.style.color = '#fff';
  textBox.style.border = '1px solid #fff';
  textBox.style.borderRadius = '5px';
  textBox.style.fontSize = '40px'; // Increase text size

  let title = '';
  let content = '';
  let size = 'auto';
  let imageSrc = '';

  // Customize title, content, size, and image based on object id and unpack variable
  switch (object.userData.id) {
    case 'scene2':
      title = 'Sphere from Dad';
      content = unpack ? '"I am glad that I have something to remember dad by."' : '"A weird sphere dad got me when I was little.\nI was adamant on it just because it was pretty.\nHe is not here anymore...."';
      break;
    case 'cup':
      title = 'Charlie\'s Cup';
      content = unpack ? '"I should try to talk to her again."' : '"A cup Charlie gave me for my birthday. We don\'t really talk anymore."';
      break;
    case 'chocobox':
      title = 'Chocolate Box';
      content = unpack ? '"Maybe it\'s not too late to give it to him. I can make it again."' : '"Chocolate I made to give to Louis. I couldn\'t muster up the courage to give it to him."';
      break;
    case 'album':
      title = 'University Photos';
      content = unpack ? '"I will have new moments to be happy about."' : '"Photos of my times in university. I seemed to be happy in the photos."';
      break;
    case 'books':
      title = 'Writing Books';
      content = unpack ? '"I think I will try to write again."' : '"Books I used to write. Writing made me happy in the midst of all the stress."';
      break;
    case 'laptop':
      title = 'Graduation Laptop';
      content = unpack ? '"I am happy I managed to graduate."' : '"My laptop. My final grades aren\'t great."';
      break;
    case 'beaver':
      title = 'Handmade Gift';
      content = unpack ? '"I should visit and give this to him."' : '"A gift I handmade for my nephew."';
      break;
    default:
      title = 'Unknown object';
      content = '"Unknown object."';
      break;
  }

  textBox.style.width = size;

  // Create an image element and set its source
  const image = document.createElement('img');
  image.src = imageSrc;
  image.style.width = '100%';
  image.style.borderRadius = '5px';
  image.style.marginBottom = '10px';

  // Append title, image, and text content to the text box
  const titleElement = document.createElement('h2');
  titleElement.textContent = `${title}`;
  titleElement.style.textAlign = 'center';
  titleElement.style.marginBottom = '10px';
  titleElement.style.fontSize = '30px';
  titleElement.style.fontWeight = 'bold';

  textBox.appendChild(titleElement);
  textBox.appendChild(document.createTextNode(content));

  document.body.appendChild(textBox);

  function removeTextBox() {
    textBox.remove();
    document.removeEventListener('mousedown', removeTextBox);
    document.removeEventListener('keydown', removeTextBox);
  }

  document.addEventListener('mousedown', removeTextBox);
  document.addEventListener('keydown', removeTextBox);
}





function changeLighting(objectID) {
  if(unpack==false){
    if (objectID === 'album'||objectID === 'beaver'||objectID === 'books') {
      // Increase intensity and add yellow tint
      spotLight.intensity += 100; // Increase brightness
      mood+=170
      spotLight.color.setHex(0xffff00); // Yellow tint
    } else{
      // Decrease intensity and add blue tint
      spotLight.intensity = Math.max(spotLight.intensity - 200, 0); // Decrease brightness but not below 0
      spotLight.color.setHex(0x0000ff); // Blue tint
      mood-=100
  
    }
  }else{
    spotLight.intensity += 100; // Increase brightness
      mood+=1000
      spotLight.color.setHex(0xffff00); //yellow
  }

}


document.addEventListener('mousedown', onDocumentMouseDown, false);
document.addEventListener('keydown', onDocumentKeyDown, false);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
