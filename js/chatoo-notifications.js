// chatoo-notifications.js - نظام الإشعارات
class ChatooNotifications {
    constructor() {
        this.queue = [];
        this.maxVisible = 3;
        this.notifContainer = null;
        this.sounds = {};
        this.init();
    }

    init() {
        this._injectStyles();
        this._buildContainer();
        this._initSounds();
        console.log('🔔 Notifications Ready');
    }

    _injectStyles() {
        if (document.getElementById('chatoo-notif-styles')) return;
        const style = document.createElement('style');
        style.id = 'chatoo-notif-styles';
        style.innerHTML = `
            .chatoo-notif-container{position:fixed;top:80px;right:12px;z-index:10000;display:flex;flex-direction:column;gap:10px;max-width:340px;width:calc(100% - 24px);pointer-events:none;}
            .chatoo-notif{background:rgba(18,18,20,0.92);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:14px 16px;display:flex;gap:12px;align-items:flex-start;transform:translateX(120%);opacity:0;transition:all .5s cubic-bezier(0.175,0.885,0.32,1.275);pointer-events:auto;box-shadow:0 12px 40px rgba(0,0,0,0.5);position:relative;overflow:hidden;}
            .chatoo-notif.show{transform:translateX(0);opacity:1;}
            .chatoo-notif.hide{transform:translateX(120%);opacity:0;}
            .chatoo-notif::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;}
            .chatoo-notif.type-tip::before{background:linear-gradient(to bottom,#ffd700,#ff8c00);}
            .chatoo-notif.type-achievement::before{background:linear-gradient(to bottom,#00ff88,#00b894);}
            .chatoo-notif.type-alert::before{background:linear-gradient(to bottom,#ff4757,#ff6b81);}
            .chatoo-notif.type-system::before{background:linear-gradient(to bottom,#54a0ff,#2e86de);}
            .notif-icon{font-size:28px;flex-shrink:0;animation:notifBounce .6s ease;}
            @keyframes notifBounce{0%{transform:scale(0)}60%{transform:scale(1.3)}100%{transform:scale(1)}}
            .notif-body{flex-grow:1;min-width:0;}
            .notif-title{font-weight:800;font-size:13px;color:#fff;margin-bottom:2px;}
            .notif-text{font-size:11px;color:rgba(255,255,255,0.5);line-height:1.5;}
            .notif-time{font-size:9px;color:rgba(255,255,255,0.2);margin-top:4px;}
            .notif-close{position:absolute;top:8px;right:8px;width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,0.06);border:none;color:rgba(255,255,255,0.4);cursor:pointer;font-size:10px;}
            .notif-progress{position:absolute;bottom:0;left:0;height:2px;background:rgba(255,255,255,0.15);}
            .chatoo-toast{position:fixed;bottom:140px;left:50%;transform:translateX(-50%) translateY(40px);z-index:10001;background:rgba(0,0,0,0.9);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.1);border-radius:30px;padding:10px 20px;color:#fff;font-size:13px;font-weight:600;opacity:0;transition:all .4s;pointer-events:none;white-space:nowrap;}
            .chatoo-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
        `;
        document.head.appendChild(style);
    }

    _buildContainer() {
        this.notifContainer = document.createElement('div');
        this.notifContainer.className = 'chatoo-notif-container';
        document.body.appendChild(this.notifContainer);
        this.toastEl = document.createElement('div');
        this.toastEl.className = 'chatoo-toast';
        document.body.appendChild(this.toastEl);
    }

    _initSounds() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            ['tip','achievement'].forEach(name => {
                this.sounds[name] = () => {
                    const o = ctx.createOscillator(), g = ctx.createGain();
                    o.connect(g); g.connect(ctx.destination);
                    o.frequency.value = name === 'achievement' ? 1000 : 800;
                    o.type = 'sine'; g.gain.value = 0.02;
                    o.start(); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
                    o.stop(ctx.currentTime + 0.15);
                };
            });
        } catch(e) {}
    }

    _playSound(type) { if (this.sounds[type]) try { this.sounds[type](); } catch(e) {} }

    push({ type = 'system', title, text, duration = 4000, action = null }) {
        const icons = { tip: '💎', achievement: '🏆', alert: '⚠️', system: '📡' };
        const notif = document.createElement('div');
        notif.className = `chatoo-notif type-${type}`;
        notif.innerHTML = `
            <div class="notif-icon">${icons[type] || '🔔'}</div>
            <div class="notif-body">
                <div class="notif-title">${title}</div>
                <div class="notif-text">${text}</div>
                <div class="notif-time">${new Date().toLocaleTimeString('ar-TN', {hour:'2-digit',minute:'2-digit'})}</div>
                ${action ? `<button class="notif-action-btn" style="background:rgba(130,87,229,0.2);border:1px solid rgba(130,87,229,0.3);color:#fff;padding:5px 12px;border-radius:12px;font-size:10px;cursor:pointer;margin-top:6px;">${action.label}</button>` : ''}
            </div>
            <button class="notif-close">✕</button>
            <div class="notif-progress"></div>
        `;
        this.notifContainer.appendChild(notif);
        requestAnimationFrame(() => notif.classList.add('show'));
        const progress = notif.querySelector('.notif-progress');
        let remaining = duration;
        const interval = setInterval(() => {
            remaining -= 50;
            progress.style.width = (remaining / duration) * 100 + '%';
            if (remaining <= 0) { clearInterval(interval); this._dismiss(notif); }
        }, 50);
        notif.querySelector('.notif-close').onclick = () => this._dismiss(notif);
        if (action) notif.querySelector('.notif-action-btn').onclick = () => { action.callback(); this._dismiss(notif); };
        this._playSound(type);
        while (this.notifContainer.children.length > this.maxVisible) this._dismiss(this.notifContainer.firstElementChild);
        return notif;
    }

    _dismiss(notif) { if (!notif?.parentElement) return; notif.classList.add('hide'); setTimeout(() => notif.remove(), 500); }

    toast(msg, duration = 2500) {
        this.toastEl.textContent = msg;
        this.toastEl.classList.add('show');
        setTimeout(() => this.toastEl.classList.remove('show'), duration);
    }

    achievementUnlocked(name, xp) { return this.push({ type: 'achievement', title: '🎖️ إنجاز!', text: `${name} (+${xp} XP)`, duration: 5000 }); }
    piReceived(amount, from) { return this.push({ type: 'tip', title: '💰 إكرامية Pi!', text: `استلمت ${amount} π من ${from}`, duration: 6000 }); }
    systemAlert(msg) { return this.push({ type: 'alert', title: '⚠️ تنبيه', text: msg, duration: 5000 }); }
}

window.chatooNotif = null;
document.addEventListener('DOMContentLoaded', () => { window.chatooNotif = new ChatooNotifications(); });
