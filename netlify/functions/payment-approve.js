// netlify/functions/payment-approve.js
// المسؤول: Kamikaz007

exports.handler = async (event) => {
    const { paymentId } = JSON.parse(event.body);
    console.log('📥 paymentId received:', paymentId);
    
    console.log('🔑 API Key exists:', !!process.env.PI_API_KEY);
console.log('🔑 API Key length:', process.env.PI_API_KEY?.length);

    try {
        // ✅ Pi Platform API الصحيح
        const res = await fetch(
            `https://api.minepi.com/v2/payments/${paymentId}/approve`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${process.env.PI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = await res.json();
        console.log('📤 Pi API status:', res.status);
        console.log('📤 Pi API response:', JSON.stringify(data));

        if (!res.ok) {
            console.error('❌ Approve failed:', data);
            return {
                statusCode: res.status,
                body: JSON.stringify({ error: data })
            };
        }

        console.log('✅ Payment approved:', paymentId);
        return {
            statusCode: 200,
            body: JSON.stringify({ paymentId, approved: true, ...data })
        };

    } catch(e) {
        console.error('❌ Error:', e.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: e.message })
        };
    }
};
