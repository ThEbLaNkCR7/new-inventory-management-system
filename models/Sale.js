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

    saleType: {
      type: String,
      enum: ["client", "site"],
      default: "client",
    },

    projectName: {
      type: String,
      trim: true,
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Received"],
      default: "Pending",
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

// Next.js hot-reload can keep a stale compiled model without new fields
if (mongoose.models.Sale) {
  delete mongoose.models.Sale;
}

export default mongoose.model("Sale", saleSchema);
