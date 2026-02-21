export class RadioSystem {
    constructor(audioManager, uiManager) {
        this.audioManager = audioManager;
        this.uiManager = uiManager;
        this.stations = [
            { name: 'Electronic Beats', genre: 'electronic', icon: '🎵' },
            { name: 'Rock Classics', genre: 'rock', icon: '🎸' },
            { name: 'Ambient Waves', genre: 'ambient', icon: '🎹' },
            { name: 'Synth Wave', genre: 'synth', icon: '🎛️' },
            { name: 'Jazz Lounge', genre: 'jazz', icon: '🎷' },
            { name: 'News Channel', genre: 'talk', icon: '📰' }
        ];
        
        this.currentStation = -1; // -1 = off
        this.volume = 0.7;
        this.isPlaying = false;
        this.stationInfo = '';
        
        // Create radio UI
        this.createRadioUI();
    }
    
    createRadioUI() {
        const radioDiv = document.createElement('div');
        radioDiv.id = 'radio-player';
        radioDiv.className = 'radio-player glass';
        radioDiv.innerHTML = `
            <div class="radio-header">
                <span class="radio-icon">📻</span>
                <span class="radio-title">CAR RADIO</span>
                <span class="radio-close">✕</span>
            </div>
            <div class="radio-display" id="radio-display">
                <div class="station-name">FM OFF</div>
                <div class="station-info"></div>
            </div>
            <div class="radio-controls">
                <button class="radio-btn" id="radio-prev">⏮️</button>
                <button class="radio-btn" id="radio-play">⏯️</button>
                <button class="radio-btn" id="radio-next">⏭️</button>
            </div>
            <div class="radio-volume">
                <span>🔊</span>
                <input type="range" id="radio-volume" min="0" max="100" value="70">
            </div>
            <div class="radio-stations" id="radio-stations">
                ${this.stations.map((station, index) => `
                    <div class="station-preset" data-station="${index}">
                        <span class="preset-number">${index + 1}</span>
                        <span class="preset-name">${station.name}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.body.appendChild(radioDiv);
        
        // Add event listeners
        this.setupEventListeners();
        
        // Hide by default
        radioDiv.style.display = 'none';
    }
    
    setupEventListeners() {
        const radioDiv = document.getElementById('radio-player');
        
        document.getElementById('radio-prev')?.addEventListener('click', () => {
            this.prevStation();
        });
        
        document.getElementById('radio-play')?.addEventListener('click', () => {
            this.togglePlay();
        });
        
        document.getElementById('radio-next')?.addEventListener('click', () => {
            this.nextStation();
        });
        
        document.getElementById('radio-volume')?.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });
        
        document.querySelectorAll('.station-preset').forEach(preset => {
            preset.addEventListener('click', () => {
                const station = parseInt(preset.dataset.station);
                this.setStation(station);
            });
        });
        
        document.querySelector('.radio-close')?.addEventListener('click', () => {
            this.hide();
        });
        
        // Keyboard shortcut: R to toggle radio
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyR' && !e.ctrlKey && !e.altKey) {
                this.toggle();
            }
        });
    }
    
    toggle() {
        const radioDiv = document.getElementById('radio-player');
        if (radioDiv.style.display === 'none') {
            this.show();
        } else {
            this.hide();
        }
    }
    
    show() {
        const radioDiv = document.getElementById('radio-player');
        radioDiv.style.display = 'block';
        this.updateDisplay();
    }
    
    hide() {
        const radioDiv = document.getElementById('radio-player');
        radioDiv.style.display = 'none';
    }
    
    setStation(stationIndex) {
        if (stationIndex < 0 || stationIndex >= this.stations.length) return;
        
        this.currentStation = stationIndex;
        this.isPlaying = true;
        
        const station = this.stations[stationIndex];
        this.audioManager.playMusic(stationIndex);
        
        this.uiManager.addConsoleMessage(`📻 Now playing: ${station.name} ${station.icon}`, 'info');
        this.updateDisplay();
    }
    
    nextStation() {
        if (this.currentStation === -1) {
            this.setStation(0);
        } else {
            this.setStation((this.currentStation + 1) % this.stations.length);
        }
    }
    
    prevStation() {
        if (this.currentStation === -1) {
            this.setStation(this.stations.length - 1);
        } else {
            this.setStation((this.currentStation - 1 + this.stations.length) % this.stations.length);
        }
    }
    
    togglePlay() {
        if (this.currentStation === -1) {
            this.setStation(0);
        } else if (this.isPlaying) {
            this.stop();
        } else {
            this.play();
        }
    }
    
    play() {
        this.isPlaying = true;
        if (this.currentStation !== -1) {
            this.audioManager.playMusic(this.currentStation);
        }
        this.updateDisplay();
    }
    
    stop() {
        this.isPlaying = false;
        this.audioManager.stopMusic();
        this.updateDisplay();
    }
    
    turnOff() {
        this.currentStation = -1;
        this.isPlaying = false;
        this.audioManager.stopMusic();
        this.updateDisplay();
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.audioManager.setMusicVolume(this.volume);
        
        const volumeInput = document.getElementById('radio-volume');
        if (volumeInput) {
            volumeInput.value = this.volume * 100;
        }
    }
    
    updateDisplay() {
        const display = document.getElementById('radio-display');
        if (!display) return;
        
        const stationName = display.querySelector('.station-name');
        const stationInfo = display.querySelector('.station-info');
        
        if (this.currentStation === -1 || !this.isPlaying) {
            stationName.textContent = 'FM OFF';
            stationInfo.textContent = '';
        } else {
            const station = this.stations[this.currentStation];
            stationName.textContent = `${station.icon} ${station.name}`;
            stationInfo.textContent = `${station.genre.toUpperCase()} • ${Math.floor(88.1 + this.currentStation * 1.2)} FM`;
        }
        
        // Update play button
        const playBtn = document.getElementById('radio-play');
        if (playBtn) {
            playBtn.textContent = this.isPlaying ? '⏸️' : '⏯️';
        }
        
        // Update station presets
        document.querySelectorAll('.station-preset').forEach((preset, index) => {
            if (index === this.currentStation && this.isPlaying) {
                preset.classList.add('active');
            } else {
                preset.classList.remove('active');
            }
        });
    }
}