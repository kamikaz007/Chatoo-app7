// payment-approve.js - Netlify Function
exports.handler = async (event) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // قبول الطلب مباشرة
        const body = JSON.parse(event.body || '{}');
        
        console.log('✅ Payment Approved:', body.paymentId);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                paymentId: body.paymentId,
                approvedAt: new Date().toISOString()
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
