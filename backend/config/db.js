const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log("trying to connect");
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("DB connected");
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
