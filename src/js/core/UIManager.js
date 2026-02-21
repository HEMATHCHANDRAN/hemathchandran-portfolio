export class UIManager {
    constructor() {
        this.elements = this.cacheElements();
        this.messages = [];
        this.maxMessages = 20;
        this.modals = {};
        
        this.setupEventListeners();
    }
    
    cacheElements() {
        return {
            terminal: document.getElementById('terminal-content'),
            questList: document.getElementById('quest-list'),
            badgeContainer: document.getElementById('badge-container'),
            infoModal: document.getElementById('info-modal'),
            infoContent: document.getElementById('info-content'),
            mapModal: document.getElementById('map-modal'),
            helpModal: document.getElementById('help-modal'),
            voiceModal: document.getElementById('voice-modal'),
            voiceText: document.getElementById('voice-text'),
            speedValue: document.getElementById('speed-value'),
            batteryValue: document.getElementById('battery-value'),
            coordinates: document.getElementById('coordinates'),
            timeValue: document.getElementById('time-value'),
            compassNeedle: document.getElementById('compass-needle'),
            weatherValue: document.getElementById('weather-value'),
            questProgress: document.getElementById('quest-progress')
        };
    }
    
    setupEventListeners() {
        // Close buttons
        document.getElementById('btn-close-info')?.addEventListener('click', () => {
            this.hideModal('info');
        });
        
        document.getElementById('btn-close-map')?.addEventListener('click', () => {
            this.hideModal('map');
        });
        
        document.getElementById('btn-close-help')?.addEventListener('click', () => {
            this.hideModal('help');
        });
        
        // Click outside to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });
    }
    
    addConsoleMessage(message, type = 'info') {
        if (!this.elements.terminal) return;
        
        const line = document.createElement('div');
        line.className = `terminal-line ${type}`;
        
        const time = new Date().toLocaleTimeString();
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '➤';
        
        line.innerHTML = `<span class="time">[${time}]</span> <span class="icon">${icon}</span> ${message}`;
        
        this.elements.terminal.appendChild(line);
        this.elements.terminal.scrollTop = this.elements.terminal.scrollHeight;
        
        this.messages.push({ time, message, type });
        
        // Keep only last N messages
        while (this.elements.terminal.children.length > this.maxMessages) {
            this.elements.terminal.removeChild(this.elements.terminal.firstChild);
        }
    }
    
    clearConsole() {
        if (this.elements.terminal) {
            this.elements.terminal.innerHTML = '';
            this.messages = [];
            this.addConsoleMessage('Console cleared', 'system');
        }
    }
    
    updateHUD(speed, battery, position, time, rotation, weather) {
        if (this.elements.speedValue) {
            this.elements.speedValue.textContent = Math.round(speed);
        }
        
        if (this.elements.batteryValue) {
            this.elements.batteryValue.textContent = Math.round(battery);
            
            // Battery warning
            if (battery < 20) {
                this.elements.batteryValue.classList.add('battery-low');
            } else {
                this.elements.batteryValue.classList.remove('battery-low');
            }
        }
        
        if (this.elements.coordinates) {
            this.elements.coordinates.textContent = 
                `${Math.round(position.x)}, ${Math.round(position.z)}`;
        }
        
        if (this.elements.timeValue) {
            this.elements.timeValue.textContent = time;
        }
        
        if (this.elements.compassNeedle) {
            this.elements.compassNeedle.style.transform = `rotate(${rotation}rad)`;
        }
        
        if (this.elements.weatherValue) {
            const weatherIcons = { clear: '☀️', rain: '🌧️', snow: '❄️', fog: '🌫️' };
            this.elements.weatherValue.textContent = `${weatherIcons[weather] || '☀️'} ${weather.toUpperCase()}`;
        }
    }
    
    updateQuests(quests) {
        if (!this.elements.questList) return;
        
        this.elements.questList.innerHTML = '';
        
        const completed = quests.filter(q => q.completed).length;
        if (this.elements.questProgress) {
            this.elements.questProgress.textContent = `${completed}/${quests.length}`;
        }
        
        quests.forEach(quest => {
            const item = document.createElement('div');
            item.className = `quest-item ${quest.completed ? 'completed' : 'incomplete'}`;
            item.dataset.quest = quest.id;
            
            item.innerHTML = `
                <span class="quest-icon">${quest.completed ? '✅' : '⭕'}</span>
                <span class="quest-name">${quest.name}</span>
                ${quest.completed ? '<span class="quest-check">✓</span>' : ''}
            `;
            
            this.elements.questList.appendChild(item);
        });
    }
    
    updateAchievements(achievements) {
        if (!this.elements.badgeContainer) return;
        
        const badges = this.elements.badgeContainer.children;
        achievements.forEach(achievement => {
            for (let badge of badges) {
                if (badge.dataset.badge === achievement.id) {
                    if (achievement.unlocked) {
                        badge.classList.remove('locked');
                        badge.classList.add('unlocked');
                        badge.title = achievement.name;
                    } else {
                        badge.classList.add('locked');
                        badge.classList.remove('unlocked');
                        badge.title = 'Locked';
                    }
                }
            }
        });
    }
    
    showBuildingInfo(building) {
        if (!this.elements.infoContent) return;
        
        const info = building.getInfo();
        let html = `<h2>${info.icon} ${info.title}</h2>`;
        
        if (Array.isArray(info.content)) {
            html += '<ul>';
            info.content.forEach(item => {
                if (typeof item === 'string') {
                    html += `<li>${item}</li>`;
                } else {
                    html += `<li><strong>${item.label}:</strong> ${item.value}</li>`;
                }
            });
            html += '</ul>';
        } else {
            html += `<p>${info.content}</p>`;
        }
        
        if (info.details) {
            html += '<div class="details-section">';
            info.details.forEach(detail => {
                if (typeof detail === 'string') {
                    html += `<p>${detail}</p>`;
                } else {
                    html += `<h3>${detail.title}</h3><ul>`;
                    detail.items.forEach(item => html += `<li>${item}</li>`);
                    html += '</ul>';
                }
            });
            html += '</div>';
        }
        
        this.elements.infoContent.innerHTML = html;
        this.showModal('info');
    }
    
    showMap(carPosition, buildings, width = 400, height = 300) {
        const canvas = document.getElementById('minimap-canvas');
        if (!canvas) return;
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Clear
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        
        const gridSize = 40;
        for (let x = 0; x <= width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.strokeStyle = '#333';
            ctx.stroke();
        }
        
        for (let y = 0; y <= height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Draw buildings
        const mapWidth = 40;
        const scale = width / mapWidth;
        const offsetX = width / 2;
        const offsetY = height / 2;
        
        buildings.forEach(building => {
            const x = offsetX + building.position.x * scale;
            const z = offsetY + building.position.z * scale;
            
            if (x >= 0 && x <= width && z >= 0 && z <= height) {
                ctx.fillStyle = building.getColorHex();
                ctx.fillRect(x - 8, z - 8, 16, 16);
                
                // Label
                ctx.fillStyle = '#fff';
                ctx.font = '10px Arial';
                ctx.fillText(building.type, x - 12, z - 12);
            }
        });
        
        // Draw car
        const carX = offsetX + carPosition.x * scale;
        const carZ = offsetY + carPosition.z * scale;
        
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(carX, carZ, 5, 0, Math.PI * 2);
        ctx.fill();
        
        this.showModal('map');
    }
    
    showQuests(quests) {
        if (!this.elements.infoContent) return;
        
        let html = '<h2>🎯 Active Quests</h2>';
        
        quests.forEach(quest => {
            const status = quest.completed ? '✅' : '⭕';
            html += `
                <div class="quest-detail ${quest.completed ? 'completed' : ''}">
                    <h3>${status} ${quest.name}</h3>
                    <p>${quest.description}</p>
                    <p class="reward">Reward: ${quest.reward}</p>
                </div>
            `;
        });
        
        this.elements.infoContent.innerHTML = html;
        this.showModal('info');
    }
    
    showAchievements(achievements) {
        if (!this.elements.infoContent) return;
        
        let html = '<h2>🏆 Achievements</h2><div class="achievements-grid">';
        
        achievements.forEach(ach => {
            const status = ach.unlocked ? 'unlocked' : 'locked';
            html += `
                <div class="achievement-card ${status}">
                    <div class="achievement-icon">${ach.icon}</div>
                    <div class="achievement-name">${ach.name}</div>
                    <div class="achievement-desc">${ach.description}</div>
                </div>
            `;
        });
        
        html += '</div>';
        
        this.elements.infoContent.innerHTML = html;
        this.showModal('info');
    }
    
    showHelp() {
        this.showModal('help');
    }
    
    showVoiceModal(text = 'Listening...') {
        if (this.elements.voiceText) {
            this.elements.voiceText.textContent = text;
        }
        this.showModal('voice');
    }
    
    hideVoiceModal() {
        this.hideModal('voice');
    }
    
    showModal(name) {
        const modal = document.getElementById(`${name}-modal`);
        if (modal) {
            modal.classList.add('active');
        }
    }
    
    hideModal(name) {
        const modal = document.getElementById(`${name}-modal`);
        if (modal) {
            modal.classList.remove('active');
        }
    }
}