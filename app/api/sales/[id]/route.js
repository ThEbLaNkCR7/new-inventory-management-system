import mongoose from "mongoose";
import Sale from "@/models/Sale";
import Product from "@/models/Product";
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
    const sale = await Sale.findById(params.id);
    if (!sale)
      return NextResponse.json({ message: "Sale not found" }, { status: 404 });
    return NextResponse.json(sale);
  } catch (error) {
    console.error("Error fetching sale:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const body = await request.json();

    // Get the original sale to calculate stock difference
    const originalSale = await Sale.findById(params.id);
    if (!originalSale)
      return NextResponse.json({ message: "Sale not found" }, { status: 404 });

    const sale = await Sale.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!sale)
      return NextResponse.json({ message: "Sale not found" }, { status: 404 });

    // Update product stock quantity
    const product = await Product.findById(sale.productId);
    if (product) {
      // Calculate the difference in quantity sold
      const quantityDifference = originalSale.quantitySold - sale.quantitySold;
      const newStockQuantity = Math.max(
        0,
        product.stockQuantity + quantityDifference,
      );

      await Product.findByIdAndUpdate(sale.productId, {
        stockQuantity: newStockQuantity,
        lastRestocked: new Date(),
      });
      console.log(
        `📦 Updated stock for ${product.name}: ${product.stockQuantity} → ${newStockQuantity} (difference: ${quantityDifference})`,
      );
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error("Error updating sale:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const sale = await Sale.findById(params.id);
    if (!sale)
      return NextResponse.json({ message: "Sale not found" }, { status: 404 });

    // Update product stock quantity before deleting
    const product = await Product.findById(sale.productId);
    if (product) {
      const newStockQuantity = product.stockQuantity + sale.quantitySold;
      await Product.findByIdAndUpdate(sale.productId, {
        stockQuantity: newStockQuantity,
        lastRestocked: new Date(),
      });
      console.log(
        `📦 Restored stock for ${product.name}: ${product.stockQuantity} → ${newStockQuantity}`,
      );
    }

    await Sale.findByIdAndDelete(params.id);
    return NextResponse.json({ message: "Sale deleted successfully" });
  } catch (error) {
    console.error("Error deleting sale:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
