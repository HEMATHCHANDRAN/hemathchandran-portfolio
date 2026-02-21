export class InputManager {
    constructor() {
        this.keys = new Set();
        this.keyState = {};
        this.mouse = { x: 0, y: 0, left: false, right: false };
        this.touch = { forward: 0, right: 0 };
        this.voiceCommand = null;
        this.keyMap = {
            'KeyW': 'forward',
            'KeyS': 'backward',
            'KeyA': 'left',
            'KeyD': 'right',
            'Space': 'brake',
            'ShiftLeft': 'boost',
            'KeyR': 'radio',
            'KeyL': 'lights',
            'KeyM': 'map',
            'KeyQ': 'quests',
            'KeyV': 'voice',
            'KeyC': 'camera',
            'KeyH': 'horn'
        };
        
        this.setupKeyboard();
        this.setupMouse();
    }
    
    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            const action = this.keyMap[e.code];
            if (action) {
                e.preventDefault();
                this.keys.add(action);
                this.keyState[e.code] = true;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            const action = this.keyMap[e.code];
            if (action) {
                e.preventDefault();
                this.keys.delete(action);
                this.keyState[e.code] = false;
            }
        });
        
        // Prevent page scrolling with arrow keys
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
        });
    }
    
    setupMouse() {
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
        
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.mouse.left = true;
            if (e.button === 2) this.mouse.right = true;
        });
        
        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.left = false;
            if (e.button === 2) this.mouse.right = false;
        });
        
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    update() {
        // Reset temporary states
        this.voiceCommand = null;
    }
    
    isPressed(action) {
        return this.keys.has(action);
    }
    
    getMovement() {
        let forward = 0, right = 0;
        
        if (this.isPressed('forward')) forward += 1;
        if (this.isPressed('backward')) forward -= 1;
        if (this.isPressed('left')) right -= 1;
        if (this.isPressed('right')) right += 1;
        
        // Add touch controls
        forward += this.touch.forward;
        right += this.touch.right;
        
        // Normalize diagonal movement
        if (forward !== 0 && right !== 0) {
            const length = Math.sqrt(forward * forward + right * right);
            forward /= length;
            right /= length;
        }
        
        return { forward, right };
    }
    
    getBrake() {
        return this.isPressed('brake') ? 1 : 0;
    }
    
    getBoost() {
        return this.isPressed('boost') ? 1 : 0;
    }
    
    setTouch(axis, value) {
        this.touch[axis] = Math.max(-1, Math.min(1, value));
    }
    
    getActions() {
        return {
            radio: this.isPressed('radio'),
            lights: this.isPressed('lights'),
            map: this.isPressed('map'),
            quests: this.isPressed('quests'),
            voice: this.isPressed('voice'),
            camera: this.isPressed('camera'),
            horn: this.isPressed('horn')
        };
    }
    
    getMouseDelta() {
        return { x: this.mouse.x, y: this.mouse.y };
    }
}