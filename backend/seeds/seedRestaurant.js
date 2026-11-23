const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { MongoClient } = require('mongodb');
const { EJSON } = require('bson');

const dataDirectory = path.join(__dirname, '..', '..', 'database');
const readExtendedJson = filename => EJSON.parse(fs.readFileSync(path.join(dataDirectory, filename), 'utf8'));

async function upsertDocuments(collection, documents, now) {
  for (const document of documents) {
    const { _id, createdAt, ...values } = document;
    await collection.updateOne(
      { _id },
      { $set: values, $setOnInsert: { createdAt: createdAt || now } },
      { upsert: true }
    );
  }
}

async function seedRestaurant() {
  const uri = process.env.MONGODB_CONNECTION;
  if (!uri) throw new Error('MONGODB_CONNECTION is missing from backend/.env');

  const categories = readExtendedJson('nefrava.categories.json');
  const items = readExtendedJson('nefrava.items.json');
  const categoryIds = new Set(categories.map(category => String(category._id)));
  const orphanItems = items.filter(item => !categoryIds.has(String(item.categoryId)));
  if (orphanItems.length) throw new Error(`Menu data contains ${orphanItems.length} item(s) with a missing category reference`);

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const categoryCollection = db.collection('categories');
    const itemCollection = db.collection('items');
    const now = new Date();

    await categoryCollection.createIndex({ isActive: 1, 'name.en': 1 });
    await itemCollection.createIndex({ categoryId: 1, isActive: 1, isAvailable: 1 });
    await itemCollection.createIndex({ isFeatured: 1, isAvailable: 1, isActive: 1 });

    await upsertDocuments(categoryCollection, categories, now);
    const normalizedItems = items.map(item => ({
      ...item,
      isActive: item.isActive !== false,
      isAvailable: item.isAvailable !== false,
      isFeatured: item.isFeatured === true
    }));
    await upsertDocuments(itemCollection, normalizedItems, now);

    console.log(`NEFRAVA catalog ready: ${categories.length} categories, ${items.length} menu items. Existing records were not deleted.`);
  } finally {
    await client.close();
  }
}

seedRestaurant().catch(error => {
  console.error('NEFRAVA catalog import failed:', error.message);
  process.exitCode = 1;
});
