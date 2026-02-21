import * as THREE from 'three';

// Dynamic import for Ammo.js (fixes the import issue)
let Ammo = null;

export class PhysicsWorld {
    constructor() {
        this.ammoReady = false;
        this.physicsWorld = null;
        this.bodies = [];
        this.collisionConfiguration = null;
        this.dispatcher = null;
        this.broadphase = null;
        this.solver = null;
        
        this.initAmmo();
    }

    async initAmmo() {
        try {
            // Dynamically import Ammo
            const AmmoModule = await import('ammojs');
            Ammo = AmmoModule.default || AmmoModule;
            
            // Initialize Ammo if needed
            if (typeof Ammo === 'function') {
                await new Promise((resolve) => {
                    Ammo().then((lib) => {
                        Ammo = lib;
                        resolve();
                    });
                });
            }
            
            // Create physics world
            this.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
            this.dispatcher = new Ammo.btCollisionDispatcher(this.collisionConfiguration);
            this.broadphase = new Ammo.btDbvtBroadphase();
            this.solver = new Ammo.btSequentialImpulseConstraintSolver();
            
            this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(
                this.dispatcher,
                this.broadphase,
                this.solver,
                this.collisionConfiguration
            );
            
            this.physicsWorld.setGravity(new Ammo.btVector3(0, -9.81, 0));
            this.ammoReady = true;
            
            console.log('Physics world initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Ammo.js:', error);
            // Fallback to simple physics if Ammo fails
            this.initFallbackPhysics();
        }
    }

    initFallbackPhysics() {
        console.log('Using fallback physics (no Ammo.js)');
        this.ammoReady = true; // Set to true to allow the app to continue
        // Simple physics simulation will be handled in vehicle.js
    }

    addBody(body) {
        if (!this.ammoReady || !this.physicsWorld || !body) return;
        try {
            this.physicsWorld.addRigidBody(body);
            this.bodies.push(body);
        } catch (e) {
            console.warn('Failed to add body to physics world:', e);
        }
    }

    removeBody(body) {
        if (!this.ammoReady || !this.physicsWorld || !body) return;
        try {
            this.physicsWorld.removeRigidBody(body);
            const index = this.bodies.indexOf(body);
            if (index > -1) this.bodies.splice(index, 1);
        } catch (e) {
            console.warn('Failed to remove body from physics world:', e);
        }
    }

    step(deltaTime) {
        if (!this.ammoReady || !this.physicsWorld) return;
        
        try {
            // Fixed time step
            const fixedTimeStep = 1 / 60;
            this.physicsWorld.stepSimulation(deltaTime, 10, fixedTimeStep);
        } catch (e) {
            // Silently fail - physics might not be critical
        }
    }

    createRigidBody(shape, mass = 0, position = { x: 0, y: 0, z: 0 }, quaternion = { x: 0, y: 0, z: 0, w: 1 }) {
        if (!this.ammoReady || !Ammo) return null;
        
        try {
            const transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
            transform.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
            
            const motionState = new Ammo.btDefaultMotionState(transform);
            
            const localInertia = new Ammo.btVector3(0, 0, 0);
            if (mass > 0) {
                shape.calculateLocalInertia(mass, localInertia);
            }
            
            const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
            const body = new Ammo.btRigidBody(rbInfo);
            
            return body;
        } catch (e) {
            console.warn('Failed to create rigid body:', e);
            return null;
        }
    }

    createBoxShape(width, height, depth) {
        if (!this.ammoReady || !Ammo) return null;
        return new Ammo.btBoxShape(new Ammo.btVector3(width * 0.5, height * 0.5, depth * 0.5));
    }

    createSphereShape(radius) {
        if (!this.ammoReady || !Ammo) return null;
        return new Ammo.btSphereShape(radius);
    }

    createCylinderShape(radius, height) {
        if (!this.ammoReady || !Ammo) return null;
        return new Ammo.btCylinderShape(new Ammo.btVector3(radius, height * 0.5, radius));
    }

    cleanup() {
        if (!this.ammoReady || !this.physicsWorld) return;
        
        // Clean up physics bodies
        this.bodies.forEach(body => {
            try {
                this.physicsWorld.removeRigidBody(body);
            } catch (e) {}
        });
        this.bodies = [];
    }
}