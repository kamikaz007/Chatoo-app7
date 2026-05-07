// chatoo-blockchain.js – FINAL UI & PAYMENT INTEGRATION
// المسؤول: Kamikaz007

class ChatooBlockchain {
    constructor() {
        this.sdkReady = false;
        this.transactionHistory = JSON.parse(
            localStorage.getItem('chatoo_tx_history') || '[]'
        );
        this.horizonEndpoint = "https://api.testnet.minepi.com"; // Testnet Endpoint
    }

    initSDK() {
        if (typeof Pi !== 'undefined' && !this.sdkReady) {
            Pi.init({ version: "2.0", sandbox: true });
            this.sdkReady = true;
            console.log('✅ Pi SDK Ready');
        }
    }

    // --- وظيفة تحديث الواجهة (UI Bridge) ---
    async updateWalletUI() {
        console.log("🔄 Updating Wallet UI...");
        const statusText = document.querySelector('.wallet-header h2') || document.querySelector('.status-text');
        const balanceDisplay = document.querySelector('.balance-amount') || document.querySelector('.wallet-balance');
        const addressDisplay = document.querySelector('.wallet-address-text');

        try {
            // 1. المصادقة لجلب البيانات
            this.initSDK();
            const auth = await Pi.authenticate(['payments', 'username', 'wallet_address']);
            
            const address = auth.user.wallet_address;
            sessionStorage.setItem("pi_address", address);

            // 2. تحديث الحالة
            if (statusText) {
                statusText.innerText = "متصل بالشبكة";
                statusText.style.color = "#4caf50";
            }

            // 3. جلب الرصيد الحقيقي
            const accountData = await this.getAccountBalance(address);
            if (balanceDisplay) {
                balanceDisplay.innerText = `${accountData.balance.toFixed(2)} π`;
            }

            // 4. عرض جزء من العنوان
            if (addressDisplay) {
                addressDisplay.innerText = `${address.slice(0, 6)}...${address.slice(-6)}`;
            }

        } catch (e) {
            console.error("❌ UI Update Failed:", e);
            if (statusText) statusText.innerText = "غير متصل";
        }
    }

    async getAccountBalance(address) {
        try {
            const res = await fetch(`${this.horizonEndpoint}/accounts/${address}`);
            if (!res.ok) throw new Error('Account not found');
            const data = await res.json();
            const piBalance = data.balances?.find(b => b.asset_type === 'native');
            return {
                balance: parseFloat(piBalance?.balance || 0),
                address
            };
        } catch (e) {
            console.warn('Balance fetch failed:', e.message);
            return { balance: 0, address };
        }
    }

    renderTransferModal() {
        this.initSDK();
        Swal.fire({
            title: '💎 تحويل Pi (Testnet)',
            html: `
                <div style="text-align:right;color:#fff;">
                    <label style="color:#ffd700;">📥 عنوان المستلم:</label>
                    <input id="bc-recipient" type="text" placeholder="G..." 
                        style="width:100%;padding:12px;background:#1a1a1d;color:#fff;border:1px solid rgba(255,215,0,0.2);border-radius:12px;margin:8px 0;direction:ltr;font-family:monospace;font-size:11px;">
                    <label style="color:#ffd700;">💰 الكمية:</label>
                    <input id="bc-amount" type="number" step="0.01" placeholder="0.00"
                        style="width:100%;padding:12px;background:#1a1a1d;color:#fff;border:1px solid rgba(255,215,0,0.2);border-radius:12px;margin:8px 0;direction:ltr;">
                    <label style="color:#ffd700;">📝 ملاحظة:</label>
                    <input id="bc-memo" placeholder="Chatoo Payment"
                        style="width:100%;padding:12px;background:#1a1a1d;color:#fff;border:1px solid rgba(255,215,0,0.2);border-radius:12px;margin:8px 0;direction:rtl;">
                </div>
            `,
            background: "#121214",
            color: "#fff",
            showCancelButton: true,
            confirmButtonText: "💸 دفع",
            confirmButtonColor: "#ffd700",
            preConfirm: () => {
                const recipient = document.getElementById('bc-recipient').value.trim();
                const amount = document.getElementById('bc-amount').value;
                if (!recipient || recipient.length !== 56) {
                    Swal.showValidationMessage('عنوان محفظة غير صحيح');
                    return false;
                }
                return { recipient, amount: parseFloat(amount), memo: document.getElementById('bc-memo').value || 'Chatoo' };
            }
        }).then(r => { if (r.isConfirmed) this.doPayment(r.value.recipient, r.value.amount, r.value.memo); });
    }

    async doPayment(recipient, amount, memo) {
        if (typeof Pi === 'undefined') return;
        this.initSDK();

        Pi.createPayment({
            amount: amount,
            memo: memo,
            metadata: { app: "Chatoo", recipient }
        }, {
            onReadyForServerApproval: async (paymentId) => {
                await fetch('/.netlify/functions/payment-approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentId })
                });
            },
            onReadyForServerCompletion: async (paymentId, txid) => {
                await fetch('/.netlify/functions/payment-complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentId, txid })
                });
                
                Swal.fire({ title: '🎉 تم الدفع!', icon: 'success', background: "#121214", color: "#fff" });
                this.updateWalletUI(); // تحديث الرصيد بعد الدفع
            },
            onCancel: () => console.log("Payment cancelled"),
            onError: (error) => console.error("Payment error", error)
        });
    }
}

// إنشاء النسخة العالمية
const chatooBlock = new ChatooBlockchain();
window.chatooBlock = chatooBlock;

// التشغيل التلقائي عند فتح المحفظة
document.addEventListener('DOMContentLoaded', () => {
    // ربط زر "تحديث الرصيد"
    const refreshBtn = document.querySelector('.refresh-button') || document.evaluate("//button[contains(., 'تحديث الرصيد')]", document, null, XPathResult.ANY_TYPE, null).iterateNext();
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => chatooBlock.updateWalletUI());
    }
    
    // محاولة التحديث التلقائي بعد ثانيتين
    setTimeout(() => chatooBlock.updateWalletUI(), 2000);
});
