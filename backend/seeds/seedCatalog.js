const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { MongoClient } = require('mongodb');

const categories = [
  {
    name: { en: 'Seeds & Propagation', ar: 'البذور والإكثار' },
    description: { en: 'Seeds, trays, and supplies for starting healthy plants.', ar: 'بذور وصوانٍ ومستلزمات لبدء زراعة نباتات صحية.' }
  },
  {
    name: { en: 'Soil & Growing Media', ar: 'التربة ووسائط الزراعة' },
    description: { en: 'Growing media and amendments for strong root development.', ar: 'وسائط زراعة ومحسنات لتقوية نمو الجذور.' }
  },
  {
    name: { en: 'Tools & Equipment', ar: 'الأدوات والمعدات' },
    description: { en: 'Practical tools for planting, pruning, and plant care.', ar: 'أدوات عملية للزراعة والتقليم والعناية بالنباتات.' }
  },
  {
    name: { en: 'Plant Nutrition & Care', ar: 'تغذية النباتات والعناية بها' },
    description: { en: 'Plant foods and care products for everyday growing.', ar: 'أسمدة ومنتجات عناية للنمو اليومي للنباتات.' }
  }
];

const items = [
  {
    name: { en: 'Heirloom Tomato Seeds', ar: 'بذور طماطم بلدية' },
    description: { en: 'A packet of reliable heirloom tomato seeds for home and greenhouse growing.', ar: 'عبوة من بذور الطماطم البلدية المناسبة للزراعة المنزلية والصوب.' },
    price: 85,
    quantity: 50,
    category: 'Seeds & Propagation'
  },
  {
    name: { en: 'Basil Seed Starter Kit', ar: 'مجموعة بدء زراعة بذور الريحان' },
    description: { en: 'Basil seeds with a compact starter tray for indoor propagation.', ar: 'بذور ريحان مع صينية صغيرة لبدء الإنبات داخل المنزل.' },
    price: 160,
    quantity: 20,
    category: 'Seeds & Propagation'
  },
  {
    name: { en: 'Seedling Tray', ar: 'صينية شتلات' },
    description: { en: 'Reusable propagation tray for starting vegetables and herbs.', ar: 'صينية إكثار قابلة لإعادة الاستخدام لبدء زراعة الخضروات والأعشاب.' },
    price: 120,
    quantity: 25,
    category: 'Seeds & Propagation'
  },
  {
    name: { en: 'Organic Potting Mix 10L', ar: 'خليط زراعة عضوي 10 لتر' },
    description: { en: 'Lightweight potting mix for containers, herbs, and young plants.', ar: 'خليط زراعة خفيف للأصص والأعشاب والنباتات الصغيرة.' },
    price: 220,
    quantity: 35,
    category: 'Soil & Growing Media'
  },
  {
    name: { en: 'Coco Peat Block', ar: 'قالب بيتموس جوز الهند' },
    description: { en: 'Compressed coco peat that expands into a moisture-retaining growing medium.', ar: 'بيتموس جوز هند مضغوط يتمدد ليصبح وسط زراعة يحتفظ بالرطوبة.' },
    price: 95,
    quantity: 40,
    category: 'Soil & Growing Media'
  },
  {
    name: { en: 'Perlite 5L', ar: 'بيرلايت 5 لتر' },
    description: { en: 'Lightweight perlite to improve drainage and aeration in potting mixes.', ar: 'بيرلايت خفيف لتحسين تصريف المياه وتهوية خلطات الزراعة.' },
    price: 145,
    quantity: 30,
    category: 'Soil & Growing Media'
  },
  {
    name: { en: 'Precision Pruning Shears', ar: 'مقص تقليم دقيق' },
    description: { en: 'Comfortable bypass shears for clean cuts on herbs and small stems.', ar: 'مقص مريح لقص الأعشاب والسيقان الصغيرة بدقة.' },
    price: 350,
    quantity: 8,
    category: 'Tools & Equipment'
  },
  {
    name: { en: 'Hand Trowel', ar: 'مجرفة يدوية' },
    description: { en: 'Durable hand trowel for potting, transplanting, and garden bed work.', ar: 'مجرفة يدوية متينة للأصص ونقل الشتلات والعمل في أحواض الزراعة.' },
    price: 180,
    quantity: 12,
    category: 'Tools & Equipment'
  },
  {
    name: { en: 'Digital Soil pH Meter', ar: 'جهاز رقمي لقياس حموضة التربة' },
    description: { en: 'A simple meter for checking soil acidity before planting.', ar: 'جهاز بسيط لقياس درجة حموضة التربة قبل الزراعة.' },
    price: 590,
    quantity: 6,
    category: 'Tools & Equipment'
  },
  {
    name: { en: 'Organic Seaweed Fertilizer', ar: 'سماد أعشاب بحرية عضوي' },
    description: { en: 'Concentrated seaweed feed for supporting healthy plant growth.', ar: 'سماد أعشاب بحرية مركز لدعم نمو النباتات بشكل صحي.' },
    price: 240,
    quantity: 18,
    category: 'Plant Nutrition & Care'
  },
  {
    name: { en: 'Balanced NPK Plant Food', ar: 'سماد نباتات متوازن NPK' },
    description: { en: 'All-purpose balanced plant food for ornamental and edible plants.', ar: 'سماد متوازن متعدد الاستخدامات للنباتات الزينة والمأكولة.' },
    price: 175,
    quantity: 22,
    category: 'Plant Nutrition & Care'
  },
  {
    name: { en: 'Neem Oil Plant Spray', ar: 'رذاذ نباتي بزيت النيم' },
    description: { en: 'Neem-based plant care spray for routine leaf and stem maintenance.', ar: 'رذاذ عناية بالنباتات قائم على النيم للاستخدام على الأوراق والسيقان.' },
    price: 210,
    quantity: 15,
    category: 'Plant Nutrition & Care'
  }
];

