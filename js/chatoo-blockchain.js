async doPayment(recipient, amount, memo) {
    if (typeof Pi === 'undefined') {
        Swal.fire({ title: '⚠️', text: 'افتح من Pi Browser', icon: 'warning' });
        return;
    }

    Pi.init({ version: "2.0", sandbox: true });

    const auth = await Pi.authenticate(['payments', 'username'], (p) => {
        console.log('Incomplete payment:', p);
    });

    if (!auth?.user) {
        Swal.fire({ title: 'خطأ', text: 'فشل المصادقة', icon: 'error' });
        return;
    }

    sessionStorage.setItem("pi_user", auth.user.username);
    sessionStorage.setItem("pi_token", auth.accessToken);

    Pi.createPayment({
        amount: amount,
        memo: memo,
        metadata: { app: "Chatoo", recipient, timestamp: Date.now() }
    }, {
        // ✅ يستدعي Netlify Function - المفتاح محمي
        onReadyForServerApproval: async (paymentId) => {
            console.log('⏳ Approving:', paymentId);
            try {
                const res = await fetch('/.netlify/functions/approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentId })
                });
                const data = await res.json();
                console.log('✅ Approved:', data);
            } catch(e) {
                console.error('Approve error:', e);
            }
        },

        onReadyForServerCompletion: async (paymentId, txid) => {
            console.log('⏳ Completing:', txid);
            try {
                const res = await fetch('/.netlify/functions/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentId, txid })
                });
                const data = await res.json();
                console.log('✅ Completed:', data);
            } catch(e) {
                console.error('Complete error:', e);
            }

            // حفظ وعرض النجاح
            this.transactionHistory.unshift({
                paymentId, txid, amount, memo,
                timestamp: Date.now(), status: 'completed'
            });
            localStorage.setItem('chatoo_tx_history', 
                JSON.stringify(this.transactionHistory));

            Swal.fire({
                title: '🎉 تم الدفع!',
                html: `<p style="color:#ffd700;font-size:24px;">${amount} π</p>
                       <small style="opacity:0.5;">TX: ${txid}</small>`,
                icon: 'success',
                background: "#121214",
                color: "#fff",
                confirmButtonColor: "#ffd700"
            });

            // إضافة رسالة في الشات
            if (window.db && window.chatoo?.state?.room) {
                window.db.collection("rooms_v2")
                    .doc(window.chatoo.state.room)
                    .collection("m").add({
                        u: auth.user.username,
                        val: `💸 تم تحويل ${amount} π - ${memo}`,
                        type: 'gift',
                        txid: txid,
                        t: firebase.firestore.FieldValue.serverTimestamp()
                    }).catch(() => {});
            }
        },

        onCancel: (paymentId) => {
            Swal.fire({ 
                title: '❌ تم الإلغاء', 
                icon: 'info', 
                background: "#121214", 
                color: "#fff",
                timer: 2000
            });
        },

        onError: (error) => {
            Swal.fire({ 
                title: 'خطأ', 
                text: error.message, 
                icon: 'error',
                background: "#121214",
                color: "#fff"
            });
        }
    });
}
