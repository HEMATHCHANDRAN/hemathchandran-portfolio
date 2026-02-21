export class Achievements {
    constructor() {
        this.element = document.getElementById('achievements');
        this.badges = [];
        this.unlockedBadges = JSON.parse(localStorage.getItem('badges') || '[]');
    }

    unlock(badge) {
        if (this.unlockedBadges.includes(badge)) return;
        
        this.unlockedBadges.push(badge);
        localStorage.setItem('badges', JSON.stringify(this.unlockedBadges));
        
        // Show achievement
        this.element.style.display = 'block';
        this.element.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">🏆</span>
                <div>
                    <div style="font-size: 12px; color: #888;">Achievement Unlocked!</div>
                    <div style="font-weight: bold;">${badge}</div>
                </div>
            </div>
        `;
        
        // Hide after 5 seconds
        setTimeout(() => {
            this.element.style.display = 'none';
        }, 5000);
    }

    getUnlockedBadges() {
        return this.unlockedBadges;
    }

    hasUnlocked(badge) {
        return this.unlockedBadges.includes(badge);
    }
}