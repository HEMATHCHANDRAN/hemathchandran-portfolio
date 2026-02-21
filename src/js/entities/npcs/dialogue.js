export class Dialogue {
    constructor(npc) {
        this.npc = npc;
        this.lines = [];
        this.currentLine = 0;
        this.isActive = false;
        this.onComplete = null;
    }

    setLines(lines) {
        this.lines = lines;
    }

    start() {
        this.isActive = true;
        this.currentLine = 0;
        this.showNextLine();
    }

    showNextLine() {
        if (this.currentLine < this.lines.length) {
            const line = this.lines[this.currentLine];
            this.npc.talk(line);
            this.currentLine++;
            
            setTimeout(() => {
                this.showNextLine();
            }, 2000);
        } else {
            this.isActive = false;
            if (this.onComplete) {
                this.onComplete();
            }
        }
    }

    stop() {
        this.isActive = false;
    }
}