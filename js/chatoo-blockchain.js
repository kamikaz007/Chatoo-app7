// chatoo-blockchain.js - Final with Wallet Address Field
class ChatooBlockchain {
    constructor() {
        this.sdkReady = false;
        this.transactionHistory = JSON.parse(localStorage.getItem('chatoo_tx_history') || '[]');
    }

    initSDK() {
        if (typeof Pi !== 'undefined' && !this.sdkReady) {
            Pi.init({ version: "2.0", sandbox: true });
            this.sdkReady = true;
            console.log('✅ Pi SDK Ready');
        }
    }

    renderTransferModal() {
        this.initSDK();
        
        Swal.fire({
            title: '💎 تحويل Pi (Testnet)',
            html: `
                <div style="text-align:right; color:#fff;">
                    <label style="font-size:12px; color:#ffd700; display:block; margin-bottom:4px;">📥 عنوان المستلم (Pi Wallet):</label>
                    <input id="bc-recipient" type="text" placeholder="G..." 
                        style="width:100%; padding:12px; background:#1a1a1d; color:#fff; border:1px solid rgba(255,215,0,0.2); border-radius:12px; margin-bottom:12px; direction:ltr; font-family:monospace; font-size:11px;">
                    
                    <label style="font-size:12px; color:#ffd700; display:block; margin-bottom:4px;">💰 الكمية (Test-Pi):</label>
                    <input id="bc-amount" type="number" step="0.01" min="0.01" placeholder="0.00"
                        style="width:100%; padding:12px; background:#1a1a1d; color:#fff; border:1px solid rgba(255,215,0,0.2); border-radius:12px; margin-bottom:12px; direction:ltr;">
                    
                    <label style="font-size:12px; color:#ffd700; display:block; margin-bottom:4px;">📝 ملاحظة:</label>
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
                const recipient = document.getElementById('bc-recipient').value.trim();
                const amount = document.getElementById('bc-amount').value;
                const memo = document.getElementById('bc-memo').value || 'Chatoo Transfer';
                
                // التحقق من صحة عنوان المحفظة (يبدأ بـ G وطوله 56)
                if (!recipient || !recipient.startsWith('G') || recipient.length !== 56) {
                    Swal.showValidationMessage('الرجاء إدخال عنوان محفظة Pi صحيح (يبدأ بـ G...)');
                    return false;
                }
                
                if (!amount || parseFloat(amount) <= 0) {
                    Swal.showValidationMessage('الرجاء إدخال كمية صحيحة');
                    return false;
                }
                
                return { recipient, amount: parseFloat(amount), memo };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.doPayment(result.value.recipient, result.value.amount, result.value.memo);
            }
        });
    }

    async doPayment(recipient, amount, memo) {
        if (typeof Pi === 'undefined') {
            Swal.fire({
                title: '⚠️ Pi Browser مطلوب',
                text: 'يجب فتح التطبيق من Pi Browser الرسمي',
                icon: 'warning',
                background: "#121214", color: "#fff"
            });
            return;
        }

        try {
            Swal.fire({
                title: '🔐 جاري المصادقة...',
                html: '<p style="color:#fff;">يرجى الموافقة على صلاحية المدفوعات</p>',
                background: "#121214", color: "#fff",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            const auth = await Pi.authenticate(['payments', 'username'], (payment) => {
                console.log('Incomplete:', payment);
            });

            Swal.close();

            if (!auth || !auth.user) {
                throw new Error('فشل المصادقة');
            }

            const userId = auth.user.username;
            console.log('✅ Auth OK:', userId);
            console.log('📥 Recipient:', recipient);

            const paymentData = {
                amount: amount,
                memo: memo,
                metadata: {
                    app: "Chatoo",
                    userId: userId,
                    recipient: recipient,
                    timestamp: Date.now()
                }
            };

            const callbacks = {
                onReadyForServerApproval: function(paymentId) {
                    console.log('✅ Approved:', paymentId);
                    return Promise.resolve({ success: true, paymentId });
                },

                onReadyForServerCompletion: (paymentId, txid) => {
                    console.log('✅ Completed! TX:', txid);
                    
                    this.transactionHistory.unshift({
                        paymentId, txid, amount, memo, userId, recipient,
                        timestamp: Date.now(), status: 'completed'
                    });
                    
                    if (this.transactionHistory.length > 50) {
                        this.transactionHistory = this.transactionHistory.slice(0, 50);
                    }
                    localStorage.setItem('chatoo_tx_history', JSON.stringify(this.transactionHistory));

                    window.dispatchEvent(new CustomEvent('piPaymentComplete', {
                        detail: { amount, memo, txid, userId, recipient }
                    }));

                    if (window.db && window.chatoo?.state?.room) {
                        window.db.collection("rooms_v2").doc(window.chatoo.state.room)
                            .collection("m").add({
                                u: userId,
                                val: `💸 تم تحويل ${amount} Pi إلى ${recipient.slice(0,8)}... - ${memo}`,
                                type: 'gift', txid: txid,
                                t: firebase.firestore.FieldValue.serverTimestamp()
                            }).catch(() => {});
                    }

                    if (window.chatooNotif) {
                        window.chatooNotif.piReceived(amount, userId);
                    }

                    Swal.fire({
                        title: '🎉 تم الدفع بنجاح!',
                        html: `
                            <div style="text-align:center; color:#fff;">
                                <p style="font-size:18px;">تم تحويل</p>
                                <p style="color:#ffd700; font-size:36px; font-weight:900;">${amount} π</p>
                                <p style="font-size:11px; opacity:0.4;">إلى: ${recipient.slice(0,12)}...</p>
                                <p style="font-size:10px; opacity:0.3; word-break:break-all;">TX: ${txid}</p>
                            </div>
                        `,
                        icon: 'success',
                        background: "#121214", color: "#fff",
                        confirmButtonColor: "#ffd700"
                    });
                },

                onCancel: () => {
                    Swal.fire({ title: 'تم الإلغاء', icon: 'info' });
                },

                onError: (error) => {
                    console.error('❌ Error:', error);
                    Swal.fire({ title: 'خطأ', text: error.message || 'فشل', icon: 'error' });
                }
            };

            await Pi.createPayment(paymentData, callbacks);

        } catch (err) {
            console.error('❌ Failed:', err);
            Swal.fire({ title: 'خطأ', text: err.message || 'فشل', icon: 'error' });
        }
    }

    getTransactionHistory() { return this.transactionHistory; }
    
    clearHistory() {
        this.transactionHistory = [];
        localStorage.removeItem('chatoo_tx_history');
    }
}

const chatooBlock = new ChatooBlockchain();

document.addEventListener("DOMContentLoaded", () => {
    const nav = document.querySelector("nav");
    if (nav && !document.getElementById("btn-pi-pay")) {
        const btn = document.createElement("div");
        btn.id = "btn-pi-pay"; btn.className = "nav-btn";
        btn.innerHTML = "💸";
        btn.onclick = () => chatooBlock.renderTransferModal();
        nav.appendChild(btn);
    }
    console.log('💰 Pi Payment Ready | Admin: Kamikaz007');
});
