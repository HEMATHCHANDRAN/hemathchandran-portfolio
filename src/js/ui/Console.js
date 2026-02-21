export class Console {
    constructor() {
        this.element = document.getElementById('console');
        this.logs = [];
        this.maxLogs = 15;
    }

    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logLine = `[${timestamp}] ${message}`;
        
        this.logs.push(logLine);
        
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        this.render();
    }

    render() {
        this.element.innerHTML = this.logs.map(log => 
            `<div class="console-line">${log}</div>`
        ).join('');
        
        // Auto-scroll to bottom
        this.element.scrollTop = this.element.scrollHeight;
    }

    clear() {
        this.logs = [];
        this.render();
    }
}