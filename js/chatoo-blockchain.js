// chatoo-blockchain.js - Final Fixed Version
class ChatooBlockchain {
    constructor() {
        this.sdkReady = false;
        this.transactionHistory = JSON.parse(localStorage.getItem('chatoo_tx_history') || '[]');
        this.initPiSDK();
    }

    initPiSDK() {
        if (typeof Pi !== 'undefined') {
            Pi.init({ version: "2.0", sandbox: true });
            this.sdkReady = true;
            console.log('✅ Pi SDK Ready');
        }
    }

    renderTransferModal() {
        Swal.fire({
            title: '💎 تحويل Pi (Testnet)',
            html: `
                <div style="color:#fff;text-align:right;">
                    <label style="color:#ffd700;">الكمية:</label>
                    <input id="bc-amount" type="number" step="0.01" min="0.01" class="swal2-input" style="background:#1a1a1d;color:#fff;">
                    <label style="color:#ffd700;">ملاحظة:</label>
                    <input id="bc-memo" class="swal2-input" placeholder="Chatoo" style="background:#1a1a1d;color:#fff;">
                </div>
            `,
            background: "#121214", color: "#fff",
            showCancelButton: true, confirmButtonText: "💸 دفع", confirmButtonColor: "#ffd700",
            preConfirm: () => {
                const a = document.getElementById('bc-amount').value;
                if (!a || parseFloat(a) <= 0) { Swal.showValidationMessage('كمية غير صحيحة'); return false; }
                return { amount: parseFloat(a), memo: document.getElementById('bc-memo').value || 'Chatoo' };
            }
        }).then(r => { if (r.isConfirmed) this.doPayment(r.value.amount, r.value.memo); });
    }

    async doPayment(amount, memo) {
        if (typeof Pi === 'undefined') {
            Swal.fire({ title: '⚠️', text: 'افتح من Pi Browser', icon: 'warning' });
            return;
        }

        try {
            // ✅ خطوة 1: المصادقة
            const auth = await Pi.authenticate(['payments', 'username'], () => {});
            
            if (!auth || !auth.user) {
                throw new Error('فشل المصادقة');
            }

            // ✅ خطوة 2: إنشاء الدفعة مع callbacks صحيحة
            await Pi.createPayment({
                amount: amount,
                memo: memo,
                metadata: { app: "Chatoo", userId: auth.user.username }
            }, {
                // ✅ يجب أن تكون دالة عادية وليست async
                onReadyForServerApproval: function(paymentId) {
                    console.log('✅ Approved:', paymentId);
                },
                
                onReadyForServerCompletion: (paymentId, txid) => {
                    console.log('✅ Completed:', txid);
                    
                    this.transactionHistory.unshift({
                        paymentId, txid, amount, memo, timestamp: Date.now()
                    });
                    localStorage.setItem('chatoo_tx_history', JSON.stringify(this.transactionHistory));

                    Swal.fire({
                        title: '🎉 تم الدفع!',
                        html: `<p style="color:#ffd700;font-size:24px;">${amount} π</p>`,
                        icon: 'success',
                        background: "#121214", color: "#fff"
                    });
                },
                
                onCancel: (paymentId) => {
                    Swal.fire({ title: 'تم الإلغاء', icon: 'info' });
                },
                
                onError: (error) => {
                    Swal.fire({ title: 'خطأ', text: error.message || 'فشل الدفع', icon: 'error' });
                }
            });

        } catch (err) {
            console.error('Payment error:', err);
            Swal.fire({ title: 'خطأ', text: err.message || 'فشل', icon: 'error' });
        }
    }
}

const chatooBlock = new ChatooBlockchain();

document.addEventListener("DOMContentLoaded", () => {
    const nav = document.querySelector("nav");
    if (nav && !document.getElementById("btn-pi-pay")) {
        const btn = document.createElement("div");
        btn.id = "btn-pi-pay"; btn.className = "nav-btn";
        btn.innerHTML = "💸"; btn.onclick = () => chatooBlock.renderTransferModal();
        nav.appendChild(btn);
    }
});
