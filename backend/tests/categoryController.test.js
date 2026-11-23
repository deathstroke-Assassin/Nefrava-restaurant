// Place in backend/tests/categoryController.test.js
// Run from backend: node --test tests/categoryController.test.js
// This is a controller unit test: the MongoDB model is replaced with a stub.

const test = require('node:test');
const assert = require('node:assert/strict');

const categoryModel = require('../models/categoryModelApi');
const categoryController = require('../controllers/categoryControllerApi');

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    }
  };
}

test('GET categories controller returns category data from its model', async (t) => {
  const originalIndex = categoryModel.index;
  const categories = [
    {
      _id: 'category-1',
      name: { en: 'Seeds', ar: 'Arabic translation' },
      description: { en: 'Seed supplies', ar: 'Arabic description' }
    }
  ];

  t.after(() => {
    categoryModel.index = originalIndex;
  });
  categoryModel.index = async () => categories;

  const response = createResponse();
  await categoryController.index({}, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, categories);
});
