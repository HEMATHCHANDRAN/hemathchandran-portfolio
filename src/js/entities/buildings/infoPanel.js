export class InfoPanel {
    constructor(modal) {
        this.modal = modal;
    }

    show(building) {
        if (!building.info) return;
        
        const info = building.info;
        let html = `<h2>${info.title || 'Information'}</h2>`;
        
        if (info.description) {
            html += `<p><strong>${info.description}</strong></p>`;
        }
        
        if (info.details && info.details.length > 0) {
            html += '<ul>';
            info.details.forEach(detail => {
                html += `<li>${detail}</li>`;
            });
            html += '</ul>';
        }
        
        // Add contact info for personal building
        if (info.title === 'Personal') {
            html += `
                <div class="contact-links">
                    <a href="mailto:hemathchandrangm01@gmail.com" class="contact-link">📧</a>
                    <a href="https://linkedin.com/in/hemathchandran-g-m-962762278" class="contact-link">🔗</a>
                    <a href="https://github.com/HEMATHCHANDRAN" class="contact-link">💻</a>
                </div>
            `;
        }
        
        // Add skills tags for skills building
        if (info.title === 'Technical Skills') {
            html += `
                <div class="skill-tags">
                    <span class="skill-tag">Embedded C</span>
                    <span class="skill-tag">Python</span>
                    <span class="skill-tag">ESP32</span>
                    <span class="skill-tag">STM32</span>
                    <span class="skill-tag">Raspberry Pi</span>
                    <span class="skill-tag">RTOS</span>
                    <span class="skill-tag">Altium Designer</span>
                    <span class="skill-tag">MATLAB</span>
                </div>
            `;
        }
        
        // Add project cards for projects building
        if (info.title === 'Projects') {
            html += `
                <div class="project-card">
                    <h3>Digital-Twin Swarm Robotics</h3>
                    <p>ESP32, ESP32-CAM, MobileNetV3 - Payload integrity and adaptive task coordination</p>
                </div>
                <div class="project-card">
                    <h3>CleanTide</h3>
                    <p>Raspberry Pi 4B, ESP32, MobileNetV3 - Autonomous waste collector (TNSCST Grant)</p>
                </div>
                <div class="project-card">
                    <h3>Wheel-Dynamo Regenerative Charging</h3>
                    <p>BLDC Hub Dynamo, MPPT Buck-Boost, ESP32 - EV battery charging system</p>
                </div>
                <div class="project-card">
                    <h3>Coal Mine Monitoring System</h3>
                    <p>Zigbee, ESP32, DHT11, MQ3, MQ7 - Real-time safety alerts</p>
                </div>
            `;
        }
        
        this.modal.show(html);
    }
}