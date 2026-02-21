import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './styles/main.css';

// Import managers
import { SceneManager } from './js/core/SceneManager.js';
import { InputManager } from './js/core/InputManager.js';
import { AudioManager } from './js/core/AudioManager.js';
import { UIManager } from './js/core/UIManager.js';
import { WeatherSystem } from './js/core/WeatherSystem.js';
import { RadioSystem } from './js/core/RadioSystem.js';
import { VoiceControl } from './js/core/VoiceControl.js';
import { ParticleSystem } from './js/core/ParticleSystem.js';
import { QuestSystem } from './js/quests/QuestSystem.js';
import { Multiplayer } from './js/multiplayer/Multiplayer.js';
import { resumeData } from './js/data/ResumeData.js';

// Import entities
import { Car } from './js/entities/Car.js';
import { Building } from './js/entities/Building.js';
import { NPC } from './js/entities/NPC.js';
import { NPCInteraction } from './js/entities/NPCInteraction.js';
import { Interactable } from './js/entities/Interactable.js';

// Simplified fallback managers in case imports fail
class FallbackAudioManager {
    constructor() {
        this.muted = false;
        this.context = null;
    }
    
    async init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            await this.context.resume();
        } catch (e) {
            console.warn('Audio not supported');
        }
    }
    
    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }
    
    playHorn() {
        if (!this.context || this.muted) return;
        try {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            osc.type = 'square';
            osc.frequency.value = 440;
            gain.gain.value = 0.1;
            gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.5);
            osc.connect(gain);
            gain.connect(this.context.destination);
            osc.start();
            osc.stop(this.context.currentTime + 0.5);
        } catch (e) {}
    }
    
    updateEngineSound() {}
}

class Application {
    constructor() {
        // Core systems
        this.sceneManager = null;
        this.inputManager = null;
        this.audioManager = null;
        this.uiManager = null;
        
        // Advanced systems
        this.weatherSystem = null;
        this.radioSystem = null;
        this.voiceControl = null;
        this.particleSystem = null;
        this.questSystem = null;
        this.multiplayer = null;
        
        // Entities
        this.car = null;
        this.buildings = [];
        this.npcs = [];
        this.npcInteractions = [];
        this.interactables = [];
        
        // Game state
        this.clock = new THREE.Clock();
        this.deltaTime = 0;
        this.timeOfDay = 12;
        this.dayLength = 120; // seconds
        this.totalDistance = 0;
        this.lastPosition = new THREE.Vector3(0, 0, 0);
        
        // Performance monitoring
        this.fps = 0;
        this.fpsCounter = 0;
        this.fpsTimer = 0;
        
        this.init();
    }
    
    async init() {
        try {
            this.updateLoading(5, 'Initializing Ultimate Embedded Portfolio...');
            
            // Initialize core managers with fallbacks
            this.updateLoading(10, 'Creating scene...');
            try {
                this.sceneManager = new SceneManager();
            } catch (e) {
                console.warn('SceneManager import failed, using fallback');
                this.sceneManager = new FallbackSceneManager();
            }
            
            this.updateLoading(20, 'Initializing input...');
            try {
                this.inputManager = new InputManager();
            } catch (e) {
                console.warn('InputManager import failed, using fallback');
                this.inputManager = new FallbackInputManager();
            }
            
            this.updateLoading(30, 'Loading audio...');
            try {
                this.audioManager = new AudioManager();
            } catch (e) {
                console.warn('AudioManager import failed, using fallback');
                this.audioManager = new FallbackAudioManager();
            }
            await this.audioManager.init();
            
            this.updateLoading(40, 'Setting up UI...');
            try {
                this.uiManager = new UIManager();
            } catch (e) {
                console.warn('UIManager import failed, using fallback');
                this.uiManager = new FallbackUIManager();
            }
            
            this.updateLoading(45, 'Initializing weather system...');
            try {
                if (this.sceneManager) {
                    this.weatherSystem = new WeatherSystem(this.sceneManager.scene);
                    this.weatherSystem.setWeather('clear', 0.5);
                }
            } catch (e) {
                console.warn('WeatherSystem import failed');
                this.weatherSystem = null;
            }
            
            this.updateLoading(50, 'Initializing radio system...');
            try {
                this.radioSystem = new RadioSystem(this.audioManager, this.uiManager);
            } catch (e) {
                console.warn('RadioSystem import failed');
                this.radioSystem = null;
            }
            
            this.updateLoading(55, 'Initializing particle system...');
            try {
                if (this.sceneManager) {
                    this.particleSystem = new ParticleSystem(this.sceneManager.scene);
                }
            } catch (e) {
                console.warn('ParticleSystem import failed');
                this.particleSystem = null;
            }
            
            this.updateLoading(60, 'Initializing quest system...');
            try {
                this.questSystem = new QuestSystem(this.uiManager);
            } catch (e) {
                console.warn('QuestSystem import failed');
                this.questSystem = null;
            }
            
            this.updateLoading(65, 'Building world...');
            this.createWorld();
            
            this.updateLoading(70, 'Creating car...');
            try {
                this.car = new Car(this.sceneManager.scene);
                this.lastPosition.copy(this.car.position);
            } catch (e) {
                console.warn('Car import failed, using fallback');
                this.car = new FallbackCar(this.sceneManager.scene);
                this.lastPosition.copy(this.car.position);
            }
            
            this.updateLoading(75, 'Placing buildings...');
            this.createBuildings();
            
            this.updateLoading(80, 'Creating NPCs...');
            this.createNPCs();
            
            this.updateLoading(85, 'Creating interactables...');
            this.createInteractables();
            
            this.updateLoading(90, 'Initializing voice control...');
            try {
                this.voiceControl = new VoiceControl(this);
            } catch (e) {
                console.warn('VoiceControl import failed');
                this.voiceControl = null;
            }
            
            this.updateLoading(93, 'Setting up controls...');
            this.setupEventListeners();
            
            // Check for multiplayer
            this.updateLoading(96, 'Checking multiplayer...');
            if (import.meta.env.VITE_ENABLE_MULTIPLAYER === 'true') {
                try {
                    this.multiplayer = new Multiplayer(this.car, this.sceneManager.scene);
                } catch (e) {
                    console.warn('Multiplayer import failed');
                    this.multiplayer = null;
                }
            }
            
            this.updateLoading(100, 'Ready!');
            
            // Hide preloader after everything is loaded
            setTimeout(() => {
                document.getElementById('preloader').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('preloader').style.display = 'none';
                    document.getElementById('ui-container').style.display = 'block';
                }, 1000);
            }, 1000);
            
