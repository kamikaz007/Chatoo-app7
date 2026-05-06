// chatoo-blockchain.js - FINAL FIXED VERSION
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
                <div style="text-align:right;color:#fff;">
                    <label style="color:#ffd700;">📥 عنوان المستلم:</label>
                    <input id="bc-recipient" type="text" placeholder="G..." style="width:100%;padding:12px;background:#1a1a1d;color:#fff;border:1px solid rgba(255,215,0,0.2);border-radius:12px;margin:8px 0;direction:ltr;font-family:monospace;font-size:11px;">
                    <label style="color:#ffd700;">💰 الكمية:</label>
                    <input id="bc-amount" type="number" step="0.01" min="0.01" placeholder="0.00" style="width:100%;padding:12px;background:#1a1a1d;color:#fff;border:1px solid rgba(255,215,0,0.2);border-radius:12px;margin:8px 0;direction:ltr;">
                    <label style="color:#ffd700;">📝 ملاحظة:</label>
                    <input id="bc-memo" placeholder="Chatoo" style="width:100%;padding:12px;background:#1a1a1d;color:#fff;border:1px solid rgba(255,215,0,0.2);border-radius:12px;margin:8px 0;direction:rtl;">
                    <p style="font-size:10px;opacity:0.5;text-align:center;">⚠️ Test-Pi فقط</p>
                </div>
            `,
            background: "#121214", color: "#fff",
            showCancelButton: true, confirmButtonText: "💸 دفع", confirmButtonColor: "#ffd700",
            preConfirm: () => {
                const recipient = document.getElementById('bc-recipient').value.trim();
                const amount = document.getElementById('bc-amount').value;
                const memo = document.getElementById('bc-memo').value || 'Chatoo';
                if (!recipient || !recipient.startsWith('G') || recipient.length !== 56) {
                    Swal.showValidationMessage('عنوان محفظة غير صحيح (يبدأ بـ G...)');
                    return false;
                }
                if (!amount || parseFloat(amount) <= 0) {
                    Swal.showValidationMessage('كمية غير صحيحة');
                    return false;
                }
                return { recipient, amount: parseFloat(amount), memo };
            }
        }).then(r => { if (r.isConfirmed) this.doPayment(r.value.recipient, r.value.amount, r.value.memo); });
    }

    async doPayment(recipient, amount, memo) {
        if (typeof Pi === 'undefined') {
            Swal.fire({ title: '⚠️', text: 'افتح من Pi Browser', icon: 'warning' });
            return;
        }

        // ✅ مصادقة واحدة فقط
        const auth = await Pi.authenticate(['payments', 'username'], (payment) => {
            console.log('Incomplete payment found:', payment);
        });

        if (!auth || !auth.user) {
            Swal.fire({ title: 'خطأ', text: 'فشل المصادقة', icon: 'error' });
            return;
        }

        const userId = auth.user.username;
        console.log('✅ Auth OK:', userId);

        // ✅ إنشاء الدفعة
        const payment = Pi.createPayment({
            amount: amount,
            memo: memo,
            metadata: {
                app: "Chatoo",
                userId: userId,
                recipient: recipient,
                timestamp: Date.now()
            }
        }, {
            // ✅ هذا هو المفتاح
            onReadyForServerApproval: (paymentId) => {
                console.log('✅ Approved:', paymentId);
            },
            onReadyForServerCompletion: (paymentId, txid) => {
                console.log('✅ TX:', txid);
                
                this.transactionHistory.unshift({
                    paymentId, txid, amount, memo, userId, recipient,
                    timestamp: Date.now(), status: 'completed'
                });
                if (this.transactionHistory.length > 50) this.transactionHistory = this.transactionHistory.slice(0, 50);
                localStorage.setItem('chatoo_tx_history', JSON.stringify(this.transactionHistory));

                Swal.fire({
                    title: '🎉 تم الدفع!',
                    html: `<p style="color:#ffd700;font-size:24px;">${amount} π</p><small>TX: ${txid}</small>`,
                    icon: 'success',
                    background: "#121214", color: "#fff"
                });
            },
            onCancel: () => Swal.fire({ title: 'تم الإلغاء', icon: 'info' }),
            onError: (error) => Swal.fire({ title: 'خطأ', text: error.message, icon: 'error' })
        });

        // ✅ انتظر الدفعة
        try {
            await payment;
        } catch (err) {
            console.error('Payment failed:', err);
            Swal.fire({ title: 'خطأ', text: err.message, icon: 'error' });
        }
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
    console.log('💰 Pi Payment Ready');
});
