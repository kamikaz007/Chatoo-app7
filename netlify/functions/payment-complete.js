// payment-complete.js - Netlify Function
exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const body = JSON.parse(event.body || '{}');

        console.log('✅ Payment Completed:', body.paymentId, body.txid);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                paymentId: body.paymentId,
                txid: body.txid,
                completedAt: new Date().toISOString()
            })
        };
    } catch (error) {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
        };
    }
};
