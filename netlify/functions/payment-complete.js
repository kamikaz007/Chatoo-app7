exports.handler = async (event) => {
    const { paymentId, txid } = JSON.parse(event.body);
    
    try {
        const res = await fetch(
            `https://api.testnet.minepi.com/v2/payments/${paymentId}/complete`,
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
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch(e) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: e.message })
        };
    }
};
