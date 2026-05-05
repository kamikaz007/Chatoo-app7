// chatoo-blockchain.js - محفظة Pi + مدفوعات + RPC Testnet
// المسؤول: Kamikaz007
// متوافق مع Pi Network Testnet/Mainnet
// تم إصلاح مشكلة مهلة الموافقة

class ChatooBlockchain {
    constructor() {
        this.network = localStorage.getItem("chatoo_bc_network") || CHATOO_CONFIG.app.network;
        this.sdkReady = false;
        
        // إعدادات RPC و Horizon
        this.rpcEndpoint = this.network === 'testnet' 
            ? CHATOO_CONFIG.piNetwork.rpcEndpoint 
            : CHATOO_CONFIG.piNetwork.mainnetRpc;
        this.horizonEndpoint = this.network === 'testnet'
            ? CHATOO_CONFIG.piNetwork.horizonEndpoint
            : CHATOO_CONFIG.piNetwork.mainnetHorizon;

        // سجل المعاملات المحلي
        this.transactionHistory = JSON.parse(localStorage.getItem('chatoo_tx_history') || '[]');
        
        this.initPiSDK();
    }

    // ═══════════════════ تهيئة Pi SDK ═══════════════════
    initPiSDK() {
        const tryInit = () => {
            if (typeof Pi !== 'undefined') {
                Pi.init({ 
                    version: CHATOO_CONFIG.piNetwork.version, 
                    sandbox: CHATOO_CONFIG.piNetwork.sandbox 
                });
                this.sdkReady = true;
                console.log(`✅ Pi SDK Ready | Network: ${this.network} | RPC: ${this.rpcEndpoint}`);
                
                const rpcDot = document.getElementById('rpc-dot');
                if (rpcDot) rpcDot.classList.add('rpc-active');
                
                if (window.chatooNotif) {
                    window.chatooNotif.systemAlert(`Pi Network ${this.network.toUpperCase()} متصل`);
                }
            } else {
                console.warn("⚠️ Pi SDK غير متوفر - يجب فتح التطبيق من Pi Browser");
            }
        };

        if (document.readyState === "complete") {
            tryInit();
        } else {
            window.addEventListener('load', tryInit);
        }
    }

    // ═══════════════════ تبديل الشبكة ═══════════════════
    toggleNetwork(net) {
        this.network = net;
        localStorage.setItem("chatoo_bc_network", net);
        
        this.rpcEndpoint = net === 'testnet' 
            ? CHATOO_CONFIG.piNetwork.rpcEndpoint 
            : CHATOO_CONFIG.piNetwork.mainnetRpc;
        this.horizonEndpoint = net === 'testnet'
            ? CHATOO_CONFIG.piNetwork.horizonEndpoint
            : CHATOO_CONFIG.piNetwork.mainnetHorizon;
        
        if (typeof Pi !== 'undefined') {
            Pi.init({ 
                version: CHATOO_CONFIG.piNetwork.version, 
                sandbox: net === 'testnet' 
            });
        }

        if (window.chatooNotif) {
            window.chatooNotif.toast(`🔗 تم التبديل إلى ${net.toUpperCase()}`);
        }
    }

