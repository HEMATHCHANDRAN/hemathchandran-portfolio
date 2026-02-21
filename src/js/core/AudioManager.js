export class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.music = null;
        this.muted = false;
        this.masterVolume = 0.7;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.7;
        this.currentStation = -1;
        this.isAudioReady = false;
        this.audioContext = null;
        this.engineOscillator = null;
        this.engineGain = null;
    }
    
    async init() {
        console.log('Initializing audio manager...');
        
        // Don't block loading - resolve immediately
        // We'll initialize audio on first user interaction
        setTimeout(() => {
            this.setupAudioOnInteraction();
        }, 100);
        
        return Promise.resolve();
    }
    
    setupAudioOnInteraction() {
        const setup = () => {
            try {
                // Create audio context only after user interaction
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.createEngineSound();
                this.isAudioReady = true;
                console.log('Audio initialized successfully');
                
                // Remove listeners after first interaction
                document.removeEventListener('click', setup);
                document.removeEventListener('keydown', setup);
            } catch (e) {
                console.warn('Web Audio API not supported:', e);
            }
        };
        
        document.addEventListener('click', setup);
        document.addEventListener('keydown', setup);
    }
    
    createEngineSound() {
        if (!this.audioContext) return;
        
        try {
            this.engineOscillator = this.audioContext.createOscillator();
            this.engineGain = this.audioContext.createGain();
            
            this.engineOscillator.type = 'sawtooth';
            this.engineOscillator.frequency.value = 100;
            this.engineGain.gain.value = 0;
            
            this.engineOscillator.connect(this.engineGain);
            this.engineGain.connect(this.audioContext.destination);
            
            this.engineOscillator.start();
        } catch (e) {
            console.warn('Failed to create engine sound:', e);
        }
    }
    
    updateEngineSound(speed, rpm) {
        if (!this.isAudioReady || this.muted || !this.engineOscillator || !this.audioContext) return;
        
        try {
            const baseFreq = 80;
            const maxFreq = 200;
            const freq = baseFreq + (speed / 100) * (maxFreq - baseFreq);
            
            this.engineOscillator.frequency.setTargetAtTime(freq, this.audioContext.currentTime, 0.1);
            
            const volume = Math.min(0.2, (Math.abs(speed) / 100) * 0.2);
            this.engineGain.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.1);
        } catch (e) {
            // Silently fail - audio is non-critical
        }
    }
    
    playHorn() {
        if (!this.isAudioReady || this.muted || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'square';
            oscillator.frequency.value = 440;
            
            gainNode.gain.value = 0.2;
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.5);
        } catch (e) {
            console.warn('Failed to play horn:', e);
        }
    }
    
    playAchievement() {
        if (!this.isAudioReady || this.muted || !this.audioContext) return;
        
        try {
            const now = this.audioContext.currentTime;
            const freqs = [523.25, 659.25, 783.99, 1046.50];
            
            freqs.forEach((freq, i) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.type = 'sine';
                oscillator.frequency.value = freq;
                
                gainNode.gain.value = 0.1;
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2 + i * 0.1);
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.start(now + i * 0.1);
                oscillator.stop(now + 0.3 + i * 0.1);
            });
        } catch (e) {
            // Silently fail
        }
    }
    
    playMusic(station) {
        this.currentStation = station;
        // In a real implementation, you'd load and play actual music
        console.log(`Playing station ${station}`);
    }
    
    stopMusic() {
        this.currentStation = -1;
    }
    
    toggleMute() {
        this.muted = !this.muted;
        
        if (this.engineGain) {
            this.engineGain.gain.value = this.muted ? 0 : 0.1;
        }
        
        return this.muted;
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
    }
}