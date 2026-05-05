// chatoo-achievements.js - نظام الإنجازات
// المسؤول: Kamikaz007

class ChatooAchievements {
    constructor() {
        this.achievements = ACHIEVEMENTS_CONFIG.achievements;
        this.userStats = this._loadStats();
        this.unlockedAchievements = JSON.parse(localStorage.getItem('chatoo_unlocked_achievements') || '[]');
        this.listeners = [];
    }

    _loadStats() {
        const stored = localStorage.getItem('chatoo_achievement_stats');
        return stored ? JSON.parse(stored) : {
            messagesSent: 0,
            tipsSent: 0,
            tipsReceived: 0,
            totalXP: 0,
            venuesVisited: 0,
            nightMessages: 0,
            shopPurchases: 0,
            referrals: 0,
            mapOpens: 0,
            consecutiveDays: this._calculateConsecutiveDays(),
            lastLoginDate: new Date().toDateString(),
            loginDates: JSON.parse(localStorage.getItem('chatoo_login_dates') || '[]')
        };
    }

    _saveStats() {
        localStorage.setItem('chatoo_achievement_stats', JSON.stringify(this.userStats));
    }

    _saveUnlocked() {
        localStorage.setItem('chatoo_unlocked_achievements', JSON.stringify(this.unlockedAchievements));
    }

