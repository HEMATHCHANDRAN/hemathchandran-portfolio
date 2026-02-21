export class VoiceControl {
    constructor(app) {
        this.app = app;
        this.recognition = null;
        this.isListening = false;
        this.commands = {
            'go to education': () => this.navigateTo('education'),
            'education zone': () => this.navigateTo('education'),
            'go to skills': () => this.navigateTo('skills'),
            'skills zone': () => this.navigateTo('skills'),
            'go to experience': () => this.navigateTo('experience'),
            'experience zone': () => this.navigateTo('experience'),
            'go to projects': () => this.navigateTo('projects'),
            'projects zone': () => this.navigateTo('projects'),
            'go to achievements': () => this.navigateTo('achievements'),
            'achievements zone': () => this.navigateTo('achievements'),
            'go to contact': () => this.navigateTo('contact'),
            'contact zone': () => this.navigateTo('contact'),
            'start tour': () => this.app.startGuidedTour(),
            'guided tour': () => this.app.startGuidedTour(),
            'night mode': () => this.app.toggleNightMode(),
            'day mode': () => this.app.toggleNightMode(),
            'lights on': () => this.app.car?.toggleLights(true),
            'lights off': () => this.app.car?.toggleLights(false),
            'horn': () => this.app.audioManager?.playHorn(),
            'beep': () => this.app.audioManager?.playHorn(),
            'stop': () => this.app.car?.stop(),
            'halt': () => this.app.car?.stop(),
            'brake': () => this.app.car?.stop(),
            'radio on': () => this.app.radioSystem?.setStation(0),
            'radio off': () => this.app.radioSystem?.turnOff(),
            'next station': () => this.app.radioSystem?.nextStation(),
            'previous station': () => this.app.radioSystem?.prevStation(),
            'volume up': () => this.adjustVolume(0.1),
            'volume down': () => this.adjustVolume(-0.1),
            'camera view': () => this.app.car?.cycleCamera(),
            'change camera': () => this.app.car?.cycleCamera(),
            'first person': () => this.setCameraMode('first'),
            'follow cam': () => this.setCameraMode('follow'),
            'top view': () => this.setCameraMode('top'),
            'cinematic': () => this.setCameraMode('cinematic'),
            'where am i': () => this.announcePosition(),
            'help': () => this.app.uiManager?.showHelp(),
            'what can you do': () => this.showCommands()
        };
        
        this.init();
    }
    
    init() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Voice control not supported in this browser');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;
        
        this.recognition.onstart = () => {
            this.isListening = true;
            this.showListeningIndicator();
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.hideListeningIndicator();
        };
        
        this.recognition.onresult = (event) => {
            const command = event.results[0][0].transcript.toLowerCase().trim();
            this.processCommand(command);
        };
        
        this.recognition.onerror = (event) => {
            console.warn('Voice recognition error:', event.error);
            this.app.uiManager?.addConsoleMessage(`🎤 Error: ${event.error}`, 'error');
            this.isListening = false;
            this.hideListeningIndicator();
        };
    }
    
    startListening() {
        if (!this.recognition) {
            this.app.uiManager?.addConsoleMessage('🎤 Voice control not supported', 'error');
            return;
        }
        
        try {
            this.recognition.start();
            this.app.uiManager?.showVoiceModal('Listening...');
        } catch (e) {
            console.warn('Failed to start voice recognition:', e);
        }
    }
    
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.app.uiManager?.hideVoiceModal();
        }
    }
    
    processCommand(command) {
        this.app.uiManager?.addConsoleMessage(`🎤 Command: "${command}"`, 'voice');
        
        // Check for exact matches
        if (this.commands[command]) {
            this.commands[command]();
            return;
        }
        
        // Check for partial matches
        for (const [cmd, action] of Object.entries(this.commands)) {
            if (command.includes(cmd)) {
                action();
                return;
            }
        }
        
        // Check for numbers (for station selection)
        const stationMatch = command.match(/station (\d+)/);
        if (stationMatch) {
            const stationNum = parseInt(stationMatch[1]) - 1;
            if (stationNum >= 0 && stationNum < 6) {
                this.app.radioSystem?.setStation(stationNum);
                return;
            }
        }
        
        this.app.uiManager?.addConsoleMessage('🎤 Command not recognized', 'warning');
    }
    
    navigateTo(zone) {
        const targets = {
            'education': { x: 12, z: 12 },
            'skills': { x: -12, z: 12 },
            'experience': { x: 12, z: -12 },
            'projects': { x: -12, z: -12 },
            'achievements': { x: 0, z: 15 },
            'contact': { x: 0, z: -15 }
        };
        
        const target = targets[zone];
        if (target && this.app.car) {
            this.app.car.navigateTo(target);
            this.app.uiManager?.addConsoleMessage(`🎤 Navigating to ${zone} zone`, 'success');
        }
    }
    
    adjustVolume(delta) {
        if (this.app.audioManager) {
            const newVolume = Math.max(0, Math.min(1, this.app.radioSystem.volume + delta));
            this.app.radioSystem.setVolume(newVolume);
            this.app.uiManager?.addConsoleMessage(`🎤 Volume: ${Math.round(newVolume * 100)}%`, 'info');
        }
    }
    
    setCameraMode(mode) {
        if (this.app.car) {
            this.app.car.cameraMode = mode;
            this.app.uiManager?.addConsoleMessage(`🎤 Camera: ${mode} view`, 'info');
        }
    }
    
    announcePosition() {
        if (this.app.car) {
            const pos = this.app.car.position;
            this.app.uiManager?.addConsoleMessage(`📍 Position: (${Math.round(pos.x)}, ${Math.round(pos.z)})`, 'info');
        }
    }
    
    showCommands() {
        const commandsList = Object.keys(this.commands).slice(0, 10).join(', ');
        this.app.uiManager?.addConsoleMessage(`🎤 Try: ${commandsList}, ...`, 'info');
    }
    
    showListeningIndicator() {
        const indicator = document.getElementById('voice-modal');
        if (indicator) {
            indicator.classList.add('active');
            document.getElementById('voice-text').textContent = 'Listening...';
        }
    }
    
    hideListeningIndicator() {
        const indicator = document.getElementById('voice-modal');
        if (indicator) {
            indicator.classList.remove('active');
        }
    }
}