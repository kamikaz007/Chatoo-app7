// chatoo-blockchain.js - Final Working Version
class ChatooBlockchain {
    constructor() {
        this.network = localStorage.getItem("chatoo_bc_network") || "testnet";
        this.sdkReady = false;
        this.transactionHistory = JSON.parse(localStorage.getItem('chatoo_tx_history') || '[]');
        this.initPiSDK();
    }

    initPiSDK() {
        const tryInit = () => {
            if (typeof Pi !== 'undefined') {
                Pi.init({ version: "2.0", sandbox: true });
                this.sdkReady = true;
                console.log('✅ Pi SDK Ready - Testnet');
                const dot = document.getElementById('rpc-dot');
                if (dot) dot.classList.add('rpc-active');
            }
        };
        document.readyState === "complete" ? tryInit() : window.addEventListener('load', tryInit);
    }

    toggleNetwork(net) {
        this.network = net;
        localStorage.setItem("chatoo_bc_network", net);
        if (typeof Pi !== 'undefined') Pi.init({ version: "2.0", sandbox: net === 'testnet' });
    }

    renderTransferModal() {
        Swal.fire({
            title: '💎 تحويل Pi (Testnet)',
            html: `
                <div style="color:#fff; text-align:right;">
                    <label style="color:#ffd700;">الكمية (Pi):</label>
                    <input id="bc-amount" type="number" step="0.01" min="0.01" class="swal2-input" 
                        style="background:#1a1a1d; color:#fff;">
                    <label style="color:#ffd700;">ملاحظة:</label>
                    <input id="bc-memo" class="swal2-input" placeholder="Chatoo" 
                        style="background:#1a1a1d; color:#fff;">
                    <p style="font-size:10px; opacity:0.5; margin-top:8px;">Testnet - Pi اختبارية</p>
                </div>
            `,
            background: "#121214", color: "#fff",
            showCancelButton: true, confirmButtonText: "💸 دفع", confirmButtonColor: "#ffd700",
            preConfirm: () => {
                const a = document.getElementById('bc-amount').value;
                if (!a || parseFloat(a) <= 0) { Swal.showValidationMessage('كمية غير صحيحة'); return false; }
                return { amount: parseFloat(a), memo: document.getElementById('bc-memo').value || 'Chatoo' };
            }
        }).then(r => { if (r.isConfirmed) this.createPayment(r.value.amount, r.value.memo); });
    }

    async createPayment(amount, memo) {
        if (typeof Pi === 'undefined') {
            Swal.fire({ title: '⚠️ Pi Browser', text: 'افتح من Pi Browser', icon: 'warning' });
            return;
        }

        try {
            // مصادقة
            const auth = await Pi.authenticate(['payments', 'username'], () => {});
            const userId = auth?.user?.username || 'user';
            console.log('✅ Auth:', userId);

            // إنشاء الدفعة
            const payment = await Pi.createPayment({
                amount: amount,
                memo: memo,
                metadata: { app: "Chatoo", userId, timestamp: Date.now() }
            }, {
                // ✅ هذا هو المهم - must call resolve
                onReadyForServerApproval: (paymentId) => {
                    console.log('✅ Approved:', paymentId);
                },
                onReadyForServerCompletion: (paymentId, txid) => {
                    console.log('✅ Completed:', txid);
                    
                    this.transactionHistory.unshift({
                        paymentId, txid, amount, memo, userId, 
                        timestamp: Date.now(), status: 'completed'
                    });
                    if (this.transactionHistory.length > 50) this.transactionHistory = this.transactionHistory.slice(0, 50);
                    localStorage.setItem('chatoo_tx_history', JSON.stringify(this.transactionHistory));

                    Swal.fire({
                        title: '🎉 تم الدفع!',
                        html: `<p style="color:#ffd700; font-size:24px;">${amount} π</p><small style="opacity:0.5;">TX: ${txid}</small>`,
                        icon: 'success',
                        background: "#121214", color: "#fff"
                    });
                },
                onCancel: (paymentId) => {
                    Swal.fire({ title: 'تم الإلغاء', icon: 'info' });
                },
                onError: (error) => {
                    Swal.fire({ title: 'خطأ', text: error.message, icon: 'error' });
                }
            });

        } catch (err) {
            console.error('Payment error:', err);
            Swal.fire({ title: 'خطأ', text: err.message, icon: 'error' });
        }
    }

    onIncompletePaymentFound(payment) {
        console.warn('Incomplete:', payment);
    }
}

const chatooBlock = new ChatooBlockchain();

document.addEventListener("DOMContentLoaded", () => {
    const nav = document.querySelector("nav");
    if (nav && !document.getElementById("btn-transfer")) {
        const btn = document.createElement("div");
        btn.id = "btn-transfer"; btn.className = "nav-btn";
        btn.innerHTML = "💸"; btn.title = "تحويل Pi";
        btn.onclick = () => chatooBlock.renderTransferModal();
        nav.appendChild(btn);
    }
});
