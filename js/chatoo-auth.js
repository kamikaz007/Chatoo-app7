// chatoo-auth.js - نظام المصادقة مع Pi Network
// يجلب الأسماء الحقيقية من Pi Network
// المسؤول: Kamikaz007

class ChatooAuth {
    constructor() {
        this.currentUser = null;
        this.piUser = null;
        this.isAdmin = false;
        this.adminUsername = CHATOO_CONFIG.app.admin; // "kamikaz007"
        this.sessionExpiry = 24 * 60 * 60 * 1000; // 24 ساعة
        this.init();
    }

    init() {
        // استعادة الجلسة السابقة
        const savedSession = sessionStorage.getItem('chatoo_pi_session');
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                if (Date.now() - session.timestamp < this.sessionExpiry) {
                    this.piUser = session.user;
                    this.currentUser = session.user.username;
                    this.isAdmin = (this.currentUser === this.adminUsername);
                    this._updateUI();
                } else {
                    sessionStorage.removeItem('chatoo_pi_session');
                }
            } catch (e) {
                sessionStorage.removeItem('chatoo_pi_session');
            }
        }
    }

    /**
     * مصادقة المستخدم عبر Pi Network
     * تجلب الاسم الحقيقي من Pi
     */
    async authenticate() {
        if (typeof Pi === 'undefined') {
            console.warn('⚠️ Pi SDK غير متوفر - استخدم Pi Browser');
            return this._fallbackAuth();
        }

        try {
            // طلب مصادقة من Pi Network
            const authResult = await Pi.authenticate(
                ['username', 'payments'],
                this._onIncompletePayment.bind(this)
            );

            if (authResult && authResult.user) {
                this.piUser = {
                    username: authResult.user.username,  // الاسم الحقيقي من Pi
                    uid: authResult.user.uid,
                    accessToken: authResult.accessToken,
                    walletAddress: authResult.user.wallet_address || null
                };

                this.currentUser = authResult.user.username;
                this.isAdmin = (this.currentUser === this.adminUsername);

                // حفظ الجلسة
                sessionStorage.setItem('chatoo_pi_session', JSON.stringify({
                    user: this.piUser,
                    timestamp: Date.now()
                }));

                this._updateUI();
                
                if (window.chatooNotif) {
                    window.chatooNotif.toast(`👋 مرحباً ${this.currentUser}!`);
                }

                return this.piUser;
            }
        } catch (error) {
            console.error('❌ Pi Auth Error:', error);
            return this._fallbackAuth();
        }
    }

    /**
     * مصادقة احتياطية (بدون Pi Browser)
     */
    _fallbackAuth() {
        const localUser = localStorage.getItem('chatoo_local_user');
        if (localUser) {
            this.currentUser = localUser;
        } else {
            this.currentUser = 'Guest_' + Math.random().toString(36).substring(2, 6);
            localStorage.setItem('chatoo_local_user', this.currentUser);
        }
        this.isAdmin = (this.currentUser === this.adminUsername);
        this._updateUI();
        return { username: this.currentUser, uid: this.currentUser };
    }

    /**
     * الحصول على الاسم الحقيقي للمستخدم
     */
    getRealUsername() {
        return this.piUser?.username || this.currentUser || 'Guest';
    }

    /**
     * التحقق من صلاحيات المدير
     */
    checkAdmin() {
        return this.isAdmin;
    }

    /**
     * طلب اسم مستخدم من Pi (لأصحاب الأماكن)
     */
    async getPiUsernameForVenue(venueId) {
        if (!this.piUser) {
            await this.authenticate();
        }
        return this.piUser?.username || null;
    }

    /**
     * تحديث واجهة المستخدم بعد المصادقة
     */
    _updateUI() {
        // تحديث الاسم في الهيدر
        const displayName = document.getElementById('display-name');
        if (displayName) {
            displayName.textContent = this.getRealUsername();
        }

        // إظهار/إخفاء لوحة المدير
        if (this.isAdmin) {
            this._showAdminEntry();
        }
    }

    /**
     * إظهار زر لوحة التحكم للمدير
     */
    _showAdminEntry() {
        // إضافة زر المدير في شريط التنقل
        const navBar = document.querySelector('nav');
        if (navBar && !document.getElementById('btn-admin-panel')) {
            const adminBtn = document.createElement('div');
            adminBtn.id = 'btn-admin-panel';
            adminBtn.className = 'nav-btn';
            adminBtn.innerHTML = '⚙️';
            adminBtn.title = 'لوحة تحكم Kamikaz007';
            adminBtn.style.cursor = 'pointer';
            adminBtn.onclick = () => {
                if (window.chatooAdmin) {
                    window.chatooAdmin.showPanel();
                }
            };
            navBar.appendChild(adminBtn);
        }
    }

    /**
     * معالجة المدفوعات غير المكتملة
     */
    _onIncompletePayment(payment) {
        console.warn('⚠️ معاملة غير مكتملة:', payment);
        if (window.chatooBlock) {
            window.chatooBlock.onIncompletePaymentFound(payment);
        }
    }

    /**
     * تسجيل الخروج
     */
    logout() {
        sessionStorage.removeItem('chatoo_pi_session');
        localStorage.removeItem('chatoo_local_user');
        this.currentUser = null;
        this.piUser = null;
        this.isAdmin = false;
        location.reload();
    }
}

// تهيئة النظام
window.chatooAuth = null;
document.addEventListener('DOMContentLoaded', () => {
    window.chatooAuth = new ChatooAuth();
    console.log('🔐 Chatoo Auth System Ready');
});
