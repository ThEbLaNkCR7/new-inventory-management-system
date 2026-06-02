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

  const purchase = await Purchase.create(body);

  // Update stock for each item (INCREASE stock)
  for (const item of purchase.items) {
   let product = await Product.findById(item.productId);

   // Handle custom product creation
   if (!product && item.productId === "custom") {
    product = await Product.create({
     name: item.productName,
     description: "",
     category: "Custom",
     stockQuantity: item.quantityPurchased || 0,
     unitPrice: item.purchasePrice || 0,
     supplier: purchase.supplier || "Custom Supplier",
     netWeight: 0,
     lastRestocked: new Date(),
    });

    item.productId = product._id;
   }

   if (!product) continue;

   const newStockQuantity =
    (product.stockQuantity || 0) + item.quantityPurchased;

   await Product.findByIdAndUpdate(item.productId, {
    stockQuantity: newStockQuantity,
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
