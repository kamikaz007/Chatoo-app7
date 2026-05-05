// chatoo-admin.js - لوحة تحكم المسؤول Kamikaz007
// تظهر فقط للمسؤول (kamikaz007)
// تمكن من التحكم بكل إعدادات التطبيق

class ChatooAdmin {
    constructor() {
        this.adminUsername = CHATOO_CONFIG.app.admin;
        this.isAdmin = false;
        this.currentTab = 'dashboard';
        this.venueOwners = JSON.parse(localStorage.getItem('chatoo_venue_owners') || '{}');
        this.init();
    }

    init() {
        // التحقق من صلاحيات المدير عند المصادقة
        this.checkAdminStatus();
        
        // الاستماع لأحداث المصادقة
        window.addEventListener('piAuthComplete', () => {
            this.checkAdminStatus();
        });
        
        console.log('⚙️ Admin System Ready');
    }

    checkAdminStatus() {
        if (window.chatooAuth) {
            this.isAdmin = window.chatooAuth.checkAdmin();
            if (this.isAdmin) {
                this._showAdminButton();
            }
        }
    }

    _showAdminButton() {
        const navBar = document.querySelector('nav');
        if (!navBar || document.getElementById('btn-admin-panel')) return;

        const adminBtn = document.createElement('div');
        adminBtn.id = 'btn-admin-panel';
        adminBtn.className = 'nav-btn';
        adminBtn.innerHTML = '⚙️';
        adminBtn.title = 'لوحة تحكم Kamikaz007';
        adminBtn.style.cssText = 'cursor:pointer;color:#ffd700;';
        adminBtn.onclick = () => this.showPanel();
        navBar.appendChild(adminBtn);
    }

    // ═══════════════════ عرض لوحة التحكم ═══════════════════
    showPanel() {
        if (!this.isAdmin) {
            Swal.fire({
                title: '⛔ غير مصرح',
                text: 'هذه اللوحة مخصصة للمسؤول Kamikaz007 فقط',
                icon: 'error',
                background: "#121214",
                color: "#fff"
            });
            return;
        }

        const tabs = [
            { id: 'dashboard', name: '📊 الرئيسية', icon: '📊' },
            { id: 'venues', name: '🏠 الأماكن', icon: '🏠' },
            { id: 'rewards', name: '🎁 المكافآت', icon: '🎁' },
            { id: 'achievements', name: '🏆 الإنجازات', icon: '🏆' },
            { id: 'shop', name: '🛍️ المتجر', icon: '🛍️' },
            { id: 'users', name: '👥 المستخدمين', icon: '👥' },
            { id: 'network', name: '🌐 الشبكة', icon: '🌐' },
            { id: 'settings', name: '⚙️ إعدادات', icon: '⚙️' }
        ];

        const tabsHtml = tabs.map(t => `
            <button onclick="window.chatooAdmin.switchTab('${t.id}')" 
                id="admin-tab-${t.id}"
                class="admin-tab ${this.currentTab === t.id ? 'active' : ''}"
                style="
                    background: ${this.currentTab === t.id ? 'var(--primary)' : 'var(--glass)'};
                    color: #fff;
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 10px 14px;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 12px;
                    white-space: nowrap;
                ">${t.icon} ${t.name}</button>
        `).join('');

        Swal.fire({
            title: '⚙️ لوحة تحكم Kamikaz007',
            html: `
                <div style="color:#fff; text-align:right; max-height:70vh; overflow-y:auto;">
                    <div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:12px; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.08); scrollbar-width:none;">
                        ${tabsHtml}
                    </div>
                    <div id="admin-content-area" style="min-height:300px;">
                        ${this._getDashboardContent()}
                    </div>
                </div>
            `,
            background: "#121214",
            color: "#fff",
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: 'إغلاق',
            cancelButtonColor: '#444',
            width: '90%',
            allowOutsideClick: true,
            didOpen: () => {
                this.currentTab = 'dashboard';
            }
        });
    }

