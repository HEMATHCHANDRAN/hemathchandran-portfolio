export class QuestSystem {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.quests = this.initializeQuests();
        this.achievements = this.initializeAchievements();
        this.completedQuests = [];
        this.unlockedAchievements = [];
        this.collectedItems = [];
        
        // Progress tracking
        this.totalQuests = this.quests.length;
        this.totalAchievements = this.achievements.length;
        
        // Event callbacks
        this.onQuestComplete = null;
        this.onAchievementUnlock = null;
        this.onAllQuestsComplete = null;
        
        // Load saved progress
        this.loadProgress();
    }
    
    initializeQuests() {
        return [
            {
                id: 'education',
                name: 'Knowledge Seeker',
                description: 'Visit the Education Zone to learn about Hemathchandran\'s academic journey',
                icon: '🎓',
                reward: 'Education Badge',
                rewardXP: 100,
                completed: false,
                order: 1
            },
            {
                id: 'skills',
                name: 'Skill Master',
                description: 'Discover all technical skills at the Skills Tower',
                icon: '⚡',
                reward: 'Skills Badge',
                rewardXP: 100,
                completed: false,
                order: 2
            },
            {
                id: 'experience',
                name: 'Industry Expert',
                description: 'Explore professional experience at the Experience Zone',
                icon: '💼',
                reward: 'Experience Badge',
                rewardXP: 100,
                completed: false,
                order: 3
            },
            {
                id: 'projects',
                name: 'Project Pioneer',
                description: 'Visit all project pavilions to see embedded systems projects',
                icon: '🔧',
                reward: 'Projects Badge',
                rewardXP: 100,
                completed: false,
                order: 4
            },
            {
                id: 'achievements',
                name: 'Achievement Hunter',
                description: 'Discover achievements and awards at the Achievements Monument',
                icon: '🏆',
                reward: 'Achievements Badge',
                rewardXP: 100,
                completed: false,
                order: 5
            },
            {
                id: 'contact',
                name: 'Networker',
                description: 'Find contact information at the Contact Center',
                icon: '📞',
                reward: 'Contact Badge',
                rewardXP: 100,
                completed: false,
                order: 6
            },
            {
                id: 'collector',
                name: 'Hardware Collector',
                description: 'Find all microcontroller models scattered around the world',
                icon: '🔌',
                reward: 'Collector Badge',
                rewardXP: 200,
                completed: false,
                order: 7
            },
            {
                id: 'explorer',
                name: 'World Explorer',
                description: 'Drive 1km total distance',
                icon: '🌍',
                reward: 'Explorer Badge',
                rewardXP: 150,
                completed: false,
                order: 8,
                progress: 0,
                target: 1000
            }
        ];
    }
    
    initializeAchievements() {
        return [
            {
                id: 'education',
                name: 'Education Zone',
                description: 'Completed education quest',
                icon: '🎓',
                unlocked: false,
                xpReward: 50
            },
            {
                id: 'skills',
                name: 'Skills Zone',
                description: 'Completed skills quest',
                icon: '⚡',
                unlocked: false,
                xpReward: 50
            },
            {
                id: 'experience',
                name: 'Experience Zone',
                description: 'Completed experience quest',
                icon: '💼',
                unlocked: false,
                xpReward: 50
            },
            {
                id: 'projects',
                name: 'Projects Zone',
                description: 'Completed projects quest',
                icon: '🔧',
                unlocked: false,
                xpReward: 50
            },
            {
                id: 'achievements',
                name: 'Achievements Zone',
                description: 'Completed achievements quest',
                icon: '🏆',
                unlocked: false,
                xpReward: 50
            },
            {
                id: 'contact',
                name: 'Contact Zone',
                description: 'Completed contact quest',
                icon: '📞',
                unlocked: false,
                xpReward: 50
            },
            {
                id: 'collector',
                name: 'Hardware Collector',
                description: 'Found all microcontrollers',
                icon: '🔌',
                unlocked: false,
                xpReward: 100
            },
            {
                id: 'explorer',
                name: 'World Explorer',
                description: 'Drove 1km total distance',
                icon: '🌍',
                unlocked: false,
                xpReward: 75
            },
            {
                id: 'speed_demon',
                name: 'Speed Demon',
                description: 'Reach maximum speed',
                icon: '⚡',
                unlocked: false,
                xpReward: 75
            },
            {
                id: 'night_owl',
                name: 'Night Owl',
                description: 'Explore at night',
                icon: '🦉',
                unlocked: false,
                xpReward: 50
            },
            {
                id: 'all',
                name: 'Ultimate Explorer',
                description: 'Completed all quests and achievements',
                icon: '🌟',
                unlocked: false,
                xpReward: 500
            }
        ];
    }
    
    loadProgress() {
        try {
            const saved = localStorage.getItem('questProgress');
            if (saved) {
                const data = JSON.parse(saved);
                this.completedQuests = data.completedQuests || [];
                this.unlockedAchievements = data.unlockedAchievements || [];
                this.collectedItems = data.collectedItems || [];
                
                // Update quest and achievement states
                this.quests.forEach(quest => {
                    quest.completed = this.completedQuests.includes(quest.id);
                });
                
                this.achievements.forEach(ach => {
                    ach.unlocked = this.unlockedAchievements.includes(ach.id);
                });
                
                // Update UI
                this.uiManager.updateQuests(this.quests);
                this.uiManager.updateAchievements(this.achievements);
                
                console.log('Quest progress loaded');
            }
        } catch (e) {
            console.warn('Failed to load quest progress', e);
        }
    }
    
    saveProgress() {
        try {
            const data = {
                completedQuests: this.completedQuests,
                unlockedAchievements: this.unlockedAchievements,
                collectedItems: this.collectedItems,
                lastSave: Date.now()
            };
            localStorage.setItem('questProgress', JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save quest progress', e);
        }
    }
    
    completeQuest(questId) {
        const quest = this.quests.find(q => q.id === questId);
        if (!quest || quest.completed) return false;
        
        // Mark as completed
        quest.completed = true;
        this.completedQuests.push(questId);
        
        // Show notifications
        this.uiManager.addConsoleMessage(`🎯 QUEST COMPLETE: ${quest.name}`, 'success');
        this.uiManager.addConsoleMessage(`Reward: ${quest.reward} (+${quest.rewardXP} XP)`, 'success');
        
        // Unlock corresponding achievement
        this.unlockAchievement(questId);
        
        // Check for collector achievement
        if (questId === 'collector') {
            this.unlockAchievement('collector');
        }
        
        // Check if all main quests are complete
        const mainQuests = ['education', 'skills', 'experience', 'projects', 'achievements', 'contact'];
        const allMainComplete = mainQuests.every(id => this.completedQuests.includes(id));
        
        if (allMainComplete) {
            this.uiManager.addConsoleMessage('🎉 All main quests completed! Unlocking ultimate achievement...', 'success');
            this.unlockAchievement('all');
        }
        
        // Update UI
        this.uiManager.updateQuests(this.quests);
        this.uiManager.updateAchievements(this.achievements);
        
        // Save progress
        this.saveProgress();
        
        // Callback
        if (this.onQuestComplete) {
            this.onQuestComplete(quest);
        }
        
        // Check if all quests are done
        if (this.completedQuests.length === this.totalQuests) {
            if (this.onAllQuestsComplete) {
                this.onAllQuestsComplete();
            }
        }
        
        return true;
    }
    
    unlockAchievement(achievementId) {
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (!achievement || achievement.unlocked) return false;
        
        achievement.unlocked = true;
        this.unlockedAchievements.push(achievementId);
        
        // Show notification
        this.uiManager.addConsoleMessage(`🏆 ACHIEVEMENT UNLOCKED: ${achievement.name} (+${achievement.xpReward} XP)`, 'success');
        
        // Play sound if available
        if (window.app && window.app.audioManager) {
            window.app.audioManager.playAchievement();
        }
        
        // Update UI
        this.uiManager.updateAchievements(this.achievements);
        
        // Save progress
        this.saveProgress();
        
        // Callback
        if (this.onAchievementUnlock) {
            this.onAchievementUnlock(achievement);
        }
        
        return true;
    }
    
    collectItem(itemName) {
        if (!this.collectedItems.includes(itemName)) {
            this.collectedItems.push(itemName);
            localStorage.setItem('collectedItems', JSON.stringify(this.collectedItems));
            
            this.uiManager.addConsoleMessage(`📦 Collected: ${itemName}`, 'info');
            
            // Update collector progress
            const allItems = ['ESP32', 'STM32', 'Raspberry Pi', 'Arduino', 'ESP32-CAM', 'BLE Module'];
            const allCollected = allItems.every(item => this.collectedItems.includes(item));
            
            if (allCollected) {
                this.completeQuest('collector');
            }
            
            return true;
        }
        return false;
    }
    
    updateExplorerProgress(distance) {
        const explorerQuest = this.quests.find(q => q.id === 'explorer');
        if (!explorerQuest || explorerQuest.completed) return;
        
        explorerQuest.progress = (explorerQuest.progress || 0) + distance;
        
        if (explorerQuest.progress >= explorerQuest.target) {
            this.completeQuest('explorer');
            this.unlockAchievement('explorer');
        }
    }
    
    checkSpeedAchievement(speed) {
        if (speed > 95) { // 95% of max speed
            this.unlockAchievement('speed_demon');
        }
    }
    
    checkNightAchievement(isNight) {
        if (isNight) {
            // Track night time
            if (!this.nightTimer) {
                this.nightTimer = 0;
            }
            this.nightTimer += 1/60; // Assuming 60fps
            
            if (this.nightTimer > 60) { // 1 minute of night time
                this.unlockAchievement('night_owl');
            }
        }
    }
    
    getQuest(questId) {
        return this.quests.find(q => q.id === questId);
    }
    
    getQuests() {
        return this.quests.sort((a, b) => a.order - b.order);
    }
    
    getAchievements() {
        return this.achievements;
    }
    
    getCompletedQuests() {
        return this.completedQuests.length;
    }
    
    getCompletionPercentage() {
        return (this.completedQuests.length / this.totalQuests) * 100;
    }
    
    getProgress() {
        return {
            quests: {
                total: this.totalQuests,
                completed: this.completedQuests.length,
                percentage: (this.completedQuests.length / this.totalQuests) * 100
            },
            achievements: {
                total: this.totalAchievements,
                unlocked: this.unlockedAchievements.length,
                percentage: (this.unlockedAchievements.length / this.totalAchievements) * 100
            },
            items: {
                total: 6,
                collected: this.collectedItems.length,
                percentage: (this.collectedItems.length / 6) * 100
            }
        };
    }
    
    reset() {
        this.completedQuests = [];
        this.unlockedAchievements = [];
        this.collectedItems = [];
        this.nightTimer = 0;
        
        this.quests.forEach(q => q.completed = false);
        this.achievements.forEach(a => a.unlocked = false);
        
        localStorage.removeItem('questProgress');
        localStorage.removeItem('collectedItems');
        
        this.uiManager.updateQuests(this.quests);
        this.uiManager.updateAchievements(this.achievements);
        this.uiManager.addConsoleMessage('Quest progress reset', 'system');
    }
    
    exportStats() {
        return {
            timestamp: Date.now(),
            quests: this.getProgress(),
            completedQuests: this.completedQuests,
            unlockedAchievements: this.unlockedAchievements,
            collectedItems: this.collectedItems
        };
    }
}