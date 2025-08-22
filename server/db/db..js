import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config()
const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);

    console.log("✅ mongobg connected successfully");
  } catch (error) {
    console.log("MongoDB connection Failed", error);
  }
};

export default dbConnection;
