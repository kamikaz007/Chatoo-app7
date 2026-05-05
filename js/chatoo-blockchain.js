// chatoo-blockchain.js - Final Fixed Version
// Pi Network Testnet Payment System
// المسؤول: Kamikaz007

class ChatooBlockchain {
    constructor() {
        this.sdkReady = false;
        this.transactionHistory = JSON.parse(localStorage.getItem('chatoo_tx_history') || '[]');
    }

    initSDK() {
        if (typeof Pi !== 'undefined' && !this.sdkReady) {
            Pi.init({ version: "2.0", sandbox: true });
            this.sdkReady = true;
            console.log('✅ Pi SDK Ready - Testnet Mode');
            
            const rpcDot = document.getElementById('rpc-dot');
            if (rpcDot) rpcDot.classList.add('rpc-active');
            
            if (window.chatooNotif) {
                window.chatooNotif.toast('🥧 Pi Testnet جاهز');
            }
        }
    }

    renderTransferModal() {
        this.initSDK();
        
        Swal.fire({
            title: '💎 تحويل Pi (Testnet)',
            html: `
                <div style="text-align:right; color:#fff;">
                    <label style="font-size:12px; color:#ffd700; display:block; margin-bottom:4px;">الكمية (Test-Pi):</label>
                    <input id="bc-amount" type="number" step="0.01" min="0.01" placeholder="0.00"
                        style="width:100%; padding:12px; background:#1a1a1d; color:#fff; border:1px solid rgba(255,215,0,0.2); border-radius:12px; margin-bottom:12px; direction:ltr;">
                    
                    <label style="font-size:12px; color:#ffd700; display:block; margin-bottom:4px;">ملاحظة:</label>
                    <input id="bc-memo" placeholder="Chatoo Transfer"
                        style="width:100%; padding:12px; background:#1a1a1d; color:#fff; border:1px solid rgba(255,215,0,0.2); border-radius:12px; margin-bottom:12px; direction:rtl;">
                    
                    <p style="font-size:10px; opacity:0.5; text-align:center; margin-top:8px;">
                        ⚠️ Test-Pi فقط - ليست عملة حقيقية
                    </p>
                </div>
            `,
            background: "#121214",
            color: "#fff",
            showCancelButton: true,
            confirmButtonText: "💸 تأكيد الدفع",
            cancelButtonText: "إلغاء",
            confirmButtonColor: "#ffd700",
            cancelButtonColor: "#444",
            preConfirm: () => {
                const amount = document.getElementById('bc-amount').value;
                const memo = document.getElementById('bc-memo').value || 'Chatoo Transfer';
                
                if (!amount || parseFloat(amount) <= 0) {
                    Swal.showValidationMessage('الرجاء إدخال كمية صحيحة');
                    return false;
                }
                
                return { amount: parseFloat(amount), memo };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.doPayment(result.value.amount, result.value.memo);
            }
        });
    }