    // ═══════════════════ تبديل التبويبات ═══════════════════
    switchTab(tabId) {
        this.currentTab = tabId;
        
        // تحديث الأنماط
        document.querySelectorAll('.admin-tab').forEach(btn => {
            btn.style.background = 'var(--glass)';
            btn.classList.remove('active');
        });
        const activeBtn = document.getElementById(`admin-tab-${tabId}`);
        if (activeBtn) {
            activeBtn.style.background = 'var(--primary)';
            activeBtn.classList.add('active');
        }

        // تحديث المحتوى
        const contentArea = document.getElementById('admin-content-area');
        if (contentArea) {
            switch (tabId) {
                case 'dashboard': contentArea.innerHTML = this._getDashboardContent(); break;
                case 'venues': contentArea.innerHTML = this._getVenuesContent(); break;
                case 'rewards': contentArea.innerHTML = this._getRewardsContent(); break;
                case 'achievements': contentArea.innerHTML = this._getAchievementsContent(); break;
                case 'shop': contentArea.innerHTML = this._getShopContent(); break;
                case 'users': contentArea.innerHTML = this._getUsersContent(); break;
                case 'network': contentArea.innerHTML = this._getNetworkContent(); break;
                case 'settings': contentArea.innerHTML = this._getSettingsContent(); break;
            }
        }
    }

    // ═══════════════════ محتوى الرئيسية ═══════════════════
    _getDashboardContent() {
        const xp = parseInt(localStorage.getItem('chatoo_xp')) || 0;
        const users = JSON.parse(localStorage.getItem('chatoo_local_referrals') || '[]');
        const venues = Object.keys(this.venueOwners).length;
        const txHistory = JSON.parse(localStorage.getItem('chatoo_tx_history') || '[]');

        return `
            <div style="text-align:center; margin-bottom:20px;">
                <h3 style="color:var(--gold);">👑 Kamikaz007</h3>
                <small style="opacity:0.5;">المسؤول العام للتطبيق</small>
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div style="background:var(--surface); padding:16px; border-radius:14px; text-align:center;">
                    <div style="font-size:32px;">🏠</div>
                    <div style="font-size:24px; font-weight:900; color:var(--gold);">${venues}</div>
                    <small>أماكن مُدارة</small>
                </div>
                <div style="background:var(--surface); padding:16px; border-radius:14px; text-align:center;">
                    <div style="font-size:32px;">👥</div>
                    <div style="font-size:24px; font-weight:900; color:var(--gold);">${users.length}</div>
                    <small>إحالات</small>
                </div>
                <div style="background:var(--surface); padding:16px; border-radius:14px; text-align:center;">
                    <div style="font-size:32px;">💎</div>
                    <div style="font-size:24px; font-weight:900; color:var(--gold);">${txHistory.length}</div>
                    <small>معاملات</small>
                </div>
                <div style="background:var(--surface); padding:16px; border-radius:14px; text-align:center;">
                    <div style="font-size:32px;">⭐</div>
                    <div style="font-size:24px; font-weight:900; color:var(--gold);">${xp}</div>
                    <small>نقاط XP</small>
                </div>
            </div>

            <div style="margin-top:16px; text-align:center;">
                <button onclick="window.chatooAdmin.exportData()" style="
                    background:var(--primary); color:#fff; border:none;
                    padding:12px 24px; border-radius:14px; cursor:pointer;
                    font-weight:bold; margin:4px;
                ">📥 تصدير البيانات</button>
                <button onclick="window.chatooAdmin.resetApp()" style="
                    background:var(--accent); color:#fff; border:none;
                    padding:12px 24px; border-radius:14px; cursor:pointer;
                    font-weight:bold; margin:4px;
                ">🔄 إعادة تعيين</button>
            </div>
        `;
    }