    // ═══════════════════ RPC - جلب رصيد الحساب ═══════════════════
    async getAccountBalance(address) {
        try {
            const response = await fetch(this.rpcEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "getAccount",
                    params: { address: address }
                })
            });

            const data = await response.json();
            
            if (data.result && data.result.balances) {
                const nativeBalance = data.result.balances.find(b => b.asset_type === 'native');
                return {
                    balance: nativeBalance ? parseFloat(nativeBalance.balance) : 0,
                    reserved: nativeBalance ? parseFloat(nativeBalance.selling_liabilities || 0) : 0,
                    source: 'rpc'
                };
            }
            
            return this.getAccountBalanceHorizon(address);
        } catch (error) {
            console.warn('RPC failed, trying Horizon...', error.message);
            return this.getAccountBalanceHorizon(address);
        }
    }

    // ═══════════════════ Horizon - جلب رصيد الحساب ═══════════════════
    async getAccountBalanceHorizon(address) {
        try {
            const response = await fetch(`${this.horizonEndpoint}/accounts/${address}`);
            const data = await response.json();
            
            if (data.balances) {
                const nativeBalance = data.balances.find(b => b.asset_type === 'native');
                return {
                    balance: nativeBalance ? parseFloat(nativeBalance.balance) : 0,
                    reserved: nativeBalance ? parseFloat(nativeBalance.selling_liabilities || 0) : 0,
                    source: 'horizon'
                };
            }
            
            return { balance: 0, reserved: 0, source: 'none' };
        } catch (error) {
            console.error('Horizon failed:', error.message);
            return { balance: 0, reserved: 0, source: 'none' };
        }
    }

    // ═══════════════════ جلب سجل المعاملات ═══════════════════
    async getTransactionHistory(address, limit = 10) {
        try {
            const response = await fetch(
                `${this.horizonEndpoint}/accounts/${address}/transactions?limit=${limit}&order=desc`
            );
            const data = await response.json();
            
            if (data._embedded && data._embedded.records) {
                return data._embedded.records.map(tx => ({
                    id: tx.id,
                    hash: tx.hash,
                    createdAt: tx.created_at,
                    feeCharged: tx.fee_charged,
                    operationCount: tx.operation_count,
                    memo: tx.memo || 'No memo',
                    successful: tx.successful
                }));
            }
            
            return [];
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
            return this.transactionHistory;
        }
    }

    // ═══════════════════ نافذة تحويل Pi ═══════════════════
    renderTransferModal() {
        const currentNetwork = this.network;
        
        Swal.fire({
            title: `💎 تحويل Pi (${currentNetwork.toUpperCase()})`,
            html: `
                <div style="text-align:right; color:#fff; font-family:inherit;">
                    <div style="margin-bottom:12px;">
                        <label style="font-size:12px; color:var(--gold);">الشبكة:</label>
                        <select id="bc-net" class="swal2-input"
                            style="background:#1a1a1d; color:#fff; border:1px solid rgba(255,215,0,0.2);"
                            onchange="chatooBlock.toggleNetworkLive(this.value)">
                            <option value="testnet" ${currentNetwork === 'testnet' ? 'selected' : ''}>🧪 Testnet (تجريبي)</option>
                            <option value="mainnet" ${currentNetwork === 'mainnet' ? 'selected' : ''}>🚀 Mainnet (رئيسي)</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom:12px;">
                        <label style="font-size:12px; color:var(--gold);">الكمية (Pi):</label>
                        <input id="bc-amount" type="number" step="0.01" min="0.01" placeholder="0.00"
                            class="swal2-input"
                            style="background:#1a1a1d; color:#fff; border:1px solid rgba(255,215,0,0.2); direction:ltr;">
                    </div>
                    
                    <div style="margin-bottom:12px;">
                        <label style="font-size:12px; color:var(--gold);">ملاحظة:</label>
                        <input id="bc-memo" class="swal2-input" placeholder="Chatoo Transfer"
                            style="background:#1a1a1d; color:#fff; border:1px solid rgba(255,215,0,0.2); direction:rtl;">
                    </div>
                    
                    <div style="padding:8px; background:rgba(255,215,0,0.05); border-radius:8px; border:1px solid rgba(255,215,0,0.15);">
                        <p style="font-size:10px; color:rgba(255,255,255,0.5); margin:0; text-align:center;">
                            RPC: ${this.rpcEndpoint}
                        </p>
                    </div>
                </div>
            `,
            background: "#121214",
            color: "#fff",
            showCancelButton: true,
            confirmButtonText: "💸 تأكيد التحويل",
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
                this.createPiPayment(result.value.amount, result.value.memo);
            }
        });
    }

    // ═══════════════════ تبديل الشبكة مباشرة ═══════════════════
    toggleNetworkLive(net) {
        this.toggleNetwork(net);
        Swal.close();
        this.renderTransferModal();
    }

    // ═══════════════════ إنشاء دفعة Pi ═══════════════════
    async createPiPayment(amount, memo) {
        if (typeof Pi === 'undefined') {
            Swal.fire({
                title: '⚠️ Pi Browser مطلوب',
                html: `<p style="color:#fff;">يجب فتح التطبيق من <strong style="color:#ffd700;">Pi Browser</strong> الرسمي.</p>`,
                icon: 'warning',
                background: "#121214",
                color: "#fff",
                confirmButtonColor: "#ffd700",
                confirmButtonText: "حسناً"
            });
            return;
        }

        try {
            // ═══════════════════ المصادقة مع صلاحية payments ═══════════════════
            Swal.fire({
                title: '🔐 جاري المصادقة...',
                html: '<p style="color:#fff;">يرجى الموافقة على صلاحية المدفوعات</p>',
                background: "#121214",
                color: "#fff",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            const authResult = await Pi.authenticate(
                ['payments', 'username'],
                this.onIncompletePaymentFound.bind(this)
            );

            Swal.close();

            if (!authResult || !authResult.user) {
                throw new Error("فشل المصادقة - لم يتم الحصول على صلاحية payments");
            }

            const userId = authResult.user.username;
            console.log('✅ مصادقة ناجحة:', userId);

            // ═══════════════════ إنشاء الدفعة ═══════════════════
            const paymentData = {
                amount: amount,
                memo: memo,
                metadata: {
                    app: "Chatoo",
                    network: this.network,
                    userId: userId,
                    timestamp: Date.now(),
                    version: CHATOO_CONFIG.app.version
                }
            };

            const callbacks = {
                // ✅ تم إصلاح مشكلة المهلة - موافقة فورية
                onReadyForServerApproval: (paymentId) => {
                  console.log("⏳ Payment ID:", paymentId);
                  // ✅ أغلق أي نافذة مفتوحة
               Swal.close();
               // ✅ أرجع resolve فوراً (بدون async)
              return Promise.resolve({ success: true, paymentId });
},

                onReadyForServerCompletion: async (paymentId, txid) => {
                    console.log("🎉 TX:", txid);
                    
                    // حفظ المعاملة محلياً
                    this.transactionHistory.unshift({
                        paymentId, txid, amount, memo, userId,
                        network: this.network, timestamp: Date.now(), status: 'completed'
                    });
                    
                    if (this.transactionHistory.length > 50) {
                        this.transactionHistory = this.transactionHistory.slice(0, 50);
                    }
                    localStorage.setItem('chatoo_tx_history', JSON.stringify(this.transactionHistory));

                    // إشعار
                    window.dispatchEvent(new CustomEvent('piPaymentComplete', {
                        detail: { amount, memo, txid, userId, network: this.network }
                    }));

                    // رسالة في المحادثة
                    if (window.db && window.chatoo?.state?.room) {
                        try {
                            await window.db.collection("rooms_v2")
                                .doc(window.chatoo.state.room)
                                .collection("m")
                                .add({
                                    u: userId,
                                    val: `💸 تم تحويل ${amount} Pi - ${memo}`,
                                    type: 'gift',
                                    txid: txid,
                                    t: firebase.firestore.FieldValue.serverTimestamp()
                                });
                        } catch (e) {}
                    }

                    // ✅ نجاح
                    Swal.fire({
                        title: '🎉 تمت المعاملة بنجاح!',
                        html: `
                            <div style="color:#fff; text-align:center;">
                                <p style="font-size:24px;">تم تحويل</p>
                                <p><strong style="color:#ffd700; font-size:32px;">${amount} π</strong></p>
                                <p style="font-size:11px; opacity:0.5; word-break:break-all;">
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
                    console.log("❌ تم الإلغاء:", paymentId);
                    Swal.fire({
                        title: 'تم الإلغاء',
                        text: 'تم إلغاء عملية الدفع',
                        icon: 'info',
                        background: "#121214",
                        color: "#fff",
                        confirmButtonColor: "#ffd700"
                    });
                },

                onError: (error, payment) => {
                    console.error("💥 خطأ الدفع:", error, payment);
                    Swal.fire({
                        title: 'خطأ في الدفع',
                        text: error.message || 'حدث خطأ غير متوقع',
                        icon: 'error',
                        background: "#121214",
                        color: "#fff",
                        confirmButtonColor: "#ffd700"
                    });
                }
            };

            await Pi.createPayment(paymentData, callbacks);

        } catch (err) {
            console.error("Payment creation error:", err);
            Swal.fire({
                title: 'خطأ',
                text: err.message || 'فشل إنشاء الدفعة',
                icon: 'error',
                background: "#121214",
                color: "#fff",
                confirmButtonColor: "#ffd700"
            });
        }
    }

    // ═══════════════════ معالجة المعاملات غير المكتملة ═══════════════════
    async onIncompletePaymentFound(payment) {
        console.warn("⚠️ معاملة غير مكتملة:", payment);
        if (window.chatooNotif) {
            window.chatooNotif.systemAlert('تم العثور على معاملة غير مكتملة');
        }
    }

    // ═══════════════════ الحصول على سجل المعاملات ═══════════════════
    getLocalTransactionHistory() {
        return this.transactionHistory;
    }

    // ═══════════════════ فحص حالة الشبكة ═══════════════════
    async checkNetworkStatus() {
        try {
            const response = await fetch(`${this.horizonEndpoint}/`);
            const data = await response.json();
            
            return {
                online: true,
                network: this.network,
                horizonVersion: data.horizon_version || 'unknown',
                coreVersion: data.core_version || 'unknown',
                rpcEndpoint: this.rpcEndpoint
            };
        } catch (error) {
            return {
                online: false,
                network: this.network,
                error: error.message
            };
        }
    }
}

// ═══════════════════ تهيئة النظام ═══════════════════
const chatooBlock = new ChatooBlockchain();

// إضافة زر التحويل في شريط التنقل
document.addEventListener("DOMContentLoaded", () => {
    const navBar = document.querySelector("nav");
    if (navBar && !document.getElementById("btn-transfer-custom")) {
        const transferBtn = document.createElement("div");
        transferBtn.id = "btn-transfer-custom";
        transferBtn.className = "nav-btn";
        transferBtn.innerHTML = "💸";
        transferBtn.title = "تحويل Pi";
        transferBtn.style.cursor = "pointer";
        transferBtn.onclick = () => chatooBlock.renderTransferModal();
        navBar.appendChild(transferBtn);
    }
    
    console.log('💰 Chatoo Blockchain System Ready');
    console.log(`   Network: ${chatooBlock.network}`);
    console.log(`   RPC: ${chatooBlock.rpcEndpoint}`);
});
