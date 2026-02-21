export class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, clicked: false, rightClicked: false };
        this.touch = { forward: 0, right: 0 };
        this.voiceCommand = null;
        
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            // Prevent default for game controls
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
        
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.mouse.clicked = true;
            if (e.button === 2) this.mouse.rightClicked = true;
        });
        
        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.clicked = false;
            if (e.button === 2) this.mouse.rightClicked = false;
        });
        
        // Prevent context menu on right click
        window.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Touch controls (will be connected from main.js)
        this.setupTouchControls();
    }

    setupTouchControls() {
        // These will be connected by the touch controls UI
        // The values will be updated from there
    }

    update() {
        // Reset temporary states if needed
        // Voice command is consumed each frame
        this.voiceCommand = null;
    }

    isPressed(key) {
        return !!this.keys[key];
    }

    getMovement() {
        let forward = 0, right = 0;
        
        // Keyboard
        if (this.isPressed('KeyW')) forward += 1;
        if (this.isPressed('KeyS')) forward -= 1;
        if (this.isPressed('KeyA')) right -= 1;
        if (this.isPressed('KeyD')) right += 1;
        
        // Add touch controls
        forward += this.touch.forward;
        right += this.touch.right;
        
        // Clamp values
        forward = Math.max(-1, Math.min(1, forward));
        right = Math.max(-1, Math.min(1, right));
        
        return { forward, right };
    }

    getBrake() {
        return this.isPressed('Space') ? 1 : 0;
    }

    getHandbrake() {
        return this.isPressed('ShiftLeft') ? 1 : 0;
    }
}