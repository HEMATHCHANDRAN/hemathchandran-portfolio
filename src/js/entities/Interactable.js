import * as THREE from 'three';

export class Interactable {
    constructor(scene, position, name, color) {
        this.scene = scene;
        this.position = position;
        this.name = name;
        this.color = color;
        this.group = new THREE.Group();
        this.collected = false;
        this.highlighted = false;
        this.pulseTime = 0;
        this.rotationSpeed = 0.5 + Math.random() * 0.5;
        this.floatSpeed = 1 + Math.random();
        this.floatOffset = Math.random() * Math.PI * 2;
        
        this.create();
    }
    
    create() {
        // Base/platform
        const baseGeo = new THREE.CylinderGeometry(0.5, 0.6, 0.2);
        const baseMat = new THREE.MeshStandardMaterial({ 
            color: 0x888888,
            metalness: 0.7,
            roughness: 0.3
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.1;
        base.castShadow = true;
        base.receiveShadow = true;
        this.group.add(base);
        
        // Create specific microcontroller model
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
        
        // Add glow effect
        this.createGlow();
        
        // Add label
        this.createLabel();
        
        this.group.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.group);
    }
    
    createESP32() {
        // Main board
        const boardGeo = new THREE.BoxGeometry(1.2, 0.15, 0.8);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0x0000ff, metalness: 0.3 });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.y = 0.2;
        board.castShadow = true;
        this.group.add(board);
        
