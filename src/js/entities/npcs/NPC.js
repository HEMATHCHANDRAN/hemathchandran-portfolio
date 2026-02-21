import * as THREE from 'three';

export class NPC {
    constructor(scene, position, color) {
        this.scene = scene;
        this.position = position;
        this.color = color;
        this.group = new THREE.Group();
        this.state = 'walking'; // walking, idle, talking
        this.direction = 1;
        this.speed = 0.5 + Math.random() * 0.5;
        this.walkRange = 3 + Math.random() * 3;
        this.startX = position.x;
        this.idleTimer = 0;
        this.dialogue = [];
        
        this.create();
    }
    
    create() {
        // Body
        const bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: this.color });
        this.body = new THREE.Mesh(bodyGeo, bodyMat);
        this.body.position.y = 0.6;
        this.body.castShadow = true;
        this.body.receiveShadow = true;
        this.group.add(this.body);
        
        // Head
        const headGeo = new THREE.SphereGeometry(0.25);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
        this.head = new THREE.Mesh(headGeo, headMat);
        this.head.position.y = 1.3;
        this.head.castShadow = true;
        this.head.receiveShadow = true;
        this.group.add(this.head);
        
        // Hat (optional)
        if (Math.random() > 0.5) {
            const hatGeo = new THREE.ConeGeometry(0.3, 0.3, 8);
            const hatMat = new THREE.MeshStandardMaterial({ color: 0x884422 });
            this.hat = new THREE.Mesh(hatGeo, hatMat);
            this.hat.position.y = 1.5;
            this.hat.castShadow = true;
            this.group.add(this.hat);
        }
        
        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.05);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.1, 1.35, 0.2);
        this.group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.1, 1.35, 0.2);
        this.group.add(rightEye);
        
        // Arms
        const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8);
        const armMat = new THREE.MeshStandardMaterial({ color: this.color });
        
        // Left arm
        this.leftArm = new THREE.Mesh(armGeo, armMat);
        this.leftArm.position.set(-0.35, 1.0, 0);
        this.leftArm.rotation.z = 0.2;
        this.leftArm.castShadow = true;
        this.group.add(this.leftArm);
        
        // Right arm
        this.rightArm = new THREE.Mesh(armGeo, armMat);
        this.rightArm.position.set(0.35, 1.0, 0);
        this.rightArm.rotation.z = -0.2;
        this.rightArm.castShadow = true;
        this.group.add(this.rightArm);
        
        // Legs
        const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
        
        // Left leg
        this.leftLeg = new THREE.Mesh(legGeo, legMat);
        this.leftLeg.position.set(-0.15, 0.1, 0);
        this.leftLeg.castShadow = true;
        this.group.add(this.leftLeg);
        
        // Right leg
        this.rightLeg = new THREE.Mesh(legGeo, legMat);
        this.rightLeg.position.set(0.15, 0.1, 0);
        this.rightLeg.castShadow = true;
        this.group.add(this.rightLeg);
        
        this.group.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.group);
    }
    
    update(deltaTime) {
        switch(this.state) {
            case 'walking':
                // Move back and forth
                this.position.x += this.speed * this.direction * deltaTime;
                
                // Check bounds
                if (Math.abs(this.position.x - this.startX) > this.walkRange) {
                    this.direction *= -1;
                    this.state = 'idle';
                    this.idleTimer = 1 + Math.random() * 2;
                }
                
                // Animate walking
                this.animateWalk(deltaTime);
                break;
                
            case 'idle':
                this.idleTimer -= deltaTime;
                if (this.idleTimer <= 0) {
                    this.state = 'walking';
                }
                break;
        }
        
        this.group.position.set(this.position.x, this.position.y, this.position.z);
    }
    
    animateWalk(deltaTime) {
        const time = Date.now() * 0.01;
        const swing = Math.sin(time) * 0.3;
        
        if (this.leftArm) {
            this.leftArm.rotation.x = swing;
        }
        if (this.rightArm) {
            this.rightArm.rotation.x = -swing;
        }
        if (this.leftLeg) {
            this.leftLeg.rotation.x = -swing;
        }
        if (this.rightLeg) {
            this.rightLeg.rotation.x = swing;
        }
        
        // Bob head slightly
        if (this.head) {
            this.head.position.y = 1.3 + Math.sin(time * 2) * 0.03;
        }
    }
    
    talk(message) {
        // Create speech bubble using HTML/CSS overlay
        const bubble = document.createElement('div');
        bubble.className = 'speech-bubble';
        bubble.textContent = message;
        bubble.style.position = 'absolute';
        bubble.style.background = 'rgba(255, 255, 255, 0.9)';
        bubble.style.color = '#000';
        bubble.style.padding = '5px 10px';
        bubble.style.borderRadius = '10px';
        bubble.style.border = '2px solid #00ff00';
        bubble.style.fontSize = '12px';
        bubble.style.pointerEvents = 'none';
        bubble.style.zIndex = '1000';
        
        // Position near NPC (convert 3D to screen coordinates)
        // This would need vector projection - simplified for demo
        document.body.appendChild(bubble);
        
        setTimeout(() => {
            bubble.remove();
        }, 3000);
    }
    
    setDialogue(lines) {
        this.dialogue = lines;
    }
}