    // ═══════════════════ محتوى الأماكن ═══════════════════
    _getVenuesContent() {
        const venues = this.state?.venues || [
            { name: "Haj Mostapha", status: "active", owner: this.venueOwners["haj_mostapha"] || "" },
            { name: "Salle Des Fêtes Hawa", status: "active", owner: this.venueOwners["salle_hawa"] || "" },
            { name: "Café Bizerte", status: "live", owner: this.venueOwners["cafe_bizerte"] || "" },
            { name: "Restaurant El Manâr", status: "active", owner: this.venueOwners["el_manar"] || "" },
            { name: "Central Node", status: "sync", owner: this.venueOwners["central_node"] || "" },
            { name: "Node 007", status: "active", owner: this.venueOwners["node_007"] || "" }
        ];

        let html = `
            <h4 style="margin-bottom:12px;">🏠 إدارة الأماكن والمالكين</h4>
            <p style="font-size:11px; opacity:0.5; margin-bottom:16px;">
                عيّن اسم Pi حقيقي لكل مكان. سيظهر هذا الاسم كصاحب المكان في المحادثات.
            </p>
        `;

        venues.forEach(venue => {
            const venueId = venue.name.toLowerCase().replace(/\s+/g, '_');
            html += `
                <div style="background:var(--surface); padding:14px; border-radius:12px; margin-bottom:8px; border:1px solid rgba(255,255,255,0.05);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <b>${venue.name}</b>
                        <span style="font-size:10px; color:${venue.status === 'live' ? '#00ff88' : venue.status === 'sync' ? '#ffd700' : 'var(--primary)'};">
                            ${venue.status.toUpperCase()}
                        </span>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <input type="text" 
                            id="venue-owner-${venueId}" 
                            value="${this.venueOwners[venueId] || ''}" 
                            placeholder="اسم Pi للمالك (مثال: haj_mostapha)"
                            style="flex-grow:1; background:#1a1a1d; color:#fff; border:1px solid rgba(255,215,0,0.2); padding:8px 12px; border-radius:8px; font-size:12px; direction:ltr;">
                        <button onclick="window.chatooAdmin.saveVenueOwner('${venueId}')" style="
                            background:var(--gold); color:#000; border:none;
                            padding:8px 16px; border-radius:8px; cursor:pointer;
                            font-weight:bold; font-size:11px; white-space:nowrap;
                        ">💾 حفظ</button>
                    </div>
                </div>
            `;
        });

        return html;
    }