    _calculateConsecutiveDays() {
        const dates = JSON.parse(localStorage.getItem('chatoo_login_dates') || '[]');
        if (dates.length === 0) return 1;
        dates.sort();
        let consecutive = 1;
        let maxConsecutive = 1;
        for (let i = 1; i < dates.length; i++) {
            const prev = new Date(dates[i - 1]);
            const curr = new Date(dates[i]);
            const diffDays = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                consecutive++;
                maxConsecutive = Math.max(maxConsecutive, consecutive);
            } else {
                consecutive = 1;
            }
        }
        return maxConsecutive;
    }

    trackLogin() {
        const today = new Date().toDateString();
        const dates = this.userStats.loginDates;
        if (!dates.includes(today)) {
            dates.push(today);
            localStorage.setItem('chatoo_login_dates', JSON.stringify(dates));
        }
        this.userStats.consecutiveDays = this._calculateConsecutiveDays();
        this.userStats.lastLoginDate = today;
        this._saveStats();
        this.checkAchievements();
    }

    trackMessage(hour = null) {
        this.userStats.messagesSent++;
        const msgHour = hour || new Date().getHours();
        if (msgHour >= 0 && msgHour < 5) {
            this.userStats.nightMessages++;
        }
        this._saveStats();
        this.checkAchievements();
    }

    trackTip(direction) {
        if (direction === 'sent') {
            this.userStats.tipsSent++;
        } else {
            this.userStats.tipsReceived++;
        }
        this._saveStats();
        this.checkAchievements();
    }

    trackXP(totalXP) {
        this.userStats.totalXP = totalXP;
        this._saveStats();
        this.checkAchievements();
    }

    trackVenueVisit() {
        this.userStats.venuesVisited++;
        this._saveStats();
        this.checkAchievements();
    }

    trackShopPurchase() {
        this.userStats.shopPurchases++;
        this._saveStats();
        this.checkAchievements();
    }

    trackReferral() {
        this.userStats.referrals++;
        this._saveStats();
        this.checkAchievements();
    }

    trackMapOpen() {
        this.userStats.mapOpens++;
        this._saveStats();
        this.checkAchievements();
    }

    checkAchievements() {
        const newlyUnlocked = [];
        
        this.achievements.forEach(achievement => {
            if (this.unlockedAchievements.includes(achievement.id)) return;
            
            let conditionMet = false;
            const stats = this.userStats;
            const cond = achievement.condition;
            
            if (cond.messagesSent && stats.messagesSent >= cond.messagesSent) conditionMet = true;
            if (cond.tipsSent && stats.tipsSent >= cond.tipsSent) conditionMet = true;
            if (cond.tipsReceived && stats.tipsReceived >= cond.tipsReceived) conditionMet = true;
            if (cond.totalXP && stats.totalXP >= cond.totalXP) conditionMet = true;
            if (cond.venuesVisited && stats.venuesVisited >= cond.venuesVisited) conditionMet = true;
            if (cond.nightMessages && stats.nightMessages >= cond.nightMessages) conditionMet = true;
            if (cond.consecutiveDays && stats.consecutiveDays >= cond.consecutiveDays) conditionMet = true;
            if (cond.shopPurchases && stats.shopPurchases >= cond.shopPurchases) conditionMet = true;
            if (cond.referrals && stats.referrals >= cond.referrals) conditionMet = true;
            if (cond.mapOpens && stats.mapOpens >= cond.mapOpens) conditionMet = true;
            
            if (conditionMet) {
                this.unlockedAchievements.push(achievement.id);
                newlyUnlocked.push(achievement);
                this._onAchievementUnlocked(achievement);
            }
        });
        
        if (newlyUnlocked.length > 0) {
            this._saveUnlocked();
        }
        
        return newlyUnlocked;
    }

    _onAchievementUnlocked(achievement) {
        this.listeners.forEach(callback => {
            try { callback(achievement); } catch (e) {}
        });
        
        if (window.chatooNotif) {
            window.chatooNotif.achievementUnlocked(achievement.name, achievement.xpReward);
        }
        
        if (['rare', 'epic', 'legendary', 'secret'].includes(achievement.rarity)) {
            const rarityColors = {
                rare: '#8257e5',
                epic: '#ff6b6b',
                legendary: '#ffd700',
                secret: '#00ff88'
            };
            
            Swal.fire({
                title: '🎉 إنجاز جديد!',
                html: `
                    <div style="text-align:center;color:#fff;">
                        <div style="font-size:60px;">${achievement.icon}</div>
                        <h2 style="color:${rarityColors[achievement.rarity]};margin:8px 0;">${achievement.name}</h2>
                        <p style="opacity:0.7;">${achievement.description}</p>
                        <p style="color:#ffd700;font-weight:bold;">+${achievement.xpReward} XP +${achievement.piReward} π</p>
                    </div>
                `,
                background: '#121214',
                color: '#fff',
                confirmButtonColor: rarityColors[achievement.rarity],
                confirmButtonText: 'رائع! 🚀'
            });
        }
        
        if (window.chatoo && typeof window.chatoo.gainXP === 'function') {
            window.chatoo.gainXP(achievement.xpReward);
        }
    }

    onAchievementUnlocked(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }

    getProgress() {
        const total = this.achievements.length;
        const unlocked = this.unlockedAchievements.length;
        return {
            total,
            unlocked,
            percentage: Math.round((unlocked / total) * 100),
            achievements: this.achievements.map(a => ({
                ...a,
                unlocked: this.unlockedAchievements.includes(a.id)
            }))
        };
    }

    getTotalPiEarned() {
        return this.achievements
            .filter(a => this.unlockedAchievements.includes(a.id))
            .reduce((sum, a) => sum + a.piReward, 0);
    }

    renderAchievementsList(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const progress = this.getProgress();
        const totalPiEarned = this.getTotalPiEarned();
        const rarityColors = {
            common: '#888', uncommon: '#00ff88', rare: '#8257e5',
            epic: '#ff6b6b', legendary: '#ffd700', secret: '#ff69b4'
        };
        
        let html = `
            <div style="text-align:center;margin-bottom:20px;">
                <div style="font-size:48px;">🏆</div>
                <h3 style="color:var(--gold);margin:8px 0;">${progress.unlocked} / ${progress.total} إنجاز</h3>
                <div style="background:rgba(255,255,255,0.05);border-radius:20px;height:8px;overflow:hidden;margin:10px 0;">
                    <div style="width:${progress.percentage}%;height:100%;background:linear-gradient(90deg, var(--gold), var(--primary));border-radius:20px;transition:width 1s ease;"></div>
                </div>
                <small style="opacity:0.5;">${progress.percentage}% مكتمل</small>
                ${totalPiEarned > 0 ? `<br><small style="color:var(--gold);">💰 ${totalPiEarned} π مكتسبة</small>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;">
        `;

        progress.achievements.forEach(a => {
            html += `
                <div style="background:${a.unlocked ? 'rgba(130,87,229,0.1)' : 'var(--surface)'};border:1px solid ${a.unlocked ? 'rgba(130,87,229,0.3)' : 'rgba(255,255,255,0.05)'};border-radius:16px;padding:12px 16px;display:flex;align-items:center;gap:12px;opacity:${a.unlocked ? '1' : '0.4'};">
                    <div style="font-size:28px;">${a.unlocked ? a.icon : a.secret ? '❓' : '🔒'}</div>
                    <div style="flex-grow:1;">
                        <b style="font-size:14px;color:${a.unlocked ? '#fff' : 'rgba(255,255,255,0.5)'};">${a.unlocked ? a.name : a.secret && !a.unlocked ? a.hint || 'إنجاز سري' : a.name}</b>
                        <br><small style="opacity:0.5;">${a.unlocked ? a.description : a.secret && !a.unlocked ? (a.hint || 'لم يُفتح بعد') : 'لم يُفتح بعد'}</small>
                    </div>
                    <div style="text-align:center;">
                        <span style="background:${rarityColors[a.rarity]}22;color:${rarityColors[a.rarity]};padding:2px 8px;border-radius:10px;font-size:9px;font-weight:bold;">${a.rarity.toUpperCase()}</span>
                        ${a.unlocked ? `<br><small style="color:var(--gold);">+${a.xpReward} XP</small>` : ''}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }
}

// تهيئة النظام
window.chatooAchievements = null;
document.addEventListener('DOMContentLoaded', () => {
    window.chatooAchievements = new ChatooAchievements();
    window.chatooAchievements.trackLogin();
    console.log('🏆 Achievements System Ready');
});
