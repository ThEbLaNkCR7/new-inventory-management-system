import mongoose from "mongoose";
import Batch from "../../../models/Batch.js";
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
    const batches = await Batch.find({}).sort({ arrivalDate: -1 }).lean();
    return NextResponse.json({ batches });
  } catch (error) {
    console.error("Error fetching batches:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Save batch
    const batch = new Batch(body);
    await batch.save();

    // Update product stock based on batch items
    if (body.items && body.items.length > 0) {
      for (const item of body.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: { stockQuantity: item.quantity },
          },
          { new: true },
        );
      }
    }

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error("Batch creation error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
