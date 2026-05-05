// chatoo-referrals.js - نظام الإحالات لمشروع Chatoo
// المسؤول: Kamikaz007
class ChatooReferrals {
    constructor() {
        this.referralCode = this._loadReferralCode();
        this.referrals = JSON.parse(localStorage.getItem('chatoo_referrals_list') || '[]');
        this.referralRewards = REWARDS_CONFIG.referrals;
        this.init();
    }

    init() {
        this._trackVisit();
        console.log('🔗 Chatoo Referrals Ready');
    }

    _generateReferralCode() {
        const userId = (window.chatooAuth?.getRealUsername() || window.chatoo?.state?.id || 'U' + Math.random().toString(36).substring(2, 8)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
        return `CHT-${userId}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    }

    _loadReferralCode() {
        let code = localStorage.getItem('chatoo_ref_code');
        if (!code) { code = this._generateReferralCode(); localStorage.setItem('chatoo_ref_code', code); }
        return code;
    }

    _trackVisit() {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        if (refCode && refCode !== this.referralCode && !localStorage.getItem('chatoo_referred_by')) {
            localStorage.setItem('chatoo_referred_by', refCode);
            this._recordReferral(refCode);
        }
    }

    async _recordReferral(refCode) {
        const newReferral = { code: refCode, timestamp: Date.now(), userId: window.chatooAuth?.getRealUsername() || 'anonymous' };
        this.referrals.push(newReferral);
        localStorage.setItem('chatoo_referrals_list', JSON.stringify(this.referrals));

        if (window.chatooAchievements) window.chatooAchievements.trackReferral();
        if (window.chatooNotif) window.chatooNotif.toast('🔗 تم تسجيل الإحالة');

        try {
            if (window.db) {
                await window.db.collection('referrals').add(newReferral);
            }
        } catch (e) { console.warn('Referral log skip:', e.message); }
    }

    getReferralLink() {
        return `${window.location.origin}${window.location.pathname}?ref=${this.referralCode}`;
    }

    getReferralStats() {
        const total = this.referrals.length;
        let bonusPi = 0, bonusXP = 0, currentTitle = 'مبتدئ';
        const milestones = this.referralRewards.milestones;
        Object.keys(milestones).sort((a,b) => a-b).forEach(count => {
            if (total >= parseInt(count)) {
                bonusPi += milestones[count].pi;
                bonusXP += milestones[count].xp;
                currentTitle = milestones[count].title;
            }
        });
        return {
            referralCode: this.referralCode,
            referralLink: this.getReferralLink(),
            totalReferrals: total,
            totalPiEarned: (total * this.referralRewards.basePiReward) + bonusPi,
            totalXPEarned: (total * this.referralRewards.baseXPReward) + bonusXP,
            currentTitle
        };
    }

    async shareReferralLink() {
        const link = this.getReferralLink();
        const message = `انضم إلى Chatoo على Pi Network!\n${link}\n#Chatoo #PiNetwork #Web3`;
        if (navigator.share) {
            try { await navigator.share({ title: 'Chatoo', text: message, url: link }); return; } catch (e) {}
        }
        try {
            await navigator.clipboard.writeText(link);
            if (window.chatooNotif) window.chatooNotif.toast('📋 تم نسخ رابط الإحالة');
        } catch (e) {
            Swal.fire({ title: 'رابط الإحالة', html: `<code style="word-break:break-all;color:#ffd700;">${link}</code>`, background: "#121214", color: "#fff", confirmButtonColor: "#ffd700" });
        }
    }

    renderReferralCard(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const stats = this.getReferralStats();
        container.innerHTML = `
            <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border:1px solid rgba(130,87,229,0.3);border-radius:20px;padding:24px 20px;text-align:center;">
                <h3 style="color:#fff;">🤝 نظام الإحالات</h3>
                <p style="opacity:0.7;font-size:13px;">ادعُ أصدقاءك واكسب ${this.referralRewards.basePiReward} π + ${this.referralRewards.baseXPReward} XP لكل إحالة</p>
                <div style="display:flex;justify-content:space-around;margin:16px 0;">
                    <div><div style="font-size:28px;color:var(--gold);">${stats.totalReferrals}</div><small>إحالة</small></div>
                    <div><div style="font-size:28px;color:var(--gold);">${stats.totalPiEarned.toFixed(2)} π</div><small>مكتسبة</small></div>
                    <div><div style="font-size:28px;color:var(--gold);">${stats.totalXPEarned}</div><small>XP</small></div>
                </div>
                ${stats.currentTitle !== 'مبتدئ' ? `<span style="background:rgba(255,215,0,0.15);color:#ffd700;padding:4px 12px;border-radius:12px;">${stats.currentTitle}</span><br>` : ''}
                <code style="color:#ffd700;font-size:14px;letter-spacing:2px;">${stats.referralCode}</code>
                <br>
                <button onclick="window.chatooReferrals.shareReferralLink()" style="width:100%;margin-top:12px;background:var(--primary);border:none;color:#fff;padding:14px;border-radius:16px;font-weight:bold;cursor:pointer;">📤 مشاركة</button>
            </div>
        `;
    }
}

window.chatooReferrals = null;
document.addEventListener('DOMContentLoaded', () => { window.chatooReferrals = new ChatooReferrals(); });
