import * as THREE from './three.module.js';
class OutlineEffect {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.selectedObject = null;
    this.outlineMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      side: THREE.BackSide
    });
  }

  selectObject(object) {
    if (this.selectedObject) {
      this.scene.remove(this.selectedObject.userData.outline);
      this.selectedObject = null;
    }

    if (object) {
      const outline = new THREE.Mesh(object.geometry.clone(), this.outlineMaterial);
      outline.scale.multiplyScalar(1.05); // Slightly larger than the original object
      outline.position.copy(object.position);
      outline.rotation.copy(object.rotation);
      outline.userData = { originalObject: object };
      this.scene.add(outline);
      object.userData.outline = outline;
      this.selectedObject = object;
    }
  }

  removeSelection() {
    if (this.selectedObject) {
      this.scene.remove(this.selectedObject.userData.outline);
      this.selectedObject = null;
    }
  }

  updateOutlinePosition() {
    if (this.selectedObject) {
      const outline = this.selectedObject.userData.outline;
      outline.position.copy(this.selectedObject.position);
      outline.rotation.copy(this.selectedObject.rotation);
      outline.scale.copy(this.selectedObject.scale).multiplyScalar(1.05);
    }
  }
}

export { OutlineEffect };
