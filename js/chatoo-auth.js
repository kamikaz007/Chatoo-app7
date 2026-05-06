// chatoo-auth.js - Pi Network Authentication System
// المسؤول: Kamikaz007

class ChatooAuth {
    constructor() {
        this.currentUser = null;
        this.piUser = null;
        this.isAdmin = false;
        this.adminUsername = CHATOO_CONFIG.app.admin; // "kamikaz007"
        this.sessionExpiry = 24 * 60 * 60 * 1000; // 24 ساعة
        this.piInitialized = false;
        this.authInProgress = false;
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
     * تهيئة Pi SDK – تُعامل كـ Promise وتُنتظر بالكامل
     */
    async initPi() {
        if (this.piInitialized) return true;

        // إذا لم يكن SDK موجوداً (خارج Pi Browser)
        if (typeof Pi === 'undefined') {
            console.warn('⚠️ Pi SDK غير متوفر - استخدم Pi Browser');
            return false;
        }

        return new Promise((resolve) => {
            try {
                Pi.init({ version: '2.0', sandbox: true });
                // Pi.init ليس وعداً حقيقياً، ننتظر حتى يصبح Pi.authenticate متاحاً
                let attempts = 0;
                const checkReady = setInterval(() => {
                    attempts++;
                    if (typeof Pi !== 'undefined' && typeof Pi.authenticate === 'function') {
                        clearInterval(checkReady);
                        this.piInitialized = true;
                        resolve(true);
                    } else if (attempts > 50) {
                        clearInterval(checkReady);
                        resolve(false);
                    }
                }, 100);
            } catch (e) {
                console.error('Pi.init failed:', e);
                resolve(false);
            }
        });
    }

    /**
     * مصادقة المستخدم عبر Pi Network – تستخدم نطاق username فقط
     */
    async authenticate() {
        if (this.authInProgress) return null;
        this.authInProgress = true;

        try {
            // الخطوة 1: انتظار تهيئة Pi SDK بالكامل
            const initialized = await this.initPi();
            if (!initialized) {
                return this._fallbackAuth();
            }

            // الخطوة 2: طلب المصادقة بنطاق username فقط
            const authResult = await Pi.authenticate(
                ['username'],
                this._onIncompletePayment.bind(this)
            );

            if (authResult && authResult.user) {
                const accessToken = authResult.accessToken;

                // الخطوة 3: إرسال accessToken إلى الخادم للتحقق منه
                const verified = await this._verifyTokenOnServer(accessToken);
                if (!verified) {
                    console.error('❌ فشل التحقق من الرمز في الخادم');
                    return this._fallbackAuth();
                }

                // الخطوة 4: بناء كائن المستخدم بعد التحقق الناجح
                this.piUser = {
                    username: authResult.user.username,
                    uid: authResult.user.uid,
                    accessToken: accessToken,
                    verified: true
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
        } finally {
            this.authInProgress = false;
        }

        return this._fallbackAuth();
    }

    /**
     * إرسال accessToken إلى الخادم للتحقق عبر GET https://api.minepi.com/v2/me
     */
    async _verifyTokenOnServer(accessToken) {
        try {
            const response = await fetch('/.netlify/functions/verify-pi-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken })
            });

            if (response.ok) {
                const data = await response.json();
                return data.valid === true && data.user !== null;
            }
            return false;
        } catch (error) {
            console.error('Server verification failed:', error);
            return false;
        }
    }

    /**
     * مصادقة احتياطية (بدون Pi Browser)
     */
    _fallbackAuth() {
        this.authInProgress = false;
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
     * هل المستخدم موثّق عبر Pi؟
     */
    isPiAuthenticated() {
        return !!this.piUser?.verified;
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

        // تحديث زر تسجيل الدخول
        const signInBtn = document.getElementById('btn-pi-signin');
        const headerSection = document.querySelector('.header-profile-section');
        
        if (this.isPiAuthenticated()) {
            // مخفي زر تسجيل الدخول، إظهار الملف الشخصي
            if (signInBtn) signInBtn.style.display = 'none';
            if (headerSection) headerSection.style.display = 'flex';
        } else {
            // إظهار زر تسجيل الدخول، إخفاء الملف الشخصي
            if (signInBtn) signInBtn.style.display = 'flex';
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
        this.piInitialized = false;
        this.isAdmin = false;
        location.reload();
    }
}

// تهيئة النظام
window.chatooAuth = null;
document.addEventListener('DOMContentLoaded', () => {
    window.chatooAuth = new ChatooAuth();
    console.log('🔐 Chatoo Pi Auth System Ready');
    
    // المصادقة التلقائية عند التحميل
    setTimeout(() => {
        if (window.chatooAuth && !window.chatooAuth.isPiAuthenticated()) {
            window.chatooAuth.authenticate().catch(() => {
                // فشل صامت – يبقى المستخدم ضيفاً
            });
        }
    }, 1000);
});
