import { io } from 'socket.io-client';
import * as THREE from 'three';

export class Multiplayer {
    constructor(car, scene) {
        this.car = car;
        this.scene = scene;
        this.socket = null;
        this.players = new Map();
        this.playerId = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.updateInterval = null;
        this.interpolationDelay = 100; // ms
        
        this.connect();
    }
    
    connect() {
        const url = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3001';
        
        this.socket = io(url, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000
        });
        
        this.setupSocketListeners();
    }
    
    setupSocketListeners() {
        this.socket.on('connect', () => {
            this.connected = true;
            this.playerId = this.socket.id;
            this.reconnectAttempts = 0;
            console.log('Connected to multiplayer server');
            
            if (window.app && window.app.uiManager) {
                window.app.uiManager.addConsoleMessage('🌐 Multiplayer: Connected', 'success');
            }
            
            // Start sending position updates
            this.startPositionUpdates();
        });
        
        this.socket.on('connect_error', (error) => {
            console.warn('Multiplayer connection error:', error.message);
            this.reconnectAttempts++;
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                if (window.app && window.app.uiManager) {
                    window.app.uiManager.addConsoleMessage('🌐 Multiplayer: Failed to connect', 'error');
                }
                this.disconnect();
            }
        });
        
        this.socket.on('disconnect', () => {
            this.connected = false;
            console.log('Disconnected from multiplayer server');
            
            if (window.app && window.app.uiManager) {
                window.app.uiManager.addConsoleMessage('🌐 Multiplayer: Disconnected', 'warning');
            }
            
            this.stopPositionUpdates();
        });
        
        this.socket.on('currentPlayers', (players) => {
            Object.keys(players).forEach(id => {
                if (id !== this.socket.id) {
                    this.addPlayer(id, players[id]);
                }
            });
            
            if (window.app && window.app.uiManager) {
                window.app.uiManager.addConsoleMessage(`🌐 ${Object.keys(players).length} players online`, 'info');
            }
        });
        
        this.socket.on('newPlayer', (data) => {
            this.addPlayer(data.id, data);
            
            if (window.app && window.app.uiManager) {
                window.app.uiManager.addConsoleMessage(`🌐 Player ${data.id.substring(0, 4)} joined`, 'info');
            }
        });
        
        this.socket.on('playerMoved', (data) => {
            this.updatePlayer(data.id, data);
        });
        
        this.socket.on('playerDisconnected', (id) => {
            this.removePlayer(id);
            
            if (window.app && window.app.uiManager) {
                window.app.uiManager.addConsoleMessage(`🌐 Player ${id.substring(0, 4)} left`, 'info');
            }
        });
        
        this.socket.on('chatMessage', (data) => {
            if (window.app && window.app.uiManager) {
                window.app.uiManager.addConsoleMessage(`[${data.id.substring(0, 4)}] ${data.message}`, 'chat');
            }
        });
        
        this.socket.on('playerAction', (data) => {
            this.handlePlayerAction(data.id, data.action);
        });
        
        this.socket.on('serverFull', () => {
            if (window.app && window.app.uiManager) {
                window.app.uiManager.addConsoleMessage('🌐 Server is full. Try again later.', 'error');
            }
            this.disconnect();
        });
    }
    
    startPositionUpdates() {
        this.updateInterval = setInterval(() => {
            this.sendPosition();
        }, 50); // 20 updates per second
    }
    
    stopPositionUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    sendPosition() {
        if (!this.connected || !this.car) return;
        
        this.socket.emit('playerMovement', {
            position: {
                x: this.car.position.x,
                y: this.car.position.y,
                z: this.car.position.z
            },
            rotation: {
                x: this.car.rotation.x,
                y: this.car.rotation.y,
                z: this.car.rotation.z
            },
            speed: this.car.getSpeed(),
            timestamp: Date.now()
        });
    }
    
    addPlayer(id, data) {
        if (this.players.has(id)) return;
        
        // Create player car
        const group = new THREE.Group();
        
        // Body
        const bodyGeo = new THREE.BoxGeometry(2, 0.8, 4);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: data.color || 0x00ffff,
            transparent: true,
            opacity: 0.7,
            emissive: new THREE.Color(0x004444)
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.4;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Cabin
        const cabinGeo = new THREE.BoxGeometry(1.6, 0.6, 2);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x333333, transparent: true, opacity: 0.5 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 1.0, -0.5);
        cabin.castShadow = true;
        group.add(cabin);
        
        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 24);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        
        const positions = [
            [-1.2, 0.3, 1.2], [1.2, 0.3, 1.2],
            [-1.2, 0.3, -1.2], [1.2, 0.3, -1.2]
        ];
        
        positions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(pos[0], pos[1], pos[2]);
            wheel.castShadow = true;
            group.add(wheel);
        });
        
        // Name tag
        this.createNameTag(id, group, data.name);
        
        if (data.position) {
            group.position.set(data.position.x, data.position.y, data.position.z);
        }
        
        if (data.rotation) {
            group.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
        }
        
        this.scene.add(group);
        
        this.players.set(id, {
            mesh: group,
            lastUpdate: Date.now(),
            position: data.position ? new THREE.Vector3(data.position.x, data.position.y, data.position.z) : null,
            rotation: data.rotation ? new THREE.Euler(data.rotation.x, data.rotation.y, data.rotation.z) : null,
            targetPosition: null,
            targetRotation: null,
            speed: 0
        });
    }
    
    createNameTag(id, group, name = '') {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Border
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
        
        // Text
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name || `Player ${id.substring(0, 4)}`, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(2, 0.5, 1);
        sprite.position.set(0, 2.5, 0);
        group.add(sprite);
    }
    
    updatePlayer(id, data) {
        const player = this.players.get(id);
        if (!player) return;
        
        // Store target positions for interpolation
        if (data.position) {
            player.targetPosition = new THREE.Vector3(
                data.position.x,
                data.position.y,
                data.position.z
            );
            player.targetTime = Date.now() + this.interpolationDelay;
        }
        
        if (data.rotation) {
            player.targetRotation = new THREE.Euler(
                data.rotation.x,
                data.rotation.y,
                data.rotation.z
            );
        }
        
        player.speed = data.speed || 0;
        player.lastUpdate = Date.now();
    }
    
    removePlayer(id) {
        const player = this.players.get(id);
        if (player) {
            this.scene.remove(player.mesh);
            this.players.delete(id);
        }
    }
    
    handlePlayerAction(id, action) {
        const player = this.players.get(id);
        if (!player) return;
        
        switch(action) {
            case 'horn':
                // Visual feedback for horn
                player.mesh.children.forEach(child => {
                    if (child.material) {
                        child.material.emissive.setHex(0x444444);
                        setTimeout(() => {
                            child.material.emissive.setHex(0x000000);
                        }, 200);
                    }
                });
                break;
            case 'lights':
                // Toggle lights visual
                break;
        }
    }
    
    sendChat(message) {
        if (!this.connected) return;
        
        this.socket.emit('chatMessage', message.substring(0, 200));
        
        if (window.app && window.app.uiManager) {
            window.app.uiManager.addConsoleMessage(`[You] ${message}`, 'chat');
        }
    }
    
    sendAction(action) {
        if (!this.connected) return;
        
        this.socket.emit('playerAction', action);
    }
    
    update() {
        if (!this.connected) return;
        
        const now = Date.now();
        
        this.players.forEach((player, id) => {
            if (!player.mesh) return;
            
            // Interpolate position
            if (player.targetPosition && now < player.targetTime) {
                // Smooth interpolation
                const alpha = 1 - (player.targetTime - now) / this.interpolationDelay;
                player.mesh.position.lerpVectors(
                    player.mesh.position,
                    player.targetPosition,
                    alpha
                );
            } else if (player.targetPosition) {
                // Direct set if interpolation is done
                player.mesh.position.copy(player.targetPosition);
                player.targetPosition = null;
            }
            
            // Interpolate rotation
            if (player.targetRotation) {
                player.mesh.rotation.x += (player.targetRotation.x - player.mesh.rotation.x) * 0.1;
                player.mesh.rotation.y += (player.targetRotation.y - player.mesh.rotation.y) * 0.1;
                player.mesh.rotation.z += (player.targetRotation.z - player.mesh.rotation.z) * 0.1;
            }
            
            // Remove stale players (no update for 10 seconds)
            if (now - player.lastUpdate > 10000) {
                this.removePlayer(id);
            }
        });
    }
    
    getPlayerCount() {
        return this.players.size;
    }
    
    disconnect() {
        this.connected = false;
        this.stopPositionUpdates();
        
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        
        // Remove all player meshes
        this.players.forEach((player, id) => {
            this.scene.remove(player.mesh);
        });
        this.players.clear();
    }
}