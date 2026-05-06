// netlify/functions/verify-pi-token.js
// يتحقق من accessToken عبر Pi Platform API (بدون مفتاح API)

exports.handler = async (event) => {
    // السماح بطلبات POST فقط
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    let accessToken;
    try {
        const body = JSON.parse(event.body);
        accessToken = body.accessToken;
    } catch {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    if (!accessToken) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing accessToken' }) };
    }

    try {
        // استدعاء Pi Platform API للتحقق
        const response = await fetch('https://api.minepi.com/v2/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            return {
                statusCode: 401,
                body: JSON.stringify({ valid: false, error: 'Invalid or expired token' })
            };
        }

        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify({ valid: false, error: `Pi API error: ${response.status}` })
            };
        }

        const userData = await response.json();

        // تم التحقق بنجاح
        return {
            statusCode: 200,
            body: JSON.stringify({
                valid: true,
                user: {
                    uid: userData.uid,
                    username: userData.username
                }
            })
        };

    } catch (error) {
        console.error('Pi verification error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ valid: false, error: 'Server verification failed' })
        };
    }
};
