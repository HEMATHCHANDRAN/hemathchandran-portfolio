import * as THREE from 'three';

export class VehiclePhysics {
    constructor(physicsWorld, chassisWidth = 2, chassisHeight = 0.8, chassisLength = 4, mass = 800) {
        this.physicsWorld = physicsWorld;
        this.chassisWidth = chassisWidth;
        this.chassisHeight = chassisHeight;
        this.chassisLength = chassisLength;
        this.mass = mass;
        
        this.vehicle = null;
        this.chassisBody = null;
        this.wheels = [];
        this.engineForce = 0;
        this.brakeForce = 0;
        this.steering = 0;
        
        // Fallback position for when physics isn't available
        this.position = { x: 0, y: 2, z: 0 };
        this.rotation = 0;
        this.velocity = { x: 0, z: 0 };
        
        this.createVehicle();
    }

    createVehicle() {
        if (!this.physicsWorld.ammoReady || !this.physicsWorld.AmmoLib) {
            console.log('Using simplified vehicle physics');
            return;
        }
        
        try {
            const AmmoLib = this.physicsWorld.AmmoLib;
            
            // Create chassis shape
            const chassisShape = this.physicsWorld.createBoxShape(this.chassisWidth, this.chassisHeight, this.chassisLength);
            
            if (!chassisShape) return;
            
            // Create chassis body
            this.chassisBody = this.physicsWorld.createRigidBody(
                chassisShape,
                this.mass,
                { x: 0, y: 2, z: 0 },
                { x: 0, y: 0, z: 0, w: 1 }
            );
            
            if (!this.chassisBody) return;
            
            // Set friction and damping
            this.chassisBody.setFriction(1000);
            this.chassisBody.setRollingFriction(10);
            this.chassisBody.setDamping(0.2, 0.2);
            
            this.physicsWorld.addBody(this.chassisBody);
            
            // Create vehicle
            const tuning = new AmmoLib.btVehicleTuning();
            const rayCaster = new AmmoLib.btDefaultVehicleRaycaster(this.physicsWorld.physicsWorld);
            this.vehicle = new AmmoLib.btRaycastVehicle(tuning, this.chassisBody, rayCaster);
            this.vehicle.setCoordinateSystem(0, 1, 2);
            
            // Add wheels
            this.addWheels();
            
            this.physicsWorld.physicsWorld.addAction(this.vehicle);
        } catch (e) {
            console.warn('Failed to create physics vehicle:', e);
        }
    }

    addWheels() {
        if (!this.physicsWorld.ammoReady || !this.physicsWorld.AmmoLib || !this.vehicle) return;
        
        try {
            const AmmoLib = this.physicsWorld.AmmoLib;
            
            const wheelDirection = new AmmoLib.btVector3(0, -1, 0);
            const wheelAxle = new AmmoLib.btVector3(-1, 0, 0);
            const suspensionRestLength = 0.6;
            const wheelRadius = 0.5;
            const wheelWidth = 0.3;
            const suspensionStiffness = 20;
            const dampingRelaxation = 2.3;
            const dampingCompression = 4.4;
            const frictionSlip = 10;
            const rollInfluence = 0.1;
            
            // Wheel positions relative to chassis center
            const wheelPositions = [
                { x: -this.chassisWidth * 0.6, y: -this.chassisHeight * 0.3, z: this.chassisLength * 0.4 }, // Front left
                { x: this.chassisWidth * 0.6, y: -this.chassisHeight * 0.3, z: this.chassisLength * 0.4 },  // Front right
                { x: -this.chassisWidth * 0.6, y: -this.chassisHeight * 0.3, z: -this.chassisLength * 0.4 }, // Rear left
                { x: this.chassisWidth * 0.6, y: -this.chassisHeight * 0.3, z: -this.chassisLength * 0.4 }   // Rear right
            ];
            
            wheelPositions.forEach((pos, index) => {
                const wheelInfo = this.vehicle.addWheel(
                    new AmmoLib.btVector3(pos.x, pos.y, pos.z),
                    wheelDirection,
                    wheelAxle,
                    suspensionRestLength,
                    wheelRadius,
                    new AmmoLib.btVehicleTuning(),
                    index < 2 // front wheels steer
                );
                
                wheelInfo.set_m_suspensionStiffness(suspensionStiffness);
                wheelInfo.set_m_wheelsDampingRelaxation(dampingRelaxation);
                wheelInfo.set_m_wheelsDampingCompression(dampingCompression);
                wheelInfo.set_m_frictionSlip(frictionSlip);
                wheelInfo.set_m_rollInfluence(rollInfluence);
            });
        } catch (e) {
            console.warn('Failed to add wheels:', e);
        }
    }

