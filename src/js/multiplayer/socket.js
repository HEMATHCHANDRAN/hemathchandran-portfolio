import { io } from 'socket.io-client';

export class Multiplayer {
    constructor(vehicle, scene, console_log) {
        this.vehicle = vehicle;
        this.scene = scene;
        this.console = console_log;
        this.socket = null;
        this.players = new Map();
        this.playerId = null;
        
        // Check if multiplayer is enabled
        const enableMultiplayer = import.meta.env.VITE_ENABLE_MULTIPLAYER === 'true';
        if (!enableMultiplayer) {
            this.console.log('Multiplayer disabled in settings');
            return;
        }
        
        this.connect();
    }

    connect() {
        const url = import.meta.env.VITE_WEBSOCKET_URL || 'wss://localhost:3001';
        
        this.socket = io(url, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000
        });
        
        this.socket.on('connect', () => {
            this.playerId = this.socket.id;
            this.console.log('✅ Connected to multiplayer server');
        });
        
        this.socket.on('connect_error', (error) => {
            this.console.log('⚠️ Multiplayer connection error: ' + error.message);
            this.console.log('Running in single-player mode');
        });
        
        this.socket.on('disconnect', () => {
            this.console.log('Disconnected from server');
        });
        
        this.socket.on('currentPlayers', (players) => {
            players.forEach(player => {
                if (player.id !== this.socket.id) {
                    this.addPlayer(player.id, player);
                }
            });
        });
        
        this.socket.on('newPlayer', (data) => {
            this.addPlayer(data.id, data);
        });
        
        this.socket.on('playerMoved', (data) => {
            this.updatePlayer(data.id, data);
        });
        
        this.socket.on('playerDisconnected', (id) => {
            this.removePlayer(id);
        });
        
        this.socket.on('chatMessage', (data) => {
            this.console.log(`${data.name}: ${data.message}`);
        });
        
        this.socket.on('serverStats', (stats) => {
            // Update UI with server stats if needed
        });
        
        // Send position updates (optimized)
        let lastUpdate = 0;
        setInterval(() => {
            if (this.socket && this.socket.connected && this.vehicle.model) {
                const now = Date.now();
                // Send every 100ms for smooth movement
                if (now - lastUpdate > 100) {
                    this.socket.emit('playerMovement', {
                        position: {
                            x: this.vehicle.model.position.x,
                            y: this.vehicle.model.position.y,
                            z: this.vehicle.model.position.z
                        },
                        rotation: {
                            x: this.vehicle.model.rotation.x,
                            y: this.vehicle.model.rotation.y,
                            z: this.vehicle.model.rotation.z
                        },
                        speed: this.vehicle.currentSpeed || 0
                    });
                    lastUpdate = now;
                }
            }
        }, 50);
    }

    addPlayer(id, data) {
        if (this.players.has(id)) return;
        
        // Create a ghost car for this player
        const geometry = new THREE.BoxGeometry(2, 0.8, 4);
        const material = new THREE.MeshStandardMaterial({ 
            color: data.color || 0x00ffff,
            transparent: true,
            opacity: 0.6,
            emissive: 0x004444
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        if (data.position) {
            mesh.position.set(data.position.x, data.position.y, data.position.z);
        }
        
        if (data.rotation) {
            mesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
        }
        
        this.scene.add(mesh);
        this.players.set(id, {
            mesh: mesh,
            name: data.name || 'Player',
            lastUpdate: Date.now()
        });
        
        this.console.log(`👤 ${data.name || 'Player'} joined`);
    }

    updatePlayer(id, data) {
        const player = this.players.get(id);
        if (player && player.mesh && data.position) {
            // Smooth interpolation
            player.mesh.position.set(data.position.x, data.position.y, data.position.z);
            
            if (data.rotation) {
                player.mesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
            }
            
            player.lastUpdate = Date.now();
        }
    }

    removePlayer(id) {
        const player = this.players.get(id);
        if (player) {
            this.scene.remove(player.mesh);
            this.players.delete(id);
            this.console.log(`👋 ${player.name || 'Player'} left`);
        }
    }

    sendMessage(message) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('chatMessage', message);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}