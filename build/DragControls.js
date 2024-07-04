import {
	EventDispatcher,
	Matrix4,
	Plane,
	Raycaster,
	Vector2,
	Vector3,
	Box3
} from '../build/three.module.js';

const _plane = new Plane();
const _raycaster = new Raycaster();

const _pointer = new Vector2();
const _offset = new Vector3();
const _intersection = new Vector3();
const _worldPosition = new Vector3();
const _inverseMatrix = new Matrix4();

const GRID_SIZE = 50;
const FIXED_Y = 25; // Set this to the desired floor level

class DragControls extends EventDispatcher {

	constructor( _objects, _camera, _domElement ) {

		super();

		_domElement.style.touchAction = 'none'; // disable touch scroll

		let _selected = null, _hovered = null;

		const _intersections = [];

		this.mode = 'translate';
		this.rotateSpeed = 1;

		const scope = this;

		function activate() {
			_domElement.addEventListener( 'pointermove', onPointerMove );
			_domElement.addEventListener( 'pointerdown', onPointerDown );
			_domElement.addEventListener( 'pointerup', onPointerCancel );
			_domElement.addEventListener( 'pointerleave', onPointerCancel );
		}

		function deactivate() {
			_domElement.removeEventListener( 'pointermove', onPointerMove );
			_domElement.removeEventListener( 'pointerdown', onPointerDown );
			_domElement.removeEventListener( 'pointerup', onPointerCancel );
			_domElement.removeEventListener( 'pointerleave', onPointerCancel );
			_domElement.style.cursor = '';
		}

		function dispose() {
			deactivate();
		}

		function getObjects() {
			return _objects;
		}

		function setObjects( objects ) {
			_objects = objects;
		}

		function getRaycaster() {
			return _raycaster;
		}

		function onPointerMove( event ) {
			if ( scope.enabled === false ) return;
		
			updatePointer( event );
			_raycaster.setFromCamera( _pointer, _camera );
		
			if ( _selected ) {
				if ( _raycaster.ray.intersectPlane( _plane, _intersection ) ) {
					// Set the object's position based on the intersection point
					_selected.position.copy( _intersection.sub( _offset ).applyMatrix4( _inverseMatrix ) );
		
					// Snap to grid
					_selected.position.x = Math.round(_selected.position.x / GRID_SIZE) * GRID_SIZE;
					_selected.position.z = Math.round(_selected.position.z / GRID_SIZE) * GRID_SIZE;
		
					// Fix Y position
					_selected.position.y = FIXED_Y;
		
					// Apply boundary limits
					const boundingBox = new Box3().setFromObject(_selected);
					const minX = -400;
					const maxX = 400;
					const minZ = -400;
					const maxZ = 400;
		
					// Adjust for scaling
					const scaleX = _selected.scale.x;
					const scaleZ = _selected.scale.z;
					const halfWidthX = (boundingBox.max.x - boundingBox.min.x) / 2 * scaleX;
					const halfWidthZ = (boundingBox.max.z - boundingBox.min.z) / 2 * scaleZ;
		
					if (_selected.position.x - halfWidthX < minX) _selected.position.x = minX + halfWidthX;
					if (_selected.position.x + halfWidthX > maxX) _selected.position.x = maxX - halfWidthX;
					if (_selected.position.z - halfWidthZ < minZ) _selected.position.z = minZ + halfWidthZ;
					if (_selected.position.z + halfWidthZ > maxZ) _selected.position.z = maxZ - halfWidthZ;
				}
			} else {
				if ( event.pointerType === 'mouse' || event.pointerType === 'pen' ) {
					_intersections.length = 0;
					_raycaster.setFromCamera( _pointer, _camera );
					_raycaster.intersectObjects( _objects, scope.recursive, _intersections );
		
					if ( _intersections.length > 0 ) {
						const object = _intersections[ 0 ].object;
						_plane.setFromNormalAndCoplanarPoint( _camera.getWorldDirection( _plane.normal ), _worldPosition.setFromMatrixPosition( object.matrixWorld ) );
		
						if ( _hovered !== object && _hovered !== null ) {
							scope.dispatchEvent( { type: 'hoveroff', object: _hovered } );
							_domElement.style.cursor = 'auto';
							_hovered = null;
						}
		
						if ( _hovered !== object ) {
							scope.dispatchEvent( { type: 'hoveron', object: object } );
							_domElement.style.cursor = 'pointer';
							_hovered = object;
						}
					} else {
						if ( _hovered !== null ) {
							scope.dispatchEvent( { type: 'hoveroff', object: _hovered } );
							_domElement.style.cursor = 'auto';
							_hovered = null;
						}
					}
				}
			}
		}
		
		function onPointerDown( event ) {
			if ( scope.enabled === false ) return;

			updatePointer( event );
			_intersections.length = 0;
			_raycaster.setFromCamera( _pointer, _camera );
			_raycaster.intersectObjects( _objects, scope.recursive, _intersections );

			if ( _intersections.length > 0 ) {
				const intersectedObject = _intersections[ 0 ].object;

				if ( intersectedObject !== _selected ) {
					_selected = intersectedObject;
					_plane.setFromNormalAndCoplanarPoint( _camera.getWorldDirection( _plane.normal ), _worldPosition.setFromMatrixPosition( _selected.matrixWorld ) );

					if ( _raycaster.ray.intersectPlane( _plane, _intersection ) ) {
						_inverseMatrix.copy( _selected.parent.matrixWorld ).invert();
						_offset.copy( _intersection ).sub( _worldPosition.setFromMatrixPosition( _selected.matrixWorld ) );
					}

					_domElement.style.cursor = 'move';
					scope.dispatchEvent( { type: 'dragstart', object: _selected } );
				}
			}
		}

		function onPointerCancel() {
			if ( scope.enabled === false ) return;

			if ( _selected ) {
				scope.dispatchEvent( { type: 'dragend', object: _selected } );
				_selected = null;
			}

			_domElement.style.cursor = _hovered ? 'pointer' : 'auto';
		}

		function updatePointer( event ) {
			const rect = _domElement.getBoundingClientRect();
			_pointer.x = ( event.clientX - rect.left ) / rect.width * 2 - 1;
			_pointer.y = - ( event.clientY - rect.top ) / rect.height * 2 + 1;
		}

		activate();

		this.enabled = true;
		this.recursive = true;
		this.transformGroup = false;

		this.activate = activate;
		this.deactivate = deactivate;
		this.dispose = dispose;
		this.getObjects = getObjects;
		this.getRaycaster = getRaycaster;
		this.setObjects = setObjects;
	}
}

export { DragControls };
