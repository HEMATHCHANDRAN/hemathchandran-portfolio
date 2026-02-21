export class CollisionManager {
    constructor(physicsWorld) {
        this.physicsWorld = physicsWorld;
        this.collisionCallbacks = new Map();
    }

    checkCollision(bodyA, bodyB) {
        if (!this.physicsWorld.ammoReady) return false;
        
        const numManifolds = this.physicsWorld.dispatcher.getNumManifolds();
        
        for (let i = 0; i < numManifolds; i++) {
            const manifold = this.physicsWorld.dispatcher.getManifoldByIndexInternal(i);
            const body0 = manifold.getBody0();
            const body1 = manifold.getBody1();
            
            if ((body0 === bodyA && body1 === bodyB) || (body0 === bodyB && body1 === bodyA)) {
                return true;
            }
        }
        
        return false;
    }

    registerCollisionCallback(bodyA, bodyB, callback) {
        const key = this.getBodyKey(bodyA, bodyB);
        this.collisionCallbacks.set(key, callback);
    }

    getBodyKey(bodyA, bodyB) {
        return `${bodyA}_${bodyB}`;
    }

    update() {
        if (!this.physicsWorld.ammoReady) return;
        
        const numManifolds = this.physicsWorld.dispatcher.getNumManifolds();
        
        for (let i = 0; i < numManifolds; i++) {
            const manifold = this.physicsWorld.dispatcher.getManifoldByIndexInternal(i);
            const body0 = manifold.getBody0();
            const body1 = manifold.getBody1();
            
            const numContacts = manifold.getNumContacts();
            
            if (numContacts > 0) {
                const key = this.getBodyKey(body0, body1);
                const callback = this.collisionCallbacks.get(key);
                
                if (callback) {
                    // Get contact point
                    const contactPoint = manifold.getContactPoint(0);
                    const position = contactPoint.get_m_positionWorldOnA();
                    
                    callback({
                        bodyA: body0,
                        bodyB: body1,
                        position: { x: position.x(), y: position.y(), z: position.z() },
                        normal: { x: contactPoint.get_m_normalWorldOnB().x(), y: contactPoint.get_m_normalWorldOnB().y(), z: contactPoint.get_m_normalWorldOnB().z() }
                    });
                }
            }
        }
    }
}