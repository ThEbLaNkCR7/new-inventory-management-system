import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
 {
  supplier: {
   type: String,
   required: true,
  },

  supplierType: {
   type: String,
   enum: ["Individual", "Company"],
   default: "Company",
  },

  items: [
   {
    productId: {
     type: mongoose.Schema.Types.ObjectId,
     ref: "Product",
     required: true,
    },

    productName: {
     type: String,
     required: true,
    },

    quantityPurchased: {
     type: Number,
     required: true,
    },

    purchasePrice: {
     type: Number,
     required: true,
    },
   },
  ],

  purchaseDate: {
   type: Date,
   required: true,
  },

  billUrl: {
   type: String,
  },

  isActive: {
   type: Boolean,
   default: true,
  },

  isVat: {
   type: Boolean,
   default: true,
  },
 },
 { timestamps: true },
);

export default mongoose.models.Purchase ||
 mongoose.model("Purchase", purchaseSchema);