    update(engineForce, brakeForce, steering) {
        if (this.vehicle) {
            try {
                // Apply forces to physics vehicle
                this.vehicle.applyEngineForce(engineForce, 2); // rear left
                this.vehicle.applyEngineForce(engineForce, 3); // rear right
                this.vehicle.setBrake(brakeForce, 2);
                this.vehicle.setBrake(brakeForce, 3);
                this.vehicle.setSteeringValue(steering, 0); // front left
                this.vehicle.setSteeringValue(steering, 1); // front right
            } catch (e) {
                // Fallback to simple physics
                this.updateSimplePhysics(engineForce, brakeForce, steering);
            }
        } else {
            // Simple physics for when Ammo.js is not available
            this.updateSimplePhysics(engineForce, brakeForce, steering);
        }
    }

    updateSimplePhysics(engineForce, brakeForce, steering) {
        // Simple car physics for fallback
        const maxSpeed = 10;
        const acceleration = 5;
        const turnSpeed = 2;
        
        // Apply engine force
        if (Math.abs(engineForce) > 0) {
            const direction = engineForce > 0 ? 1 : -1;
            this.velocity.x += Math.cos(this.rotation) * direction * acceleration * 0.01;
            this.velocity.z += Math.sin(this.rotation) * direction * acceleration * 0.01;
        }
        
        // Apply braking
        if (brakeForce > 0) {
            this.velocity.x *= 0.95;
            this.velocity.z *= 0.95;
        }
        
        // Limit speed
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        if (speed > maxSpeed) {
            this.velocity.x = (this.velocity.x / speed) * maxSpeed;
            this.velocity.z = (this.velocity.z / speed) * maxSpeed;
        }
        
        // Apply steering
        if (Math.abs(steering) > 0 && speed > 0.1) {
            this.rotation += steering * turnSpeed * 0.01;
        }
        
        // Update position
        this.position.x += this.velocity.x;
        this.position.z += this.velocity.z;
    }

    getTransform() {
        if (this.chassisBody && this.physicsWorld.ammoReady) {
            try {
                const transform = this.chassisBody.getWorldTransform();
                const origin = transform.getOrigin();
                const rotation = transform.getRotation();
                
                return {
                    position: { x: origin.x(), y: origin.y(), z: origin.z() },
                    quaternion: { x: rotation.x(), y: rotation.y(), z: rotation.z(), w: rotation.w() }
                };
            } catch (e) {
                // Return fallback position
                return this.getFallbackTransform();
            }
        } else {
            // Return fallback position
            return this.getFallbackTransform();
        }
    }

    getFallbackTransform() {
        return {
            position: this.position,
            quaternion: { 
                x: 0, 
                y: Math.sin(this.rotation / 2), 
                z: 0, 
                w: Math.cos(this.rotation / 2) 
            }
        };
    }

    getSpeed() {
        if (this.chassisBody && this.physicsWorld.ammoReady) {
            try {
                const velocity = this.chassisBody.getLinearVelocity();
                return Math.sqrt(
                    velocity.x() * velocity.x() +
                    velocity.y() * velocity.y() +
                    velocity.z() * velocity.z()
                );
            } catch (e) {
                // Return simple speed
                return Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
            }
        } else {
            // Return simple speed
            return Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        }
    }

    applyForce(force, position) {
        if (!this.chassisBody || !this.physicsWorld.ammoReady) return;
        
        try {
            const AmmoLib = this.physicsWorld.AmmoLib;
            const forceVec = new AmmoLib.btVector3(force.x, force.y, force.z);
            const posVec = new AmmoLib.btVector3(position.x, position.y, position.z);
            
            this.chassisBody.applyForce(forceVec, posVec);
        } catch (e) {
            // Ignore force application errors
        }
    }

    setPosition(x, y, z) {
        this.position = { x, y, z };
        
        if (!this.chassisBody || !this.physicsWorld.ammoReady) return;
        
        try {
            const transform = this.chassisBody.getWorldTransform();
            transform.setOrigin(new this.physicsWorld.AmmoLib.btVector3(x, y, z));
            this.chassisBody.setWorldTransform(transform);
        } catch (e) {
            // Ignore position setting errors
        }
    }

    setRotation(x, y, z, w) {
        if (!this.chassisBody || !this.physicsWorld.ammoReady) return;
        
        try {
            const transform = this.chassisBody.getWorldTransform();
            transform.setRotation(new this.physicsWorld.AmmoLib.btQuaternion(x, y, z, w));
            this.chassisBody.setWorldTransform(transform);
        } catch (e) {
            // Ignore rotation setting errors
        }
    }
}