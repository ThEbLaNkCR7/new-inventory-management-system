import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({
  path: path.join(__dirname, ".env.local"),
});

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing in .env.local");
}

// MongoDB connection
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log("Using existing MongoDB connection");
      return;
    }

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Users to create
const users = [
  {
    name: "Admin User",
    email: "admin@sheelwaterproofing.com",
    password: "loltheblank@ronaldosaurav2",
    role: "admin",
    isActive: true,
  },
  {
    name: "Manager User",
    email: "manager@example.com",
    password: "manager123",
    role: "manager",
    isActive: true,
  },
  {
    name: "Employee User",
    email: "employee@example.com",
    password: "employee123",
    role: "employee",
    isActive: true,
  },
];

const setupUsers = async () => {
  try {
    await connectDB();

    console.log("\nSetting up users...\n");

    for (const userData of users) {
      const normalizedEmail = userData.email.toLowerCase().trim();

      // Check existing user
      const existingUser = await User.findOne({
        email: normalizedEmail,
      });

      if (existingUser) {
        console.log(`User already exists: ${existingUser.email}`);

        // Optional: update old slow hashes
        const hashParts = existingUser.password.split("$");
        const rounds = Number(hashParts[2]);

        if (rounds > 12) {
          console.log(
            `Rehashing password for ${existingUser.email} (old rounds: ${rounds})`,
          );

          const newHash = await bcrypt.hash(userData.password, 10);

          existingUser.password = newHash;
          await existingUser.save();

          console.log(`Password updated for ${existingUser.email}`);
        }

        continue;
      }

      // Hash password with optimized rounds
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
    console.log(
      "Admin: admin@sheelwaterproofing.com / loltheblank@ronaldosaurav2",
    );
    console.log("Manager: manager@example.com / manager123");
    console.log("Employee: employee@example.com / employee123");
  } catch (error) {
    console.error("Setup error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nMongoDB disconnected");
    process.exit(0);
  }
};

// Run script
setupUsers();
