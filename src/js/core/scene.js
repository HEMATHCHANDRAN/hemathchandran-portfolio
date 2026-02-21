import * as THREE from 'three';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        // Lighting
        this.setupLights();
        
        // Environment
        this.setupEnvironment();
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404060);
        this.scene.add(ambientLight);

        // Directional light (sun)
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(50, 50, 50);
        this.sunLight.castShadow = true;
        this.sunLight.receiveShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 200;
        this.sunLight.shadow.camera.left = -50;
        this.sunLight.shadow.camera.right = 50;
        this.sunLight.shadow.camera.top = 50;
        this.sunLight.shadow.camera.bottom = -50;
        this.scene.add(this.sunLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0xffeedd, 0.5);
        fillLight.position.set(-50, 30, -50);
        this.scene.add(fillLight);

        // Add some point lights for atmosphere
        const pointLight1 = new THREE.PointLight(0xffaa00, 1, 30);
        pointLight1.position.set(20, 5, 20);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x00aaff, 1, 30);
        pointLight2.position.set(-20, 5, -20);
        this.scene.add(pointLight2);
    }

    setupEnvironment() {
        // Ground with texture
        const groundGeometry = new THREE.CircleGeometry(200, 64);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2c3e50,
            roughness: 0.8,
            metalness: 0.2
        });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = 0;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);

        // Grid helper for reference
        const gridHelper = new THREE.GridHelper(200, 50, 0x00ff00, 0x333333);
        gridHelper.position.y = 0.01;
        this.scene.add(gridHelper);

        // Add some trees/objects around
        this.addDecoration();
    }

    addDecoration() {
        // Simple trees (cones on cylinders)
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const radius = 40 + Math.random() * 20;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            this.createTree(x, z);
        }

        // Add some random rocks
        for (let i = 0; i < 30; i++) {
            const x = (Math.random() - 0.5) * 150;
            const z = (Math.random() - 0.5) * 150;
            if (Math.hypot(x, z) > 25) { // Keep center clear
                this.createRock(x, z);
            }
        }
    }

    createTree(x, z) {
        const treeGroup = new THREE.Group();
        
        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.5, 0.7, 2);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        treeGroup.add(trunk);
        
        // Leaves
        const leavesGeo = new THREE.ConeGeometry(1.5, 2, 8);
        const leavesMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.y = 3;
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        treeGroup.add(leaves);
        
        treeGroup.position.set(x, 0, z);
        this.scene.add(treeGroup);
    }

    createRock(x, z) {
        const rockGeo = new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.5);
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.9 });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(x, 0.3, z);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.castShadow = true;
        rock.receiveShadow = true;
        this.scene.add(rock);
    }

    update(deltaTime, clockManager) {
        // Update day/night cycle
        const hour = clockManager.time;
        const intensity = 0.3 + 0.7 * Math.sin((hour - 6) * Math.PI / 12);
        this.sunLight.intensity = Math.max(0.1, intensity);
        
        // Rotate sun
        this.sunLight.position.x = Math.sin(hour * Math.PI / 12) * 100;
        this.sunLight.position.y = Math.cos(hour * Math.PI / 12) * 100;
        this.sunLight.position.z = 50;

        // Update sky color
        if (hour < 6 || hour > 18) {
            this.scene.background.setHex(0x0a0a2a);
        } else if (hour < 7 || hour > 17) {
            this.scene.background.setHex(0xffaa66);
        } else {
            this.scene.background.setHex(0x87CEEB);
        }

        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}