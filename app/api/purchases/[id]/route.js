import mongoose from "mongoose";
import Purchase from "../../../../models/Purchase.js";
import Product from "../../../../models/Product.js";
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

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const purchase = await Purchase.findById(params.id);
    if (!purchase)
      return NextResponse.json(
        { message: "Purchase not found" },
        { status: 404 },
      );
    return NextResponse.json(purchase);
  } catch (error) {
    console.error("Error fetching purchase:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const body = await request.json();

    // Get the original purchase to calculate stock difference
    const originalPurchase = await Purchase.findById(params.id);
    if (!originalPurchase)
      return NextResponse.json(
        { message: "Purchase not found" },
        { status: 404 },
      );

    const purchase = await Purchase.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!purchase)
      return NextResponse.json(
        { message: "Purchase not found" },
        { status: 404 },
      );

    // Update product stock quantity
    const product = await Product.findById(purchase.productId);
    if (product) {
      // Calculate the difference in quantity purchased
      const quantityDifference =
        purchase.quantityPurchased - originalPurchase.quantityPurchased;
      const newStockQuantity = Math.max(
        0,
        product.stockQuantity + quantityDifference,
      );

      await Product.findByIdAndUpdate(purchase.productId, {
        stockQuantity: newStockQuantity,
        lastRestocked: new Date(),
      });
      console.log(
        `📦 Updated stock for ${product.name}: ${product.stockQuantity} → ${newStockQuantity} (difference: ${quantityDifference})`,
      );
    }

    return NextResponse.json(purchase);
  } catch (error) {
    console.error("Error updating purchase:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const purchase = await Purchase.findById(params.id);
    if (!purchase)
      return NextResponse.json(
        { message: "Purchase not found" },
        { status: 404 },
      );

    // Update product stock quantity before deleting
    const product = await Product.findById(purchase.productId);
    if (product) {
      const newStockQuantity = Math.max(
        0,
        product.stockQuantity - purchase.quantityPurchased,
      );
      await Product.findByIdAndUpdate(purchase.productId, {
        stockQuantity: newStockQuantity,
        lastRestocked: new Date(),
      });
      console.log(
        `📦 Reduced stock for ${product.name}: ${product.stockQuantity} → ${newStockQuantity}`,
      );
    }

    await Purchase.findByIdAndDelete(params.id);
    return NextResponse.json({ message: "Purchase deleted successfully" });
  } catch (error) {
    console.error("Error deleting purchase:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
