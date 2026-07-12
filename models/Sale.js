import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    client: {
      type: String,
      required: true,
    },

    clientType: {
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

        quantitySold: {
          type: Number,
          required: true,
        },

        salePrice: {
          type: Number,
          required: true,
        },
      },
    ],

    saleDate: {
      type: Date,
      required: true,
    },

    billUrl: String,

    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
    },

    batchNumber: {
      type: String,
      trim: true,
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
export default mongoose.models.Sale || mongoose.model("Sale", saleSchema);
