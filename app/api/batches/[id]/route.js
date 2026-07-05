import mongoose from "mongoose";
import Batch from "../../../../models/Batch.js";
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
    const { id } = params;
    const batch = await Batch.findById(id).lean();
    if (!batch)
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json(batch);
  } catch (error) {
    console.error("Error fetching batch:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await request.json();
    const { status } = body;
    const updated = await Batch.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    ).lean();
    if (!updated)
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating batch:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const batch = await Batch.findById(id);

    if (!batch) {
      return NextResponse.json({ message: "Batch not found" }, { status: 404 });
    }

    if (batch.items && batch.items.length > 0) {
      for (const item of batch.items) {
        const product = await Product.findById(item.productId);
        if (!product) continue;

        const newStockQuantity = Math.max(0, product.stockQuantity - item.quantity);
        const update = {
          stockQuantity: newStockQuantity,
          lastRestocked: new Date(),
        };

        if (product.batchId?.toString() === batch._id.toString()) {
          update.batchId = null;
          update.batchNumber = null;
        }

        await Product.findByIdAndUpdate(item.productId, update);
      }
    }

    await Batch.findByIdAndDelete(id);
    return NextResponse.json({ message: "Batch deleted successfully" });
  } catch (error) {
    console.error("Error deleting batch:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
