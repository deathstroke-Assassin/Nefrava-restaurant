
const { MongoClient, ObjectId, mongoConnection } = require('./mongodbConnection');
const { normalizeLocalizedText } = require('./localizedText');

async function withCollection(callback) {
    const client = new MongoClient(mongoConnection);

    try {
        await client.connect();
        const db = client.db();
        return await callback(db.collection('categories'), db);
    } finally {
        await client.close();
    }
}

function index() {
    return withCollection(categories =>
        categories.find({ isActive: true }).sort({ 'name.en': 1 }).toArray()
    );
}

function publicIndex() {
    return withCollection(categories =>
        categories.find({ isActive: true }).sort({ 'name.en': 1 }).toArray()
    );
}

function store(data) {
    const name = normalizeLocalizedText(data.name, 'Category name', { required: true });
    const description = normalizeLocalizedText(data.description, 'Category description');
    return withCollection(categories =>
        categories.insertOne({
            name,
            description,
            photo: typeof data.photo === 'string' ? data.photo : '',
      isActive: data.isActive === false ? false : true,
            createdAt: new Date(),
            updatedAt: new Date()
        })
    );
}

function update(id, data) {
    const name = normalizeLocalizedText(data.name, 'Category name', { required: true });
    const description = normalizeLocalizedText(data.description, 'Category description');
    return withCollection(categories =>
        categories.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    name,
                    description,
                    ...(typeof data.photo === 'string' ? { photo: data.photo } : {}),
                    ...(typeof data.isActive === 'boolean' ? { isActive: data.isActive } : {}),
                    updatedAt: new Date()
                }
            }
        )
    );
}

function destroy(id) {
    return withCollection(async (categories, db) => {
        const categoryId = new ObjectId(id);
        const usedByItems = await db.collection('items').countDocuments({ categoryId });
        if (usedByItems > 0) throw new Error('Category has menu items');
        return categories.deleteOne({ _id: categoryId });
    });
}

module.exports = {
    index,
    publicIndex,
    store,
    update,
    destroy
};
