import * as THREE from 'three';
import { VehiclePhysics } from '../../physics/vehicle.js';

export class Vehicle {
    constructor(scene, physicsWorld, console_log) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.console = console_log;
        
        this.model = null;
        this.wheels = [];
        this.speed = 0;
        this.battery = 100;
        this.maxBattery = 100;
        this.consumptionRate = 0.05;
        this.rechargeRate = 0.2;
        this.isRecharging = false;
        
        // Create physics component
        this.physics = new VehiclePhysics(physicsWorld);
        
        // Create visual model
        this.createModel();
        
        // Add headlights
        this.createHeadlights();
        
        // Add brake lights
        this.createBrakeLights();
    }

    createModel() {
        // Car body
        const bodyGeo = new THREE.BoxGeometry(2, 0.8, 4);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.8, roughness: 0.2 });
        this.model = new THREE.Mesh(bodyGeo, bodyMat);
        this.model.castShadow = true;
        this.model.receiveShadow = true;
        
        // Car cabin
        const cabinGeo = new THREE.BoxGeometry(1.6, 0.6, 2);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.3, roughness: 0.4 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.y = 0.7;
        cabin.position.z = -0.5;
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        this.model.add(cabin);
        
        // Windshield
        const windshieldGeo = new THREE.BoxGeometry(1.4, 0.4, 0.2);
        const windshieldMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 });
        const windshield = new THREE.Mesh(windshieldGeo, windshieldMat);
        windshield.position.y = 1.0;
        windshield.position.z = 0.5;
        windshield.castShadow = true;
        this.model.add(windshield);
        
        // Create wheels
        this.createWheels();
        
        this.scene.add(this.model);
    }

    createWheels() {
        const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 24);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
        const rimMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.3 });
        
        const positions = [
            { x: -1.2, y: 0.3, z: 1.2 }, // Front left
            { x: 1.2, y: 0.3, z: 1.2 },  // Front right
            { x: -1.2, y: 0.3, z: -1.2 }, // Rear left
            { x: 1.2, y: 0.3, z: -1.2 }   // Rear right
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
            const rimGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.31, 8);
            const rim = new THREE.Mesh(rimGeo, rimMat);
            rim.rotation.z = Math.PI / 2;
            rim.castShadow = true;
            rim.receiveShadow = true;
            wheelGroup.add(rim);
            
            wheelGroup.position.set(pos.x, pos.y, pos.z);
            this.model.add(wheelGroup);
            this.wheels.push(wheelGroup);
        });
    }

    createHeadlights() {
        const lightGeo = new THREE.SphereGeometry(0.2, 16);
        const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0x442200 });
        
        // Left headlight
        const leftLight = new THREE.Mesh(lightGeo, lightMat);
        leftLight.position.set(-0.8, 0.4, 2);
        this.model.add(leftLight);
        
        // Right headlight
        const rightLight = new THREE.Mesh(lightGeo, lightMat);
        rightLight.position.set(0.8, 0.4, 2);
        this.model.add(rightLight);
        
        // Add actual lights
        const lightLeft = new THREE.PointLight(0xffaa00, 1, 10);
        lightLeft.position.set(-0.8, 0.4, 2);
        this.model.add(lightLeft);
        
        const lightRight = new THREE.PointLight(0xffaa00, 1, 10);
        lightRight.position.set(0.8, 0.4, 2);
        this.model.add(lightRight);
        
        this.headlights = [lightLeft, lightRight];
    }

    createBrakeLights() {
        const lightGeo = new THREE.SphereGeometry(0.15, 16);
        const lightMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x330000 });
        
        // Left brake light
        const leftBrake = new THREE.Mesh(lightGeo, lightMat);
        leftBrake.position.set(-0.8, 0.4, -2);
        this.model.add(leftBrake);
        
        // Right brake light
        const rightBrake = new THREE.Mesh(lightGeo, lightMat);
        rightBrake.position.set(0.8, 0.4, -2);
        this.model.add(rightBrake);
        
        this.brakeLights = [leftBrake, rightBrake];
    }

    update(deltaTime, input) {
        if (!this.physics.vehicle) return;
        
        // Get input
        const movement = input.getMovement();
        const brake = input.getBrake();
        
        // Calculate forces
        const engineForce = movement.forward * 1500;
        const brakeForce = brake * 100;
        const steering = movement.right * 0.5;
        
        // Update physics
        this.physics.update(engineForce, brakeForce, steering);
        
        // Update model position from physics
        const trans = this.physics.getTransform();
        if (this.model) {
            this.model.position.set(trans.position.x, trans.position.y, trans.position.z);
            this.model.quaternion.set(trans.quaternion.x, trans.quaternion.y, trans.quaternion.z, trans.quaternion.w);
            
            // Rotate wheels based on movement
            const wheelRotationSpeed = this.physics.getSpeed() * deltaTime * 5;
            this.wheels.forEach(wheel => {
                wheel.rotation.x += wheelRotationSpeed;
            });
        }
        
        // Update speed
        this.speed = this.physics.getSpeed();
        
        // Battery consumption
        if (Math.abs(movement.forward) > 0) {
            this.battery -= this.consumptionRate * deltaTime * Math.abs(movement.forward);
            if (this.battery < 0) this.battery = 0;
        }
        
        // Auto-recharge at low speed
        if (this.speed < 0.1 && this.battery < this.maxBattery) {
            this.battery += this.rechargeRate * deltaTime;
            if (this.battery > this.maxBattery) this.battery = this.maxBattery;
        }
        
        // Update lights
        this.updateLights(brake);
    }

    updateLights(brake) {
        // Headlights on at night or when dark
        const hour = new Date().getHours();
        const isDark = hour < 6 || hour > 18;
        
        this.headlights.forEach(light => {
            light.intensity = isDark ? 1 : 0.2;
        });
        
        // Brake lights
        this.brakeLights.forEach((light, index) => {
            light.material.emissive.setHex(brake > 0 ? 0xff0000 : 0x330000);
        });
    }

    recharge(amount) {
        this.battery += amount;
        if (this.battery > this.maxBattery) this.battery = this.maxBattery;
    }

    getPosition() {
        return this.model ? this.model.position : { x: 0, y: 0, z: 0 };
    }
}