            // Start animation loop
            this.animate();
            
            // Show welcome modal if first time
            this.checkFirstTime();
            
            if (this.uiManager) {
                this.uiManager.addConsoleMessage('System ready. Use WASD to drive.', 'success');
                this.uiManager.addConsoleMessage('🎤 Try voice commands: "go to education", "radio on", "night mode"', 'info');
            }
            
            console.log('✅ Application initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize:', error);
            this.showError(error.message);
        }
    }
    
    updateLoading(percent, message) {
        const fill = document.getElementById('progress-fill');
        const percentEl = document.getElementById('progress-percentage');
        const status = document.getElementById('loading-status');
        const details = document.getElementById('loading-details');
        
        if (fill) fill.style.width = percent + '%';
        if (percentEl) percentEl.textContent = percent + '%';
        if (status) status.textContent = message;
        if (details) {
            const step = document.createElement('div');
            step.style.color = '#00ff00';
            step.textContent = `✓ ${message}`;
            details.appendChild(step);
            details.scrollTop = details.scrollHeight;
        }
    }
    
    showError(error) {
        document.getElementById('preloader').innerHTML = `
            <div style="color: #ff3333; text-align: center; padding: 20px;">
                <h2>❌ Failed to Load</h2>
                <p>${error}</p>
                <button onclick="window.location.reload()" style="padding: 10px 20px; background: #00ff00; color: #000; border: none; border-radius: 5px; margin-top: 20px; cursor: pointer;">Reload</button>
            </div>
        `;
    }
    
    createWorld() {
        if (!this.sceneManager) return;
        
        // Ground
        const groundGeometry = new THREE.CircleGeometry(60, 64);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2c3e50,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        this.sceneManager.scene.add(ground);
        
        // Grid helper
        const gridHelper = new THREE.GridHelper(60, 30, 0x00ff00, 0x444444);
        gridHelper.position.y = 0.01;
        this.sceneManager.scene.add(gridHelper);
        
        // Add roads
        this.createRoads();
        
        // Add decorations
        this.addDecoration();
        
        // Add street lights
        this.createStreetLights();
        
        // Add ambient sounds markers
        this.addAmbientSoundMarkers();
    }
    
    createRoads() {
        if (!this.sceneManager) return;
        
        const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        
        // Main roads
        const roadNS = new THREE.Mesh(new THREE.PlaneGeometry(6, 50), roadMaterial);
        roadNS.rotation.x = -Math.PI / 2;
        roadNS.position.set(0, 0.01, 0);
        roadNS.receiveShadow = true;
        this.sceneManager.scene.add(roadNS);
        
        const roadEW = new THREE.Mesh(new THREE.PlaneGeometry(50, 6), roadMaterial);
        roadEW.rotation.x = -Math.PI / 2;
        roadEW.position.set(0, 0.01, 0);
        roadEW.receiveShadow = true;
        this.sceneManager.scene.add(roadEW);
        
        // Circular road around center
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = Math.cos(angle) * 15;
            const z = Math.sin(angle) * 15;
            
            const roadPiece = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), roadMaterial);
            roadPiece.rotation.x = -Math.PI / 2;
            roadPiece.rotation.y = angle;
            roadPiece.position.set(x, 0.02, z);
            roadPiece.receiveShadow = true;
            this.sceneManager.scene.add(roadPiece);
        }
        
        // Road markings
        this.addRoadMarkings();
    }
    
    addRoadMarkings() {
        if (!this.sceneManager) return;
        
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
        
        // Center lines
        for (let i = -25; i <= 25; i += 2) {
            const points = [];
            points.push(new THREE.Vector3(i, 0.03, -0.5));
            points.push(new THREE.Vector3(i, 0.03, 0.5));
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            this.sceneManager.scene.add(line);
        }
        
        for (let i = -25; i <= 25; i += 2) {
            const points = [];
            points.push(new THREE.Vector3(-0.5, 0.03, i));
            points.push(new THREE.Vector3(0.5, 0.03, i));
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            this.sceneManager.scene.add(line);
        }
        
        // Crosswalks
        for (let i = -3; i <= 3; i++) {
            for (let j = -3; j <= 3; j++) {
                if (Math.abs(i) <= 1 && Math.abs(j) <= 1) continue;
                
                const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
                const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 1), stripeMat);
                stripe.position.set(i * 5, 0.04, j * 5);
                stripe.receiveShadow = true;
                this.sceneManager.scene.add(stripe);
            }
        }
    }
    
    createStreetLights() {
        if (!this.sceneManager) return;
        
        const lightPositions = [
            { x: 8, z: 8 }, { x: -8, z: 8 }, { x: 8, z: -8 }, { x: -8, z: -8 },
            { x: 15, z: 15 }, { x: -15, z: 15 }, { x: 15, z: -15 }, { x: -15, z: -15 },
            { x: 0, z: 20 }, { x: 0, z: -20 }, { x: 20, z: 0 }, { x: -20, z: 0 }
        ];
        
        lightPositions.forEach(pos => {
            const lightGroup = new THREE.Group();
            
            // Pole
            const poleGeo = new THREE.CylinderGeometry(0.15, 0.2, 4);
            const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.y = 2;
            pole.castShadow = true;
            pole.receiveShadow = true;
            lightGroup.add(pole);
            
            // Lamp
            const lampGeo = new THREE.SphereGeometry(0.4);
            const lampMat = new THREE.MeshStandardMaterial({ 
                color: 0xffaa00, 
                emissive: new THREE.Color(0x442200) 
            });
            const lamp = new THREE.Mesh(lampGeo, lampMat);
            lamp.position.y = 4;
            lamp.castShadow = true;
            lightGroup.add(lamp);
            
            // Light source
            const light = new THREE.PointLight(0xffaa00, 1, 15);
            light.position.y = 4;
            lightGroup.add(light);
            
            lightGroup.position.set(pos.x, 0, pos.z);
            this.sceneManager.scene.add(lightGroup);
            
            if (this.sceneManager.addNightLight) {
                this.sceneManager.addNightLight({ x: pos.x, y: 4, z: pos.z }, 0xffaa00, 0.5);
            }
        });
    }
    
    addDecoration() {
        if (!this.sceneManager) return;
        
        // Trees
        for (let i = 0; i < 40; i++) {
            const angle = (i / 40) * Math.PI * 2;
            const radius = 25 + Math.random() * 10;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            this.createTree(x, z);
        }
        
        // Random rocks and bushes
        for (let i = 0; i < 60; i++) {
            const x = (Math.random() - 0.5) * 50;
            const z = (Math.random() - 0.5) * 50;
            if (Math.abs(x) < 18 && Math.abs(z) < 18) continue;
            this.createRock(x, z);
        }
        
        // Flowers in fields
        for (let i = 0; i < 100; i++) {
            const x = (Math.random() - 0.5) * 40;
            const z = (Math.random() - 0.5) * 40;
            if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;
            this.createFlower(x, z);
        }
    }
    
    createTree(x, z) {
        if (!this.sceneManager) return;
        
        const treeGroup = new THREE.Group();
        
        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 3);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1.5;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        treeGroup.add(trunk);
        
        // Leaves
        for (let i = 0; i < 3; i++) {
            const leavesGeo = new THREE.ConeGeometry(1.2 - i * 0.2, 1.5, 8);
            const leavesMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
            const leaves = new THREE.Mesh(leavesGeo, leavesMat);
            leaves.position.y = 3 + i * 0.8;
            leaves.castShadow = true;
            leaves.receiveShadow = true;
            treeGroup.add(leaves);
        }
        
        treeGroup.position.set(x, 0, z);
        this.sceneManager.scene.add(treeGroup);
    }
    
    createRock(x, z) {
        if (!this.sceneManager) return;
        
        const rockGeo = new THREE.DodecahedronGeometry(0.4 + Math.random() * 0.6);
        const rockMat = new THREE.MeshStandardMaterial({ 
            color: 0x808080, 
            roughness: 0.9,
            metalness: 0.1
        });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(x, 0.3, z);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.castShadow = true;
        rock.receiveShadow = true;
        this.sceneManager.scene.add(rock);
    }
    
    createFlower(x, z) {
        if (!this.sceneManager) return;
        
        const flowerGroup = new THREE.Group();
        
        // Stem
        const stemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.15;
        stem.castShadow = true;
        flowerGroup.add(stem);
        
        // Flower head
        const headGeo = new THREE.SphereGeometry(0.1);
        const colors = [0xff69b4, 0xffa500, 0xff3333, 0xffdd44];
        const headMat = new THREE.MeshStandardMaterial({ color: colors[Math.floor(Math.random() * colors.length)] });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 0.3;
        head.castShadow = true;
        flowerGroup.add(head);
        
        flowerGroup.position.set(x, 0, z);
        this.sceneManager.scene.add(flowerGroup);
    }
    
    addAmbientSoundMarkers() {
        if (!this.sceneManager) return;
        
        // Invisible spheres for ambient sounds
        const soundPositions = [
            { x: 20, z: 20, sound: 'nature' },
            { x: -20, z: 20, sound: 'city' },
            { x: 20, z: -20, sound: 'water' },
            { x: -20, z: -20, sound: 'wind' }
        ];
        
        soundPositions.forEach(pos => {
            const marker = new THREE.Object3D();
            marker.position.set(pos.x, 1, pos.z);
            marker.userData = { type: 'sound', sound: pos.sound };
            this.sceneManager.scene.add(marker);
        });
    }
    
    createBuildings() {
        if (!this.sceneManager) return;
        
        const buildingConfigs = [
            { type: 'education', color: 0x4a90e2, pos: [15, 15], size: [4, 6, 4] },
            { type: 'skills', color: 0xe24a4a, pos: [-15, 15], size: [4, 7, 4] },
            { type: 'experience', color: 0x4ae24a, pos: [15, -15], size: [5, 5, 5] },
            { type: 'projects', color: 0xe4e24a, pos: [-15, -15], size: [5, 6, 5] },
            { type: 'achievements', color: 0xffaa44, pos: [0, 20], size: [3, 8, 3] },
            { type: 'contact', color: 0xaa44ff, pos: [0, -20], size: [4, 4, 4] }
        ];
        
        buildingConfigs.forEach(config => {
            try {
                const building = new Building(
                    this.sceneManager.scene,
                    { x: config.pos[0], y: 0, z: config.pos[1] },
                    { width: config.size[0], height: config.size[1], depth: config.size[2] },
                    config.color,
                    config.type
                );
                
                // Set resume data
                if (resumeData && resumeData[config.type]) {
                    building.setInfo(resumeData[config.type]);
                }
                
                this.buildings.push(building);
            } catch (e) {
                // Fallback building
                const building = new FallbackBuilding(
                    this.sceneManager.scene,
                    { x: config.pos[0], y: 0, z: config.pos[1] },
                    config.color,
                    config.type
                );
                this.buildings.push(building);
            }
        });
    }
    
    createNPCs() {
        if (!this.sceneManager) return;
        
        const npcPositions = [
            { x: 5, z: 5, color: 0xffaa00 },
            { x: -5, z: 5, color: 0x00ffaa },
            { x: 5, z: -5, color: 0xaa00ff },
            { x: -5, z: -5, color: 0xff5500 },
            { x: 10, z: 0, color: 0x55ff00 },
            { x: -10, z: 0, color: 0x0055ff },
            { x: 0, z: 10, color: 0xff0055 },
            { x: 0, z: -10, color: 0xffff00 }
        ];
        
        npcPositions.forEach(pos => {
            try {
                const npc = new NPC(
                    this.sceneManager.scene,
                    { x: pos.x, y: 0, z: pos.z },
                    pos.color
                );
                this.npcs.push(npc);
                
                // Create interaction handler
                if (this.car) {
                    const interaction = new NPCInteraction(npc, this.car);
                    this.npcInteractions.push(interaction);
                }
            } catch (e) {
                // Skip NPC if creation fails
            }
        });
    }
    
    createInteractables() {
        if (!this.sceneManager) return;
        
        const mcPositions = [
            { x: 3, z: 3, name: 'ESP32', color: 0xff0000 },
            { x: -3, z: 3, name: 'STM32', color: 0x00ff00 },
            { x: 3, z: -3, name: 'Raspberry Pi', color: 0x0000ff },
            { x: -3, z: -3, name: 'Arduino', color: 0xffff00 },
            { x: 6, z: 6, name: 'ESP32-CAM', color: 0xff00ff },
            { x: -6, z: 6, name: 'BLE Module', color: 0x00ffff },
            { x: 6, z: -6, name: 'RFID Module', color: 0xff6600 },
            { x: -6, z: -6, name: 'GPS Module', color: 0x66ff00 }
        ];
        
        mcPositions.forEach(pos => {
            try {
                const interactable = new Interactable(
                    this.sceneManager.scene,
                    { x: pos.x, y: 0.5, z: pos.z },
                    pos.name,
                    pos.color
                );
                this.interactables.push(interactable);
            } catch (e) {
                // Skip if creation fails
            }
        });
    }
    
    setupEventListeners() {
        // Control buttons
        this.setupControlButtons();
        
        // Touch controls
        this.setupTouchControls();
        
        // Modal buttons
        this.setupModalButtons();
        
        // Window resize
        window.addEventListener('resize', () => this.onResize());
        
        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            // F1 for help
            if (e.code === 'F1') {
                e.preventDefault();
                if (this.uiManager) this.uiManager.showHelp();
            }
            
            // Esc to close modals
            if (e.code === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    modal.classList.remove('active');
                });
            }
            
            // M for map
            if (e.code === 'KeyM' && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                if (this.uiManager && this.car) {
                    this.uiManager.showMap(this.car.position, this.buildings);
                }
            }
            
            // Q for quests
            if (e.code === 'KeyQ' && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                if (this.uiManager && this.questSystem) {
                    this.uiManager.showQuests(this.questSystem.getQuests());
                }
            }
            
            // V for voice
            if (e.code === 'KeyV' && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                if (this.voiceControl) {
                    this.voiceControl.startListening();
                } else {
                    this.startVoiceControl();
                }
            }
            
            // C for camera
            if (e.code === 'KeyC' && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                if (this.car) {
                    this.car.cycleCamera();
                    if (this.uiManager) {
                        this.uiManager.addConsoleMessage(`Camera: ${this.car.cameraMode} view`, 'info');
                    }
                }
            }
            
            // L for lights
            if (e.code === 'KeyL' && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                if (this.car) {
                    this.car.toggleLights();
                }
            }
            
            // H for horn
            if (e.code === 'KeyH' && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                if (this.audioManager) {
                    this.audioManager.playHorn();
                }
                if (this.particleSystem && this.car) {
                    this.particleSystem.createSpark(this.car.position);
                }
            }
        });
    }
    
    setupControlButtons() {
        // Mute
        document.getElementById('btn-mute')?.addEventListener('click', () => {
            if (this.audioManager) {
                const muted = this.audioManager.toggleMute();
                document.getElementById('btn-mute').textContent = muted ? '🔇' : '🔊';
                if (this.uiManager) {
                    this.uiManager.addConsoleMessage(`Sound ${muted ? 'off' : 'on'}`, 'info');
                }
            }
        });
        
        // Horn
        document.getElementById('btn-horn')?.addEventListener('click', () => {
            if (this.audioManager) {
                this.audioManager.playHorn();
            }
            if (this.particleSystem && this.car) {
                this.particleSystem.createSpark(this.car.position);
            }
            if (this.multiplayer) {
                this.multiplayer.sendAction({ type: 'horn' });
            }
        });
        
        // Lights
        document.getElementById('btn-lights')?.addEventListener('click', () => {
            if (this.car) {
                this.car.toggleLights();
            }
        });
        
        // Night mode
        document.getElementById('btn-night')?.addEventListener('click', () => {
            this.toggleNightMode();
        });
        
        // Radio
        document.getElementById('btn-radio')?.addEventListener('click', () => {
            if (this.radioSystem) {
                this.radioSystem.toggle();
            } else if (this.uiManager) {
                this.uiManager.showRadio();
            }
        });
        
        // Camera
        document.getElementById('btn-camera')?.addEventListener('click', () => {
            if (this.car) {
                this.car.cycleCamera();
                if (this.uiManager) {
                    this.uiManager.addConsoleMessage(`Camera: ${this.car.cameraMode} view`, 'info');
                }
            }
        });
        
        // Map
        document.getElementById('btn-map')?.addEventListener('click', () => {
            if (this.uiManager && this.car) {
                this.uiManager.showMap(this.car.position, this.buildings);
            }
        });
        
        // Quests
        document.getElementById('btn-quests')?.addEventListener('click', () => {
            if (this.uiManager && this.questSystem) {
                this.uiManager.showQuests(this.questSystem.getQuests());
            }
        });
        
        // Achievements
        document.getElementById('btn-achievements')?.addEventListener('click', () => {
            if (this.uiManager && this.questSystem) {
                this.uiManager.showAchievements(this.questSystem.getAchievements());
            }
        });
        
        // Voice
        document.getElementById('btn-voice')?.addEventListener('click', () => {
            if (this.voiceControl) {
                this.voiceControl.startListening();
            } else {
                this.startVoiceControl();
            }
        });
        
        // Help
        document.getElementById('btn-help')?.addEventListener('click', () => {
            if (this.uiManager) {
                this.uiManager.showHelp();
            }
        });
        
        // Reset
        document.getElementById('btn-reset')?.addEventListener('click', () => {
            this.resetGame();
        });
        
        // Tour
        document.getElementById('btn-tour')?.addEventListener('click', () => {
            this.startGuidedTour();
        });
        
        // Terminal clear
        document.getElementById('terminal-clear')?.addEventListener('click', () => {
            if (this.uiManager) {
                this.uiManager.clearConsole();
            }
        });
    }
    
    setupTouchControls() {
        const setupTouch = (id, axis, value) => {
            const el = document.getElementById(id);
            if (el && this.inputManager) {
                el.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.inputManager.setTouch(axis, value);
                });
                el.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.inputManager.setTouch(axis, 0);
                });
            }
        };
        
        setupTouch('touch-up', 'forward', 1);
        setupTouch('touch-down', 'forward', -1);
        setupTouch('touch-left', 'right', -1);
        setupTouch('touch-right', 'right', 1);
    }
    
    setupModalButtons() {
        // Welcome modal
        document.getElementById('btn-start')?.addEventListener('click', () => {
            const name = document.getElementById('visitor-name')?.value;
            const email = document.getElementById('visitor-email')?.value;
            
            if (name && email) {
                localStorage.setItem('visitorName', name);
                localStorage.setItem('visitorEmail', email);
                
                const interests = [];
                document.querySelectorAll('.interest-tag.selected').forEach(tag => {
                    interests.push(tag.dataset.interest);
                });
                localStorage.setItem('visitorInterests', JSON.stringify(interests));
                
                document.getElementById('welcome-modal')?.classList.remove('active');
                if (this.uiManager) {
                    this.uiManager.addConsoleMessage(`Welcome, ${name}! Your journey begins.`, 'success');
                    
                    // Personalize based on interests
                    if (interests.includes('embedded')) {
                        this.uiManager.addConsoleMessage('Check out the microcontroller models around the world!', 'info');
                    }
                    if (interests.includes('iot')) {
                        this.uiManager.addConsoleMessage('The Projects zone has IoT examples!', 'info');
                    }
                }
            }
        });
        
        // Interest tags
        document.querySelectorAll('.interest-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                tag.classList.toggle('selected');
            });
        });
        
        // Close modals
        document.getElementById('btn-close-info')?.addEventListener('click', () => {
            document.getElementById('info-modal')?.classList.remove('active');
        });
        
        document.getElementById('btn-close-map')?.addEventListener('click', () => {
            document.getElementById('map-modal')?.classList.remove('active');
        });
        
        document.getElementById('btn-close-help')?.addEventListener('click', () => {
            document.getElementById('help-modal')?.classList.remove('active');
        });
    }
    
    checkFirstTime() {
        if (!localStorage.getItem('visitorName')) {
            setTimeout(() => {
                document.getElementById('welcome-modal')?.classList.add('active');
            }, 1000);
        } else {
            const name = localStorage.getItem('visitorName');
            if (this.uiManager) {
                this.uiManager.addConsoleMessage(`Welcome back, ${name}!`, 'success');
            }
        }
    }
    
    toggleNightMode() {
        if (!this.sceneManager) return;
        
        document.body.classList.toggle('night-mode');
        const isNight = document.body.classList.contains('night-mode');
        
        if (this.sceneManager.setNightMode) {
            this.sceneManager.setNightMode(isNight);
        } else {
            if (isNight) {
                this.sceneManager.scene.background.setHex(0x0a0a2a);
                if (this.sceneManager.ambientLight) this.sceneManager.ambientLight.intensity = 0.1;
                if (this.sceneManager.sunLight) this.sceneManager.sunLight.intensity = 0.2;
            } else {
                this.sceneManager.scene.background.setHex(0x87CEEB);
                if (this.sceneManager.ambientLight) this.sceneManager.ambientLight.intensity = 0.4;
                if (this.sceneManager.sunLight) this.sceneManager.sunLight.intensity = 1;
            }
        }
        
        if (this.weatherSystem) {
            if (isNight) {
                this.weatherSystem.setWeather('clear', 0.2);
            } else {
                this.weatherSystem.setWeather('clear', 0.5);
            }
        }
        
        if (this.uiManager) {
            this.uiManager.addConsoleMessage(`${isNight ? '🌙 Night' : '☀️ Day'} mode enabled`, 'info');
        }
    }
    
    toggleRadio() {
        if (this.radioSystem) {
            this.radioSystem.toggle();
        } else if (this.uiManager) {
            this.uiManager.showRadio();
        }
    }
    
    cycleCamera() {
        if (this.car) {
            this.car.cycleCamera();
        }
    }
    
    startVoiceControl() {
        if (!('webkitSpeechRecognition' in window)) {
            if (this.uiManager) {
                this.uiManager.addConsoleMessage('Voice control not supported in this browser', 'error');
            }
            return;
        }
        
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        
        document.getElementById('voice-modal')?.classList.add('active');
        document.getElementById('voice-text').textContent = 'Listening...';
        
        recognition.onresult = (event) => {
            const command = event.results[0][0].transcript.toLowerCase();
            document.getElementById('voice-text').textContent = `"${command}"`;
            
            setTimeout(() => {
                document.getElementById('voice-modal')?.classList.remove('active');
            }, 2000);
            
            this.processVoiceCommand(command);
        };
        
        recognition.onerror = () => {
            document.getElementById('voice-text').textContent = 'Error, try again';
            setTimeout(() => {
                document.getElementById('voice-modal')?.classList.remove('active');
            }, 2000);
        };
        
        recognition.start();
    }
    
    processVoiceCommand(command) {
        if (this.uiManager) {
            this.uiManager.addConsoleMessage(`Voice command: ${command}`, 'info');
        }
        
        if (!this.car) return;
        
        if (command.includes('education')) {
            this.car.navigateTo({ x: 15, z: 15 });
        } else if (command.includes('skill')) {
            this.car.navigateTo({ x: -15, z: 15 });
        } else if (command.includes('experience')) {
            this.car.navigateTo({ x: 15, z: -15 });
        } else if (command.includes('project')) {
            this.car.navigateTo({ x: -15, z: -15 });
        } else if (command.includes('achievement')) {
            this.car.navigateTo({ x: 0, z: 20 });
        } else if (command.includes('contact')) {
            this.car.navigateTo({ x: 0, z: -20 });
        } else if (command.includes('night')) {
            this.toggleNightMode();
        } else if (command.includes('light')) {
            this.car.toggleLights();
        } else if (command.includes('horn')) {
            if (this.audioManager) this.audioManager.playHorn();
        } else if (command.includes('radio')) {
            this.toggleRadio();
        } else if (command.includes('stop') || command.includes('halt')) {
            this.car.stop();
        } else if (command.includes('reset') || command.includes('home')) {
            this.car.resetPosition();
        } else if (command.includes('tour')) {
            this.startGuidedTour();
        } else if (command.includes('map')) {
            if (this.uiManager) {
                this.uiManager.showMap(this.car.position, this.buildings);
            }
        } else if (command.includes('quest')) {
            if (this.uiManager && this.questSystem) {
                this.uiManager.showQuests(this.questSystem.getQuests());
            }
        } else {
            if (this.uiManager) {
                this.uiManager.addConsoleMessage('Command not recognized', 'error');
            }
        }
    }
    
    startGuidedTour() {
        const destinations = [
            { x: 15, z: 15, name: 'Education' },
            { x: -15, z: 15, name: 'Skills' },
            { x: 15, z: -15, name: 'Experience' },
            { x: -15, z: -15, name: 'Projects' },
            { x: 0, z: 20, name: 'Achievements' },
            { x: 0, z: -20, name: 'Contact' }
        ];
        
        let index = 0;
        if (this.uiManager) {
            this.uiManager.addConsoleMessage('🚗 Starting guided tour...', 'info');
        }
        
        const nextDestination = () => {
            if (index >= destinations.length) {
                if (this.uiManager) {
                    this.uiManager.addConsoleMessage('🎉 Tour complete! You\'ve seen everything!', 'success');
                }
                return;
            }
            
            const dest = destinations[index];
            if (this.uiManager) {
                this.uiManager.addConsoleMessage(`📍 Now visiting: ${dest.name} Zone`, 'info');
            }
            
            if (this.car) {
                this.car.navigateTo(dest, () => {
                    // Show building info
                    const building = this.buildings.find(b => 
                        Math.abs(b.position.x - dest.x) < 1 && 
                        Math.abs(b.position.z - dest.z) < 1
                    );
                    if (building && this.uiManager) {
                        setTimeout(() => {
                            this.uiManager.showBuildingInfo(building);
                        }, 500);
                    }
                    
                    index++;
                    setTimeout(nextDestination, 4000);
                });
            } else {
                index++;
                setTimeout(nextDestination, 4000);
            }
        };
        
        nextDestination();
    }
    
    resetGame() {
        if (confirm('Reset your journey? All progress will be lost.')) {
            localStorage.clear();
            if (this.questSystem && this.questSystem.reset) {
                this.questSystem.reset();
            }
            if (this.car) {
                this.car.resetPosition();
            }
            if (this.uiManager) {
                this.uiManager.addConsoleMessage('Game reset', 'system');
            }
        }
    }
    
    update() {
        this.deltaTime = this.clock.getDelta();
        
        // Cap delta time to prevent large jumps
        if (this.deltaTime > 0.1) this.deltaTime = 0.1;
        
        // Update FPS counter
        this.updateFPS();
        
        // Update time of day
        this.timeOfDay += this.deltaTime / this.dayLength * 24;
        if (this.timeOfDay >= 24) this.timeOfDay -= 24;
        
        // Update input
        if (this.inputManager) {
            this.inputManager.update();
        }
        
        // Update car
        if (this.car) {
            const movement = this.inputManager ? this.inputManager.getMovement() : { forward: 0, right: 0 };
            const brake = this.inputManager ? this.inputManager.getBrake() : 0;
            const boost = this.inputManager ? this.inputManager.getBoost() : 0;
            
            this.car.update(this.deltaTime, movement, brake, boost);
            
            // Track distance for explorer quest
            if (this.questSystem) {
                const distanceMoved = this.car.position.distanceTo(this.lastPosition);
                this.totalDistance += distanceMoved;
                this.questSystem.updateExplorerProgress(distanceMoved);
                this.lastPosition.copy(this.car.position);
            }
            
            // Update engine sound
            if (this.audioManager && this.audioManager.updateEngineSound) {
                this.audioManager.updateEngineSound(this.car.getSpeed(), this.car.getRPM ? this.car.getRPM() : 0);
            }
            
            // Create dust particles when moving fast
            if (this.particleSystem && this.car.getSpeed() > 20 && Math.abs(movement.forward) > 0) {
                this.particleSystem.createDust(this.car.position, 3);
            }
            
            // Update camera
            const cameraView = this.car.getCameraView();
            if (this.sceneManager && this.sceneManager.camera) {
                this.sceneManager.camera.position.copy(cameraView.position);
                this.sceneManager.camera.lookAt(this.car.position);
            }
        }
        
        // Update weather
        if (this.weatherSystem) {
            this.weatherSystem.update(this.deltaTime);
        }
        
        // Update NPCs and interactions
        this.npcs.forEach(npc => {
            if (npc.update) npc.update(this.deltaTime);
        });
        this.npcInteractions.forEach(interaction => {
            if (interaction.update) interaction.update();
        });
        
        // Update interactables
        this.interactables.forEach(item => {
            if (item.update) item.update(this.deltaTime);
        });
        
        // Update buildings
        this.buildings.forEach(building => {
            if (building.update) building.update(this.deltaTime);
        });
        
        // Check quest proximity
        this.checkQuestProximity();
        
        // Check speed achievement
        if (this.questSystem && this.car) {
            this.questSystem.checkSpeedAchievement(this.car.getSpeed());
            this.questSystem.checkNightAchievement(document.body.classList.contains('night-mode'));
        }
        
        // Update multiplayer
        if (this.multiplayer) {
            this.multiplayer.update();
        }
        
        // Update UI
        this.updateUI();
    }
    
    updateFPS() {
        this.fpsCounter++;
        this.fpsTimer += this.deltaTime;
        
        if (this.fpsTimer >= 1) {
            this.fps = this.fpsCounter;
            this.fpsCounter = 0;
            this.fpsTimer = 0;
            
            // Update FPS display if needed
            const fpsElement = document.getElementById('fps-counter');
            if (fpsElement) {
                fpsElement.textContent = `FPS: ${this.fps}`;
            }
        }
    }
    
    checkQuestProximity() {
        if (!this.car || !this.uiManager) return;
        
        this.buildings.forEach(building => {
            const distance = building.getDistanceFrom ? 
                building.getDistanceFrom(this.car.position) : 
                Math.sqrt(
                    Math.pow(this.car.position.x - building.position.x, 2) +
                    Math.pow(this.car.position.z - building.position.z, 2)
                );
            
            if (distance < 8) {
                if (building.highlight) building.highlight(true);
                
                if (distance < 4 && !building.visited) {
                    building.visited = true;
                    if (this.questSystem) {
                        this.questSystem.completeQuest(building.type || building.name);
                    }
                    if (this.uiManager) {
                        this.uiManager.showBuildingInfo(building);
                        this.uiManager.addConsoleMessage(`📍 Discovered: ${building.type || building.name} zone`, 'success');
                    }
                    
                    // Particle effect
                    if (this.particleSystem) {
                        this.particleSystem.createExplosion(building.position, building.color);
                    }
                    
                    const questItem = document.querySelector(`[data-quest="${(building.type || building.name).toLowerCase()}"]`);
                    if (questItem) {
                        questItem.classList.remove('incomplete');
                        questItem.classList.add('completed');
                    }
                    
                    const completed = this.buildings.filter(b => b.visited).length;
                    document.getElementById('quest-progress').textContent = `${completed}/6`;
                }
            } else {
                if (building.highlight) building.highlight(false);
            }
        });
        
        // Check interactables
        this.interactables.forEach(item => {
            if (!item.collected) {
                const distance = Math.sqrt(
                    Math.pow(this.car.position.x - item.position.x, 2) +
                    Math.pow(this.car.position.z - item.position.z, 2)
                );
                
                if (distance < 3) {
                    if (item.highlight) item.highlight(true);
                    
                    if (distance < 2 && !item.collected) {
                        if (item.collect) {
                            item.collect();
                        } else {
                            item.collected = true;
                        }
                        
                        if (this.uiManager) {
                            this.uiManager.addConsoleMessage(`🔌 Found: ${item.name}`, 'success');
                        }
                        if (this.questSystem) {
                            this.questSystem.collectItem(item.name);
                        }
                        if (this.particleSystem) {
                            this.particleSystem.createSpark(item.position, item.color);
                        }
                    }
                } else {
                    if (item.highlight) item.highlight(false);
                }
            }
        });
    }
    
    updateUI() {
        if (!this.car || !this.uiManager) return;
        
        let weatherIcon = '☀️';
        let weatherDesc = 'Clear';
        
        if (this.weatherSystem) {
            if (this.weatherSystem.getWeatherIcon) {
                weatherIcon = this.weatherSystem.getWeatherIcon();
            }
            if (this.weatherSystem.getWeatherDescription) {
                weatherDesc = this.weatherSystem.getWeatherDescription();
            }
        }
        
        this.uiManager.updateHUD(
            this.car.getSpeed(),
            this.car.battery || 100,
            this.car.position,
            this.formatTime(this.timeOfDay),
            this.car.rotation ? this.car.rotation.y : 0,
            this.weatherSystem ? this.weatherSystem.currentWeather : 'clear'
        );
        
        // Update quest progress in UI
        if (this.questSystem && this.questSystem.getProgress) {
            const progress = this.questSystem.getProgress();
            document.getElementById('quest-progress').textContent = 
                `${progress.quests.completed}/${progress.quests.total}`;
        }
        
        // Update weather display
        document.getElementById('weather-value').textContent = 
            `${weatherIcon} ${weatherDesc}`;
    }
    
    formatTime(time) {
        const hours = Math.floor(time);
        const minutes = Math.floor((time - hours) * 60);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
    
    onResize() {
        if (this.sceneManager) {
            this.sceneManager.onResize();
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.update();
        
        // Render scene
        if (this.sceneManager) {
            this.sceneManager.render();
        }
    }
}

// Fallback classes for when imports fail
class FallbackSceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(10, 8, 15);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);
        
        // Lights
        this.ambientLight = new THREE.AmbientLight(0x404060);
        this.scene.add(this.ambientLight);
        
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(10, 20, 5);
        this.sunLight.castShadow = true;
        this.scene.add(this.sunLight);
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

