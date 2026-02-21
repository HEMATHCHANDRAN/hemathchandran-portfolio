export class WeatherSystem {
    constructor(scene) {
        this.scene = scene;
        this.currentWeather = 'clear';
        this.nextWeather = 'clear';
        this.transitionProgress = 0;
        this.transitionSpeed = 0.01;
        this.intensity = 0;
        
        // Weather particles
        this.particles = null;
        this.particleCount = 0;
        this.particleGeometry = null;
        this.particleMaterial = null;
        
        // Wind
        this.windSpeed = 0;
        this.windDirection = new THREE.Vector3(1, 0, 0);
        
        // Lightning (for storms)
        this.lightningTimer = 0;
        this.lightningFlash = null;
        
        this.init();
    }
    
    init() {
        // Create lightning flash effect
        const flashGeo = new THREE.PlaneGeometry(100, 100);
        const flashMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });
        this.lightningFlash = new THREE.Mesh(flashGeo, flashMat);
        this.lightningFlash.position.set(0, 20, 0);
        this.lightningFlash.rotation.x = Math.PI / 2;
        this.scene.add(this.lightningFlash);
    }
    
    setWeather(weatherType, intensity = 0.5) {
        this.nextWeather = weatherType;
        this.transitionProgress = 0;
        this.intensity = intensity;
        
        // Remove old particles
        if (this.particles) {
            this.scene.remove(this.particles);
            this.particles = null;
        }
        
        // Create new particle system based on weather
        switch(weatherType) {
            case 'rain':
                this.createRain(intensity);
                break;
            case 'snow':
                this.createSnow(intensity);
                break;
            case 'fog':
                this.createFog(intensity);
                break;
            case 'storm':
                this.createRain(intensity * 1.5);
                this.createLightning();
                break;
        }
    }
    
    createRain(intensity) {
        this.particleCount = Math.floor(2000 * intensity);
        this.particleGeometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(this.particleCount * 3);
        const velocities = [];
        
        for (let i = 0; i < this.particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = Math.random() * 50;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
            velocities.push((Math.random() * 0.2) + 0.1);
        }
        
        this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(new Float32Array(velocities), 1));
        
        this.particleMaterial = new THREE.PointsMaterial({
            color: 0xaaaaaa,
            size: 0.1,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
        this.scene.add(this.particles);
    }
    
    createSnow(intensity) {
        this.particleCount = Math.floor(1000 * intensity);
        this.particleGeometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(this.particleCount * 3);
        const velocities = [];
        
        for (let i = 0; i < this.particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = Math.random() * 50;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
            velocities.push((Math.random() * 0.05) + 0.02);
        }
        
        this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(new Float32Array(velocities), 1));
        
        this.particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.2,
            transparent: true,
            opacity: 0.8,
            blending: THREE.NormalBlending
        });
        
        this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
        this.scene.add(this.particles);
    }
    
    createFog(intensity) {
        this.scene.fog = new THREE.FogExp2(0xcccccc, 0.02 * intensity);
    }
    
    createLightning() {
        this.lightningTimer = Math.random() * 10;
    }
    
    update(deltaTime) {
        // Update weather transition
        if (this.currentWeather !== this.nextWeather) {
            this.transitionProgress += this.transitionSpeed * deltaTime * 60;
            if (this.transitionProgress >= 1) {
                this.currentWeather = this.nextWeather;
            }
        }
        
        // Update particles
        if (this.particles && this.particleGeometry) {
            const positions = this.particleGeometry.attributes.position.array;
            const velocities = this.particleGeometry.attributes.velocity?.array || [];
            
            for (let i = 0; i < positions.length; i += 3) {
                // Apply wind
                positions[i] += this.windSpeed * this.windDirection.x * deltaTime * 10;
                positions[i + 2] += this.windSpeed * this.windDirection.z * deltaTime * 10;
                
                // Fall down
                if (velocities.length > 0) {
                    positions[i + 1] -= velocities[Math.floor(i / 3)] * deltaTime * 30;
                } else {
                    positions[i + 1] -= 0.1 * deltaTime * 30;
                }
                
                // Reset if below ground
                if (positions[i + 1] < 0) {
                    positions[i] = (Math.random() - 0.5) * 100;
                    positions[i + 1] = 50;
                    positions[i + 2] = (Math.random() - 0.5) * 100;
                }
            }
            
            this.particleGeometry.attributes.position.needsUpdate = true;
        }
        
        // Update lightning
        if (this.currentWeather === 'storm') {
            this.lightningTimer -= deltaTime;
            if (this.lightningTimer <= 0) {
                this.flashLightning();
                this.lightningTimer = 5 + Math.random() * 10;
            }
        }
    }
    
    flashLightning() {
        if (!this.lightningFlash) return;
        
        // Flash on
        this.lightningFlash.material.opacity = 0.8;
        
        // Flash off after short delay
        setTimeout(() => {
            this.lightningFlash.material.opacity = 0;
        }, 100);
        
        // Multiple flashes
        setTimeout(() => {
            this.lightningFlash.material.opacity = 0.5;
            setTimeout(() => {
                this.lightningFlash.material.opacity = 0;
            }, 50);
        }, 200);
    }
    
    setWind(speed, direction) {
        this.windSpeed = speed;
        if (direction) {
            this.windDirection = direction.clone().normalize();
        }
    }
    
    getWeatherIcon() {
        const icons = {
            clear: '☀️',
            rain: '🌧️',
            snow: '❄️',
            fog: '🌫️',
            storm: '⛈️'
        };
        return icons[this.currentWeather] || '☀️';
    }
    
    getWeatherDescription() {
        const descriptions = {
            clear: 'Clear Skies',
            rain: 'Light Rain',
            snow: 'Snowing',
            fog: 'Foggy',
            storm: 'Thunderstorm'
        };
        return descriptions[this.currentWeather] || 'Unknown';
    }
}