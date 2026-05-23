import mongoose from "mongoose";
import Supplier from "../../../../models/Supplier.js";
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
    const supplier = await Supplier.findById(params.id);
    if (!supplier)
      return NextResponse.json(
        { message: "Supplier not found" },
        { status: 404 },
      );
    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const body = await request.json();
    const supplier = await Supplier.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!supplier)
      return NextResponse.json(
        { message: "Supplier not found" },
        { status: 404 },
      );
    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Error updating supplier:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const supplier = await Supplier.findByIdAndDelete(params.id);
    if (!supplier)
      return NextResponse.json(
        { message: "Supplier not found" },
        { status: 404 },
      );
    return NextResponse.json({ message: "Supplier deleted successfully" });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
