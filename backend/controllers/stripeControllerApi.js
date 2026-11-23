const orderModel = require('../models/orderModel');
const stripeService = require('../services/stripeService');

async function status(req, res) {
    try {
        const order = await orderModel.show(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.paymentMethod !== 'stripe') {
            return res.status(200).json({
                orderId: String(order._id),
                paymentStatus: order.paymentStatus || 'unpaid',
                total: order.total,
                currency: (process.env.STRIPE_CURRENCY || 'egp').toUpperCase()
            });
        }

        const sessionId = typeof req.query.session_id === 'string' ? req.query.session_id : '';
        if (!sessionId || sessionId !== order.stripeDetails?.sessionId) {
            return res.status(400).json({ message: 'A valid checkout session is required' });
        }

        const session = await stripeService.retrieveCheckoutSession(sessionId, order._id);
        const linkedOrderId = session.client_reference_id || session.metadata?.orderId;
        if (session.id !== sessionId || String(linkedOrderId || '') !== String(order._id)) {
            return res.status(400).json({ message: 'Checkout session does not match this order' });
        }

        const paymentStatus = session.payment_status === 'paid'
            ? 'paid'
            : session.status === 'expired' ? 'failed' : 'pending';
        await orderModel.updateStripePayment(
            order._id,
            sessionId,
            paymentStatus,
            typeof session.payment_intent === 'string' ? session.payment_intent : null
        );
        return res.status(200).json({
            orderId: String(order._id),
            paymentStatus,
            total: order.total,
            currency: (process.env.STRIPE_CURRENCY || 'egp').toUpperCase(),
            simulated: stripeService.isMockModeEnabled()
        });
    } catch (error) {
        if (error.message === 'Invalid order ID') return res.status(400).json({ message: error.message });
        console.error('Failed to verify Stripe payment:', error.message);
        return res.status(502).json({ message: 'Could not verify the payment. Please refresh and try again.' });
    }
}

async function webhook(req, res) {
    const rawBody = req.body;
    const signature = req.get('stripe-signature');
    if (!stripeService.verifyWebhookSignature(rawBody, signature)) {
        return res.status(400).json({ message: 'Invalid Stripe webhook signature' });
    }

    let event;
    try {
        event = JSON.parse(rawBody.toString('utf8'));
    } catch {
        return res.status(400).json({ message: 'Invalid webhook payload' });
    }

    const session = event.data?.object;
    if (!session?.id) return res.status(200).json({ received: true });
    let paymentStatus;
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
        if (session.payment_status !== 'paid') return res.status(200).json({ received: true });
        paymentStatus = 'paid';
    } else if (event.type === 'checkout.session.async_payment_failed' || event.type === 'checkout.session.expired') {
        paymentStatus = 'failed';
    } else {
        return res.status(200).json({ received: true });
    }

    const orderId = session.client_reference_id || session.metadata?.orderId;
    if (orderId) {
        try {
            await orderModel.updateStripePayment(
                orderId,
                session.id,
                paymentStatus,
                typeof session.payment_intent === 'string' ? session.payment_intent : null
            );
        } catch (error) {
            console.error('Failed to apply Stripe webhook:', error.message);
            return res.status(500).json({ message: 'Could not update the order' });
        }
    }
    return res.status(200).json({ received: true });
}

module.exports = { status, webhook };
