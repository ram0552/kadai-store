require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const products = [
  { name: 'Guntur Chilli Powder', category: 'Spices', weight: '250 g', price: 180, stock: 40, tone: '#B8281A', description: 'Stone-ground, sun-dried Guntur sannam chillies. Hot and deep red.' },
  { name: 'Avakaya Mango Pickle', category: 'Pickles', weight: '500 g', price: 349, stock: 25, tone: '#C77D0A', description: 'Raw mango, mustard and sesame oil, aged in ceramic jars.' },
  { name: 'Gongura Pickle', category: 'Pickles', weight: '400 g', price: 299, stock: 20, tone: '#6F8426', description: 'Tangy roselle leaves, slow-cooked with red chilli and garlic.' },
  { name: 'Kandi Podi', category: 'Spices', weight: '200 g', price: 149, stock: 50, tone: '#8A5A2B', description: 'Roasted toor dal and chilli powder. Mix with hot rice and ghee.' },
  { name: 'Araku Coffee Beans', category: 'Coffee', weight: '250 g', price: 425, stock: 30, tone: '#3B2A22', description: 'Medium roast, shade-grown in the Araku valley.' },
  { name: 'Organic Turmeric', category: 'Spices', weight: '200 g', price: 129, stock: 60, tone: '#C99700', description: 'High-curcumin Duggirala turmeric, ground in small batches.' },
  { name: 'Palm Jaggery', category: 'Sweeteners', weight: '500 g', price: 220, stock: 35, tone: '#A5622A', description: 'Unrefined jaggery from the Godavari delta.' },
  { name: 'Cold-Pressed Groundnut Oil', category: 'Oils', weight: '1 L', price: 360, stock: 18, tone: '#8C7A12', description: 'Wood-pressed oil with a toasty aroma, no additives.' },
];

(async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing in server/.env');
  await mongoose.connect(process.env.MONGO_URI);
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`Seeded ${products.length} products`);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