    async doPayment(amount, memo) {
        if (typeof Pi === 'undefined') {
            Swal.fire({
                title: '⚠️ Pi Browser مطلوب',
                text: 'يجب فتح التطبيق من Pi Browser الرسمي',
                icon: 'warning',
                background: "#121214",
                color: "#fff",
                confirmButtonColor: "#ffd700",
                confirmButtonText: "حسناً"
            });
            return;
        }

        try {
            // ✅ الخطوة 1: المصادقة مع صلاحية payments
            Swal.fire({
                title: '🔐 جاري المصادقة...',
                html: '<p style="color:#fff;">يرجى الموافقة على صلاحية المدفوعات</p>',
                background: "#121214",
                color: "#fff",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            const auth = await Pi.authenticate(
                ['payments', 'username'],
                (incompletePayment) => {
                    console.log('⚠️ معاملة غير مكتملة:', incompletePayment);
                }
            );

            Swal.close();

            if (!auth || !auth.user) {
                throw new Error('فشل المصادقة - لم يتم الحصول على الصلاحيات');
            }

            const userId = auth.user.username;
            console.log('✅ مصادقة ناجحة:', userId);

            // ✅ الخطوة 2: إنشاء الدفعة
            const paymentData = {
                amount: amount,
                memo: memo,
                metadata: {
                    app: "Chatoo",
                    userId: userId,
                    timestamp: Date.now(),
                    version: "2.0.0"
                }
            };

            const callbacks = {
                // ✅ هذا هو المفتاح: دالة عادية ترجع Promise.resolve
                onReadyForServerApproval: function(paymentId) {
                    console.log('✅ Server Approved:', paymentId);
                    return Promise.resolve({ 
                        success: true, 
                        paymentId: paymentId 
                    });
                },

                onReadyForServerCompletion: (paymentId, txid) => {
                    console.log('🎉 Payment Completed! TX:', txid);
                    
                    // حفظ المعاملة محلياً
                    this.transactionHistory.unshift({
                        paymentId: paymentId,
                        txid: txid,
                        amount: amount,
                        memo: memo,
                        userId: userId,
                        timestamp: Date.now(),
                        status: 'completed'
                    });
                    
                    // حد أقصى 50 معاملة
                    if (this.transactionHistory.length > 50) {
                        this.transactionHistory = this.transactionHistory.slice(0, 50);
                    }
                    localStorage.setItem('chatoo_tx_history', JSON.stringify(this.transactionHistory));

                    // إشعار حدث للموديولات الأخرى
                    window.dispatchEvent(new CustomEvent('piPaymentComplete', {
                        detail: { 
                            amount: amount, 
                            memo: memo, 
                            txid: txid, 
                            userId: userId 
                        }
                    }));

                    // إضافة رسالة في المحادثة إذا كان المستخدم في غرفة
                    if (window.db && window.chatoo && window.chatoo.state && window.chatoo.state.room) {
                        try {
                            window.db.collection("rooms_v2")
                                .doc(window.chatoo.state.room)
                                .collection("m")
                                .add({
                                    u: userId,
                                    val: `💸 تم تحويل ${amount} Pi - ${memo}`,
                                    type: 'gift',
                                    txid: txid,
                                    t: firebase.firestore.FieldValue.serverTimestamp()
                                });
                        } catch (e) {
                            console.warn('Could not add gift message:', e);
                        }
                    }

                    // إشعار للمستخدم
                    if (window.chatooNotif) {
                        window.chatooNotif.piReceived(amount, 'Pi Network');
                    }

                    // عرض نجاح الدفع
                    Swal.fire({
                        title: '🎉 تم الدفع بنجاح!',
                        html: `
                            <div style="text-align:center; color:#fff;">
                                <p style="font-size:18px;">تم تحويل</p>
                                <p style="color:#ffd700; font-size:36px; font-weight:900; margin:8px 0;">${amount} π</p>
                                <p style="font-size:11px; opacity:0.4; word-break:break-all; margin-top:12px;">
                                    TX: ${txid}
                                </p>
                            </div>
                        `,
                        icon: 'success',
                        background: "#121214",
                        color: "#fff",
                        confirmButtonColor: "#ffd700",
                        confirmButtonText: "🚀 ممتاز!"
                    });
                },

                onCancel: (paymentId) => {
                    console.log('❌ Payment Cancelled:', paymentId);
                    Swal.fire({
                        title: 'تم الإلغاء',
                        text: 'لم تتم عملية الدفع',
                        icon: 'info',
                        background: "#121214",
                        color: "#fff",
                        confirmButtonColor: "#ffd700"
                    });
                },

                onError: (error, payment) => {
                    console.error('❌ Payment Error:', error, payment);
                    Swal.fire({
                        title: 'خطأ في الدفع',
                        text: error.message || 'حدث خطأ غير متوقع أثناء الدفع',
                        icon: 'error',
                        background: "#121214",
                        color: "#fff",
                        confirmButtonColor: "#ffd700"
                    });
                }
            };

            // تنفيذ الدفع
            await Pi.createPayment(paymentData, callbacks);

        } catch (err) {
            console.error('❌ Payment Failed:', err);
            Swal.fire({
                title: 'خطأ',
                text: err.message || 'فشلت عملية الدفع',
                icon: 'error',
                background: "#121214",
                color: "#fff",
                confirmButtonColor: "#ffd700"
            });
        }
    }

    // الحصول على سجل المعاملات
    getTransactionHistory() {
        return this.transactionHistory;
    }

    // مسح سجل المعاملات
    clearHistory() {
        this.transactionHistory = [];
        localStorage.removeItem('chatoo_tx_history');
    }
}

// ═══════════════════ تهيئة النظام ═══════════════════
const chatooBlock = new ChatooBlockchain();

// إضافة زر الدفع في شريط التنقل
document.addEventListener("DOMContentLoaded", () => {
    const navBar = document.querySelector("nav");
    if (navBar && !document.getElementById("btn-pi-pay")) {
        const payBtn = document.createElement("div");
        payBtn.id = "btn-pi-pay";
        payBtn.className = "nav-btn";
        payBtn.innerHTML = "💸";
        payBtn.title = "تحويل Pi";
        payBtn.style.cursor = "pointer";
        payBtn.onclick = () => chatooBlock.renderTransferModal();
        navBar.appendChild(payBtn);
    }
    
    console.log('💰 Pi Payment System Ready');
    console.log('   Mode: Testnet (sandbox)');
    console.log('   Admin: Kamikaz007');
});
