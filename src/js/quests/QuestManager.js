export class QuestManager {
    constructor(vehicle, modal, achievements, console_log) {
        this.vehicle = vehicle;
        this.modal = modal;
        this.achievements = achievements;
        this.console = console_log;
        
        this.quests = this.loadQuests();
        this.activeQuests = [];
        this.completedQuests = [];
        
        this.checkDistanceInterval = null;
        this.startQuestChecking();
    }

    loadQuests() {
        return [
            {
                id: 'quest_education',
                title: 'Knowledge Seeker',
                description: 'Visit the Education Zone to learn about Hemathchandran\'s academic journey.',
                target: { x: 20, z: 20 },
                reward: '🎓 Education Badge',
                hint: 'Look for the blue building in the northeast'
            },
            {
                id: 'quest_skills',
                title: 'Skill Master',
                description: 'Discover all the technical skills at the Skills Tower.',
                target: { x: -20, z: 20 },
                reward: '⚡ Skills Badge',
                hint: 'Red building in the northwest'
            },
            {
                id: 'quest_experience',
                title: 'Industry Expert',
                description: 'Explore the Experience Zone to see professional journey.',
                target: { x: 20, z: -20 },
                reward: '💼 Experience Badge',
                hint: 'Green building in the southeast'
            },
            {
                id: 'quest_projects',
                title: 'Project Pioneer',
                description: 'Visit all project pavilions in the Projects Zone.',
                target: { x: -20, z: -20 },
                reward: '🔧 Projects Badge',
                hint: 'Yellow building in the southwest'
            },
            {
                id: 'quest_achievements',
                title: 'Achievement Hunter',
                description: 'Find the Achievements Monument.',
                target: { x: 0, z: 30 },
                reward: '🏆 Achievements Badge',
                hint: 'Look north from the starting point'
            },
            {
                id: 'quest_all',
                title: 'Ultimate Explorer',
                description: 'Complete all zones to become an Ultimate Embedded Engineer.',
                target: null,
                reward: '🌟 Ultimate Badge',
                hint: 'Complete all other quests first'
            }
        ];
    }

    startQuestChecking() {
        this.checkDistanceInterval = setInterval(() => {
            this.checkQuestProximity();
        }, 1000);
    }

    checkQuestProximity() {
        if (!this.vehicle.model) return;
        
        const pos = this.vehicle.model.position;
        
        this.quests.forEach(quest => {
            // Skip if already completed
            if (this.completedQuests.includes(quest.id)) return;
            
            // Skip if no target (like all quests)
            if (!quest.target) return;
            
            // Calculate distance
            const distance = Math.hypot(pos.x - quest.target.x, pos.z - quest.target.z);
            
            // If close enough, complete quest
            if (distance < 10) {
                this.completeQuest(quest);
            }
        });
        
        // Check if all other quests are completed
        const otherQuests = this.quests.filter(q => q.id !== 'quest_all');
        const allOthersCompleted = otherQuests.every(q => this.completedQuests.includes(q.id));
        
        if (allOthersCompleted && !this.completedQuests.includes('quest_all')) {
            const allQuest = this.quests.find(q => q.id === 'quest_all');
            this.completeQuest(allQuest);
        }
    }

    completeQuest(quest) {
        if (this.completedQuests.includes(quest.id)) return;
        
        this.completedQuests.push(quest.id);
        this.console.log(`🎉 Quest Complete: ${quest.title}`);
        
        // Show achievement
        this.achievements.unlock(quest.reward);
        
        // Show quest complete modal
        this.modal.show(`
            <h2>Quest Complete!</h2>
            <h3>${quest.title}</h3>
            <p>${quest.description}</p>
            <p>Reward: ${quest.reward}</p>
        `);
        
        // Special rewards
        if (quest.id === 'quest_all') {
            this.achievements.unlock('🏆 Ultimate Embedded Systems Engineer');
            this.console.log('🎊 Congratulations! You have completed all quests!');
        }
    }

    getQuestStatus(questId) {
        return {
            completed: this.completedQuests.includes(questId),
            active: this.activeQuests.includes(questId)
        };
    }

    getCompletionPercentage() {
        const total = this.quests.length;
        const completed = this.completedQuests.length;
        return (completed / total) * 100;
    }

    cleanup() {
        if (this.checkDistanceInterval) {
            clearInterval(this.checkDistanceInterval);
        }
    }
}