import * as THREE from 'three';

export class Car {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.wheels = [];
        this.headlights = [];
        this.brakelights = [];
        
        // Physics properties
        this.position = new THREE.Vector3(0, 0.5, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.rotation = 0;
        this.wheelRotation = 0;
        
        // Car parameters
        this.mass = 1000;
        this.maxSpeed = 20;
        this.maxReverseSpeed = 8;
        this.accelerationForce = 15;
        this.brakeForce = 25;
        this.turnSpeed = 2.5;
        this.dragCoefficient = 0.98;
        this.tireGrip = 0.8;
        
        // Battery
        this.battery = 100;
        this.maxBattery = 100;
        this.consumptionRate = 0.5; // per second at full throttle
        this.rechargeRate = 2; // per second when stationary
        
        // Lights
        this.lightsOn = false;
        this.brakeLightsOn = false;
        
        // Camera
        this.cameraMode = 'follow'; // follow, first, top, cinematic
        this.cameraOffset = new THREE.Vector3(-5, 3, 5);
        
        this.createCar();
    }
    
    createCar() {
        this.createBody();
        this.createWheels();
        this.createLights();
        this.createDetails();
        
        this.scene.add(this.group);
    }
    
    createBody() {
        // Main body
        const bodyGeo = new THREE.BoxGeometry(2, 0.8, 4);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0xff3333, 
            metalness: 0.7, 
            roughness: 0.3,
            emissive: new THREE.Color(0x000000)
        });
        this.body = new THREE.Mesh(bodyGeo, bodyMat);
        this.body.position.y = 0.4;
        this.body.castShadow = true;
        this.body.receiveShadow = true;
        this.group.add(this.body);
        
        // Cabin
        const cabinGeo = new THREE.BoxGeometry(1.6, 0.6, 2);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 1.0, -0.5);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        this.group.add(cabin);
        
        // Windshield
        const windshieldGeo = new THREE.BoxGeometry(1.4, 0.4, 0.2);
        const windshieldMat = new THREE.MeshStandardMaterial({ 
            color: 0x88ccff, 
            transparent: true, 
            opacity: 0.7 
        });
        const windshield = new THREE.Mesh(windshieldGeo, windshieldMat);
        windshield.position.set(0, 1.3, 0.5);
        windshield.castShadow = true;
        this.group.add(windshield);
        
        // Rear window
        const rearWindowGeo = new THREE.BoxGeometry(1.4, 0.4, 0.2);
        const rearWindowMat = new THREE.MeshStandardMaterial({ 
            color: 0x88ccff, 
            transparent: true, 
            opacity: 0.5 
        });
        const rearWindow = new THREE.Mesh(rearWindowGeo, rearWindowMat);
        rearWindow.position.set(0, 1.0, -1.5);
        rearWindow.castShadow = true;
        this.group.add(rearWindow);
    }
    
    createWheels() {
        const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 24);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const rimMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });
        
        const positions = [
            { x: -1.2, z: 1.2 }, // Front left
            { x: 1.2, z: 1.2 },  // Front right
            { x: -1.2, z: -1.2 }, // Rear left
            { x: 1.2, z: -1.2 }   // Rear right
        ];
        
        positions.forEach((pos, index) => {
            const wheelGroup = new THREE.Group();
            
            // Tire
            const tire = new THREE.Mesh(wheelGeo, wheelMat);
            tire.rotation.z = Math.PI / 2;
            tire.castShadow = true;
            tire.receiveShadow = true;
            wheelGroup.add(tire);
            
            // Rim
            const rimGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.41, 8);
            const rim = new THREE.Mesh(rimGeo, rimMat);
            rim.rotation.z = Math.PI / 2;
            rim.castShadow = true;
            rim.receiveShadow = true;
            wheelGroup.add(rim);
            
            // Spokes
            for (let i = 0; i < 5; i++) {
                const spokeGeo = new THREE.BoxGeometry(0.05, 0.05, 0.45);
                const spokeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
                const spoke = new THREE.Mesh(spokeGeo, spokeMat);
                spoke.rotation.y = (i / 5) * Math.PI * 2;
                spoke.rotation.x = Math.PI / 2;
                spoke.castShadow = true;
                wheelGroup.add(spoke);
            }
            
            wheelGroup.position.set(pos.x, 0.3, pos.z);
            this.wheels.push({
                group: wheelGroup,
                isFront: index < 2,
                steerAngle: 0
            });
            this.group.add(wheelGroup);
        });
    }
    
    createLights() {
        // Headlight meshes
        const lightGeo = new THREE.SphereGeometry(0.15, 16);
        const lightMat = new THREE.MeshStandardMaterial({ 
            color: 0xffffaa, 
            emissive: new THREE.Color(0x442200) 
        });
        
        const leftLight = new THREE.Mesh(lightGeo, lightMat);
        leftLight.position.set(-0.8, 0.5, 2.0);
        this.group.add(leftLight);
        this.headlights.push(leftLight);
        
        const rightLight = new THREE.Mesh(lightGeo, lightMat);
        rightLight.position.set(0.8, 0.5, 2.0);
        this.group.add(rightLight);
        this.headlights.push(rightLight);
        
        // Actual light sources
        const lightLeft = new THREE.PointLight(0xffaa00, 0, 10);
        lightLeft.position.set(-0.8, 0.5, 2.0);
        this.group.add(lightLeft);
        
        const lightRight = new THREE.PointLight(0xffaa00, 0, 10);
        lightRight.position.set(0.8, 0.5, 2.0);
        this.group.add(lightRight);
        
        this.headlightLights = [lightLeft, lightRight];
        
        // Taillights
        const tailMat = new THREE.MeshStandardMaterial({ 
            color: 0xff0000, 
            emissive: new THREE.Color(0x330000) 
        });
        
        const leftTail = new THREE.Mesh(lightGeo, tailMat);
        leftTail.position.set(-0.8, 0.5, -2.0);
        this.group.add(leftTail);
        this.brakelights.push(leftTail);
        
        const rightTail = new THREE.Mesh(lightGeo, tailMat);
        rightTail.position.set(0.8, 0.5, -2.0);
        this.group.add(rightTail);
        this.brakelights.push(rightTail);
    }
    
    createDetails() {
        // Spoiler
        const spoilerGeo = new THREE.BoxGeometry(1.2, 0.1, 0.3);
        const spoilerMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const spoiler = new THREE.Mesh(spoilerGeo, spoilerMat);
        spoiler.position.set(0, 1.2, -1.8);
        spoiler.castShadow = true;
        this.group.add(spoiler);
        
        // Antenna
        const antennaGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5);
        const antennaMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        const antenna = new THREE.Mesh(antennaGeo, antennaMat);
        antenna.position.set(0.5, 1.4, -0.2);
        antenna.castShadow = true;
        this.group.add(antenna);
        
        const antennaBallGeo = new THREE.SphereGeometry(0.07);
        const antennaBallMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
        const antennaBall = new THREE.Mesh(antennaBallGeo, antennaBallMat);
        antennaBall.position.set(0.5, 1.65, -0.2);
        antennaBall.castShadow = true;
        this.group.add(antennaBall);
    }
    
    update(deltaTime, input) {
        if (!input) return;
        
        // Calculate acceleration based on input
        const throttle = input.forward;
        const brake = input.brake;
        const steer = input.right;
        
        // Update velocity based on throttle/brake
        if (throttle !== 0) {
            const force = throttle * this.accelerationForce * deltaTime;
            const speed = this.velocity.length();
            
            // Apply acceleration in direction of car
            const direction = new THREE.Vector3(
                Math.sin(this.rotation),
                0,
                Math.cos(this.rotation)
            );
            
            this.velocity.x += direction.x * force;
            this.velocity.z += direction.z * force;
            
            // Battery consumption
            const consumption = Math.abs(throttle) * this.consumptionRate * deltaTime;
            this.battery = Math.max(0, this.battery - consumption);
        }
        
        // Apply braking
        if (brake > 0) {
            const brakeForce = this.brakeForce * deltaTime;
            if (this.velocity.length() > 0.1) {
                this.velocity.x *= (1 - brakeForce);
                this.velocity.z *= (1 - brakeForce);
            } else {
                this.velocity.set(0, 0, 0);
            }
            this.brakeLightsOn = true;
        } else {
            this.brakeLightsOn = false;
        }
        
        // Apply drag
        this.velocity.x *= this.dragCoefficient;
        this.velocity.z *= this.dragCoefficient;
        
        // Limit speed
        const speed = this.velocity.length();
        const maxSpeed = throttle < 0 ? this.maxReverseSpeed : this.maxSpeed;
        if (speed > maxSpeed) {
            this.velocity.normalize().multiplyScalar(maxSpeed);
        }
        
        // Apply steering (only when moving)
        if (Math.abs(speed) > 0.5) {
            const turnAmount = steer * this.turnSpeed * deltaTime * (speed / this.maxSpeed);
            this.rotation += turnAmount;
            
            // Update front wheel angles for visual effect
            this.wheels.forEach(wheel => {
                if (wheel.isFront) {
                    wheel.steerAngle = steer * 0.5;
                }
            });
        }
        
        // Update position
        this.position.x += this.velocity.x * deltaTime;
        this.position.z += this.velocity.z * deltaTime;
        
        // Update group transforms
        this.group.position.copy(this.position);
        this.group.rotation.y = this.rotation;
        
        // Update wheel rotation
        this.wheelRotation += speed * deltaTime * 2;
        this.wheels.forEach(wheel => {
            wheel.group.rotation.x = this.wheelRotation;
            wheel.group.rotation.y = wheel.steerAngle;
        });
        
        // Recharge battery when stationary
        if (speed < 0.1 && this.battery < this.maxBattery) {
            this.battery = Math.min(this.maxBattery, this.battery + this.rechargeRate * deltaTime);
        }
        
        // Update lights
        this.updateLights();
    }
    
    updateLights() {
        const hour = new Date().getHours();
        const isDark = hour < 6 || hour > 18;
        const lightsActive = this.lightsOn || isDark;
        
        // Headlights
        this.headlights.forEach(light => {
            light.material.emissive.setHex(lightsActive ? 0x442200 : 0x000000);
        });
        
        this.headlightLights.forEach(light => {
            light.intensity = lightsActive ? 1 : 0;
        });
        
        // Brake lights
        this.brakelights.forEach(light => {
            light.material.emissive.setHex(this.brakeLightsOn ? 0xff0000 : 0x330000);
        });
    }
    
    toggleLights() {
        this.lightsOn = !this.lightsOn;
        this.updateLights();
    }
    
    getSpeed() {
        return this.velocity.length() * 3.6; // Convert to km/h
    }
    
    getRPM() {
        return Math.min(100, this.getSpeed() * 5);
    }
    
    getCameraView() {
        const offset = new THREE.Vector3();
        
        switch(this.cameraMode) {
            case 'follow':
                offset.set(-5, 3, 5);
                break;
            case 'first':
                offset.set(0, 1.5, 1);
                break;
            case 'top':
                offset.set(0, 15, 0);
                break;
            case 'cinematic':
                offset.set(-8, 4, 8);
                break;
        }
        
        // Rotate offset based on car rotation
        const rotatedOffset = offset.clone();
        rotatedOffset.x = offset.x * Math.cos(this.rotation) - offset.z * Math.sin(this.rotation);
        rotatedOffset.z = offset.x * Math.sin(this.rotation) + offset.z * Math.cos(this.rotation);
        
        const position = this.position.clone().add(rotatedOffset);
        
        return { position };
    }
    
    cycleCamera() {
        const modes = ['follow', 'first', 'top', 'cinematic'];
        const currentIndex = modes.indexOf(this.cameraMode);
        this.cameraMode = modes[(currentIndex + 1) % modes.length];
    }
    
    navigateTo(target, callback) {
        // Simple A* pathfinding would go here
        // For now, just move directly
        const dx = target.x - this.position.x;
        const dz = target.z - this.position.z;
        const targetRotation = Math.atan2(dx, dz);
        
        // Animate
        const startPos = this.position.clone();
        const startRot = this.rotation;
        const duration = 2000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / duration);
            
            // Easing function
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            this.position.x = startPos.x + dx * easeProgress;
            this.position.z = startPos.z + dz * easeProgress;
            
            // Smooth rotation
            let rotDiff = targetRotation - startRot;
            if (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
            if (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
            this.rotation = startRot + rotDiff * easeProgress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else if (callback) {
                callback();
            }
        };
        
        animate();
    }
    
    stop() {
        this.velocity.set(0, 0, 0);
    }
    
    resetPosition() {
        this.position.set(0, 0.5, 0);
        this.rotation = 0;
        this.velocity.set(0, 0, 0);
        this.battery = this.maxBattery;
    }
}