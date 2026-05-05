// chatoo-blockchain.js - محفظة Pi + RPC Testnet
class ChatooBlockchain {
    constructor() {
        this.network = localStorage.getItem("chatoo_bc_network") || CHATOO_CONFIG.app.network;
        this.sdkReady = false;
        this.rpcEndpoint = this.network === 'testnet' ? CHATOO_CONFIG.piNetwork.rpcEndpoint : CHATOO_CONFIG.piNetwork.mainnetRpc;
        this.horizonEndpoint = this.network === 'testnet' ? CHATOO_CONFIG.piNetwork.horizonEndpoint : CHATOO_CONFIG.piNetwork.mainnetHorizon;
        this.APPROVE_URL = "/.netlify/functions/payment-approve";
        this.COMPLETE_URL = "/.netlify/functions/payment-complete";
        this.transactionHistory = JSON.parse(localStorage.getItem('chatoo_tx_history') || '[]');
        this.initPiSDK();
    }

    initPiSDK() {
        const tryInit = () => {
            if (typeof Pi !== 'undefined') {
                Pi.init({ version: CHATOO_CONFIG.piNetwork.version, sandbox: CHATOO_CONFIG.piNetwork.sandbox });
                this.sdkReady = true;
                console.log(`✅ Pi SDK Ready | ${this.network} | RPC: ${this.rpcEndpoint}`);
                const dot = document.getElementById('rpc-dot');
                if (dot) dot.classList.add('rpc-active');
            } else { console.warn("⚠️ Pi SDK not found"); }
        };
        document.readyState === "complete" ? tryInit() : window.addEventListener('load', tryInit);
    }

    toggleNetwork(net) {
        this.network = net;
        localStorage.setItem("chatoo_bc_network", net);
        this.rpcEndpoint = net === 'testnet' ? CHATOO_CONFIG.piNetwork.rpcEndpoint : CHATOO_CONFIG.piNetwork.mainnetRpc;
        this.horizonEndpoint = net === 'testnet' ? CHATOO_CONFIG.piNetwork.horizonEndpoint : CHATOO_CONFIG.piNetwork.mainnetHorizon;
        if (typeof Pi !== 'undefined') Pi.init({ version: CHATOO_CONFIG.piNetwork.version, sandbox: net === 'testnet' });
        if (window.chatooNotif) window.chatooNotif.toast(`🔗 ${net.toUpperCase()}`);
    }

