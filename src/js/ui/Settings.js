export class Settings {
    constructor() {
        this.modal = document.getElementById('settings-modal');
        this.languageSelect = document.getElementById('language-select');
        this.colorblindMode = document.getElementById('colorblind-mode');
        this.highContrast = document.getElementById('high-contrast');
        
        this.loadSettings();
        this.setupEventListeners();
    }

    loadSettings() {
        // Load from localStorage
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');
        
        if (settings.language) {
            this.languageSelect.value = settings.language;
        }
        
        if (settings.colorblind) {
            this.colorblindMode.checked = settings.colorblind;
            this.applyColorblind(settings.colorblind);
        }
        
        if (settings.highContrast) {
            this.highContrast.checked = settings.highContrast;
            this.applyHighContrast(settings.highContrast);
        }
    }

    setupEventListeners() {
        this.languageSelect.addEventListener('change', () => {
            this.saveSettings();
        });
        
        this.colorblindMode.addEventListener('change', () => {
            this.applyColorblind(this.colorblindMode.checked);
            this.saveSettings();
        });
        
        this.highContrast.addEventListener('change', () => {
            this.applyHighContrast(this.highContrast.checked);
            this.saveSettings();
        });
        
        document.getElementById('close-settings').addEventListener('click', () => {
            this.hide();
        });
    }

    applyColorblind(enabled) {
        if (enabled) {
            document.body.classList.add('colorblind-mode');
            // Apply colorblind filter
            document.body.style.filter = 'grayscale(0.5) contrast(1.2)';
        } else {
            document.body.classList.remove('colorblind-mode');
            document.body.style.filter = '';
        }
    }

    applyHighContrast(enabled) {
        if (enabled) {
            document.body.classList.add('high-contrast');
            document.body.style.filter = 'contrast(1.5) brightness(1.1)';
        } else {
            document.body.classList.remove('high-contrast');
            document.body.style.filter = '';
        }
    }

    saveSettings() {
        const settings = {
            language: this.languageSelect.value,
            colorblind: this.colorblindMode.checked,
            highContrast: this.highContrast.checked
        };
        
        localStorage.setItem('settings', JSON.stringify(settings));
    }

    show() {
        this.modal.classList.add('active');
    }

    hide() {
        this.modal.classList.remove('active');
    }
}