        // Metal shield
        const shieldGeo = new THREE.BoxGeometry(0.8, 0.05, 0.5);
        const shieldMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 });
        const shield = new THREE.Mesh(shieldGeo, shieldMat);
        shield.position.set(0.1, 0.28, 0);
        shield.castShadow = true;
        this.group.add(shield);
        
        // Antenna
        const antennaGeo = new THREE.CylinderGeometry(0.03, 0.05, 0.6);
        const antennaMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        const antenna = new THREE.Mesh(antennaGeo, antennaMat);
        antenna.position.set(0.4, 0.5, 0.3);
        antenna.castShadow = true;
        this.group.add(antenna);
        
        // GPIO pins
        for (let i = 0; i < 8; i++) {
            const pinGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.2);
            const pinMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
            const pin = new THREE.Mesh(pinGeo, pinMat);
            pin.position.set(-0.5 + i * 0.14, 0.3, -0.35);
            pin.castShadow = true;
            this.group.add(pin);
        }
        
        // USB port
        const usbGeo = new THREE.BoxGeometry(0.2, 0.1, 0.15);
        const usbMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const usb = new THREE.Mesh(usbGeo, usbMat);
        usb.position.set(-0.5, 0.25, 0.2);
        usb.castShadow = true;
        this.group.add(usb);
    }
    
    createSTM32() {
        // Main board
        const boardGeo = new THREE.BoxGeometry(1.0, 0.15, 1.0);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.3 });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.y = 0.2;
        board.castShadow = true;
        this.group.add(board);
        
        // MCU chip
        const chipGeo = new THREE.BoxGeometry(0.4, 0.1, 0.4);
        const chipMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const chip = new THREE.Mesh(chipGeo, chipMat);
        chip.position.set(0.2, 0.28, 0.1);
        chip.castShadow = true;
        this.group.add(chip);
        
        // Pins on all sides
        for (let i = 0; i < 10; i++) {
            const pinGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.2);
            const pinMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
            
            // Left side
            const pinLeft = new THREE.Mesh(pinGeo, pinMat);
            pinLeft.position.set(-0.55, 0.28, -0.45 + i * 0.1);
            pinLeft.castShadow = true;
            this.group.add(pinLeft);
            
            // Right side
            const pinRight = new THREE.Mesh(pinGeo, pinMat);
            pinRight.position.set(0.55, 0.28, -0.45 + i * 0.1);
            pinRight.castShadow = true;
            this.group.add(pinRight);
        }
        
        // Button
        const btnGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.05);
        const btnMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
        const btn = new THREE.Mesh(btnGeo, btnMat);
        btn.position.set(-0.3, 0.28, -0.3);
        btn.castShadow = true;
        this.group.add(btn);
    }
    
    createRaspberryPi() {
        // Main board
        const boardGeo = new THREE.BoxGeometry(1.4, 0.1, 0.8);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0x00aa00, metalness: 0.2 });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.y = 0.15;
        board.castShadow = true;
        this.group.add(board);
        
        // GPIO header
        const headerGeo = new THREE.BoxGeometry(0.6, 0.15, 0.2);
        const headerMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const header = new THREE.Mesh(headerGeo, headerMat);
        header.position.set(0.4, 0.23, 0.2);
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
        
        // Ethernet port
        const ethGeo = new THREE.BoxGeometry(0.25, 0.15, 0.2);
        const ethMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const eth = new THREE.Mesh(ethGeo, ethMat);
        eth.position.set(-0.4, 0.23, 0.25);
        eth.castShadow = true;
        this.group.add(eth);
        
        // HDMI port
        const hdmiGeo = new THREE.BoxGeometry(0.2, 0.1, 0.2);
        const hdmiMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const hdmi = new THREE.Mesh(hdmiGeo, hdmiMat);
        hdmi.position.set(0.5, 0.2, -0.3);
        hdmi.castShadow = true;
        this.group.add(hdmi);
    }
    
    createArduino() {
        // Main board
        const boardGeo = new THREE.BoxGeometry(1.2, 0.1, 0.7);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0x0088cc });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.y = 0.15;
        board.castShadow = true;
        this.group.add(board);
        
        // IC socket
        const icGeo = new THREE.BoxGeometry(0.6, 0.1, 0.2);
        const icMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const ic = new THREE.Mesh(icGeo, icMat);
        ic.position.set(0.2, 0.23, 0);
        ic.castShadow = true;
        this.group.add(ic);
        
        // Pin headers
        for (let i = 0; i < 8; i++) {
            const pinGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.15);
            const pinMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
            
            // Top header
            const pinTop = new THREE.Mesh(pinGeo, pinMat);
            pinTop.position.set(-0.4 + i * 0.12, 0.23, 0.3);
            pinTop.castShadow = true;
            this.group.add(pinTop);
            
            // Bottom header
            const pinBottom = new THREE.Mesh(pinGeo, pinMat);
            pinBottom.position.set(-0.4 + i * 0.12, 0.23, -0.3);
            pinBottom.castShadow = true;
            this.group.add(pinBottom);
        }
        
        // USB port
        const usbGeo = new THREE.BoxGeometry(0.2, 0.1, 0.2);
        const usbMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const usb = new THREE.Mesh(usbGeo, usbMat);
        usb.position.set(-0.5, 0.2, 0.1);
        usb.castShadow = true;
        this.group.add(usb);
        
        // Power jack
        const pwrGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.15);
        const pwrMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const pwr = new THREE.Mesh(pwrGeo, pwrMat);
        pwr.rotation.x = Math.PI / 2;
        pwr.position.set(0.5, 0.2, 0.25);
        pwr.castShadow = true;
        this.group.add(pwr);
    }
    
    createESP32Cam() {
        // Main board
        const boardGeo = new THREE.BoxGeometry(1.2, 0.15, 0.8);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0xff00ff, metalness: 0.3 });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.y = 0.2;
        board.castShadow = true;
        this.group.add(board);
        
        // Camera module
        const camBaseGeo = new THREE.BoxGeometry(0.4, 0.15, 0.4);
        const camBaseMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const camBase = new THREE.Mesh(camBaseGeo, camBaseMat);
        camBase.position.set(0.4, 0.3, 0.3);
        camBase.castShadow = true;
        this.group.add(camBase);
        
        // Camera lens
        const lensGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.1);
        const lensMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const lens = new THREE.Mesh(lensGeo, lensMat);
        lens.position.set(0.4, 0.38, 0.45);
        lens.rotation.x = Math.PI / 2;
        lens.castShadow = true;
        this.group.add(lens);
        
        // Lens glass
        const glassGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.05);
        const glassMat = new THREE.MeshStandardMaterial({ 
            color: 0x88ccff, 
            transparent: true, 
            opacity: 0.7 
        });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.set(0.4, 0.38, 0.5);
        glass.rotation.x = Math.PI / 2;
        glass.castShadow = true;
        this.group.add(glass);
        
        // Flash LED
        const ledGeo = new THREE.SphereGeometry(0.05);
        const ledMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x442200 });
        const led = new THREE.Mesh(ledGeo, ledMat);
        led.position.set(0.5, 0.28, 0.3);
        led.castShadow = true;
        this.group.add(led);
    }
    
    createBLE() {
        // Small module
        const boardGeo = new THREE.BoxGeometry(0.8, 0.1, 0.5);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0x00ffff });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.y = 0.15;
        board.castShadow = true;
        this.group.add(board);
        
        // Chip
        const chipGeo = new THREE.BoxGeometry(0.3, 0.1, 0.3);
        const chipMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const chip = new THREE.Mesh(chipGeo, chipMat);
        chip.position.set(0.1, 0.23, 0);
        chip.castShadow = true;
        this.group.add(chip);
        
        // Antenna pattern
        for (let i = 0; i < 3; i++) {
            const traceGeo = new THREE.BoxGeometry(0.4, 0.02, 0.02);
            const traceMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
            const trace = new THREE.Mesh(traceGeo, traceMat);
            trace.position.set(-0.2, 0.18, -0.15 + i * 0.15);
            trace.castShadow = true;
            this.group.add(trace);
        }
        
        // Bluetooth symbol
        const symbolGroup = new THREE.Group();
        const barGeo = new THREE.BoxGeometry(0.02, 0.1, 0.02);
        const barMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        
        for (let i = 0; i < 3; i++) {
            const bar = new THREE.Mesh(barGeo, barMat);
            bar.position.set(0, i * 0.05 - 0.05, 0.1);
            bar.rotation.z = i === 1 ? 0.5 : -0.5;
            symbolGroup.add(bar);
        }
        
        symbolGroup.position.set(-0.2, 0.25, 0.15);
        this.group.add(symbolGroup);
    }
    
    createGeneric() {
        const boardGeo = new THREE.BoxGeometry(1.0, 0.15, 0.8);
        const boardMat = new THREE.MeshStandardMaterial({ color: this.color });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.y = 0.2;
        board.castShadow = true;
        this.group.add(board);
        
        // Add some generic components
        const chipGeo = new THREE.BoxGeometry(0.3, 0.1, 0.3);
        const chipMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const chip = new THREE.Mesh(chipGeo, chipMat);
        chip.position.set(0.2, 0.28, 0.1);
        chip.castShadow = true;
        this.group.add(chip);
    }
    
    createGlow() {
        // Add a point light for glow effect
        const light = new THREE.PointLight(this.color, 0.5, 2);
        light.position.set(0, 0.5, 0);
        this.group.add(light);
        this.glowLight = light;
        
        // Add a small sphere for glow visualization
        const glowGeo = new THREE.SphereGeometry(0.2);
        const glowMat = new THREE.MeshStandardMaterial({ 
            color: this.color,
            emissive: this.color,
            transparent: true,
            opacity: 0.3
        });
        this.glowSphere = new THREE.Mesh(glowGeo, glowMat);
        this.glowSphere.position.set(0, 0.5, 0);
        this.group.add(this.glowSphere);
    }
    
    createLabel() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Draw label background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw border
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
        
        // Draw text
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.name, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(1.2, 0.3, 1);
        sprite.position.set(0, 1.2, 0);
        this.group.add(sprite);
    }
    
    update(deltaTime) {
        if (this.collected) return;
        
        // Update pulse animation
        this.pulseTime += deltaTime;
        
        // Floating animation
        const floatY = Math.sin(this.pulseTime * this.floatSpeed + this.floatOffset) * 0.1;
        this.group.position.y = this.position.y + floatY;
        
        // Rotation
        this.group.rotation.y += this.rotationSpeed * deltaTime;
        
        // Scale based on highlight
        if (this.highlighted) {
            const pulse = 1 + Math.sin(this.pulseTime * 5) * 0.05;
            this.group.scale.set(pulse, pulse, pulse);
            
            // Increase glow
            if (this.glowLight) {
                this.glowLight.intensity = 0.5 + Math.sin(this.pulseTime * 5) * 0.2;
            }
            if (this.glowSphere) {
                this.glowSphere.material.opacity = 0.3 + Math.sin(this.pulseTime * 5) * 0.1;
            }
        } else {
            this.group.scale.set(1, 1, 1);
            if (this.glowLight) {
                this.glowLight.intensity = 0.2;
            }
            if (this.glowSphere) {
                this.glowSphere.material.opacity = 0.1;
            }
        }
    }
    
    highlight(enable) {
        this.highlighted = enable;
    }
    
    collect() {
        this.collected = true;
        
        // Play collection animation
        const startY = this.group.position.y;
        const startScale = 1;
        
        const animate = (progress) => {
            if (progress < 0.5) {
                // Shrink and rise
                this.group.scale.setScalar(1 - progress);
                this.group.position.y = startY + progress * 2;
            } else {
                // Disappear
                this.group.visible = false;
            }
        };
        
        // Simple animation
        let time = 0;
        const interval = setInterval(() => {
            time += 0.1;
            animate(time);
            if (time >= 1) {
                clearInterval(interval);
            }
        }, 50);
    }
}