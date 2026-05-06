// netlify/functions/payment-complete.js
// المسؤول: Kamikaz007

exports.handler = async (event) => {
    const { paymentId, txid } = JSON.parse(event.body);
    console.log('📥 Complete received - paymentId:', paymentId, 'txid:', txid);

    try {
        // ✅ Pi Platform API الصحيح - ليس Horizon
        const res = await fetch(
            `https://api.minepi.com/v2/payments/${paymentId}/complete`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${process.env.PI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ txid })
            }
        );

        const data = await res.json();
        console.log('📤 Pi API status:', res.status);
        console.log('📤 Pi API response:', JSON.stringify(data));

        if (!res.ok) {
            console.error('❌ Complete failed:', data);
            return {
                statusCode: res.status,
                body: JSON.stringify({ error: data })
            };
        }

        console.log('✅ Payment completed:', paymentId);
        return {
            statusCode: 200,
            body: JSON.stringify({ paymentId, completed: true, ...data })
        };

    } catch(e) {
        console.error('❌ Error:', e.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: e.message })
        };
    }
};