async function seedCatalog() {
  throw new Error('The botanical catalog seeder is retired. Run npm run seed to load the NEFRAVA restaurant menu.');
  const uri = process.env.MONGODB_CONNECTION;
  if (!uri) {
    throw new Error('MONGODB_CONNECTION is missing from backend/.env');
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const categoryCollection = db.collection('categories');
    const itemCollection = db.collection('items');
    const now = new Date();
    const categoryIds = new Map();

    for (const category of categories) {
      const existing = await categoryCollection.findOne({
        $or: [{ 'name.en': category.name.en }, { name: category.name.en }]
      });
      if (existing) {
        await categoryCollection.updateOne(
          { _id: existing._id },
          { $set: { name: category.name, description: category.description, updatedAt: now } }
        );
        categoryIds.set(category.name.en, existing._id);
      } else {
        const result = await categoryCollection.insertOne({
          ...category,
          createdAt: now,
          updatedAt: now
        });
        categoryIds.set(category.name.en, result.insertedId);
      }
    }

    for (const item of items) {
      const categoryId = categoryIds.get(item.category);
      const existing = await itemCollection.findOne({
        $or: [{ 'name.en': item.name.en }, { name: item.name.en }]
      });
      const values = {
        name: item.name,
        description: item.description,
        price: item.price,
        quantity: item.quantity,
        categoryId,
        isActive: true,
        updatedAt: now
      };
      if (existing) {
        await itemCollection.updateOne({ _id: existing._id }, { $set: values });
      } else {
        await itemCollection.insertOne({ ...values, createdAt: now });
      }
    }

    console.log('Catalog seed complete: ' + categories.length + ' categories and ' + items.length + ' items.');
  } finally {
    await client.close();
  }
}

seedCatalog().catch(error => {
  console.error('Catalog seed failed:', error);
  process.exitCode = 1;
});
