import * as THREE from 'three';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 30, 100);
        
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(10, 8, 15);
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(this.renderer.domElement);
        
        this.lights = {};
        this.setupLights();
    }
    
    setupLights() {
        // Ambient light
        this.lights.ambient = new THREE.AmbientLight(0x404060);
        this.scene.add(this.lights.ambient);
        
        // Directional light (sun)
        this.lights.sun = new THREE.DirectionalLight(0xffffff, 1);
        this.lights.sun.position.set(10, 20, 5);
        this.lights.sun.castShadow = true;
        this.lights.sun.receiveShadow = true;
        this.lights.sun.shadow.mapSize.width = 2048;
        this.lights.sun.shadow.mapSize.height = 2048;
        this.lights.sun.shadow.camera.near = 0.5;
        this.lights.sun.shadow.camera.far = 50;
        this.lights.sun.shadow.camera.left = -20;
        this.lights.sun.shadow.camera.right = 20;
        this.lights.sun.shadow.camera.top = 20;
        this.lights.sun.shadow.camera.bottom = -20;
        this.scene.add(this.lights.sun);
        
        // Fill light
        this.lights.fill = new THREE.DirectionalLight(0xffeedd, 0.5);
        this.lights.fill.position.set(-10, 10, -10);
        this.scene.add(this.lights.fill);
        
        // Helper lights for night mode
        this.lights.night = [];
    }
    
    setNightMode(isNight) {
        if (isNight) {
            this.scene.background.setHex(0x0a0a2a);
            this.scene.fog.color.setHex(0x0a0a2a);
            this.lights.ambient.intensity = 0.1;
            this.lights.sun.intensity = 0.2;
            
            // Enable night lights
            this.lights.night.forEach(light => light.intensity = 0.5);
        } else {
            this.scene.background.setHex(0x87CEEB);
            this.scene.fog.color.setHex(0x87CEEB);
            this.lights.ambient.intensity = 0.4;
            this.lights.sun.intensity = 1;
            
            // Disable night lights
            this.lights.night.forEach(light => light.intensity = 0);
        }
    }
    
    addNightLight(position, color = 0xffaa00, intensity = 1) {
        const light = new THREE.PointLight(color, 0, 20);
        light.position.set(position.x, position.y, position.z);
        this.scene.add(light);
        this.lights.night.push(light);
        return light;
    }
    
    createRain() {
        const rainCount = 2000;
        const rainGeo = new THREE.BufferGeometry();
        const rainPositions = new Float32Array(rainCount * 3);
        const rainVelocities = [];
        
        for (let i = 0; i < rainCount; i++) {
            rainPositions[i * 3] = (Math.random() - 0.5) * 100;
            rainPositions[i * 3 + 1] = Math.random() * 50;
            rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
            rainVelocities.push((Math.random() * 0.1) + 0.05);
        }
        
        rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
        
        const rainMat = new THREE.PointsMaterial({
            color: 0xaaaaaa,
            size: 0.1,
            transparent: true,
            opacity: 0.5
        });
        
        this.rain = new THREE.Points(rainGeo, rainMat);
        this.rain.userData.velocities = rainVelocities;
        this.scene.add(this.rain);
    }
    
    updateRain() {
        if (!this.rain) return;
        
        const positions = this.rain.geometry.attributes.position.array;
        const velocities = this.rain.userData.velocities;
        
        for (let i = 1; i < positions.length; i += 3) {
            positions[i] -= velocities[Math.floor(i / 3)];
            
            if (positions[i] < -5) {
                positions[i] = 45;
                positions[i - 1] = (Math.random() - 0.5) * 100;
                positions[i + 1] = (Math.random() - 0.5) * 100;
            }
        }
        
        this.rain.geometry.attributes.position.needsUpdate = true;
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}