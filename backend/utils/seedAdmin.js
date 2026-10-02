require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB...');

    const existingAdmin = await Admin.findOne({ email: 'admin@library.com' });
    if (existingAdmin) {
      console.log('Admin already exists: admin@library.com');
      process.exit(0);
    }

    const admin = await Admin.create({
      name: 'Library Owner',
      email: 'admin@library.com',
      password: 'admin123',
    });

    console.log('✅ Admin created successfully!');
    console.log('📧 Email: admin@library.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change your password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
