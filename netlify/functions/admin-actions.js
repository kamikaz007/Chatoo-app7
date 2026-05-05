// admin-actions.js - عمليات المدير Kamikaz007
exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const ADMIN_USERNAME = 'kamikaz007';

    try {
        const body = JSON.parse(event.body || '{}');
        const { action, adminUsername, data } = body;

        // التحقق من صلاحيات المدير
        if (adminUsername !== ADMIN_USERNAME) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Unauthorized: Admin access required' })
            };
        }

        let result;

        switch (action) {
            case 'getStats':
                result = {
                    app: 'Chatoo Ultra Pro',
                    version: '2.0.0',
                    network: process.env.PI_NETWORK || 'testnet',
                    serverTime: new Date().toISOString(),
                    status: 'operational'
                };
                break;

            case 'updateConfig':
                result = {
                    success: true,
                    message: 'Configuration updated',
                    updatedBy: adminUsername,
                    updatedAt: new Date().toISOString(),
                    config: data
                };
                break;

            case 'getVenues':
                result = {
                    venues: [
                        { name: 'Haj Mostapha', status: 'active' },
                        { name: 'Salle Des Fêtes Hawa', status: 'active' },
                        { name: 'Café Bizerte', status: 'live' },
                        { name: 'Restaurant El Manâr', status: 'active' },
                        { name: 'Central Node', status: 'sync' },
                        { name: 'Node 007', status: 'active' }
                    ]
                };
                break;

            case 'getReferrals':
                result = {
                    totalReferrals: 0,
                    topReferrers: [],
                    totalPiEarned: 0
                };
                break;

            default:
                result = {
                    success: true,
                    message: `Action '${action}' received`,
                    adminUsername,
                    timestamp: new Date().toISOString()
                };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
        };

    } catch (error) {
        console.error('Admin action error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Internal server error' })
        };
    }
};
