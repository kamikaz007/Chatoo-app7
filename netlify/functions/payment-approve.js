// payment-approve.js - موافقة دفع Pi Network
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
        const { paymentId, network, userId } = JSON.parse(event.body);

        if (!paymentId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Payment ID is required' })
            };
        }

        console.log(`✅ Payment Approved: ${paymentId} | Network: ${network} | User: ${userId}`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Payment approved successfully',
                paymentId,
                network,
                approvedAt: new Date().toISOString()
            })
        };
    } catch (error) {
        console.error('Payment approve error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Internal server error' })
        };
    }
};
