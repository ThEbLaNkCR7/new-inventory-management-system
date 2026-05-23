import mongoose from "mongoose";
import Purchase from "../../../models/Purchase.js";
import Product from "../../../models/Product.js";
import { NextResponse } from "next/server";

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export async function GET(request) {
  try {
    await dbConnect();
    const purchases = await Purchase.find({ isActive: true });
    return NextResponse.json({ purchases });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const purchase = new Purchase(body);
    await purchase.save();

    // Update product stock quantity
    const product = await Product.findById(purchase.productId);
    if (product) {
      const newStockQuantity =
        product.stockQuantity + purchase.quantityPurchased;
      await Product.findByIdAndUpdate(purchase.productId, {
        stockQuantity: newStockQuantity,
        lastRestocked: new Date(),
      });
      console.log(
        `📦 Updated stock for ${product.name}: ${product.stockQuantity} → ${newStockQuantity}`,
      );
    }

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
