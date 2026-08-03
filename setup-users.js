import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "./models/User.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing in .env or .env.local");
}

const users = [
  {
    name: "Admin User",
    email: "admin@sheelwaterproofing.com",
    password: "admin123",
    role: "admin",
    isActive: true,
  },
  {
    name: "Regular User",
    email: "user@example.com",
    password: "user123",
    role: "employee",
    isActive: true,
  },
];

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    console.log("Using existing MongoDB connection");
    return;
  }

  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  console.log("MongoDB connected successfully");
}

async function setupUsers() {
  try {
    await connectDB();
    console.log("\nSetting up users...\n");

    for (const userData of users) {
      const normalizedEmail = userData.email.toLowerCase().trim();
      const existingUser = await User.findOne({ email: normalizedEmail });

      if (existingUser) {
        existingUser.name = userData.name;
        existingUser.role = userData.role;
        existingUser.isActive = userData.isActive;
        existingUser.password = await bcrypt.hash(userData.password, 10);
        await existingUser.save();
        console.log(`Updated user: ${existingUser.email} (${existingUser.role})`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        name: userData.name,
        email: normalizedEmail,
        password: hashedPassword,
        role: userData.role,
        isActive: userData.isActive,
      });
      await user.save();
      console.log(`Created user: ${user.email} (${user.role})`);
    }

    console.log("\nAll users setup completed successfully.\n");
    console.log("Login Credentials:");
    console.log("Admin: admin@sheelwaterproofing.com / admin123");
    console.log("  → No approval required for create/update/delete");
    console.log("User:  user@example.com / user123");
    console.log("  → Changes require admin approval");
  } catch (error) {
    console.error("Setup error:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("\nMongoDB disconnected");
  }
}

setupUsers();
