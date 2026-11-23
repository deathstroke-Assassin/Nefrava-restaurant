
const orderModel = require('../models/orderModel');
const mailService = require('../services/mailService');
const stripeService = require('../services/stripeService');

function paymentMethods(req, res) {
    return res.status(200).json(stripeService.getPaymentMethods());
}

async function index(req, res) {
    try {
        const orders = await orderModel.index();
        return res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({
            message: 'Failed to fetch orders'
        });
    }
}

async function show(req, res) {
    try {
        const order = await orderModel.show(req.params.id);

        if (!order) {
            return res.status(404).json({
                message: 'Order not found'
            });
        }

        return res.status(200).json(order);
    } catch (error) {
        if (error.message === 'Invalid order ID') {
            return res.status(400).json({ message: error.message });
        }

        console.error('Error fetching order:', error);
        return res.status(500).json({
            message: 'Failed to fetch order'
        });
    }
}

async function store(req, res) {
    try {
        const paymentMethod = req.body.paymentMethod || 'cod';
        if (!['cod', 'stripe'].includes(paymentMethod)) {
            return res.status(400).json({ message: 'Unsupported payment method' });
        }
        if (paymentMethod === 'stripe' && !stripeService.isEnabled()) {
            return res.status(400).json({ message: 'Stripe checkout is not enabled' });
        }

        const result = await orderModel.store({ ...req.body, paymentMethod });
        if (paymentMethod === 'stripe') {
            const order = await orderModel.show(result.insertedId);
            try {
                const session = await stripeService.createCheckoutSession(order);
                await orderModel.recordStripeSession(result.insertedId, session);
                return res.status(201).json({
                    message: 'Checkout session created',
                    id: result.insertedId,
                    paymentMethod,
                    checkoutUrl: session.url
                });
            } catch (error) {
                console.error('Failed to create Stripe checkout session:', error.message);
                try {
                    await orderModel.updateStripePayment(result.insertedId, null, 'failed');
                } catch (updateError) {
                    console.error('Failed to record Stripe checkout failure:', updateError.message);
                }
                return res.status(502).json({
                    message: 'Could not start secure card checkout. Please try again.',
                    id: result.insertedId
                });
            }
        }

        return res.status(201).json({
            message: 'Order created successfully',
            id: result.insertedId,
            paymentMethod
        });
    } catch (error) {
        const validationErrors = [
            'Customer name, phone, and address are required',
            'Customer email must be valid',
            'An order must contain at least one item',
            'Invalid item ID',
            'Item quantity must be a positive integer',
            'An item was not found or is unavailable',
            'Unsupported payment method'
        ];

        if (
            validationErrors.includes(error.message) ||
            error.message.startsWith('Insufficient stock for ')
        ) {
            return res.status(400).json({
                message: error.message
            });
        }

        console.error('Error creating order:', error);
        return res.status(500).json({
            message: 'Failed to create order'
        });
    }
}

async function update(req, res) {
    try {
        const result = await orderModel.update(
            req.params.id,
            req.body
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                message: 'Order not found'
            });
        }

        return res.status(200).json({ message: 'Order updated successfully', ...(result.note ? { note: result.note } : {}) });
    } catch (error) {
        const validationErrors = [
            'Invalid order ID',
            'Status must be opened or closed',
            'Note must be text',
            'No order changes provided'
        ];

        if (validationErrors.includes(error.message)) {
            return res.status(400).json({
                message: error.message
            });
        }

        console.error('Error updating order:', error);
        return res.status(500).json({
            message: 'Failed to update order'
        });
    }
}

async function sendEmail(req, res) {
    try {
        const order = await orderModel.show(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const recipient = order.customer?.email;
        if (!recipient) {
            return res.status(400).json({ message: 'This order has no customer email address' });
        }

        const subject = typeof req.body.subject === 'string' ? req.body.subject.trim() : '';
        const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
        if (!subject || subject.length > 180 || !message || message.length > 5000) {
            return res.status(400).json({ message: 'Enter a subject (up to 180 characters) and message (up to 5000 characters)' });
        }

        const result = await mailService.send({ to: recipient, subject, text: message });
        return res.status(200).json({ message: 'Email sent successfully', messageId: result.messageId });
    } catch (error) {
        if (error.message === 'Invalid order ID') {
            return res.status(400).json({ message: error.message });
        }

        console.error('Failed to send order email:', error.message);
        return res.status(503).json({ message: 'Email could not be sent. Check that Mailpit is running and try again.' });
    }
}

module.exports = { index, show, store, update, sendEmail, paymentMethods };
