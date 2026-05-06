exports.handler = async (event) => {
    const { paymentId } = JSON.parse(event.body);
    console.log('📥 paymentId received:', paymentId);

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
        
        // ✅ Log كامل
        console.log('📤 Pi API status:', res.status);
        console.log('📤 Pi API response:', JSON.stringify(data));

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
