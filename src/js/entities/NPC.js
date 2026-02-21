import * as THREE from 'three';

export class NPC {
    constructor(scene, position, color) {
        this.scene = scene;
        this.startPosition = { ...position };
        this.position = { ...position };
        this.color = color;
        this.group = new THREE.Group();
        
        // AI states
        this.state = 'walking'; // walking, idle, talking, following
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.speed = 0.3 + Math.random() * 0.4;
        this.walkRange = 3 + Math.random() * 2;
        this.idleTimer = 0;
        this.walkTimer = 0;
        this.blinkTimer = 0;
        
        // Animation
        this.armSwing = 0;
        this.headBob = 0;
        this.blinkState = 0;
        
        // Dialogue
        this.dialogue = [];
        this.currentDialogue = 0;
        
        this.create();
    }
    
    create() {
        this.createBody();
        this.createHead();
        this.createLimbs();
        this.createClothes();
        
        this.group.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.group);
    }
    
    createBody() {
        // Torso
        const torsoGeo = new THREE.CylinderGeometry(0.25, 0.3, 1.0);
        const torsoMat = new THREE.MeshStandardMaterial({ color: this.color });
        this.torso = new THREE.Mesh(torsoGeo, torsoMat);
        this.torso.position.y = 0.5;
        this.torso.castShadow = true;
        this.torso.receiveShadow = true;
        this.group.add(this.torso);
    }
    
    createHead() {
        // Head
        const headGeo = new THREE.SphereGeometry(0.2);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
        this.head = new THREE.Mesh(headGeo, headMat);
        this.head.position.y = 1.1;
        this.head.castShadow = true;
        this.head.receiveShadow = true;
        this.group.add(this.head);
        
        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.04);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        
        this.leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        this.leftEye.position.set(-0.07, 1.15, 0.15);
        this.group.add(this.leftEye);
        
        this.rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        this.rightEye.position.set(0.07, 1.15, 0.15);
        this.group.add(this.rightEye);
        
        // Hat (30% chance)
        if (Math.random() > 0.7) {
            const hatGeo = new THREE.ConeGeometry(0.15, 0.15, 8);
            const hatMat = new THREE.MeshStandardMaterial({ color: 0x884422 });
            const hat = new THREE.Mesh(hatGeo, hatMat);
            hat.position.set(0, 1.25, 0);
            hat.castShadow = true;
            this.group.add(hat);
        }
    }
    
    createLimbs() {
        // Arms
        const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.7);
        const armMat = new THREE.MeshStandardMaterial({ color: this.color });
        
        this.leftArm = new THREE.Mesh(armGeo, armMat);
        this.leftArm.position.set(-0.3, 0.9, 0);
        this.leftArm.rotation.z = 0.2;
        this.leftArm.castShadow = true;
        this.group.add(this.leftArm);
        
        this.rightArm = new THREE.Mesh(armGeo, armMat);
        this.rightArm.position.set(0.3, 0.9, 0);
        this.rightArm.rotation.z = -0.2;
        this.rightArm.castShadow = true;
        this.group.add(this.rightArm);
        
        // Legs
        const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
        
        this.leftLeg = new THREE.Mesh(legGeo, legMat);
        this.leftLeg.position.set(-0.15, 0.1, 0);
        this.leftLeg.castShadow = true;
        this.group.add(this.leftLeg);
        
        this.rightLeg = new THREE.Mesh(legGeo, legMat);
        this.rightLeg.position.set(0.15, 0.1, 0);
        this.rightLeg.castShadow = true;
        this.group.add(this.rightLeg);
    }
    
    createClothes() {
        // Add some variation with accessories
        if (Math.random() > 0.5) {
            // Scarf or tie
            const scarfGeo = new THREE.BoxGeometry(0.15, 0.1, 0.1);
            const scarfMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            const scarf = new THREE.Mesh(scarfGeo, scarfMat);
            scarf.position.set(0, 0.7, 0.15);
            scarf.castShadow = true;
            this.group.add(scarf);
        }
    }
    
    update(deltaTime) {
        this.updateState(deltaTime);
        this.updateAnimation(deltaTime);
        
        this.group.position.set(this.position.x, this.position.y, this.position.z);
    }
    
    updateState(deltaTime) {
        switch(this.state) {
            case 'walking':
                // Move back and forth
                this.position.x += this.speed * this.direction * deltaTime;
                this.walkTimer += deltaTime;
                
                // Check bounds
                if (Math.abs(this.position.x - this.startPosition.x) > this.walkRange) {
                    this.direction *= -1;
                    this.state = 'idle';
                    this.idleTimer = 1 + Math.random() * 3;
                }
                break;
                
            case 'idle':
                this.idleTimer -= deltaTime;
                if (this.idleTimer <= 0) {
                    this.state = 'walking';
                    this.direction = Math.random() > 0.5 ? 1 : -1;
                }
                break;
                
            case 'talking':
                // Stand still and face the player
                // This would be implemented when player approaches
                break;
                
            case 'following':
                // Follow the player
                // This would be implemented for guided tours
                break;
        }
    }
    
    updateAnimation(deltaTime) {
        // Arm swing during walking
        if (this.state === 'walking') {
            this.armSwing += deltaTime * 5;
            const swing = Math.sin(this.armSwing) * 0.3;
            
            this.leftArm.rotation.x = swing;
            this.rightArm.rotation.x = -swing;
            this.leftLeg.rotation.x = -swing * 0.5;
            this.rightLeg.rotation.x = swing * 0.5;
            
            // Head bob
            this.headBob += deltaTime * 5;
            this.head.position.y = 1.1 + Math.sin(this.headBob) * 0.03;
        } else {
            // Reset to idle pose
            this.leftArm.rotation.x = 0;
            this.rightArm.rotation.x = 0;
            this.leftLeg.rotation.x = 0;
            this.rightLeg.rotation.x = 0;
            this.head.position.y = 1.1;
        }
        
        // Blinking
        this.blinkTimer += deltaTime;
        if (this.blinkTimer > 3) {
            this.blinkState = 0.1; // Close eyes briefly
            if (this.blinkTimer > 3.1) {
                this.blinkTimer = 0;
                this.blinkState = 0;
            }
        }
        
        // Apply blink to eyes
        if (this.leftEye && this.rightEye) {
            this.leftEye.scale.y = 1 - this.blinkState;
            this.rightEye.scale.y = 1 - this.blinkState;
        }
    }
    
    lookAt(target) {
        // Make NPC face a target (player)
        const dx = target.x - this.position.x;
        const dz = target.z - this.position.z;
        const angle = Math.atan2(dx, dz);
        
        // Smooth rotation
        let currentRot = this.group.rotation.y;
        let diff = angle - currentRot;
        if (diff > Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;
        
        this.group.rotation.y += diff * 0.1;
    }
    
    talk(message) {
        this.state = 'talking';
        
        // Create speech bubble using HTML/CSS
        const bubble = document.createElement('div');
        bubble.className = 'speech-bubble';
        bubble.textContent = message;
        bubble.style.position = 'absolute';
        bubble.style.background = 'white';
        bubble.style.color = 'black';
        bubble.style.padding = '8px 15px';
        bubble.style.borderRadius = '20px';
        bubble.style.border = '2px solid #00ff00';
        bubble.style.fontSize = '14px';
        bubble.style.fontWeight = 'bold';
        bubble.style.pointerEvents = 'none';
        bubble.style.zIndex = '1000';
        bubble.style.whiteSpace = 'nowrap';
        bubble.style.boxShadow = '0 0 10px rgba(0,255,0,0.5)';
        
        // Position near NPC (would need 3D to 2D conversion)
        document.body.appendChild(bubble);
        
        // Update bubble position in animation loop
        const updatePosition = () => {
            // This would project 3D position to screen coordinates
            // Simplified for now
            bubble.style.left = '50%';
            bubble.style.top = '50%';
        };
        
        setTimeout(() => {
            bubble.remove();
            this.state = 'idle';
        }, 3000);
    }
    
    setDialogue(lines) {
        this.dialogue = lines;
    }
    
    getNextDialogue() {
        if (this.dialogue.length === 0) return null;
        
        const line = this.dialogue[this.currentDialogue];
        this.currentDialogue = (this.currentDialogue + 1) % this.dialogue.length;
        return line;
    }
}