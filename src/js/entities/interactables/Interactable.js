import * as THREE from 'three';

export class Interactable {
    constructor(scene, position, name, color) {
        this.scene = scene;
        this.position = position;
        this.name = name;
        this.color = color;
        this.collected = false;
        this.highlighted = false;
        this.pulseTime = 0;
        
        this.create();
    }
    
    create() {
        this.group = new THREE.Group();
        
        // Base
        const baseGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.2);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.1;
        base.castShadow = true;
        base.receiveShadow = true;
        this.group.add(base);
        
        // Main body (represents different microcontrollers)
        switch(this.name) {
            case 'ESP32':
                this.createESP32();
                break;
            case 'STM32':
                this.createSTM32();
                break;
            case 'Raspberry Pi':
                this.createRaspberryPi();
                break;
            case 'Arduino':
                this.createArduino();
                break;
            case 'ESP32-CAM':
                this.createESP32Cam();
                break;
            case 'BLE Module':
                this.createBLE();
                break;
            default:
                this.createGeneric();
        }
        
        // Label
        this.createLabel();
        
        this.group.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.group);
    }
    
    createESP32() {
        // Main board
        const boardGeo = new THREE.BoxGeometry(1.2, 0.2, 0.8);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0x0000ff });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.y = 0.2;
        board.castShadow = true;
        this.group.add(board);
        
        // Antenna
        const antennaGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5);
        const antennaMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        const antenna = new THREE.Mesh(antennaGeo, antennaMat);
        antenna.position.set(0.4, 0.45, 0.3);
        antenna.castShadow = true;
        this.group.add(antenna);
        
        // GPIO pins
        for (let i = 0; i < 8; i++) {
            const pinGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.15);
            const pinMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
            const pin = new THREE.Mesh(pinGeo, pinMat);
            pin.position.set(-0.5 + i * 0.14, 0.3, -0.35);
            pin.castShadow = true;
            this.group.add(pin);
        }
    }
    
    createSTM32() {
        // Main board
        const boardGeo = new THREE.BoxGeometry(1.0, 0.2, 1.0);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.y = 0.2;
        board.castShadow = true;
        this.group.add(board);
        
        // Pins on all sides
        for (let i = 0; i < 10; i++) {
            const pinGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.2);
            const pinMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
            
            // Left side
            const pinLeft = new THREE.Mesh(pinGeo, pinMat);
            pinLeft.position.set(-0.55, 0.3, -0.45 + i * 0.1);
            pinLeft.rotation.z = Math.PI / 2;
            pinLeft.castShadow = true;
            this.group.add(pinLeft);
            
            // Right side
            const pinRight = new THREE.Mesh(pinGeo, pinMat);
            pinRight.position.set(0.55, 0.3, -0.45 + i * 0.1);
            pinRight.rotation.z = Math.PI / 2;
            pinRight.castShadow = true;
            this.group.add(pinRight);
        }
    }
    
    createRaspberryPi() {
        // Main board
        const boardGeo = new THREE.BoxGeometry(1.4, 0.15, 0.8);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0x00aa00 });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.y = 0.15;
        board.castShadow = true;
        this.group.add(board);
        
        // GPIO header
        const headerGeo = new THREE.BoxGeometry(0.6, 0.15, 0.2);
        const headerMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const header = new THREE.Mesh(headerGeo, headerMat);
        header.position.set(0.4, 0.25, 0.2);
        header.castShadow = true;
        this.group.add(header);
        
        // USB ports
        for (let i = 0; i < 4; i++) {
            const usbGeo = new THREE.BoxGeometry(0.15, 0.1, 0.2);
            const usbMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
            const usb = new THREE.Mesh(usbGeo, usbMat);
            usb.position.set(-0.4 + i * 0.25, 0.2, -0.45);
            usb.castShadow = true;
            this.group.add(usb);
        }
    }
    
    createArduino() {
        // Main board
        const boardGeo = new THREE.BoxGeometry(1.2, 0.15, 0.7);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0x0088cc });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.y = 0.15;
        board.castShadow = true;
        this.group.add(board);
        
        // IC socket
        const icGeo = new THREE.BoxGeometry(0.6, 0.1, 0.2);
        const icMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const ic = new THREE.Mesh(icGeo, icMat);
        ic.position.set(0.2, 0.25, 0);
        ic.castShadow = true;
        this.group.add(ic);
        
        // Pin headers
        for (let i = 0; i < 8; i++) {
            const pinGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.15);
            const pinMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
            const pin = new THREE.Mesh(pinGeo, pinMat);
            pin.position.set(-0.5 + i * 0.14, 0.25, -0.3);
            pin.castShadow = true;
            this.group.add(pin);
        }
    }
    
    createESP32Cam() {
        // Main board
        const boardGeo = new THREE.BoxGeometry(1.2, 0.2, 0.8);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0xff00ff });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.y = 0.2;
        board.castShadow = true;
        this.group.add(board);
        
        // Camera lens
        const lensGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1);
        const lensMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const lens = new THREE.Mesh(lensGeo, lensMat);
        lens.position.set(0.4, 0.3, 0.3);
        lens.rotation.x = Math.PI / 2;
        lens.castShadow = true;
        this.group.add(lens);
        
        // Glass
        const glassGeo = new THREE.SphereGeometry(0.15);
        const glassMat = new THREE.MeshStandardMaterial({ 
            color: 0x88ccff, 
            transparent: true, 
            opacity: 0.5 
        });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.set(0.4, 0.3, 0.4);
        glass.castShadow = true;
        this.group.add(glass);
    }
    
    createBLE() {
        // Small module
        const boardGeo = new THREE.BoxGeometry(0.8, 0.15, 0.5);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0x00ffff });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.y = 0.15;
        board.castShadow = true;
        this.group.add(board);
        
        // Bluetooth symbol
        const symbolGeo = new THREE.TorusGeometry(0.15, 0.02, 8, 3, Math.PI);
        const symbolMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const symbol = new THREE.Mesh(symbolGeo, symbolMat);
        symbol.position.set(0, 0.25, 0);
        symbol.rotation.x = Math.PI / 2;
        symbol.castShadow = true;
        this.group.add(symbol);
    }
    
    createGeneric() {
        const boardGeo = new THREE.BoxGeometry(1.0, 0.2, 0.8);
        const boardMat = new THREE.MeshStandardMaterial({ color: this.color });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.y = 0.2;
        board.castShadow = true;
        this.group.add(board);
    }
    
    createLabel() {
        // Create canvas texture for label
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
        
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, canvas.width / 2, canvas.height / 2 + 5);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(0.8, 0.4, 1);
        sprite.position.set(0, 0.8, 0);
        this.group.add(sprite);
    }
    
    update(deltaTime) {
        if (this.collected) return;
        
        // Floating animation
        this.pulseTime += deltaTime;
        this.group.position.y = this.position.y + Math.sin(this.pulseTime * 3) * 0.1;
        
        // Rotation
        this.group.rotation.y += deltaTime * 0.5;
        
        // Scale based on highlight
        if (this.highlighted) {
            this.group.scale.setScalar(1.2);
        } else {
            this.group.scale.setScalar(1.0);
        }
    }
    
    highlight(enable) {
        this.highlighted = enable;
    }
}