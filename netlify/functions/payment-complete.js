// payment-complete.js - إكمال دفع Pi Network
exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const { paymentId, txid, network, userId } = JSON.parse(event.body);

        if (!paymentId || !txid) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Payment ID and TX ID are required' })
            };
        }

        console.log(`✅ Payment Completed: ${paymentId} | TX: ${txid} | Network: ${network}`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Payment completed successfully',
                paymentId,
                txid,
                network,
                completedAt: new Date().toISOString()
            })
        };
    } catch (error) {
        console.error('Payment complete error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Internal server error' })
        };
    }
};
