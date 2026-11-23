const { MongoClient, ObjectId, mongoConnection } = require('./mongodbConnection');

const COLLECTION = 'orders';

async function withCollection(callback) {
    const client = new MongoClient(mongoConnection);
    try {
        await client.connect();
        const db = client.db();
        return await callback(db.collection(COLLECTION), db);
    } finally {
        await client.close();
    }
}

async function store(data) {
    const customer = data.customer;
    const requestedItems = data.items;
    if (!customer || typeof customer.name !== 'string' || !customer.name.trim() ||
        typeof customer.phone !== 'string' || !customer.phone.trim() ||
        typeof customer.address !== 'string' || !customer.address.trim()) {
        throw new Error('Customer name, phone, and address are required');
    }
    const email = typeof customer.email === 'string' ? customer.email.trim() : '';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Customer email must be valid');
    }
    if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
        throw new Error('An order must contain at least one item');
    }
    const paymentMethod = data.paymentMethod || 'cod';
    if (!['cod', 'stripe'].includes(paymentMethod)) {
        throw new Error('Unsupported payment method');
    }

    return withCollection(async (orders, db) => {
        const savedItems = [];
        let total = 0;
        for (const requested of requestedItems) {
            if (!ObjectId.isValid(String(requested.itemId || ''))) throw new Error('Invalid item ID');
            const quantity = Number(requested.quantity);
            if (!Number.isInteger(quantity) || quantity < 1) throw new Error('Item quantity must be a positive integer');
            const item = await db.collection('items').findOne({
                _id: new ObjectId(String(requested.itemId)),
                isActive: { $ne: false },
                isAvailable: { $ne: false }
            });
            if (!item) throw new Error('An item was not found or is unavailable');
            const category = await db.collection('categories').findOne({ _id: item.categoryId, isActive: true });
            if (!category) throw new Error('An item was not found or is unavailable');
            savedItems.push({ itemId: item._id, name: item.name, price: Number(item.price), quantity });
            total += Number(item.price) * quantity;
        }
        const now = new Date();
        return orders.insertOne({
            customer: {
                name: customer.name.trim(),
                phone: customer.phone.trim(),
                address: customer.address.trim(),
                ...(email ? { email } : {})
            },
            items: savedItems,
            total,
            status: 'opened',
            paymentMethod,
            paymentStatus: paymentMethod === 'stripe' ? 'pending' : 'unpaid',
            ...(paymentMethod === 'stripe' ? {
                stripeDetails: { sessionId: null, paymentIntentId: null, customerEmail: email || null }
            } : {}),
            notes: [], createdAt: now, updatedAt: now
        });
    });
}

function recordStripeSession(id, session) {
    if (!ObjectId.isValid(String(id))) throw new Error('Invalid order ID');
    return withCollection(async orders => {
        const result = await orders.updateOne(
        { _id: new ObjectId(String(id)), paymentMethod: 'stripe' },
        {
            $set: {
                paymentStatus: 'pending',
                'stripeDetails.sessionId': session.id,
                'stripeDetails.paymentIntentId': session.paymentIntentId || null,
                'stripeDetails.customerEmail': session.customerEmail || null,
                updatedAt: new Date()
            }
        }
        );
        if (result.matchedCount !== 1) throw new Error('Could not associate Stripe session with the order');
        return result;
    });
}

function updateStripePayment(id, sessionId, paymentStatus, paymentIntentId = null) {
    if (!ObjectId.isValid(String(id))) throw new Error('Invalid order ID');
    if (!['pending', 'paid', 'failed'].includes(paymentStatus)) {
        throw new Error('Invalid payment status');
    }
    return withCollection(orders => orders.updateOne(
        {
            _id: new ObjectId(String(id)),
            paymentMethod: 'stripe',
            'stripeDetails.sessionId': sessionId,
            ...(paymentStatus === 'paid' ? {} : { paymentStatus: { $ne: 'paid' } })
        },
        {
            $set: {
                paymentStatus,
                ...(paymentIntentId ? { 'stripeDetails.paymentIntentId': paymentIntentId } : {}),
                updatedAt: new Date()
            }
        }
    ));
}

function normalizeNotes(order) {
    if (Array.isArray(order.notes)) return order.notes;
    if (typeof order.notes === 'string' && order.notes.trim()) {
        return [{ createdAt: order.updatedAt || order.createdAt || new Date(), description: order.notes }];
    }
    return [];
}

function index() {
    return withCollection(async orders => {
        const records = await orders.find({}).sort({ createdAt: -1 }).toArray();
        return records.map(order => ({ ...order, notes: normalizeNotes(order) }));
    });
}

function show(id) {
    if (!ObjectId.isValid(String(id))) throw new Error('Invalid order ID');
    return withCollection(async orders => {
        const order = await orders.findOne({ _id: new ObjectId(String(id)) });
        return order ? { ...order, notes: normalizeNotes(order) } : null;
    });
}

function update(id, data) {
    if (!ObjectId.isValid(String(id))) throw new Error('Invalid order ID');
    const updates = { updatedAt: new Date() };
    if (data.status !== undefined) {
        if (!['opened', 'closed'].includes(data.status)) throw new Error('Status must be opened or closed');
        updates.status = data.status;
    }
    if (data.note !== undefined && (typeof data.note !== 'string' || !data.note.trim())) {
        throw new Error('Note must be text');
    }
    if (Object.keys(updates).length === 1 && data.note === undefined) throw new Error('No order changes provided');

    return withCollection(async orders => {
        let note;
        const update = { $set: updates };
        if (data.note !== undefined) {
            const existing = await orders.findOne({ _id: new ObjectId(String(id)) });
            if (!existing) return { matchedCount: 0 };
            note = { createdAt: new Date(), description: data.note.trim() };
            update.$set.notes = [...normalizeNotes(existing), note];
        }
        const result = await orders.updateOne({ _id: new ObjectId(String(id)) }, update);
        return { ...result, note };
    });
}

module.exports = { store, index, show, update, recordStripeSession, updateStripePayment };
