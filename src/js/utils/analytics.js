export class Analytics {
    constructor() {
        this.events = [];
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        
        // Track page view
        this.trackEvent('page_view', {
            path: window.location.pathname,
            title: document.title
        });
        
        // Track visibility changes
        document.addEventListener('visibilitychange', () => {
            this.trackEvent('visibility_change', {
                state: document.visibilityState
            });
        });
    }

    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9);
    }

    trackEvent(category, data = {}) {
        const event = {
            category,
            data,
            timestamp: Date.now(),
            sessionId: this.sessionId
        };
        
        this.events.push(event);
        
        // Send to analytics service if configured
        if (import.meta.env.VITE_ANALYTICS_ID) {
            this.sendToAnalytics(event);
        }
        
        // Log in development
        if (import.meta.env.DEV) {
            console.log('Analytics:', event);
        }
    }

    sendToAnalytics(event) {
        // Example with Google Analytics
        if (window.gtag) {
            window.gtag('event', event.category, event.data);
        }
        
        // Example with Plausible
        if (window.plausible) {
            window.plausible(event.category, { props: event.data });
        }
    }

    trackZoneVisit(zoneName) {
        this.trackEvent('zone_visit', { zone: zoneName });
    }

    trackQuestComplete(questName) {
        this.trackEvent('quest_complete', { quest: questName });
    }

    trackAchievementUnlock(achievement) {
        this.trackEvent('achievement_unlock', { achievement });
    }

    trackInteraction(type, details) {
        this.trackEvent('interaction', { type, ...details });
    }

    getSessionDuration() {
        return (Date.now() - this.startTime) / 1000;
    }

    exportEvents() {
        return {
            sessionId: this.sessionId,
            duration: this.getSessionDuration(),
            events: this.events
        };
    }
}