const {
  MongoClient,
  ObjectId,
  mongoConnection,
} = require("./mongodbConnection");

const COLLECTION = "items";
const { normalizeLocalizedText } = require('./localizedText');

// Support documents whose _id is either an ObjectId or a legacy string.
function idMatch(id) {
  if (!ObjectId.isValid(String(id))) {
    return { _id: String(id) };
  }

  return {
    $or: [{ _id: new ObjectId(String(id)) }, { _id: String(id) }],
  };
}

// Always close the connection, even when a query fails.
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

function booleanValue(value, label, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new Error(`${label} must be true or false`);
}

// Validate and normalize values shared by create/update operations.
function normalizeItem(data, { includePhoto = true, isUpdate = false } = {}) {
  const name = normalizeLocalizedText(data.name, 'Item name', { required: true });

  if (!ObjectId.isValid(String(data.categoryId || ""))) {
    throw new Error("A valid category ID is required");
  }

  const price = Number(data.price);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Price must be a valid positive number");
  }

  const description = normalizeLocalizedText(data.description, 'Description');

  const item = {
    name,
    description,
    price,
    categoryId: new ObjectId(String(data.categoryId)),
    isAvailable: booleanValue(data.isAvailable, 'isAvailable', true),
    isFeatured: booleanValue(data.isFeatured, 'isFeatured', false),
    updatedAt: new Date(),
  };

  if (includePhoto && data.photo !== undefined && data.photo !== "") {
    item.photo = data.photo;
  }

  if (!isUpdate) item.isActive = booleanValue(data.isActive, 'isActive', true);
  return item;
}

// Manager: list menu items in active restaurant categories.
function index() {
  return withCollection(async (items) => {
    return items
      .aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },
        { $match: { "category.isActive": true } },
        {
          $sort: { "name.en": 1 },
        },
        { $project: { quantity: 0 } },
      ])
      .toArray();
  });
}

// Manager: find an item by ID.
function show(id) {
  return withCollection(async (items) => {
    return items
      .aggregate([
        { $match: idMatch(id) },
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },
        { $match: { "category.isActive": true } },
        { $project: { quantity: 0 } },
      ])
      .toArray();
  });
}

// Manager: create an item.
function store(data) {
  const item = normalizeItem(data);
  item.isActive = item.isActive ?? true;
  item.createdAt = new Date();

  return withCollection(async (items, db) => {
    const category = await db.collection("categories").findOne({
      _id: item.categoryId,
      isActive: true,
    });

    if (!category) {
      throw new Error("Category not found");
    }

    return items.insertOne(item);
  });
}

// Manager: retrieve the original document for an edit form.
function updateForm(id) {
  return withCollection(async (items) => {
    return items.find(idMatch(id)).toArray();
  });
}

// Manager: update an item. Existing photo is preserved if no new one is sent.
function update(data) {
  if (!ObjectId.isValid(String(data.id || ""))) {
    throw new Error("Invalid item ID");
  }

  const item = normalizeItem(data, { isUpdate: true });

  return withCollection(async (items, db) => {
    const category = await db.collection("categories").findOne({
      _id: item.categoryId,
      isActive: true,
    });

    if (!category) {
      throw new Error("Category not found");
    }

    return items.updateOne(idMatch(data.id), { $set: item, $unset: { quantity: '' } });
  });
}

// Manager: delete an item.
function destroy(id) {
  return withCollection(async (items) => {
    return items.deleteOne(idMatch(id));
  });
}

function publicIndex() {
  return withCollection(async (items) => items.aggregate([
    { $match: { isActive: { $ne: false } } },
    { $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "category" } },
    { $unwind: "$category" },
    { $match: { "category.isActive": true } },
    { $project: { quantity: 0 } },
    { $project: { quantity: 0 } },
    { $sort: { "name.en": 1 } },
  ]).toArray());
}

function publicShow(id) {
  return withCollection(async (items) => items.aggregate([
    { $match: { ...idMatch(id), isActive: { $ne: false } } },
    { $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "category" } },
    { $unwind: "$category" },
    { $match: { "category.isActive": true } },
    { $project: { quantity: 0 } },
    { $project: { quantity: 0 } },
  ]).next());
}

function publicFeatured() {
  return withCollection(async (items) => items.aggregate([
    { $match: { isActive: { $ne: false }, isFeatured: true } },
    { $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "category" } },
    { $unwind: "$category" },
    { $match: { "category.isActive": true } },
    { $sort: { "name.en": 1 } },
  ]).toArray());
}

function publicByCategory(categoryId) {
  if (!ObjectId.isValid(String(categoryId))) throw new Error('Invalid category ID');
  return withCollection(async (items) => items.aggregate([
    { $match: { categoryId: new ObjectId(String(categoryId)), isActive: { $ne: false } } },
    { $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "category" } },
    { $unwind: "$category" },
    { $match: { "category.isActive": true } },
    { $sort: { "name.en": 1 } },
  ]).toArray());
}
module.exports = {
  publicIndex,
  publicShow,
  publicFeatured,
  publicByCategory,
  index,
  show,
  store,
  updateForm,
  update,
  destroy,
};
