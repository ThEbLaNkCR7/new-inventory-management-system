import mongoose from "mongoose";
import Sale from "../../../models/Sale.js";
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
    const sales = await Sale.find({ isActive: true });
    return NextResponse.json({ sales });
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    console.log(JSON.stringify(body, null, 2));
    const sale = new Sale(body);
    await sale.save();

    // Update stock for each item
    for (const item of sale.items) {
      const product = await Product.findById(item.productId);

      if (!product) continue;

      if (item.quantitySold >= product.stockQuantity) {
        await Product.findByIdAndDelete(item.productId);

        console.log(`🗑️ Product ${product.name} sold completely and removed`);
      } else {
        const newStockQuantity = product.stockQuantity - item.quantitySold;

        await Product.findByIdAndUpdate(item.productId, {
          stockQuantity: newStockQuantity,
        });
        console.log(
          `📦 Updated stock for ${product.name}: ${product.stockQuantity} → ${newStockQuantity}`,
        );
      }
    }

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
