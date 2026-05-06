// netlify/functions/payment-approve.js
// المسؤول: Kamikaz007

exports.handler = async (event) => {
    const { paymentId } = JSON.parse(event.body);

    try {
        const res = await fetch(
            `https://api.testnet.minepi.com/v2/payments/${paymentId}/approve`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${process.env.PI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = await res.json();

        // ✅ تحقق من نجاح الـ API
        if (!res.ok) {
            console.error('❌ Approve failed:', data);
            return {
                statusCode: res.status,
                body: JSON.stringify({ error: data })
            };
        }

        console.log('✅ Payment approved:', paymentId);

        // ✅ إرجاع paymentId صراحةً - ضروري لكي Pi Browser يكمل للمرحلة التالية
        return {
            statusCode: 200,
            body: JSON.stringify({
                paymentId,
                approved: true,
                ...data
            })
        };

    } catch(e) {
        console.error('❌ Approve error:', e.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: e.message })
        };
    }
};
