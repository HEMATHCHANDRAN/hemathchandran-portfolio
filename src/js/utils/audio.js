export class AudioManager {
    constructor() {
        this.context = null;
        this.sounds = new Map();
        this.muted = false;
        this.masterGain = null;
        this.initialized = false;
        
        // Initialize on user interaction
        this.initOnInteraction();
    }

    initOnInteraction() {
        const initAudio = () => {
            if (!this.initialized) {
                this.init();
                document.removeEventListener('click', initAudio);
                document.removeEventListener('keydown', initAudio);
            }
        };
        
        document.addEventListener('click', initAudio);
        document.addEventListener('keydown', initAudio);
    }

    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            this.initialized = true;
            console.log('Audio context initialized');
        } catch (e) {
            console.error('Web Audio API not supported:', e);
        }
    }

    async loadSound(name, url) {
        if (!this.initialized) return;
        
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            this.sounds.set(name, audioBuffer);
        } catch (e) {
            console.warn(`Failed to load sound ${name}:`, e);
        }
    }

    play(name, volume = 1, loop = false) {
        if (!this.initialized || this.muted) return null;
        
        const buffer = this.sounds.get(name);
        if (!buffer) return null;
        
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source.loop = loop;
        
        const gainNode = this.context.createGain();
        gainNode.gain.value = volume;
        
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        source.start(0);
        
        return source;
    }

    playEngineSound(speed) {
        if (!this.initialized || this.muted) return;
        
        // Stop previous engine sound
        if (this.engineSource) {
            try {
                this.engineSource.stop();
            } catch (e) {}
        }
        
        // Create engine sound based on speed
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.value = 100 + speed * 50;
        
        gainNode.gain.value = 0.1 * Math.min(1, speed / 10);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start();
        this.engineSource = oscillator;
    }

    playHorn() {
        if (!this.initialized || this.muted) return;
        
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.value = 440;
        
        gainNode.gain.value = 0.3;
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start();
        oscillator.stop(this.context.currentTime + 0.5);
    }

    toggleMute() {
        this.muted = !this.muted;
        
        if (this.masterGain) {
            this.masterGain.gain.value = this.muted ? 0 : 1;
        }
        
        return this.muted;
    }

    setVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }
}