    saveVenueOwner(venueId) {
        const input = document.getElementById(`venue-owner-${venueId}`);
        if (!input) return;

        const ownerName = input.value.trim();
        this.venueOwners[venueId] = ownerName;
        localStorage.setItem('chatoo_venue_owners', JSON.stringify(this.venueOwners));

        if (window.chatooNotif) {
            window.chatooNotif.toast(`✅ تم حفظ مالك ${venueId}`);
        }

        // تحديث Firebase إذا متاح
        if (window.db) {
            window.db.collection('venues').doc(venueId).set({
                name: venueId,
                owner: ownerName,
                updatedBy: 'kamikaz007',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(() => {});
        }
    }

    // ═══════════════════ محتوى المكافآت ═══════════════════
    _getRewardsContent() {
        return `
            <h4 style="margin-bottom:12px;">🎁 إدارة المكافآت</h4>
            <p style="font-size:11px; opacity:0.5; margin-bottom:16px;">
                عدّل قيم المكافآت من هنا أو من ملف rewards-config.js
            </p>
            
            ${this._renderRewardInput('xpPerMessage', 'XP لكل رسالة', REWARDS_CONFIG.xp.message, 'xp')}
            ${this._renderRewardInput('xpPerTip', 'XP لكل إكرامية', REWARDS_CONFIG.xp.tip, 'xp')}
            ${this._renderRewardInput('dailyMinXP', 'الحد الأدنى للمكافأة اليومية', REWARDS_CONFIG.dailyReward.minXP, 'xp')}
            ${this._renderRewardInput('dailyMaxXP', 'الحد الأقصى للمكافأة اليومية', REWARDS_CONFIG.dailyReward.maxXP, 'xp')}
            ${this._renderRewardInput('referralPi', 'Pi لكل إحالة', REWARDS_CONFIG.referrals.basePiReward, 'pi')}
            ${this._renderRewardInput('referralXP', 'XP لكل إحالة', REWARDS_CONFIG.referrals.baseXPReward, 'xp')}
            
            <button onclick="window.chatooAdmin.saveRewards()" style="
                width:100%; background:var(--gold); color:#000; border:none;
                padding:14px; border-radius:14px; cursor:pointer;
                font-weight:bold; font-size:15px; margin-top:12px;
            ">💾 حفظ جميع المكافآت</button>
        `;
    }

    _renderRewardInput(id, label, value, type) {
        return `
            <div style="background:var(--surface); padding:12px; border-radius:10px; margin-bottom:8px; border:1px solid rgba(255,255,255,0.05);">
                <label style="font-size:12px; opacity:0.7;">${label}</label>
                <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
                    <input type="number" id="reward-${id}" value="${value}" step="0.01" min="0"
                        style="flex-grow:1; background:#1a1a1d; color:#fff; border:1px solid rgba(255,215,0,0.2); padding:8px 12px; border-radius:8px; font-size:14px; direction:ltr;">
                    <span style="color:var(--gold); font-weight:bold;">${type === 'pi' ? 'π' : 'XP'}</span>
                </div>
            </div>
        `;
    }

    saveRewards() {
        // حفظ القيم مؤقتاً في localStorage
        const rewards = {};
        document.querySelectorAll('[id^="reward-"]').forEach(input => {
            rewards[input.id] = parseFloat(input.value) || 0;
        });
        localStorage.setItem('chatoo_custom_rewards', JSON.stringify(rewards));
        
        if (window.chatooNotif) {
            window.chatooNotif.toast('✅ تم حفظ المكافآت');
        }
        
        Swal.fire({
            title: 'تم الحفظ',
            text: 'سيتم تطبيق القيم الجديدة عند إعادة تحميل التطبيق',
            icon: 'success',
            background: "#121214",
            color: "#fff",
            confirmButtonColor: "#ffd700"
        });
    }

    // ═══════════════════ محتويات أخرى ═══════════════════
    _getAchievementsContent() {
        const allAchievements = ACHIEVEMENTS_CONFIG.achievements;
        let html = `
            <h4 style="margin-bottom:12px;">🏆 إدارة الإنجازات</h4>
            <p style="font-size:11px; opacity:0.5; margin-bottom:16px;">
                عدّل ملف achievements-config.js للإضافة أو الحذف
            </p>
        `;

        allAchievements.forEach(a => {
            html += `
                <div style="background:var(--surface); padding:10px 14px; border-radius:10px; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
                    <span>${a.icon} ${a.name}</span>
                    <span style="color:var(--gold); font-size:12px;">+${a.xpReward} XP +${a.piReward} π</span>
                </div>
            `;
        });

        return html;
    }

    _getShopContent() {
        const products = SHOP_CONFIG.products;
        let html = `
            <h4 style="margin-bottom:12px;">🛍️ إدارة المتجر</h4>
            <p style="font-size:11px; opacity:0.5; margin-bottom:16px;">
                عدّل ملف shop-config.js للإضافة أو الحذف
            </p>
        `;

        products.forEach(p => {
            html += `
                <div style="background:var(--surface); padding:10px 14px; border-radius:10px; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
                    <span>${p.nameAr}</span>
                    <span style="color:var(--gold); font-size:12px;">${p.price} π</span>
                </div>
            `;
        });

        return html;
    }

    _getUsersContent() {
        return `
            <h4 style="margin-bottom:12px;">👥 إحصائيات المستخدمين</h4>
            <p style="font-size:11px; opacity:0.5; margin-bottom:16px;">
                البيانات تُجلب من Firebase Firestore
            </p>
            <div style="text-align:center; padding:40px;">
                <p style="opacity:0.5;">📊 لوحة تحليلات كاملة قريباً...</p>
            </div>
        `;
    }

    _getNetworkContent() {
        return `
            <h4 style="margin-bottom:12px;">🌐 حالة الشبكة</h4>
            <div id="network-status-check" style="text-align:center; padding:20px;">
                <button onclick="window.chatooAdmin.checkNetwork()" style="
                    background:var(--primary); color:#fff; border:none;
                    padding:12px 24px; border-radius:14px; cursor:pointer;
                    font-weight:bold;
                ">🔍 فحص الشبكة</button>
                <div id="network-result" style="margin-top:16px;"></div>
            </div>
        `;
    }

    async checkNetwork() {
        const resultDiv = document.getElementById('network-result');
        resultDiv.innerHTML = '<p style="color:var(--gold);">⏳ جاري الفحص...</p>';

        if (window.chatooBlock) {
            const status = await window.chatooBlock.checkNetworkStatus();
            resultDiv.innerHTML = `
                <div style="background:var(--surface); padding:14px; border-radius:12px; text-align:left;">
                    <p>🟢 الحالة: <b style="color:#00ff88;">${status.online ? 'متصل' : 'غير متصل'}</b></p>
                    <p>🌐 الشبكة: <b>${status.network.toUpperCase()}</b></p>
                    <p>📡 RPC: <code style="color:var(--gold); font-size:10px;">${status.rpcEndpoint}</code></p>
                </div>
            `;
        }
    }

    _getSettingsContent() {
        return `
            <h4 style="margin-bottom:12px;">⚙️ إعدادات التطبيق</h4>
            <div style="background:var(--surface); padding:14px; border-radius:12px; margin-bottom:8px;">
                <p><b>المسؤول:</b> ${this.adminUsername}</p>
                <p><b>الإصدار:</b> ${CHATOO_CONFIG.app.version}</p>
                <p><b>الشبكة:</b> ${CHATOO_CONFIG.app.network.toUpperCase()}</p>
            </div>
            <button onclick="window.chatooAdmin.exportData()" style="
                width:100%; background:var(--primary); color:#fff; border:none;
                padding:14px; border-radius:14px; cursor:pointer;
                font-weight:bold; margin-bottom:8px;
            ">📥 تصدير جميع البيانات</button>
            <button onclick="window.chatooAdmin.resetApp()" style="
                width:100%; background:var(--accent); color:#fff; border:none;
                padding:14px; border-radius:14px; cursor:pointer;
                font-weight:bold;
            ">🔄 إعادة تعيين التطبيق</button>
        `;
    }

    // ═══════════════════ وظائف مساعدة ═══════════════════
    exportData() {
        const data = {
            xp: localStorage.getItem('chatoo_xp'),
            inventory: localStorage.getItem('chatoo_inventory'),
            referrals: localStorage.getItem('chatoo_referrals'),
            txHistory: localStorage.getItem('chatoo_tx_history'),
            venueOwners: this.venueOwners,
            exportDate: new Date().toISOString(),
            exportedBy: 'kamikaz007'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chatoo-backup-${Date.now()}.json`;
        a.click();

        if (window.chatooNotif) {
            window.chatooNotif.toast('📥 تم تصدير البيانات');
        }
    }

    resetApp() {
        Swal.fire({
            title: '⚠️ تأكيد إعادة التعيين',
            text: 'سيتم مسح جميع البيانات المحلية. هل أنت متأكد؟',
            icon: 'warning',
            background: "#121214",
            color: "#fff",
            showCancelButton: true,
            confirmButtonText: 'نعم، إعادة تعيين',
            cancelButtonText: 'إلغاء',
            confirmButtonColor: '#ff4757'
        }).then(result => {
            if (result.isConfirmed) {
                localStorage.clear();
                sessionStorage.clear();
                Swal.fire({
                    title: 'تم إعادة التعيين',
                    text: 'سيتم إعادة تحميل التطبيق',
                    icon: 'success',
                    background: "#121214",
                    color: "#fff"
                }).then(() => location.reload());
            }
        });
    }

    // تحديث حالة الأماكن من الخريطة
    get venues() {
        if (window.chatooActions && window.chatooActions.state) {
            return window.chatooActions.state.venues || [];
        }
        return null;
    }
}

// ═══════════════════ تهيئة ═══════════════════
window.chatooAdmin = null;
document.addEventListener('DOMContentLoaded', () => {
    window.chatooAdmin = new ChatooAdmin();
});
