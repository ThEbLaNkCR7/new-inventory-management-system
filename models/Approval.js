import mongoose from "mongoose"

const approvalSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["product", "sale", "purchase", "client", "supplier"],
      required: true,
    },
    action: {
      type: String,
      enum: ["create", "update", "delete"],
      required: true,
    },
    entityId: {
      type: String,
      trim: true,
    },
    entityLabel: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    requestedBy: {
      type: String,
      required: true,
      trim: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedBy: String,
    reviewedAt: Date,
    reviewNotes: String,
    reason: String,
    changeSummary: String,
    changedFields: [String],
    originalData: mongoose.Schema.Types.Mixed,
    proposedData: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  },
)

approvalSchema.index({ status: 1, requestedAt: -1 })
approvalSchema.index({ reviewedAt: -1 })

export default mongoose.models.Approval || mongoose.model("Approval", approvalSchema)
