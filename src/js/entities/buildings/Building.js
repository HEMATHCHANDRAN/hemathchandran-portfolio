import * as THREE from 'three';

export class Building {
    constructor(scene, position, size, color = 0x4a90e2) {
        this.scene = scene;
        this.position = position;
        this.size = size;
        this.color = color;
        this.mesh = null;
        this.info = {};
        this.isHighlighted = false;
        
        this.create();
        this.addWindows();
    }

    create() {
        // Main building body
        const geometry = new THREE.BoxGeometry(this.size.x, this.size.y, this.size.z);
        const material = new THREE.MeshStandardMaterial({ 
            color: this.color,
            roughness: 0.4,
            metalness: 0.1,
            emissive: 0x000000
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Add outline effect
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
        line.position.copy(this.mesh.position);
        this.scene.add(line);
        this.outline = line;
        
        this.scene.add(this.mesh);
    }

    addWindows() {
        // Add windows as small cubes on the building
        const windowGeo = new THREE.BoxGeometry(0.5, 0.5, 0.1);
        const windowMat = new THREE.MeshStandardMaterial({ 
            color: 0xffffaa,
            emissive: 0x442200,
            transparent: true,
            opacity: 0.8
        });
        
        const rows = Math.floor(this.size.y / 1.5);
        const cols = Math.floor(this.size.x / 1.5);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (Math.random() > 0.3) { // Some windows
                    const windowMesh = new THREE.Mesh(windowGeo, windowMat);
                    windowMesh.position.set(
                        (col - cols/2) * 1.5 + 0.5,
                        (row - rows/2) * 1.5 + 1,
                        this.size.z/2 + 0.1
                    );
                    windowMesh.castShadow = true;
                    this.mesh.add(windowMesh);
                }
            }
        }
    }

    setInfo(info) {
        this.info = info;
    }

    highlight(enable) {
        if (enable === this.isHighlighted) return;
        
        this.isHighlighted = enable;
        
        if (enable) {
            // Glow effect
            this.mesh.material.emissive.setHex(0x444444);
            this.outline.material.color.setHex(0x00ff00);
        } else {
            this.mesh.material.emissive.setHex(0x000000);
            this.outline.material.color.setHex(0x000000);
        }
    }

    containsPoint(x, z) {
        const halfX = this.size.x / 2;
        const halfZ = this.size.z / 2;
        
        return Math.abs(x - this.position.x) < halfX &&
               Math.abs(z - this.position.z) < halfZ;
    }

    getDistanceFrom(x, z) {
        const dx = x - this.position.x;
        const dz = z - this.position.z;
        return Math.sqrt(dx * dx + dz * dz);
    }
}