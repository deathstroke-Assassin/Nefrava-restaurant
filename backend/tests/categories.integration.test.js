// backend/tests/categories.integration.test.js
// Run with: node --test tests/categories.integration.test.js
//
// Uses MONGODB_URI_TEST when set, otherwise a dedicated local test database.
// The categories GET route must remain public.

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { MongoClient } = require('mongodb');
const path = require('node:path');

// Load the backend .env regardless of the directory used to start this test.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Default to an isolated local test database. Override this for a dedicated
// remote test database with MONGODB_URI_TEST.
const mongoUrl = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/botanica-lab-test';

// Make the API under test use the same test database as the test client.
process.env.MONGODB_CONNECTION = mongoUrl;
const app = require('../app');

test('GET /api/v1.0/categories returns categories from MongoDB', async () => {
  const client = new MongoClient(mongoUrl);

  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('categories');

    const response = await request(app)
      .get('/api/v1.0/categories')
      .expect(200);

    assert.ok(Array.isArray(response.body), 'response body should be a category array');
  } finally {
    await client.close();
  }
});
