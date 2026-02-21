export class ClockManager {
    constructor() {
        this.clock = new THREE.Clock();
        this.time = 12; // Start at noon (0-24 hours)
        this.dayLength = 120; // seconds for full day cycle
        this.weather = 'clear'; // 'clear', 'rain', 'snow', 'fog'
        this.weatherIntensity = 0;
        this.temperature = 25; // celsius
        this.windSpeed = 0;
    }

    update() {
        const delta = this.clock.getDelta();
        
        // Update time of day
        this.time += delta / this.dayLength * 24;
        if (this.time >= 24) this.time -= 24;
        
        // Random weather changes
        if (Math.random() < 0.001) { // 0.1% chance per frame
            this.changeWeather();
        }
        
        return delta;
    }

    changeWeather() {
        const weathers = ['clear', 'cloudy', 'rain', 'fog'];
        const newWeather = weathers[Math.floor(Math.random() * weathers.length)];
        this.weather = newWeather;
        this.weatherIntensity = 0.5 + Math.random() * 0.5;
        
        // Update temperature based on weather
        if (newWeather === 'rain') this.temperature -= 5;
        else if (newWeather === 'clear') this.temperature += 2;
        
        this.temperature = Math.max(15, Math.min(35, this.temperature));
    }

    getTimeString() {
        const hours = Math.floor(this.time);
        const minutes = Math.floor((this.time - hours) * 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    getWeatherIcon() {
        const icons = {
            clear: '☀️',
            cloudy: '☁️',
            rain: '🌧️',
            snow: '❄️',
            fog: '🌫️'
        };
        return icons[this.weather] || '☀️';
    }
}