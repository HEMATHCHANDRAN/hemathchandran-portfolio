export class NPCInteraction {
    constructor(npc, player) {
        this.npc = npc;
        this.player = player;
        this.interactionRadius = 3;
        this.isInteracting = false;
        this.interactionTimer = 0;
        this.dialogueIndex = 0;
        
        this.dialogues = {
            generic: [
                "Hello there! Welcome to the world.",
                "Have you visited all the buildings yet?",
                "I heard there are hidden microcontrollers around!",
                "The car handles quite smoothly, doesn't it?",
                "Don't forget to check out the achievements!",
                "Night mode makes everything look amazing.",
                "You can control everything with your voice!"
            ],
            education: [
                "The education zone has all his academic details.",
                "He studied at Dr. NGP Institute of Technology.",
                "Great CGPA of 8.06 so far!",
                "Did you see his school scores? 79% in HSE!"
            ],
            skills: [
                "He knows so many microcontrollers!",
                "ESP32, STM32, Raspberry Pi... the list goes on.",
                "Embedded C and Python are his main languages.",
                "He even uses Altium Designer for PCB design!"
            ],
            experience: [
                "He's teaching over 1000 students right now!",
                "IoT solutions with ESP32 and Raspberry Pi.",
                "Built automated alert systems with APIs.",
                "Great mentor for final year projects."
            ],
            projects: [
                "The swarm robotics project is amazing!",
                "CleanTide won a TNSCST grant!",
                "The regenerative charging system is innovative.",
                "Coal mine monitoring for safety applications."
            ]
        };
    }
    
    update() {
        if (!this.npc || !this.player) return;
        
        const distance = this.getDistance();
        
        if (distance < this.interactionRadius) {
            this.npc.lookAt(this.player.position);
            
            if (!this.isInteracting && distance < 2) {
                this.startInteraction();
            }
        } else {
            if (this.isInteracting) {
                this.endInteraction();
            }
        }
        
        if (this.isInteracting) {
            this.interactionTimer += 0.016; // Assuming 60fps
            
            if (this.interactionTimer > 5) { // 5 seconds between dialogues
                this.sayRandomDialogue();
                this.interactionTimer = 0;
            }
        }
    }
    
    getDistance() {
        const dx = this.player.position.x - this.npc.position.x;
        const dz = this.player.position.z - this.npc.position.z;
        return Math.sqrt(dx * dx + dz * dz);
    }
    
    startInteraction() {
        this.isInteracting = true;
        this.interactionTimer = 0;
        this.npc.state = 'talking';
        this.sayRandomDialogue();
    }
    
    endInteraction() {
        this.isInteracting = false;
        this.npc.state = 'idle';
    }
    
    sayRandomDialogue() {
        // Choose dialogue based on nearby building
        let dialogueSet = 'generic';
        
        // Check nearby buildings
        if (window.app && window.app.buildings) {
            for (const building of window.app.buildings) {
                const dist = building.getDistanceFrom(this.npc.position);
                if (dist < 10) {
                    dialogueSet = building.type;
                    break;
                }
            }
        }
        
        const dialogues = this.dialogues[dialogueSet] || this.dialogues.generic;
        const dialogue = dialogues[Math.floor(Math.random() * dialogues.length)];
        
        this.npc.talk(dialogue);
    }
    
    saySpecificDialogue(topic) {
        const dialogues = this.dialogues[topic] || this.dialogues.generic;
        const dialogue = dialogues[Math.floor(Math.random() * dialogues.length)];
        this.npc.talk(dialogue);
    }
}