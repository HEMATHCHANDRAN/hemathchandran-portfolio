import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.emitters = new Map();
    }
    
    createDust(position, count = 10) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.5 + Math.random() * 1;
            
            positions[i * 3] = position.x + Math.cos(angle) * radius;
            positions[i * 3 + 1] = position.y + 0.2;
            positions[i * 3 + 2] = position.z + Math.sin(angle) * radius;
            
            const gray = 0.5 + Math.random() * 0.5;
            colors[i * 3] = gray;
            colors[i * 3 + 1] = gray;
            colors[i * 3 + 2] = gray;
            
            sizes[i] = 0.1 + Math.random() * 0.2;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.NormalBlending
        });
        
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        
        // Animate and remove
        let lifetime = 1;
        const speed = 0.1;
        
        const animate = () => {
            lifetime -= 0.02;
            if (lifetime <= 0) {
                this.scene.remove(particles);
                return;
            }
            
            // Move particles up and fade
            const positions = particles.geometry.attributes.position.array;
            for (let i = 1; i < positions.length; i += 3) {
                positions[i] += speed * lifetime;
            }
            particles.geometry.attributes.position.needsUpdate = true;
            particles.material.opacity = lifetime;
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    createSpark(position, color = 0xffaa00) {
        const count = 5;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 1;
            
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: color,
            size: 0.1,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        
        // Animate
        let lifetime = 0.5;
        const velocities = [];
        for (let i = 0; i < count; i++) {
            velocities.push({
                x: (Math.random() - 0.5) * 2,
                y: Math.random() * 2,
                z: (Math.random() - 0.5) * 2
            });
        }
        
        const animate = () => {
            lifetime -= 0.02;
            if (lifetime <= 0) {
                this.scene.remove(particles);
                return;
            }
            
            const positions = particles.geometry.attributes.position.array;
            for (let i = 0; i < count; i++) {
                positions[i * 3] += velocities[i].x * lifetime * 0.1;
                positions[i * 3 + 1] += velocities[i].y * lifetime * 0.1;
                positions[i * 3 + 2] += velocities[i].z * lifetime * 0.1;
            }
            
            particles.geometry.attributes.position.needsUpdate = true;
            particles.material.opacity = lifetime * 2;
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    createTrail(position, color = 0xff3333) {
        const trail = [];
        const maxLength = 10;
        
        const addPoint = () => {
            trail.push(position.clone());
            if (trail.length > maxLength) {
                trail.shift();
            }
            
            // Create visual trail
            const points = trail.map(p => [p.x, p.y, p.z]).flat();
            // Would need to create line geometry here
        };
        
        return { addPoint };
    }
    
    createExplosion(position, color = 0xff6600) {
        const count = 20;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;
            
            const r = 1;
            const g = 0.5 + Math.random() * 0.5;
            const b = 0;
            
            colors[i * 3] = r;
            colors[i * 3 + 1] = g;
            colors[i * 3 + 2] = b;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        
        // Animate
        let lifetime = 1;
        const velocities = [];
        for (let i = 0; i < count; i++) {
            velocities.push({
                x: (Math.random() - 0.5) * 5,
                y: Math.random() * 5,
                z: (Math.random() - 0.5) * 5
            });
        }
        
        const animate = () => {
            lifetime -= 0.02;
            if (lifetime <= 0) {
                this.scene.remove(particles);
                return;
            }
            
            const positions = particles.geometry.attributes.position.array;
            for (let i = 0; i < count; i++) {
                positions[i * 3] += velocities[i].x * lifetime * 0.1;
                positions[i * 3 + 1] += velocities[i].y * lifetime * 0.1;
                positions[i * 3 + 2] += velocities[i].z * lifetime * 0.1;
            }
            
            particles.geometry.attributes.position.needsUpdate = true;
            particles.material.opacity = lifetime;
            particles.material.size = 0.2 * (1 + (1 - lifetime) * 2);
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
}