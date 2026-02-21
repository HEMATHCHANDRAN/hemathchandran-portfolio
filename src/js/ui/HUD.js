export class HUD {
    constructor(vehicle) {
        this.vehicle = vehicle;
        this.element = document.getElementById('hud');
        this.greeting = '';
        
        this.create();
    }

    create() {
        this.element.innerHTML = `
            <div class="hud-item">
                <span class="hud-label">Speed:</span>
                <span class="hud-value" id="speed-value">0 km/h</span>
            </div>
            <div class="hud-item">
                <span class="hud-label">Battery:</span>
                <span class="hud-value" id="battery-value">100%</span>
            </div>
            <div class="hud-item">
                <span class="hud-label">Position:</span>
                <span class="hud-value" id="position-value">0, 0</span>
            </div>
            <div class="hud-item">
                <span class="hud-label">Time:</span>
                <span class="hud-value" id="time-value">12:00</span>
            </div>
            <div class="hud-item">
                <span class="hud-label">Weather:</span>
                <span class="hud-value" id="weather-value">☀️ Clear</span>
            </div>
            <div id="greeting-message" class="hud-item" style="color: #00ff00; margin-top: 10px;"></div>
        `;
    }

    update() {
        if (!this.vehicle.model) return;
        
        // Speed
        const speedKmh = this.vehicle.speed * 3.6;
        document.getElementById('speed-value').textContent = `${Math.round(speedKmh)} km/h`;
        
        // Battery
        const batteryEl = document.getElementById('battery-value');
        batteryEl.textContent = `${Math.round(this.vehicle.battery)}%`;
        
        // Battery warning
        if (this.vehicle.battery < 20) {
            batteryEl.classList.add('battery-low');
        } else {
            batteryEl.classList.remove('battery-low');
        }
        
        // Position
        const pos = this.vehicle.model.position;
        document.getElementById('position-value').textContent = 
            `${Math.round(pos.x)}, ${Math.round(pos.z)}`;
        
        // Time
        const now = new Date();
        document.getElementById('time-value').textContent = 
            `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // Weather (simulated)
        const weatherIcons = ['☀️', '⛅', '☁️', '🌧️', '⛈️'];
        const randomWeather = weatherIcons[Math.floor(Math.random() * weatherIcons.length)];
        document.getElementById('weather-value').textContent = `${randomWeather} Simulated`;
    }

    setGreeting(message) {
        this.greeting = message;
        document.getElementById('greeting-message').textContent = message;
        
        // Fade out after 5 seconds
        setTimeout(() => {
            document.getElementById('greeting-message').textContent = '';
        }, 5000);
    }
}