class FallbackInputManager {
    constructor() {
        this.keys = {};
        this.touch = { forward: 0, right: 0 };
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    }
    
    update() {}
    
    getMovement() {
        let forward = 0, right = 0;
        if (this.keys['KeyW']) forward += 1;
        if (this.keys['KeyS']) forward -= 1;
        if (this.keys['KeyA']) right -= 1;
        if (this.keys['KeyD']) right += 1;
        forward += this.touch.forward;
        right += this.touch.right;
        return { forward, right };
    }
    
    getBrake() { return this.keys['Space'] ? 1 : 0; }
    getBoost() { return this.keys['ShiftLeft'] ? 1 : 0; }
    setTouch(axis, value) { this.touch[axis] = value; }
}

class FallbackUIManager {
    constructor() {
        this.terminal = document.getElementById('terminal-content');
    }
    
    addConsoleMessage(msg, type = 'info') {
        if (!this.terminal) return;
        const line = document.createElement('div');
        line.className = `terminal-line ${type}`;
        const time = new Date().toLocaleTimeString();
        line.textContent = `[${time}] ${msg}`;
        this.terminal.appendChild(line);
        this.terminal.scrollTop = this.terminal.scrollHeight;
        while (this.terminal.children.length > 10) {
            this.terminal.removeChild(this.terminal.firstChild);
        }
    }
    
