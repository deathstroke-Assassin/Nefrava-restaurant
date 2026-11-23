const crypto = require('node:crypto');

const STRIPE_API = 'https://api.stripe.com/v1';

function mockModeEnabled() {
    return process.env.STRIPE_MOCK_MODE === 'true' && process.env.NODE_ENV !== 'production';
}

function isEnabled() {
    return process.env.ENABLE_STRIPE === 'true' &&
        (Boolean(process.env.STRIPE_SECRET_KEY) || mockModeEnabled());
}

function getPaymentMethods() {
    const methods = [{ id: 'cod', label: 'Phone confirmation · pay on delivery' }];
    if (isEnabled()) {
        methods.push({
            id: 'stripe',
            label: mockModeEnabled() && !process.env.STRIPE_SECRET_KEY
                ? 'Card payment demo (no charge)'
                : 'Credit or debit card'
        });
    }
    return {
        methods,
        currency: (process.env.STRIPE_CURRENCY || 'egp').toUpperCase(),
        simulated: isMockModeEnabled()
    };
}

function appendFormValue(params, key, value) {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
        value.forEach((entry, index) => appendFormValue(params, `${key}[${index}]`, entry));
        return;
    }
    if (typeof value === 'object') {
        for (const [childKey, childValue] of Object.entries(value)) {
            appendFormValue(params, key ? `${key}[${childKey}]` : childKey, childValue);
        }
        return;
    }
    params.append(key, String(value));
}

function buildStripeFormBody(payload) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(payload)) appendFormValue(params, key, value);
    return params;
}

function getFrontendUrl() {
    return (process.env.FRONTEND_URL || 'http://localhost:4200').replace(/\/$/, '');
}

function stripeProductName(name) {
    if (typeof name === 'string') return name;
    if (name && typeof name === 'object') return String(name.en || name.ar || Object.values(name)[0] || 'Store item');
    return 'Store item';
}

async function stripeRequest(path, options = {}) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error('Stripe secret key is not configured');

    const response = await fetch(`${STRIPE_API}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${secretKey}`,
            ...(options.body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
            ...options.headers
        }
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result?.error?.message || `Stripe request failed (${response.status})`);
    }
    return result;
}

async function createCheckoutSession(order) {
    const frontendUrl = getFrontendUrl();
    if (!process.env.STRIPE_SECRET_KEY && mockModeEnabled()) {
        const sessionId = `cs_test_mock_${crypto.randomUUID().replaceAll('-', '')}`;
        return {
            id: sessionId,
            url: `${frontendUrl}/buy?orderId=${encodeURIComponent(String(order._id))}&session_id=${encodeURIComponent(sessionId)}&mock=true`,
            paymentIntentId: null,
            customerEmail: order.customer?.email || null
        };
    }

    const currency = (process.env.STRIPE_CURRENCY || 'egp').toLowerCase();
    const payload = {
        mode: 'payment',
        success_url: `${frontendUrl}/buy?orderId=${encodeURIComponent(String(order._id))}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/buy?orderId=${encodeURIComponent(String(order._id))}&cancelled=true`,
        client_reference_id: String(order._id),
        metadata: { orderId: String(order._id) },
        ...(order.customer?.email ? { customer_email: order.customer.email } : {}),
        line_items: order.items.map(item => ({
            quantity: item.quantity,
            price_data: {
                currency,
                unit_amount: Math.round(Number(item.price) * 100),
                product_data: { name: stripeProductName(item.name) }
            }
        }))
    };
    const session = await stripeRequest('/checkout/sessions', {
        method: 'POST',
        body: buildStripeFormBody(payload)
    });
    if (!session.id || !session.url) throw new Error('Stripe did not return a checkout URL');
    return {
        id: session.id,
        url: session.url,
        paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        customerEmail: session.customer_details?.email || order.customer?.email || null
    };
}

async function retrieveCheckoutSession(sessionId, orderId) {
    if (!process.env.STRIPE_SECRET_KEY && mockModeEnabled() && sessionId.startsWith('cs_test_mock_')) {
        return {
            id: sessionId,
            status: 'complete',
            payment_status: 'paid',
            client_reference_id: String(orderId),
            metadata: { orderId: String(orderId) },
            payment_intent: null
        };
    }
    return stripeRequest(`/checkout/sessions/${encodeURIComponent(sessionId)}`);
}

function verifyWebhookSignature(rawBody, signatureHeader) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret || !Buffer.isBuffer(rawBody) || typeof signatureHeader !== 'string') return false;

    const parts = signatureHeader.split(',').map(part => part.split('='));
    const timestamp = parts.find(([key]) => key === 't')?.[1];
    const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
    if (!timestamp || signatures.length === 0 || !/^\d+$/.test(timestamp)) return false;
    if (Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp)) > 300) return false;

    const signedPayload = Buffer.concat([Buffer.from(`${timestamp}.`), rawBody]);
    const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest();
    return signatures.some(signature => {
        if (!/^[a-f\d]{64}$/i.test(signature)) return false;
        const received = Buffer.from(signature, 'hex');
        return received.length === expected.length && crypto.timingSafeEqual(received, expected);
    });
}

function isMockModeEnabled() {
    return mockModeEnabled() && !process.env.STRIPE_SECRET_KEY;
}

module.exports = {
    isEnabled,
    getPaymentMethods,
    createCheckoutSession,
    retrieveCheckoutSession,
    verifyWebhookSignature,
    isMockModeEnabled
};
