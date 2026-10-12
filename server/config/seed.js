import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import User from '../models/User.js';

dotenv.config();

const mockProducts = [
  {
    name: 'Elegant Georgette Floral Saree',
    description: 'A beautiful georgette saree featuring delicate floral prints and an elegant gold lace border. Perfect for festive celebrations and evening gatherings. Includes matching unstitched blouse piece.',
    category: 'Sarees',
    price: 1899,
    stock: 12,
    sizes: ['Free Size'],
    images: ['/uploads/products/saree-floral.jpg'],
    averageRating: 4.5
  },
  {
    name: 'Classic Chikankari Cotton Kurti',
    description: 'Handcrafted cotton Kurti featuring intricate Lucknowi Chikankari embroidery work on the front and sleeves. Breathable fabric ideal for hot summers and casual outings.',
    category: 'Kurtis',
    price: 899,
    stock: 25,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    images: ['/uploads/products/kurti-chikankari.jpg'],
    averageRating: 4.8
  },
  {
    name: 'Anarkali Salwar Suit Set',
    description: 'Designer cotton Anarkali style Salwar suit with heavy border embroidery, matching churidar pants, and a gorgeous printed organza dupatta.',
    category: 'Salwars',
    price: 2499,
    stock: 8,
    sizes: ['M', 'L', 'XL'],
    images: ['/uploads/products/salwar-anarkali.jpg'],
    averageRating: 4.2
  },
  {
    name: 'Casual Pastel Pink Crop Top',
    description: 'Trendy ribbed crop top with puff sleeves and square neckline. Made of soft stretch cotton blend, perfect for pair with jeans or skirts.',
    category: 'Tops',
    price: 499,
    stock: 30,
    sizes: ['XS', 'S', 'M', 'L'],
    images: ['/uploads/products/top-pink.jpg'],
    averageRating: 4.0
  },
  {
    name: 'Ankle-Length Stretchable Leggings',
    description: 'Super stretchable cotton leggings with elasticated waistband. Breathable cotton spandex fabric guarantees high comfort and durable daily use.',
    category: 'Leggings',
    price: 399,
    stock: 50,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    images: ['/uploads/products/leggings-black.jpg'],
    averageRating: 4.6
  },
  {
    name: 'Printed Silk Nightwear Set',
    description: 'Two-piece printed satin nightwear set consisting of a button-down collar top and matching loose trousers. Ultra soft fabric for relaxed nights.',
    category: 'Nightwear',
    price: 1299,
    stock: 15,
    sizes: ['S', 'M', 'L', 'XL'],
    images: ['/uploads/products/nightwear-satin.jpg'],
    averageRating: 4.7
  },
  {
    name: 'Festive Banarasi Silk Lehenga',
    description: 'Heavy Banarasi woven silk Lehenga choli set. Traditional patterns stitched with metallic golden threads, giving a luxurious classic touch.',
    category: 'Ethnic Wear',
    price: 5499,
    stock: 5,
    sizes: ['S', 'M', 'L', 'XL'],
    images: ['/uploads/products/ethnic-lehenga.jpg'],
    averageRating: 4.9
  },
  {
    name: 'Contemporary Linen Wrap Dress',
    description: 'Chic linen-blend western wrap dress with belt tie. V-neck shape, short sleeves, and relaxed midi skirt. Elegant outfit for corporate days or brunches.',
    category: 'Western Wear',
    price: 1699,
    stock: 18,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    images: ['/uploads/products/western-wrap.jpg'],
    averageRating: 4.4
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/evaas-shopping');
    console.log('Connected to MongoDB for seeding...');

    // Clear existing products
    await Product.deleteMany();
    console.log('Cleared old products.');

    // Seed products
    await Product.insertMany(mockProducts);
    console.log('Successfully seeded mock products!');

    // Check if default admin exists, if not create one
    const adminExists = await User.findOne({ email: 'mownikamoorthy@gmail.com' });
    if (!adminExists) {
      await User.create({
        name: 'Mownika Admin',
        email: 'mownikamoorthy@gmail.com',
        phone: '9999988888',
        password: 'Mownika@06', // pre-save hook will hash
        address: 'Evaas HQ, Bangalore, India',
        role: 'admin'
      });
      console.log('✅ Created admin: mownikamoorthy@gmail.com / Mownika@06');
    } else {
      console.log('ℹ️  Admin already exists — skipping creation.');
    }

    // Check if a customer user exists, if not create a default one
    const customerExists = await User.findOne({ email: 'customer@evaas.com' });
    if (!customerExists) {
      await User.create({
        name: 'Jane Doe',
        email: 'customer@evaas.com',
        phone: '9876543210',
        password: 'customerpassword123', // pre-save hook will hash
        address: 'Flat 402, Rose Residency, Silk Lane, Bangalore, India',
        role: 'customer'
      });
      console.log('Created default customer: customer@evaas.com / customerpassword123');
    }

    mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDB();