    clearConsole() {
        if (this.terminal) this.terminal.innerHTML = '';
    }
    
    showBuildingInfo(building) {
        const modal = document.getElementById('info-modal');
        const content = document.getElementById('info-content');
        if (content) {
            content.innerHTML = `
                <h2>${building.name || building.type}</h2>
                <p>${building.info || 'Information about this zone'}</p>
            `;
        }
        if (modal) modal.classList.add('active');
    }
    
    showHelp() {
        document.getElementById('help-modal')?.classList.add('active');
    }
    
    showMap() {}
    showQuests() {}
    showAchievements() {}
    showRadio() {}
    updateHUD() {}
}

class FallbackCar {
    constructor(scene) {
        this.group = new THREE.Group();
        this.position = new THREE.Vector3(0, 0.5, 0);
        this.rotation = 0;
        this.velocity = 0;
        this.battery = 100;
        this.cameraMode = 'follow';
        
        // Body
        const bodyGeo = new THREE.BoxGeometry(2, 0.8, 4);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff3333 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.4;
        body.castShadow = true;
        this.group.add(body);
        
        // Cabin
        const cabinGeo = new THREE.BoxGeometry(1.6, 0.6, 2);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 1.0, -0.5);
        cabin.castShadow = true;
        this.group.add(cabin);
        
        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 24);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const positions = [[-1.2,0.3,1.2], [1.2,0.3,1.2], [-1.2,0.3,-1.2], [1.2,0.3,-1.2]];
        positions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI/2;
            wheel.position.set(pos[0], pos[1], pos[2]);
            wheel.castShadow = true;
            this.group.add(wheel);
        });
        
        this.group.position.copy(this.position);
        scene.add(this.group);
    }
    
    update(deltaTime, movement, brake, boost) {
        const speed = 5;
        if (movement.forward !== 0) {
            this.velocity += movement.forward * speed * deltaTime;
            this.battery -= 0.1 * Math.abs(movement.forward) * deltaTime;
            if (this.battery < 0) this.battery = 0;
        }
        if (brake > 0) this.velocity *= 0.95;
        this.velocity *= 0.98;
        
        if (Math.abs(this.velocity) > 0.1) {
            this.rotation += movement.right * 2 * deltaTime;
        }
        
        this.position.x += Math.sin(this.rotation) * this.velocity * deltaTime;
        this.position.z += Math.cos(this.rotation) * this.velocity * deltaTime;
        
        this.group.position.copy(this.position);
        this.group.rotation.y = this.rotation;
    }
    
    getSpeed() { return Math.abs(this.velocity) * 10; }
    
    getCameraView() {
        return {
            position: new THREE.Vector3(
                this.position.x - 5 * Math.sin(this.rotation),
                this.position.y + 3,
                this.position.z - 5 * Math.cos(this.rotation)
            )
        };
    }
    
    toggleLights() {}
    cycleCamera() { this.cameraMode = this.cameraMode === 'follow' ? 'top' : 'follow'; }
    navigateTo(target, callback) { if (callback) callback(); }
    resetPosition() { this.position.set(0,0.5,0); this.rotation = 0; this.velocity = 0; }
    stop() { this.velocity = 0; }
}

class FallbackBuilding {
    constructor(scene, position, color, name) {
        this.position = position;
        this.name = name;
        this.type = name;
        this.visited = false;
        
        const geo = new THREE.BoxGeometry(3, 5, 3);
        const mat = new THREE.MeshStandardMaterial({ color });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.set(position.x, 2.5, position.z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);
    }
    
    getDistanceFrom(pos) {
        return Math.sqrt(
            Math.pow(pos.x - this.position.x, 2) +
            Math.pow(pos.z - this.position.z, 2)
        );
    }
    
    highlight(enable) {
        this.mesh.material.emissive.setHex(enable ? 0x444444 : 0x000000);
    }
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Fallback button handler
    document.getElementById('fallback-start')?.addEventListener('click', () => {
        document.getElementById('preloader').style.display = 'none';
        document.getElementById('ui-container').style.display = 'block';
        window.app = new Application();
    });
    
    // Auto-start
    window.app = new Application();
});