    async getAccountBalance(address) {
        try {
            const res = await fetch(this.rpcEndpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({jsonrpc:"2.0",id:1,method:"getAccount",params:{address}}) });
            const data = await res.json();
            if (data.result?.balances) {
                const nb = data.result.balances.find(b => b.asset_type === 'native');
                return { balance: nb ? parseFloat(nb.balance) : 0, reserved: nb ? parseFloat(nb.selling_liabilities||0) : 0, source:'rpc' };
            }
            return this.getAccountBalanceHorizon(address);
        } catch(e) { return this.getAccountBalanceHorizon(address); }
    }

    async getAccountBalanceHorizon(address) {
        try {
            const res = await fetch(`${this.horizonEndpoint}/accounts/${address}`);
            const data = await res.json();
            if (data.balances) {
                const nb = data.balances.find(b => b.asset_type === 'native');
                return { balance: nb ? parseFloat(nb.balance) : 0, reserved: nb ? parseFloat(nb.selling_liabilities||0) : 0, source:'horizon' };
            }
            return { balance:0, reserved:0, source:'none' };
        } catch(e) { return { balance:0, reserved:0, source:'none' }; }
    }

    renderTransferModal() {
        Swal.fire({
            title: `💎 تحويل Pi (${this.network.toUpperCase()})`,
            html: `<div style="text-align:right;color:#fff;">
                <label style="font-size:12px;color:var(--gold);">الشبكة:</label>
                <select id="bc-net" class="swal2-input" style="background:#1a1a1d;color:#fff;" onchange="chatooBlock.toggleNetworkLive(this.value)">
                    <option value="testnet" ${this.network==='testnet'?'selected':''}>🧪 Testnet</option>
                    <option value="mainnet" ${this.network==='mainnet'?'selected':''}>🚀 Mainnet</option>
                </select>
                <label style="font-size:12px;color:var(--gold);">الكمية (Pi):</label>
                <input id="bc-amount" type="number" step="0.01" min="0.01" class="swal2-input" style="background:#1a1a1d;color:#fff;">
                <label style="font-size:12px;color:var(--gold);">ملاحظة:</label>
                <input id="bc-memo" class="swal2-input" placeholder="Chatoo Transfer" style="background:#1a1a1d;color:#fff;">
                <p style="font-size:10px;opacity:0.5;">RPC: ${this.rpcEndpoint}</p>
            </div>`,
            background:"#121214", color:"#fff", showCancelButton:true, confirmButtonText:"💸 تأكيد", confirmButtonColor:"#ffd700",
            preConfirm: () => {
                const a = document.getElementById('bc-amount').value;
                if (!a || parseFloat(a) <= 0) { Swal.showValidationMessage('كمية غير صحيحة'); return false; }
                return { amount: parseFloat(a), memo: document.getElementById('bc-memo').value || 'Chatoo Transfer' };
            }
        }).then(r => { if (r.isConfirmed) this.createPiPayment(r.value.amount, r.value.memo); });
    }

    toggleNetworkLive(net) { this.toggleNetwork(net); Swal.close(); this.renderTransferModal(); }

    async createPiPayment(amount, memo) {
        if (typeof Pi === 'undefined') { Swal.fire({ title:'⚠️ Pi Browser', text:'افتح من Pi Browser', icon:'warning' }); return; }
        const userId = window.chatooAuth?.getRealUsername() || 'anonymous';
        try {
            await Pi.createPayment({ amount, memo, metadata: { app:"Chatoo", network:this.network, userId, timestamp:Date.now() } }, {
                onReadyForServerApproval: async (pid) => {
                    try { await fetch(this.APPROVE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ paymentId:pid, network:this.network, userId }) }); } catch(e) {}
                },
                onReadyForServerCompletion: async (pid, txid) => {
                    this.transactionHistory.unshift({ pid, txid, amount, memo, timestamp:Date.now(), status:'completed' });
                    if (this.transactionHistory.length > 50) this.transactionHistory = this.transactionHistory.slice(0,50);
                    localStorage.setItem('chatoo_tx_history', JSON.stringify(this.transactionHistory));
                    window.dispatchEvent(new CustomEvent('piPaymentComplete', { detail: { amount, memo, txid } }));
                    Swal.fire({ title:'🎉 تم!', html:`<p>${amount} π</p><small>TX: ${txid}</small>`, icon:'success', background:"#121214", color:"#fff" });
                },
                onCancel: () => Swal.fire({ title:'تم الإلغاء', icon:'info' }),
                onError: (e) => Swal.fire({ title:'خطأ', text:e.message, icon:'error' })
            });
        } catch(e) { Swal.fire({ title:'خطأ', text:e.message, icon:'error' }); }
    }

    async onIncompletePaymentFound(payment) {
        try { await fetch(this.COMPLETE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ paymentId:payment.identifier, txid:payment.transaction?.txid||"" }) }); } catch(e) {}
    }

    async checkNetworkStatus() {
        try {
            const res = await fetch(`${this.horizonEndpoint}/`);
            const data = await res.json();
            return { online:true, network:this.network, horizonVersion:data.horizon_version||'unknown', rpcEndpoint:this.rpcEndpoint };
        } catch(e) { return { online:false, network:this.network, error:e.message }; }
    }
}

const chatooBlock = new ChatooBlockchain();
document.addEventListener("DOMContentLoaded", () => {
    const nav = document.querySelector("nav");
    if (nav && !document.getElementById("btn-transfer-custom")) {
        const btn = document.createElement("div");
        btn.id = "btn-transfer-custom"; btn.className = "nav-btn"; btn.innerHTML = "💸"; btn.title = "تحويل Pi";
        btn.onclick = () => chatooBlock.renderTransferModal();
        nav.appendChild(btn);
    }
    console.log('💰 Blockchain Ready');
});
