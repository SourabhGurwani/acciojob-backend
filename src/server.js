import app from './app.js';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} catch (error) {
  console.error('MongoDB connection error:', error);
  process.exit(1);
}